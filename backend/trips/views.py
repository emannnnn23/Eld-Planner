import json
from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from trips.routing import geocode_address, get_osrm_route
from trips.hos_engine import simulate_hos_trip

@csrf_exempt
@api_view(['POST'])
def plan_trip_view(request):
    """
    POST /api/plan-trip/
    Processes dispatcher inputs, geocodes locations, routes via OSRM,
    runs FMCSA HOS engine simulation, and returns complete trip & log sheets payload.
    """
    data = request.data if hasattr(request, 'data') else json.loads(request.body)
    
    current_str = data.get('current_location', 'Chicago, IL')
    pickup_str = data.get('pickup_location', 'Indianapolis, IN')
    dropoff_str = data.get('dropoff_location', 'Dallas, TX')
    
    try:
        cycle_hours_used = float(data.get('cycle_hours_used', 0.0))
    except (ValueError, TypeError):
        cycle_hours_used = 0.0

    start_time_str = data.get('start_time')
    trip_start_dt = None
    if start_time_str:
        try:
            trip_start_dt = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
        except Exception:
            trip_start_dt = None

    # Step 1: Geocode Locations
    curr_loc = geocode_address(current_str)
    pick_loc = geocode_address(pickup_str)
    drop_loc = geocode_address(dropoff_str)

    # Step 2: Fetch OSRM Routes for Leg 1 (Current -> Pickup) & Leg 2 (Pickup -> Dropoff)
    leg1 = get_osrm_route(curr_loc, pick_loc)
    leg2 = get_osrm_route(pick_loc, drop_loc)

    # Step 3: Run Event-Driven FMCSA HOS Simulation
    hos_result = simulate_hos_trip(
        current_location=curr_loc,
        pickup_location=pick_loc,
        dropoff_location=drop_loc,
        leg1_distance_miles=leg1["distance_miles"],
        leg1_duration_hrs=leg1["duration_hrs"],
        leg2_distance_miles=leg2["distance_miles"],
        leg2_duration_hrs=leg2["duration_hrs"],
        cycle_hours_used_start=cycle_hours_used,
        trip_start_dt=trip_start_dt,
        leg1_coords=leg1["coordinates"],
        leg2_coords=leg2["coordinates"]
    )

    # Combine polyline geometries for map display
    combined_route_geometry = leg1["coordinates"] + leg2["coordinates"]

    payload = {
        "status": "success",
        "inputs": {
            "current_location": current_str,
            "pickup_location": pickup_str,
            "dropoff_location": dropoff_str,
            "cycle_hours_used": cycle_hours_used
        },
        "geocoded": {
            "current": curr_loc,
            "pickup": pick_loc,
            "dropoff": drop_loc
        },
        "route": {
            "geometry": combined_route_geometry,
            "leg1": leg1,
            "leg2": leg2,
            "total_distance_miles": round(leg1["distance_miles"] + leg2["distance_miles"], 2),
            "total_drive_duration_hrs": round(leg1["duration_hrs"] + leg2["duration_hrs"], 2)
        },
        "stops": hos_result["stops"],
        "daily_logs": hos_result["daily_logs"],
        "summary": hos_result["summary"],
        "assumptions": hos_result["assumptions"]
    }

    return Response(payload, status=status.HTTP_200_OK)


@api_view(['GET'])
def health_check_view(request):
    """GET /api/health/"""
    return Response({"status": "ok", "service": "ELD Trip Planner API", "timestamp": datetime.utcnow().isoformat()})
