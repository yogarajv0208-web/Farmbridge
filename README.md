# 🌾 FarmBridge (ஃபார்ம்பிரிட்ஜ்)

> **Direct Farmer-to-Buyer Marketplace Prototype for Tamil Nadu**  
> Serving Paddy (நெல்), Sugarcane (கரும்பு), and fresh produce (Tomato, Onion, Potato, Banana, Chilli, Brinjal).  
> *All data is clearly labelled sample data for demonstration.*

---

## 🌟 Key Features

### 🌐 Bilingual Interface (தமிழ் / English)
- **Instant Language Switcher**: Toggles the entire user interface and speech recognition/synthesis between **தமிழ்** and **English**.
- **Persistent Preferences**: Remembers the language and audio preferences across browser sessions using `localStorage`.

### 🎙️ Voice Input & Natural Language Parsing
- **One-Sentence Voice Prompt**: Farmers can speak crop, quantity, and location in a single natural sentence.
  - *Tamil*: `"நெல் இரண்டாயிரம் கிலோ திருப்போரூர்"` or `"கரும்பு பத்து டன் செங்கல்பட்டு"`
  - *English*: `"ten ton sugarcane Chengalpattu"` or `"5000 kg paddy Tindivanam"`
- **Browser Speech Recognition**:
  - Uses `ta-IN` for Tamil (with fallback to `ta-LK`, `ta-SG`).
  - Uses `en-IN` for English (with fallback to `en-US`, `en-GB`).
- **Comprehensive Number & Unit Comprehension**:
  - Direct digits: `2000 kg`, `10 ton`, `5.5 tonne`, `500 கிலோ`
  - Tamil number words: `இரண்டாயிரம்` (2000), `பத்து` (10), `ஐந்நூறு` (500), `ஆயிரம்` (1000), `ஒன்றரை` (1.5)
  - English number words: `ten`, `two thousand`, `five hundred`
  - Unit conversions: `1 ton` / `டன்` = `1000 kg`, `1 quintal` / `குவிண்டால்` = `100 kg`.
- **Live Editable Transcript**: Shows speech as it's spoken; users can also type or use their keyboard dictation.
- **Diagnostics & Error Handling**:
  - 🚫 **Mic Blocked**: Direct link and guidance to open site in a new tab or enable permissions.
  - 🎤 **No Mic Detected**: Prompts user to type in the box.
  - 🌐 **No Internet**: Notifies about speech recognition connectivity issues.
  - 🔇 **Nothing Heard**: Suggests speaking closer to the mic or trying demo queries.
  - ⚠️ **Unsupported Browser**: Helpful alert for browsers lacking Web Speech API.
- **"Try Sample Voice" Button**: Cycles through curated sample queries in Tamil and English.
- **Speech Synthesis (TTS) Read-Aloud**:
  - Reads the best offer aloud: e.g. *"சிறந்த சலுகை: காஞ்சி பொன்னி நவீன அரிசி ஆலை. போக்குவரத்து கழித்து உங்கள் நிகர வருமானம் ₹45,780."*
  - Dedicated **Voice Replies ON / OFF** toggle button.

### 📊 Three Core Result Sections
1. **Direct Buyers Cards**:
   - Shows **Name**, **Place**, **Distance (km)**, **Rating (stars & review count)**, **Payment Speed** (e.g. *Same Day Cash*, *Within 24 Hours*), **Price per kg**, and **"Best Offer" badge**.
   - Filters buyers strictly by crop capabilities:
     - **Paddy**: Modern Rice Mills, Direct Procurement Centres (DPC), Grain Traders.
     - **Sugarcane**: Cooperative Sugar Mills, Traditional Jaggery Units (நாட்டுச் சர்க்கரை).
     - **Vegetables & Fruits**: Wholesale Mandis, Uzhavar Sandhai Aggregators, Retailer Collectives.
2. **Offer Comparison (Ranked Visual Bars)**:
   - Ranked horizontal bars representing net payout after transport.
   - Exact deduction breakdown: e.g. `"₹47,000 − ₹1,220 transport (30 km)"` → `= ₹45,780 Net`.
   - Top offer highlighted with gold turmeric accents.
3. **Estimated Earnings (Hero Card)**:
   - Highlighted card for the winning buyer.
   - Shows **Gross Crop Value**, **Transport Cost**, **Net Payout**, **Effective Rate / kg**, and **Advantage over lowest offer** (e.g. `"₹3,450 more than lowest offer!"`).
   - Includes **"Save My Listing"** button to store the lot in the SQLite database.

### 🛰️ Live GPS Location & Dispatched Vehicle Tracking
- **Farmer Live GPS Detection**: One-tap GPS detection matches the farmer's browser coordinates to the nearest Tamil Nadu agricultural hub (Tirupporur, Chengalpattu, Kanchipuram, Tindivanam).
- **Farmer ↔ Buyer Coordinate Telemetry**: Interactive live GPS tracker displays both the **Farmer's Farm Location** and **Buyer's Facility / Mill Location** with Google Maps route links.
- **Dispatched Vehicle Route Tracker**: Live highway route progress bar, interpolated GPS coordinates, vehicle registration (`🚚 TN-21-AX-xxxx`), remaining distance, and dynamic ETA simulation across deal milestones (`Confirmed → Truck Dispatched → Quality Inspected → Payment Completed`).

