import math
import requests

# User agent for Nominatim compliance
HEADERS = {"User-Agent": "ELDTripPlanner/1.0 (contact: dispatcher@eldplanner.local)"}

# Pre-populated fallback coordinates for common US transportation hubs & cities
KNOWN_LOCATIONS = {
    "chicago": {"name": "Chicago, IL, USA", "lat": 41.8781, "lng": -87.6298},
    "indianapolis": {"name": "Indianapolis, IN, USA", "lat": 39.7684, "lng": -86.1581},
    "dallas": {"name": "Dallas, TX, USA", "lat": 32.7767, "lng": -96.7970},
    "atlanta": {"name": "Atlanta, GA, USA", "lat": 33.7490, "lng": -84.3880},
    "new york": {"name": "New York, NY, USA", "lat": 40.7128, "lng": -74.0060},
    "los angeles": {"name": "Los Angeles, CA, USA", "lat": 34.0522, "lng": -118.2437},
    "denver": {"name": "Denver, CO, USA", "lat": 39.7392, "lng": -104.9903},
    "seattle": {"name": "Seattle, WA, USA", "lat": 47.6062, "lng": -122.3321},
    "miami": {"name": "Miami, FL, USA", "lat": 25.7617, "lng": -80.1918},
    "phoenix": {"name": "Phoenix, AZ, USA", "lat": 33.4484, "lng": -112.0740},
    "st. louis": {"name": "St. Louis, MO, USA", "lat": 38.6270, "lng": -90.1994},
    "memphis": {"name": "Memphis, TN, USA", "lat": 35.1495, "lng": -90.0490},
    "nashville": {"name": "Nashville, TN, USA", "lat": 36.1627, "lng": -86.7816},
    "columbus": {"name": "Columbus, OH, USA", "lat": 39.9612, "lng": -82.9988},
    "detroit": {"name": "Detroit, MI, USA", "lat": 42.3314, "lng": -83.0458}
}

def geocode_address(location_str):
    """Geocode an address string using Nominatim with fallback to known cities."""
    if not location_str or not location_str.strip():
        return {"name": "Unknown", "lat": 41.8781, "lng": -87.6298}
    
    clean_query = location_str.strip().lower()

    # Try matching known cities first for instant response
    for key, data in KNOWN_LOCATIONS.items():
        if key in clean_query:
            return {"name": location_str.strip(), "lat": data["lat"], "lng": data["lng"]}

    # Query Nominatim API
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": location_str.strip(), "format": "json", "limit": 1}
    
    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=4)
        if resp.status_code == 200:
            results = resp.json()
            if results and len(results) > 0:
                item = results[0]
                return {
                    "name": item.get("display_name", location_str.strip()),
                    "lat": float(item["lat"]),
                    "lng": float(item["lon"])
                }
    except Exception as err:
        print(f"[Geocode Warning] Nominatim request failed: {err}")

    # Fallback default: Chicago center if completely unknown
    return {"name": location_str.strip(), "lat": 41.8781, "lng": -87.6298}


def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    """Compute direct distance in miles between two coordinates."""
    R = 3958.8 # Earth radius in miles
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    direct_miles = R * c
    # Driving distance factor approximation (1.2x straight line)
    return direct_miles * 1.25


def get_osrm_route(start_loc, end_loc):
    """
    Get route distance (miles), duration (hours), and geometry (coordinates [[lat, lng]]) from OSRM.
    """
    slat, slng = start_loc["lat"], start_loc["lng"]
    elat, elng = end_loc["lat"], end_loc["lng"]

    # Same location check
    if abs(slat - elat) < 0.0001 and abs(slng - elng) < 0.0001:
        return {
            "distance_miles": 1.0,
            "duration_hrs": 0.05,
            "coordinates": [[slat, slng], [elat, elng]]
        }

    osrm_url = f"http://router.project-osrm.org/route/v1/driving/{slng},{slat};{elng},{elat}?overview=full&geometries=geojson"

    try:
        resp = requests.get(osrm_url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok" and len(data.get("routes", [])) > 0:
                route = data["routes"][0]
                dist_meters = route["distance"]
                dur_seconds = route["duration"]
                raw_coords = route["geometry"]["coordinates"] # [[lon, lat], ...]
                
                # Leaflet requires [[lat, lon], ...]
                leaflet_coords = [[pt[1], pt[0]] for pt in raw_coords]

                dist_miles = dist_meters * 0.000621371
                # Adjust OSRM base speed for heavy commercial truck average (~55 mph on highways + traffic factor)
                dur_hrs = (dist_miles / 55.0) if dist_miles > 0 else (dur_seconds / 3600.0)

                return {
                    "distance_miles": round(dist_miles, 2),
                    "duration_hrs": round(dur_hrs, 2),
                    "coordinates": leaflet_coords
                }
    except Exception as err:
        print(f"[OSRM Warning] OSRM routing request failed: {err}")

    # Fallback: Compute haversine estimated driving distance & straight line polyline
    est_miles = calculate_haversine_distance(slat, slng, elat, elng)
    est_dur_hrs = est_miles / 55.0

    return {
        "distance_miles": round(est_miles, 2),
        "duration_hrs": round(est_dur_hrs, 2),
        "coordinates": [[slat, slng], [elat, elng]]
    }
