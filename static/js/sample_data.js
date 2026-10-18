/**
 * FarmBridge Sample Dataset & Offline Calculation Fallback
 * Guarantees zero-failure demo even if disconnected from Python backend.
 */

const SAMPLE_DATA = {
  notice: "Prices, distances and ratings are sample data for demonstration.",
  notice_ta: "விலைகள், தூரங்கள் மற்றும் மதிப்பீடுகள் மாதிரித் தரவு மட்டுமே.",

  buyers: [
    // Paddy
    {
      code: "kanchi_ponni_rice_mill",
      name_en: "Kanchi Ponni Modern Rice Mill",
      name_ta: "காஞ்சி பொன்னி நவீன அரிசி ஆலை",
      type_en: "Modern Rice Mill",
      type_ta: "நவீன அரிசி ஆலை",
      location_en: "Kanchipuram",
      location_ta: "காஞ்சிபுரம்",
      rating: 4.8,
      reviews: 128,
      payment_en: "Within 24 Hours (Bank/UPI)",
      payment_ta: "24 மணி நேரத்திற்குள் (வங்கி/UPI)",
      phone: "+91 94431 23456",
      crops: { paddy: 23.70 }
    },
    {
      code: "tn_civil_supplies_dpc",
      name_en: "Tamil Nadu Civil Supplies DPC",
      name_ta: "தமிழ்நாடு நுகர்பொருள் நேரடி நெல் கொள்முதல் நிலையம் (DPC)",
      type_en: "Direct Procurement Centre",
      type_ta: "நேரடி கொள்முதல் நிலையம்",
      location_en: "Chengalpattu",
      location_ta: "செங்கல்பட்டு",
      rating: 4.6,
      reviews: 215,
      payment_en: "Direct Bank Credit (MSP)",
      payment_ta: "நேரடி வங்கிக் கணக்கு (அரசு விலை)",
      phone: "+91 44 2742 8899",
      crops: { paddy: 23.50 }
    },
    {
      code: "tirupporur_grain_traders",
      name_en: "Tirupporur Uzhavar Grain Traders",
      name_ta: "திருப்போரூர் உழவர் தானிய வியாபாரி",
      type_en: "Grain Trader",
      type_ta: "தானிய வியாபாரி",
      location_en: "Tirupporur",
      location_ta: "திருப்போரூர்",
      rating: 4.4,
      reviews: 76,
      payment_en: "Same Day Spot Cash",
      payment_ta: "அன்றே உடனடி ரொக்கம்",
      phone: "+91 98412 87654",
      crops: { paddy: 22.90 }
    },
    {
      code: "tindivanam_lakshmi_mill",
      name_en: "Tindivanam Lakshmi Agro Rice Mill",
      name_ta: "திண்டிவனம் லக்ஷ்மி அரிசி ஆலை",
      type_en: "Private Rice Mill",
      type_ta: "தனியார் அரிசி ஆலை",
      location_en: "Tindivanam",
      location_ta: "திண்டிவனம்",
      rating: 4.5,
      reviews: 94,
      payment_en: "Within 48 Hours",
      payment_ta: "48 மணி நேரத்திற்குள்",
      phone: "+91 94438 55432",
      crops: { paddy: 23.40 }
    },
    {
      code: "maduranthakam_delta_traders",
      name_en: "Maduranthakam Delta Agro Traders",
      name_ta: "மதுராந்தகம் டெல்டா அக்ரோ டிரேடர்ஸ்",
      type_en: "Grain Aggregator",
      type_ta: "மொத்த தானிய கொள்முதல்",
      location_en: "Maduranthakam",
      location_ta: "மதுராந்தகம்",
      rating: 4.3,
      reviews: 62,
      payment_en: "Instant UPI Transfer",
      payment_ta: "உடனடி UPI பரிமாற்றம்",
      phone: "+91 94444 33211",
      crops: { paddy: 23.10 }
    },

    // Sugarcane
    {
      code: "padalam_sugar_mills",
      name_en: "Padalam Cooperative Sugar Mills Ltd",
      name_ta: "படாளம் கூட்டுறவு சர்க்கரை ஆலை",
      type_en: "Cooperative Sugar Mill",
      type_ta: "கூட்டுறவு சர்க்கரை ஆலை",
      location_en: "Padalam (Chengalpattu)",
      location_ta: "படாளம் (செங்கல்பட்டு)",
      rating: 4.8,
      reviews: 192,
      payment_en: "Bank Transfer within 48 Hours",
      payment_ta: "48 மணி நேரத்தில் வங்கிப் பரிமாற்றம்",
      phone: "+91 44 2756 1234",
      crops: { sugarcane: 3.90 }
    },
    {
      code: "cheyyar_coop_sugar_mill",
      name_en: "Cheyyar Co-operative Sugar Mill",
      name_ta: "செய்யாறு கூட்டுறவு சர்க்கரை ஆலை",
      type_en: "Sugar Mill",
      type_ta: "சர்க்கரை ஆலை",
      location_en: "Cheyyar (Near Kanchi)",
      location_ta: "செய்யாறு (காஞ்சிபுரம் அருகில்)",
      rating: 4.7,
      reviews: 185,
      payment_en: "Govt Rate via Bank in 3-5 Days",
      payment_ta: "வங்கி கணக்கில் 3-5 நாட்களில்",
      phone: "+91 4182 223456",
      crops: { sugarcane: 3.85 }
    },
    {
      code: "tirupporur_nattu_sakkarai",
      name_en: "Tirupporur Traditional Jaggery & Cane Unit",
      name_ta: "திருப்போரூர் நாட்டுச் சர்க்கரை & வெல்ல ஆலை",
      type_en: "Traditional Jaggery Unit",
      type_ta: "நாட்டுச் சர்க்கரை & வெல்லத் தயாரிப்பு",
      location_en: "Tirupporur",
      location_ta: "திருப்போரூர்",
      rating: 4.9,
      reviews: 88,
      payment_en: "Spot Cash Payment",
      payment_ta: "உடனடி நேரடி ரொக்கம்",
      phone: "+91 98401 56789",
      crops: { sugarcane: 3.75 }
    },
    {
      code: "tindivanam_cane_cluster",
      name_en: "Tindivanam Organic Cane & Jaggery Cluster",
      name_ta: "திண்டிவனம் இயற்கை கரும்பு & வெல்ல மையம்",
      type_en: "Jaggery & Cane Unit",
      type_ta: "வெல்லம் தயாரிப்பு கூடம்",
      location_en: "Tindivanam",
      location_ta: "திண்டிவனம்",
      rating: 4.4,
      reviews: 54,
      payment_en: "Same Day UPI / Cash",
      payment_ta: "அன்றே UPI / ரொக்கம்",
      phone: "+91 94421 98765",
      crops: { sugarcane: 3.65 }
    },
    {
      code: "kanchi_bio_sugar",
      name_en: "Kanchi Bio-Cane Agro Processing",
      name_ta: "காஞ்சி பயோ கரும்பு பதப்படுத்துதல்",
      type_en: "Sugar & Cane Processing",
      type_ta: "கரும்பு பதப்படுத்துதல் ஆலை",
      location_en: "Kanchipuram",
      location_ta: "காஞ்சிபுரம்",
      rating: 4.3,
      reviews: 71,
      payment_en: "Within 3 Days",
      payment_ta: "3 நாட்களுக்குள்",
      phone: "+91 94432 11223",
      crops: { sugarcane: 3.70 }
    },

    // Vegetables & Fruits
    {
      code: "chengalpattu_uzhavar_aggregator",
      name_en: "Chengalpattu Uzhavar Sandhai Aggregator",
      name_ta: "செங்கல்பட்டு உழவர் சந்தை மொத்த கொள்முதல்",
      type_en: "Farmer Market Aggregator",
      type_ta: "உழவர் சந்தை கூட்டமைப்பு",
      location_en: "Chengalpattu",
      location_ta: "செங்கல்பட்டு",
      rating: 4.8,
      reviews: 340,
      payment_en: "Instant UPI / Spot Cash",
      payment_ta: "உடனடி UPI / ரொக்கம்",
      phone: "+91 94440 66778",
      crops: { tomato: 34.50, onion: 42.00, potato: 28.00, banana: 45.00, chilli: 62.00, brinjal: 31.00 }
    },
    {
      code: "koyambedu_kanchi_hub",
      name_en: "Koyambedu Wholesale Connect - Kanchi Hub",
      name_ta: "கோயம்பேடு மொத்த விற்பனை - காஞ்சி மையம்",
      type_en: "Wholesale Mandi",
      type_ta: "மொத்த காய்கறி மண்டி",
      location_en: "Kanchipuram",
      location_ta: "காஞ்சிபுரம்",
      rating: 4.7,
      reviews: 420,
      payment_en: "Same Day Cash",
      payment_ta: "அன்றே நேரடி ரொக்கம்",
      phone: "+91 98402 33445",
      crops: { tomato: 36.00, onion: 44.50, potato: 29.50, banana: 47.00, chilli: 64.50, brinjal: 33.00 }
    },
    {
      code: "tirupporur_green_mandi",
      name_en: "Tirupporur Green Veg & Fruit Mandi",
      name_ta: "திருப்போரூர் பசுமை காய்கறி மண்டி",
      type_en: "Retailer Collective",
      type_ta: "சில்லறை விற்பனையாளர் கூட்டமைப்பு",
      location_en: "Tirupporur",
      location_ta: "திருப்போரூர்",
      rating: 4.5,
      reviews: 96,
      payment_en: "Instant UPI / Bank",
      payment_ta: "உடனடி UPI / வங்கி",
      phone: "+91 98840 99881",
      crops: { tomato: 33.00, onion: 39.50, potato: 27.00, banana: 42.50, chilli: 59.00, brinjal: 29.50 }
    },
    {
      code: "tindivanam_highway_mandi",
      name_en: "Tindivanam Highway Veg & Onion Terminal",
      name_ta: "திண்டிவனம் நெடுஞ்சாலை காய்கறி முனையம்",
      type_en: "Wholesale Mandi",
      type_ta: "மொத்த காய்கறி முனையம்",
      location_en: "Tindivanam",
      location_ta: "திண்டிவனம்",
      rating: 4.6,
      reviews: 150,
      payment_en: "Within 24 Hours",
      payment_ta: "24 மணி நேரத்திற்குள்",
      phone: "+91 94435 77665",
      crops: { tomato: 35.00, onion: 41.50, potato: 28.50, banana: 44.00, chilli: 61.00, brinjal: 30.50 }
    }
  ],

  distances: {
    tirupporur: {
      kanchi_ponni_rice_mill: 62.0,
      tn_civil_supplies_dpc: 30.0,
      tirupporur_grain_traders: 6.0,
      tindivanam_lakshmi_mill: 95.0,
      maduranthakam_delta_traders: 48.0,
      padalam_sugar_mills: 38.0,
      cheyyar_coop_sugar_mill: 85.0,
      tirupporur_nattu_sakkarai: 8.0,
      tindivanam_cane_cluster: 94.0,
      kanchi_bio_sugar: 66.0,
      chengalpattu_uzhavar_aggregator: 26.0,
      koyambedu_kanchi_hub: 64.0,
      tirupporur_green_mandi: 5.0,
      tindivanam_highway_mandi: 92.0
    },
    chengalpattu: {
      kanchi_ponni_rice_mill: 36.0,
      tn_civil_supplies_dpc: 4.0,
      tirupporur_grain_traders: 28.0,
      tindivanam_lakshmi_mill: 68.0,
      maduranthakam_delta_traders: 24.0,
      padalam_sugar_mills: 18.0,
      cheyyar_coop_sugar_mill: 60.0,
      tirupporur_nattu_sakkarai: 32.0,
      tindivanam_cane_cluster: 66.0,
      kanchi_bio_sugar: 40.0,
      chengalpattu_uzhavar_aggregator: 3.0,
      koyambedu_kanchi_hub: 38.0,
      tirupporur_green_mandi: 28.0,
      tindivanam_highway_mandi: 65.0
    },
    kanchipuram: {
      kanchi_ponni_rice_mill: 5.0,
      tn_civil_supplies_dpc: 38.0,
      tirupporur_grain_traders: 65.0,
      tindivanam_lakshmi_mill: 76.0,
      maduranthakam_delta_traders: 52.0,
      padalam_sugar_mills: 42.0,
      cheyyar_coop_sugar_mill: 28.0,
      tirupporur_nattu_sakkarai: 68.0,
      tindivanam_cane_cluster: 78.0,
      kanchi_bio_sugar: 10.0,
      chengalpattu_uzhavar_aggregator: 36.0,
      koyambedu_kanchi_hub: 6.0,
      tirupporur_green_mandi: 66.0,
      tindivanam_highway_mandi: 74.0
    },
    tindivanam: {
      kanchi_ponni_rice_mill: 78.0,
      tn_civil_supplies_dpc: 68.0,
      tirupporur_grain_traders: 92.0,
      tindivanam_lakshmi_mill: 7.0,
      maduranthakam_delta_traders: 44.0,
      padalam_sugar_mills: 52.0,
      cheyyar_coop_sugar_mill: 58.0,
      tirupporur_nattu_sakkarai: 96.0,
      tindivanam_cane_cluster: 6.0,
      kanchi_bio_sugar: 74.0,
      chengalpattu_uzhavar_aggregator: 65.0,
      koyambedu_kanchi_hub: 75.0,
      tirupporur_green_mandi: 92.0,
      tindivanam_highway_mandi: 4.0
    }
  },

  sample_sentences: [
    {
      lang: "ta",
      text: "நெல் இரண்டாயிரம் கிலோ திருப்போரூர்",
      crop: "paddy",
      quantity_kg: 2000,
      location: "tirupporur",
      preview_en: "2000 kg Paddy - Tirupporur",
      preview_ta: "2000 கிலோ நெல் - திருப்போரூர்"
    },
    {
      lang: "en",
      text: "ten ton sugarcane Chengalpattu",
      crop: "sugarcane",
      quantity_kg: 10000,
      location: "chengalpattu",
      preview_en: "10 Ton Sugarcane - Chengalpattu",
      preview_ta: "10 டன் கரும்பு - செங்கல்பட்டு"
    },
    {
      lang: "ta",
      text: "கரும்பு ஐந்து டன் காஞ்சிபுரம்",
      crop: "sugarcane",
      quantity_kg: 5000,
      location: "kanchipuram",
      preview_en: "5 Ton Sugarcane - Kanchipuram",
      preview_ta: "5 டன் கரும்பு - காஞ்சிபுரம்"
    },
    {
      lang: "en",
      text: "5000 kg paddy Tindivanam",
      crop: "paddy",
      quantity_kg: 5000,
      location: "tindivanam",
      preview_en: "5000 kg Paddy - Tindivanam",
      preview_ta: "5000 கிலோ நெல் - திண்டிவனம்"
    },
    {
      lang: "ta",
      text: "தக்காளி 500 கிலோ செங்கல்பட்டு",
      crop: "tomato",
      quantity_kg: 500,
      location: "chengalpattu",
      preview_en: "500 kg Tomato - Chengalpattu",
      preview_ta: "500 கிலோ தக்காளி - செங்கல்பட்டு"
    },
    {
      lang: "en",
      text: "two ton onion Tirupporur",
      crop: "onion",
      quantity_kg: 2000,
      location: "tirupporur",
      preview_en: "2 Ton Onion - Tirupporur",
      preview_ta: "2 டன் வெங்காயம் - திருப்போரூர்"
    }
  ]
};

