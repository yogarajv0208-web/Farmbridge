/**
 * FarmBridge Localization (தமிழ் & English)
 */

const I18N = {
  ta: {
    app_name: "ஃபார்ம்பிரிட்ஜ்",
    app_subtitle: "தமிழ்நாடு விவசாயிகள் நேரடி சந்தை இணைப்பு",
    badge_demo: "மாதிரி செயல்முறை (Demo)",
    lang_btn: "English",
    theme_light: "பகல் பயன்முறை",
    theme_dark: "இரவு பயன்முறை",
    voice_replies_on: "குரல் பதில்: ஆன்",
    voice_replies_off: "குரல் பதில்: ஆப்",
    api_online: "சேவையகம் இணைப்பில் உள்ளது",
    api_offline: "ஆஃப்லைன் மாதிரி தரவு பயன்முறை",

    // Voice Section
    voice_title: "குரல் மூலம் எளிதாகக் கேளுங்கள்",
    voice_subtitle: "பயிர், அளவு மற்றும் ஊரை ஒரே வாக்கியத்தில் பேசுங்கள்",
    mic_idle: "பேச மைக் பட்டனை அழுத்தவும்",
    mic_listening: "கவனிக்கிறது... இப்போது பேசுங்கள்...",
    mic_processing: "புரிந்துகொள்கிறது...",
    mic_speak_prompt: "எ.கா: 'நெல் இரண்டாயிரம் கிலோ திருப்போரூர்' அல்லது 'கரும்பு பத்து டன் செங்கல்பட்டு'",
    transcript_label: "பேசிய உரை / இங்கு தட்டச்சு செய்யவும்:",
    transcript_placeholder: "பேசுங்கள் அல்லது 'நெல் இரண்டாயிரம் கிலோ திருப்போரூர்' எனத் தட்டச்சு செய்க...",
    btn_listen: "மைக் (Listen)",
    btn_stop: "நிறுத்து (Stop)",
    btn_sample: "மாதிரி குரல் முயற்சி (Try Sample Voice)",
    btn_clear: "அழி (Clear)",
    sample_badge: "மாதிரி வாக்கியம்:",

    // Field labels
    fields_title: "சரிபார்க்கவும் & திருத்தவும்",
    field_crop: "பயிர் (Crop)",
    field_qty: "அளவு (கிலோவில்)",
    field_loc: "உங்கள் ஊர் (Location)",
    btn_calculate: "வாங்குபவர்களைத் தேடு",
    select_crop_placeholder: "பயிரைத் தேர்ந்தெடுக்கவும்",
    select_loc_placeholder: "ஊரைத் தேர்ந்தெடுக்கவும்",
    quick_add_label: "விரைவு அளவு:",
    quick_unit_ton: "டன் (1000 kg)",

    // Sections
    sec_buyers_title: "1. நேரடி வாங்குபவர்கள்",
    sec_buyers_count: "{count} வாங்குபவர்கள் உள்ளனர்",
    sec_comparison_title: "2. நிகரத் தொகை ஒப்பீடு",
    sec_comparison_desc: "போக்குவரத்துக் கழிவிற்குப் பின் உங்களுக்குக் கிடைக்கும் உண்மையான தொகை",
    sec_earnings_title: "3. அதிகபட்ச வருமான மதிப்பீடு (Best Offer)",

    // Buyer Card
    badge_best_offer: "சிறந்த சலுகை ⭐",
    rating_label: "மதிப்பீடு",
    payment_speed_label: "பணம் செலுத்தும் வேகம்:",
    price_per_kg_label: "கிலோ விலை:",
    distance_label: "தூரம்:",
    btn_contact: "தொடர்பு கொள்க",
    btn_deal_done: "ஒப்பந்தம் செய்",

    // Earnings Card
    gross_value_label: "மொத்த விற்பனை மதிப்பு:",
    transport_cost_label: "போக்குவரத்துச் செலவு:",
    net_payout_label: "உங்களுக்குக் கிடைக்கும் நிகரத் தொகை:",
    net_per_kg_label: "கிலோவிற்கு நிகர விலை:",
    advantage_text: "குறைந்த சலுகையை விட {amount} அதிகம்!",
    btn_save_listing: "எனது பதிவைச் சேமிக்கவும் (Save Listing)",
    btn_saved_view: "சேமிக்கப்பட்ட பதிவுகள் ({count})",
    formula_tooltip: "சூத்திரம்: ₹200 + கி.மீ × (₹10 + அளவு_கிலோ × 0.012)",

    // Modals & Feedback
    modal_save_title: "விவசாயி பதிவைச் சேமி",
    farmer_name_label: "உங்கள் பெயர்:",
    farmer_phone_label: "தொலைபேசி எண்:",
    btn_confirm_save: "சேமிக்கவும்",
    btn_cancel: "ரத்து செய்",
    listing_saved_toast: "பதிவு வெற்றிகரமாக சேமிக்கப்பட்டது!",
    deal_confirmed_toast: "வியாபார ஒப்பந்தம் உறுதி செய்யப்பட்டது!",

    // Errors
    err_mic_blocked: "மைக் அனுமதி தடுக்கப்பட்டுள்ளது. உலாவி அமைப்புகளில் மைக்கை அனுமதிக்கவும்.",
    err_mic_new_tab: "புதிய தாவலில் திறக்க (Open in new tab)",
    err_no_mic: "மைக் கருவி கண்டறியப்படவில்லை. கீழே உள்ள கட்டத்தில் தட்டச்சு செய்யலாம்.",
    err_no_internet: "இணைய இணைப்பு கிடைக்கவில்லை. தட்டச்சு செய்து தேடவும்.",
    err_nothing_heard: "குரல் எதுவும் கேட்கவில்லை. மைக்கிற்கு அருகில் தெளிவாகப் பேசவும்.",
    err_unsupported: "இந்த உலாவியில் பேச்சு அறிதல் ஆதரிக்கப்படவில்லை. Chrome அல்லது Edge-ல் முயற்சிக்கவும்.",
    err_missing_crop: "தயவுசெய்து பயிரைத் தேர்ந்தெடுக்கவும்.",
    err_missing_qty: "சரியான எடையை உள்ளிடவும் (0-க்கு மேல்).",
    err_missing_loc: "உங்கள் ஊரைத் தேர்ந்தெடுக்கவும்.",

    // Role Navigation
    role_farmer: "🌾 உழவர் களம் (Farmer)",
    role_buyer: "🏢 வாங்குபவர் களம் (Buyer)",
    role_deals: "🤝 ஒப்பந்தங்கள் (Deals)",

    // Urgent Sale Workflow
    urgent_toggle_label: "🚨 அவசர விற்பனை (Urgent Clearance Sale)",
    urgent_toggle_desc: "மழை / அழுகும் பயிர்கள் அல்லது உடனடி பணத் தேவைக்கான விரைவு விற்பனை",
    urgent_reason_label: "அவசர காரணம் (Urgency Reason):",
    urgent_reason_perishable: "அழுகும் பயிர் - மழை / வெயில் அபாயம் (Perishable Harvest)",
    urgent_reason_cash: "உடனடி அவசர ரொக்கத் தேவை (Immediate Cash Need Today)",
    urgent_reason_storage: "சேமிப்புக் கிடங்கு இல்லை (No Post-Harvest Storage)",
    urgent_discount_label: "விரைவு கொள்முதல் தள்ளுபடி சலுகை:",
    urgent_badge: "🚨 மாதிரி அவசர விற்பனை (Demo Urgent Lot)",
    urgent_spot_cash_badge: "⚡ உடனடி ரொக்கம் முன்னுரிமை",

    // Buyer View
    buyer_dashboard_title: "விவசாயிகளின் வரத்து மற்றும் விற்பனை பதிவுகள்",
    buyer_dashboard_subtitle: "நேரடி கொள்முதல் செய்ய விவசாயிகளின் பதிவுகளைப் பார்க்கவும்",
    buyer_filter_all: "அனைத்து பயிர்களும்",
    buyer_filter_urgent_only: "🚨 அவசர விற்பனைகள் மட்டும்",
    btn_procure_lot: "கொள்முதல் செய் (Procure Lot)",
    buyer_empty_listings: "பொருத்தமான விவசாயி பதிவுகள் எதுவும் இல்லை.",

    // Deals Pipeline
    deals_title: "ஒப்பந்தங்கள் & நேரடி நிலைக் கண்காணிப்பு",
    deals_subtitle: "உறுதி செய்யப்பட்ட ஒப்பந்தங்களின் படிநிலை முன்னேற்றம் (முழு மாதிரி செயல்முறை)",
    status_confirmed: "உறுதி செய்யப்பட்டது",
    status_truck_dispatched: "வாகனம் அனுப்பப்பட்டது",
    status_quality_inspected: "தரம் சரிபார்க்கப்பட்டது (Grade A)",
    status_payment_completed: "பணம் செலுத்தப்பட்டது (Simulated)",
    status_cancelled: "ரத்து செய்யப்பட்டது",
    btn_advance_status: "அடுத்த நிலைக்கு மாற்று ➔",
    btn_view_receipt: "ரசீது காண்க 📄",
    btn_cancel_deal: "ரத்து செய்",
    deals_empty_title: "ஒப்பந்தங்கள் எதுவும் இன்னும் பதிவு செய்யப்படவில்லை",
    deals_empty_desc: "வாங்குபவர் கார்டில் 'ஒப்பந்தம் செய்' அழுத்தவும் அல்லது கீழே மாதிரி ஒப்பந்தத்தை உருவாக்கவும்.",
    btn_create_demo_deal: "மாதிரி ஒப்பந்தத்தை உருவாக்கு (Create Demo Deal)",
    deal_advanced_toast: "ஒப்பந்த நிலை வெற்றிகரமாக மாற்றப்பட்டது!",

    // Mandi Receipt Modal
    receipt_title: "மாதிரி கொள்முதல் சலான் & ரசீது",
    receipt_watermark: "மாதிரி ஆவணம் - சட்டப்பூர்வ செல்லுபடி அற்றது / SIMULATED DEMO ONLY - NO REAL BANKING",
    receipt_deal_id: "ஒப்பந்த குறிப்பு எண் (Deal ID):",
    receipt_date: "தேதி & நேரம்:",
    receipt_buyer: "வாங்குபவர் நிறுவனம்:",
    receipt_farmer: "உழவர் விவரம்:",
    receipt_crop_qty: "பயிர் & அளவு:",
    receipt_gross: "மொத்த பயிர் மதிப்பு:",
    receipt_transport: "போக்குவரத்துக் கழிவு:",
    receipt_net: "நிகர தீர்வுத் தொகை:",
    receipt_payment_status: "பணம் செலுத்தல் நிலை:",
    receipt_payment_mode: "செலுத்தல் முறை:",
    receipt_payment_sim: "மாதிரி உடனடி UPI பரிமாற்றம் (Simulated UPI Demo)",
    btn_print_receipt: "அச்சிடு / சேமி (Print/Save)",
    btn_close: "மூடு",

    // Transparent Demo Badges
    tag_sample_profile: "மாதிரி வாங்குபவர் விவரம் (Sample Profile)",
    tag_sample_rate: "(மாதிரி விலை)",
    tag_simulated_speech: "உலாவி மாதிரி குரல் உள்ளீடு",
    tag_simulated_deal: "மாதிரி ஒப்பந்தம் (Demo Deal)",

    // TTS speech format
    tts_speech: "சிறந்த சலுகை: {buyer}. போக்குவரத்து கழித்து உங்கள் நிகர வருமானம் {net}."
  },

  en: {
    app_name: "FarmBridge",
    app_subtitle: "Tamil Nadu Direct Farmer-Buyer Link",
    badge_demo: "Demo Prototype",
    lang_btn: "தமிழ்",
    theme_light: "Light Mode",
    theme_dark: "Dark Mode",
    voice_replies_on: "Voice Reply: ON",
    voice_replies_off: "Voice Reply: OFF",
    api_online: "Server Connected",
    api_offline: "Offline Demo Data Mode",

    // Voice Section
    voice_title: "Speak or Type Your Request",
    voice_subtitle: "Speak crop, quantity, and location in one natural sentence",
    mic_idle: "Tap Mic to Speak",
    mic_listening: "Listening... speak now...",
    mic_processing: "Processing speech...",
    mic_speak_prompt: "e.g.: 'ten ton sugarcane Chengalpattu' or '2000 kg paddy Tirupporur'",
    transcript_label: "Live Transcript / Type here:",
    transcript_placeholder: "Speak or type e.g. 'ten ton sugarcane Chengalpattu'...",
    btn_listen: "Mic (Listen)",
    btn_stop: "Stop",
    btn_sample: "Try Sample Voice",
    btn_clear: "Clear",
    sample_badge: "Demo Sentence:",

    // Field labels
    fields_title: "Review & Edit Detected Fields",
    field_crop: "Crop",
    field_qty: "Quantity (in kg)",
    field_loc: "Your Location",
    btn_calculate: "Find Matching Buyers",
    select_crop_placeholder: "Select crop",
    select_loc_placeholder: "Select location",
    quick_add_label: "Quick Quantity:",
    quick_unit_ton: "Ton (1000 kg)",

    // Sections
    sec_buyers_title: "1. Matching Buyers",
    sec_buyers_count: "{count} buyers available",
    sec_comparison_title: "2. Net Payout Comparison",
    sec_comparison_desc: "Ranked by actual earnings after deducting transport costs",
    sec_earnings_title: "3. Best Estimated Earnings",

    // Buyer Card
    badge_best_offer: "Best Offer ⭐",
    rating_label: "Rating",
    payment_speed_label: "Payment Speed:",
    price_per_kg_label: "Price per kg:",
    distance_label: "Distance:",
    btn_contact: "Contact Buyer",
    btn_deal_done: "Accept Deal",

    // Earnings Card
    gross_value_label: "Gross Crop Value:",
    transport_cost_label: "Transport Cost:",
    net_payout_label: "Your Net Payout:",
    net_per_kg_label: "Effective Rate / kg:",
    advantage_text: "₹{amount} more than the lowest offer!",
    btn_save_listing: "Save My Listing",
    btn_saved_view: "Saved Listings ({count})",
    formula_tooltip: "Formula: ₹200 + km × (₹10 + quantity_kg × 0.012)",

    // Modals & Feedback
    modal_save_title: "Save Farmer Listing",
    farmer_name_label: "Farmer Name:",
    farmer_phone_label: "Phone Number:",
    btn_confirm_save: "Save Listing",
    btn_cancel: "Cancel",
    listing_saved_toast: "Listing successfully saved (Demo)!",
    deal_confirmed_toast: "Deal confirmed with buyer (Simulated Demo)!",

    // Errors
    err_mic_blocked: "Microphone permission blocked. Please allow mic access in your browser settings.",
    err_mic_new_tab: "Open in New Tab",
    err_no_mic: "No microphone detected on your device. You can type in the box below.",
    err_no_internet: "Speech recognition network error. Please check internet connection.",
    err_nothing_heard: "Nothing heard. Please speak closer to microphone or try sample voice.",
    err_unsupported: "Speech recognition is not supported in this browser. Try Chrome/Edge or type directly.",
    err_missing_crop: "Please select a crop.",
    err_missing_qty: "Please enter a valid quantity greater than zero.",
    err_missing_loc: "Please select your location.",

    // Role Navigation
    role_farmer: "🌾 Farmer View",
    role_buyer: "🏢 Buyer / Mill View",
    role_deals: "🤝 Deals Tracker",

    // Urgent Sale Workflow
    urgent_toggle_label: "🚨 Urgent Clearance Sale",
    urgent_toggle_desc: "Fast clearance for perishable crops or urgent cash flow needs",
    urgent_reason_label: "Urgency Reason:",
    urgent_reason_perishable: "Perishable Harvest - Rain / Spoilage Risk",
    urgent_reason_cash: "Immediate Cash Need (Today)",
    urgent_reason_storage: "No Post-Harvest Cold Storage",
    urgent_discount_label: "Clearance Discount Offer:",
    urgent_badge: "🚨 Demo Urgent Lot",
    urgent_spot_cash_badge: "⚡ Instant Cash Priority",

    // Buyer View
    buyer_dashboard_title: "Incoming Farmer Supply Lots",
    buyer_dashboard_subtitle: "Review farmer listings & urgent clearance lots for direct procurement",
    buyer_filter_all: "All Crops",
    buyer_filter_urgent_only: "🚨 Urgent Sales Only",
    btn_procure_lot: "Procure Lot (Create Deal)",
    buyer_empty_listings: "No farmer listings available at this time.",

    // Deals Pipeline
    deals_title: "Deals Tracker & Status Pipeline",
    deals_subtitle: "Step-by-step progress tracking for confirmed procurement deals (Demo Simulation)",
    status_confirmed: "Deal Confirmed",
    status_truck_dispatched: "Truck Dispatched",
    status_quality_inspected: "Quality Inspected (Grade A)",
    status_payment_completed: "Payment Completed (Simulated)",
    status_cancelled: "Cancelled",
    btn_advance_status: "Advance Stage ➔",
    btn_view_receipt: "View Receipt 📄",
    btn_cancel_deal: "Cancel Deal",
    deals_empty_title: "No Deals Created Yet",
    deals_empty_desc: "Click 'Accept Deal' on any buyer card or create a sample deal below.",
    btn_create_demo_deal: "Create Demo Deal",
    deal_advanced_toast: "Deal status advanced successfully!",

    // Mandi Receipt Modal
    receipt_title: "Simulated Mandi Challan & Payment Voucher",
    receipt_watermark: "SIMULATED DEMO ONLY - NO REAL BANKING",
    receipt_deal_id: "Deal Reference ID:",
    receipt_date: "Date & Time:",
    receipt_buyer: "Procuring Buyer / Mill:",
    receipt_farmer: "Farmer Details:",
    receipt_crop_qty: "Commodity & Quantity:",
    receipt_gross: "Gross Crop Value:",
    receipt_transport: "Transport Deduction:",
    receipt_net: "Net Settlement Payout:",
    receipt_payment_status: "Payment Status:",
    receipt_payment_mode: "Mode of Settlement:",
    receipt_payment_sim: "Simulated Immediate UPI (Demo Mode)",
    btn_print_receipt: "Print / Save Receipt",
    btn_close: "Close",

    // Transparent Demo Badges
    tag_sample_profile: "Sample Buyer Profile (Demo)",
    tag_sample_rate: "(Sample Demo Rate)",
    tag_simulated_speech: "Browser Demo Speech Engine",
    tag_simulated_deal: "Simulated Demo Deal",

    // TTS speech format
    tts_speech: "Best offer: {buyer}. Net payout after transport is {net}."
  }
};

