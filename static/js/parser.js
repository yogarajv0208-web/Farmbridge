/**
 * FarmBridge Client-Side Voice and Text Parser
 * Mirror of parser.py for ultra-fast, offline-capable sentence comprehension.
 */

const Parser = (function() {
  const CROP_PATTERNS = [
    { code: "chilli", name: "Chilli", keywords: ["பச்சை மிளகாய்", "மிளகாய்", "green chilli", "green chili", "chillies", "chilli", "chili", "milagai"] },
    { code: "sugarcane", name: "Sugarcane", keywords: ["கரும்புகள்", "கரும்பு", "sugarcane", "sugar cane", "karumbu", "cane"] },
    { code: "potato", name: "Potato", keywords: ["உருளைக்கிழங்கு", "உருளை", "potatoes", "potato", "urulaikizhangu", "urulai", "aloo"] },
    { code: "tomato", name: "Tomato", keywords: ["தக்காளிப்பழம்", "தக்காளி", "tomatoes", "tomato", "thakkali"] },
    { code: "onion", name: "Onion", keywords: ["சின்ன வெங்காயம்", "பெரிய வெங்காயம்", "வெங்காயம்", "onions", "onion", "vengayam"] },
    { code: "banana", name: "Banana", keywords: ["வாழைப்பழம்", "வாழைத்தார்", "வாழை", "bananas", "banana", "vazhaipazham", "vazhai"] },
    { code: "brinjal", name: "Brinjal", keywords: ["கத்தரிக்காய்", "கத்தரி", "brinjals", "brinjal", "eggplant", "aubergine", "katharikkai"] },
    { code: "paddy", name: "Paddy", keywords: ["நெற்பயிர்", "நெல்மூட்டை", "நெல்லு", "நெல்", "paddy", "rice", "dhan"] }
  ];

  const LOCATION_PATTERNS = [
    { code: "tirupporur", name: "Tirupporur", keywords: ["திருப்போரூர்", "திருப்பொருர்", "tirupporur", "thirupporur", "thiruporur", "tiruporur"] },
    { code: "chengalpattu", name: "Chengalpattu", keywords: ["செங்கல்பட்டு", "செங்கல்பட்", "chengalpattu", "chengalpet", "chengalpettu", "chengai"] },
    { code: "kanchipuram", name: "Kanchipuram", keywords: ["காஞ்சிபுரம்", "காஞ்சி", "kanchipuram", "kancheepuram", "kanchee", "kanchi"] },
    { code: "tindivanam", name: "Tindivanam", keywords: ["திண்டிவனம்", "tindivanam", "thindivanam", "dindivanam"] }
  ];

  const TAMIL_NUM_WORDS = {
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
    "தொள்ளாயிரம்": 900,
    "எண்ணூறு": 800,
    "எழுநூறு": 700,
    "அறுநூறு": 600,
    "ஐந்நூறு": 500,
    "நானூறு": 400,
    "முந்நூறு": 300,
    "இருநூறு": 200,
    "நூறு": 100,
    "தொண்ணூறு": 90,
    "எண்பது": 80,
    "எழுபது": 70,
    "அறுபது": 60,
    "ஐம்பது": 50,
    "நாற்பது": 40,
    "முப்பது": 30,
    "இருபது": 20,
    "பத்து": 10,
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
    "ஒன்றரை": 1.5,
    "இரண்டரை": 2.5,
    "அரை": 0.5
  };

  const ENGLISH_NUM_WORDS = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
    twenty: 20, thirty: 30, forty: 40, fifty: 50,
    sixty: 60, seventy: 70, eighty: 80, ninety: 90,
    hundred: 100, thousand: 1000, half: 0.5
  };

  const UNIT_MULTIPLIERS = {
    ton: 1000, tons: 1000, tonne: 1000, tonnes: 1000,
    "டன்": 1000, "டன்கள்": 1000,
    quintal: 100, quintals: 100, "குவிண்டால்": 100,
    kg: 1, kgs: 1, kilo: 1, kilos: 1, kilogram: 1, kilograms: 1,
    "கிலோ": 1, "கிலோகிராம்": 1
  };

  function clean(str) {
    if (!str) return "";
    let s = str.toLowerCase();
    // Merge thousands commas like 2,000 -> 2000
    s = s.replace(/(\d+),(\d+)/g, "$1$2");
    // Protect decimal points like 2.5 -> 2_DEC_5
    s = s.replace(/(\d+)\.(\d+)/g, "$1_DEC_$2");
    // Strip other punctuation
    s = s.replace(/[,;:\.!\?\"']/g, " ");
    // Restore decimal points
    s = s.replace(/_DEC_/g, ".");
    return s.replace(/\s+/g, " ").trim();
  }

  function extractCrop(text) {
    const lowered = text.toLowerCase();
    for (const item of CROP_PATTERNS) {
      for (const kw of item.keywords) {
        // Regex with boundaries
        const regex = new RegExp(`(^|\\s|\\b)${escapeReg(kw)}(\\b|\\s|$)`, "i");
        if (regex.test(lowered)) {
          return { code: item.code, name: item.name, matched: kw };
        }
      }
    }
    return null;
  }

  function extractLocation(text) {
    const lowered = text.toLowerCase();
    for (const item of LOCATION_PATTERNS) {
      for (const kw of item.keywords) {
        const regex = new RegExp(`(^|\\s|\\b)${escapeReg(kw)}(\\b|\\s|$)`, "i");
        if (regex.test(lowered)) {
          return { code: item.code, name: item.name, matched: kw };
        }
      }
    }
    return null;
  }

  function extractQuantity(text) {
    const lowered = clean(text);

    // 1. Digit + Unit
    const unitRegex = "(ton|tons|tonne|tonnes|டன்|டன்கள்|quintal|quintals|குவிண்டால்|kg|kgs|kilo|kilos|kilogram|kilograms|கிலோ|கிலோகிராம்)";
    let match = lowered.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unitRegex}`, "i"));
    if (match) {
      const num = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      const mult = UNIT_MULTIPLIERS[unit] || 1;
      return num * mult;
    }

    // Reversed: Unit + Digit
    match = lowered.match(new RegExp(`${unitRegex}\\s*(\\d+(?:\\.\\d+)?)`, "i"));
    if (match) {
      const unit = match[1].toLowerCase();
      const num = parseFloat(match[2]);
      const mult = UNIT_MULTIPLIERS[unit] || 1;
      return num * mult;
    }

    // Determine if text has a unit word anywhere
    let unitMult = 1;
    for (const [u, mult] of Object.entries(UNIT_MULTIPLIERS)) {
      if (new RegExp(`(^|\\s|\\b)${escapeReg(u)}(\\b|\\s|$)`, "i").test(lowered)) {
        unitMult = mult;
        break;
      }
    }

    // 2. Tamil Number words
    for (const [word, val] of Object.entries(TAMIL_NUM_WORDS)) {
      if (lowered.includes(word)) {
        return val * unitMult;
      }
    }

    // 3. English Number words
    const words = lowered.split(" ");
    let totalEn = 0;
    let currentEn = 0;
    let foundEn = false;

    for (const w of words) {
      if (ENGLISH_NUM_WORDS[w] !== undefined) {
        const val = ENGLISH_NUM_WORDS[w];
        foundEn = true;
        if (val === 100) {
          currentEn = (currentEn || 1) * 100;
        } else if (val === 1000) {
          currentEn = (currentEn || 1) * 1000;
          totalEn += currentEn;
          currentEn = 0;
        } else {
          currentEn += val;
        }
      }
    }

    if (foundEn) {
      const parsedEn = totalEn + currentEn;
      if (parsedEn > 0) {
        return parsedEn * unitMult;
      }
    }

    // 4. Standalone Digit
    match = lowered.match(/\b(\d+(?:\.\d+)?)\b/);
    if (match) {
      return parseFloat(match[1]) * unitMult;
    }

    return null;
  }

  function escapeReg(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function parseSentence(text) {
    if (!text || !text.trim()) {
      return { success: false, missing: ["crop", "quantity", "location"] };
    }

    const crop = extractCrop(text);
    const loc = extractLocation(text);
    const qty = extractQuantity(text);

    const missing = [];
    if (!crop) missing.push("crop");
    if (!qty) missing.push("quantity");
    if (!loc) missing.push("location");

    return {
      success: missing.length === 0,
      input_text: text.trim(),
      crop: crop ? crop.code : null,
      crop_name: crop ? crop.name : null,
      quantity_kg: qty,
      location: loc ? loc.code : null,
      location_name: loc ? loc.name : null,
      missing_fields: missing,
      confidence: Math.max(0.1, 1.0 - (missing.length * 0.3))
    };
  }

  return {
    parse: parseSentence,
    extractCrop,
    extractLocation,
    extractQuantity
  };
})();