// Transport formula: ₹200 + km × (₹10 + quantity_kg × 0.012)
function calculateClientTransport(km, qtyKg) {
  const distance = Math.max(0, Number(km) || 0);
  const qty = Math.max(0, Number(qtyKg) || 0);
  const cost = 200.0 + distance * (10.0 + qty * 0.012);
  return Math.round(cost * 100) / 100;
}

function formatClientCurrency(num) {
  const rounded = Math.round(num);
  const sign = rounded < 0 ? "-" : "";
  const absStr = Math.abs(rounded).toString();
  if (absStr.length <= 3) {
    return `${sign}₹${absStr}`;
  }
  const last3 = absStr.slice(-3);
  let rest = absStr.slice(0, -3);
  const parts = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length > 0) parts.unshift(rest);
  return `${sign}₹${parts.join(",")},${last3}`;
}

function formatClientPrice(rate) {
  const num = Number(rate) || 0;
  if (num < 10.0) {
    return `₹${num.toFixed(2)}`;
  }
  return Number.isInteger(num) ? `₹${num}` : `₹${num.toFixed(2)}`;
}

// Client-side fallback calculation function
function calculateOffersOffline(cropCode, quantityKg, locationCode, isUrgent = false, discountPct = 0) {
  const crop = cropCode ? cropCode.toLowerCase() : "paddy";
  const loc = locationCode ? locationCode.toLowerCase() : "tirupporur";
  const qty = Math.max(1, Number(quantityKg) || 1000);
  const discount = Math.max(0, Math.min(50, Number(discountPct) || 0));

  const matchingBuyers = SAMPLE_DATA.buyers.filter(b => b.crops && b.crops[crop] !== undefined);
  const distanceMap = SAMPLE_DATA.distances[loc] || SAMPLE_DATA.distances.tirupporur;

  const offers = matchingBuyers.map(b => {
    const basePrice = b.crops[crop];
    const pricePerKg = (isUrgent && discount > 0)
      ? Math.round(basePrice * (1 - discount / 100) * 100) / 100
      : basePrice;

    const dist = distanceMap[b.code] !== undefined ? distanceMap[b.code] : 25.0;
    const gross = Math.round(qty * pricePerKg * 100) / 100;
    const transport = calculateClientTransport(dist, qty);
    const net = Math.round((gross - transport) * 100) / 100;
    const netPerKg = Math.round((net / qty) * 100) / 100;

    const paymentSpeedEn = b.payment_en || "";
    const isSpotCash = /spot cash|instant|24 hours|same day/i.test(paymentSpeedEn);

    return {
      buyer_code: b.code,
      name_en: b.name_en,
      name_ta: b.name_ta,
      buyer_type_en: b.type_en,
      buyer_type_ta: b.type_ta,
      location_en: b.location_en,
      location_ta: b.location_ta,
      rating: b.rating,
      review_count: b.reviews,
      payment_speed_en: b.payment_en,
      payment_speed_ta: b.payment_ta,
      is_spot_cash: isSpotCash,
      phone: b.phone,
      base_price_per_kg: basePrice,
      price_per_kg: pricePerKg,
      price_formatted: formatClientPrice(pricePerKg),
      distance_km: dist,
      gross_amount: gross,
      gross_formatted: formatClientCurrency(gross),
      transport_cost: transport,
      transport_formatted: formatClientCurrency(transport),
      net_amount: net,
      net_formatted: formatClientCurrency(net),
      net_per_kg: netPerKg,
      net_per_kg_formatted: formatClientPrice(netPerKg),
      formula_line_en: `${formatClientCurrency(gross)} − ${formatClientCurrency(transport)} transport (${Math.round(dist)} km)`,
      formula_line_ta: `${formatClientCurrency(gross)} − ${formatClientCurrency(transport)} போக்குவரத்து (${Math.round(dist)} கி.மீ)`,
      is_best_offer: false,
      demo_badge: "Simulated Demo Offer"
    };
  });

  if (isUrgent) {
    offers.sort((a, b) => (b.is_spot_cash - a.is_spot_cash) || (b.net_amount - a.net_amount));
  } else {
    offers.sort((a, b) => b.net_amount - a.net_amount);
  }

  let best = null;
  let lowest = null;
  let diff = 0;
  if (offers.length > 0) {
    offers[0].is_best_offer = true;
    best = offers[0];
    lowest = offers[offers.length - 1];
    diff = Math.round((best.net_amount - lowest.net_amount) * 100) / 100;
  }

  return {
    crop: { code: crop },
    quantity_kg: qty,
    farmer_location: { code: loc },
    is_urgent: isUrgent,
    discount_pct: discount,
    total_offers: offers.length,
    best_offer: best,
    lowest_offer: lowest,
    advantage_over_lowest: diff,
    advantage_formatted: formatClientCurrency(diff),
    offers: offers,
    sample_notice: SAMPLE_DATA.notice
  };
}