const CROPS_META = [
  { code: "paddy", name_en: "Paddy", name_ta: "நெல்", icon: "🌾", category: "grain", desc_en: "Rice mills, DPCs & grain traders", desc_ta: "அரிசி ஆலைகள், நேரடி கொள்முதல் மையம்" },
  { code: "sugarcane", name_en: "Sugarcane", name_ta: "கரும்பு", icon: "🎋", category: "cane", desc_en: "Sugar mills & jaggery units", desc_ta: "சர்க்கரை ஆலைகள், நாட்டுச் சர்க்கரை அலகுகள்" },
  { code: "tomato", name_en: "Tomato", name_ta: "தக்காளி", icon: "🍅", category: "veg", desc_en: "Wholesale vegetable mandis", desc_ta: "மொத்த காய்கறி மண்டிகள்" },
  { code: "onion", name_en: "Onion", name_ta: "வெங்காயம்", icon: "🧅", category: "veg", desc_en: "Wholesale onion aggregators", desc_ta: "வெங்காய மொத்த வியாபாரிகள்" },
  { code: "potato", name_en: "Potato", name_ta: "உருளைக்கிழங்கு", icon: "🥔", category: "veg", desc_en: "Cold storage & mandis", desc_ta: "குளிர்சாதன சேமிப்பு கிடங்கு & மண்டிகள்" },
  { code: "banana", name_en: "Banana", name_ta: "வாழைப்பழம்", icon: "🍌", category: "fruit", desc_en: "Fruit market aggregators", desc_ta: "பழ மொத்த சந்தை" },
  { code: "chilli", name_en: "Chilli", name_ta: "மிளகாய்", icon: "🌶️", category: "spice", desc_en: "Spices & masala traders", desc_ta: "மசாலா & கார மண்டி" },
  { code: "brinjal", name_en: "Brinjal", name_ta: "கத்தரிக்காய்", icon: "🍆", category: "veg", desc_en: "Daily vegetable bazaar", desc_ta: "தினசரி உழவர் சந்தை" }
];

const LOCATIONS_META = [
  { code: "tirupporur", name_en: "Tirupporur", name_ta: "திருப்போரூர்", district_en: "Chengalpattu", district_ta: "செங்கல்பட்டு" },
  { code: "chengalpattu", name_en: "Chengalpattu", name_ta: "செங்கல்பட்டு", district_en: "Chengalpattu", district_ta: "செங்கல்பட்டு" },
  { code: "kanchipuram", name_en: "Kanchipuram", name_ta: "காஞ்சிபுரம்", district_en: "Kanchipuram", district_ta: "காஞ்சிபுரம்" },
  { code: "tindivanam", name_en: "Tindivanam", name_ta: "திண்டிவனம்", district_en: "Villupuram", district_ta: "விழுப்புரம்" }
];
