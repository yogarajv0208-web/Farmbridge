"""
Vercel Serverless Function adapter for FarmBridge.
Wraps the stdlib http.server handler into a standard WSGI-compatible interface
that Vercel's Python runtime can invoke.
"""

import sys
import os
import json
import urllib.parse
from io import BytesIO
from datetime import datetime

# Ensure the project root is on the path so we can import our modules
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from db import init_db, get_connection, get_meta
from parser import parse_voice_sentence
from calculator import get_offers_for_farmer, calculate_transport_cost, format_currency, format_price

# Initialise DB once per cold start
_db_initialised = False

def _ensure_db():
    global _db_initialised
    if not _db_initialised:
        init_db()
        _db_initialised = True


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-cache, no-store, must-revalidate",
}


def _json_response(data: dict, status: int = 200) -> dict:
    body = json.dumps(data, ensure_ascii=False)
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json; charset=utf-8", **CORS_HEADERS},
        "body": body,
    }


def _error(status: int, code: str, message: str, details=None) -> dict:
    payload = {"error": code, "message": message}
    if details:
        payload["details"] = details
    return _json_response(payload, status)


def handler(request, context):
    """Entry point called by Vercel for every HTTP request."""
    _ensure_db()

    method = request.get("method", "GET").upper()
    path = request.get("path", "/")
    qs = request.get("query", {})
    body_raw = request.get("body", "") or ""

    # ----- CORS pre-flight -----
    if method == "OPTIONS":
        return {"statusCode": 204, "headers": CORS_HEADERS, "body": ""}

    # ----- Parse body -----
    body = {}
    if method == "POST" and body_raw:
        try:
            body = json.loads(body_raw)
        except json.JSONDecodeError as e:
            return _error(400, "invalid_json", f"Malformed JSON body: {e}")

    # ===================================================================
    # GET ROUTES
    # ===================================================================

    if method == "GET":

        if path == "/api/health":
            return _json_response({
                "status": "ok",
                "app": "FarmBridge",
                "version": "1.0.0",
                "timestamp": datetime.now().isoformat(),
                "sample_notice": "Prices, distances and ratings are sample data for demonstration.",
            })

        if path == "/api/meta":
            try:
                return _json_response(get_meta())
            except Exception as e:
                return _error(500, "internal_error", str(e))

        if path == "/api/warehouse":
            return _json_response({
                "status": "ok",
                "hub_name": "FarmBridge Central Cold Storage & Frozen Vegetable Processing Hub",
                "location": "Chengalpattu NH-45 Agro-Logistics Junction",
                "total_capacity_mt": 500,
                "current_occupancy_mt": 320,
                "available_capacity_mt": 180,
                "coordinates": {"lat": 12.6819, "lon": 79.9880},
                "wdra_reg_no": "TN-WDRA-CH-0428",
                "chambers": [
                    {"name": "IQF Blast Freezing Bay", "target_temp": -18.0, "current_temp": -18.4, "status": "active"},
                    {"name": "Controlled Atmosphere Cold Bay", "target_temp": 3.5, "current_temp": 3.6, "status": "active"},
                ],
                "developer_monetization": {
                    "facilitation_fee_pct": 1.5,
                    "warehouse_handling_per_kg": 0.15,
                    "cold_chain_handling_per_kg_month": 0.50,
                    "mandi_broker_avg_pct": 10.0,
                    "farmer_savings_pct": 8.5,
                },
            })

        if path == "/api/buyers":
            crop_param = qs.get("crop", [None])
            crop_param = crop_param[0] if isinstance(crop_param, list) else crop_param
            loc_param = qs.get("location", [None])
            loc_param = loc_param[0] if isinstance(loc_param, list) else loc_param
            conn = None
            try:
                conn = get_connection()
                cur = conn.cursor()
                if crop_param:
                    loc = (loc_param or "tirupporur").lower()
                    cur.execute("""
                        SELECT b.*, bc.price_per_kg,
                               COALESCE(dm.distance_km, 30.0) as distance_km
                        FROM buyers b
                        JOIN buyer_crops bc ON b.id = bc.buyer_id
                        LEFT JOIN distance_matrix dm ON dm.buyer_code = b.code AND dm.from_location = ?
                        WHERE bc.crop_code = ?
                        ORDER BY bc.price_per_kg DESC
                    """, (loc, crop_param.lower()))
                else:
                    cur.execute("SELECT * FROM buyers ORDER BY rating DESC")
                rows = [dict(r) for r in cur.fetchall()]
                return _json_response({
                    "total": len(rows),
                    "buyers": rows,
                    "sample_notice": "Prices, distances and ratings are sample data for demonstration.",
                })
            except Exception as e:
                return _error(500, "internal_error", str(e))
            finally:
                if conn:
                    conn.close()

        if path == "/api/listings":
            conn = None
            try:
                conn = get_connection()
                cur = conn.cursor()
                cur.execute("SELECT * FROM listings ORDER BY id DESC LIMIT 50")
                rows = [dict(r) for r in cur.fetchall()]
                return _json_response({"total": len(rows), "listings": rows})
            except Exception as e:
                return _error(500, "internal_error", str(e))
            finally:
                if conn:
                    conn.close()

        if path == "/api/deals":
            conn = None
            try:
                conn = get_connection()
                cur = conn.cursor()
                cur.execute("SELECT * FROM deals ORDER BY id DESC LIMIT 50")
                rows = [dict(r) for r in cur.fetchall()]
                return _json_response({"total": len(rows), "deals": rows})
            except Exception as e:
                return _error(500, "internal_error", str(e))
            finally:
                if conn:
                    conn.close()

        return _error(404, "not_found", f"GET endpoint '{path}' does not exist.")

    # ===================================================================
    # POST ROUTES
    # ===================================================================

    if method == "POST":

        if path == "/api/parse-voice":
            text = body.get("text", "")
            lang = body.get("language", "ta")
            if not text or not str(text).strip():
                return _error(400, "empty_text", "Field 'text' must not be empty.")
            result = parse_voice_sentence(str(text), default_lang=lang)
            return _json_response(result)

        if path == "/api/verify-photo":
            crop = body.get("crop", "paddy")
            photo_data = body.get("photo_data", "")
            if not photo_data or not str(photo_data).strip():
                return _error(400, "missing_photo", "Field 'photo_data' must not be empty.")
            if not isinstance(photo_data, str) or len(photo_data) < 10:
                return _error(400, "invalid_photo", "Field 'photo_data' is invalid.")
            crop_lower = str(crop).lower()
            crop_metrics = {
                "paddy":    {"purity": "99.2%", "defect_rate": "0.8%", "grain_maturity": "98.5%"},
                "sugarcane":{"sucrose_content": "11.8%", "fiber_pct": "12.2%", "defect_rate": "0.5%", "freshness": "99.0%"},
                "tomato":   {"color_uniformity": "97.5%", "firmness": "96.0%", "blemish_rate": "1.2%", "freshness": "99.4%"},
                "groundnut":{"oil_content": "48.2%", "kernel_count": "97.0%", "purity": "99.0%"},
                "turmeric": {"curcumin_pct": "4.8%", "aroma_grade": "A+", "purity": "99.5%"},
                "coconut":  {"water_content": "98.0%", "shell_integrity": "99.0%", "copra_thickness": "14mm", "freshness": "99.5%"},
                "mango":    {"brix_sweetness": "16.8°Bx", "color_ripeness": "96.0%", "spot_rate": "1.1%", "freshness": "98.8%"},
                "cotton":   {"staple_length": "29.5mm", "mic_value": "4.1", "trash_pct": "1.8%", "whiteness": "98.0%"},
            }
            metrics = crop_metrics.get(crop_lower, {"purity": "99.0%", "defect_rate": "1.0%", "freshness": "98.5%"})
            cert_num = abs(hash(photo_data[:50] + crop_lower)) % 90000 + 10000
            return _json_response({
                "success": True,
                "verified": True,
                "crop": crop_lower,
                "quality_grade": "Grade-A",
                "quality_score": 96.8,
                "certificate_id": f"TN-AGRO-QC-{cert_num}",
                "metrics": metrics,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "message_ta": "பயிர் தரம் வெற்றிகரமாகச் சரிபார்க்கப்பட்டது: முதல் தரம் (Grade-A Verified)",
                "message_en": "Produce photo verified successfully: Premium Grade-A Quality (96.8%)",
            })

        if path == "/api/offers":
            crop = body.get("crop")
            quantity = body.get("quantity_kg")
            location = body.get("location")
            if not crop:
                return _error(400, "missing_crop", "Field 'crop' is required.")
            if quantity is None:
                return _error(400, "missing_quantity", "Field 'quantity_kg' is required.")
            if not location:
                return _error(400, "missing_location", "Field 'location' is required.")
            try:
                quantity_num = float(quantity)
                if quantity_num <= 0:
                    return _error(400, "invalid_quantity", "quantity_kg must be greater than zero.")
            except (ValueError, TypeError):
                return _error(400, "invalid_quantity", "quantity_kg must be a valid number.")
            try:
                is_urgent = bool(body.get("is_urgent", False))
                discount_pct = float(body.get("discount_pct", 0.0))
                calc_result = get_offers_for_farmer(
                    str(crop), quantity_num, str(location),
                    is_urgent=is_urgent, discount_pct=discount_pct
                )
                return _json_response(calc_result)
            except ValueError as e:
                return _error(400, "validation_error", str(e))
            except Exception as e:
                return _error(500, "calculation_error", str(e))

        if path == "/api/listings":
            crop_code = body.get("crop") or body.get("crop_code")
            quantity_kg = body.get("quantity_kg")
            location = body.get("location")
            if not crop_code or quantity_kg is None or not location:
                return _error(400, "missing_fields", "crop, quantity_kg, and location are required.")
            try:
                quantity_kg = float(quantity_kg)
                gross_amount = float(body.get("gross_amount", 0.0))
                transport_cost = float(body.get("transport_cost", 0.0))
                net_amount = float(body.get("net_amount", gross_amount - transport_cost))
            except (ValueError, TypeError):
                return _error(400, "invalid_numbers", "Amounts and quantity must be valid numbers.")
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
                return _json_response({
                    "success": True,
                    "id": new_id,
                    "message_en": "Listing saved successfully (Demo)! Accessible in Buyer View.",
                    "message_ta": "உங்கள் பதிவு வெற்றிகரமாகச் சேமிக்கப்பட்டது (மாதிரி)! வாங்குபவர் களத்தில் கிடைக்கும்.",
                    "listing": {
                        "id": new_id, "farmer_name": farmer_name, "crop_code": crop_code,
                        "quantity_kg": quantity_kg, "location": location, "net_amount": net_amount,
                        "is_urgent": is_urgent, "quality_grade": quality_grade, "created_at": created_at,
                    },
                }, 201)
            except Exception as e:
                return _error(500, "database_error", str(e))
            finally:
                if conn:
                    conn.close()

        if path == "/api/deals":
            buyer_code = body.get("buyer_code")
            buyer_name = body.get("buyer_name")
            crop_code = body.get("crop") or body.get("crop_code")
            quantity_kg = body.get("quantity_kg")
            location = body.get("location")
            if not buyer_code or not crop_code or quantity_kg is None or not location:
                return _error(400, "missing_fields", "buyer_code, crop, quantity_kg, and location are required.")
            try:
                quantity_kg = float(quantity_kg)
                price_per_kg = float(body.get("price_per_kg", 0.0))
                gross_amount = float(body.get("gross_amount", 0.0))
                transport_cost = float(body.get("transport_cost", 0.0))
                net_amount = float(body.get("net_amount", gross_amount - transport_cost))
            except (ValueError, TypeError):
                return _error(400, "invalid_numbers", "Amounts and quantity must be valid numbers.")
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
                return _json_response({
                    "success": True,
                    "deal_id": deal_id,
                    "message_en": "Deal confirmed with buyer (Simulated Demo)! Trackable in Deals view.",
                    "message_ta": "வியாபார ஒப்பந்தம் உறுதி செய்யப்பட்டது (மாதிரி)! ஒப்பந்தங்கள் பக்கத்தில் பார்க்கலாம்.",
                    "deal": {
                        "id": deal_id, "buyer_code": buyer_code, "buyer_name": buyer_name,
                        "crop_code": crop_code, "quantity_kg": quantity_kg, "net_amount": net_amount,
                        "status": "confirmed", "created_at": created_at,
                    },
                }, 201)
            except Exception as e:
                return _error(500, "database_error", str(e))
            finally:
                if conn:
                    conn.close()

        if path == "/api/deals/status":
            deal_id = body.get("deal_id")
            new_status = body.get("status") or body.get("next_status")
            valid_statuses = ["confirmed", "truck_dispatched", "quality_inspected", "payment_completed", "cancelled"]
            if not deal_id or not new_status:
                return _error(400, "missing_fields", "deal_id and status are required.")
            if new_status not in valid_statuses:
                return _error(400, "invalid_status", f"Status must be one of: {', '.join(valid_statuses)}")
            updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            conn = None
            try:
                conn = get_connection()
                cur = conn.cursor()
                cur.execute("SELECT * FROM deals WHERE id = ?", (deal_id,))
                existing = cur.fetchone()
                if not existing:
                    return _error(404, "not_found", f"Deal with ID {deal_id} not found.")
                cur.execute("UPDATE deals SET status = ?, updated_at = ? WHERE id = ?", (new_status, updated_at, deal_id))
                conn.commit()
                cur.execute("SELECT * FROM deals WHERE id = ?", (deal_id,))
                updated_row = dict(cur.fetchone())
                return _json_response({
                    "success": True,
                    "deal": updated_row,
                    "message_en": f"Deal status updated to '{new_status}' (Simulated Stage Transition).",
                    "message_ta": f"ஒப்பந்த நிலை '{new_status}' என மாற்றப்பட்டது (மாதிரி).",
                })
            except Exception as e:
                return _error(500, "database_error", str(e))
            finally:
                if conn:
                    conn.close()

        return _error(404, "not_found", f"POST endpoint '{path}' does not exist.")

    return _error(405, "method_not_allowed", f"Method '{method}' is not supported.")
