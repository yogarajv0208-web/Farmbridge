"""
Unit tests for FarmBridge prototype.
Uses standard library unittest.
Covers:
- Transport formula precision
- Tamil & English voice/sentence parser
- Database seed and query integrity
- Crop-specific buyer filtering (Paddy mills, Sugarcane mills, Veg mandis)
- REST API endpoints and input validation
"""

import unittest
import os
import sys
import tempfile
import json
import sqlite3
import threading
import time
import urllib.request
import urllib.error

# Ensure project root is in sys.path
PROJECT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

from db import init_db, get_connection, get_meta
from parser import parse_voice_sentence, extract_quantity_kg, extract_crop, extract_location
from calculator import calculate_transport_cost, format_price, format_currency, get_offers_for_farmer
import server

class TestTransportCalculator(unittest.TestCase):
    """Tests for the transport cost formula and pricing formatters."""

    def test_transport_formula_exact_example_30km_2000kg(self):
        """
        User prompt example: '₹47,000 − ₹1,220 transport (30 km)'
        Formula: 200 + km * (10 + qty_kg * 0.012)
        For 2000 kg at 30 km:
        200 + 30 * (10 + 2000 * 0.012) = 200 + 30 * (10 + 24) = 200 + 30 * 34 = 200 + 1020 = 1220.0
        """
        cost = calculate_transport_cost(distance_km=30.0, quantity_kg=2000.0)
        self.assertEqual(cost, 1220.0)

    def test_transport_formula_sugarcane_10ton(self):
        """
        10 ton = 10,000 kg, distance = 18 km:
        200 + 18 * (10 + 10000 * 0.012) = 200 + 18 * (10 + 120) = 200 + 18 * 130 = 200 + 2340 = 2540.0
        """
        cost = calculate_transport_cost(distance_km=18.0, quantity_kg=10000.0)
        self.assertEqual(cost, 2540.0)

    def test_transport_zero_values(self):
        cost = calculate_transport_cost(distance_km=0.0, quantity_kg=0.0)
        self.assertEqual(cost, 200.0)

    def test_price_formatting_under_ten(self):
        """Prices under ₹10 must show decimals as specified."""
        self.assertEqual(format_price(3.85), "₹3.85")
        self.assertEqual(format_price(3.9), "₹3.90")
        self.assertEqual(format_price(3.5), "₹3.50")

    def test_price_formatting_over_ten(self):
        self.assertEqual(format_price(23.7), "₹23.70")
        self.assertEqual(format_price(25.0), "₹25")


class TestVoiceParser(unittest.TestCase):
    """Tests for natural language comprehension in Tamil and English."""

    def test_tamil_paddy_phrase(self):
        text = "நெல் இரண்டாயிரம் கிலோ திருப்போரூர்"
        res = parse_voice_sentence(text)
        self.assertTrue(res["success"])
        self.assertEqual(res["crop"], "paddy")
        self.assertEqual(res["quantity_kg"], 2000.0)
        self.assertEqual(res["location"], "tirupporur")

    def test_english_sugarcane_phrase(self):
        text = "ten ton sugarcane Chengalpattu"
        res = parse_voice_sentence(text)
        self.assertTrue(res["success"])
        self.assertEqual(res["crop"], "sugarcane")
        self.assertEqual(res["quantity_kg"], 10000.0)
        self.assertEqual(res["location"], "chengalpattu")

    def test_tamil_sugarcane_phrase(self):
        text = "கரும்பு பத்து டன் செங்கல்பட்டு"
        res = parse_voice_sentence(text)
        self.assertTrue(res["success"])
        self.assertEqual(res["crop"], "sugarcane")
        self.assertEqual(res["quantity_kg"], 10000.0)
        self.assertEqual(res["location"], "chengalpattu")

    def test_tamil_ton_and_crop_order(self):
        text = "இரண்டு டன் நெல் காஞ்சிபுரம்"
        res = parse_voice_sentence(text)
        self.assertTrue(res["success"])
        self.assertEqual(res["crop"], "paddy")
        self.assertEqual(res["quantity_kg"], 2000.0)
        self.assertEqual(res["location"], "kanchipuram")

    def test_vegetable_tomato_500kg(self):
        text = "தக்காளி 500 கிலோ காஞ்சிபுரம்"
        res = parse_voice_sentence(text)
        self.assertTrue(res["success"])
        self.assertEqual(res["crop"], "tomato")
        self.assertEqual(res["quantity_kg"], 500.0)
        self.assertEqual(res["location"], "kanchipuram")

    def test_onion_english_word_ton(self):
        text = "two ton onion Tirupporur"
        res = parse_voice_sentence(text)
        self.assertTrue(res["success"])
        self.assertEqual(res["crop"], "onion")
        self.assertEqual(res["quantity_kg"], 2000.0)
        self.assertEqual(res["location"], "tirupporur")

    def test_decimal_ton_sugarcane(self):
        text = "2.5 ton sugarcane Chengalpattu"
        res = parse_voice_sentence(text)
        self.assertTrue(res["success"])
        self.assertEqual(res["crop"], "sugarcane")
        self.assertEqual(res["quantity_kg"], 2500.0)
        self.assertEqual(res["location"], "chengalpattu")

    def test_comma_separated_quantity(self):
        text = "2,000 kg paddy Tirupporur"
        res = parse_voice_sentence(text)
        self.assertTrue(res["success"])
        self.assertEqual(res["crop"], "paddy")
        self.assertEqual(res["quantity_kg"], 2000.0)
        self.assertEqual(res["location"], "tirupporur")

    def test_missing_fields_detection(self):
        text = "நெல் திருப்போரூர்"  # Missing quantity
        res = parse_voice_sentence(text)
        self.assertFalse(res["success"])
        self.assertIn("quantity", res["missing_fields"])
        self.assertEqual(res["crop"], "paddy")
        self.assertEqual(res["location"], "tirupporur")


