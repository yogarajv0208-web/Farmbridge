"""
FarmBridge HTTP Server & REST API.
Standard library only: http.server, sqlite3, json, os, urllib.
Serves static frontend assets and REST API endpoints.
"""

import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import http.server
import socketserver
import os
import json
import urllib.parse
from datetime import datetime

from db import init_db, get_connection, get_meta
from parser import parse_voice_sentence
from calculator import get_offers_for_farmer, calculate_transport_cost, format_currency, format_price

PORT = 8000
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

# Supported content types
MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8"
}

class FarmBridgeRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handles REST API calls and serves static website files."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS for local testing/development
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        """Preflight CORS handling."""
        self.send_response(204)
        self.end_headers()

    def do_HEAD(self):
        """Handle HEAD requests: send headers only, no body per HTTP spec."""
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self.do_GET()
        else:
            super().do_HEAD()

    def send_json(self, status_code: int, data: dict):
        """Helper to serialize and send JSON response."""
        response_body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(response_body)

    def send_error_json(self, status_code: int, error_code: str, message: str, details=None):
        """Helper to return uniform error objects."""
        payload = {
            "error": error_code,
            "message": message
        }
        if details:
            payload["details"] = details
        self.send_json(status_code, payload)

    def read_json_body(self):
        """Parses incoming request body as JSON."""
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return None
        body = self.rfile.read(content_length).decode("utf-8")
        try:
            return json.loads(body)
        except json.JSONDecodeError as err:
            raise ValueError(f"Malformed JSON body: {str(err)}")

    def do_GET(self):
        """Dispatches GET requests to API endpoints or static file serving."""
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # API routing
        if path == "/api/health":
            self.send_json(200, {
                "status": "ok",
                "app": "FarmBridge",
                "version": "1.0.0",
                "timestamp": datetime.now().isoformat(),
                "sample_notice": "Prices, distances and ratings are sample data for demonstration."
            })
            return

        if path == "/api/meta":
            try:
                meta = get_meta()
                self.send_json(200, meta)
            except Exception as e:
                self.send_error_json(500, "internal_error", str(e))
            return

        if path == "/api/buyers":
            crop_param = query.get("crop", [None])[0]
            loc_param = query.get("location", [None])[0]
            conn = None
            try:
                conn = get_connection()
                cur = conn.cursor()
                if crop_param:
                    # Offers with distance calculation
                    loc = loc_param or "tirupporur"
                    cur.execute("""
                    SELECT 
                        b.*, bc.price_per_kg,
                        COALESCE(dm.distance_km, 30.0) as distance_km
                    FROM buyers b
                    JOIN buyer_crops bc ON b.id = bc.buyer_id
                    LEFT JOIN distance_matrix dm ON dm.buyer_code = b.code AND dm.from_location = ?
                    WHERE bc.crop_code = ?
                    ORDER BY bc.price_per_kg DESC
                    """, (loc.lower(), crop_param.lower()))
                else:
                    cur.execute("SELECT * FROM buyers ORDER BY rating DESC")
                
                rows = [dict(r) for r in cur.fetchall()]
                self.send_json(200, {
                    "total": len(rows),
                    "buyers": rows,
                    "sample_notice": "Prices, distances and ratings are sample data for demonstration."
                })
            except Exception as e:
                self.send_error_json(500, "internal_error", str(e))
            finally:
                if conn:
                    conn.close()
            return

        if path == "/api/listings":
            conn = None
            try:
                conn = get_connection()
                cur = conn.cursor()
                cur.execute("SELECT * FROM listings ORDER BY id DESC LIMIT 50")
                rows = [dict(r) for r in cur.fetchall()]
                self.send_json(200, {
                    "total": len(rows),
                    "listings": rows
                })
            except Exception as e:
                self.send_error_json(500, "internal_error", str(e))
            finally:
                if conn:
                    conn.close()
            return

        if path == "/api/deals":
            conn = None
            try:
                conn = get_connection()
                cur = conn.cursor()
                cur.execute("SELECT * FROM deals ORDER BY id DESC LIMIT 50")
                rows = [dict(r) for r in cur.fetchall()]
                self.send_json(200, {
                    "total": len(rows),
                    "deals": rows
                })
            except Exception as e:
                self.send_error_json(500, "internal_error", str(e))
            finally:
                if conn:
                    conn.close()
            return

        # Fallback to static file serving
        # If accessing root /, serve static/index.html
        if path == "/" or path == "":
            self.path = "/index.html"
            return super().do_GET()

        # If requesting a file that exists in static directory, serve it
        target_path = os.path.join(STATIC_DIR, path.lstrip("/"))
        if os.path.exists(target_path) and not os.path.isdir(target_path):
            return super().do_GET()

        # Fallback to index.html for single-page app
        self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        """Handles POST requests for parsing, calculations, listings, and deals."""
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        try:
            body = self.read_json_body()
        except ValueError as e:
            self.send_error_json(400, "invalid_json", str(e))
            return

        if body is None:
            self.send_error_json(400, "missing_body", "Request body is required.")
            return

        # Endpoint 1: Voice and text parsing
        if path == "/api/parse-voice":
            text = body.get("text", "")
            lang = body.get("language", "ta")
            if not text or not str(text).strip():
                self.send_error_json(400, "empty_text", "Field 'text' must not be empty.")
                return

            result = parse_voice_sentence(str(text), default_lang=lang)
            self.send_json(200, result)
            return

        # Endpoint 1.5: Produce Photo Quality Verification
        if path == "/api/verify-photo":
            crop = body.get("crop", "paddy")
            photo_data = body.get("photo_data", "")

            if not photo_data or not str(photo_data).strip():
                self.send_error_json(400, "missing_photo", "Field 'photo_data' must not be empty.")
                return

            if not isinstance(photo_data, str) or len(photo_data) < 10:
                self.send_error_json(400, "invalid_photo", "Field 'photo_data' is invalid.")
                return

            crop_lower = str(crop).lower()
            crop_metrics = {
                "paddy": {"purity": "99.2%", "defect_rate": "0.8%", "grain_maturity": "98.5%"},
                "sugarcane": {"sucrose_content": "11.8%", "fiber_pct": "12.2%", "defect_rate": "0.5%", "freshness": "99.0%"},
                "tomato": {"color_uniformity": "97.5%", "firmness": "96.0%", "blemish_rate": "1.2%", "freshness": "99.4%"},
                "groundnut": {"oil_content": "48.2%", "kernel_count": "97.0%", "purity": "99.0%"},
                "turmeric": {"curcumin_pct": "4.8%", "aroma_grade": "A+", "purity": "99.5%"},
                "coconut": {"water_content": "98.0%", "shell_integrity": "99.0%", "copra_thickness": "14mm", "freshness": "99.5%"},
                "mango": {"brix_sweetness": "16.8°Bx", "color_ripeness": "96.0%", "spot_rate": "1.1%", "freshness": "98.8%"},
                "cotton": {"staple_length": "29.5mm", "mic_value": "4.1", "trash_pct": "1.8%", "whiteness": "98.0%"}
            }
            metrics = crop_metrics.get(crop_lower, {"purity": "99.0%", "defect_rate": "1.0%", "freshness": "98.5%"})
            cert_num = abs(hash(photo_data[:50] + crop_lower)) % 90000 + 10000

            self.send_json(200, {
                "success": True,
                "verified": True,
                "crop": crop_lower,
                "quality_grade": "Grade-A",
                "quality_score": 96.8,
                "certificate_id": f"TN-AGRO-QC-{cert_num}",
                "metrics": metrics,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "message_ta": "பயிர் தரம் வெற்றிகரமாகச் சரிபார்க்கப்பட்டது: முதல் தரம் (Grade-A Verified)",
                "message_en": "Produce photo verified successfully: Premium Grade-A Quality (96.8%)"
            })
            return

        # Endpoint 2: Offers calculation
        if path == "/api/offers":
            crop = body.get("crop")
            quantity = body.get("quantity_kg")
            location = body.get("location")

            if not crop:
                self.send_error_json(400, "missing_crop", "Field 'crop' is required.")
                return
            if quantity is None:
                self.send_error_json(400, "missing_quantity", "Field 'quantity_kg' is required.")
                return
            if not location:
                self.send_error_json(400, "missing_location", "Field 'location' is required.")
                return

            try:
                quantity_num = float(quantity)
                if quantity_num <= 0:
                    self.send_error_json(400, "invalid_quantity", "quantity_kg must be greater than zero.")
                    return
            except (ValueError, TypeError):
                self.send_error_json(400, "invalid_quantity", "quantity_kg must be a valid number.")
                return

            try:
                is_urgent = bool(body.get("is_urgent", False))
                discount_pct = float(body.get("discount_pct", 0.0))
                calc_result = get_offers_for_farmer(
                    str(crop), quantity_num, str(location),
                    is_urgent=is_urgent, discount_pct=discount_pct
                )
                self.send_json(200, calc_result)
            except ValueError as e:
                self.send_error_json(400, "validation_error", str(e))
            except Exception as e:
                self.send_error_json(500, "calculation_error", str(e))
            return

        # Endpoint 3: Save listing
        if path == "/api/listings":
            crop_code = body.get("crop") or body.get("crop_code")
            quantity_kg = body.get("quantity_kg")
            location = body.get("location")

            if not crop_code or quantity_kg is None or not location:
                self.send_error_json(400, "missing_fields", "crop, quantity_kg, and location are required.")
                return

            try:
                quantity_kg = float(quantity_kg)
                gross_amount = float(body.get("gross_amount", 0.0))
                transport_cost = float(body.get("transport_cost", 0.0))
                net_amount = float(body.get("net_amount", gross_amount - transport_cost))
            except (ValueError, TypeError):
                self.send_error_json(400, "invalid_numbers", "Amounts and quantity must be valid numbers.")
                return

            farmer_name = body.get("farmer_name", "Farmer")
            farmer_phone = body.get("farmer_phone", "")
            best_buyer_code = body.get("best_buyer_code", "")
            best_buyer_name = body.get("best_buyer_name", "")
            is_urgent = 1 if body.get("is_urgent") else 0
            urgency_reason = body.get("urgency_reason", "")
            urgency_discount = float(body.get("urgency_discount", 0.0))
            photo_data = body.get("photo_data", "")
            photo_verified = 1 if body.get("photo_verified") else 0
            quality_grade = body.get("quality_grade", "Grade-A" if photo_verified else "")
            quality_score = float(body.get("quality_score", 96.8 if photo_verified else 0.0))
            notes = body.get("notes", "Saved from FarmBridge prototype (Demo Listing)")
            created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            conn = None
            try:
                conn = get_connection()
                cur = conn.cursor()
                cur.execute("""
                INSERT INTO listings (
                    farmer_name, farmer_phone, crop_code, quantity_kg, location,
                    best_buyer_code, best_buyer_name, gross_amount, transport_cost, net_amount,
                    is_urgent, urgency_reason, urgency_discount,
                    photo_data, photo_verified, quality_grade, quality_score,
                    notes, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    farmer_name, farmer_phone, crop_code, quantity_kg, location,
                    best_buyer_code, best_buyer_name, gross_amount, transport_cost, net_amount,
                    is_urgent, urgency_reason, urgency_discount,
                    photo_data, photo_verified, quality_grade, quality_score,
                    notes, "active", created_at
                ))
                new_id = cur.lastrowid
                conn.commit()

                self.send_json(201, {
                    "success": True,
                    "id": new_id,
                    "message_en": "Listing saved successfully (Demo)! Accessible in Buyer View.",
                    "message_ta": "உங்கள் பதிவு வெற்றிகரமாகச் சேமிக்கப்பட்டது (மாதிரி)! வாங்குபவர் களத்தில் கிடைக்கும்.",
                    "listing": {
                        "id": new_id,
                        "farmer_name": farmer_name,
                        "crop_code": crop_code,
                        "quantity_kg": quantity_kg,
                        "location": location,
                        "net_amount": net_amount,
                        "is_urgent": is_urgent,
                        "urgency_reason": urgency_reason,
                        "photo_data": photo_data,
                        "photo_verified": photo_verified,
                        "quality_grade": quality_grade,
                        "quality_score": quality_score,
                        "created_at": created_at
                    }
                })
            except Exception as e:
                self.send_error_json(500, "database_error", str(e))
            finally:
                if conn:
                    conn.close()
            return

        # Endpoint 4: Confirm Deal
        if path == "/api/deals":
            buyer_code = body.get("buyer_code")
            buyer_name = body.get("buyer_name")
            crop_code = body.get("crop") or body.get("crop_code")
            quantity_kg = body.get("quantity_kg")
            location = body.get("location")

            if not buyer_code or not crop_code or quantity_kg is None or not location:
                self.send_error_json(400, "missing_fields", "buyer_code, crop, quantity_kg, and location are required.")
                return

            try:
                quantity_kg = float(quantity_kg)
                price_per_kg = float(body.get("price_per_kg", 0.0))
                gross_amount = float(body.get("gross_amount", 0.0))
                transport_cost = float(body.get("transport_cost", 0.0))
                net_amount = float(body.get("net_amount", gross_amount - transport_cost))
            except (ValueError, TypeError):
                self.send_error_json(400, "invalid_numbers", "Amounts and quantity must be valid numbers.")
                return

            listing_id = body.get("listing_id")
            is_urgent = 1 if body.get("is_urgent") else 0
            photo_data = body.get("photo_data", "")
            photo_verified = 1 if body.get("photo_verified") else 0
            quality_grade = body.get("quality_grade", "Grade-A" if photo_verified else "")
            quality_score = float(body.get("quality_score", 96.8 if photo_verified else 0.0))
            created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            conn = None
            try:
                conn = get_connection()
                cur = conn.cursor()
                cur.execute("""
                INSERT INTO deals (
                    listing_id, buyer_code, buyer_name, crop_code, quantity_kg,
                    farmer_location, price_per_kg, gross_amount, transport_cost,
                    net_amount, is_urgent,
                    photo_data, photo_verified, quality_grade, quality_score,
                    status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    listing_id, buyer_code, buyer_name or buyer_code, crop_code, quantity_kg,
                    location, price_per_kg, gross_amount, transport_cost,
                    net_amount, is_urgent,
                    photo_data, photo_verified, quality_grade, quality_score,
                    "confirmed", created_at, created_at
                ))
                deal_id = cur.lastrowid
                conn.commit()

                self.send_json(201, {
                    "success": True,
                    "deal_id": deal_id,
                    "message_en": "Deal confirmed with buyer (Simulated Demo)! Trackable in Deals view.",
                    "message_ta": "வியாபார ஒப்பந்தம் உறுதி செய்யப்பட்டது (மாதிரி)! ஒப்பந்தங்கள் பக்கத்தில் பார்க்கலாம்.",
                    "deal": {
                        "id": deal_id,
                        "buyer_code": buyer_code,
                        "buyer_name": buyer_name,
                        "crop_code": crop_code,
                        "quantity_kg": quantity_kg,
                        "net_amount": net_amount,
                        "is_urgent": is_urgent,
                        "photo_data": photo_data,
                        "photo_verified": photo_verified,
                        "quality_grade": quality_grade,
                        "quality_score": quality_score,
                        "status": "confirmed",
                        "created_at": created_at
                    }
                })
            except Exception as e:
                self.send_error_json(500, "database_error", str(e))
            finally:
                if conn:
                    conn.close()
            return

        # Endpoint 5: Transition Deal Status
        if path == "/api/deals/status":
            deal_id = body.get("deal_id")
            new_status = body.get("status") or body.get("next_status")
            valid_statuses = ["confirmed", "truck_dispatched", "quality_inspected", "payment_completed", "cancelled"]

            if not deal_id or not new_status:
                self.send_error_json(400, "missing_fields", "deal_id and status are required.")
                return

            if new_status not in valid_statuses:
                self.send_error_json(400, "invalid_status", f"Status must be one of: {', '.join(valid_statuses)}")
                return

            updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            conn = None
            try:
                conn = get_connection()
                cur = conn.cursor()
                cur.execute("SELECT * FROM deals WHERE id = ?", (deal_id,))
                existing = cur.fetchone()
                if not existing:
                    self.send_error_json(404, "not_found", f"Deal with ID {deal_id} not found.")
                    return

                cur.execute("UPDATE deals SET status = ?, updated_at = ? WHERE id = ?", (new_status, updated_at, deal_id))
                conn.commit()

                cur.execute("SELECT * FROM deals WHERE id = ?", (deal_id,))
                updated_row = dict(cur.fetchone())

                self.send_json(200, {
                    "success": True,
                    "deal": updated_row,
                    "message_en": f"Deal status updated to '{new_status}' (Simulated Stage Transition).",
                    "message_ta": f"ஒப்பந்த நிலை '{new_status}' என மாற்றப்பட்டது (மாதிரி)."
                })
            except Exception as e:
                self.send_error_json(500, "database_error", str(e))
            finally:
                if conn:
                    conn.close()
            return

        self.send_error_json(404, "not_found", f"POST endpoint '{path}' does not exist.")


def run_server(port=PORT):
    """Initializes the database and runs the HTTP server."""
    init_db()
    server_address = ("0.0.0.0", port)
    
    # Allow address reuse and handle requests in separate threads
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    httpd = http.server.ThreadingHTTPServer(server_address, FarmBridgeRequestHandler)
    print(f"==================================================")
    print(f"  [FarmBridge] Server Running on port {port}")
    print(f"  Localhost: http://localhost:{port}")
    print(f"  Direct IP: http://127.0.0.1:{port}")
    print(f"  Static Directory: {STATIC_DIR}")
    print(f"  Database: farmbridge.db initialized")
    print(f"==================================================", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping FarmBridge server...")
        httpd.server_close()

if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    run_server(port)
