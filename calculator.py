"""
Transport cost and offer comparison calculator for FarmBridge.
Formula specified by user:
Transport cost = ₹200 + km × (₹10 + quantity_kg × 0.012)
"""

from db import get_connection

def calculate_transport_cost(distance_km: float, quantity_kg: float) -> float:
    """
    Computes transport cost using standard formula:
    ₹200 base fee + distance_km * (₹10/km + quantity_kg * 0.012)
    """
    if distance_km < 0:
        distance_km = 0.0
    if quantity_kg < 0:
        quantity_kg = 0.0
        
    cost = 200.0 + float(distance_km) * (10.0 + float(quantity_kg) * 0.012)
    return round(cost, 2)

def format_price(amount: float) -> str:
    """Formats price per kg: decimals if under ₹10, clean format otherwise."""
    amount = float(amount)
    if amount < 10.0:
        return f"₹{amount:.2f}"
    if amount.is_integer():
        return f"₹{int(amount)}"
    return f"₹{amount:.2f}"

def format_currency(amount: float) -> str:
    """Formats Indian Rupee with comma grouping."""
    rounded = round(amount)
    # Indian numbering formatting
    s = str(abs(rounded))
    if len(s) > 3:
        last3 = s[-3:]
        rest = s[:-3]
        groups = []
        while len(rest) > 2:
            groups.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.insert(0, rest)
        formatted = ",".join(groups) + "," + last3
    else:
        formatted = s
    sign = "-" if rounded < 0 else ""
    return f"{sign}₹{formatted}"

