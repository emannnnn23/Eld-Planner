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
    "detroit": {"name": "Detroit, MI, USA", "lat": 42.3314, "lng": -83.0458},
    "oklahoma": {"name": "Oklahoma City, OK, USA", "lat": 35.4676, "lng": -97.5164},
    "houston": {"name": "Houston, TX, USA", "lat": 29.7604, "lng": -95.3698},
    "san antonio": {"name": "San Antonio, TX, USA", "lat": 29.4241, "lng": -98.4936},
    "austin": {"name": "Austin, TX, USA", "lat": 30.2672, "lng": -97.7431},
    "jacksonville": {"name": "Jacksonville, FL, USA", "lat": 30.3322, "lng": -81.6557},
    "san francisco": {"name": "San Francisco, CA, USA", "lat": 37.7749, "lng": -122.4194},
    "charlotte": {"name": "Charlotte, NC, USA", "lat": 35.2271, "lng": -80.8431},
    "san diego": {"name": "San Diego, CA, USA", "lat": 32.7157, "lng": -117.1611},
    "fort worth": {"name": "Fort Worth, TX, USA", "lat": 32.7555, "lng": -97.3308},
    "el paso": {"name": "El Paso, TX, USA", "lat": 31.7619, "lng": -106.4850},
    "portland": {"name": "Portland, OR, USA", "lat": 45.5152, "lng": -122.6784},
    "las vegas": {"name": "Las Vegas, NV, USA", "lat": 36.1699, "lng": -115.1398},
    "louisville": {"name": "Louisville, KY, USA", "lat": 38.2527, "lng": -85.7585},
    "milwaukee": {"name": "Milwaukee, WI, USA", "lat": 43.0389, "lng": -87.9065},
    "albuquerque": {"name": "Albuquerque, NM, USA", "lat": 35.0844, "lng": -106.6504},
    "tucson": {"name": "Tucson, AZ, USA", "lat": 32.2226, "lng": -110.9747},
    "kansas city": {"name": "Kansas City, MO, USA", "lat": 39.0997, "lng": -94.5786},
    "omaha": {"name": "Omaha, NE, USA", "lat": 41.2565, "lng": -95.9345},
    "minneapolis": {"name": "Minneapolis, MN, USA", "lat": 44.9778, "lng": -93.2650},
    "new orleans": {"name": "New Orleans, LA, USA", "lat": 29.9511, "lng": -90.0715},
    "cleveland": {"name": "Cleveland, OH, USA", "lat": 41.4993, "lng": -81.6944},
    "pittsburgh": {"name": "Pittsburgh, PA, USA", "lat": 40.4406, "lng": -79.9959},
    "cincinnati": {"name": "Cincinnati, OH, USA", "lat": 39.1031, "lng": -84.5120},
    "orlando": {"name": "Orlando, FL, USA", "lat": 28.5383, "lng": -81.3792},
    "tampa": {"name": "Tampa, FL, USA", "lat": 27.9506, "lng": -82.4572},
    "raleigh": {"name": "Raleigh, NC, USA", "lat": 35.7796, "lng": -78.6382},
    "richmond": {"name": "Richmond, VA, USA", "lat": 37.5407, "lng": -77.4360},
    "salt lake": {"name": "Salt Lake City, UT, USA", "lat": 40.7608, "lng": -111.8910},
    "sacramento": {"name": "Sacramento, CA, USA", "lat": 38.5816, "lng": -121.4944},
    "birmingham": {"name": "Birmingham, AL, USA", "lat": 33.5186, "lng": -86.8104},
    "little rock": {"name": "Little Rock, AR, USA", "lat": 34.7465, "lng": -92.2896},
    "tulsa": {"name": "Tulsa, OK, USA", "lat": 36.1540, "lng": -95.9928},
    "baton rouge": {"name": "Baton Rouge, LA, USA", "lat": 30.4515, "lng": -91.1871},
    "wichita": {"name": "Wichita, KS, USA", "lat": 37.6872, "lng": -97.3301},
    "des moines": {"name": "Des Moines, IA, USA", "lat": 41.5868, "lng": -93.6250},
    "philadelphia": {"name": "Philadelphia, PA, USA", "lat": 39.9526, "lng": -75.1652},
    "boston": {"name": "Boston, MA, USA", "lat": 42.3601, "lng": -71.0589},
    "washington": {"name": "Washington, DC, USA", "lat": 38.9072, "lng": -77.0369},
    "baltimore": {"name": "Baltimore, MD, USA", "lat": 39.2904, "lng": -76.6122},
    "fresno": {"name": "Fresno, CA, USA", "lat": 36.7378, "lng": -119.7871},
    "spokane": {"name": "Spokane, WA, USA", "lat": 47.6588, "lng": -117.4260},
    "boise": {"name": "Boise, ID, USA", "lat": 43.6150, "lng": -116.2023},
    "reno": {"name": "Reno, NV, USA", "lat": 39.5296, "lng": -119.8138},
    "knoxville": {"name": "Knoxville, TN, USA", "lat": 35.9606, "lng": -83.9207},
    "chattanooga": {"name": "Chattanooga, TN, USA", "lat": 35.0456, "lng": -85.3097},
    "jackson": {"name": "Jackson, MS, USA", "lat": 32.2988, "lng": -90.1848},
    "mobile": {"name": "Mobile, AL, USA", "lat": 30.6954, "lng": -88.0399},
    "laredo": {"name": "Laredo, TX, USA", "lat": 27.5036, "lng": -99.5076},
    "lubbock": {"name": "Lubbock, TX, USA", "lat": 33.5779, "lng": -101.8552},
    "amarillo": {"name": "Amarillo, TX, USA", "lat": 35.2220, "lng": -101.8313},
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
