"""
Tests for standalone browser runtime bundle (index.html).
Validates HTML syntax, script and style matching, and presence of critical DOM views.
"""

import os
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_HTML = os.path.join(ROOT_DIR, "index.html")

class TestBrowserRuntimeBundle(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        with open(INDEX_HTML, "r", encoding="utf-8") as f:
            cls.content = f.read()

    def test_bundle_size(self):
        """Index HTML must be substantial (>300 KB for self-contained bundle)."""
        self.assertGreater(len(self.content), 300000)

    def test_script_tags_matched(self):
        """Every <script> must have a corresponding </script>."""
        open_scripts = self.content.count("<script>")
        close_scripts = self.content.count("</script>")
        self.assertEqual(open_scripts, close_scripts, f"Mismatched script tags: {open_scripts} vs {close_scripts}")

    def test_style_tags_matched(self):
        """Every <style> must have a corresponding </style>."""
        open_styles = self.content.count("<style>")
        close_styles = self.content.count("</style>")
        self.assertEqual(open_styles, close_styles, f"Mismatched style tags: {open_styles} vs {close_styles}")

    def test_view_panels_exist(self):
        """All 4 main role view panels must be present in standalone HTML."""
        for view_id in ["viewFarmer", "viewBuyer", "viewDeals", "viewWarehouse"]:
            self.assertIn(f'id="{view_id}"', self.content, f"Missing view panel: {view_id}")

    def test_role_tabs_exist(self):
        """All 4 role navigation tabs must be present."""
        for tab_id in ["tabFarmer", "tabBuyer", "tabDeals", "tabWarehouse"]:
            self.assertIn(f'id="{tab_id}"', self.content, f"Missing tab: {tab_id}")

    def test_deals_cold_storage_elements_exist(self):
        """Deals cold storage integration and 1.5% commission strip must be present."""
        for elem in ["createColdStorageDealBtn", "dealsCommissionStrip", "warehouseReceiptModal"]:
            self.assertIn(f'id="{elem}"', self.content, f"Missing element: {elem}")

if __name__ == "__main__":
    unittest.main()