def get_offers_for_farmer(crop_code: str, quantity_kg: float, location: str, db_conn=None, is_urgent: bool = False, discount_pct: float = 0.0):
    """
    Retrieves and ranks all buyers for given crop, quantity, and farmer location.
    Calculates gross value, transport cost, net payout, and comparative metrics.
    Supports urgent/distress clearance discount and spot-cash prioritization.
    """
    crop_code = (crop_code or "").strip().lower()
    location = (location or "").strip().lower()
    try:
        quantity_kg = float(quantity_kg)
    except (ValueError, TypeError):
        raise ValueError("quantity_kg must be a positive number")

    if quantity_kg <= 0:
        raise ValueError("quantity_kg must be greater than zero")

    try:
        discount_pct = max(0.0, min(50.0, float(discount_pct or 0.0)))
    except (ValueError, TypeError):
        discount_pct = 0.0

    close_at_end = False
    if db_conn is None:
        db_conn = get_connection()
        close_at_end = True

    cur = db_conn.cursor()

    # Verify crop exists
    cur.execute("SELECT * FROM crops WHERE code = ?", (crop_code,))
    crop_row = cur.fetchone()
    if not crop_row:
        if close_at_end:
            db_conn.close()
        raise ValueError(f"Unknown crop: '{crop_code}'")

    crop_info = dict(crop_row)

    # Verify location exists
    cur.execute("SELECT * FROM locations WHERE code = ?", (location,))
    location_row = cur.fetchone()
    if not location_row:
        # Check if matched by name
        cur.execute("SELECT * FROM locations WHERE lower(name_en) = ? OR name_ta = ?", (location, location))
        location_row = cur.fetchone()
        if location_row:
            location = location_row["code"]
        else:
            location = "tirupporur"  # Fallback to default
            cur.execute("SELECT * FROM locations WHERE code = ?", (location,))
            location_row = cur.fetchone()

    location_info = dict(location_row)

    # Fetch buyers that purchase this crop
    cur.execute("""
    SELECT 
        b.id, b.code, b.name_en, b.name_ta,
        b.buyer_type_en, b.buyer_type_ta,
        b.base_location_en, b.base_location_ta,
        b.rating, b.review_count,
        b.payment_speed_en, b.payment_speed_ta,
        b.phone, b.address_en, b.address_ta,
        bc.price_per_kg,
        COALESCE(dm.distance_km, 30.0) as distance_km
    FROM buyers b
    JOIN buyer_crops bc ON b.id = bc.buyer_id
    LEFT JOIN distance_matrix dm ON dm.buyer_code = b.code AND dm.from_location = ?
    WHERE bc.crop_code = ?
    """, (location, crop_code))

    rows = cur.fetchall()
    offers = []

    for r in rows:
        distance_km = float(r["distance_km"])
        base_price_per_kg = float(r["price_per_kg"])
        
        # Apply urgent clearance discount if applicable
        if is_urgent and discount_pct > 0:
            price_per_kg = round(base_price_per_kg * (1.0 - (discount_pct / 100.0)), 2)
        else:
            price_per_kg = base_price_per_kg

        gross_amount = round(quantity_kg * price_per_kg, 2)
        transport_cost = calculate_transport_cost(distance_km, quantity_kg)
        net_amount = round(gross_amount - transport_cost, 2)
        net_per_kg = round(net_amount / quantity_kg, 2) if quantity_kg > 0 else 0.0

        payment_speed_en = r["payment_speed_en"]
        is_spot_cash = any(word in payment_speed_en.lower() for word in ["spot cash", "instant", "24 hours", "same day"])

        offers.append({
            "buyer_id": r["id"],
            "buyer_code": r["code"],
            "name_en": r["name_en"],
            "name_ta": r["name_ta"],
            "buyer_type_en": r["buyer_type_en"],
            "buyer_type_ta": r["buyer_type_ta"],
            "location_en": r["base_location_en"],
            "location_ta": r["base_location_ta"],
            "rating": float(r["rating"]),
            "review_count": int(r["review_count"]),
            "payment_speed_en": payment_speed_en,
            "payment_speed_ta": r["payment_speed_ta"],
            "is_spot_cash": is_spot_cash,
            "phone": r["phone"],
            "base_price_per_kg": base_price_per_kg,
            "price_per_kg": price_per_kg,
            "price_formatted": format_price(price_per_kg),
            "distance_km": distance_km,
            "gross_amount": gross_amount,
            "gross_formatted": format_currency(gross_amount),
            "transport_cost": transport_cost,
            "transport_formatted": format_currency(transport_cost),
            "net_amount": net_amount,
            "net_formatted": format_currency(net_amount),
            "net_per_kg": net_per_kg,
            "net_per_kg_formatted": format_price(net_per_kg),
            "formula_line_en": f"{format_currency(gross_amount)} − {format_currency(transport_cost)} transport ({int(distance_km)} km)",
            "formula_line_ta": f"{format_currency(gross_amount)} − {format_currency(transport_cost)} போக்குவரத்து ({int(distance_km)} கி.மீ)",
            "is_best_offer": False,
            "demo_badge": "Simulated Demo Offer"
        })

    # Sort descending by net_amount; if urgent, prefer spot cash on ties
    if is_urgent:
        offers.sort(key=lambda x: (x["is_spot_cash"], x["net_amount"]), reverse=True)
    else:
        offers.sort(key=lambda x: x["net_amount"], reverse=True)

    best_offer = None
    lowest_offer = None
    advantage_over_lowest = 0.0
    advantage_formatted = "₹0"

    if offers:
        offers[0]["is_best_offer"] = True
        best_offer = offers[0]
        lowest_offer = min(offers, key=lambda x: x["net_amount"])
        advantage_over_lowest = max(0.0, round(best_offer["net_amount"] - lowest_offer["net_amount"], 2))
        advantage_formatted = format_currency(advantage_over_lowest)

    if close_at_end:
        db_conn.close()

    return {
        "crop": crop_info,
        "quantity_kg": quantity_kg,
        "farmer_location": location_info,
        "is_urgent": is_urgent,
        "discount_pct": discount_pct,
        "total_offers": len(offers),
        "best_offer": best_offer,
        "lowest_offer": lowest_offer,
        "advantage_over_lowest": advantage_over_lowest,
        "advantage_formatted": advantage_formatted,
        "offers": offers,
        "sample_notice": "Prices, distances and ratings are sample data for demonstration."
    }
