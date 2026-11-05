"""
Tests for verifying live deployment on Vercel.
Pings https://farmbridge-psi-two.vercel.app and checks that cold storage,
deals pipeline, and 1.5% commission features are actively served.
"""

import unittest
import urllib.request
import urllib.error

LIVE_URL = "https://farmbridge-psi-two.vercel.app"

class TestLiveVercelDeployment(unittest.TestCase):

    def test_live_vercel_serves_cold_storage_and_deals(self):
        """Verifies live site returns 200 and includes cold storage & commission features."""
        try:
            req = urllib.request.Request(LIVE_URL, headers={"User-Agent": "Mozilla/5.0 (FarmBridgeVerification)"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                self.assertEqual(resp.status, 200)
                body = resp.read().decode("utf-8")
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            self.skipTest(f"Live Vercel site unreachable (offline or network blocked): {e}")

        # Check size
        self.assertGreater(len(body), 300000, "Live Vercel payload is smaller than expected standalone bundle")

        # Check required features in deployed HTML
        checks = [
            ("tabWarehouse", "Warehouse Navigation Tab"),
            ("tabDeals", "Deals Navigation Tab"),
            ("createColdStorageDealBtn", "Create Cold Storage Deal Button"),
            ("dealsCommissionStrip", "Deals Platform Commission Summary Strip"),
            ("chamberFreezeTemp", "IQF Blast Freezing Temperature Sensor"),
            ("warehouseReceiptModal", "Electronic Warehouse Receipt Modal"),
            ("farmbridge_cold_hub", "Central Cold Storage Sample Deal"),
            ("trackingGoToWarehouseBtn", "Live Tracker Warehouse View Button"),
            ("totalDevMinProfit", "Developer Platform Minimum Profit Telemetry"),
            ("12.6819", "Central Warehouse Latitude Coordinate"),
            ("79.9880", "Central Warehouse Longitude Coordinate"),
            ("TN-WDRA-CH-0428", "Warehouse WDRA Electronic Registration")
        ]

        for check_str, desc in checks:
            self.assertIn(check_str, body, f"Live deployment missing {desc} ('{check_str}')")

if __name__ == "__main__":
    unittest.main()