### 🏆 Trust & Credit Points + Verified Phone Entry
- **Farmer & Buyer Credit Points**: Dynamic trust point badges (`⭐` / `🏆`) awarded for verified buyer ratings and timely payment completion feedback.
- **Strict Indian Phone Formatting**: Clean `🇮🇳 +91` prefix with automatic 10-digit sanitization across login, header profile chip, and listing save forms.

---

## 📐 Formulas & Sample Data Specifications

### Transport Cost Formula
$$\text{Transport Cost} = ₹200 + \text{km} \times (₹10 + \text{quantity\_kg} \times 0.012)$$

*Example*:
- Crop: Paddy (2,000 kg)
- Distance: 30 km
$$\text{Cost} = 200 + 30 \times (10 + 2000 \times 0.012) = 200 + 30 \times (10 + 24) = 200 + 30 \times 34 = 200 + 1020 = ₹1,220$$
- At ₹23.50/kg, Gross = ₹47,000
- Net = ₹47,000 − ₹1,220 = **₹45,780**

### Prices per kg
- **Paddy (நெல்)**: ₹22.80 – ₹23.70 / kg
- **Sugarcane (கரும்பு)**: ₹3.50 – ₹3.90 / kg *(prices under ₹10 always display 2 decimals, e.g. ₹3.85 / kg)*
- **Vegetables & Fruits**: ₹22.00 – ₹65.00 / kg

### Hub Locations & Distance Matrix
- **Tirupporur (திருப்போரூர்)**
- **Chengalpattu (செங்கல்பட்டு)**
- **Kanchipuram (காஞ்சிபுரம்)**
- **Tindivanam (திண்டிவனம்)**

---

## 🛠️ Architecture & Technology Stack

- **Zero External Dependencies**: Built strictly using the **Python standard library** (`http.server`, `sqlite3`, `json`, `urllib`). No `pip install` required.
- **SQLite Database (`farmbridge.db`)**:
  - Automatically initialized on startup with sample buyers, crops, locations, and distance matrices.
  - Stores farmer listings (`listings`) and deal commitments (`deals`).
- **Offline / Standalone Fallback**:
  - If the server is offline or unreachable, the frontend seamlessly switches to the bundled client-side sample engine (`sample_data.js` & `parser.js`).
- **Responsive Mobile-First UI**:
  - Large touch targets (min 48px height).
  - Green (`#1b5e20`, `#2e7d32`) and Turmeric Gold (`#f57f17`, `#ffb300`) palette.
  - Light & Dark mode support.
  - Tamil typography with `Noto Sans Tamil`.
  - Zero horizontal overflow on smartphones.

---

## 🚀 Getting Started

### Method 1: Instant Standalone File (No Server, No Localhost Needed!)
Simply double-click:
- `index.html` or `FarmBridge.html`
- Or double-click `open_farmbridge.bat`

This opens FarmBridge immediately in your browser via `file:///` with full offline calculations, voice inputs, live GPS & vehicle tracking, sample sentences, and language switching. Zero setup required!

---

### Method 2: Launch via Local Python Server
Run with Python 3:
```bash
python server.py
```
Or double-click `run.bat` on Windows.

Output:
```
==================================================
  [FarmBridge] Server Running on port 8000
  Localhost: http://localhost:8000
  Direct IP: http://127.0.0.1:8000
  Static Directory: .../static
  Database: farmbridge.db initialized
==================================================
```

Open your browser to:
- [http://localhost:8000](http://localhost:8000)
- [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 🧪 Running Unit Tests

The test suite validates the transport formula, decimal tons, comma quantities, voice parser (Tamil & English), database queries, and REST API endpoints:
```bash
python -m unittest tests/test_farmbridge.py
```

All 30 unit and integration tests validate end-to-end functionality.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & app status |
| `GET` | `/api/meta` | Supported crops, locations, and sample voice phrases |
| `GET` | `/api/buyers?crop={crop}&location={loc}` | List buyers filtered by crop & calculated distances |
| `POST` | `/api/parse-voice` | Parses natural language sentence into `{crop, quantity_kg, location}` |
| `POST` | `/api/offers` | Computes ranked offers, transport deductions, and best offer |
| `GET` | `/api/listings` | Retrieves saved farmer listings |
| `POST` | `/api/listings` | Saves a new farmer listing to SQLite |
| `GET` | `/api/deals` | Retrieves confirmed buyer deals |
| `POST` | `/api/deals` | Creates a confirmed buyer deal in SQLite |
| `POST` | `/api/deals/status` | Updates deal tracking milestone (`truck_dispatched`, `quality_inspected`, `payment_completed`) |

---

## ⚖️ Disclaimer Note
*Prices, distances and ratings are sample data for demonstration.*  
*விலைகள், தூரங்கள் மற்றும் மதிப்பீடுகள் மாதிரித் தரவு மட்டுமே.*