// Initial sample listings for offline storage
SAMPLE_DATA.initial_listings = [
  {
    id: 1,
    farmer_name: "Murugan (உழவர் முருகன்)",
    farmer_phone: "+91 98412 11223",
    crop_code: "paddy",
    quantity_kg: 2000,
    location: "tirupporur",
    best_buyer_code: "tn_civil_supplies_dpc",
    best_buyer_name: "Tamil Nadu Civil Supplies DPC",
    gross_amount: 47000.0,
    transport_cost: 1220.0,
    net_amount: 45780.0,
    is_urgent: 0,
    urgency_reason: "",
    urgency_discount: 0,
    notes: "Sample simulated paddy lot from Tirupporur (Demo Listing)",
    status: "active",
    created_at: "2026-10-16 10:00:00"
  },
  {
    id: 2,
    farmer_name: "Arumugam (உழவர் ஆறுமுகம்)",
    farmer_phone: "+91 94431 88990",
    crop_code: "tomato",
    quantity_kg: 800,
    location: "chengalpattu",
    best_buyer_code: "chengalpattu_veg_mandi",
    best_buyer_name: "Chengalpattu Uzhavar Sandhai Aggregators",
    gross_amount: 25200.0,
    transport_cost: 592.0,
    net_amount: 24608.0,
    is_urgent: 1,
    urgency_reason: "அழுகும் தக்காளி - மழை காரணமாக 24 மணி நேரத்திற்குள் உடனடி தேவை (Perishable Harvest - Rain Risk)",
    urgency_discount: 10,
    notes: "Urgent clearance sale lot with rapid cash preference (Demo Listing)",
    status: "active",
    created_at: "2026-10-16 11:30:00"
  }
];

// Initial sample deals for offline storage
SAMPLE_DATA.initial_deals = [
  {
    id: 1,
    listing_id: 1,
    buyer_code: "tn_civil_supplies_dpc",
    buyer_name: "Tamil Nadu Civil Supplies DPC",
    crop_code: "paddy",
    quantity_kg: 2000,
    farmer_location: "tirupporur",
    price_per_kg: 23.50,
    gross_amount: 47000.0,
    transport_cost: 1220.0,
    net_amount: 45780.0,
    is_urgent: 0,
    status: "truck_dispatched",
    created_at: "2026-10-16 10:15:00",
    updated_at: "2026-10-16 11:00:00"
  }
];
