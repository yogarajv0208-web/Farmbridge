"""
Natural language voice and text parser for FarmBridge.
Extracts crop, quantity (in kg), and location from Tamil and English spoken/typed sentences.
"""

import re
from typing import Dict, Any, Optional

CROP_PATTERNS = [
    # code, canonical_name, list of regex/substring matches (sorted longest first)
    ("chilli", "Chilli", ["பச்சை மிளகாய்", "மிளகாய்", "green chilli", "green chili", "chillies", "chilli", "chili", "milagai"]),
    ("sugarcane", "Sugarcane", ["கரும்புகள்", "கரும்பு", "sugarcane", "sugar cane", "karumbu", "cane"]),
    ("potato", "Potato", ["உருளைக்கிழங்கு", "உருளை", "potatoes", "potato", "urulaikizhangu", "urulai", "aloo"]),
    ("tomato", "Tomato", ["தக்காளிப்பழம்", "தக்காளி", "tomatoes", "tomato", "thakkali"]),
    ("onion", "Onion", ["சின்ன வெங்காயம்", "பெரிய வெங்காயம்", "வெங்காயம்", "onions", "onion", "vengayam"]),
    ("banana", "Banana", ["வாழைப்பழம்", "வாழைத்தார்", "வாழை", "bananas", "banana", "vazhaipazham", "vazhai"]),
    ("brinjal", "Brinjal", ["கத்தரிக்காய்", "கத்தரி", "brinjals", "brinjal", "eggplant", "aubergine", "katharikkai"]),
    ("paddy", "Paddy", ["நெற்பயிர்", "நெல்மூட்டை", "நெல்லு", "நெல்", "paddy", "rice", "dhan"])
]

LOCATION_PATTERNS = [
    ("tirupporur", "Tirupporur", ["திருப்போரூர்", "திருப்பொருர்", "tirupporur", "thirupporur", "thiruporur", "tiruporur"]),
    ("chengalpattu", "Chengalpattu", ["செங்கல்பட்டு", "செங்கல்பட்", "chengalpattu", "chengalpet", "chengalpettu", "chengai"]),
    ("kanchipuram", "Kanchipuram", ["காஞ்சிபுரம்", "காஞ்சி", "kanchipuram", "kancheepuram", "kanchee", "kanchi"]),
    ("tindivanam", "Tindivanam", ["திண்டிவனம்", "tindivanam", "thindivanam", "dindivanam"])
]

TAMIL_NUM_WORDS = {
    # Compounds & thousands
    "இருபதாயிரம்": 20000,
    "பத்தாயிரம்": 10000,
    "ஒன்பதாயிரம்": 9000,
    "எட்டாயிரம்": 8000,
    "ஏழாயிரம்": 7000,
    "ஆறாயிரம்": 6000,
    "ஐந்தாயிரம்": 5000,
    "அஞ்சாயிரம்": 5000,
    "நாலாயிரம்": 4000,
    "நான்காயிரம்": 4000,
    "மூவாயிரம்": 3000,
    "இரண்டாயிரம்": 2000,
    "ரெண்டாயிரம்": 2000,
    "ஆயிரம்": 1000,

    # Hundreds
    "தொள்ளாயிரம்": 900,
    "எண்ணூறு": 800,
    "எழுநூறு": 700,
    "அறுநூறு": 600,
    "ஐந்நூறு": 500,
    "நானூறு": 400,
    "முந்நூறு": 300,
    "இருநூறு": 200,
    "நூறு": 100,

    # Tens
    "தொண்ணூறு": 90,
    "எண்பது": 80,
    "எழுபது": 70,
    "அறுபது": 60,
    "ஐம்பது": 50,
    "நாற்பது": 40,
    "முப்பது": 30,
    "இருபது": 20,
    "பத்து": 10,

    # Units
    "ஒன்பது": 9,
    "எட்டு": 8,
    "ஏழு": 7,
    "ஆறு": 6,
    "ஐந்து": 5,
    "அஞ்சு": 5,
    "நான்கு": 4,
    "நாலு": 4,
    "மூன்று": 3,
    "மூணு": 3,
    "இரண்டு": 2,
    "ரெண்டு": 2,
    "ஒன்று": 1,
    "ஒரு": 1,

    # Fractions
    "ஒன்றரை": 1.5,
    "இரண்டரை": 2.5,
    "அரை": 0.5
}

ENGLISH_NUM_WORDS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15,
    "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19,
    "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
    "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90,
    "hundred": 100, "thousand": 1000,
    "half": 0.5
}

UNIT_MULTIPLIERS = {
    "ton": 1000.0,
    "tons": 1000.0,
    "tonne": 1000.0,
    "tonnes": 1000.0,
    "டன்": 1000.0,
    "டன்கள்": 1000.0,
    "quintal": 100.0,
    "quintals": 100.0,
    "குவிண்டால்": 100.0,
    "kg": 1.0,
    "kgs": 1.0,
    "kilo": 1.0,
    "kilos": 1.0,
    "kilogram": 1.0,
    "kilograms": 1.0,
    "கிலோ": 1.0,
    "கிலோகிராம்": 1.0
}

def clean_text(text: str) -> str:
    """Normalizes text by preserving decimals, merging thousands commas, and removing punctuation."""
    if not text:
        return ""
    text = text.lower()
    # Merge thousands commas like 2,000 -> 2000
    text = re.sub(r"(\d+),(\d+)", r"\1\2", text)
    # Protect decimal dots like 2.5 -> 2_DEC_5
    text = re.sub(r"(\d+)\.(\d+)", r"\1_DEC_\2", text)
    # Remove all other punctuation
    text = re.sub(r"[,;:\.!\?\"']", " ", text)
    # Restore decimal points
    text = text.replace("_DEC_", ".")
    text = re.sub(r"\s+", " ", text).strip()
    return text

