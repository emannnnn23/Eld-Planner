import datetime
import math
from datetime import timedelta, datetime as dt

STATUS_OFF_DUTY = "off_duty"
STATUS_SLEEPER = "sleeper"
STATUS_DRIVING = "driving"
STATUS_ON_DUTY = "on_duty_not_driving"


def interpolate_along_coords(coords, fraction):
    """
    Get approximate [lat, lng] at a given fraction (0.0 to 1.0) along a polyline.
    Uses cumulative segment distances for accuracy.
    """
    if not coords or len(coords) < 2:
        return None, None
    if fraction <= 0:
        return coords[0][0], coords[0][1]
    if fraction >= 1.0:
        return coords[-1][0], coords[-1][1]

    # Calculate cumulative distances along the polyline
    distances = [0.0]
    for i in range(1, len(coords)):
        dlat = coords[i][0] - coords[i - 1][0]
        dlng = coords[i][1] - coords[i - 1][1]
        dist = math.sqrt(dlat * dlat + dlng * dlng)
        distances.append(distances[-1] + dist)

    total_dist = distances[-1]
    if total_dist < 1e-9:
        return coords[0][0], coords[0][1]

    target_dist = fraction * total_dist

    # Find the segment containing target_dist
    for i in range(1, len(distances)):
        if distances[i] >= target_dist:
            seg_start_dist = distances[i - 1]
            seg_len = distances[i] - seg_start_dist
            if seg_len < 1e-9:
                return coords[i][0], coords[i][1]
            seg_frac = (target_dist - seg_start_dist) / seg_len
            lat = coords[i - 1][0] + seg_frac * (coords[i][0] - coords[i - 1][0])
            lng = coords[i - 1][1] + seg_frac * (coords[i][1] - coords[i - 1][1])
            return round(lat, 6), round(lng, 6)

    return coords[-1][0], coords[-1][1]


