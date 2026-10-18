"""
Database setup and sample data initialization for FarmBridge.
Uses standard library sqlite3 only.
"""

import sqlite3
import os
import json
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(__file__), "farmbridge.db")

def get_connection(db_path=None):
    """Returns a SQLite connection with row factory enabled."""
    path = db_path or DB_FILE
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(db_path=None):
    """Creates schema and seeds initial sample data if tables are empty."""
    conn = get_connection(db_path)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS crops (
        code TEXT PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_ta TEXT NOT NULL,
        category TEXT NOT NULL,
        typical_price_min REAL NOT NULL,
        typical_price_max REAL NOT NULL,
        unit TEXT DEFAULT 'kg',
        icon TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS locations (
        code TEXT PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_ta TEXT NOT NULL,
        district_en TEXT NOT NULL,
        district_ta TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS buyers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name_en TEXT NOT NULL,
        name_ta TEXT NOT NULL,
        buyer_type_en TEXT NOT NULL,
        buyer_type_ta TEXT NOT NULL,
        base_location_en TEXT NOT NULL,
        base_location_ta TEXT NOT NULL,
        rating REAL NOT NULL,
        review_count INTEGER NOT NULL,
        payment_speed_en TEXT NOT NULL,
        payment_speed_ta TEXT NOT NULL,
        verified INTEGER DEFAULT 1,
        phone TEXT,
        address_en TEXT,
        address_ta TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS buyer_crops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyer_id INTEGER NOT NULL,
        crop_code TEXT NOT NULL,
        price_per_kg REAL NOT NULL,
        FOREIGN KEY (buyer_id) REFERENCES buyers(id),
        FOREIGN KEY (crop_code) REFERENCES crops(code)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS distance_matrix (
        from_location TEXT NOT NULL,
        buyer_code TEXT NOT NULL,
        distance_km REAL NOT NULL,
        PRIMARY KEY (from_location, buyer_code)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_name TEXT,
        farmer_phone TEXT,
        crop_code TEXT NOT NULL,
        quantity_kg REAL NOT NULL,
        location TEXT NOT NULL,
        best_buyer_code TEXT,
        best_buyer_name TEXT,
        gross_amount REAL,
        transport_cost REAL,
        net_amount REAL,
        is_urgent INTEGER DEFAULT 0,
        urgency_reason TEXT,
        urgency_discount REAL DEFAULT 0.0,
        notes TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        listing_id INTEGER,
        buyer_code TEXT NOT NULL,
        buyer_name TEXT NOT NULL,
        crop_code TEXT NOT NULL,
        quantity_kg REAL NOT NULL,
        farmer_location TEXT NOT NULL,
        price_per_kg REAL NOT NULL,
        gross_amount REAL NOT NULL,
        transport_cost REAL NOT NULL,
        net_amount REAL NOT NULL,
        is_urgent INTEGER DEFAULT 0,
        status TEXT DEFAULT 'confirmed',
        created_at TEXT NOT NULL,
        updated_at TEXT,
        FOREIGN KEY (listing_id) REFERENCES listings(id)
    )
    """)

    # Safe migrations if existing db was created with earlier schema
    for col, col_type in [("is_urgent", "INTEGER DEFAULT 0"), ("urgency_reason", "TEXT"), ("urgency_discount", "REAL DEFAULT 0.0")]:
        try:
            cur.execute(f"ALTER TABLE listings ADD COLUMN {col} {col_type}")
        except Exception:
            pass

    for col, col_type in [("is_urgent", "INTEGER DEFAULT 0"), ("updated_at", "TEXT")]:
        try:
            cur.execute(f"ALTER TABLE deals ADD COLUMN {col} {col_type}")
        except Exception:
            pass

    conn.commit()

    # Seed data if empty
    cur.execute("SELECT COUNT(*) FROM crops")
    if cur.fetchone()[0] == 0:
        seed_data(conn)

    conn.close()

def seed_data(conn):
    """Populates the database with realistic sample data for Tamil Nadu."""
    cur = conn.cursor()

    crops = [
        ("paddy", "Paddy", "நெல்", "grain", 22.8, 23.7, "kg", "🌾"),
        ("sugarcane", "Sugarcane", "கரும்பு", "cane", 3.5, 3.9, "kg", "🎋"),
        ("tomato", "Tomato", "தக்காளி", "vegetable", 28.0, 38.0, "kg", "🍅"),
        ("onion", "Onion", "வெங்காயம்", "vegetable", 32.0, 45.0, "kg", "🧅"),
        ("potato", "Potato", "உருளைக்கிழங்கு", "vegetable", 24.0, 32.0, "kg", "🥔"),
        ("banana", "Banana", "வாழைப்பழம்", "fruit", 32.0, 48.0, "kg", "🍌"),
        ("chilli", "Chilli", "மிளகாய்", "spice", 48.0, 65.0, "kg", "🌶️"),
        ("brinjal", "Brinjal", "கத்தரிக்காய்", "vegetable", 22.0, 35.0, "kg", "🍆")
    ]
    cur.executemany("INSERT INTO crops VALUES (?, ?, ?, ?, ?, ?, ?, ?)", crops)

    locations = [
        ("tirupporur", "Tirupporur", "திருப்போரூர்", "Chengalpattu", "செங்கல்பட்டு"),
        ("chengalpattu", "Chengalpattu", "செங்கல்பட்டு", "Chengalpattu", "செங்கல்பட்டு"),
        ("kanchipuram", "Kanchipuram", "காஞ்சிபுரம்", "Kanchipuram", "காஞ்சிபுரம்"),
        ("tindivanam", "Tindivanam", "திண்டிவனம்", "Villupuram", "விழுப்புரம்")
    ]
    cur.executemany("INSERT INTO locations VALUES (?, ?, ?, ?, ?)", locations)

    # Sample buyers:
    # Paddy: Modern rice mills, Direct Procurement Centres (DPC), Grain traders
    # Sugarcane: Sugar mills, Jaggery units / Nattu sakkarai
    # Veg/Fruits: Mandis, APMC aggregators, Retailer collectives
    buyers = [
        # --- PADDY BUYERS ---
        (
            "kanchi_ponni_rice_mill",
            "Kanchi Ponni Modern Rice Mill",
            "காஞ்சி பொன்னி நவீன அரிசி ஆலை",
            "Modern Rice Mill",
            "நவீன அரிசி ஆலை",
            "Kanchipuram",
            "காஞ்சிபுரம்",
            4.8, 128,
            "Within 24 Hours (Bank/UPI)",
            "24 மணி நேரத்திற்குள் (வங்கி/UPI)",
            1, "+91 94431 23456",
            "GST Road, Vandavasi Bypass, Kanchipuram",
            "ஜிஎஸ்டி சாலை, வந்தவாசி பைபாஸ், காஞ்சிபுரம்"
        ),
        (
            "tn_civil_supplies_dpc",
            "Tamil Nadu Civil Supplies DPC",
            "தமிழ்நாடு நுகர்பொருள் நேரடி நெல் கொள்முதல் நிலையம் (DPC)",
            "Direct Procurement Centre",
            "நேரடி கொள்முதல் நிலையம்",
            "Chengalpattu",
            "செங்கல்பட்டு",
            4.6, 215,
            "Direct Bank Credit (MSP)",
            "நேரடி வங்கிக் கணக்கு (அரசு விலை)",
            1, "+91 44 2742 8899",
            "Old Bus Stand Agro Hub, Chengalpattu",
            "பழைய பேருந்து நிலையம் அருகில், செங்கல்பட்டு"
        ),
        (
            "tirupporur_grain_traders",
            "Tirupporur Uzhavar Grain Traders",
            "திருப்போரூர் உழவர் தானிய வியாபாரி",
            "Grain Trader",
            "தானிய வியாபாரி",
            "Tirupporur",
            "திருப்போரூர்",
            4.4, 76,
            "Same Day Spot Cash",
            "அன்றே உடனடி ரொக்கம்",
            1, "+91 98412 87654",
            "OMR Road, Near Murugan Temple, Tirupporur",
            "ஓஎம்ஆர் சாலை, முருகன் கோவில் அருகில், திருப்போரூர்"
        ),
        (
            "tindivanam_lakshmi_mill",
            "Tindivanam Lakshmi Agro Rice Mill",
            "திண்டிவனம் லக்ஷ்மி அரிசி ஆலை",
            "Private Rice Mill",
            "தனியார் அரிசி ஆலை",
            "Tindivanam",
            "திண்டிவனம்",
            4.5, 94,
            "Within 48 Hours",
            "48 மணி நேரத்திற்குள்",
            1, "+91 94438 55432",
            "Mailam Road, Tindivanam",
            "மயிலம் சாலை, திண்டிவனம்"
        ),
        (
            "maduranthakam_delta_traders",
            "Maduranthakam Delta Agro Traders",
            "மதுராந்தகம் டெல்டா அக்ரோ டிரேடர்ஸ்",
            "Grain Aggregator",
            "மொத்த தானிய கொள்முதல்",
            "Maduranthakam",
            "மதுராந்தகம்",
            4.3, 62,
            "Instant UPI Transfer",
            "உடனடி UPI பரிமாற்றம்",
            1, "+91 94444 33211",
            "Bazaar Street, Maduranthakam",
            "பஜார் வீதி, மதுராந்தகம்"
        ),

        # --- SUGARCANE BUYERS ---
        (
            "padalam_sugar_mills",
            "Padalam Cooperative Sugar Mills Ltd",
            "படாளம் கூட்டுறவு சர்க்கரை ஆலை",
            "Cooperative Sugar Mill",
            "கூட்டுறவு சர்க்கரை ஆலை",
            "Padalam (Chengalpattu)",
            "படாளம் (செங்கல்பட்டு)",
            4.8, 192,
            "Bank Transfer within 48 Hours",
            "48 மணி நேரத்தில் வங்கிப் பரிமாற்றம்",
            1, "+91 44 2756 1234",
            "NH-45 National Highway, Padalam",
            "என்.எச்-45 தேசிய நெடுஞ்சாலை, படாளம்"
        ),
        (
            "cheyyar_coop_sugar_mill",
            "Cheyyar Co-operative Sugar Mill",
            "செய்யாறு கூட்டுறவு சர்க்கரை ஆலை",
            "Sugar Mill",
            "சர்க்கரை ஆலை",
            "Cheyyar (Near Kanchi)",
            "செய்யாறு (காஞ்சிபுரம் அருகில்)",
            4.7, 185,
            "Govt Rate via Bank in 3-5 Days",
            "வங்கி கணக்கில் 3-5 நாட்களில்",
            1, "+91 4182 223456",
            "Sugar Mill Campus, Cheyyar",
            "சர்க்கரை ஆலை வளாகம், செய்யாறு"
        ),
        (
            "tirupporur_nattu_sakkarai",
            "Tirupporur Traditional Jaggery & Cane Unit",
            "திருப்போரூர் நாட்டுச் சர்க்கரை & வெல்ல ஆலை",
            "Traditional Jaggery Unit",
            "நாட்டுச் சர்க்கரை & வெல்லத் தயாரிப்பு",
            "Tirupporur",
            "திருப்போரூர்",
            4.9, 88,
            "Spot Cash Payment",
            "உடனடி நேரடி ரொக்கம்",
            1, "+91 98401 56789",
            "Illalur Road, Tirupporur",
            "இல்லலூர் சாலை, திருப்போரூர்"
        ),
        (
            "tindivanam_cane_cluster",
            "Tindivanam Organic Cane & Jaggery Cluster",
            "திண்டிவனம் இயற்கை கரும்பு & வெல்ல மையம்",
            "Jaggery & Cane Unit",
            "வெல்லம் தயாரிப்பு கூடம்",
            "Tindivanam",
            "திண்டிவனம்",
            4.4, 54,
            "Same Day UPI / Cash",
            "அன்றே UPI / ரொக்கம்",
            1, "+91 94421 98765",
            "Gingee Road, Tindivanam",
            "செஞ்சி சாலை, திண்டிவனம்"
        ),
        (
            "kanchi_bio_sugar",
            "Kanchi Bio-Cane Agro Processing",
            "காஞ்சி பயோ கரும்பு பதப்படுத்துதல்",
            "Sugar & Cane Processing",
            "கரும்பு பதப்படுத்துதல் ஆலை",
            "Kanchipuram",
            "காஞ்சிபுரம்",
            4.3, 71,
            "Within 3 Days",
            "3 நாட்களுக்குள்",
            1, "+91 94432 11223",
            "Walajabad Road, Kanchipuram",
            "வாலாஜாபாத் சாலை, காஞ்சிபுரம்"
        ),

        # --- VEGETABLE & FRUIT BUYERS ---
        (
            "chengalpattu_uzhavar_aggregator",
            "Chengalpattu Uzhavar Sandhai Aggregator",
            "செங்கல்பட்டு உழவர் சந்தை மொத்த கொள்முதல்",
            "Farmer Market Aggregator",
            "உழவர் சந்தை கூட்டமைப்பு",
            "Chengalpattu",
            "செங்கல்பட்டு",
            4.8, 340,
            "Instant UPI / Spot Cash",
            "உடனடி UPI / ரொக்கம்",
            1, "+91 94440 66778",
            "Uzhavar Sandhai Complex, Chengalpattu",
            "உழவர் சந்தை வளாகம், செங்கல்பட்டு"
        ),
        (
            "koyambedu_kanchi_hub",
            "Koyambedu Wholesale Connect - Kanchi Hub",
            "கோயம்பேடு மொத்த விற்பனை - காஞ்சி மையம்",
            "Wholesale Mandi",
            "மொத்த காய்கறி மண்டி",
            "Kanchipuram",
            "காஞ்சிபுரம்",
            4.7, 420,
            "Same Day Cash",
            "அன்றே நேரடி ரொக்கம்",
            1, "+91 98402 33445",
            "Railway Station Road, Kanchipuram",
            "ரயில்வே நிலையம் சாலை, காஞ்சிபுரம்"
        ),
        (
            "tirupporur_green_mandi",
            "Tirupporur Green Veg & Fruit Mandi",
            "திருப்போரூர் பசுமை காய்கறி மண்டி",
            "Retailer Collective",
            "சில்லறை விற்பனையாளர் கூட்டமைப்பு",
            "Tirupporur",
            "திருப்போரூர்",
            4.5, 96,
            "Instant UPI / Bank",
            "உடனடி UPI / வங்கி",
            1, "+91 98840 99881",
            "Kelambakkam Link Road, Tirupporur",
            "கேளம்பாக்கம் இணைப்பு சாலை, திருப்போரூர்"
        ),
        (
            "tindivanam_highway_mandi",
            "Tindivanam Highway Veg & Onion Terminal",
            "திண்டிவனம் நெடுஞ்சாலை காய்கறி முனையம்",
            "Wholesale Mandi",
            "மொத்த காய்கறி முனையம்",
            "Tindivanam",
            "திண்டிவனம்",
            4.6, 150,
            "Within 24 Hours",
            "24 மணி நேரத்திற்குள்",
            1, "+91 94435 77665",
            "Tindivanam Bypass, NH-45",
            "திண்டிவனம் பைபாஸ், என்.எச்-45"
        )
    ]

    for b in buyers:
        cur.execute("""
        INSERT INTO buyers (
            code, name_en, name_ta, buyer_type_en, buyer_type_ta,
            base_location_en, base_location_ta, rating, review_count,
            payment_speed_en, payment_speed_ta, verified, phone, address_en, address_ta
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, b)

    # Get buyer IDs by code
    cur.execute("SELECT id, code FROM buyers")
    buyer_id_map = {row["code"]: row["id"] for row in cur.fetchall()}

    # Buyer crops and rates (₹ per kg)
    # Paddy ~ 22.8 - 23.7
    # Sugarcane ~ 3.5 - 3.9
    # Tomato ~ 28 - 36
    # Onion ~ 32 - 45
    # Potato ~ 24 - 32
    # Banana ~ 32 - 48
    # Chilli ~ 48 - 65
    # Brinjal ~ 22 - 35
    buyer_crops = [
        # Paddy buyers
        (buyer_id_map["kanchi_ponni_rice_mill"], "paddy", 23.70),
        (buyer_id_map["tn_civil_supplies_dpc"], "paddy", 23.50),
        (buyer_id_map["tirupporur_grain_traders"], "paddy", 22.90),
        (buyer_id_map["tindivanam_lakshmi_mill"], "paddy", 23.40),
        (buyer_id_map["maduranthakam_delta_traders"], "paddy", 23.10),

        # Sugarcane buyers
        (buyer_id_map["padalam_sugar_mills"], "sugarcane", 3.90),
        (buyer_id_map["cheyyar_coop_sugar_mill"], "sugarcane", 3.85),
        (buyer_id_map["tirupporur_nattu_sakkarai"], "sugarcane", 3.75),
        (buyer_id_map["tindivanam_cane_cluster"], "sugarcane", 3.65),
        (buyer_id_map["kanchi_bio_sugar"], "sugarcane", 3.70),

        # Veg & Fruit buyers
        (buyer_id_map["chengalpattu_uzhavar_aggregator"], "tomato", 34.50),
        (buyer_id_map["chengalpattu_uzhavar_aggregator"], "onion", 42.00),
        (buyer_id_map["chengalpattu_uzhavar_aggregator"], "potato", 28.00),
        (buyer_id_map["chengalpattu_uzhavar_aggregator"], "banana", 45.00),
        (buyer_id_map["chengalpattu_uzhavar_aggregator"], "chilli", 62.00),
        (buyer_id_map["chengalpattu_uzhavar_aggregator"], "brinjal", 31.00),

        (buyer_id_map["koyambedu_kanchi_hub"], "tomato", 36.00),
        (buyer_id_map["koyambedu_kanchi_hub"], "onion", 44.50),
        (buyer_id_map["koyambedu_kanchi_hub"], "potato", 29.50),
        (buyer_id_map["koyambedu_kanchi_hub"], "banana", 47.00),
        (buyer_id_map["koyambedu_kanchi_hub"], "chilli", 64.50),
        (buyer_id_map["koyambedu_kanchi_hub"], "brinjal", 33.00),

        (buyer_id_map["tirupporur_green_mandi"], "tomato", 33.00),
        (buyer_id_map["tirupporur_green_mandi"], "onion", 39.50),
        (buyer_id_map["tirupporur_green_mandi"], "potato", 27.00),
        (buyer_id_map["tirupporur_green_mandi"], "banana", 42.50),
        (buyer_id_map["tirupporur_green_mandi"], "chilli", 59.00),
        (buyer_id_map["tirupporur_green_mandi"], "brinjal", 29.50),

        (buyer_id_map["tindivanam_highway_mandi"], "tomato", 35.00),
        (buyer_id_map["tindivanam_highway_mandi"], "onion", 41.50),
        (buyer_id_map["tindivanam_highway_mandi"], "potato", 28.50),
        (buyer_id_map["tindivanam_highway_mandi"], "banana", 44.00),
        (buyer_id_map["tindivanam_highway_mandi"], "chilli", 61.00),
        (buyer_id_map["tindivanam_highway_mandi"], "brinjal", 30.50)
    ]
    cur.executemany("INSERT INTO buyer_crops (buyer_id, crop_code, price_per_kg) VALUES (?, ?, ?)", buyer_crops)

    # Realistic Distance matrix (in km) from the 4 farmer locations to every buyer
    # Locations: tirupporur, chengalpattu, kanchipuram, tindivanam
    distances = [
        # Paddy buyers:
        # kanchi_ponni_rice_mill (Kanchi)
        ("tirupporur", "kanchi_ponni_rice_mill", 62.0),
        ("chengalpattu", "kanchi_ponni_rice_mill", 36.0),
        ("kanchipuram", "kanchi_ponni_rice_mill", 5.0),
        ("tindivanam", "kanchi_ponni_rice_mill", 78.0),

        # tn_civil_supplies_dpc (Chengalpattu)
        ("tirupporur", "tn_civil_supplies_dpc", 30.0),
        ("chengalpattu", "tn_civil_supplies_dpc", 4.0),
        ("kanchipuram", "tn_civil_supplies_dpc", 38.0),
        ("tindivanam", "tn_civil_supplies_dpc", 68.0),

        # tirupporur_grain_traders (Tirupporur)
        ("tirupporur", "tirupporur_grain_traders", 6.0),
        ("chengalpattu", "tirupporur_grain_traders", 28.0),
        ("kanchipuram", "tirupporur_grain_traders", 65.0),
        ("tindivanam", "tirupporur_grain_traders", 92.0),

        # tindivanam_lakshmi_mill (Tindivanam)
        ("tirupporur", "tindivanam_lakshmi_mill", 95.0),
        ("chengalpattu", "tindivanam_lakshmi_mill", 68.0),
        ("kanchipuram", "tindivanam_lakshmi_mill", 76.0),
        ("tindivanam", "tindivanam_lakshmi_mill", 7.0),

        # maduranthakam_delta_traders (Maduranthakam)
        ("tirupporur", "maduranthakam_delta_traders", 48.0),
        ("chengalpattu", "maduranthakam_delta_traders", 24.0),
        ("kanchipuram", "maduranthakam_delta_traders", 52.0),
        ("tindivanam", "maduranthakam_delta_traders", 44.0),

        # Sugarcane buyers:
        # padalam_sugar_mills (Near Chengalpattu)
        ("tirupporur", "padalam_sugar_mills", 38.0),
        ("chengalpattu", "padalam_sugar_mills", 18.0),
        ("kanchipuram", "padalam_sugar_mills", 42.0),
        ("tindivanam", "padalam_sugar_mills", 52.0),

        # cheyyar_coop_sugar_mill (Cheyyar / Kanchi)
        ("tirupporur", "cheyyar_coop_sugar_mill", 85.0),
        ("chengalpattu", "cheyyar_coop_sugar_mill", 60.0),
        ("kanchipuram", "cheyyar_coop_sugar_mill", 28.0),
        ("tindivanam", "cheyyar_coop_sugar_mill", 58.0),

        # tirupporur_nattu_sakkarai (Tirupporur)
        ("tirupporur", "tirupporur_nattu_sakkarai", 8.0),
        ("chengalpattu", "tirupporur_nattu_sakkarai", 32.0),
        ("kanchipuram", "tirupporur_nattu_sakkarai", 68.0),
        ("tindivanam", "tirupporur_nattu_sakkarai", 96.0),

        # tindivanam_cane_cluster (Tindivanam)
        ("tirupporur", "tindivanam_cane_cluster", 94.0),
        ("chengalpattu", "tindivanam_cane_cluster", 66.0),
        ("kanchipuram", "tindivanam_cane_cluster", 78.0),
        ("tindivanam", "tindivanam_cane_cluster", 6.0),

        # kanchi_bio_sugar (Kanchipuram)
        ("tirupporur", "kanchi_bio_sugar", 66.0),
        ("chengalpattu", "kanchi_bio_sugar", 40.0),
        ("kanchipuram", "kanchi_bio_sugar", 10.0),
        ("tindivanam", "kanchi_bio_sugar", 74.0),

        # Veg buyers:
        # chengalpattu_uzhavar_aggregator
        ("tirupporur", "chengalpattu_uzhavar_aggregator", 26.0),
        ("chengalpattu", "chengalpattu_uzhavar_aggregator", 3.0),
        ("kanchipuram", "chengalpattu_uzhavar_aggregator", 36.0),
        ("tindivanam", "chengalpattu_uzhavar_aggregator", 65.0),

        # koyambedu_kanchi_hub
        ("tirupporur", "koyambedu_kanchi_hub", 64.0),
        ("chengalpattu", "koyambedu_kanchi_hub", 38.0),
        ("kanchipuram", "koyambedu_kanchi_hub", 6.0),
        ("tindivanam", "koyambedu_kanchi_hub", 75.0),

        # tirupporur_green_mandi
        ("tirupporur", "tirupporur_green_mandi", 5.0),
        ("chengalpattu", "tirupporur_green_mandi", 28.0),
        ("kanchipuram", "tirupporur_green_mandi", 66.0),
        ("tindivanam", "tirupporur_green_mandi", 92.0),

        # tindivanam_highway_mandi
        ("tirupporur", "tindivanam_highway_mandi", 92.0),
        ("chengalpattu", "tindivanam_highway_mandi", 65.0),
        ("kanchipuram", "tindivanam_highway_mandi", 74.0),
        ("tindivanam", "tindivanam_highway_mandi", 4.0)
    ]
    cur.executemany("INSERT INTO distance_matrix VALUES (?, ?, ?)", distances)

    # Initial sample listings for instant visual demo (Regular + Urgent Clearance)
    sample_listings = [
        (
            "Murugan (உழவர் முருகன்)",
            "+91 98412 11223",
            "paddy",
            2000.0,
            "tirupporur",
            "tn_civil_supplies_dpc",
            "Tamil Nadu Civil Supplies DPC",
            47000.0,
            1220.0,
            45780.0,
            0,
            None,
            0.0,
            "Sample simulated paddy lot from Tirupporur (Demo Listing)",
            "active",
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ),
        (
            "Arumugam (உழவர் ஆறுமுகம்)",
            "+91 94431 88990",
            "tomato",
            800.0,
            "chengalpattu",
            "chengalpattu_veg_mandi",
            "Chengalpattu Uzhavar Sandhai Aggregators",
            25200.0,
            592.0,
            24608.0,
            1,
            "அழுகும் தக்காளி - மழை காரணமாக 24 மணி நேரத்திற்குள் உடனடி தேவை (Perishable Harvest - Rain Risk)",
            10.0,
            "Urgent clearance sale lot with rapid cash preference (Demo Listing)",
            "active",
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
    ]
    cur.executemany("""
    INSERT INTO listings (
        farmer_name, farmer_phone, crop_code, quantity_kg, location,
        best_buyer_code, best_buyer_name, gross_amount, transport_cost, net_amount,
        is_urgent, urgency_reason, urgency_discount, notes, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sample_listings)

    # Seed initial active demo deal for instant deal pipeline demonstration
    sample_deal = (
        1,
        "tn_civil_supplies_dpc",
        "Tamil Nadu Civil Supplies DPC",
        "paddy",
        2000.0,
        "tirupporur",
        23.50,
        47000.0,
        1220.0,
        45780.0,
        0,
        "truck_dispatched",
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    cur.execute("""
    INSERT INTO deals (
        listing_id, buyer_code, buyer_name, crop_code, quantity_kg,
        farmer_location, price_per_kg, gross_amount, transport_cost,
        net_amount, is_urgent, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sample_deal)

    conn.commit()

def get_meta(conn=None):
    """Retrieves all metadata: crops, locations, and sample voice phrases."""
    close_at_end = False
    if conn is None:
        conn = get_connection()
        close_at_end = True

    cur = conn.cursor()
    cur.execute("SELECT * FROM crops ORDER BY code")
    crops = [dict(row) for row in cur.fetchall()]

    cur.execute("SELECT * FROM locations ORDER BY name_en")
    locations = [dict(row) for row in cur.fetchall()]

    sample_phrases = [
        {
            "lang": "ta",
            "text": "நெல் இரண்டாயிரம் கிலோ திருப்போரூர்",
            "crop": "paddy",
            "quantity_kg": 2000,
            "location": "tirupporur",
            "label_en": "2000 kg Paddy - Tirupporur",
            "label_ta": "2000 கிலோ நெல் - திருப்போரூர்"
        },
        {
            "lang": "en",
            "text": "ten ton sugarcane Chengalpattu",
            "crop": "sugarcane",
            "quantity_kg": 10000,
            "location": "chengalpattu",
            "label_en": "10 Ton Sugarcane - Chengalpattu",
            "label_ta": "10 டன் கரும்பு - செங்கல்பட்டு"
        },
        {
            "lang": "ta",
            "text": "கரும்பு ஐந்து டன் காஞ்சிபுரம்",
            "crop": "sugarcane",
            "quantity_kg": 5000,
            "location": "kanchipuram",
            "label_en": "5 Ton Sugarcane - Kanchipuram",
            "label_ta": "5 டன் கரும்பு - காஞ்சிபுரம்"
        },
        {
            "lang": "en",
            "text": "5000 kg paddy Tindivanam",
            "crop": "paddy",
            "quantity_kg": 5000,
            "location": "tindivanam",
            "label_en": "5000 kg Paddy - Tindivanam",
            "label_ta": "5000 கிலோ நெல் - திண்டிவனம்"
        },
        {
            "lang": "ta",
            "text": "தக்காளி 500 கிலோ செங்கல்பட்டு",
            "crop": "tomato",
            "quantity_kg": 500,
            "location": "chengalpattu",
            "label_en": "500 kg Tomato - Chengalpattu",
            "label_ta": "500 கிலோ தக்காளி - செங்கல்பட்டு"
        },
        {
            "lang": "en",
            "text": "two ton onion Tirupporur",
            "crop": "onion",
            "quantity_kg": 2000,
            "location": "tirupporur",
            "label_en": "2 Ton Onion - Tirupporur",
            "label_ta": "2 டன் வெங்காயம் - திருப்போரூர்"
        }
    ]

    result = {
        "crops": crops,
        "locations": locations,
        "sample_phrases": sample_phrases,
        "sample_notice": "Prices, distances and ratings are sample data for demonstration."
    }

    if close_at_end:
        conn.close()

    return result