class TestDatabaseAndOffers(unittest.TestCase):
    """Tests for SQLite persistence, buyer capability filtering, and offer ranking."""

    @classmethod
    def setUpClass(cls):
        # Create a temporary database for test isolation
        cls.temp_db_fd, cls.temp_db_path = tempfile.mkstemp(suffix=".db")
        init_db(cls.temp_db_path)

    @classmethod
    def tearDownClass(cls):
        os.close(cls.temp_db_fd)
        if os.path.exists(cls.temp_db_path):
            os.remove(cls.temp_db_path)

    def test_paddy_buyers_contain_mills_and_dpc(self):
        """Paddy query must only return rice mills, DPC, and grain traders."""
        conn = get_connection(self.temp_db_path)
        offers_data = get_offers_for_farmer("paddy", 2000, "tirupporur", db_conn=conn)
        conn.close()

        self.assertGreater(offers_data["total_offers"], 0)
        for o in offers_data["offers"]:
            buyer_type = o["buyer_type_en"].lower()
            self.assertTrue(
                "rice mill" in buyer_type or "procurement" in buyer_type or "grain" in buyer_type,
                f"Unexpected buyer type for paddy: {buyer_type}"
            )
        # Check that top offer is marked
        self.assertTrue(offers_data["best_offer"]["is_best_offer"])

    def test_sugarcane_buyers_contain_sugar_mills_and_jaggery(self):
        """Sugarcane query must only return sugar mills and jaggery units."""
        conn = get_connection(self.temp_db_path)
        offers_data = get_offers_for_farmer("sugarcane", 10000, "chengalpattu", db_conn=conn)
        conn.close()

        self.assertGreater(offers_data["total_offers"], 0)
        for o in offers_data["offers"]:
            buyer_type = o["buyer_type_en"].lower()
            self.assertTrue(
                "sugar" in buyer_type or "jaggery" in buyer_type or "cane" in buyer_type,
                f"Unexpected buyer type for sugarcane: {buyer_type}"
            )
            # Price under ₹10
            self.assertLess(o["price_per_kg"], 10.0)

    def test_vegetable_buyers_contain_mandis_aggregators(self):
        """Tomato query returns wholesale mandis and farmer collectives."""
        conn = get_connection(self.temp_db_path)
        offers_data = get_offers_for_farmer("tomato", 500, "kanchipuram", db_conn=conn)
        conn.close()

        self.assertGreater(offers_data["total_offers"], 0)
        for o in offers_data["offers"]:
            buyer_type = o["buyer_type_en"].lower()
            self.assertTrue(
                "mandi" in buyer_type or "aggregator" in buyer_type or "collective" in buyer_type or "market" in buyer_type
            )