def simulate_hos_trip(
    current_location,
    pickup_location,
    dropoff_location,
    leg1_distance_miles,
    leg1_duration_hrs,
    leg2_distance_miles,
    leg2_duration_hrs,
    cycle_hours_used_start=0.0,
    trip_start_dt=None,
    leg1_coords=None,
    leg2_coords=None
):
    """
    Simulate FMCSA property-carrying driver rules for a 70-hour/8-day cycle.
    
    Inputs:
    - leg1: Current -> Pickup
    - leg2: Pickup -> Dropoff
    - cycle_hours_used_start: Existing cycle hours (0 to 70.0)
    - trip_start_dt: Starting datetime (defaults to now)
    
    Returns:
    - dict with events, stops, daily_logs, assumptions, summary
    """
    if trip_start_dt is None:
        trip_start_dt = dt.now(datetime.timezone.utc).replace(microsecond=0)
    
    # State tracking
    current_dt = trip_start_dt
    cycle_hours = float(cycle_hours_used_start)
    drive_time_shift = 0.0
    duty_window_shift = 0.0
    drive_time_since_break = 0.0
    miles_since_fuel = 0.0

    events = []
    stops = []

    # Initial stop: Current location departure
    stops.append({
        "type": "start",
        "location": current_location.get("name", "Current Location"),
        "arrive": current_dt.isoformat(),
        "depart": current_dt.isoformat(),
        "lat": current_location.get("lat"),
        "lng": current_location.get("lng"),
        "description": "Trip departure point"
    })

    # Speed estimation
    speed1 = (leg1_distance_miles / leg1_duration_hrs) if leg1_duration_hrs > 0 else 55.0
    speed2 = (leg2_distance_miles / leg2_duration_hrs) if leg2_duration_hrs > 0 else 55.0

    def record_event(status, duration_hrs, name, loc_name, lat=None, lng=None):
        nonlocal current_dt
        start_dt = current_dt
        end_dt = start_dt + timedelta(hours=duration_hrs)
        current_dt = end_dt
        events.append({
            "status": status,
            "start_dt": start_dt,
            "end_dt": end_dt,
            "duration_hrs": round(duration_hrs, 4),
            "name": name,
            "location": loc_name,
            "lat": lat,
            "lng": lng
        })
        return start_dt, end_dt

    def get_stop_coords(leg_duration, remaining_hrs, coords, start_loc, end_loc):
        """Calculate interpolated lat/lng along the route based on progress."""
        if coords and len(coords) >= 2 and leg_duration > 0:
            driven = leg_duration - remaining_hrs
            fraction = max(0.0, min(1.0, driven / leg_duration))
            lat, lng = interpolate_along_coords(coords, fraction)
            if lat is not None:
                return lat, lng
        # Fallback: average of start and end
        return start_loc.get("lat"), start_loc.get("lng")

    # Process drive leg helper
    def drive_leg(leg_distance, leg_duration, speed, leg_name, start_loc, end_loc, coords=None):
        nonlocal drive_time_shift, duty_window_shift, drive_time_since_break, cycle_hours, miles_since_fuel
        
        remaining_hrs = float(leg_duration)
        remaining_miles = float(leg_distance)
        total_leg_hrs = float(leg_duration)
        
        while remaining_hrs > 0.0001:
            # Get interpolated position for any stops at this point
            stop_lat, stop_lng = get_stop_coords(total_leg_hrs, remaining_hrs, coords, start_loc, end_loc)

            # Check mandatory rest / resets before driving
            
            # 1. 70-Hour Cycle Cap -> 34-Hour Restart
            if cycle_hours >= 70.0:
                s_dt, e_dt = record_event(
                    STATUS_OFF_DUTY, 34.0, "34-Hour Cycle Restart",
                    f"Rest Area en route to {end_loc['name']}",
                    lat=stop_lat, lng=stop_lng
                )
                stops.append({
                    "type": "restart_34hr",
                    "location": f"34-Hr Restart (near {end_loc['name']})",
                    "arrive": s_dt.isoformat(),
                    "depart": e_dt.isoformat(),
                    "lat": stop_lat,
                    "lng": stop_lng,
                    "description": "Required 34-hour off-duty cycle restart (hit 70hr limit)"
                })
                cycle_hours = 0.0
                drive_time_shift = 0.0
                duty_window_shift = 0.0
                drive_time_since_break = 0.0
                continue

            # 2. 11-Hour Drive Limit or 14-Hour Duty Window -> 10-Hour Shift Reset (Sleeper Berth)
            if drive_time_shift >= 11.0 or duty_window_shift >= 14.0:
                s_dt, e_dt = record_event(
                    STATUS_SLEEPER, 10.0, "10-Hour Sleeper Berth Reset",
                    f"Truck Stop / Rest Area en route to {end_loc['name']}",
                    lat=stop_lat, lng=stop_lng
                )
                stops.append({
                    "type": "reset_10hr",
                    "location": f"10-Hr Sleeper Berth Reset (en route to {end_loc['name']})",
                    "arrive": s_dt.isoformat(),
                    "depart": e_dt.isoformat(),
                    "lat": stop_lat,
                    "lng": stop_lng,
                    "description": "Required 10-hour sleeper berth reset (11h drive / 14h window limit)"
                })
                drive_time_shift = 0.0
                duty_window_shift = 0.0
                drive_time_since_break = 0.0
                continue

            # 3. 8-Hour Drive Limit without break -> 30-Minute Rest Break
            if drive_time_since_break >= 8.0:
                s_dt, e_dt = record_event(
                    STATUS_OFF_DUTY, 0.5, "30-Minute Rest Break",
                    f"Rest Stop en route to {end_loc['name']}",
                    lat=stop_lat, lng=stop_lng
                )
                stops.append({
                    "type": "break_30min",
                    "location": f"30-Min Break (en route to {end_loc['name']})",
                    "arrive": s_dt.isoformat(),
                    "depart": e_dt.isoformat(),
                    "lat": stop_lat,
                    "lng": stop_lng,
                    "description": "Required 30-minute break after 8 hours driving"
                })
                duty_window_shift += 0.5
                drive_time_since_break = 0.0
                continue

            # 4. 1,000-Mile Fuel Trigger -> 30-Minute Fuel Stop (On-Duty)
            if miles_since_fuel >= 1000.0:
                # Check cycle & duty window for 0.5h fuel stop
                if cycle_hours + 0.5 > 70.0:
                    cycle_hours = 70.0 # Force trigger 34h restart above
                    continue
                if duty_window_shift + 0.5 > 14.0:
                    duty_window_shift = 14.0 # Force trigger 10h reset above
                    continue

                s_dt, e_dt = record_event(
                    STATUS_ON_DUTY, 0.5, "Fuel Stop",
                    f"Fuel Plaza en route to {end_loc['name']}",
                    lat=stop_lat, lng=stop_lng
                )
                stops.append({
                    "type": "fuel",
                    "location": f"Fuel Plaza (1,000-mi interval)",
                    "arrive": s_dt.isoformat(),
                    "depart": e_dt.isoformat(),
                    "lat": stop_lat,
                    "lng": stop_lng,
                    "description": "30-minute on-duty fueling stop"
                })
                duty_window_shift += 0.5
                cycle_hours += 0.5
                miles_since_fuel = 0.0
                drive_time_since_break = 0.0 # >= 30 min break resets 8h clock
                continue

            # Compute maximum drive chunk possible
            max_drive_cycle = max(0.0, 70.0 - cycle_hours)
            max_drive_shift = max(0.0, 11.0 - drive_time_shift)
            max_drive_window = max(0.0, 14.0 - duty_window_shift)
            max_drive_break = max(0.0, 8.0 - drive_time_since_break)
            max_drive_fuel = max(0.0, (1000.0 - miles_since_fuel) / speed) if speed > 0 else remaining_hrs

            chunk_hrs = min(remaining_hrs, max_drive_cycle, max_drive_shift, max_drive_window, max_drive_break, max_drive_fuel)

            if chunk_hrs < 0.0001:
                # If chunk is 0 due to exact threshold, loop will catch trigger at top
                # Safeguard against infinite loop if small precision edge
                if max_drive_cycle <= 0.0001:
                    cycle_hours = 70.0
                elif max_drive_shift <= 0.0001 or max_drive_window <= 0.0001:
                    drive_time_shift = 11.0
                elif max_drive_break <= 0.0001:
                    drive_time_since_break = 8.0
                elif max_drive_fuel <= 0.0001:
                    miles_since_fuel = 1000.0
                continue

            # Drive chunk_hrs
            s_dt, e_dt = record_event(
                STATUS_DRIVING, chunk_hrs, leg_name,
                f"En route from {start_loc['name']} to {end_loc['name']}"
            )
            drive_time_shift += chunk_hrs
            duty_window_shift += chunk_hrs
            drive_time_since_break += chunk_hrs
            cycle_hours += chunk_hrs
            
            chunk_miles = chunk_hrs * speed
            miles_since_fuel += chunk_miles
            remaining_hrs -= chunk_hrs
            remaining_miles -= chunk_miles

    # --- Step 1: Drive Leg 1 (Current -> Pickup) ---
    drive_leg(
        leg1_distance_miles, leg1_duration_hrs, speed1,
        "Driving (Current to Pickup)", current_location, pickup_location, leg1_coords
    )

    # --- Step 2: Pickup Stop (1.0 hr On-Duty) ---
    # Check if 14h window or 70h cycle exceeded before/during 1h pickup
    if cycle_hours + 1.0 > 70.0:
        s_dt, e_dt = record_event(
            STATUS_OFF_DUTY, 34.0, "34-Hour Cycle Restart",
            f"Rest Area near {pickup_location['name']}",
            lat=pickup_location.get("lat"), lng=pickup_location.get("lng")
        )
        stops.append({
            "type": "restart_34hr",
            "location": f"34-Hr Restart (Pickup Facility)",
            "arrive": s_dt.isoformat(),
            "depart": e_dt.isoformat(),
            "lat": pickup_location.get("lat"),
            "lng": pickup_location.get("lng"),
            "description": "34-hour off-duty cycle restart before pickup"
        })
        cycle_hours = 0.0
        drive_time_shift = 0.0
        duty_window_shift = 0.0
        drive_time_since_break = 0.0
    elif duty_window_shift + 1.0 > 14.0:
        s_dt, e_dt = record_event(
            STATUS_SLEEPER, 10.0, "10-Hour Sleeper Berth Reset",
            f"Staging area at {pickup_location['name']}",
            lat=pickup_location.get("lat"), lng=pickup_location.get("lng")
        )
        stops.append({
            "type": "reset_10hr",
            "location": f"10-Hr Sleeper Berth Reset (Pickup Facility)",
            "arrive": s_dt.isoformat(),
            "depart": e_dt.isoformat(),
            "lat": pickup_location.get("lat"),
            "lng": pickup_location.get("lng"),
            "description": "10-hour sleeper berth reset before pickup"
        })
        drive_time_shift = 0.0
        duty_window_shift = 0.0
        drive_time_since_break = 0.0

    p_start_dt, p_end_dt = record_event(
        STATUS_ON_DUTY, 1.0, "Loading Cargo / Pickup",
        pickup_location.get("name", "Pickup Location"),
        lat=pickup_location.get("lat"), lng=pickup_location.get("lng")
    )
    stops.append({
        "type": "pickup",
        "location": pickup_location.get("name", "Pickup Location"),
        "arrive": p_start_dt.isoformat(),
        "depart": p_end_dt.isoformat(),
        "lat": pickup_location.get("lat"),
        "lng": pickup_location.get("lng"),
        "description": "Pickup cargo (1 hour on-duty loading)"
    })
    duty_window_shift += 1.0
    cycle_hours += 1.0
    drive_time_since_break = 0.0 # 1h on-duty non-driving resets 8h driving break clock

    # --- Step 3: Drive Leg 2 (Pickup -> Dropoff) ---
    drive_leg(
        leg2_distance_miles, leg2_duration_hrs, speed2,
        "Driving (Pickup to Dropoff)", pickup_location, dropoff_location, leg2_coords
    )

    # --- Step 4: Dropoff Stop (1.0 hr On-Duty) ---
    if cycle_hours + 1.0 > 70.0:
        s_dt, e_dt = record_event(
            STATUS_OFF_DUTY, 34.0, "34-Hour Cycle Restart",
            f"Rest Area near {dropoff_location['name']}",
            lat=dropoff_location.get("lat"), lng=dropoff_location.get("lng")
        )
        stops.append({
            "type": "restart_34hr",
            "location": f"34-Hr Restart (Dropoff Facility)",
            "arrive": s_dt.isoformat(),
            "depart": e_dt.isoformat(),
            "lat": dropoff_location.get("lat"),
            "lng": dropoff_location.get("lng"),
            "description": "34-hour off-duty cycle restart before dropoff"
        })
        cycle_hours = 0.0
        drive_time_shift = 0.0
        duty_window_shift = 0.0
        drive_time_since_break = 0.0
    elif duty_window_shift + 1.0 > 14.0:
        s_dt, e_dt = record_event(
            STATUS_SLEEPER, 10.0, "10-Hour Sleeper Berth Reset",
            f"Staging area at {dropoff_location['name']}",
            lat=dropoff_location.get("lat"), lng=dropoff_location.get("lng")
        )
        stops.append({
            "type": "reset_10hr",
            "location": f"10-Hr Sleeper Berth Reset (Dropoff Facility)",
            "arrive": s_dt.isoformat(),
            "depart": e_dt.isoformat(),
            "lat": dropoff_location.get("lat"),
            "lng": dropoff_location.get("lng"),
            "description": "10-hour sleeper berth reset before dropoff"
        })
        drive_time_shift = 0.0
        duty_window_shift = 0.0
        drive_time_since_break = 0.0

    d_start_dt, d_end_dt = record_event(
        STATUS_ON_DUTY, 1.0, "Unloading Cargo / Dropoff",
        dropoff_location.get("name", "Dropoff Location"),
        lat=dropoff_location.get("lat"), lng=dropoff_location.get("lng")
    )
    stops.append({
        "type": "dropoff",
        "location": dropoff_location.get("name", "Dropoff Location"),
        "arrive": d_start_dt.isoformat(),
        "depart": d_end_dt.isoformat(),
        "lat": dropoff_location.get("lat"),
        "lng": dropoff_location.get("lng"),
        "description": "Dropoff cargo (1 hour on-duty unloading)"
    })
    duty_window_shift += 1.0
    cycle_hours += 1.0

    # Slice raw events into calendar daily logs
    daily_logs = slice_events_by_day(events, cycle_hours_used_start)

    # Compute trip summary statistics
    total_distance = leg1_distance_miles + leg2_distance_miles
    total_duration_hrs = (current_dt - trip_start_dt).total_seconds() / 3600.0
    driving_hrs = sum(e["duration_hrs"] for e in events if e["status"] == STATUS_DRIVING)
    on_duty_hrs = sum(e["duration_hrs"] for e in events if e["status"] == STATUS_ON_DUTY)
    off_duty_hrs = sum(e["duration_hrs"] for e in events if e["status"] in (STATUS_OFF_DUTY, STATUS_SLEEPER))

    summary = {
        "total_distance_miles": round(total_distance, 1),
        "total_duration_hrs": round(total_duration_hrs, 2),
        "driving_hrs": round(driving_hrs, 2),
        "on_duty_not_driving_hrs": round(on_duty_hrs, 2),
        "off_duty_hrs": round(off_duty_hrs, 2),
        "total_stops": len(stops),
        "fuel_stops": sum(1 for s in stops if s["type"] == "fuel"),
        "reset_stops": sum(1 for s in stops if s["type"] in ("reset_10hr", "restart_34hr")),
        "days_count": len(daily_logs),
        "cycle_hours_end": round(cycle_hours, 2)
    }

    return {
        "events": events,
        "stops": stops,
        "daily_logs": daily_logs,
        "summary": summary,
        "assumptions": {
            "property_carrying": True,
            "cycle_rule": "70 hrs / 8 days",
            "max_driving_shift": "11 hrs",
            "max_duty_window": "14 hrs",
            "rest_break_required": "30 min after 8 cumulative driving hrs",
            "shift_reset_required": "10 consecutive hrs sleeper berth",
            "cycle_restart": "34 consecutive hrs off-duty",
            "fuel_stop_interval": "Every 1,000 miles (30 min on-duty)",
            "pickup_dropoff_duty": "1.0 hr on-duty each"
        }
    }