def extract_crop(text: str) -> Optional[Dict[str, str]]:
    """Extracts crop code and name from text."""
    lowered = text.lower()
    for code, name, keywords in CROP_PATTERNS:
        for kw in keywords:
            # Word boundary check for english, substring match for tamil
            if re.search(r"(?:^|\s|\b)" + re.escape(kw) + r"(?:\b|\s|$)", lowered):
                return {"code": code, "name": name, "matched": kw}
    return None

def extract_location(text: str) -> Optional[Dict[str, str]]:
    """Extracts farmer location code and name from text."""
    lowered = text.lower()
    for code, name, keywords in LOCATION_PATTERNS:
        for kw in keywords:
            if re.search(r"(?:^|\s|\b)" + re.escape(kw) + r"(?:\b|\s|$)", lowered):
                return {"code": code, "name": name, "matched": kw}
    return None

def extract_quantity_kg(text: str) -> Optional[float]:
    """
    Extracts quantity converted to kg.
    Handles:
    - Digits with explicit unit: 10 ton -> 10000, 2000 kg -> 2000
    - Tamil word phrases: "இரண்டாயிரம் கிலோ" -> 2000, "பத்து டன்" -> 10000
    - English word phrases: "ten ton" -> 10000, "two thousand kg" -> 2000
    - Standalone numbers with trailing or preceding unit words.
    """
    lowered = clean_text(text)

    # 1. Look for Digit + Unit (e.g., "10 ton", "2000 kg", "2.5 டன்", "1000கிலோ")
    unit_regex = r"(ton|tons|tonne|tonnes|டன்|டன்கள்|quintal|quintals|குவிண்டால்|kg|kgs|kilo|kilos|kilogram|kilograms|கிலோ|கிலோகிராம்)"
    
    # Digit followed by unit
    m = re.search(r"(\d+(?:\.\d+)?)\s*" + unit_regex, lowered)
    if m:
        num = float(m.group(1))
        unit = m.group(2)
        mult = UNIT_MULTIPLIERS.get(unit, 1.0)
        return num * mult

    # Unit preceded by digit (rare) or reversed
    m = re.search(unit_regex + r"\s*(\d+(?:\.\d+)?)", lowered)
    if m:
        unit = m.group(1)
        num = float(m.group(2))
        mult = UNIT_MULTIPLIERS.get(unit, 1.0)
        return num * mult

    # 2. Check for Tamil number words
    # Check if a unit multiplier is present in the text
    unit_mult = 1.0
    for u, mult in UNIT_MULTIPLIERS.items():
        if re.search(r"(?:^|\s|\b)" + re.escape(u) + r"(?:\b|\s|$)", lowered):
            unit_mult = mult
            break

    # Look for known Tamil compound words (e.g. "இரண்டாயிரம்", "ஐந்நூறு", "பத்தாயிரம்")
    for word, val in TAMIL_NUM_WORDS.items():
        if word in lowered:
            # Check for multiple word combination like "பத்து டன்"
            # If word is a small number (e.g. பத்து = 10) and followed by டன், mult is already 1000
            # If word itself is "இரண்டாயிரம்" (2000) and unit is kg or none, value is 2000
            # Special case: "இரண்டு டன்" -> val=2, unit_mult=1000 -> 2000
            return float(val * unit_mult)

    # 3. Check for English number words
    words = lowered.split()
    total_en = 0.0
    current_en = 0.0
    found_en_number = False

    for w in words:
        if w in ENGLISH_NUM_WORDS:
            val = ENGLISH_NUM_WORDS[w]
            found_en_number = True
            if val == 100:
                current_en = (current_en or 1) * 100
            elif val == 1000:
                current_en = (current_en or 1) * 1000
                total_en += current_en
                current_en = 0
            else:
                current_en += val

    if found_en_number:
        parsed_en = total_en + current_en
        if parsed_en > 0:
            return float(parsed_en * unit_mult)

    # 4. Standalone digits (e.g., "5000 paddy Tindivanam")
    m = re.search(r"\b(\d+(?:\.\d+)?)\b", lowered)
    if m:
        num = float(m.group(1))
        return float(num * unit_mult)

    return None

def parse_voice_sentence(text: str, default_lang: str = "ta") -> Dict[str, Any]:
    """
    Main parser entrypoint.
    Returns parsed crop, quantity_kg, location, and confidence indicators.
    """
    if not text or not text.strip():
        return {
            "success": False,
            "error": "empty_input",
            "message_en": "Please provide a sentence to parse.",
            "message_ta": "விளக்க வாக்கியத்தை உள்ளிடவும்."
        }

    raw_text = text.strip()
    crop_info = extract_crop(raw_text)
    loc_info = extract_location(raw_text)
    quantity_kg = extract_quantity_kg(raw_text)

    # Missing components tracking
    missing = []
    if not crop_info:
        missing.append("crop")
    if not quantity_kg:
        missing.append("quantity")
    if not loc_info:
        missing.append("location")

    confidence = 1.0 - (len(missing) * 0.3)
    if confidence < 0:
        confidence = 0.1

    return {
        "success": len(missing) == 0,
        "input_text": raw_text,
        "crop": crop_info["code"] if crop_info else None,
        "crop_name": crop_info["name"] if crop_info else None,
        "quantity_kg": quantity_kg,
        "location": loc_info["code"] if loc_info else None,
        "location_name": loc_info["name"] if loc_info else None,
        "missing_fields": missing,
        "confidence": round(confidence, 2)
    }