class TestServerAPI(unittest.TestCase):
    """End-to-end integration tests for HTTP server and REST endpoints."""

    @classmethod
    def setUpClass(cls):
        cls.port = 8899
        # Initialize default DB
        init_db()

        # Start server in background thread
        server.socketserver.TCPServer.allow_reuse_address = True
        cls.httpd = server.socketserver.TCPServer(("", cls.port), server.FarmBridgeRequestHandler)
        cls.server_thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.server_thread.start()
        time.sleep(0.3)  # Allow thread to start

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def url(self, path):
        return f"http://127.0.0.1:{self.port}{path}"

    def post_json(self, path, payload):
        req = urllib.request.Request(
            self.url(path),
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))

    def get_json(self, path):
        with urllib.request.urlopen(self.url(path)) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))

    def test_api_health(self):
        status, data = self.get_json("/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["app"], "FarmBridge")

    def test_api_meta(self):
        status, data = self.get_json("/api/meta")
        self.assertEqual(status, 200)
        self.assertIn("crops", data)
        self.assertIn("locations", data)
        self.assertIn("sample_phrases", data)

    def test_api_parse_voice_tamil(self):
        status, data = self.post_json("/api/parse-voice", {
            "text": "நெல் இரண்டாயிரம் கிலோ திருப்போரூர்",
            "language": "ta"
        })
        self.assertEqual(status, 200)
        self.assertTrue(data["success"])
        self.assertEqual(data["crop"], "paddy")
        self.assertEqual(data["quantity_kg"], 2000.0)
        self.assertEqual(data["location"], "tirupporur")

    def test_api_offers_calculation(self):
        status, data = self.post_json("/api/offers", {
            "crop": "paddy",
            "quantity_kg": 2000,
            "location": "tirupporur"
        })
        self.assertEqual(status, 200)
        self.assertIn("best_offer", data)
        self.assertIn("offers", data)
        self.assertGreater(len(data["offers"]), 0)
        self.assertEqual(data["best_offer"]["is_best_offer"], True)
        self.assertGreaterEqual(data["advantage_over_lowest"], 0.0)

    def test_api_offers_validation_error(self):
        """Checks clear error for invalid quantity."""
        req = urllib.request.Request(
            self.url("/api/offers"),
            data=json.dumps({"crop": "paddy", "quantity_kg": -50, "location": "tirupporur"}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            urllib.request.urlopen(req)
        self.assertEqual(ctx.exception.code, 400)

    def test_api_save_listing_and_retrieve(self):
        status, data = self.post_json("/api/listings", {
            "farmer_name": " உழவர் பழனிவேல்",
            "farmer_phone": "+91 94444 77889",
            "crop": "paddy",
            "quantity_kg": 3000,
            "location": "chengalpattu",
            "gross_amount": 70500.0,
            "transport_cost": 500.0,
            "net_amount": 70000.0
        })
        self.assertEqual(status, 201)
        self.assertTrue(data["success"])
        self.assertIn("id", data)

        # Retrieve listings
        status_get, data_get = self.get_json("/api/listings")
        self.assertEqual(status_get, 200)
        self.assertGreater(data_get["total"], 0)

    def test_api_deal_creation(self):
        status, data = self.post_json("/api/deals", {
            "buyer_code": "tn_civil_supplies_dpc",
            "buyer_name": "Tamil Nadu Civil Supplies DPC",
            "crop": "paddy",
            "quantity_kg": 2000,
            "location": "chengalpattu",
            "price_per_kg": 23.50,
            "gross_amount": 47000.0,
            "transport_cost": 336.0,
            "net_amount": 46664.0
        })
        self.assertEqual(status, 201)
        self.assertTrue(data["success"])
        self.assertIn("deal_id", data)

    def test_api_deal_status_transition(self):
        # Create a deal first
        status, data = self.post_json("/api/deals", {
            "buyer_code": "padalam_sugar_mills",
            "buyer_name": "Padalam Sugar Mills",
            "crop": "sugarcane",
            "quantity_kg": 5000,
            "location": "chengalpattu",
            "price_per_kg": 3.85,
            "gross_amount": 19250.0,
            "transport_cost": 1000.0,
            "net_amount": 18250.0
        })
        deal_id = data["deal_id"]

        # Advance to truck_dispatched
        status_update, data_update = self.post_json("/api/deals/status", {
            "deal_id": deal_id,
            "status": "truck_dispatched"
        })
        self.assertEqual(status_update, 200)
        self.assertTrue(data_update["success"])
        self.assertEqual(data_update["deal"]["status"], "truck_dispatched")

        # Advance to quality_inspected
        status_update2, data_update2 = self.post_json("/api/deals/status", {
            "deal_id": deal_id,
            "status": "quality_inspected"
        })
        self.assertEqual(status_update2, 200)
        self.assertEqual(data_update2["deal"]["status"], "quality_inspected")

        # Advance to payment_completed
        status_update3, data_update3 = self.post_json("/api/deals/status", {
            "deal_id": deal_id,
            "status": "payment_completed"
        })
        self.assertEqual(status_update3, 200)
        self.assertEqual(data_update3["deal"]["status"], "payment_completed")

    def test_urgent_sale_offer_calculation(self):
        status, data = self.post_json("/api/offers", {
            "crop": "tomato",
            "quantity_kg": 1000,
            "location": "tirupporur",
            "is_urgent": True,
            "discount_pct": 10.0
        })
        self.assertEqual(status, 200)
        self.assertTrue(data["is_urgent"])
        self.assertEqual(data["discount_pct"], 10.0)
        self.assertGreater(data["total_offers"], 0)

    def test_static_index_html_serving(self):
        with urllib.request.urlopen(self.url("/")) as resp:
            self.assertEqual(resp.status, 200)
            content = resp.read().decode("utf-8")
            self.assertIn("FarmBridge", content)
            self.assertIn("தமிழ்நாடு", content)

if __name__ == "__main__":
    unittest.main()