def slice_events_by_day(events, cycle_hours_start=0.0):
    """
    Split continuous trip events into calendar day log sheets (00:00 to 24:00).
    Returns list of dicts: each item represents 1 day's log grid data & status totals.
    """
    if not events:
        return []

    first_dt = events[0]["start_dt"]
    last_dt = events[-1]["end_dt"]

    # Generate date range from first event date to last event date
    curr_date = first_dt.date()
    end_date = last_dt.date()
    
    daily_logs = []
    running_cycle_hours = float(cycle_hours_start)

    while curr_date <= end_date:
        day_start_dt = dt.combine(curr_date, datetime.time.min, tzinfo=first_dt.tzinfo)
        day_end_dt = dt.combine(curr_date, datetime.time.max, tzinfo=first_dt.tzinfo)

        segments = []

        for e in events:
            # Overlap check
            if e["end_dt"] <= day_start_dt or e["start_dt"] >= day_end_dt:
                continue

            seg_start = max(e["start_dt"], day_start_dt)
            seg_end = min(e["end_dt"], day_end_dt)
            dur_hrs = (seg_end - seg_start).total_seconds() / 3600.0

            # Convert to start/end HH:MM or decimal hours in day (0.0 to 24.0)
            start_decimal = (seg_start - day_start_dt).total_seconds() / 3600.0
            end_decimal = (seg_end - day_start_dt).total_seconds() / 3600.0

            segments.append({
                "status": e["status"],
                "name": e["name"],
                "location": e["location"],
                "start_time": seg_start.strftime("%H:%M"),
                "end_time": seg_end.strftime("%H:%M"),
                "start_decimal": round(start_decimal, 3),
                "end_decimal": round(end_decimal, 3),
                "duration_hrs": round(dur_hrs, 3)
            })

        # Fill any gaps on this date with OFF_DUTY
        filled_segments = []
        current_marker = 0.0

        # Sort by start_decimal
        segments.sort(key=lambda s: s["start_decimal"])

        for seg in segments:
            if seg["start_decimal"] > current_marker + 0.001:
                # Add gap off duty
                gap_hrs = seg["start_decimal"] - current_marker
                start_time_str = str(timedelta(hours=current_marker))[:5]
                end_time_str = str(timedelta(hours=seg["start_decimal"]))[:5]
                filled_segments.append({
                    "status": STATUS_OFF_DUTY,
                    "name": "Off Duty",
                    "location": "Off Duty",
                    "start_time": start_time_str,
                    "end_time": end_time_str,
                    "start_decimal": round(current_marker, 3),
                    "end_decimal": round(seg["start_decimal"], 3),
                    "duration_hrs": round(gap_hrs, 3)
                })
            filled_segments.append(seg)
            current_marker = max(current_marker, seg["end_decimal"])

        if current_marker < 24.0 - 0.001:
            gap_hrs = 24.0 - current_marker
            start_time_str = str(timedelta(hours=current_marker))[:5]
            filled_segments.append({
                "status": STATUS_OFF_DUTY,
                "name": "Off Duty",
                "location": "Off Duty",
                "start_time": start_time_str,
                "end_time": "24:00",
                "start_decimal": round(current_marker, 3),
                "end_decimal": 24.0,
                "duration_hrs": round(gap_hrs, 3)
            })

        # Compute totals for 4 FMCSA grid rows
        totals = {
            STATUS_OFF_DUTY: 0.0,
            STATUS_SLEEPER: 0.0,
            STATUS_DRIVING: 0.0,
            STATUS_ON_DUTY: 0.0
        }

        for seg in filled_segments:
            st = seg["status"]
            if st in totals:
                totals[st] += seg["duration_hrs"]

        # Round totals to 2 decimals
        totals = {k: round(v, 2) for k, v in totals.items()}

        # Update running cycle hours at end of day
        # In FMCSA, 34-hr restart resets cycle accumulator
        # Check if 34-hr restart happened on this day
        has_restart = any(s["name"] == "34-Hour Cycle Restart" for s in filled_segments)
        if has_restart:
            running_cycle_hours = totals[STATUS_DRIVING] + totals[STATUS_ON_DUTY]
        else:
            running_cycle_hours += totals[STATUS_DRIVING] + totals[STATUS_ON_DUTY]

        daily_logs.append({
            "date": curr_date.strftime("%Y-%m-%d"),
            "day_number": len(daily_logs) + 1,
            "segments": filled_segments,
            "totals": totals,
            "cycle_hours_end_of_day": round(running_cycle_hours, 2)
        })

        curr_date += timedelta(days=1)

    return daily_logs
