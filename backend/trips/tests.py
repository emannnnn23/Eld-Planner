import unittest
from datetime import datetime, timezone
from trips.hos_engine import (
    simulate_hos_trip, STATUS_OFF_DUTY, STATUS_DRIVING, STATUS_ON_DUTY
)

class HOSEngineTests(unittest.TestCase):
    def setUp(self):
        self.loc_chicago = {"name": "Chicago, IL", "lat": 41.8781, "lng": -87.6298}
        self.loc_indy = {"name": "Indianapolis, IN", "lat": 39.7684, "lng": -86.1581}
        self.loc_dallas = {"name": "Dallas, TX", "lat": 32.7767, "lng": -96.7970}
        self.loc_la = {"name": "Los Angeles, CA", "lat": 34.0522, "lng": -118.2437}

    def test_short_local_trip(self):
        """Short trip under 8h driving without rest break requirement."""
        result = simulate_hos_trip(
            current_location=self.loc_chicago,
            pickup_location=self.loc_chicago,
            dropoff_location=self.loc_indy,
            leg1_distance_miles=10.0,
            leg1_duration_hrs=0.25,
            leg2_distance_miles=180.0,
            leg2_duration_hrs=3.0,
            cycle_hours_used_start=10.0
        )
        summary = result["summary"]
        self.assertEqual(summary["fuel_stops"], 0)
        self.assertEqual(summary["reset_stops"], 0)
        self.assertAlmostEqual(summary["driving_hrs"], 3.25, places=2)
        # Check daily log totals sum to 24.0
        for day in result["daily_logs"]:
            total_day = sum(day["totals"].values())
            self.assertAlmostEqual(total_day, 24.0, places=2)

    def test_medium_trip_with_reset_and_break(self):
        """Medium trip (~900 miles) needing 30-min break and 10-hr reset."""
        result = simulate_hos_trip(
            current_location=self.loc_chicago,
            pickup_location=self.loc_chicago,
            dropoff_location=self.loc_dallas,
            leg1_distance_miles=20.0,
            leg1_duration_hrs=0.5,
            leg2_distance_miles=920.0,
            leg2_duration_hrs=15.0,
            cycle_hours_used_start=20.0
        )
        summary = result["summary"]
        self.assertGreaterEqual(summary["reset_stops"], 1)
        self.assertGreater(summary["days_count"], 1)
        # All daily log sheets sum to 24.0
        for day in result["daily_logs"]:
            total_day = sum(day["totals"].values())
            self.assertAlmostEqual(total_day, 24.0, places=2)

    def test_long_haul_with_fuel_and_restart(self):
        """Cross-country trip (~2000 miles) with high starting cycle hours triggering 34h restart & fuel."""
        result = simulate_hos_trip(
            current_location=self.loc_chicago,
            pickup_location=self.loc_chicago,
            dropoff_location=self.loc_la,
            leg1_distance_miles=30.0,
            leg1_duration_hrs=0.6,
            leg2_distance_miles=2015.0,
            leg2_duration_hrs=32.0,
            cycle_hours_used_start=62.0  # Close to 70h cap
        )
        summary = result["summary"]
        self.assertGreaterEqual(summary["fuel_stops"], 2)  # 2015 miles = 2 fuel stops
        self.assertGreaterEqual(summary["reset_stops"], 1)
        for day in result["daily_logs"]:
            total_day = sum(day["totals"].values())
            self.assertAlmostEqual(total_day, 24.0, places=2)

if __name__ == '__main__':
    unittest.main()
