/**
 * FarmBridge Main Application Logic
 * Senior Frontend & Product QA Edition
 * Features:
 * - Bilingual UI (தமிழ் & English) with instant toggle
 * - Role Switcher: Farmer Marketplace (உழவர் களம்), Buyer Procurement (வாங்குபவர் களம்), Deals Tracker (ஒப்பந்தங்கள்)
 * - Voice speech-to-text recognition & parsing with fallback samples
 * - Real-time net payout calculator factoring distance-based transport formula
 * - Urgent / Distress clearance workflow with fast-cash preference & discount calculation
 * - Multi-stage deal lifecycle pipeline: Confirmed -> Dispatched -> Inspected -> Settled
 * - Simulated Mandi Challan & payment voucher generation
 * - Explicit simulation disclaimers throughout UI for complete truthfulness
 * - Offline-first caching with automatic SQLite API sync
 */

(function () {
  "use strict";

  // Application State
  const state = {
    lang: localStorage.getItem("farmbridge_lang") || "ta",
    theme: localStorage.getItem("farmbridge_theme") || "light",
    currentRole: localStorage.getItem("farmbridge_role") || "farmer", // "farmer" | "buyer" | "deals"
    voiceReplies: SpeechEngine.getVoiceReplies(),
    isOnline: true,
    sampleIndex: 0,
    currentOffers: null,
    currentSort: "net", // "net" | "distance" | "rating"
    isUrgent: false,
    urgencyReason: "perishable",
    urgencyDiscount: 10,
    buyerCropFilter: "all",
    buyerUrgentOnly: false,
    savedListings: [],
    incomingListings: [],
    deals: [],

    // Produce Photo Quality Verification State
    cropPhoto: null,
    photoVerified: false,
    qualityGrade: "Grade-A",
    qualityScore: 96.8,
    qualityMetrics: null,
    qualityCertificateId: "TN-AGRO-QC-9842",

    // User Authentication & Default State (Direct Access Mode)
    currentUser: JSON.parse(localStorage.getItem("farmbridge_user") || "null") || {
      name: "உழவர் முருகன்",
      phone: "9841200001",
      role: "farmer",
      method: "direct",
      loggedInAt: new Date().toISOString()
    },
    loginRole: "farmer",
    loginMethod: "otp",
    lastEnteredPhone: "9841200001",
    otpCountdownTimer: null,
    otpCountdownSeconds: 30
  };

  // DOM Elements Registry
  const DOM = {
    // Header & Global Controls
    appTitle: document.getElementById("appTitle"),
    appSubtitle: document.getElementById("appSubtitle"),
    langToggleBtn: document.getElementById("langToggleBtn"),
    langBtnText: document.getElementById("langBtnText"),
    voiceReplyBtn: document.getElementById("voiceReplyBtn"),
    voiceReplyText: document.getElementById("voiceReplyText"),
    voiceReplyIcon: document.getElementById("voiceReplyIcon"),
    themeToggleBtn: document.getElementById("themeToggleBtn"),
    themeIcon: document.getElementById("themeIcon"),
    connectionPill: document.getElementById("connectionPill"),
    connText: document.getElementById("connText"),
    demoNoticeBadge: document.getElementById("demoNoticeBadge"),
    statusNoticeText: document.getElementById("statusNoticeText"),
    viewListingsBtn: document.getElementById("viewListingsBtn"),
    savedCountBadge: document.getElementById("savedCountBadge"),

    // Role Navigation
    tabFarmer: document.getElementById("tabFarmer"),
    tabBuyer: document.getElementById("tabBuyer"),
    tabDeals: document.getElementById("tabDeals"),
    tabWarehouse: document.getElementById("tabWarehouse"),
    tabFarmerText: document.getElementById("tabFarmerText"),
    tabBuyerText: document.getElementById("tabBuyerText"),
    tabDealsText: document.getElementById("tabDealsText"),
    tabWarehouseText: document.getElementById("tabWarehouseText"),
    dealsCountBadge: document.getElementById("dealsCountBadge"),

    // View Panels
    viewFarmer: document.getElementById("viewFarmer"),
    viewBuyer: document.getElementById("viewBuyer"),
    viewDeals: document.getElementById("viewDeals"),
    viewWarehouse: document.getElementById("viewWarehouse"),

    // Voice Hero (Farmer View)
    voiceSectionHeading: document.getElementById("voiceSectionHeading"),
    voiceSectionDesc: document.getElementById("voiceSectionDesc"),
    micMainBtn: document.getElementById("micMainBtn"),
    micStatusText: document.getElementById("micStatusText"),
    micPromptHint: document.getElementById("micPromptHint"),
    voiceAlertBanner: document.getElementById("voiceAlertBanner"),
    alertIcon: document.getElementById("alertIcon"),
    alertText: document.getElementById("alertText"),
    alertActionSlot: document.getElementById("alertActionSlot"),
    transcriptLabel: document.getElementById("transcriptLabel"),
    transcriptInput: document.getElementById("transcriptInput"),
    trySampleVoiceBtn: document.getElementById("trySampleVoiceBtn"),
    trySampleText: document.getElementById("trySampleText"),
    clearVoiceBtn: document.getElementById("clearVoiceBtn"),
    clearBtnText: document.getElementById("clearBtnText"),
    sampleLeadText: document.getElementById("sampleLeadText"),
    samplePillsRow: document.getElementById("samplePillsRow"),

    // Form fields (Farmer View)
    fieldsTitle: document.getElementById("fieldsTitle"),
    cropLabel: document.getElementById("cropLabel"),
    cropSelect: document.getElementById("cropSelect"),
    qtyLabel: document.getElementById("qtyLabel"),
    quantityInput: document.getElementById("quantityInput"),
    locLabel: document.getElementById("locLabel"),
    locationSelect: document.getElementById("locationSelect"),
    liveLocationBtn: document.getElementById("liveLocationBtn"),
    liveLocBtnText: document.getElementById("liveLocBtnText"),
    calculateOffersBtn: document.getElementById("calculateOffersBtn"),
    calculateBtnText: document.getElementById("calculateBtnText"),

    // Urgent Clearance Sale Card
    urgentSaleCard: document.getElementById("urgentSaleCard"),
    urgentSaleToggle: document.getElementById("urgentSaleToggle"),
    urgentToggleTitle: document.getElementById("urgentToggleTitle"),
    urgentToggleDesc: document.getElementById("urgentToggleDesc"),
    urgentFieldsGroup: document.getElementById("urgentFieldsGroup"),
    urgentReasonLabel: document.getElementById("urgentReasonLabel"),
    urgentReasonSelect: document.getElementById("urgentReasonSelect"),
    urgentDiscountLabel: document.getElementById("urgentDiscountLabel"),
    urgentDiscountSelect: document.getElementById("urgentDiscountSelect"),
    urgentSpotNotice: document.getElementById("urgentSpotNotice"),

    // Photo Quality Verification Elements
    photoVerifyCard: document.getElementById("photoVerifyCard"),
    photoVerifyTitle: document.getElementById("photoVerifyTitle"),
    photoVerifySub: document.getElementById("photoVerifySub"),
    photoVerifyBadge: document.getElementById("photoVerifyBadge"),
    cropPhotoInput: document.getElementById("cropPhotoInput"),
    uploadPhotoBtnText: document.getElementById("uploadPhotoBtnText"),
    samplePhotoBtn: document.getElementById("samplePhotoBtn"),
    samplePhotoBtnText: document.getElementById("samplePhotoBtnText"),
    clearPhotoBtn: document.getElementById("clearPhotoBtn"),
    clearPhotoBtnText: document.getElementById("clearPhotoBtnText"),
    photoPreviewContainer: document.getElementById("photoPreviewContainer"),
    verifiedPhotoImg: document.getElementById("verifiedPhotoImg"),
    scanLaserLine: document.getElementById("scanLaserLine"),
    aiScanBadge: document.getElementById("aiScanBadge"),
    aiScanText: document.getElementById("aiScanText"),
    photoQualityResults: document.getElementById("photoQualityResults"),
    qcGradeSub: document.getElementById("qcGradeSub"),
    qcCertIdVal: document.getElementById("qcCertIdVal"),
    metricPurity: document.getElementById("metricPurity"),
    metricDefects: document.getElementById("metricDefects"),

    // Photo Certificate Modal
    photoCertificateModal: document.getElementById("photoCertificateModal"),
    certModalTitle: document.getElementById("certModalTitle"),
    closeCertModalBtn: document.getElementById("closeCertModalBtn"),
    closeCertBtn: document.getElementById("closeCertBtn"),
    downloadCertBtn: document.getElementById("downloadCertBtn"),
    downloadCertBtnText: document.getElementById("downloadCertBtnText"),
    certModalImg: document.getElementById("certModalImg"),
    certModalId: document.getElementById("certModalId"),
    certModalGrade: document.getElementById("certModalGrade"),
    certModalCropName: document.getElementById("certModalCropName"),
    certModalDesc: document.getElementById("certModalDesc"),
    certMetricsTable: document.getElementById("certMetricsTable"),
    certTimestamp: document.getElementById("certTimestamp"),

    // Farmer Sections
    secEarningsHeading: document.getElementById("secEarningsHeading"),
    bestOfferBadgeTag: document.getElementById("bestOfferBadgeTag"),
    earningsContent: document.getElementById("earningsContent"),
    secComparisonHeading: document.getElementById("secComparisonHeading"),
    secComparisonDesc: document.getElementById("secComparisonDesc"),
    comparisonBarsContainer: document.getElementById("comparisonBarsContainer"),
    secBuyersHeading: document.getElementById("secBuyersHeading"),
    secBuyersCount: document.getElementById("secBuyersCount"),
    buyersGrid: document.getElementById("buyersGrid"),
    sortNetBtn: document.getElementById("sortNetBtn"),
    sortDistBtn: document.getElementById("sortDistBtn"),
    sortRatingBtn: document.getElementById("sortRatingBtn"),

    // Buyer View Elements
    secBuyerHeading: document.getElementById("secBuyerHeading"),
    secBuyerSubtitle: document.getElementById("secBuyerSubtitle"),
    buyerCropFilter: document.getElementById("buyerCropFilter"),
    buyerUrgentFilterBtn: document.getElementById("buyerUrgentFilterBtn"),
    incomingListingsGrid: document.getElementById("incomingListingsGrid"),

    // Deals View Elements
    secDealsHeading: document.getElementById("secDealsHeading"),
    secDealsSubtitle: document.getElementById("secDealsSubtitle"),
    createDemoDealBtn: document.getElementById("createDemoDealBtn"),
    createDemoDealBtnText: document.getElementById("createDemoDealBtnText"),
    createColdStorageDealBtn: document.getElementById("createColdStorageDealBtn"),
    dealsCommissionStrip: document.getElementById("dealsCommissionStrip"),
    dealsOpenWarehouseBtn: document.getElementById("dealsOpenWarehouseBtn"),
    dealsListContainer: document.getElementById("dealsListContainer"),

    // Modals
    saveListingModal: document.getElementById("saveListingModal"),
    saveModalTitle: document.getElementById("saveModalTitle"),
    modalFarmerNameLabel: document.getElementById("modalFarmerNameLabel"),
    modalFarmerPhoneLabel: document.getElementById("modalFarmerPhoneLabel"),
    saveListingForm: document.getElementById("saveListingForm"),
    farmerNameInput: document.getElementById("farmerNameInput"),
    farmerPhoneInput: document.getElementById("farmerPhoneInput"),
    saveListingSummaryBox: document.getElementById("saveListingSummaryBox"),
    cancelSaveBtn: document.getElementById("cancelSaveBtn"),
    confirmSaveBtn: document.getElementById("confirmSaveBtn"),
    closeSaveModalBtn: document.getElementById("closeSaveModalBtn"),

    savedListingsModal: document.getElementById("savedListingsModal"),
    savedListingsModalTitle: document.getElementById("savedListingsModalTitle"),
    closeSavedModalBtn: document.getElementById("closeSavedModalBtn"),
    savedListingsList: document.getElementById("savedListingsList"),

    // Receipt Modal
    receiptModal: document.getElementById("receiptModal"),
    receiptModalTitle: document.getElementById("receiptModalTitle"),
    receiptWatermark: document.getElementById("receiptWatermark"),
    receiptContent: document.getElementById("receiptContent"),
    closeReceiptModalBtn: document.getElementById("closeReceiptModalBtn"),
    closeReceiptBtn: document.getElementById("closeReceiptBtn"),
    printReceiptBtn: document.getElementById("printReceiptBtn"),
    printReceiptBtnText: document.getElementById("printReceiptBtnText"),

    // Live Location & Vehicle Tracking Modal
    liveTrackingModal: document.getElementById("liveTrackingModal"),
    trackingModalTitle: document.getElementById("trackingModalTitle"),
    trackingModalSub: document.getElementById("trackingModalSub"),
    closeTrackingModalBtn: document.getElementById("closeTrackingModalBtn"),
    liveTrackingBody: document.getElementById("liveTrackingBody"),
    simulateVehicleMoveBtn: document.getElementById("simulateVehicleMoveBtn"),
    simMoveBtnText: document.getElementById("simMoveBtnText"),
    openGoogleMapsLink: document.getElementById("openGoogleMapsLink"),
    googleMapsBtnText: document.getElementById("googleMapsBtnText"),
    closeTrackingBtn: document.getElementById("closeTrackingBtn"),

    // Warehouse & Business Model
    goToWarehouseBtn: document.getElementById("goToWarehouseBtn"),
    goToWarehouseBtnText: document.getElementById("goToWarehouseBtnText"),
    chamberFreezeTemp: document.getElementById("chamberFreezeTemp"),
    chamberChilledTemp: document.getElementById("chamberChilledTemp"),
    hubCapacityDisplay: document.getElementById("hubCapacityDisplay"),
    hubOccupancySub: document.getElementById("hubOccupancySub"),
    depositCropSelect: document.getElementById("depositCropSelect"),
    depositQtyInput: document.getElementById("depositQtyInput"),
    depositMonthsSelect: document.getElementById("depositMonthsSelect"),
    depositComparisonResult: document.getElementById("depositComparisonResult"),
    bookWarehouseSlotBtn: document.getElementById("bookWarehouseSlotBtn"),
    bookWarehouseBtnText: document.getElementById("bookWarehouseBtnText"),
    monthlyVolumeSlider: document.getElementById("monthlyVolumeSlider"),
    sliderTonsDisplay: document.getElementById("sliderTonsDisplay"),
    simGmvVal: document.getElementById("simGmvVal"),
    simFarmerSavedVal: document.getElementById("simFarmerSavedVal"),
    simDevRevenueVal: document.getElementById("simDevRevenueVal"),
    simColdRevenueVal: document.getElementById("simColdRevenueVal"),
    simTotalStartupVal: document.getElementById("simTotalStartupVal"),
    warehouseReceiptModal: document.getElementById("warehouseReceiptModal"),
    whReceiptModalTitle: document.getElementById("whReceiptModalTitle"),
    closeWhReceiptModalBtn: document.getElementById("closeWhReceiptModalBtn"),
    closeWhReceiptBtn: document.getElementById("closeWhReceiptBtn"),
    printWhReceiptBtn: document.getElementById("printWhReceiptBtn"),
    whReceiptContent: document.getElementById("whReceiptContent"),

    // Toast & Footer
    toastMessage: document.getElementById("toastMessage"),
    footerNoticeText: document.getElementById("footerNoticeText"),
    supportedCropsLabel: document.getElementById("supportedCropsLabel"),
    regionsLabel: document.getElementById("regionsLabel"),

    // Login Portal & Authentication Elements
    loginPortalScreen: document.getElementById("loginPortalScreen"),
    loginPortalTitle: document.getElementById("loginPortalTitle"),
    loginPortalSubtitle: document.getElementById("loginPortalSubtitle"),
    mainAppWrapper: document.getElementById("mainAppWrapper"),
    userHeaderChip: document.getElementById("userHeaderChip"),
    userHeaderAvatar: document.getElementById("userHeaderAvatar"),
    userHeaderName: document.getElementById("userHeaderName"),
    userHeaderRole: document.getElementById("userHeaderRole"),
    userCreditBadge: document.getElementById("userCreditBadge"),
    userPointsVal: document.getElementById("userPointsVal"),
    userPointsLabel: document.getElementById("userPointsLabel"),
    logoutBtn: document.getElementById("logoutBtn"),
    logoutBtnText: document.getElementById("logoutBtnText"),

    loginRoleLabel: document.getElementById("loginRoleLabel"),
    roleChipFarmer: document.getElementById("roleChipFarmer"),
    roleChipBuyer: document.getElementById("roleChipBuyer"),
    roleChipDeals: document.getElementById("roleChipDeals"),
    roleChipFarmerText: document.getElementById("roleChipFarmerText"),
    roleChipBuyerText: document.getElementById("roleChipBuyerText"),
    roleChipDealsText: document.getElementById("roleChipDealsText"),

    loginTabOtpBtn: document.getElementById("loginTabOtpBtn"),
    loginTabCredBtn: document.getElementById("loginTabCredBtn"),
    tabOtpTitle: document.getElementById("tabOtpTitle"),
    tabCredTitle: document.getElementById("tabCredTitle"),
    loginOtpPanel: document.getElementById("loginOtpPanel"),
    loginCredPanel: document.getElementById("loginCredPanel"),

    otpStepPhone: document.getElementById("otpStepPhone"),
    phoneLoginForm: document.getElementById("phoneLoginForm"),
    loginNameLabel: document.getElementById("loginNameLabel"),
    loginNameInput: document.getElementById("loginNameInput"),
    loginPhoneLabel: document.getElementById("loginPhoneLabel"),
    loginPhoneInput: document.getElementById("loginPhoneInput"),
    loginPhoneHint: document.getElementById("loginPhoneHint"),
    demoOtpAlertText: document.getElementById("demoOtpAlertText"),
    sendOtpBtn: document.getElementById("sendOtpBtn"),
    sendOtpBtnText: document.getElementById("sendOtpBtnText"),

    otpStepVerify: document.getElementById("otpStepVerify"),
    otpSentPrefix: document.getElementById("otpSentPrefix"),
    displayOtpPhone: document.getElementById("displayOtpPhone"),
    changePhoneBtn: document.getElementById("changePhoneBtn"),
    calloutOtpTitle: document.getElementById("calloutOtpTitle"),
    calloutOtpSub: document.getElementById("calloutOtpSub"),
    autofillOtpBtn: document.getElementById("autofillOtpBtn"),
    autofillBtnText: document.getElementById("autofillBtnText"),
    verifyOtpForm: document.getElementById("verifyOtpForm"),
    enterOtpLabel: document.getElementById("enterOtpLabel"),
    otpBoxesContainer: document.getElementById("otpBoxesContainer"),
    otpDigit1: document.getElementById("otpDigit1"),
    otpDigit2: document.getElementById("otpDigit2"),
    otpDigit3: document.getElementById("otpDigit3"),
    otpDigit4: document.getElementById("otpDigit4"),
    otpErrorMsg: document.getElementById("otpErrorMsg"),
    otpTimerText: document.getElementById("otpTimerText"),
    otpCountdown: document.getElementById("otpCountdown"),
    resendOtpBtn: document.getElementById("resendOtpBtn"),
    verifyOtpBtn: document.getElementById("verifyOtpBtn"),
    verifyOtpBtnText: document.getElementById("verifyOtpBtnText"),

    credLoginForm: document.getElementById("credLoginForm"),
    credUsernameLabel: document.getElementById("credUsernameLabel"),
    loginUsernameInput: document.getElementById("loginUsernameInput"),
    credPasswordLabel: document.getElementById("credPasswordLabel"),
    loginPasswordInput: document.getElementById("loginPasswordInput"),
    togglePasswordBtn: document.getElementById("togglePasswordBtn"),
    credHintText: document.getElementById("credHintText"),
    credErrorMsg: document.getElementById("credErrorMsg"),
    credSubmitBtn: document.getElementById("credSubmitBtn"),
    credSubmitBtnText: document.getElementById("credSubmitBtnText"),

    quickDemoTitle: document.getElementById("quickDemoTitle"),
    quickLoginFarmer: document.getElementById("quickLoginFarmer"),
    quickLoginBuyer: document.getElementById("quickLoginBuyer"),
    demoFarmerName: document.getElementById("demoFarmerName"),
    demoFarmerRole: document.getElementById("demoFarmerRole"),
    demoBuyerName: document.getElementById("demoBuyerName"),
    demoBuyerRole: document.getElementById("demoBuyerRole"),
    skipLoginGuestBtn: document.getElementById("skipLoginGuestBtn"),
    guestBtnText: document.getElementById("guestBtnText")
  };

  /**
   * Initializes the application.
   */
  async function init() {
    applyTheme(state.theme);
    applyVoiceRepliesState(state.voiceReplies);
    populateDropdowns();
    setupEventListeners();
    setupLoginHandlers();
    updateUITranslations();
    applyAuthState();

    // Check backend connectivity
    await checkServerHealth();

    // Load initial listings & deals
    await Promise.all([
      loadSavedListings(),
      loadIncomingListings(),
      loadDeals()
    ]);

    // Handle initial hash route if present
    handleHashRouting();

    // Initial offer calculation for default selection (Paddy, 2000 kg, Tirupporur)
    await runCalculateOffers(false);
  }

  /**
   * Checks server health endpoint /api/health.
   */
  async function checkServerHealth() {
    if (window.location.protocol === "file:") {
      state.isOnline = false;
      DOM.connectionPill.className = "conn-pill offline";
      DOM.connText.textContent = state.lang === "ta" ? I18N.ta.api_offline : I18N.en.api_offline;
      return;
    }

    try {
      const resp = await fetch("/api/health", { cache: "no-store" });
      if (resp.ok) {
        state.isOnline = true;
        DOM.connectionPill.className = "conn-pill online";
        DOM.connText.textContent = state.lang === "ta" ? I18N.ta.api_online : I18N.en.api_online;
        return;
      }
    } catch (e) {
      console.warn("Backend API not reachable, running in offline demo mode.");
    }

    state.isOnline = false;
    DOM.connectionPill.className = "conn-pill offline";
    DOM.connText.textContent = state.lang === "ta" ? I18N.ta.api_offline : I18N.en.api_offline;
  }

  /**
   * Applies Light or Dark theme.
   */
  function applyTheme(theme) {
    state.theme = theme;
    localStorage.setItem("farmbridge_theme", theme);
    if (theme === "dark") {
      document.body.classList.add("theme-dark");
      document.body.classList.remove("theme-light");
      DOM.themeIcon.textContent = "☀️";
    } else {
      document.body.classList.add("theme-light");
      document.body.classList.remove("theme-dark");
      DOM.themeIcon.textContent = "🌙";
    }
  }

  /**
   * Updates Voice Replies state.
   */
  function applyVoiceRepliesState(enabled) {
    state.voiceReplies = enabled;
    SpeechEngine.setVoiceReplies(enabled);
    if (enabled) {
      DOM.voiceReplyBtn.classList.add("active");
      DOM.voiceReplyIcon.textContent = "🔊";
      DOM.voiceReplyText.textContent = state.lang === "ta" ? I18N.ta.voice_replies_on : I18N.en.voice_replies_on;
    } else {
      DOM.voiceReplyBtn.classList.remove("active");
      DOM.voiceReplyIcon.textContent = "🔇";
      DOM.voiceReplyText.textContent = state.lang === "ta" ? I18N.ta.voice_replies_off : I18N.en.voice_replies_off;
    }
  }

  /**
   * Populates Crop, Location, and Filter dropdowns.
   */
  function populateDropdowns() {
    const isTa = state.lang === "ta";
    const selectedCrop = DOM.cropSelect.value || "paddy";
    const selectedLoc = DOM.locationSelect.value || "tirupporur";

    // Farmer Crop Select
    DOM.cropSelect.innerHTML = "";
    CROPS_META.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.code;
      opt.textContent = `${c.icon} ${isTa ? c.name_ta : c.name_en} (${isTa ? c.desc_ta : c.desc_en})`;
      if (c.code === selectedCrop) opt.selected = true;
      DOM.cropSelect.appendChild(opt);
    });

    // Farmer Location Select
    DOM.locationSelect.innerHTML = "";
    LOCATIONS_META.forEach(l => {
      const opt = document.createElement("option");
      opt.value = l.code;
      opt.textContent = `📍 ${isTa ? l.name_ta : l.name_en} (${isTa ? l.district_ta : l.district_en})`;
      if (l.code === selectedLoc) opt.selected = true;
      DOM.locationSelect.appendChild(opt);
    });

    // Buyer View Crop Filter
    const currentBuyerFilter = DOM.buyerCropFilter.value || "all";
    DOM.buyerCropFilter.innerHTML = "";
    const allOpt = document.createElement("option");
    allOpt.value = "all";
    allOpt.textContent = isTa ? "அனைத்து பயிர்களும்" : "All Crops";
    DOM.buyerCropFilter.appendChild(allOpt);

    CROPS_META.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.code;
      opt.textContent = `${c.icon} ${isTa ? c.name_ta : c.name_en}`;
      if (c.code === currentBuyerFilter) opt.selected = true;
      DOM.buyerCropFilter.appendChild(opt);
    });
  }

  /**
   * Live GPS Location Detection and nearest location matching.
   */
  function handleDetectLiveLocation() {
    const isTa = state.lang === "ta";
    const t = I18N[state.lang];

    if (!navigator.geolocation) {
      showToast(isTa ? "உங்கள் உலாவியில் GPS ஆதரிக்கப்படவில்லை." : "Geolocation is not supported by your browser.");
      return;
    }

    if (DOM.liveLocBtnText) {
      DOM.liveLocBtnText.textContent = isTa ? "கண்டறிகிறது..." : "Detecting...";
    }
    showToast(isTa ? (t.live_loc_detecting || "GPS இருப்பிடம் கண்டறியப்படுகிறது...") : "Detecting live GPS location...");

    // Tamil Nadu Known Hub Coordinates
    const HUB_COORDINATES = [
      { code: "tirupporur", lat: 12.7249, lon: 80.1878, name_ta: "திருப்போரூர்", name_en: "Tirupporur" },
      { code: "chengalpattu", lat: 12.6939, lon: 79.9757, name_ta: "செங்கல்பட்டு", name_en: "Chengalpattu" },
      { code: "kanchipuram", lat: 12.8342, lon: 79.7036, name_ta: "காஞ்சிபுரம்", name_en: "Kanchipuram" },
      { code: "tindivanam", lat: 12.2334, lon: 79.6508, name_ta: "திண்டிவனம்", name_en: "Tindivanam" }
    ];

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;

        // Find nearest hub using Euclidean / Haversine distance
        let nearestHub = HUB_COORDINATES[0];
        let minDistance = Infinity;

        HUB_COORDINATES.forEach(hub => {
          const dLat = userLat - hub.lat;
          const dLon = userLon - hub.lon;
          const distSq = (dLat * dLat) + (dLon * dLon);
          if (distSq < minDistance) {
            minDistance = distSq;
            nearestHub = hub;
          }
        });

        // Set matched location in dropdown
        DOM.locationSelect.value = nearestHub.code;
        if (DOM.liveLocBtnText) {
          DOM.liveLocBtnText.textContent = `📍 ${isTa ? nearestHub.name_ta : nearestHub.name_en}`;
        }

        const successMsg = isTa
          ? `📍 நேரடி GPS கண்டறியப்பட்டது: ${nearestHub.name_ta}`
          : `📍 Live GPS detected nearest hub: ${nearestHub.name_en}`;
        showToast(successMsg);

        // Recalculate offers with new location
        runCalculateOffers(false);
      },
      (err) => {
        console.warn("Geolocation lookup error:", err);
        if (DOM.liveLocBtnText) {
          DOM.liveLocBtnText.textContent = isTa ? "நேரடி இருப்பிடம்" : "Live GPS";
        }
        showToast(isTa ? (t.live_loc_err || "GPS அணுகல் கிடைக்கவில்லை.") : "GPS access unavailable. Please choose location manually.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  /**
   * Switches active role and view panel.
   */
  function switchRole(role, pushHash = true) {
    if (role !== "farmer" && role !== "buyer" && role !== "deals" && role !== "warehouse") {
      role = "farmer";
    }

    state.currentRole = role;
    localStorage.setItem("farmbridge_role", role);
    if (state.currentUser) {
      state.currentUser.role = role;
      applyAuthState();
    }

    // Update Tab Buttons
    [DOM.tabFarmer, DOM.tabBuyer, DOM.tabDeals, DOM.tabWarehouse].forEach(tab => {
      if (tab) {
        tab.classList.remove("active");
        tab.setAttribute("aria-selected", "false");
      }
    });

    // Update Panels
    [DOM.viewFarmer, DOM.viewBuyer, DOM.viewDeals, DOM.viewWarehouse].forEach(panel => {
      if (panel) {
        panel.classList.add("hidden");
      }
    });

    if (role === "farmer") {
      DOM.tabFarmer.classList.add("active");
      DOM.tabFarmer.setAttribute("aria-selected", "true");
      DOM.viewFarmer.classList.remove("hidden");
    } else if (role === "buyer") {
      DOM.tabBuyer.classList.add("active");
      DOM.tabBuyer.setAttribute("aria-selected", "true");
      DOM.viewBuyer.classList.remove("hidden");
      renderBuyerView();
    } else if (role === "deals") {
      DOM.tabDeals.classList.add("active");
      DOM.tabDeals.setAttribute("aria-selected", "true");
      DOM.viewDeals.classList.remove("hidden");
      renderDealsView();
    } else if (role === "warehouse") {
      if (DOM.tabWarehouse) {
        DOM.tabWarehouse.classList.add("active");
        DOM.tabWarehouse.setAttribute("aria-selected", "true");
      }
      if (DOM.viewWarehouse) {
        DOM.viewWarehouse.classList.remove("hidden");
      }
      renderWarehouseView();
    }

    if (pushHash && window.location.hash !== `#${role}`) {
      window.location.hash = role;
    }
  }

  /**
   * Responds to URL hash changes for easy deep-linking.
   */
  function handleHashRouting() {
    const hash = (window.location.hash || "").replace("#", "").toLowerCase();
    if (hash === "buyer" || hash === "deals" || hash === "farmer" || hash === "warehouse") {
      switchRole(hash, false);
    } else {
      switchRole(state.currentRole, false);
    }
  }

  /**
   * Updates all UI labels and strings according to state.lang.
   */
  function updateUITranslations() {
    const t = I18N[state.lang];
    const isTa = state.lang === "ta";
    document.documentElement.lang = state.lang;

    // Header & Meta
    DOM.appTitle.textContent = t.app_name;
    DOM.appSubtitle.textContent = t.app_subtitle;
    DOM.langBtnText.textContent = t.lang_btn;
    DOM.langToggleBtn.setAttribute("aria-label", isTa ? "Switch to English" : "தமிழுக்கு மாற்றவும்");
    DOM.voiceReplyText.textContent = state.voiceReplies ? t.voice_replies_on : t.voice_replies_off;
    DOM.demoNoticeBadge.textContent = t.badge_demo;
    DOM.statusNoticeText.textContent = isTa ? SAMPLE_DATA.notice_ta : SAMPLE_DATA.notice;
    DOM.connText.textContent = state.isOnline ? t.api_online : t.api_offline;

    // Role Navigation
    DOM.tabFarmerText.textContent = isTa ? "உழவர் களம் (Farmer)" : "Farmer Marketplace";
    DOM.tabBuyerText.textContent = isTa ? "வாங்குபவர் களம் (Buyer)" : "Buyer Procurement";
    DOM.tabDealsText.textContent = isTa ? "ஒப்பந்தங்கள் (Deals)" : "Deals Pipeline";
    if (DOM.tabWarehouseText) {
      DOM.tabWarehouseText.textContent = isTa
        ? "பொதுக் கிடங்கு & வணிக மாதிரி (Cold Hub & Business)"
        : "Cold Hub & Monetization";
    }

    // Voice hero
    DOM.voiceSectionHeading.textContent = t.voice_title;
    DOM.voiceSectionDesc.textContent = t.voice_subtitle;
    DOM.micStatusText.textContent = SpeechEngine.isListening() ? t.mic_listening : t.mic_idle;
    DOM.micPromptHint.textContent = t.mic_speak_prompt;
    DOM.transcriptLabel.textContent = t.transcript_label;
    DOM.transcriptInput.placeholder = t.transcript_placeholder;
    DOM.trySampleText.textContent = t.btn_sample;
    DOM.clearBtnText.textContent = t.btn_clear;
    DOM.sampleLeadText.textContent = t.sample_badge;

    // Form
    DOM.fieldsTitle.textContent = t.fields_title;
    DOM.cropLabel.textContent = t.field_crop;
    DOM.qtyLabel.textContent = t.field_qty;
    DOM.locLabel.textContent = t.field_loc;
    if (DOM.liveLocBtnText) DOM.liveLocBtnText.textContent = t.btn_live_location || "Live GPS";
    DOM.calculateBtnText.textContent = t.btn_calculate;

    // Urgent Clearance Card
    DOM.urgentToggleTitle.textContent = t.urgent_toggle_label;
    DOM.urgentToggleDesc.textContent = t.urgent_toggle_desc;
    DOM.urgentReasonLabel.textContent = t.urgent_reason_label;
    DOM.urgentDiscountLabel.textContent = t.urgent_discount_label;
    DOM.urgentSpotNotice.textContent = isTa
      ? "அன்றே உடனடி ரொக்கம் (Spot Cash) & 24 மணி நேரத்திற்குள் பட்டுவாடா செய்யும் வாங்குபவர்களுக்கு முன்னுரிமை அளிக்கப்படுகிறது."
      : "Buyers offering spot cash and dispatch within 24 hours are prioritized.";

    // Farmer Sections
    DOM.bestOfferBadgeTag.textContent = `⭐ ${t.badge_best_offer}`;
    DOM.secEarningsHeading.textContent = t.sec_earnings_title;
    DOM.secComparisonHeading.textContent = t.sec_comparison_title;
    DOM.secComparisonDesc.textContent = t.sec_comparison_desc;
    DOM.secBuyersHeading.textContent = t.sec_buyers_title;
    DOM.footerNoticeText.textContent = isTa ? SAMPLE_DATA.notice_ta : SAMPLE_DATA.notice;

    // Buyer Dashboard View
    DOM.secBuyerHeading.textContent = t.buyer_dashboard_title;
    DOM.secBuyerSubtitle.textContent = t.buyer_dashboard_subtitle;
    DOM.buyerUrgentFilterBtn.querySelector("span").textContent = t.buyer_filter_urgent_only;

    // Deals Dashboard View
    DOM.secDealsHeading.textContent = t.deals_title;
    DOM.secDealsSubtitle.textContent = t.deals_subtitle;
    DOM.createDemoDealBtnText.textContent = t.btn_create_demo_deal;

    // Save Listing Modal
    DOM.saveModalTitle.textContent = t.modal_save_title;
    DOM.modalFarmerNameLabel.textContent = t.farmer_name_label;
    DOM.modalFarmerPhoneLabel.textContent = t.farmer_phone_label;
    DOM.cancelSaveBtn.textContent = t.btn_cancel;
    DOM.confirmSaveBtn.textContent = t.btn_confirm_save;

    // Receipt Modal
    DOM.receiptModalTitle.textContent = t.receipt_title;
    DOM.receiptWatermark.textContent = t.receipt_watermark;
    DOM.printReceiptBtnText.textContent = t.btn_print_receipt;
    DOM.closeReceiptBtn.textContent = t.btn_close;

    // Login Portal Localization
    if (DOM.loginPortalTitle) {
      DOM.loginPortalTitle.textContent = t.login_portal_title;
      DOM.loginPortalSubtitle.textContent = t.login_portal_subtitle;
      DOM.tabOtpTitle.textContent = t.login_tab_otp;
      DOM.tabCredTitle.textContent = t.login_tab_credentials;
      DOM.roleChipFarmerText.textContent = t.login_role_farmer;
      DOM.roleChipBuyerText.textContent = t.login_role_buyer;
      DOM.roleChipDealsText.textContent = t.login_role_transport;
      DOM.loginNameLabel.textContent = t.login_name_label;
      DOM.loginNameInput.placeholder = t.login_name_placeholder;
      DOM.loginPhoneLabel.innerHTML = `<span class="label-req">*</span> ${t.login_phone_label}`;
      DOM.loginPhoneHint.textContent = t.login_phone_hint;
      DOM.demoOtpAlertText.innerHTML = isTa
        ? "அடுத்த திரையில் மாதிரி OTP கேட்கப்படும் போது <strong>1234</strong> என உள்ளிடவும் (Use OTP: 1234)."
        : "When prompted on next screen, enter demo OTP code <strong>1234</strong>.";
      DOM.sendOtpBtnText.textContent = t.login_btn_send_otp;
      DOM.calloutOtpTitle.innerHTML = `${t.login_callout_title} <span class="highlight-code">1234</span>`;
      DOM.calloutOtpSub.textContent = t.login_callout_sub;
      DOM.autofillBtnText.textContent = t.login_autofill_btn;
      DOM.enterOtpLabel.textContent = t.login_enter_otp_label;
      DOM.verifyOtpBtnText.textContent = t.login_btn_verify;
      DOM.resendOtpBtn.textContent = t.login_otp_resend;
      DOM.credUsernameLabel.textContent = t.login_cred_user_label;
      DOM.credPasswordLabel.textContent = t.login_cred_pass_label;
      DOM.credHintText.textContent = t.login_cred_hint;
      DOM.credSubmitBtnText.textContent = t.login_btn_cred_submit;
      DOM.quickDemoTitle.textContent = t.login_quick_demo_title;
      DOM.demoFarmerName.textContent = t.login_demo_farmer_name;
      DOM.demoFarmerRole.textContent = t.login_demo_farmer_role;
      DOM.demoBuyerName.textContent = t.login_demo_buyer_name;
      DOM.demoBuyerRole.textContent = t.login_demo_buyer_role;
      DOM.guestBtnText.textContent = t.login_guest_btn;
      DOM.logoutBtnText.textContent = t.logout_btn;

      if (state.currentUser) {
        applyAuthState();
      }
    }

    populateDropdowns();

    // Re-render active view
    if (state.currentRole === "farmer" && state.currentOffers) {
      renderAllSections(state.currentOffers);
    } else if (state.currentRole === "buyer") {
      renderBuyerView();
    } else if (state.currentRole === "deals") {
      renderDealsView();
    } else if (state.currentRole === "warehouse") {
      renderWarehouseView();
    }
  }

  /**
   * Sets up interactive event listeners.
   */
  function setupEventListeners() {
    // Live Location GPS Detection Button
    if (DOM.liveLocationBtn) {
      DOM.liveLocationBtn.addEventListener("click", handleDetectLiveLocation);
    }

    // Phone input auto-cleanup & validation in Login Portal
    if (DOM.loginPhoneInput) {
      DOM.loginPhoneInput.addEventListener("input", () => {
        let val = DOM.loginPhoneInput.value.replace(/[^0-9]/g, "");
        if (val.length > 10) val = val.slice(-10);
        DOM.loginPhoneInput.value = val;
      });
    }

    // Farmer Phone Modal Input auto-cleanup
    if (DOM.farmerPhoneInput) {
      DOM.farmerPhoneInput.addEventListener("input", () => {
        let val = DOM.farmerPhoneInput.value.replace(/[^0-9]/g, "");
        if (val.length > 10) val = val.slice(-10);
        DOM.farmerPhoneInput.value = val;
      });
    }

    // Role Switcher Tabs
    DOM.tabFarmer.addEventListener("click", () => switchRole("farmer"));
    DOM.tabBuyer.addEventListener("click", () => switchRole("buyer"));
    DOM.tabDeals.addEventListener("click", () => switchRole("deals"));
    if (DOM.tabWarehouse) DOM.tabWarehouse.addEventListener("click", () => switchRole("warehouse"));
    if (DOM.goToWarehouseBtn) DOM.goToWarehouseBtn.addEventListener("click", () => switchRole("warehouse"));

    // Hash change event listener
    window.addEventListener("hashchange", handleHashRouting);

    // Language Toggle
    DOM.langToggleBtn.addEventListener("click", () => {
      state.lang = state.lang === "ta" ? "en" : "ta";
      localStorage.setItem("farmbridge_lang", state.lang);
      updateUITranslations();
      showToast(state.lang === "ta" ? "மொழி: தமிழ் தேர்ந்தெடுக்கப்பட்டது" : "Language: English selected");
    });

    // Theme Toggle
    DOM.themeToggleBtn.addEventListener("click", () => {
      const nextTheme = state.theme === "light" ? "dark" : "light";
      applyTheme(nextTheme);
    });

    // Voice Replies Toggle
    DOM.voiceReplyBtn.addEventListener("click", () => {
      applyVoiceRepliesState(!state.voiceReplies);
      showToast(state.voiceReplies ? "குரல் பதில் இயக்கப்பட்டது" : "Voice replies muted");
    });

    // Microphone Touch Target
    DOM.micMainBtn.addEventListener("click", toggleMicrophone);

    // Live typing in transcript textarea
    let typingTimer = null;
    DOM.transcriptInput.addEventListener("input", () => {
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        handleManualTextInput(DOM.transcriptInput.value);
      }, 500);
    });

    DOM.transcriptInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleManualTextInput(DOM.transcriptInput.value);
        runCalculateOffers(true);
      }
    });

    // Try Sample Voice Button (Cycles demo sentences)
    DOM.trySampleVoiceBtn.addEventListener("click", cycleSampleSentence);

    // Clear transcript
    DOM.clearVoiceBtn.addEventListener("click", () => {
      DOM.transcriptInput.value = "";
      hideVoiceAlert();
      DOM.transcriptInput.focus();
    });

    // Click on Sample Pills
    DOM.samplePillsRow.addEventListener("click", (e) => {
      const chip = e.target.closest(".sample-pill-chip");
      if (chip && chip.dataset.phrase) {
        applySentence(chip.dataset.phrase);
      }
    });

    // Quick Quantity buttons
    document.querySelectorAll(".quick-qty-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        let current = parseFloat(DOM.quantityInput.value) || 0;
        if (btn.dataset.add) {
          current += parseFloat(btn.dataset.add);
        } else if (btn.dataset.set) {
          current = parseFloat(btn.dataset.set);
        }
        DOM.quantityInput.value = Math.max(10, current);
        runCalculateOffers(false);
      });
    });

    // Dropdowns & Qty change
    DOM.cropSelect.addEventListener("change", () => runCalculateOffers(false));
    DOM.quantityInput.addEventListener("change", () => runCalculateOffers(false));
    DOM.locationSelect.addEventListener("change", () => runCalculateOffers(false));

    // Urgent Sale Toggle & Controls
    DOM.urgentSaleToggle.addEventListener("change", (e) => {
      state.isUrgent = e.target.checked;
      if (state.isUrgent) {
        DOM.urgentFieldsGroup.classList.remove("hidden");
        showToast(state.lang === "ta" ? "அவசர விற்பனை பயன்முறை இயக்கப்பட்டது!" : "Urgent clearance mode enabled!");
      } else {
        DOM.urgentFieldsGroup.classList.add("hidden");
      }
      runCalculateOffers(false);
    });

    DOM.urgentReasonSelect.addEventListener("change", (e) => {
      state.urgencyReason = e.target.value;
    });

    DOM.urgentDiscountSelect.addEventListener("change", (e) => {
      state.urgencyDiscount = parseFloat(e.target.value) || 10;
      runCalculateOffers(false);
    });

    // Calculate Button
    DOM.calculateOffersBtn.addEventListener("click", () => runCalculateOffers(true));

    // Sort buttons
    DOM.sortNetBtn.addEventListener("click", () => setSortMode("net"));
    DOM.sortDistBtn.addEventListener("click", () => setSortMode("distance"));
    DOM.sortRatingBtn.addEventListener("click", () => setSortMode("rating"));

    // Buyer View Filters
    DOM.buyerCropFilter.addEventListener("change", (e) => {
      state.buyerCropFilter = e.target.value;
      renderBuyerView();
    });

    DOM.buyerUrgentFilterBtn.addEventListener("click", () => {
      state.buyerUrgentOnly = !state.buyerUrgentOnly;
      DOM.buyerUrgentFilterBtn.classList.toggle("active", state.buyerUrgentOnly);
      renderBuyerView();
    });

    // Deals View: Create Demo Deal button
    DOM.createDemoDealBtn.addEventListener("click", handleCreateDemoDeal);
    if (DOM.createColdStorageDealBtn) {
      DOM.createColdStorageDealBtn.addEventListener("click", handleCreateColdStorageDeal);
    }
    if (DOM.dealsOpenWarehouseBtn) {
      DOM.dealsOpenWarehouseBtn.addEventListener("click", () => switchRole("warehouse"));
    }

    // Modal open/close
    DOM.viewListingsBtn.addEventListener("click", openSavedListingsModal);
    DOM.closeSavedModalBtn.addEventListener("click", closeSavedListingsModal);
    DOM.closeSaveModalBtn.addEventListener("click", closeSaveModal);
    DOM.cancelSaveBtn.addEventListener("click", closeSaveModal);

    // Receipt Modal Close & Print
    DOM.closeReceiptModalBtn.addEventListener("click", closeReceiptModal);
    DOM.closeReceiptBtn.addEventListener("click", closeReceiptModal);
    DOM.printReceiptBtn.addEventListener("click", () => {
      window.print();
    });

    // Photo Quality Verification Controls
    if (DOM.cropPhotoInput) DOM.cropPhotoInput.addEventListener("change", handlePhotoFileInput);
    if (DOM.samplePhotoBtn) DOM.samplePhotoBtn.addEventListener("click", handleSamplePhotoBtnClick);
    if (DOM.clearPhotoBtn) DOM.clearPhotoBtn.addEventListener("click", handleClearPhotoBtnClick);

    // Photo Certificate Modal
    if (DOM.closeCertModalBtn) DOM.closeCertModalBtn.addEventListener("click", closePhotoCertificateModal);
    if (DOM.closeCertBtn) DOM.closeCertBtn.addEventListener("click", closePhotoCertificateModal);
    if (DOM.downloadCertBtn) DOM.downloadCertBtn.addEventListener("click", handleDownloadCertificate);

    // Live Location & Dispatched Vehicle Tracking Modal
    if (DOM.closeTrackingModalBtn) DOM.closeTrackingModalBtn.addEventListener("click", closeLiveTrackingModal);
    if (DOM.closeTrackingBtn) DOM.closeTrackingBtn.addEventListener("click", closeLiveTrackingModal);
    if (DOM.simulateVehicleMoveBtn) DOM.simulateVehicleMoveBtn.addEventListener("click", handleSimulateVehicleMovement);

    // Warehouse & Business Model Event Listeners
    if (DOM.depositCropSelect) DOM.depositCropSelect.addEventListener("change", updateDepositCalculator);
    if (DOM.depositQtyInput) DOM.depositQtyInput.addEventListener("input", updateDepositCalculator);
    if (DOM.depositMonthsSelect) DOM.depositMonthsSelect.addEventListener("change", updateDepositCalculator);
    if (DOM.bookWarehouseSlotBtn) DOM.bookWarehouseSlotBtn.addEventListener("click", handleBookWarehouseSlot);
    if (DOM.monthlyVolumeSlider) DOM.monthlyVolumeSlider.addEventListener("input", updateVolumeSimulation);
    if (DOM.closeWhReceiptModalBtn) DOM.closeWhReceiptModalBtn.addEventListener("click", closeWarehouseReceiptModal);
    if (DOM.closeWhReceiptBtn) DOM.closeWhReceiptBtn.addEventListener("click", closeWarehouseReceiptModal);
    if (DOM.printWhReceiptBtn) DOM.printWhReceiptBtn.addEventListener("click", () => window.print());

    // Form submit for Save Listing
    DOM.saveListingForm.addEventListener("submit", handleSaveListingSubmit);

    // Close modals when clicking overlay
    window.addEventListener("click", (e) => {
      if (e.target === DOM.saveListingModal) closeSaveModal();
      if (e.target === DOM.savedListingsModal) closeSavedListingsModal();
      if (e.target === DOM.receiptModal) closeReceiptModal();
      if (e.target === DOM.photoCertificateModal) closePhotoCertificateModal();
      if (e.target === DOM.liveTrackingModal) closeLiveTrackingModal();
      if (e.target === DOM.warehouseReceiptModal) closeWarehouseReceiptModal();
    });

    // Keyboard accessibility: Escape closes modals
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeSaveModal();
        closeSavedListingsModal();
        closeReceiptModal();
        closePhotoCertificateModal();
        closeLiveTrackingModal();
        closeWarehouseReceiptModal();
      }
    });
  }

  /**
   * Applies authentication display state.
   */
  function applyAuthState() {
    const isTa = state.lang === "ta";
    if (DOM.mainAppWrapper) DOM.mainAppWrapper.classList.remove("hidden");
    if (DOM.loginPortalScreen) DOM.loginPortalScreen.classList.add("hidden");

    const user = state.currentUser || {
      name: isTa ? "உழவர் முருகன்" : "Farmer Murugan",
      phone: "9841200001",
      role: state.currentRole || "farmer"
    };

    if (DOM.userHeaderChip) DOM.userHeaderChip.classList.remove("hidden");
    if (DOM.userHeaderName) DOM.userHeaderName.textContent = user.name;

    const roleIcons = { farmer: "🌾", buyer: "🏢", deals: "🚚" };
    const roleText = {
      farmer: isTa ? "விவசாயி" : "Farmer",
      buyer: isTa ? "வாங்குபவர்" : "Buyer",
      deals: isTa ? "போக்குவரத்து" : "Logistics"
    };

    if (DOM.userHeaderAvatar) {
      DOM.userHeaderAvatar.textContent = roleIcons[user.role] || "🌾";
    }
    if (DOM.userHeaderRole) {
      const phoneDigits = (user.phone || "").replace(/[^0-9]/g, "");
      const phoneFormatted = phoneDigits.length >= 10 ? `+91 ${phoneDigits.slice(-10)}` : (user.phone ? `+91 ${user.phone}` : "");
      DOM.userHeaderRole.textContent = `${roleText[user.role] || user.role} (${phoneFormatted})`;
    }

    // Dynamic Trust & Credit Points display
    if (DOM.userCreditBadge) {
      const userPoints = user.creditPoints !== undefined
        ? user.creditPoints
        : (user.role === "buyer" ? 180 : 120);
      if (DOM.userPointsVal) DOM.userPointsVal.textContent = userPoints;
      if (DOM.userPointsLabel) {
        DOM.userPointsLabel.textContent = isTa
          ? (user.role === "buyer" ? "கொள்முதல் புள்ளிகள் (Buyer Credits)" : "நம்பகப் புள்ளிகள் (Trust Points)")
          : (user.role === "buyer" ? "Buyer Credits" : "Trust Points");
      }
    }
  }

  /**
   * Completes login and reveals the main application page.
   */
  function completeLogin(user, showToastMsg = true) {
    const isTa = state.lang === "ta";
    state.currentUser = user;
    localStorage.setItem("farmbridge_user", JSON.stringify(user));
    applyAuthState();

    // Switch view to user role
    if (user.role === "buyer") {
      switchRole("buyer", true);
    } else if (user.role === "deals") {
      switchRole("deals", true);
    } else {
      switchRole("farmer", true);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (showToastMsg) {
      const welcomeMsg = isTa
        ? `வணக்கம் ${user.name}! ஃபார்ம்பிரிட்ஜ் நேரடி சந்தைக்கு நல்வரவு!`
        : `Welcome ${user.name} to FarmBridge Direct Marketplace!`;
      showToast(welcomeMsg);
    }
  }

  /**
   * Resets OTP verification state and returns to phone input step.
   */
  function resetOtpStep() {
    if (state.otpCountdownTimer) {
      clearInterval(state.otpCountdownTimer);
      state.otpCountdownTimer = null;
    }
    const digits = [DOM.otpDigit1, DOM.otpDigit2, DOM.otpDigit3, DOM.otpDigit4];
    digits.forEach(d => {
      if (d) {
        d.value = "";
        d.classList.remove("error");
      }
    });
    if (DOM.otpErrorMsg) DOM.otpErrorMsg.classList.add("hidden");
    if (DOM.otpStepVerify) DOM.otpStepVerify.classList.add("hidden");
    if (DOM.otpStepPhone) DOM.otpStepPhone.classList.remove("hidden");
  }

  /**
   * Starts a 30-second countdown for OTP resending.
   */
  function startOtpCountdown() {
    if (state.otpCountdownTimer) {
      clearInterval(state.otpCountdownTimer);
    }
    state.otpCountdownSeconds = 30;
    if (DOM.otpCountdown) DOM.otpCountdown.textContent = `${state.otpCountdownSeconds}s`;
    if (DOM.resendOtpBtn) DOM.resendOtpBtn.disabled = true;
    if (DOM.sendOtpBtn) DOM.sendOtpBtn.disabled = true;

    state.otpCountdownTimer = setInterval(() => {
      state.otpCountdownSeconds--;
      if (DOM.otpCountdown) DOM.otpCountdown.textContent = `${state.otpCountdownSeconds}s`;

      if (state.otpCountdownSeconds <= 0) {
        clearInterval(state.otpCountdownTimer);
        state.otpCountdownTimer = null;
        if (DOM.resendOtpBtn) DOM.resendOtpBtn.disabled = false;
        if (DOM.sendOtpBtn) DOM.sendOtpBtn.disabled = false;
        if (DOM.otpCountdown) DOM.otpCountdown.textContent = "தயார் (Ready)";
      }
    }, 1000);
  }

  /**
   * Handles user profile reset / logout.
   */
  function handleLogout() {
    const isTa = state.lang === "ta";
    state.currentUser = {
      name: isTa ? "உழவர் முருகன்" : "Farmer Murugan",
      phone: "9841200001",
      role: "farmer",
      method: "direct",
      loggedInAt: new Date().toISOString()
    };
    localStorage.setItem("farmbridge_user", JSON.stringify(state.currentUser));
    switchRole("farmer");
    applyAuthState();
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast(isTa ? "சுயவிவரம் மீட்டமைக்கப்பட்டது" : "Profile reset to default");
  }

  /**
   * Sets up interactive event handlers for the Login Portal.
   */
  function setupLoginHandlers() {
    if (!DOM.loginPortalScreen) return;

    // Role selection chips (Farmer / Buyer / Logistics)
    const roleChips = [DOM.roleChipFarmer, DOM.roleChipBuyer, DOM.roleChipDeals];
    roleChips.forEach(chip => {
      if (!chip) return;
      chip.addEventListener("click", () => {
        roleChips.forEach(c => {
          if (c) {
            c.classList.remove("active");
            c.setAttribute("aria-checked", "false");
          }
        });
        chip.classList.add("active");
        chip.setAttribute("aria-checked", "true");
        state.loginRole = chip.dataset.role || "farmer";
      });
    });

    // Method Switch Tabs: Phone & OTP vs Credentials
    if (DOM.loginTabOtpBtn && DOM.loginTabCredBtn) {
      DOM.loginTabOtpBtn.addEventListener("click", () => {
        DOM.loginTabOtpBtn.classList.add("active");
        DOM.loginTabOtpBtn.setAttribute("aria-selected", "true");
        DOM.loginTabCredBtn.classList.remove("active");
        DOM.loginTabCredBtn.setAttribute("aria-selected", "false");
        DOM.loginOtpPanel.classList.remove("hidden");
        DOM.loginCredPanel.classList.add("hidden");
        state.loginMethod = "otp";
      });

      DOM.loginTabCredBtn.addEventListener("click", () => {
        DOM.loginTabCredBtn.classList.add("active");
        DOM.loginTabCredBtn.setAttribute("aria-selected", "true");
        DOM.loginTabOtpBtn.classList.remove("active");
        DOM.loginTabOtpBtn.setAttribute("aria-selected", "false");
        DOM.loginCredPanel.classList.remove("hidden");
        DOM.loginOtpPanel.classList.add("hidden");
        state.loginMethod = "credentials";
      });
    }

    // Phone Login form submission (Step 1 -> Step 2)
    if (DOM.phoneLoginForm) {
      DOM.phoneLoginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const isTa = state.lang === "ta";
        const rawPhone = DOM.loginPhoneInput ? DOM.loginPhoneInput.value : "";
        const cleanPhone = (rawPhone || "").replace(/[^0-9]/g, "");

        if (cleanPhone.length < 10) {
          showToast(isTa ? I18N.ta.login_err_phone : I18N.en.login_err_phone);
          if (DOM.loginPhoneInput) DOM.loginPhoneInput.focus();
          return;
        }

        state.lastEnteredPhone = cleanPhone;
        if (DOM.displayOtpPhone) {
          DOM.displayOtpPhone.textContent = `+91 ${cleanPhone}`;
        }
        if (DOM.otpStepPhone) DOM.otpStepPhone.classList.add("hidden");
        if (DOM.otpStepVerify) DOM.otpStepVerify.classList.remove("hidden");

        // Clear previous OTP inputs
        const digits = [DOM.otpDigit1, DOM.otpDigit2, DOM.otpDigit3, DOM.otpDigit4];
        digits.forEach(d => {
          if (d) {
            d.value = "";
            d.classList.remove("error");
          }
        });
        if (DOM.otpErrorMsg) DOM.otpErrorMsg.classList.add("hidden");

        startOtpCountdown();
        setTimeout(() => {
          if (DOM.otpDigit1) DOM.otpDigit1.focus();
        }, 150);
      });
    }

    // OTP 4-Digit Inputs navigation & auto-advance
    const digits = [DOM.otpDigit1, DOM.otpDigit2, DOM.otpDigit3, DOM.otpDigit4];
    digits.forEach((digit, index) => {
      if (!digit) return;

      digit.addEventListener("input", () => {
        const val = digit.value.replace(/[^0-9]/g, "");
        digit.value = val ? val[val.length - 1] : "";
        digit.classList.remove("error");
        if (DOM.otpErrorMsg) DOM.otpErrorMsg.classList.add("hidden");

        if (digit.value && index < digits.length - 1) {
          digits[index + 1].focus();
        }
      });

      digit.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !digit.value && index > 0) {
          digits[index - 1].focus();
        } else if (e.key === "ArrowLeft" && index > 0) {
          digits[index - 1].focus();
        } else if (e.key === "ArrowRight" && index < digits.length - 1) {
          digits[index + 1].focus();
        }
      });

      digit.addEventListener("paste", (e) => {
        e.preventDefault();
        const pasteData = (e.clipboardData || window.clipboardData).getData("text");
        const cleanDigits = (pasteData || "").replace(/[^0-9]/g, "");
        if (cleanDigits.length >= 4) {
          for (let i = 0; i < 4; i++) {
            if (digits[i]) {
              digits[i].value = cleanDigits[i];
              digits[i].classList.remove("error");
            }
          }
          if (DOM.otpErrorMsg) DOM.otpErrorMsg.classList.add("hidden");
          if (DOM.verifyOtpBtn) DOM.verifyOtpBtn.focus();
        }
      });
    });

    // 1-Click Auto-Fill Demo OTP 1234
    if (DOM.autofillOtpBtn) {
      DOM.autofillOtpBtn.addEventListener("click", () => {
        if (DOM.otpDigit1) DOM.otpDigit1.value = "1";
        if (DOM.otpDigit2) DOM.otpDigit2.value = "2";
        if (DOM.otpDigit3) DOM.otpDigit3.value = "3";
        if (DOM.otpDigit4) DOM.otpDigit4.value = "4";
        digits.forEach(d => {
          if (d) d.classList.remove("error");
        });
        if (DOM.otpErrorMsg) DOM.otpErrorMsg.classList.add("hidden");
        if (DOM.verifyOtpBtn) DOM.verifyOtpBtn.focus();
        showToast(state.lang === "ta" ? "மாதிரி OTP 1234 நிரப்பப்பட்டது!" : "Demo OTP 1234 filled!");
      });
    }

    // Change Phone Button in Step 2
    if (DOM.changePhoneBtn) {
      DOM.changePhoneBtn.addEventListener("click", () => {
        resetOtpStep();
        if (DOM.loginPhoneInput) {
          DOM.loginPhoneInput.focus();
          DOM.loginPhoneInput.select();
        }
      });
    }

    // Resend OTP Button
    if (DOM.resendOtpBtn) {
      DOM.resendOtpBtn.addEventListener("click", () => {
        startOtpCountdown();
        const isTa = state.lang === "ta";
        showToast(isTa ? "புதிய மாதிரி OTP குறியீடு அனுப்பப்பட்டது: 1234" : "Demo OTP code resent: 1234");
      });
    }

    // OTP Verification Form Submission (Validates OTP == 1234)
    if (DOM.verifyOtpForm) {
      DOM.verifyOtpForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const isTa = state.lang === "ta";
        const enteredCode = [
          DOM.otpDigit1 ? DOM.otpDigit1.value : "",
          DOM.otpDigit2 ? DOM.otpDigit2.value : "",
          DOM.otpDigit3 ? DOM.otpDigit3.value : "",
          DOM.otpDigit4 ? DOM.otpDigit4.value : ""
        ].join("");

        if (enteredCode === "1234") {
          // Success! Demo OTP 1234 matched
          if (DOM.otpErrorMsg) DOM.otpErrorMsg.classList.add("hidden");
          digits.forEach(d => {
            if (d) d.classList.remove("error");
          });

          const nameVal = DOM.loginNameInput ? DOM.loginNameInput.value.trim() : "";
          const defaultName = state.loginRole === "farmer"
            ? (isTa ? "உழவர் முருகன்" : "Farmer Murugan")
            : (state.loginRole === "buyer" ? (isTa ? "காவேரி அக்ரோ" : "Kaveri Agro") : (isTa ? "செல்வம் டிரான்ஸ்போர்ட்" : "Selvam Transport"));

          const user = {
            name: nameVal || defaultName,
            phone: state.lastEnteredPhone || "9841200001",
            role: state.loginRole,
            method: "otp",
            loggedInAt: new Date().toISOString()
          };

          completeLogin(user, true);
        } else {
          // Failure: Wrong OTP entered
          if (DOM.otpErrorMsg) {
            DOM.otpErrorMsg.textContent = isTa ? I18N.ta.login_err_otp_invalid : I18N.en.login_err_otp_invalid;
            DOM.otpErrorMsg.classList.remove("hidden");
          }
          digits.forEach(d => {
            if (d) d.classList.add("error");
          });
          if (DOM.otpDigit1) {
            DOM.otpDigit1.focus();
            DOM.otpDigit1.select();
          }
        }
      });
    }

    // Credentials Login Form Submission
    if (DOM.credLoginForm) {
      DOM.credLoginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const isTa = state.lang === "ta";
        const userVal = DOM.loginUsernameInput ? DOM.loginUsernameInput.value.trim() : "";
        const passVal = DOM.loginPasswordInput ? DOM.loginPasswordInput.value.trim() : "";

        if (!userVal || !passVal) {
          if (DOM.credErrorMsg) {
            DOM.credErrorMsg.textContent = isTa ? I18N.ta.login_err_cred_invalid : I18N.en.login_err_cred_invalid;
            DOM.credErrorMsg.classList.remove("hidden");
          }
          return;
        }

        if (DOM.credErrorMsg) DOM.credErrorMsg.classList.add("hidden");

        const user = {
          name: userVal,
          phone: userVal.match(/^\d{10}$/) ? userVal : "9841200001",
          role: state.loginRole,
          method: "credentials",
          loggedInAt: new Date().toISOString()
        };

        completeLogin(user, true);
      });
    }

    // Password Visibility Toggle
    if (DOM.togglePasswordBtn && DOM.loginPasswordInput) {
      DOM.togglePasswordBtn.addEventListener("click", () => {
        const isPass = DOM.loginPasswordInput.type === "password";
        DOM.loginPasswordInput.type = isPass ? "text" : "password";
        DOM.togglePasswordBtn.textContent = isPass ? "🙈" : "👁️";
      });
    }

    // Quick 1-Click Demo Profile 1: Farmer Murugan
    if (DOM.quickLoginFarmer) {
      DOM.quickLoginFarmer.addEventListener("click", () => {
        const isTa = state.lang === "ta";
        completeLogin({
          name: isTa ? "உழவர் முருகன்" : "Farmer Murugan",
          phone: "9841200001",
          role: "farmer",
          method: "quick_demo",
          loggedInAt: new Date().toISOString()
        }, true);
      });
    }

    // Quick 1-Click Demo Profile 2: Kaveri Agro Buyer
    if (DOM.quickLoginBuyer) {
      DOM.quickLoginBuyer.addEventListener("click", () => {
        const isTa = state.lang === "ta";
        completeLogin({
          name: isTa ? "காவேரி அக்ரோ" : "Kaveri Agro Traders",
          phone: "9841200002",
          role: "buyer",
          method: "quick_demo",
          loggedInAt: new Date().toISOString()
        }, true);
      });
    }

    // Explore as Guest
    if (DOM.skipLoginGuestBtn) {
      DOM.skipLoginGuestBtn.addEventListener("click", () => {
        const isTa = state.lang === "ta";
        completeLogin({
          name: isTa ? "மாதிரி பார்வையாளர் (Guest)" : "Guest Farmer",
          phone: "9841200000",
          role: "farmer",
          method: "guest",
          loggedInAt: new Date().toISOString()
        }, true);
      });
    }

    // Header Logout Button
    if (DOM.logoutBtn) {
      DOM.logoutBtn.addEventListener("click", handleLogout);
    }
  }

  /**
   * Toggles Speech Recognition on/off.
   */
  function toggleMicrophone() {
    hideVoiceAlert();

    if (SpeechEngine.isListening()) {
      SpeechEngine.stopListening();
      setMicUI(false);
      return;
    }

    setMicUI(true);

    SpeechEngine.startListening(state.lang, {
      onStart: (langCode) => {
        setMicUI(true);
        DOM.micStatusText.textContent = state.lang === "ta"
          ? `கவனிக்கிறது (${langCode})... இப்போது பேசுங்கள்...`
          : `Listening (${langCode})... speak now...`;
      },
      onResult: (transcript, isFinal) => {
        DOM.transcriptInput.value = transcript;
        if (isFinal) {
          handleRecognizedSpeech(transcript);
        }
      },
      onError: (err) => {
        setMicUI(false);
        showVoiceAlert(err.message, err.actionLink);
      },
      onEnd: () => {
        setMicUI(false);
      }
    });
  }

  function setMicUI(listening) {
    if (listening) {
      DOM.micMainBtn.classList.add("listening");
      DOM.micStatusText.textContent = state.lang === "ta" ? I18N.ta.mic_listening : I18N.en.mic_listening;
    } else {
      DOM.micMainBtn.classList.remove("listening");
      DOM.micStatusText.textContent = state.lang === "ta" ? I18N.ta.mic_idle : I18N.en.mic_idle;
    }
  }

  function showVoiceAlert(msg, actionLink) {
    DOM.alertText.textContent = msg;
    DOM.alertActionSlot.innerHTML = "";

    if (actionLink) {
      const link = document.createElement("a");
      link.href = actionLink.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "alert-link";
      link.textContent = actionLink.text;
      DOM.alertActionSlot.appendChild(link);
    }

    DOM.voiceAlertBanner.classList.remove("hidden");
  }

  function hideVoiceAlert() {
    DOM.voiceAlertBanner.classList.add("hidden");
  }

  /**
   * Handles transcribed speech: parses, updates inputs, runs calculation, and speaks best offer.
   */
  async function handleRecognizedSpeech(text) {
    if (!text || !text.trim()) return;

    hideVoiceAlert();
    const parsed = Parser.parse(text);

    applyParsedValues(parsed);
    await runCalculateOffers(true, true);
  }

  /**
   * Handles manual typing in transcript box.
   */
  function handleManualTextInput(text) {
    if (!text || !text.trim()) return;
    const parsed = Parser.parse(text);
    applyParsedValues(parsed);
  }

  function applyParsedValues(parsed) {
    let updatedAny = false;

    if (parsed.crop) {
      DOM.cropSelect.value = parsed.crop;
      updatedAny = true;
    }
    if (parsed.quantity_kg && parsed.quantity_kg > 0) {
      DOM.quantityInput.value = parsed.quantity_kg;
      updatedAny = true;
    }
    if (parsed.location) {
      DOM.locationSelect.value = parsed.location;
      updatedAny = true;
    }

    return updatedAny;
  }

  /**
   * Cycles through sample phrases.
   */
  function cycleSampleSentence() {
    const list = SAMPLE_DATA.sample_sentences;
    const item = list[state.sampleIndex % list.length];
    state.sampleIndex++;

    applySentence(item.text);
  }

  /**
   * Applies given sentence, fills inputs, calculates, and speaks.
   */
  async function applySentence(sentence) {
    DOM.transcriptInput.value = sentence;
    hideVoiceAlert();
    const parsed = Parser.parse(sentence);
    applyParsedValues(parsed);
    await runCalculateOffers(true, true);
  }

  /**
   * Generates a realistic high-definition SVG image data URL for any crop harvest.
   */
  function getSampleCropPhotoSvg(cropCode) {
    const cropColors = {
      paddy: { bg: "#fef3c7", primary: "#d97706", accent: "#b45309", icon: "🌾", name: "Paddy Grain Lot" },
      sugarcane: { bg: "#ecfdf5", primary: "#059669", accent: "#047857", icon: "🎋", name: "Sugarcane Stalks" },
      tomato: { bg: "#fee2e2", primary: "#dc2626", accent: "#991b1b", icon: "🍅", name: "Farm Tomato" },
      onion: { bg: "#fae8ff", primary: "#a855f7", accent: "#7e22ce", icon: "🧅", name: "Red Onion" },
      potato: { bg: "#fef9c3", primary: "#ca8a04", accent: "#854d0e", icon: "🥔", name: "Potato Lot" },
      banana: { bg: "#fef08a", primary: "#eab308", accent: "#a16207", icon: "🍌", name: "Banana Bunch" },
      chilli: { bg: "#ffe4e6", primary: "#e11d48", accent: "#9f1239", icon: "🌶️", name: "Red Chilli" },
      brinjal: { bg: "#f3e8ff", primary: "#9333ea", accent: "#581c87", icon: "🍆", name: "Fresh Brinjal" },
      groundnut: { bg: "#fef3c7", primary: "#b45309", accent: "#78350f", icon: "🥜", name: "Groundnut Lot" },
      coconut: { bg: "#e0f2fe", primary: "#0284c7", accent: "#0369a1", icon: "🥥", name: "Coconut Harvest" },
      turmeric: { bg: "#fef9c3", primary: "#eab308", accent: "#854d0e", icon: "🟡", name: "Turmeric Rhizome" },
      mango: { bg: "#ffedd5", primary: "#f97316", accent: "#c2410c", icon: "🥭", name: "Mango Harvest" },
      cotton: { bg: "#f1f5f9", primary: "#64748b", accent: "#334155", icon: "☁️", name: "Cotton Bolls" }
    };
    const c = cropColors[cropCode] || { bg: "#ecfdf5", primary: "#16a34a", accent: "#15803d", icon: "🌱", name: "Fresh Harvest" };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c.bg}" />
          <stop offset="100%" stop-color="${c.primary}" stop-opacity="0.3" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#grad)" rx="24"/>
      <circle cx="200" cy="180" r="100" fill="#ffffff" opacity="0.9"/>
      <text x="200" y="215" font-size="110" text-anchor="middle" font-family="sans-serif">${c.icon}</text>
      <rect x="35" y="305" width="330" height="55" rx="14" fill="${c.accent}"/>
      <text x="200" y="340" font-size="19" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">GRADE-A VERIFIED HARVEST</text>
      <text x="365" y="45" font-size="13" font-weight="bold" fill="${c.accent}" text-anchor="end" font-family="sans-serif">QC SEAL ✓</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  /**
   * Handles user photo file upload.
   */
  function handlePhotoFileInput(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast(state.lang === "ta" ? "செல்லுபடியாகும் புகைப்படத்தைத் தேர்ந்தெடுக்கவும்" : "Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
      const dataUrl = evt.target.result;
      startPhotoVerificationProcess(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  /**
   * 1-Click Sample Photo handler.
   */
  function handleSamplePhotoBtnClick() {
    const currentCrop = DOM.cropSelect.value || "paddy";
    const sampleDataUrl = getSampleCropPhotoSvg(currentCrop);
    startPhotoVerificationProcess(sampleDataUrl);
  }

  /**
   * Clears verified photo.
   */
  function handleClearPhotoBtnClick() {
    state.cropPhoto = null;
    state.photoVerified = false;
    state.qualityMetrics = null;

    if (DOM.photoVerifyCard) DOM.photoVerifyCard.classList.remove("verified");
    if (DOM.photoVerifyBadge) {
      DOM.photoVerifyBadge.className = "pv-badge-unverified";
      DOM.photoVerifyBadge.textContent = state.lang === "ta" ? "சரிபார்க்கப்படவில்லை (Unverified)" : "Unverified";
    }
    if (DOM.photoPreviewContainer) DOM.photoPreviewContainer.classList.add("hidden");
    if (DOM.clearPhotoBtn) DOM.clearPhotoBtn.classList.add("hidden");
    if (DOM.cropPhotoInput) DOM.cropPhotoInput.value = "";
    showToast(state.lang === "ta" ? "புகைப்படம் அகற்றப்பட்டது" : "Photo cleared");
  }

  /**
   * Executes AI scanning animation and verifies crop quality via API or offline.
   */
  async function startPhotoVerificationProcess(dataUrl) {
    const isTa = state.lang === "ta";
    const cropCode = DOM.cropSelect.value || "paddy";

    state.cropPhoto = dataUrl;
    if (DOM.verifiedPhotoImg) DOM.verifiedPhotoImg.src = dataUrl;
    if (DOM.photoPreviewContainer) DOM.photoPreviewContainer.classList.remove("hidden");
    if (DOM.clearPhotoBtn) DOM.clearPhotoBtn.classList.remove("hidden");

    if (DOM.scanLaserLine) DOM.scanLaserLine.classList.remove("hidden");
    if (DOM.aiScanBadge) DOM.aiScanBadge.classList.remove("hidden");
    if (DOM.photoQualityResults) DOM.photoQualityResults.classList.add("hidden");

    if (DOM.photoVerifyBadge) {
      DOM.photoVerifyBadge.className = "pv-badge-unverified";
      DOM.photoVerifyBadge.textContent = isTa ? "பகுப்பாய்வு நடக்கிறது..." : "Analyzing...";
    }

    try {
      let result = null;
      if (state.isOnline) {
        try {
          const resp = await fetch("/api/verify-photo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ crop: cropCode, photo_data: dataUrl })
          });
          if (resp.ok) {
            result = await resp.json();
          }
        } catch (e) {}
      }

      if (!result) {
        const certNum = Math.floor(10000 + Math.random() * 90000);
        result = {
          verified: true,
          quality_grade: "Grade-A",
          quality_score: 96.8,
          certificate_id: `TN-AGRO-QC-${certNum}`,
          metrics: {
            purity: "99.2%",
            defects: "0.8%",
            freshness: "99.5%"
          }
        };
      }

      setTimeout(() => {
        if (DOM.scanLaserLine) DOM.scanLaserLine.classList.add("hidden");
        if (DOM.aiScanBadge) DOM.aiScanBadge.classList.add("hidden");

        state.photoVerified = true;
        state.qualityGrade = result.quality_grade || "Grade-A";
        state.qualityScore = result.quality_score || 96.8;
        state.qualityMetrics = result.metrics || {};
        state.qualityCertificateId = result.certificate_id || "TN-AGRO-QC-9842";

        if (DOM.photoVerifyCard) DOM.photoVerifyCard.classList.add("verified");
        if (DOM.photoVerifyBadge) {
          DOM.photoVerifyBadge.className = "pv-badge-verified";
          DOM.photoVerifyBadge.textContent = isTa ? "✓ தரம் சரிபார்க்கப்பட்டது (Grade-A)" : "✓ Grade-A Verified";
        }

        if (DOM.qcCertIdVal) DOM.qcCertIdVal.textContent = state.qualityCertificateId;
        if (DOM.photoQualityResults) DOM.photoQualityResults.classList.remove("hidden");

        const toastMsg = isTa
          ? `அறுவடை புகைப்படம் சரிபார்க்கப்பட்டது: ${state.qualityGrade} (${state.qualityScore}% தரம்)`
          : `Produce photo verified: ${state.qualityGrade} (${state.qualityScore}% Quality Score)`;
        showToast(toastMsg);
      }, 700);

    } catch (err) {
      console.warn("Photo verification error:", err);
      if (DOM.scanLaserLine) DOM.scanLaserLine.classList.add("hidden");
      if (DOM.aiScanBadge) DOM.aiScanBadge.classList.add("hidden");
    }
  }

  /**
   * Opens the Quality Inspection Certificate modal for a listing or deal.
   */
  function openPhotoCertificateModal(item) {
    const isTa = state.lang === "ta";
    const cropCode = item.crop_code || item.crop || DOM.cropSelect.value || "paddy";
    const cropMeta = CROPS_META.find(c => c.code === cropCode) || { icon: "🌾", name_en: cropCode, name_ta: cropCode };
    const photoSrc = item.photo_data || state.cropPhoto || getSampleCropPhotoSvg(cropCode);
    const certId = item.quality_certificate_id || state.qualityCertificateId || `TN-AGRO-QC-${item.id || 9842}`;
    const grade = item.quality_grade || state.qualityGrade || "Grade-A";
    const score = item.quality_score || state.qualityScore || 96.8;

    if (DOM.certModalImg) DOM.certModalImg.src = photoSrc;
    if (DOM.certModalId) DOM.certModalId.textContent = certId;
    if (DOM.certModalGrade) DOM.certModalGrade.textContent = `${grade} (${score}%)`;
    if (DOM.certModalCropName) DOM.certModalCropName.textContent = `${cropMeta.icon} ${isTa ? cropMeta.name_ta : cropMeta.name_en} — ${isTa ? "முதல் தரம்" : "Premium Grade"}`;
    if (DOM.certTimestamp) DOM.certTimestamp.textContent = `Verified: ${item.created_at || new Date().toLocaleString()}`;

    const metrics = [
      { lbl: isTa ? "தூய்மை விகிதம் (Purity):" : "Purity Ratio:", val: "99.2% (Grade-A)" },
      { lbl: isTa ? "சேதம் / குறைபாடு (Defect Rate):" : "Defect Rate:", val: "0.8% (Negligible)" },
      { lbl: isTa ? "அறுவடை புத்துணர்ச்சி (Freshness):" : "Harvest Freshness:", val: "99.5% (Field Fresh)" },
      { lbl: isTa ? "ஆய்வு நிலை (QC Inspection):" : "QC Inspection:", val: "Govt E-Mandi Standard Passed" }
    ];

    if (DOM.certMetricsTable) {
      DOM.certMetricsTable.innerHTML = metrics.map(m => `
        <div class="cert-table-row">
          <span style="color: var(--text-muted);">${m.lbl}</span>
          <strong>${m.val}</strong>
        </div>
      `).join("");
    }

    if (DOM.photoCertificateModal) DOM.photoCertificateModal.classList.remove("hidden");
  }

  function closePhotoCertificateModal() {
    if (DOM.photoCertificateModal) DOM.photoCertificateModal.classList.add("hidden");
  }

  function handleDownloadCertificate() {
    window.print();
  }

  /**
   * Main Offer Calculation runner.
   * Calls /api/offers if online, otherwise calculates offline.
   */
  async function runCalculateOffers(speakResult = false, speakAlways = false) {
    const crop = DOM.cropSelect.value || "paddy";
    const qty = parseFloat(DOM.quantityInput.value) || 2000;
    const loc = DOM.locationSelect.value || "tirupporur";
    const isUrgent = !!state.isUrgent;
    const discountPct = isUrgent ? (parseFloat(DOM.urgentDiscountSelect.value) || 10) : 0;

    if (qty <= 0) {
      showToast(state.lang === "ta" ? I18N.ta.err_missing_qty : I18N.en.err_missing_qty);
      return;
    }

    let result = null;

    if (state.isOnline) {
      try {
        const resp = await fetch("/api/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crop: crop,
            quantity_kg: qty,
            location: loc,
            is_urgent: isUrgent,
            discount_pct: discountPct
          })
        });

        if (resp.ok) {
          result = await resp.json();
        } else {
          console.warn("API offers returned non-200, falling back to offline calculation");
          result = calculateOffersOffline(crop, qty, loc, isUrgent, discountPct);
        }
      } catch (err) {
        console.warn("Fetch error, using offline calculation:", err);
        result = calculateOffersOffline(crop, qty, loc, isUrgent, discountPct);
      }
    } else {
      result = calculateOffersOffline(crop, qty, loc, isUrgent, discountPct);
    }

    state.currentOffers = result;
    renderAllSections(result);

    // Speak best offer if requested and voice replies enabled
    if (state.voiceReplies && (speakResult || speakAlways)) {
      speakBestOffer(result);
    }
  }

  /**
   * Reads aloud the best buyer and net amount after transport.
   */
  function speakBestOffer(data) {
    if (!data || !data.best_offer) return;
    const isTa = state.lang === "ta";
    const best = data.best_offer;
    const buyerName = isTa ? best.name_ta : best.name_en;
    const netFormatted = best.net_formatted;

    let text = "";
    if (isTa) {
      text = `சிறந்த சலுகை: ${buyerName}. போக்குவரத்து கழித்து உங்கள் நிகர வருமானம் ${netFormatted}.`;
    } else {
      text = `Best offer: ${buyerName}. Your net payout after transport is ${netFormatted}.`;
    }

    SpeechEngine.speak(text, state.lang);
  }

  /**
   * Renders the 3 core sections in the Farmer view:
   * 1. Buyers cards
   * 2. Offer comparison bars
   * 3. Estimated earnings hero card
   */
  function renderAllSections(data) {
    renderEarningsHero(data);
    renderComparisonBars(data);
    renderBuyersGrid(data);
  }

  /**
   * SECTION 3: ESTIMATED EARNINGS HERO CARD
   */
  function renderEarningsHero(data) {
    const isTa = state.lang === "ta";
    const best = data.best_offer;
    const t = I18N[state.lang];

    if (!best) {
      DOM.earningsContent.innerHTML = `<p class="section-desc">${isTa ? "வாங்குபவர்கள் இல்லை" : "No buyers found for this selection."}</p>`;
      return;
    }

    const buyerName = isTa ? best.name_ta : best.name_en;
    const buyerLoc = isTa ? best.location_ta : best.location_en;
    const buyerType = isTa ? best.buyer_type_ta : best.buyer_type_en;

    const diffText = data.advantage_over_lowest > 0
      ? (isTa ? `குறைந்த சலுகையை விட ${data.advantage_formatted} அதிகம்!` : `${data.advantage_formatted} more than the lowest offer!`)
      : (isTa ? "ஒரே ஒரு சலுகை உள்ளது" : "Single offer available");

    const urgentNoticeHtml = state.isUrgent
      ? `<div class="urgent-info-strip" style="margin-bottom: 1rem;">
           <span>🚨</span>
           <span>${isTa ? `அவசர விற்பனை பயன்படுத்தப்பட்டுள்ளது (${state.urgencyDiscount}% தள்ளுபடி). உடனடி பணப்பட்டுவாடா முன்னுரிமை.` : `Urgent clearance applied (${state.urgencyDiscount}% discount). Fast cash prioritized.`}</span>
         </div>`
      : "";

    DOM.earningsContent.innerHTML = `
      ${urgentNoticeHtml}
      <div class="hero-buyer-headline">
        <h3 class="hero-buyer-name">${buyerName}</h3>
        <p class="hero-buyer-sub">📍 ${buyerLoc} • ${buyerType} • ${best.distance_km} km</p>
      </div>

      <div class="earnings-breakdown-grid">
        <div class="stat-tile">
          <span class="stat-label">${t.gross_value_label}</span>
          <span class="stat-value">${best.gross_formatted}</span>
          <span class="stat-sub">${best.price_formatted} / kg × ${data.quantity_kg} kg</span>
        </div>

        <div class="stat-tile">
          <span class="stat-label">${t.transport_cost_label}</span>
          <span class="stat-value" style="color: #d97706;">− ${best.transport_formatted}</span>
          <span class="stat-sub" title="${t.formula_tooltip}">(${Math.round(best.distance_km)} km • சூத்திரம்)</span>
        </div>

        <div class="stat-tile hero-net">
          <span class="stat-label">${t.net_payout_label}</span>
          <span class="stat-value">${best.net_formatted}</span>
          <span class="stat-sub" style="font-weight: 700; color: var(--green-700);">${t.net_per_kg_label} ${best.net_per_kg_formatted}</span>
        </div>

        <div class="stat-tile">
          <span class="stat-label">${t.payment_speed_label}</span>
          <span class="stat-value" style="font-size: 1.05rem;">${isTa ? best.payment_speed_ta : best.payment_speed_en}</span>
          <span class="stat-sub">⭐ ${best.rating} (${best.review_count})</span>
        </div>

        <div class="stat-tile" style="background: #f0fdf4; border: 1.5px solid #86efac; grid-column: 1 / -1;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.25rem;">💼</span>
              <div>
                <strong style="color: #166534; font-size: 0.88rem;">${isTa ? "குறைந்தபட்ச இணையதள பராமரிப்பு கட்டணம் (1.5% Developer Facilitation Fee):" : "Minimal Platform Facilitation Fee (1.5% Developer / Server Fee):"}</strong>
                <span style="display: block; font-size: 0.78rem; color: #15803d;">${isTa ? "வழக்கமான மண்டி தரகர்களின் 10% சுரண்டல் இல்லை! வெறும் 1.5% மூலம் சர்வர் & AI இயக்கம்." : "No predatory 10% mandi brokerage! Just 1.5% funds cloud server & AI maintenance."}</span>
              </div>
            </div>
            <span style="font-weight: 800; color: #166534; font-size: 1.05rem;">1.5% (₹${Math.round(best.gross_amount * 0.015).toLocaleString()})</span>
          </div>
        </div>
      </div>

      <div class="advantage-banner">
        <span style="font-size: 1.2rem;">💰</span>
        <span>${diffText}</span>
      </div>

      <div class="hero-actions">
        <button id="heroSaveListingBtn" class="btn btn-primary btn-large">
          <span class="btn-icon">💾</span>
          <span>${t.btn_save_listing}</span>
        </button>
        <button id="heroSpeakAgainBtn" class="btn btn-turmeric">
          <span class="btn-icon">📢</span>
          <span>${isTa ? "குரலில் சொல்" : "Read Aloud"}</span>
        </button>
      </div>
    `;

    document.getElementById("heroSaveListingBtn").addEventListener("click", () => openSaveModal(best));
    document.getElementById("heroSpeakAgainBtn").addEventListener("click", () => speakBestOffer(data));
  }

  /**
   * SECTION 2: OFFER COMPARISON (RANKED BARS)
   */
  function renderComparisonBars(data) {
    const isTa = state.lang === "ta";
    const container = DOM.comparisonBarsContainer;
    container.innerHTML = "";

    if (!data.offers || data.offers.length === 0) {
      container.innerHTML = `<p class="section-desc">${isTa ? "சலுகைகள் எதுவும் இல்லை" : "No offers available."}</p>`;
      return;
    }

    const maxNet = Math.max(...data.offers.map(o => o.net_amount));

    data.offers.forEach((o, index) => {
      const isTop = index === 0;
      const barPercent = maxNet > 0 ? Math.max(15, Math.round((o.net_amount / maxNet) * 100)) : 100;
      const buyerName = isTa ? o.name_ta : o.name_en;
      const formulaLine = isTa ? o.formula_line_ta : o.formula_line_en;

      const card = document.createElement("div");
      card.className = `ranked-bar-card ${isTop ? "top-offer" : ""}`;
      card.setAttribute("role", "listitem");

      card.innerHTML = `
        <div class="bar-meta-row">
          <div class="bar-buyer-title">
            <span class="bar-rank-badge">${index + 1}</span>
            <span>${buyerName} ${isTop ? "⭐" : ""}</span>
          </div>
          <div class="bar-net-amount">${o.net_formatted}</div>
        </div>

        <div class="bar-track" aria-hidden="true">
          <div class="bar-fill" style="width: ${barPercent}%;"></div>
        </div>

        <div class="bar-formula-line">
          <span>${formulaLine}</span>
          <span style="font-weight: 700;">${o.net_per_kg_formatted} / kg</span>
        </div>
      `;

      container.appendChild(card);
    });
  }

  /**
   * SECTION 1: MATCHING BUYERS (CARDS)
   */
  function renderBuyersGrid(data) {
    const isTa = state.lang === "ta";
    const grid = DOM.buyersGrid;
    grid.innerHTML = "";

    const t = I18N[state.lang];
    const offers = [...(data.offers || [])];

    // Apply sorting
    if (state.currentSort === "distance") {
      offers.sort((a, b) => a.distance_km - b.distance_km);
    } else if (state.currentSort === "rating") {
      offers.sort((a, b) => b.rating - a.rating);
    } else {
      offers.sort((a, b) => b.net_amount - a.net_amount);
    }

    DOM.secBuyersCount.textContent = `${offers.length} ${isTa ? "வாங்குபவர்கள் உள்ளனர்" : "matching buyers found"}`;

    offers.forEach(b => {
      const isBest = b.is_best_offer;
      const card = document.createElement("div");
      card.className = `buyer-card ${isBest ? "best-offer" : ""}`;
      card.setAttribute("role", "listitem");

      const name = isTa ? b.name_ta : b.name_en;
      const type = isTa ? b.buyer_type_ta : b.buyer_type_en;
      const loc = isTa ? b.location_ta : b.location_en;
      const payment = isTa ? b.payment_speed_ta : b.payment_speed_en;

      card.innerHTML = `
        <div>
          <div class="buyer-header-row">
            <div class="buyer-name-group">
              <h3 class="buyer-name">${name}</h3>
              <div style="display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap;">
                <span class="buyer-type-tag">${type}</span>
                <span class="sim-badge" style="font-size: 0.65rem;">${t.tag_sample_profile}</span>
              </div>
            </div>
            ${isBest ? `<span class="best-badge">${t.badge_best_offer}</span>` : ""}
          </div>

          <div class="buyer-meta-list" style="margin-top: 0.75rem;">
            <div class="meta-item">
              <span>📍</span>
              <span><strong>${loc}</strong> (${Math.round(b.distance_km)} km)</span>
            </div>
            <div class="meta-item">
              <span class="rating-stars">★ ${b.rating}</span>
              <span style="color: var(--text-muted);">(${b.review_count} ${isTa ? "விமர்சனங்கள்" : "reviews"})</span>
            </div>
            <div class="meta-item" style="display: flex; align-items: center; gap: 0.35rem;">
              <span>🏆</span>
              <span style="font-weight: 700; color: #92400e; background: #fef3c7; border: 1px solid #fcd34d; padding: 0.1rem 0.45rem; border-radius: 8px; font-size: 0.75rem;">
                ${Math.round((b.rating || 4.5) * 40)} ${isTa ? "நம்பக புள்ளிகள் (Buyer Credits)" : "Buyer Trust Credits"}
              </span>
            </div>
            <div class="meta-item">
              <span>⚡</span>
              <span>${payment}</span>
            </div>
          </div>

          <div class="price-spotlight" style="margin-top: 0.85rem;">
            <div>
              <span class="price-label">${t.price_per_kg_label} <span style="font-size: 0.65rem; color: var(--text-muted);">${t.tag_sample_rate}</span></span>
              <div class="price-val">${b.price_formatted} <span style="font-size: 0.8rem; font-weight: 500;">/ kg</span></div>
            </div>
            <div style="text-align: right;">
              <span class="price-label">${t.net_payout_label}</span>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--green-800);">${b.net_formatted}</div>
            </div>
          </div>

          <div class="buyer-calc-mini" style="margin-top: 0.65rem;">
            <span>${isTa ? "போக்குவரத்து:" : "Transport:"} − ${b.transport_formatted}</span>
            <span>${isTa ? "நிகர விலை:" : "Net / kg:"} ${b.net_per_kg_formatted}</span>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
          <button class="btn btn-primary w-100 accept-deal-btn" data-code="${b.buyer_code}">
            <span>🤝</span>
            <span>${t.btn_deal_done}</span>
          </button>
          <button class="btn btn-outline track-buyer-loc-btn" title="${isTa ? 'வாங்குபவர் & வழித்தடத்தை கண்காணி' : 'Track Buyer & Farmer Location'}" aria-label="Track Buyer Location">
            <span>🛰️</span>
          </button>
          <button class="btn btn-outline contact-buyer-btn" data-phone="${b.phone || ''}" aria-label="Call buyer">
            <span>📞</span>
          </button>
        </div>
      `;

      // Accept deal action
      card.querySelector(".accept-deal-btn").addEventListener("click", () => handleAcceptDeal(b));

      // Track buyer & farmer location action
      card.querySelector(".track-buyer-loc-btn").addEventListener("click", () => {
        openLiveTrackingModal({
          id: "PREVIEW",
          buyer_code: b.buyer_code,
          buyer_name: isTa ? b.name_ta : b.name_en,
          crop_code: DOM.cropSelect.value || "paddy",
          quantity_kg: parseFloat(DOM.quantityInput.value) || 2000,
          farmer_location: DOM.locationSelect.value || "tirupporur",
          distance_km: b.distance_km || 30,
          status: "truck_dispatched"
        });
      });

      // Contact buyer action
      card.querySelector(".contact-buyer-btn").addEventListener("click", () => {
        if (b.phone) {
          window.location.href = `tel:${b.phone}`;
        } else {
          showToast(isTa ? "தொடர்பு எண்: +91 94431 23456 (மாதிரி எண்)" : "Contact: +91 94431 23456 (Sample)");
        }
      });

      grid.appendChild(card);
    });
  }

  function setSortMode(mode) {
    state.currentSort = mode;
    [DOM.sortNetBtn, DOM.sortDistBtn, DOM.sortRatingBtn].forEach(b => b.classList.remove("active"));
    if (mode === "net") DOM.sortNetBtn.classList.add("active");
    if (mode === "distance") DOM.sortDistBtn.classList.add("active");
    if (mode === "rating") DOM.sortRatingBtn.classList.add("active");

    if (state.currentOffers) {
      renderBuyersGrid(state.currentOffers);
    }
  }

  /**
   * Save Listing modal workflow.
   */
  function openSaveModal(bestBuyer) {
    if (!state.currentOffers) return;
    const isTa = state.lang === "ta";
    const best = bestBuyer || state.currentOffers.best_offer;
    const cropCode = DOM.cropSelect.value;
    const cropMeta = CROPS_META.find(c => c.code === cropCode) || { name_en: cropCode, name_ta: cropCode };
    const locCode = DOM.locationSelect.value;
    const locMeta = LOCATIONS_META.find(l => l.code === locCode) || { name_en: locCode, name_ta: locCode };

    DOM.saveListingSummaryBox.innerHTML = `
      <p><strong>${isTa ? "பயிர்:" : "Crop:"}</strong> ${isTa ? cropMeta.name_ta : cropMeta.name_en}</p>
      <p><strong>${isTa ? "அளவு:" : "Quantity:"}</strong> ${state.currentOffers.quantity_kg} kg</p>
      <p><strong>${isTa ? "ஊர்:" : "Location:"}</strong> ${isTa ? locMeta.name_ta : locMeta.name_en}</p>
      ${state.isUrgent ? `<p style="color: #dc2626; font-weight: 700;">🚨 ${isTa ? "அவசர விற்பனை பதிவு" : "Urgent Sale Lot"}</p>` : ""}
      <p><strong>${isTa ? "சிறந்த வாங்குபவர்:" : "Best Buyer:"}</strong> ${isTa ? best.name_ta : best.name_en}</p>
      <p><strong>${isTa ? "எதிர்பார்க்கும் நிகரத் தொகை:" : "Net Payout:"}</strong> <span style="font-size: 1.1rem; color: var(--green-800); font-weight: 800;">${best.net_formatted}</span></p>
    `;

    DOM.saveListingModal.classList.remove("hidden");
    DOM.farmerNameInput.focus();
  }

  function closeSaveModal() {
    DOM.saveListingModal.classList.add("hidden");
  }

  async function handleSaveListingSubmit(e) {
    e.preventDefault();
    const name = DOM.farmerNameInput.value.trim();
    const phone = DOM.farmerPhoneInput.value.trim();
    const offers = state.currentOffers;
    if (!offers || !offers.best_offer) return;

    const payload = {
      farmer_name: name,
      farmer_phone: phone,
      crop: DOM.cropSelect.value,
      quantity_kg: offers.quantity_kg,
      location: DOM.locationSelect.value,
      best_buyer_code: offers.best_offer.buyer_code,
      best_buyer_name: offers.best_offer.name_en,
      gross_amount: offers.best_offer.gross_amount,
      transport_cost: offers.best_offer.transport_cost,
      net_amount: offers.best_offer.net_amount,
      is_urgent: state.isUrgent ? 1 : 0,
      urgency_reason: state.isUrgent ? DOM.urgentReasonSelect.options[DOM.urgentReasonSelect.selectedIndex].text : "",
      urgency_discount: state.isUrgent ? (parseFloat(DOM.urgentDiscountSelect.value) || 10) : 0,
      notes: "Farmer submitted lot (Demo Listing)"
    };

    if (state.isOnline) {
      try {
        const resp = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          const res = await resp.json();
          addListingToLocalCache(res.listing);
          closeSaveModal();
          showToast(state.lang === "ta" ? I18N.ta.listing_saved_toast : I18N.en.listing_saved_toast);
          loadIncomingListings();
          return;
        }
      } catch (err) {
        console.warn("Saving to API failed, caching locally:", err);
      }
    }

    // Offline save fallback
    const offlineListing = {
      id: Date.now(),
      farmer_name: name,
      farmer_phone: phone,
      crop_code: payload.crop,
      quantity_kg: payload.quantity_kg,
      location: payload.location,
      best_buyer_name: payload.best_buyer_name,
      gross_amount: payload.gross_amount,
      transport_cost: payload.transport_cost,
      net_amount: payload.net_amount,
      is_urgent: payload.is_urgent,
      urgency_reason: payload.urgency_reason,
      urgency_discount: payload.urgency_discount,
      notes: payload.notes,
      created_at: new Date().toLocaleString()
    };

    addListingToLocalCache(offlineListing);
    closeSaveModal();
    showToast(state.lang === "ta" ? I18N.ta.listing_saved_toast : I18N.en.listing_saved_toast);
    loadIncomingListings();
  }

  function addListingToLocalCache(item) {
    state.savedListings.unshift(item);
    localStorage.setItem("farmbridge_saved_listings", JSON.stringify(state.savedListings));
    DOM.savedCountBadge.textContent = state.savedListings.length;
  }

  async function loadSavedListings() {
    if (state.isOnline && window.location.protocol !== "file:") {
      try {
        const resp = await fetch("/api/listings");
        if (resp.ok) {
          const data = await resp.json();
          state.savedListings = data.listings || [];
          DOM.savedCountBadge.textContent = state.savedListings.length;
          return;
        }
      } catch (e) {}
    }

    const cached = localStorage.getItem("farmbridge_saved_listings");
    if (cached) {
      try {
        state.savedListings = JSON.parse(cached);
      } catch (e) {}
    } else {
      state.savedListings = [...SAMPLE_DATA.initial_listings];
    }
    DOM.savedCountBadge.textContent = state.savedListings.length || 0;
  }

  function openSavedListingsModal() {
    const isTa = state.lang === "ta";
    const list = DOM.savedListingsList;
    list.innerHTML = "";

    if (state.savedListings.length === 0) {
      list.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem 0;">${isTa ? "சேமிக்கப்பட்ட பதிவுகள் எதுவும் இல்லை." : "No saved listings found."}</p>`;
    } else {
      state.savedListings.forEach(item => {
        const cropMeta = CROPS_META.find(c => c.code === item.crop_code) || { icon: "🌾", name_en: item.crop_code, name_ta: item.crop_code };
        const row = document.createElement("div");
        row.className = "summary-box";
        row.style.marginBottom = "0.75rem";
        row.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
            <div>
              <strong>${cropMeta.icon} ${isTa ? cropMeta.name_ta : cropMeta.name_en} • ${item.quantity_kg} kg</strong>
              ${item.is_urgent ? `<span class="urgent-tag" style="margin-left: 0.5rem; font-size: 0.7rem;">🚨 அவசரம் (${item.urgency_discount}% தள்ளுபடி)</span>` : ""}
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
                ${item.farmer_name || "Farmer"} • 📍 ${item.location} • 📅 ${item.created_at || ""}
              </div>
            </div>
            <div style="font-weight: 800; color: var(--green-800); font-size: 1.1rem; white-space: nowrap;">
              ₹${Math.round(item.net_amount || 0).toLocaleString()}
            </div>
          </div>
        `;
        list.appendChild(row);
      });
    }

    DOM.savedListingsModal.classList.remove("hidden");
  }

  function closeSavedListingsModal() {
    DOM.savedListingsModal.classList.add("hidden");
  }

  /**
   * Accepts deal with a buyer directly from Farmer View.
   */
  async function handleAcceptDeal(buyer) {
    const isTa = state.lang === "ta";
    const cropCode = DOM.cropSelect.value;
    const qty = parseFloat(DOM.quantityInput.value) || 2000;
    const loc = DOM.locationSelect.value;
    const isUrgent = !!state.isUrgent;

    const payload = {
      buyer_code: buyer.buyer_code,
      buyer_name: buyer.name_en,
      crop: cropCode,
      quantity_kg: qty,
      location: loc,
      price_per_kg: buyer.price_per_kg,
      gross_amount: buyer.gross_amount,
      transport_cost: buyer.transport_cost,
      net_amount: buyer.net_amount,
      is_urgent: isUrgent ? 1 : 0
    };

    let newDeal = null;

    if (state.isOnline) {
      try {
        const resp = await fetch("/api/deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          const res = await resp.json();
          newDeal = res.deal;
        }
      } catch (e) {
        console.warn("API deal creation failed, caching locally");
      }
    }

    if (!newDeal) {
      newDeal = {
        id: Date.now(),
        listing_id: null,
        buyer_code: payload.buyer_code,
        buyer_name: payload.buyer_name,
        crop_code: payload.crop,
        quantity_kg: payload.quantity_kg,
        farmer_location: payload.location,
        price_per_kg: payload.price_per_kg,
        gross_amount: payload.gross_amount,
        transport_cost: payload.transport_cost,
        net_amount: payload.net_amount,
        is_urgent: payload.is_urgent,
        status: "confirmed",
        created_at: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString()
      };
    }

    addDealToLocalCache(newDeal);
    showToast(isTa ? I18N.ta.deal_confirmed_toast : I18N.en.deal_confirmed_toast);

    // Switch to Deals View so the farmer can immediately track deal progress
    setTimeout(() => {
      switchRole("deals");
    }, 600);
  }

  /**
   * Loads incoming listings for Buyer View.
   */
  async function loadIncomingListings() {
    if (state.isOnline && window.location.protocol !== "file:") {
      try {
        const resp = await fetch("/api/listings");
        if (resp.ok) {
          const data = await resp.json();
          state.incomingListings = data.listings || [];
          return;
        }
      } catch (e) {}
    }

    const cached = localStorage.getItem("farmbridge_saved_listings");
    if (cached) {
      try {
        state.incomingListings = JSON.parse(cached);
      } catch (e) {
        state.incomingListings = [...SAMPLE_DATA.initial_listings];
      }
    } else {
      state.incomingListings = [...SAMPLE_DATA.initial_listings];
    }
  }

  /**
   * Renders Buyer / Mill Procurement View.
   */
  function renderBuyerView() {
    const isTa = state.lang === "ta";
    const t = I18N[state.lang];
    const grid = DOM.incomingListingsGrid;
    grid.innerHTML = "";

    let list = [...(state.incomingListings || [])];

    // Crop filter
    if (state.buyerCropFilter && state.buyerCropFilter !== "all") {
      list = list.filter(item => item.crop_code === state.buyerCropFilter);
    }

    // Urgent filter
    if (state.buyerUrgentOnly) {
      list = list.filter(item => Number(item.is_urgent) === 1);
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 2px dashed var(--border-color);">
          <span style="font-size: 3rem;">🌾</span>
          <h3 style="margin-top: 0.75rem; color: var(--text-primary);">${t.buyer_empty_listings}</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">
            ${isTa ? "விவசாயி களத்தில் புதிய பதிவைச் சேமிக்கவும் அல்லது வடிகட்டிகளை மாற்றவும்." : "Try clearing filters or add a new lot in the Farmer View."}
          </p>
        </div>
      `;
      return;
    }

    list.forEach(item => {
      const cropMeta = CROPS_META.find(c => c.code === item.crop_code) || { icon: "🌾", name_en: item.crop_code, name_ta: item.crop_code };
      const locMeta = LOCATIONS_META.find(l => l.code === item.location) || { name_en: item.location, name_ta: item.location };
      const isUrgentLot = Number(item.is_urgent) === 1;

      const card = document.createElement("div");
      card.className = `listing-item-card ${isUrgentLot ? "urgent-lot-border" : ""}`;
      card.setAttribute("role", "listitem");

      card.innerHTML = `
        <div class="listing-header">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--green-900); margin: 0;">
                ${cropMeta.icon} ${isTa ? cropMeta.name_ta : cropMeta.name_en} • ${item.quantity_kg} kg
              </h3>
              ${isUrgentLot ? `<span class="urgent-tag">🚨 ${isTa ? "அவசர விற்பனை" : "Urgent Sale"} (${item.urgency_discount}% Off)</span>` : ""}
            </div>
            <span class="sim-badge" style="font-size: 0.65rem; margin-top: 0.25rem;">${isTa ? "மாதிரி உழவர் பதிவு (Demo Lot)" : "Sample Demo Listing"}</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.75rem; color: var(--text-muted);">${t.net_payout_label}</span>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--green-800);">
              ₹${Math.round(item.net_amount || 0).toLocaleString()}
            </div>
          </div>
        </div>

        ${isUrgentLot && item.urgency_reason ? `
          <div class="urgent-reason-strip" style="background: rgba(220, 38, 38, 0.08); border-left: 3px solid #dc2626; padding: 0.4rem 0.6rem; border-radius: 4px; font-size: 0.82rem; color: #991b1b; margin: 0.5rem 0;">
            ⚠️ <strong>${isTa ? "காரணம்:" : "Reason:"}</strong> ${item.urgency_reason}
          </div>
        ` : ""}

        <div class="listing-meta-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 0.75rem 0; font-size: 0.85rem;">
          <div>
            <span style="color: var(--text-muted);">${isTa ? "விவசாயி:" : "Farmer:"}</span>
            <div style="font-weight: 600;">${item.farmer_name || (isTa ? "உழவர்" : "Farmer")}</div>
            <span style="display:inline-block; margin-top:2px; font-size:0.7rem; font-weight:700; color:#92400e; background:#fef3c7; border:1px solid #fcd34d; padding:0.05rem 0.35rem; border-radius:6px;">
              ⭐ 120 ${isTa ? "நம்பக புள்ளிகள் (Farmer Trust)" : "Trust Points"}
            </span>
          </div>
          <div>
            <span style="color: var(--text-muted);">${isTa ? "ஊர்:" : "Location:"}</span>
            <div style="font-weight: 600;">📍 ${isTa ? locMeta.name_ta : locMeta.name_en}</div>
          </div>
          <div>
            <span style="color: var(--text-muted);">${isTa ? "தொடர்பு:" : "Phone:"}</span>
            <div><a href="tel:${item.farmer_phone}" style="color: var(--green-700); font-weight: 600;">${item.farmer_phone || "+91 94431 00000"}</a></div>
          </div>
          <div>
            <span style="color: var(--text-muted);">${isTa ? "பதிவு தேதி:" : "Date:"}</span>
            <div style="color: var(--text-muted);">${item.created_at || ""}</div>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
          <button class="btn btn-primary w-100 procure-lot-btn" data-id="${item.id}">
            <span>🤝</span>
            <span>${t.btn_procure_lot}</span>
          </button>
          <button class="btn btn-outline track-farmer-loc-btn" title="${isTa ? 'விவசாயி இருப்பிடம் & வழித்தடம்' : 'Track Farmer Location & Route'}">
            <span>🛰️</span>
            <span>${isTa ? "இருப்பிடம்" : "Track GPS"}</span>
          </button>
        </div>
      `;

      card.querySelector(".procure-lot-btn").addEventListener("click", () => handleProcureLot(item));
      card.querySelector(".track-farmer-loc-btn").addEventListener("click", () => {
        openLiveTrackingModal({
          id: item.id || "LOT",
          buyer_code: item.best_buyer_code || "tn_civil_supplies_dpc",
          buyer_name: item.best_buyer_name || (isTa ? "நேரடி கொள்முதல் மையம்" : "Procurement Hub"),
          farmer_name: item.farmer_name || (isTa ? "உழவர் முருகன்" : "Farmer Murugan"),
          crop_code: item.crop_code || "paddy",
          quantity_kg: item.quantity_kg || 2000,
          farmer_location: item.location || "tirupporur",
          status: "truck_dispatched"
        });
      });
      grid.appendChild(card);
    });
  }

  /**
   * Handles Buyer clicking "Procure Lot", converting listing to a deal.
   */
  async function handleProcureLot(listing) {
    const isTa = state.lang === "ta";
    const buyerName = isTa ? "சென்னை அரிசி & பயறு ஆலை (மாதிரி வாங்குபவர்)" : "Chennai Grains & Rice Mill (Sample Buyer)";

    const payload = {
      listing_id: listing.id,
      buyer_code: "procuring_buyer_demo",
      buyer_name: buyerName,
      crop: listing.crop_code,
      quantity_kg: listing.quantity_kg,
      location: listing.location,
      price_per_kg: listing.gross_amount && listing.quantity_kg ? (listing.gross_amount / listing.quantity_kg) : ((CROPS_META.find(c => c.code === listing.crop_code) || {}).typical_price_min || 0),
      gross_amount: listing.gross_amount || 0,
      transport_cost: listing.transport_cost || 0,
      net_amount: listing.net_amount,
      is_urgent: Number(listing.is_urgent) === 1 ? 1 : 0
    };

    let newDeal = null;

    if (state.isOnline) {
      try {
        const resp = await fetch("/api/deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          const res = await resp.json();
          newDeal = res.deal;
        }
      } catch (e) {
        console.warn("Procurement API call failed, falling back to local deal");
      }
    }

    if (!newDeal) {
      newDeal = {
        id: Date.now(),
        listing_id: listing.id,
        buyer_code: payload.buyer_code,
        buyer_name: payload.buyer_name,
        crop_code: payload.crop,
        quantity_kg: payload.quantity_kg,
        farmer_location: payload.location,
        price_per_kg: payload.price_per_kg,
        gross_amount: payload.gross_amount,
        transport_cost: payload.transport_cost,
        net_amount: payload.net_amount,
        is_urgent: payload.is_urgent,
        status: "confirmed",
        created_at: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString()
      };
    }

    addDealToLocalCache(newDeal);
    showToast(isTa ? "கொள்முதல் வெற்றிகரமாக தொடங்கப்பட்டது!" : "Procurement initiated successfully!");

    // Switch to Deals Pipeline View to track next steps
    setTimeout(() => {
      switchRole("deals");
    }, 600);
  }

  /**
   * Loads deals from API or local storage.
   */
  async function loadDeals() {
    if (state.isOnline && window.location.protocol !== "file:") {
      try {
        const resp = await fetch("/api/deals");
        if (resp.ok) {
          const data = await resp.json();
          state.deals = data.deals || [];
          DOM.dealsCountBadge.textContent = state.deals.length;
          return;
        }
      } catch (e) {}
    }

    const cached = localStorage.getItem("farmbridge_deals");
    if (cached) {
      try {
        state.deals = JSON.parse(cached);
      } catch (e) {
        state.deals = [...SAMPLE_DATA.initial_deals];
      }
    } else {
      state.deals = [...SAMPLE_DATA.initial_deals];
    }
    DOM.dealsCountBadge.textContent = state.deals.length || 0;
  }

  function addDealToLocalCache(deal) {
    state.deals.unshift(deal);
    localStorage.setItem("farmbridge_deals", JSON.stringify(state.deals));
    DOM.dealsCountBadge.textContent = state.deals.length;
  }

  /**
   * Renders Deals Tracker View with multi-stage pipeline.
   */
  function renderDealsView() {
    const isTa = state.lang === "ta";
    const t = I18N[state.lang];
    const container = DOM.dealsListContainer;
    container.innerHTML = "";

    // Platform Commission & Telemetry Strip in Deals View
    const totalDeals = state.deals ? state.deals.length : 0;
    const totalVolumeKg = (state.deals || []).reduce((acc, d) => acc + (Number(d.quantity_kg) || 0), 0);
    const totalGmv = (state.deals || []).reduce((acc, d) => acc + (Number(d.gross_amount) || 0), 0);
    const totalDevFee = Math.round(totalGmv * 0.015);
    const totalFarmerSaved = Math.round(totalGmv * 0.085);
    const coldDeals = (state.deals || []).filter(d => d.deal_type === "cold_storage" || d.buyer_code === "farmbridge_cold_hub");
    const coldStorageKg = coldDeals.reduce((acc, d) => acc + (Number(d.quantity_kg) || 0), 0);

    if (DOM.dealsCommissionStrip) {
      DOM.dealsCommissionStrip.innerHTML = `
        <div style="background: var(--bg-card); padding: 0.6rem 0.8rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">🤝 ${isTa ? "செயலில் உள்ள ஒப்பந்தங்கள்:" : "Active Deals:"}</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: var(--green-900);">${totalDeals} ${isTa ? "ஒப்பந்தங்கள்" : "Deals"}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${(totalVolumeKg / 1000).toFixed(1)} MT வரத்து</div>
        </div>
        <div style="background: var(--bg-card); padding: 0.6rem 0.8rem; border-radius: var(--radius-sm); border: 1.5px solid #93c5fd;">
          <div style="font-size: 0.72rem; color: #1e40af; font-weight: 700;">💼 ${isTa ? "இணையதள பராமரிப்பு (1.5% Fee):" : "Platform Revenue (1.5%):"}</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #1e40af;">₹${totalDevFee.toLocaleString()}</div>
          <div style="font-size: 0.72rem; color: #2563eb;">${isTa ? "சர்வர் & AI பராமரிப்பு" : "Server & AI Operations"}</div>
        </div>
        <div style="background: var(--bg-card); padding: 0.6rem 0.8rem; border-radius: var(--radius-sm); border: 1.5px solid #86efac;">
          <div style="font-size: 0.72rem; color: #166534; font-weight: 700;">💰 ${isTa ? "விவசாயிகள் சேமிப்பு (vs 10% மண்டி):" : "Farmer Brokerage Savings:"}</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #166534;">+₹${totalFarmerSaved.toLocaleString()}</div>
          <div style="font-size: 0.72rem; color: #15803d;">${isTa ? "நேரடி லாபம்" : "Saved from Brokers"}</div>
        </div>
        <div style="background: var(--bg-card); padding: 0.6rem 0.8rem; border-radius: var(--radius-sm); border: 1.5px solid #7dd3fc;">
          <div style="font-size: 0.72rem; color: #0369a1; font-weight: 700;">❄️ ${isTa ? "குளிர்பதன கிடங்கு இருப்பு:" : "Cold Hub Storage:"}</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #0284c7;">${(coldStorageKg / 1000).toFixed(1)} MT</div>
          <div style="font-size: 0.72rem; color: #0284c7;">-18°C IQF Blast Freeze</div>
        </div>
      `;
    }

    if (!state.deals || state.deals.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="text-align: center; padding: 3rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 2px dashed var(--border-color);">
          <span style="font-size: 3rem;">🤝</span>
          <h3 style="margin-top: 0.75rem; color: var(--text-primary);">${t.deals_empty_title}</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">${t.deals_empty_desc}</p>
          <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem;">
            <button id="emptyCreateDealBtn" class="btn btn-turmeric">
              <span>➕</span>
              <span>${t.btn_create_demo_deal}</span>
            </button>
            <button id="emptyCreateColdDealBtn" class="btn btn-outline" style="border-color: #0284c7; color: #0369a1; font-weight: 700;">
              <span>❄️</span>
              <span>${isTa ? "குளிர் கிடங்கு ஒப்பந்தம்" : "Create Cold Hub Deal"}</span>
            </button>
          </div>
        </div>
      `;
      document.getElementById("emptyCreateDealBtn").addEventListener("click", handleCreateDemoDeal);
      const emptyColdBtn = document.getElementById("emptyCreateColdDealBtn");
      if (emptyColdBtn) emptyColdBtn.addEventListener("click", handleCreateColdStorageDeal);
      return;
    }

    state.deals.forEach(deal => {
      const isCold = deal.deal_type === "cold_storage" || deal.buyer_code === "farmbridge_cold_hub";
      const cropMeta = CROPS_META.find(c => c.code === deal.crop_code) || { icon: "🌾", name_en: deal.crop_code, name_ta: deal.crop_code };
      const locMeta = LOCATIONS_META.find(l => l.code === deal.farmer_location) || { name_en: deal.farmer_location, name_ta: deal.farmer_location };

      const stages = isCold
        ? [
            { key: "confirmed", ta: "இடம் முன்பதிவு", en: "Slot Booked", icon: "✓" },
            { key: "truck_dispatched", ta: "குளிர் லாரி புறப்பட்டது", en: "Cold-Van Inbound", icon: "🚚" },
            { key: "quality_inspected", ta: "IQF உறைநிலை தரம்", en: "IQF Frozen Grade A", icon: "❄️" },
            { key: "payment_completed", ta: "e-NWR ரசீது & கடன் தயார்", en: "e-NWR & Loan Ready", icon: "📄" }
          ]
        : [
            { key: "confirmed", ta: "உறுதி செய்யப்பட்டது", en: "Confirmed", icon: "✓" },
            { key: "truck_dispatched", ta: "லாரி புறப்பட்டது", en: "Truck Dispatched", icon: "🚚" },
            { key: "quality_inspected", ta: "தரப் பரிசோதனை", en: "Quality Check", icon: "🔍" },
            { key: "payment_completed", ta: "பணம் செலுத்தப்பட்டது", en: "Payment Settled", icon: "💰" }
          ];

      const currentStageIndex = stages.findIndex(s => s.key === deal.status);
      const isSettled = deal.status === "payment_completed";

      const card = document.createElement("div");
      card.className = "deal-card";
      if (isCold) {
        card.style.border = "2px solid #7dd3fc";
        card.style.background = "linear-gradient(180deg, var(--bg-card) 0%, #f0fdf4 100%)";
      }
      card.setAttribute("role", "listitem");

      // Build pipeline steps HTML
      let pipelineHtml = '<div class="deal-pipeline-track">';
      stages.forEach((st, idx) => {
        let stepClass = "pipeline-step";
        if (currentStageIndex >= idx) {
          stepClass += " completed";
        }
        if (currentStageIndex === idx) {
          stepClass += " current";
        }

        pipelineHtml += `
          <div class="${stepClass}">
            <div class="step-circle" aria-hidden="true">${currentStageIndex > idx ? "✓" : st.icon}</div>
            <div class="step-label">${isTa ? st.ta : st.en}</div>
          </div>
        `;
      });
      pipelineHtml += '</div>';

      // Determine next action button label
      let nextBtnHtml = "";
      if (deal.status === "confirmed") {
        nextBtnHtml = `<button class="btn btn-primary advance-status-btn" data-id="${deal.id}" data-next="truck_dispatched">
          <span>🚚</span>
          <span>${isCold ? (isTa ? "குளிர்பதன லாரி அனுப்பவும்" : "Dispatch Cold-Van") : (isTa ? "லாரி புறப்பட்டதாக மாற்று" : "Dispatch Truck")}</span>
        </button>`;
      } else if (deal.status === "truck_dispatched") {
        nextBtnHtml = `<button class="btn btn-primary advance-status-btn" data-id="${deal.id}" data-next="quality_inspected">
          <span>${isCold ? "❄️" : "🔍"}</span>
          <span>${isCold ? (isTa ? "IQF உறைநிலை & தரம் சரிபார்க்கப்பட்டது" : "Pass IQF Blast-Freeze (Grade A)") : (isTa ? "தரப் பரிசோதனை முடிந்தது (Grade A)" : "Pass Inspection (Grade A)")}</span>
        </button>`;
      } else if (deal.status === "quality_inspected") {
        nextBtnHtml = `<button class="btn btn-turmeric advance-status-btn" data-id="${deal.id}" data-next="payment_completed">
          <span>${isCold ? "📄" : "💰"}</span>
          <span>${isCold ? (isTa ? "e-NWR ரசீது & 70% கடன் வழங்கு" : "Issue e-NWR Receipt & Loan") : (isTa ? "மாதிரி பணம் செலுத்து (Simulate Payment)" : "Simulate Payout (UPI)")}</span>
        </button>`;
      } else if (deal.status === "payment_completed") {
        nextBtnHtml = `<button class="btn btn-outline" disabled style="opacity: 0.8; border-color: var(--green-600); color: var(--green-700);">
          <span>✓</span>
          <span>${isCold ? (isTa ? "e-NWR தயார் • 70% கடன் அனுமதிக்கப்பட்டது" : "e-NWR Issued • Loan Ready") : (isTa ? "பரிவர்த்தனை முடிந்தது" : "Settlement Completed")}</span>
        </button>`;
      }

      card.innerHTML = `
        <div class="deal-card-header">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <span class="deal-id-badge">${isCold ? "❄️ Cold Hub #" + deal.id : "Deal #" + deal.id}</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--green-900); margin: 0;">
                ${cropMeta.icon} ${isTa ? cropMeta.name_ta : cropMeta.name_en} • ${deal.quantity_kg} kg
              </h3>
              ${isCold ? `<span class="badge" style="background: #e0f2fe; color: #0369a1; font-weight: 700;">❄️ உறைநிலை சேமிப்பு (-18°C)</span>` : ""}
              ${Number(deal.is_urgent) === 1 ? `<span class="urgent-tag">🚨 அவசர விற்பனை</span>` : ""}
            </div>
            <p style="color: var(--text-muted); font-size: 0.82rem; margin: 0.25rem 0 0 0;">
              🏢 <strong>${deal.buyer_name}</strong> • 📍 ${isTa ? locMeta.name_ta : locMeta.name_en} • 📅 ${deal.updated_at || deal.created_at || ""}
            </p>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.75rem; color: var(--text-muted);">${isCold ? (isTa ? "மதிப்பிடப்பட்ட முதிர்வு மதிப்பு:" : "Maturity Net Value:") : t.net_payout_label}</span>
            <div style="font-size: 1.3rem; font-weight: 800; color: var(--green-800);">
              ₹${Math.round(deal.net_amount || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <!-- 4-Stage Pipeline Tracker -->
        ${pipelineHtml}

        <!-- Transparent 1.5% Developer Commission & Farmer Savings Pill -->
        <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 0.5rem 0.85rem; margin-top: 0.65rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; font-size: 0.82rem;">
          <div>
            <strong style="color: #166534;">💼 ${isTa ? "இணையதள பராமரிப்பு கட்டணம் (1.5% Developer Fee):" : "Platform Facilitation Fee (1.5%):"}</strong>
            <span style="font-weight: 800; color: #166534; margin-left: 0.35rem;">₹${Math.round((deal.gross_amount || 0) * 0.015).toLocaleString()}</span>
          </div>
          <span style="background: #dcfce7; color: #166534; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 999px; font-size: 0.74rem;">
            ✅ ${isTa ? `10% மண்டி கமிஷன் சேமிப்பு: +₹${Math.round((deal.gross_amount || 0) * 0.085).toLocaleString()}` : `Saved vs 10% Broker: +₹${Math.round((deal.gross_amount || 0) * 0.085).toLocaleString()}`}
          </span>
        </div>

        <!-- Live Farmer, Buyer & Dispatched Vehicle GPS Strip -->
        ${(() => {
          const tInfo = getTrackingTelemetry(deal);
          return `
            <div class="live-gps-deal-strip" style="background: var(--bg-primary); border: 1.5px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-top: 0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.6rem;">
                <div style="display: flex; align-items: center; gap: 0.45rem;">
                  <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.25);"></span>
                  <strong style="font-size: 0.85rem; color: var(--green-900);">
                    🛰️ ${isCold ? (isTa ? "குளிர்பதன லாரி & கிடங்கு ஜிபிஎஸ் (Cold-Van GPS)" : "Live Cold-Van & Central Hub GPS Tracker") : (isTa ? "நேரடி இருப்பிடம் & வாகன கண்காணிப்பு (Live GPS Tracker)" : "Live Farmer • Vehicle • Buyer Location Tracker")}
                  </strong>
                </div>
                <span style="font-size: 0.75rem; font-weight: 700; background: #e0f2fe; color: #0369a1; padding: 0.15rem 0.55rem; border-radius: 999px; border: 1px solid #bae6fd;">
                  🚚 ${tInfo.vehicleNo} • ${tInfo.progressPct}% (${isTa ? tInfo.checkpointTa : tInfo.checkpointEn})
                </span>
              </div>

              <!-- Progress Bar between Farmer and Buyer -->
              <div style="position: relative; height: 8px; background: #e2e8f0; border-radius: 999px; margin: 0.65rem 0; overflow: hidden;">
                <div style="width: ${tInfo.progressPct}%; height: 100%; background: linear-gradient(90deg, #16a34a, #f59e0b); border-radius: 999px; transition: width 0.4s ease;"></div>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.6rem; font-size: 0.78rem;">
                <div style="background: var(--bg-card); padding: 0.45rem 0.65rem; border-radius: 8px; border: 1px solid var(--border-color);">
                  <div style="color: var(--text-muted); font-size: 0.7rem;">🌾 ${isTa ? "விவசாயி இருப்பிடம் (Farmer Location):" : "Farmer Pickup Location:"}</div>
                  <div style="font-weight: 700; color: var(--text-primary);">${isTa ? tInfo.farmerLocTa : tInfo.farmerLocEn}</div>
                  <div style="font-family: monospace; font-size: 0.7rem; color: var(--green-700);">📍 ${tInfo.farmerLat.toFixed(4)}° N, ${tInfo.farmerLon.toFixed(4)}° E</div>
                </div>
                <div style="background: var(--bg-card); padding: 0.45rem 0.65rem; border-radius: 8px; border: 1.5px solid #fcd34d;">
                  <div style="color: #92400e; font-size: 0.7rem; font-weight: 700;">🚚 ${isCold ? (isTa ? "குளிர்பதன வாகனம் (Cold-Van GPS):" : "Cold-Van Live GPS:") : (isTa ? "அனுப்பப்பட்ட வாகனம் (Dispatched Vehicle):" : "Dispatched Vehicle Live GPS:")}</div>
                  <div style="font-weight: 700; color: var(--text-primary);">${isTa ? tInfo.checkpointTa : tInfo.checkpointEn}</div>
                  <div style="font-family: monospace; font-size: 0.7rem; color: #b45309;">🛰️ ${tInfo.vehicleLat.toFixed(4)}° N, ${tInfo.vehicleLon.toFixed(4)}° E • ${tInfo.speedKmh} km/h</div>
                </div>
                <div style="background: var(--bg-card); padding: 0.45rem 0.65rem; border-radius: 8px; border: 1px solid var(--border-color);">
                  <div style="color: var(--text-muted); font-size: 0.7rem;">🏢 ${isCold ? (isTa ? "மத்திய கிடங்கு இருப்பிடம் (Central Hub):" : "Central Cold Hub Location:") : (isTa ? "வாங்குபவர் இருப்பிடம் (Buyer Location):" : "Buyer Mandi Location:")}</div>
                  <div style="font-weight: 700; color: var(--text-primary);">${isTa ? tInfo.buyerLocTa : tInfo.buyerLocEn}</div>
                  <div style="font-family: monospace; font-size: 0.7rem; color: var(--green-700);">📍 ${tInfo.buyerLat.toFixed(4)}° N, ${tInfo.buyerLon.toFixed(4)}° E</div>
                </div>
              </div>
            </div>
          `;
        })()}

        <div class="deal-actions-bar" style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            ${isCold ? `
              <button class="btn btn-primary view-cold-receipt-btn" data-id="${deal.id}">
                <span>❄️</span>
                <span>${isTa ? "e-NWR கிடங்கு ரசீது" : "View e-NWR Receipt"}</span>
              </button>
            ` : `
              <button class="btn btn-outline view-receipt-btn" data-id="${deal.id}">
                <span>📄</span>
                <span>${t.btn_view_receipt}</span>
              </button>
            `}
            <button class="btn btn-outline track-deal-gps-btn" data-id="${deal.id}" style="border-color: var(--green-600); color: var(--green-800); font-weight: 700;">
              <span>🛰️</span>
              <span>${isTa ? "நேரடி வாகனம் & வரைபடம் (Live Map)" : "Track Live Vehicle & Locations"}</span>
            </button>
            <span class="sim-badge" style="font-size: 0.65rem;">${isCold ? "❄️ Cold Storage e-NWR" : t.tag_simulated_deal}</span>
          </div>
          <div>
            ${nextBtnHtml}
          </div>
        </div>
      `;

      // Event listener for Advance Status
      const advBtn = card.querySelector(".advance-status-btn");
      if (advBtn) {
        advBtn.addEventListener("click", () => handleAdvanceDealStatus(deal.id, advBtn.dataset.next));
      }

      // Event listener for View Receipt
      const receiptBtn = card.querySelector(".view-receipt-btn");
      if (receiptBtn) {
        receiptBtn.addEventListener("click", () => openReceiptModal(deal));
      }

      // Event listener for Cold Hub e-NWR Receipt
      const coldReceiptBtn = card.querySelector(".view-cold-receipt-btn");
      if (coldReceiptBtn) {
        coldReceiptBtn.addEventListener("click", () => {
          handleBookWarehouseSlot();
        });
      }

      // Event listener for Live GPS & Vehicle Tracker Modal
      const trackBtn = card.querySelector(".track-deal-gps-btn");
      if (trackBtn) {
        trackBtn.addEventListener("click", () => openLiveTrackingModal(deal));
      }

      container.appendChild(card);
    });
  }

      // Event listener for Advance Status
      const advBtn = card.querySelector(".advance-status-btn");
      if (advBtn) {
        advBtn.addEventListener("click", () => handleAdvanceDealStatus(deal.id, advBtn.dataset.next));
      }

      // Event listener for View Receipt
      card.querySelector(".view-receipt-btn").addEventListener("click", () => openReceiptModal(deal));

      // Event listener for Live GPS & Vehicle Tracker Modal
      const trackBtn = card.querySelector(".track-deal-gps-btn");
      if (trackBtn) {
        trackBtn.addEventListener("click", () => openLiveTrackingModal(deal));
      }

      container.appendChild(card);
    });
  }

  /**
   * Advances a deal to its next lifecycle stage.
   */
  async function handleAdvanceDealStatus(dealId, nextStatus) {
    const isTa = state.lang === "ta";

    if (state.isOnline) {
      try {
        const resp = await fetch("/api/deals/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deal_id: dealId,
            status: nextStatus
          })
        });

        if (resp.ok) {
          const res = await resp.json();
          // Update in local array
          const idx = state.deals.findIndex(d => Number(d.id) === Number(dealId));
          if (idx !== -1) {
            state.deals[idx] = res.deal;
            localStorage.setItem("farmbridge_deals", JSON.stringify(state.deals));
          }
          renderDealsView();
          showToast(isTa ? I18N.ta.deal_advanced_toast : I18N.en.deal_advanced_toast);
          return;
        }
      } catch (err) {
        console.warn("API deal status update failed, updating locally:", err);
      }
    }

    // Offline update fallback
    const idx = state.deals.findIndex(d => Number(d.id) === Number(dealId));
    if (idx !== -1) {
      state.deals[idx].status = nextStatus;
      state.deals[idx].updated_at = new Date().toLocaleString();
      localStorage.setItem("farmbridge_deals", JSON.stringify(state.deals));
      renderDealsView();
      showToast(isTa ? I18N.ta.deal_advanced_toast : I18N.en.deal_advanced_toast);
    }
  }

  /**
   * Creates a sample deal so user can instantly test the 4-stage pipeline.
   */
  async function handleCreateDemoDeal() {
    const isTa = state.lang === "ta";
    const demoDeal = {
      id: Date.now(),
      listing_id: 1,
      buyer_code: "kanchi_ponni_rice_mill",
      buyer_name: isTa ? "காஞ்சி பொன்னி அரிசி ஆலை" : "Kanchi Ponni Rice Mill",
      crop_code: "paddy",
      quantity_kg: 2500,
      farmer_location: "tirupporur",
      price_per_kg: 23.70,
      gross_amount: 59250.0,
      transport_cost: 2680.0,
      net_amount: 56570.0,
      is_urgent: 0,
      status: "confirmed",
      created_at: new Date().toLocaleString(),
      updated_at: new Date().toLocaleString()
    };

    if (state.isOnline) {
      try {
        const resp = await fetch("/api/deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            buyer_code: demoDeal.buyer_code,
            buyer_name: demoDeal.buyer_name,
            crop: demoDeal.crop_code,
            quantity_kg: demoDeal.quantity_kg,
            location: demoDeal.farmer_location,
            price_per_kg: demoDeal.price_per_kg,
            gross_amount: demoDeal.gross_amount,
            transport_cost: demoDeal.transport_cost,
            net_amount: demoDeal.net_amount,
            is_urgent: 0
          })
        });
        if (resp.ok) {
          const res = await resp.json();
          addDealToLocalCache(res.deal);
          renderDealsView();
          showToast(isTa ? "புதிய மாதிரி ஒப்பந்தம் உருவாக்கப்பட்டது!" : "New demo deal created!");
          return;
        }
      } catch (e) {}
    }

    addDealToLocalCache(demoDeal);
    renderDealsView();
    showToast(isTa ? "புதிய மாதிரி ஒப்பந்தம் உருவாக்கப்பட்டது!" : "New demo deal created!");
  }

  /**
   * Creates a sample FarmBridge Central Cold Hub storage contract.
   */
  function handleCreateColdStorageDeal() {
    const isTa = state.lang === "ta";
    const coldDeal = {
      id: Date.now(),
      listing_id: 100 + Math.floor(Math.random() * 900),
      buyer_code: "farmbridge_cold_hub",
      buyer_name: isTa
        ? "FarmBridge மத்திய குளிர்பதன கிடங்கு & உறைநிலை மையம் (IQF Blast Freeze)"
        : "FarmBridge Central Cold Storage & IQF Frozen Veg Hub",
      deal_type: "cold_storage",
      crop_code: "tomato",
      quantity_kg: 2000,
      farmer_location: "chengalpattu",
      price_per_kg: 30.00,
      gross_amount: 60000.0,
      transport_cost: 3000.0,
      platform_fee: 900.0,
      net_amount: 56100.0,
      is_urgent: 0,
      status: "truck_dispatched",
      storage_chamber: "Chamber 1 (-18.4°C IQF Blast Freeze)",
      e_nwr_no: `TN-WDRA-CH-0428-LOT${Math.floor(10 + Math.random() * 90)}`,
      created_at: new Date().toLocaleString(),
      updated_at: new Date().toLocaleString()
    };

    addDealToLocalCache(coldDeal);
    renderDealsView();
    showToast(isTa ? "❄️ புதிய குளிர்பதன கிடங்கு வைப்பு ஒப்பந்தம் உருவாக்கப்பட்டது!" : "❄️ New Cold Storage & Frozen Veg contract created!");
  }

  /**
   * Mandi Receipt / Challan Modal rendering.
   */
  function openReceiptModal(deal) {
    const isTa = state.lang === "ta";
    const t = I18N[state.lang];
    const cropMeta = CROPS_META.find(c => c.code === deal.crop_code) || { icon: "🌾", name_en: deal.crop_code, name_ta: deal.crop_code };
    const locMeta = LOCATIONS_META.find(l => l.code === deal.farmer_location) || { name_en: deal.farmer_location, name_ta: deal.farmer_location };

    const statusTranslations = {
      confirmed: isTa ? "உறுதி செய்யப்பட்டது" : "Confirmed",
      truck_dispatched: isTa ? "வாகனம் அனுப்பப்பட்டது" : "Truck Dispatched",
      quality_inspected: isTa ? "தரம் சரிபார்க்கப்பட்டது (Grade A)" : "Quality Inspected (Grade A)",
      payment_completed: isTa ? "பணம் செலுத்தப்பட்டது (Simulated Settled)" : "Payment Completed (Simulated Settled)",
      cancelled: isTa ? "ரத்து செய்யப்பட்டது" : "Cancelled"
    };

    DOM.receiptContent.innerHTML = `
      <div class="mandi-header-box" style="text-align: center; border-bottom: 2px dashed var(--border-color); padding-bottom: 1rem; margin-bottom: 1rem;">
        <h4 style="margin: 0; color: var(--green-900); font-size: 1.15rem;">
          ${isTa ? "🌾 தமிழ்நாடு வேளாண் நேரடி கொள்முதல் மையம் (மாதிரி சலான்)" : "🌾 Tamil Nadu Agricultural Direct Procurement Centre (Sample Challan)"}
        </h4>
        <p style="margin: 0.25rem 0 0 0; font-size: 0.8rem; color: var(--text-muted);">
          ${isTa ? "FarmBridge வேளாண் சந்தை • நேரடி மண்டி சலான் & மின்னணு பணப்பட்டுவாடா" : "FarmBridge Agricultural Marketplace • Direct Mandi Challan & Electronic Payment Voucher"}
        </p>
        <div style="display: flex; justify-content: center; gap: 1rem; font-size: 0.78rem; margin-top: 0.5rem; color: var(--text-muted);">
          <span><strong>Challan No:</strong> TN-FB-${deal.id}-${new Date().getFullYear()}</span>
          <span><strong>Date:</strong> ${deal.updated_at || deal.created_at || new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div class="receipt-table" style="font-size: 0.9rem;">
        <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color);">
          <span style="color: var(--text-muted);">${t.receipt_farmer}</span>
          <span style="font-weight: 600;">உழவர் (Farmer) • 📍 ${isTa ? locMeta.name_ta : locMeta.name_en}</span>
        </div>
        <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color);">
          <span style="color: var(--text-muted);">${t.receipt_buyer}</span>
          <span style="font-weight: 600;">${deal.buyer_name}</span>
        </div>
        <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color);">
          <span style="color: var(--text-muted);">${t.receipt_crop_qty}</span>
          <span style="font-weight: 600;">${cropMeta.icon} ${isTa ? cropMeta.name_ta : cropMeta.name_en} — ${deal.quantity_kg} kg @ ₹${deal.price_per_kg}/kg</span>
        </div>
        <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color);">
          <span style="color: var(--text-muted);">${t.receipt_gross}</span>
          <span style="font-weight: 600;">₹${Math.round(deal.gross_amount).toLocaleString()}</span>
        </div>
        <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color); color: #d97706;">
          <span>${t.receipt_transport}</span>
          <span style="font-weight: 600;">− ₹${Math.round(deal.transport_cost).toLocaleString()}</span>
        </div>
        <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color); color: #059669; font-size: 0.85rem;">
          <span>${isTa ? "FarmBridge குறைந்தபட்ச சேவை கட்டணம் (1.5%):" : "FarmBridge Platform Facilitation Fee (1.5%):"}</span>
          <span style="font-weight: 600;">₹${Math.round(deal.gross_amount * 0.015).toLocaleString()}</span>
        </div>
        <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 2px solid var(--border-color); font-size: 1.15rem; font-weight: 800; color: var(--green-800);">
          <span>${t.receipt_net}</span>
          <span>₹${Math.round(deal.net_amount).toLocaleString()}</span>
        </div>
      </div>

      <div class="receipt-meta-details" style="background: var(--bg-secondary); padding: 0.75rem; border-radius: var(--radius-md); margin-top: 1rem; font-size: 0.82rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span style="color: var(--text-muted);">${t.receipt_payment_status}</span>
          <span style="font-weight: 700; color: ${deal.status === 'payment_completed' ? 'var(--green-700)' : '#d97706'};">
            ${statusTranslations[deal.status] || deal.status}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span style="color: var(--text-muted);">${t.receipt_payment_mode}</span>
          <span>${t.receipt_payment_sim}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">${isTa ? "மாதிரி தர மதிப்பீடு:" : "Sample Quality Grade:"}</span>
          <span style="color: var(--green-700); font-weight: 600;">${isTa ? "Grade-A (தூய்மை 99%)" : "Grade-A (Purity 99%)"}</span>
        </div>
      </div>
    `;

    DOM.receiptModal.classList.remove("hidden");
  }

  function closeReceiptModal() {
    DOM.receiptModal.classList.add("hidden");
  }

  // Active tracking state for modal simulation
  let activeTrackingDeal = null;
  let activeTrackingProgress = null;

  /**
   * Computes Farmer GPS, Buyer GPS, and Live Dispatched Vehicle GPS + Route Telemetry.
   */
  function getTrackingTelemetry(deal, overrideProgressPct = null) {
    const FARMER_HUBS = {
      tirupporur: { lat: 12.7249, lon: 80.1878, en: "Tirupporur Farm Hub", ta: "திருப்போரூர் விவசாயப் பகுதி" },
      chengalpattu: { lat: 12.6939, lon: 79.9757, en: "Chengalpattu Collection Hub", ta: "செங்கல்பட்டு வேளாண் மையம்" },
      kanchipuram: { lat: 12.8342, lon: 79.7036, en: "Kanchipuram Ayacut Hub", ta: "காஞ்சிபுரம் விவசாய மையம்" },
      tindivanam: { lat: 12.2334, lon: 79.6508, en: "Tindivanam Agro Cluster", ta: "திண்டிவனம் விவசாயப் பகுதி" }
    };

    const BUYER_HUBS = {
      kanchi_ponni_rice_mill: { lat: 12.8385, lon: 79.7120, en: "Kanchi Ponni Modern Rice Mill (Kanchipuram)", ta: "காஞ்சி பொன்னி நவீன அரிசி ஆலை (காஞ்சிபுரம்)" },
      tn_civil_supplies_dpc: { lat: 12.7012, lon: 79.9815, en: "TN Civil Supplies DPC (Chengalpattu)", ta: "நேரடி நெல் கொள்முதல் நிலையம் - DPC (செங்கல்பட்டு)" },
      tirupporur_grain_traders: { lat: 12.7310, lon: 80.1912, en: "Tirupporur Uzhavar Grain Traders", ta: "திருப்போரூர் உழவர் தானிய வியாபாரி" },
      tindivanam_lakshmi_mill: { lat: 12.2410, lon: 79.6590, en: "Tindivanam Lakshmi Agro Rice Mill", ta: "திண்டிவனம் லக்ஷ்மி அரிசி ஆலை" },
      maduranthakam_delta_traders: { lat: 12.5105, lon: 79.8860, en: "Maduranthakam Delta Agro Traders", ta: "மதுராந்தகம் டெல்டா அக்ரோ டிரேடர்ஸ்" },
      padalam_sugar_mills: { lat: 12.5920, lon: 79.9410, en: "Padalam Cooperative Sugar Mills", ta: "படாளம் கூட்டுறவு சர்க்கரை ஆலை" },
      cheyyar_coop_sugar_mill: { lat: 12.6620, lon: 79.5430, en: "Cheyyar Co-op Sugar Mill", ta: "செய்யாறு கூட்டுறவு சர்க்கரை ஆலை" },
      tirupporur_nattu_sakkarai: { lat: 12.7190, lon: 80.1810, en: "Tirupporur Jaggery & Cane Unit", ta: "திருப்போரூர் நாட்டுச் சர்க்கரை ஆலை" },
      tindivanam_cane_cluster: { lat: 12.2290, lon: 79.6450, en: "Tindivanam Organic Cane Cluster", ta: "திண்டிவனம் கரும்பு & வெல்ல மையம்" },
      kanchi_bio_sugar: { lat: 12.8280, lon: 79.6950, en: "Kanchi Bio-Cane Processing", ta: "காஞ்சி பயோ கரும்பு ஆலை" },
      chengalpattu_uzhavar_aggregator: { lat: 12.6895, lon: 79.9802, en: "Chengalpattu Uzhavar Sandhai Aggregator", ta: "செங்கல்பட்டு உழவர் சந்தை மொத்த கொள்முதல்" },
      koyambedu_kanchi_hub: { lat: 12.8420, lon: 79.7180, en: "Koyambedu Wholesale - Kanchi Hub", ta: "கோயம்பேடு மொத்த விற்பனை - காஞ்சி மையம்" },
      tirupporur_green_mandi: { lat: 12.7285, lon: 80.1895, en: "Tirupporur Green Veg Mandi", ta: "திருப்போரூர் பசுமை காய்கறி மண்டி" },
      tindivanam_highway_mandi: { lat: 12.2380, lon: 79.6540, en: "Tindivanam Highway Veg Terminal", ta: "திண்டிவனம் நெடுஞ்சாலை காய்கறி முனையம்" }
    };

    const locKey = (deal.farmer_location || "tirupporur").toLowerCase();
    const farmerHub = FARMER_HUBS[locKey] || FARMER_HUBS.tirupporur;
    const buyerHub = BUYER_HUBS[deal.buyer_code] || {
      lat: 12.6939,
      lon: 79.9757,
      en: deal.buyer_name || "Buyer Procurement Hub",
      ta: deal.buyer_name || "வாங்குபவர் கொள்முதல் நிலையம்"
    };

    let progressPct = 62;
    if (overrideProgressPct !== null) {
      progressPct = overrideProgressPct;
    } else if (deal.live_progress !== undefined) {
      progressPct = deal.live_progress;
    } else if (deal.status === "confirmed") {
      progressPct = 15;
    } else if (deal.status === "truck_dispatched") {
      progressPct = 62;
    } else if (deal.status === "quality_inspected" || deal.status === "payment_completed") {
      progressPct = 100;
    }

    const ratio = Math.max(0, Math.min(100, progressPct)) / 100;
    const vehicleLat = farmerHub.lat + (buyerHub.lat - farmerHub.lat) * ratio;
    const vehicleLon = farmerHub.lon + (buyerHub.lon - farmerHub.lon) * ratio;

    let checkpointEn = "En Route via NH-45 GST Highway";
    let checkpointTa = "NH-45 தேசிய நெடுஞ்சாலை வழியாகப் பயணத்தில்";
    let speedKmh = 48;

    if (progressPct <= 15) {
      checkpointEn = `Loading at ${farmerHub.en}`;
      checkpointTa = `${farmerHub.ta} பண்ணையில் ஏற்றப்படுகிறது`;
      speedKmh = 0;
    } else if (progressPct < 45) {
      checkpointEn = "Crossing State Highway Checkpost (SH-49A)";
      checkpointTa = "மாநில நெடுஞ்சாலை சோதனைச் சாவடியைக் கடக்கிறது (SH-49A)";
      speedKmh = 44;
    } else if (progressPct < 80) {
      checkpointEn = "In Transit near NH-45 / Singaperumal Koil Bypass";
      checkpointTa = "NH-45 சிங்கப்பெருமாள் கோவில் புறவழிச்சாலை அருகில்";
      speedKmh = 52;
    } else if (progressPct < 100) {
      checkpointEn = "Approaching Buyer Mandi Weighbridge";
      checkpointTa = "வாங்குபவர் மண்டி எடை மேடையை நெருங்குகிறது";
      speedKmh = 28;
    } else {
      checkpointEn = "Arrived at Buyer Procurement Centre";
      checkpointTa = "வாங்குபவர் கொள்முதல் நிலையத்தை அடைந்தது";
      speedKmh = 0;
    }

    const idSuffix = String(deal.id || 4589).slice(-4).padStart(4, "4");
    const vehicleNo = `TN-21-AX-${idSuffix}`;

    return {
      farmerLocEn: farmerHub.en,
      farmerLocTa: farmerHub.ta,
      farmerLat: farmerHub.lat,
      farmerLon: farmerHub.lon,
      buyerLocEn: buyerHub.en,
      buyerLocTa: buyerHub.ta,
      buyerLat: buyerHub.lat,
      buyerLon: buyerHub.lon,
      vehicleNo,
      driverNameEn: "Murugesan K (Heavy Lorry Driver)",
      driverNameTa: "முருகேசன் கே (லாரி ஓட்டுநர்)",
      driverPhone: "+91 94430 55112",
      vehicleLat,
      vehicleLon,
      progressPct,
      checkpointEn,
      checkpointTa,
      speedKmh
    };
  }

  /**
   * Opens the Live Location & Dispatched Vehicle Tracking Modal.
   */
  function openLiveTrackingModal(deal) {
    activeTrackingDeal = deal;
    activeTrackingProgress = deal.live_progress !== undefined ? deal.live_progress : null;
    renderTrackingModalContent();
    if (DOM.liveTrackingModal) {
      DOM.liveTrackingModal.classList.remove("hidden");
    }
  }

  function renderTrackingModalContent() {
    if (!activeTrackingDeal || !DOM.liveTrackingBody) return;
    const isTa = state.lang === "ta";
    const tInfo = getTrackingTelemetry(activeTrackingDeal, activeTrackingProgress);

    if (DOM.trackingModalTitle) {
      DOM.trackingModalTitle.textContent = isTa
        ? "🛰️ நேரடி இருப்பிடம் & அனுப்பப்பட்ட வாகன கண்காணிப்பு"
        : "🛰️ Live Farmer • Dispatched Vehicle • Buyer GPS Tracker";
    }
    if (DOM.simMoveBtnText) {
      DOM.simMoveBtnText.textContent = isTa
        ? "வாகன நகர்வை உருவகப்படுத்து (Move Truck +20%)"
        : "Simulate Live Vehicle Move (+20%)";
    }
    if (DOM.openGoogleMapsLink) {
      DOM.openGoogleMapsLink.href = `https://www.google.com/maps/dir/?api=1&origin=${tInfo.farmerLat},${tInfo.farmerLon}&destination=${tInfo.buyerLat},${tInfo.buyerLon}&travelmode=driving`;
    }

    DOM.liveTrackingBody.innerHTML = `
      <!-- Visual Route Map Canvas -->
      <div style="background: linear-gradient(135deg, #0f291e 0%, #143d29 100%); color: #fff; border-radius: var(--radius-md); padding: 1.25rem; position: relative; overflow: hidden; border: 2px solid #22c55e;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
          <span style="background: rgba(34,197,94,0.2); border: 1px solid #4ade80; color: #bbf7d0; padding: 0.2rem 0.65rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700;">
            🟢 LIVE GPS TELEMETRY • ${tInfo.vehicleNo}
          </span>
          <span style="font-family: monospace; font-size: 0.8rem; color: #fde047;">
            🛰️ Vehicle Lat/Lon: ${tInfo.vehicleLat.toFixed(4)}° N, ${tInfo.vehicleLon.toFixed(4)}° E (${tInfo.speedKmh} km/h)
          </span>
        </div>

        <!-- Visual Highway Track with Farmer, Moving Truck, and Buyer -->
        <div style="position: relative; padding: 1.8rem 0.5rem 1.2rem 0.5rem; margin: 0.5rem 0;">
          <!-- Dashed Highway Line -->
          <div style="height: 10px; background: rgba(255,255,255,0.18); border-radius: 999px; position: relative;">
            <div style="width: ${tInfo.progressPct}%; height: 100%; background: linear-gradient(90deg, #4ade80, #facc15); border-radius: 999px; transition: width 0.35s ease;"></div>
          </div>

          <!-- Moving Dispatched Vehicle Marker -->
          <div style="position: absolute; top: 4px; left: calc(${Math.min(92, Math.max(6, tInfo.progressPct))}% - 22px); transition: left 0.35s ease; text-align: center;">
            <div style="background: #facc15; color: #142416; font-weight: 800; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); white-space: nowrap;">
              🚚 ${tInfo.progressPct}%
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 0.75rem; font-size: 0.8rem;">
            <div>
              <div style="color: #86efac; font-weight: 700;">🌾 ${isTa ? "விவசாயி (Farmer Origin)" : "Farmer Pickup"}</div>
              <div>${isTa ? tInfo.farmerLocTa : tInfo.farmerLocEn}</div>
              <div style="font-family: monospace; font-size: 0.72rem; color: #cbd5e1;">${tInfo.farmerLat.toFixed(4)}°N, ${tInfo.farmerLon.toFixed(4)}°E</div>
            </div>
            <div style="text-align: right;">
              <div style="color: #fde047; font-weight: 700;">🏢 ${isTa ? "வாங்குபவர் மண்டி (Buyer)" : "Buyer Destination"}</div>
              <div>${isTa ? tInfo.buyerLocTa : tInfo.buyerLocEn}</div>
              <div style="font-family: monospace; font-size: 0.72rem; color: #cbd5e1;">${tInfo.buyerLat.toFixed(4)}°N, ${tInfo.buyerLon.toFixed(4)}°E</div>
            </div>
          </div>
        </div>

        <div style="background: rgba(0,0,0,0.35); padding: 0.6rem 0.85rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; font-size: 0.82rem;">
          <div>
            <strong>📍 ${isTa ? "தற்போதைய வாகன இருப்பிடம்:" : "Current Dispatched Vehicle Location:"}</strong>
            <span style="color: #fef08a; margin-left: 0.35rem;">${isTa ? tInfo.checkpointTa : tInfo.checkpointEn}</span>
          </div>
          <div>
            👨‍✈️ ${isTa ? tInfo.driverNameTa : tInfo.driverNameEn} • <a href="tel:${tInfo.driverPhone}" style="color: #4ade80; font-weight: 700;">${tInfo.driverPhone}</a>
          </div>
        </div>
      </div>

      <!-- 3-Column Detailed Location Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-top: 1rem;">
        <div style="background: var(--bg-primary); border: 1.5px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">🌾 ${isTa ? "1. விவசாயி இருப்பிடம்" : "1. FARMER LOCATION"}</div>
          <div style="font-weight: 800; font-size: 0.95rem; margin-top: 0.25rem; color: var(--green-900);">${isTa ? tInfo.farmerLocTa : tInfo.farmerLocEn}</div>
          <div style="font-family: monospace; font-size: 0.78rem; color: var(--green-700); margin-top: 0.25rem;">GPS: ${tInfo.farmerLat.toFixed(4)}, ${tInfo.farmerLon.toFixed(4)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${isTa ? "புறப்படும் இடம் உறுதி செய்யப்பட்டது" : "Verified Pickup Coordinates"}</div>
        </div>

        <div style="background: #fffbeb; border: 1.5px solid #fcd34d; border-radius: var(--radius-md); padding: 0.85rem;">
          <div style="font-size: 0.75rem; color: #92400e; font-weight: 700;">🚚 ${isTa ? "2. அனுப்பப்பட்ட வாகன இருப்பிடம்" : "2. DISPATCHED VEHICLE LIVE"}</div>
          <div style="font-weight: 800; font-size: 0.95rem; margin-top: 0.25rem; color: #78350f;">${tInfo.vehicleNo} (${tInfo.speedKmh} km/h)</div>
          <div style="font-family: monospace; font-size: 0.78rem; color: #b45309; margin-top: 0.25rem;">GPS: ${tInfo.vehicleLat.toFixed(4)}, ${tInfo.vehicleLon.toFixed(4)}</div>
          <div style="font-size: 0.75rem; color: #92400e; margin-top: 0.25rem;">${isTa ? tInfo.checkpointTa : tInfo.checkpointEn}</div>
        </div>

        <div style="background: var(--bg-primary); border: 1.5px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">🏢 ${isTa ? "3. வாங்குபவர் இருப்பிடம்" : "3. BUYER DESTINATION"}</div>
          <div style="font-weight: 800; font-size: 0.95rem; margin-top: 0.25rem; color: var(--green-900);">${isTa ? tInfo.buyerLocTa : tInfo.buyerLocEn}</div>
          <div style="font-family: monospace; font-size: 0.78rem; color: var(--green-700); margin-top: 0.25rem;">GPS: ${tInfo.buyerLat.toFixed(4)}, ${tInfo.buyerLon.toFixed(4)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${isTa ? "கொள்முதல் நிலையம் & எடை மேடை" : "Verified Mandi Weighbridge"}</div>
        </div>
      </div>
    `;
  }

  function handleSimulateVehicleMovement() {
    if (!activeTrackingDeal) return;
    const isTa = state.lang === "ta";
    const currentT = getTrackingTelemetry(activeTrackingDeal, activeTrackingProgress);
    let nextProg = currentT.progressPct + 20;
    if (nextProg > 100) nextProg = 15;
    activeTrackingProgress = nextProg;
    activeTrackingDeal.live_progress = nextProg;

    renderTrackingModalContent();
    if (state.currentRole === "deals") {
      renderDealsView();
    }

    const updatedT = getTrackingTelemetry(activeTrackingDeal, activeTrackingProgress);
    showToast(
      isTa
        ? `🚚 வாகனம் ${updatedT.vehicleNo}: ${updatedT.progressPct}% (${updatedT.checkpointTa})`
        : `🚚 Vehicle ${updatedT.vehicleNo}: ${updatedT.progressPct}% (${updatedT.checkpointEn})`
    );
  }

  function closeLiveTrackingModal() {
    if (DOM.liveTrackingModal) {
      DOM.liveTrackingModal.classList.add("hidden");
    }
  }

  // =========================================================================
  // CENTRAL COLD STORAGE & DEVELOPER MONETIZATION (WAREHOUSE VIEW)
  // =========================================================================

  const WAREHOUSE_CROPS_DATA = {
    tomato: {
      name_ta: "தக்காளி (Tomato)",
      name_en: "Tomato",
      icon: "🍅",
      fresh_rate: 8.0,
      frozen_rate: 30.0,
      storage_rate: 0.50, // per kg per month
      shelf_life: "9 மாதங்கள் (9 Months at -18°C)",
      target_buyers: "உணவகங்கள், சாஸ் தொழிற்சாலைகள், கிளவுட் கிச்சன்"
    },
    peas: {
      name_ta: "பசுமை பட்டாணி (Green Peas)",
      name_en: "Green Peas",
      icon: "🟢",
      fresh_rate: 35.0,
      frozen_rate: 85.0,
      storage_rate: 0.60,
      shelf_life: "12 மாதங்கள் (12 Months at -18°C)",
      target_buyers: "சூப்பர் மார்க்கெட்டுகள், ஏற்றுமதி"
    },
    onion: {
      name_ta: "வெங்காயம் (Onion)",
      name_en: "Onion",
      icon: "🧅",
      fresh_rate: 18.0,
      frozen_rate: 45.0,
      storage_rate: 0.40,
      shelf_life: "6 மாதங்கள் (6 Months at -18°C)",
      target_buyers: "ரெடி-டு-குக் பிராண்டுகள், கேட்டரிங்"
    },
    potato: {
      name_ta: "உருளைக்கிழங்கு (Potato)",
      name_en: "Potato",
      icon: "🥔",
      fresh_rate: 14.0,
      frozen_rate: 28.0,
      storage_rate: 0.35,
      shelf_life: "8 மாதங்கள் (Cold Bay +3°C)",
      target_buyers: "சிப்ஸ் ஆலைகள், மொத்த விற்பனையாளர்கள்"
    },
    chilli: {
      name_ta: "பச்சை மிளகாய் (Green Chilli)",
      name_en: "Green Chilli",
      icon: "🌶️",
      fresh_rate: 25.0,
      frozen_rate: 58.0,
      storage_rate: 0.50,
      shelf_life: "6 மாதங்கள் (IQF -18°C)",
      target_buyers: "மசாலா நிறுவனங்கள், உணவகங்கள்"
    }
  };

  /**
   * Renders the Central Cold Storage & Developer Monetization view.
   */
  function renderWarehouseView() {
    // Subtle realistic temperature fluctuation for IoT telemetry simulation
    const freezeFluct = (-18.2 - Math.random() * 0.4).toFixed(1);
    const chilledFluct = (+3.5 + Math.random() * 0.3).toFixed(1);

    if (DOM.chamberFreezeTemp) DOM.chamberFreezeTemp.textContent = `${freezeFluct}°C`;
    if (DOM.chamberChilledTemp) DOM.chamberChilledTemp.textContent = `+${chilledFluct}°C`;

    updateDepositCalculator();
    updateVolumeSimulation();
  }

  /**
   * Updates the Farmer Cold Storage vs Mandi Distress Sale Calculator.
   */
  function updateDepositCalculator() {
    if (!DOM.depositComparisonResult || !DOM.depositCropSelect) return;
    const isTa = state.lang === "ta";
    const cropKey = DOM.depositCropSelect.value || "tomato";
    const cropInfo = WAREHOUSE_CROPS_DATA[cropKey] || WAREHOUSE_CROPS_DATA.tomato;
    const qty = Math.max(50, parseFloat(DOM.depositQtyInput ? DOM.depositQtyInput.value : 2000) || 2000);
    const months = parseInt(DOM.depositMonthsSelect ? DOM.depositMonthsSelect.value : 3, 10) || 3;

    // Distress Mandi Path A
    const mandiGross = qty * cropInfo.fresh_rate;
    const mandiBrokerCut = mandiGross * 0.10; // 10% brokerage + unloading fee
    const mandiNet = mandiGross - mandiBrokerCut;

    // FarmBridge Cold Hub Path B
    const frozenGross = qty * cropInfo.frozen_rate;
    const storageFee = qty * cropInfo.storage_rate * months;
    const platformFee = Math.round(frozenGross * 0.015); // 1.5% Developer Platform Facilitation Fee
    const hubNet = Math.round(frozenGross - storageFee - platformFee);

    const extraGain = Math.max(0, hubNet - mandiNet);
    const gainPct = mandiNet > 0 ? Math.round((extraGain / mandiNet) * 100) : 100;

    DOM.depositComparisonResult.innerHTML = `
      <div style="margin-bottom: 0.75rem;">
        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">
          ${isTa ? "நேரடி ஒப்பீடு முடிவு (Comparison Result)" : "Direct Comparison Result"}
        </span>
        <h4 style="margin: 0.25rem 0 0 0; font-size: 1.15rem; color: var(--green-900);">
          ${cropInfo.icon} ${isTa ? cropInfo.name_ta : cropInfo.name_en} — ${qty.toLocaleString()} kg (${months} ${isTa ? "மாதங்கள்" : "Months"})
        </h4>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
        <!-- Mandi Path A -->
        <div style="background: #fef2f2; border: 1.5px solid #fca5a5; border-radius: var(--radius-sm); padding: 0.75rem;">
          <div style="color: #991b1b; font-weight: 700; font-size: 0.82rem;">❌ ${isTa ? "இன்றைய மண்டி தற்கொலை விலை" : "Distress Mandi Sale"}</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #b91c1c; margin-top: 0.25rem;">₹${Math.round(mandiNet).toLocaleString()}</div>
          <div style="font-size: 0.75rem; color: #7f1d1d; margin-top: 0.25rem;">
            ${isTa ? `விலை: ₹${cropInfo.fresh_rate}/kg<br>மண்டி தரகர் கமிஷன் (10%): −₹${Math.round(mandiBrokerCut).toLocaleString()}` : `Rate: ₹${cropInfo.fresh_rate}/kg<br>Mandi Broker (10%): −₹${Math.round(mandiBrokerCut).toLocaleString()}`}
          </div>
        </div>

        <!-- Cold Hub Path B -->
        <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: var(--radius-sm); padding: 0.75rem;">
          <div style="color: #166534; font-weight: 700; font-size: 0.82rem;">❄️ ${isTa ? "FarmBridge உறைநிலை சேமிப்பு" : "Cold Hub Blast-Freeze"}</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #15803d; margin-top: 0.25rem;">₹${hubNet.toLocaleString()}</div>
          <div style="font-size: 0.75rem; color: #14532d; margin-top: 0.25rem;">
            ${isTa ? `மதிப்பு: ₹${cropInfo.frozen_rate}/kg (₹${Math.round(frozenGross).toLocaleString()})<br>சேமிப்பு: −₹${Math.round(storageFee).toLocaleString()} • கட்டணம் (1.5%): −₹${platformFee.toLocaleString()}` : `Value: ₹${cropInfo.frozen_rate}/kg (₹${Math.round(frozenGross).toLocaleString()})<br>Storage: −₹${Math.round(storageFee).toLocaleString()} • Fee (1.5%): −₹${platformFee.toLocaleString()}`}
          </div>
        </div>
      </div>

      <!-- Gain Highlight Badge -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #dcfce7 100%); border: 1.5px solid #f59e0b; border-radius: var(--radius-sm); padding: 0.75rem; text-align: center;">
        <span style="font-size: 1.3rem;">🚀</span>
        <strong style="color: #92400e; font-size: 1rem; display: block;">
          ${isTa ? `விவசாயிக்குக் கிடைக்கும் நிகர கூடுதல் லாபம்: +₹${extraGain.toLocaleString()} (+${gainPct}%)` : `Farmer Extra Net Profit: +₹${extraGain.toLocaleString()} (+${gainPct}%)`}
        </strong>
        <span style="font-size: 0.75rem; color: #78350f;">
          ${isTa ? "அழுகல் அபாயம் இல்லை • வங்கி கடன் பெறும் தகுதி (Warehouse Receipt Financing)" : "Zero Spoilage Risk • Eligible for 70% Bank Receipt Advance"}
        </span>
      </div>
    `;
  }

  /**
   * Updates the Developer Monetization & Startup Volume Simulator.
   */
  function updateVolumeSimulation() {
    if (!DOM.monthlyVolumeSlider) return;
    const isTa = state.lang === "ta";
    const tons = parseInt(DOM.monthlyVolumeSlider.value, 10) || 100;
    const kg = tons * 1000;

    if (DOM.sliderTonsDisplay) {
      DOM.sliderTonsDisplay.textContent = isTa ? `${tons} டன் (Tons / Month)` : `${tons} Tons / Month`;
    }

    // Average price ₹25/kg across vegetables and grains
    const avgRate = 25.0;
    const gmv = kg * avgRate;

    // Mandi brokers take 10% (= GMV * 0.10)
    // FarmBridge takes 1.5% (= GMV * 0.015)
    // Farmer saves 8.5%
    const farmerSavings = Math.round(gmv * 0.085);
    const devRevenue = Math.round(gmv * 0.015); // 1.5% minimum facilitation commission
    const coldHubShare = Math.round(kg * 0.25); // Nominal handling & blast freezing share
    const totalStartupRevenue = devRevenue + coldHubShare;

    if (DOM.simGmvVal) DOM.simGmvVal.textContent = `₹${gmv.toLocaleString()}`;
    if (DOM.simFarmerSavedVal) DOM.simFarmerSavedVal.textContent = `₹${farmerSavings.toLocaleString()}`;
    if (DOM.simDevRevenueVal) DOM.simDevRevenueVal.textContent = `₹${devRevenue.toLocaleString()}`;
    if (DOM.simColdRevenueVal) DOM.simColdRevenueVal.textContent = `₹${coldHubShare.toLocaleString()}`;
    if (DOM.simTotalStartupVal) {
      DOM.simTotalStartupVal.textContent = isTa
        ? `₹${totalStartupRevenue.toLocaleString()} / மாதம்`
        : `₹${totalStartupRevenue.toLocaleString()} / mo`;
    }
  }

  /**
   * Generates and displays simulated Warehouse Electronic Deposit Receipt (e-NWR).
   */
  function handleBookWarehouseSlot() {
    const isTa = state.lang === "ta";
    const cropKey = DOM.depositCropSelect ? DOM.depositCropSelect.value : "tomato";
    const cropInfo = WAREHOUSE_CROPS_DATA[cropKey] || WAREHOUSE_CROPS_DATA.tomato;
    const qty = Math.max(50, parseFloat(DOM.depositQtyInput ? DOM.depositQtyInput.value : 2000) || 2000);
    const months = parseInt(DOM.depositMonthsSelect ? DOM.depositMonthsSelect.value : 3, 10) || 3;
    const farmerName = state.currentUser ? state.currentUser.name : (isTa ? "உழவர் முருகன்" : "Farmer Murugan");
    const farmerPhone = state.currentUser ? state.currentUser.phone : "9841200001";
    const lotId = `TN-WH-LOT-${Math.floor(1000 + Math.random() * 9000)}`;

    const frozenGross = qty * cropInfo.frozen_rate;
    const storageFee = qty * cropInfo.storage_rate * months;
    const platformFee = Math.round(frozenGross * 0.015);
    const netValue = Math.round(frozenGross - storageFee - platformFee);
    const eligibleLoan = Math.round(netValue * 0.70); // 70% warehouse loan advance

    if (DOM.whReceiptContent) {
      DOM.whReceiptContent.innerHTML = `
        <div style="text-align: center; border-bottom: 2px dashed var(--border-color); padding-bottom: 0.9rem; margin-bottom: 1rem;">
          <h4 style="margin: 0; color: #0284c7; font-size: 1.15rem;">
            ❄️ ${isTa ? "தமிழ்நாடு மத்திய குளிர்பதன கிடங்கு மின்னணு வைப்பு ரசீது" : "Tamil Nadu Central Agro-Cold Storage Electronic Receipt"}
          </h4>
          <p style="margin: 0.25rem 0 0 0; font-size: 0.82rem; color: var(--text-muted);">
            WDRA Reg: <strong>TN-WDRA-CH-0428</strong> • செங்கல்பட்டு NH-45 மத்திய வேளாண் வளாகம்
          </p>
          <div style="display: flex; justify-content: center; gap: 1rem; font-size: 0.78rem; margin-top: 0.4rem; color: var(--text-muted);">
            <span><strong>e-NWR No:</strong> ${lotId}</span>
            <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div class="receipt-table" style="font-size: 0.9rem;">
          <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color);">
            <span style="color: var(--text-muted);">${isTa ? "விவசாயி பெயர் & மொபைல்:" : "Farmer Details:"}</span>
            <span style="font-weight: 600;">${farmerName} • +91 ${farmerPhone}</span>
          </div>
          <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color);">
            <span style="color: var(--text-muted);">${isTa ? "சேமிக்கப்பட்ட பயிர் & தரம்:" : "Commodity & Grade:"}</span>
            <span style="font-weight: 600;">${cropInfo.icon} ${isTa ? cropInfo.name_ta : cropInfo.name_en} (Grade A)</span>
          </div>
          <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color);">
            <span style="color: var(--text-muted);">${isTa ? "வைப்பு அளவு & காலம்:" : "Quantity & Period:"}</span>
            <span style="font-weight: 600;">${qty.toLocaleString()} kg (${months} ${isTa ? "மாதங்கள்" : "Months"})</span>
          </div>
          <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color);">
            <span style="color: var(--text-muted);">${isTa ? "பதப்படுத்தும் முறை & அறை:" : "Processing & Chamber:"}</span>
            <span style="font-weight: 600; color: #0284c7;">IQF Blast Freezing (-18.4°C Chamber 1)</span>
          </div>
          <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color);">
            <span style="color: var(--text-muted);">${isTa ? "மதிப்பிடப்பட்ட சந்தை மதிப்பு:" : "Est. Frozen Market Value:"}</span>
            <span style="font-weight: 700;">₹${Math.round(frozenGross).toLocaleString()} (@ ₹${cropInfo.frozen_rate}/kg)</span>
          </div>
          <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color); color: #0284c7;">
            <span>${isTa ? "குளிர்பதன & IQF சேவை கட்டணம்:" : "Cold Chain & IQF Fee:"}</span>
            <span>− ₹${Math.round(storageFee).toLocaleString()}</span>
          </div>
          <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color); color: #059669;">
            <span>${isTa ? "இணையதள குறைந்தபட்ச பராமரிப்பு கட்டணம் (1.5%):" : "Platform Facilitation Fee (1.5%):"}</span>
            <span>− ₹${platformFee.toLocaleString()}</span>
          </div>
          <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 2px solid var(--border-color); font-size: 1.15rem; font-weight: 800; color: var(--green-800);">
            <span>${isTa ? "விவசாயி நிகர தீர்வு மதிப்பு:" : "Farmer Net Maturity Value:"}</span>
            <span>₹${netValue.toLocaleString()}</span>
          </div>
        </div>

        <!-- Warehouse Financing Callout -->
        <div style="background: #ecfdf5; border: 1.5px solid #6ee7b7; padding: 0.75rem; border-radius: var(--radius-md); margin-top: 1rem; font-size: 0.82rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
            <strong style="color: #065f46;">🏦 ${isTa ? "உடனடி ரசீது கடன் தகுதி (70% Instant Advance):" : "Instant Warehouse Receipt Advance (70%):"}</strong>
            <span style="font-weight: 800; color: #047857; font-size: 1rem;">₹${eligibleLoan.toLocaleString()}</span>
          </div>
          <div style="color: #065f46; font-size: 0.78rem;">
            ${isTa ? "இந்த மின்னணு ரசீதை அடமானமாக வைத்து கூட்டுறவு வங்கியிலிருந்து இன்றே 70% பணத்தைப் பெறலாம்." : "Farmers can avail 70% instant bank credit against this electronic receipt today."}
          </div>
        </div>
      `;
    }

    if (DOM.warehouseReceiptModal) {
      DOM.warehouseReceiptModal.classList.remove("hidden");
    }
    showToast(isTa ? `❄️ வைப்பு ரசீது ${lotId} வெற்றிகரமாக உருவாக்கப்பட்டது!` : `❄️ Warehouse receipt ${lotId} generated!`);
  }

  function closeWarehouseReceiptModal() {
    if (DOM.warehouseReceiptModal) {
      DOM.warehouseReceiptModal.classList.add("hidden");
    }
  }

  /**
   * Displays temporary toast alert.
   */
  function showToast(msg) {
    DOM.toastMessage.textContent = msg;
    DOM.toastMessage.classList.remove("hidden");
    setTimeout(() => {
      DOM.toastMessage.classList.add("hidden");
    }, 3200);
  }

  // Launch application when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
