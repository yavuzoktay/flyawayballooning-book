import React, {
  useState,
  useEffect,
  useMemo,
  memo,
  useRef,
  useCallback,
} from "react";
import Accordion from "../Common/Accordion";
import axios from "axios";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupsIcon from "@mui/icons-material/Groups";
import weekdayMorningImg from "../../../assets/images/category1.jpeg";
import flexibleWeekdayImg from "../../../assets/images/category2.jpeg";
import anyDayFlightImg from "../../../assets/images/category3.jpg";
import config from "../../../config";
import { BsInfoCircle } from "react-icons/bs";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { useLocation } from "react-router-dom";
import { trackProductSelected } from "../../../utils/googleAdsTracking";

// Add CSS animations for slide effects
const slideAnimations = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideInLeft {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
`;

// Inject the CSS animations
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = slideAnimations;
  document.head.appendChild(style);
}

// Custom scrollbar styles
const scrollbarStyles = `
    .voucher-type-scroll-outer {
        overflow-x: auto;
        width: 100%;
        max-width: 100%;
        scrollbar-width: thin;
        scrollbar-color: #666 #f1f1f1;
        -webkit-overflow-scrolling: touch;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar {
        height: 12px;
        width: 12px;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 6px;
        margin: 0 2px;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-thumb {
        background: #666;
        border-radius: 6px;
        border: 2px solid #f1f1f1;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-thumb:hover {
        background: #444;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-corner {
        background: #f1f1f1;
    }
    
    /* Mobile-specific scrollbar styles */
    @media (max-width: 768px) {
        .voucher-type-scroll-outer::-webkit-scrollbar {
            height: 6px;
        }
        .voucher-type-scroll-outer::-webkit-scrollbar-track {
            background: #e0e0e0;
            margin: 0 1px;
        }
        .voucher-type-scroll-outer::-webkit-scrollbar-thumb {
            background: #999;
            border: 1px solid #e0e0e0;
        }
        
        .voucher-type-scroll-outer {
            padding: 0 4px !important;
            margin: 0 -4px !important;
        }
        
        .voucher-type-scroll-outer > div {
            gap: 8px !important;
            padding: 0 4px !important;
        }
    }
    
    @media (max-width: 480px) {
        .voucher-type-scroll-outer::-webkit-scrollbar {
            height: 4px;
        }
        
        .voucher-type-scroll-outer {
            padding: 0 2px !important;
            margin: 0 -2px !important;
        }
        
        .voucher-type-scroll-outer > div {
            gap: 6px !important;
            padding: 0 2px !important;
        }
    }

    /* Voucher cards (Passengers row): mobile-only gap — aligns with isMobile (window.innerWidth <= 576) */
    @media (max-width: 576px) {
        .voucher-type-passenger-row {
            gap: 8px !important;
        }
        .voucher-type-passenger-stepper {
            gap: 8px !important;
        }
    }
`;

const SHARED_VOUCHER_PRICE_FIELDS = {
  "weekday morning": {
    original: "weekday_morning_price",
    sale: "weekday_morning_sale_price",
  },
  "flexible weekday": {
    original: "flexible_weekday_price",
    sale: "flexible_weekday_sale_price",
  },
  "any day flight": {
    original: "any_day_flight_price",
    sale: "any_day_flight_sale_price",
  },
};

const normalizeVoucherPriceTitle = (title) =>
  (title || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
const normalizeVoucherPriceTitleLoose = (title) =>
  normalizeVoucherPriceTitle(title).replace(/[^a-z0-9]/g, "");

const parsePriceNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = parseFloat(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const parseSalePriceNumber = (value) => {
  const parsed = parsePriceNumber(value);
  if (parsed === null || parsed <= 0) return null;
  return parsed;
};

const formatVoucherAmount = (value) => {
  const parsed = parsePriceNumber(value);
  if (parsed === null) return "0";
  if (Number.isInteger(parsed)) return parsed.toString();
  return parsed.toFixed(2).replace(/\.?0+$/, "");
};

const formatVoucherTotal = (value) => {
  const parsed = parsePriceNumber(value) || 0;
  return parsed.toFixed(2);
};

const resolveVoucherPricing = ({ originalPrice, salePrice, fallbackPrice }) => {
  const resolvedOriginal = parsePriceNumber(
    originalPrice !== undefined &&
      originalPrice !== null &&
      originalPrice !== ""
      ? originalPrice
      : fallbackPrice,
  );
  const resolvedSale = parseSalePriceNumber(salePrice);
  const currentPrice = resolvedSale !== null ? resolvedSale : resolvedOriginal;

  return {
    originalPrice: resolvedOriginal,
    salePrice: resolvedSale,
    currentPrice,
    hasSalePrice: resolvedSale !== null,
  };
};

const hasMeaningfulSalePrice = (originalPrice, currentPrice) => {
  const original = parsePriceNumber(originalPrice);
  const current = parsePriceNumber(currentPrice);

  if (original === null || current === null) return false;
  return current < original;
};

const getSharedActivityPriceFieldNames = (title) => {
  return SHARED_VOUCHER_PRICE_FIELDS[normalizeVoucherPriceTitle(title)] || null;
};

const getSharedActivityOriginalPrice = (pricingSource, title) => {
  const fieldNames = getSharedActivityPriceFieldNames(title);
  if (!fieldNames || !pricingSource) return null;
  return parsePriceNumber(pricingSource[fieldNames.original]);
};

const getSharedActivitySalePrice = (pricingSource, title) => {
  const fieldNames = getSharedActivityPriceFieldNames(title);
  if (!fieldNames || !pricingSource) return null;
  return parsePriceNumber(pricingSource[fieldNames.sale]);
};

const resolvePrivateCharterTierPassengerKey = (passengers) => {
  const pax = Number(passengers);
  if (!Number.isFinite(pax) || pax <= 0) return "2";
  if ([2, 3, 4].includes(pax)) return String(pax);
  if (pax >= 5) return "8";
  return "2";
};

const getTieredGroupPrice = (
  pricingDataRaw,
  voucherTitleRaw,
  passengers,
  voucherIdRaw = null,
) => {
  if (pricingDataRaw == null) return null;

  let pricingData = pricingDataRaw;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (typeof pricingData !== "string") break;
    try {
      pricingData = JSON.parse(pricingData);
    } catch (error) {
      return null;
    }
  }

  if (
    pricingData == null ||
    typeof pricingData !== "object" ||
    Array.isArray(pricingData)
  )
    return null;

  const titleNorm = normalizeVoucherPriceTitle(voucherTitleRaw);
  const titleLooseNorm = normalizeVoucherPriceTitleLoose(voucherTitleRaw);
  const resolveForTitle = (obj, title) => {
    if (!obj || typeof obj !== "object") return undefined;
    if (obj[title] != null) return obj[title];
    if (obj[title?.trim?.()] != null) return obj[title.trim()];
    for (const key of Object.keys(obj)) {
      if (
        normalizeVoucherPriceTitle(key) === titleNorm ||
        normalizeVoucherPriceTitleLoose(key) === titleLooseNorm
      ) {
        return obj[key];
      }
    }
    return undefined;
  };

  let byTitle = resolveForTitle(pricingData, voucherTitleRaw);

  // Legacy compatibility: some rows were saved with voucher id keys.
  if (
    byTitle == null &&
    voucherIdRaw !== null &&
    voucherIdRaw !== undefined &&
    voucherIdRaw !== ""
  ) {
    const voucherId = String(voucherIdRaw).trim();
    byTitle = pricingData[voucherId] ?? pricingData[Number(voucherId)];
  }

  if (byTitle == null) return null;

  if (typeof byTitle === "object" && !Array.isArray(byTitle)) {
    const key = resolvePrivateCharterTierPassengerKey(passengers);
    const value = byTitle[key] ?? byTitle["2"];
    return parsePriceNumber(value);
  }

  return parsePriceNumber(byTitle);
};

const VoucherType = ({
  activeAccordion,
  setActiveAccordion = () => {},
  selectedVoucherType,
  setSelectedVoucherType,
  activitySelect,
  chooseFlightType,
  chooseLocation,
  selectedActivity,
  availableCapacity,
  selectedDate,
  selectedTime,
  onSectionCompletion,
  isDisabled = false,
  passengerData,
  setPassengerData,
  privateCharterWeatherRefund,
  setPrivateCharterWeatherRefund,
  onTermsLoadingChange,
  onAccordionLoadingChange,
  seasonSaver,
  setSeasonSaver,
  hiddenVoucherTitles = [],
  forceWeatherRefundable = false,
  privateCharterPassengerOptions = null,
  compactVoucherCardMode = false,
  autoAdvanceToSectionId = null,
  disableTermsPopup = false,
}) => {
  const API_BASE_URL = config.API_BASE_URL;
  const [quantities, setQuantities] = useState({});
  const location = useLocation();

  // (moved below state declarations to avoid TDZ)
  const [showTerms, setShowTerms] = useState(false);
  const hasOpenedTermsFromDeepLink = useRef(false); // avoid reopening T&C repeatedly from deep link
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [availableVoucherTypes, setAvailableVoucherTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationPricing, setLocationPricing] = useState({});
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [showTwoVouchers, setShowTwoVouchers] = useState(true);
  const [slideDirection, setSlideDirection] = useState("right");
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [allVoucherTypesState, setAllVoucherTypesState] = useState([]);
  const [allVoucherTypesLoading, setAllVoucherTypesLoading] = useState(true);
  const [privateCharterVoucherTypes, setPrivateCharterVoucherTypes] = useState(
    [],
  );
  const [
    privateCharterVoucherTypesLoading,
    setPrivateCharterVoucherTypesLoading,
  ] = useState(true);
  const [termsContent, setTermsContent] = useState("");
  const [termsLoading, setTermsLoading] = useState(false);
  const autoOpenedTermsRef = useRef(false); // track auto-open from deep link
  const userDismissedTermsRef = useRef(false); // avoid reopening after user closes

  // Reset deep-link guards when URL query changes (e.g., user revisits the same deep link)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isShopifySource = params.get("source") === "shopify";
    const startAtVoucher =
      params.get("startAt") === "voucher-type" || !!params.get("voucherTitle");
    if (isShopifySource && startAtVoucher) {
      hasOpenedTermsFromDeepLink.current = false;
      autoOpenedTermsRef.current = false;
      userDismissedTermsRef.current = false;
    }
  }, [location.search]);
  const [activityData, setActivityData] = useState(null);
  const [activityDataLoading, setActivityDataLoading] = useState(false);
  const [showCapacityWarning, setShowCapacityWarning] = useState(false);
  // Local UI state for instant weather refundable toggle feedback
  const [localSharedWeatherRefund, setLocalSharedWeatherRefund] =
    useState(false);
  // For Private Charter: per-voucher toggle state (title -> boolean)
  const [privateWeatherRefundByVoucher, setPrivateWeatherRefundByVoucher] =
    useState({});
  const hiddenVoucherTitleSet = useMemo(
    () =>
      new Set(
        (hiddenVoucherTitles || []).map((title) =>
          normalizeVoucherPriceTitle(title),
        ),
      ),
    [hiddenVoucherTitles],
  );
  const resolvedCompactVoucherCardMode =
    compactVoucherCardMode || (disableTermsPopup && forceWeatherRefundable);
  const resolvedAutoAdvanceToSectionId =
    autoAdvanceToSectionId || (disableTermsPopup ? "live-availability" : null);

  const isVoucherTitleHidden = (title) =>
    hiddenVoucherTitleSet.has(normalizeVoucherPriceTitle(title));
  const normalizedPrivateCharterPassengerOptions = useMemo(() => {
    if (
      !Array.isArray(privateCharterPassengerOptions) ||
      privateCharterPassengerOptions.length === 0
    ) {
      return [2, 3, 4, 8];
    }

    const uniqueSorted = Array.from(
      new Set(
        privateCharterPassengerOptions
          .map((value) => parseInt(value, 10))
          .filter((value) => Number.isFinite(value) && value > 0),
      ),
    ).sort((a, b) => a - b);

    return uniqueSorted.length > 0 ? uniqueSorted : [2, 3, 4, 8];
  }, [privateCharterPassengerOptions]);

  const getAllowedPassengerOptions = useCallback(
    (voucherTitle = "") => {
      if (chooseFlightType?.type !== "Private Charter") {
        return [1, 2, 3, 4, 5, 6, 7, 8];
      }

      const isProposal =
        typeof voucherTitle === "string" &&
        voucherTitle.toLowerCase().includes("proposal");
      if (isProposal) {
        return [2];
      }

      return normalizedPrivateCharterPassengerOptions;
    },
    [chooseFlightType?.type, normalizedPrivateCharterPassengerOptions],
  );

  const scrollToSectionById = useCallback((sectionId) => {
    if (typeof window === "undefined" || !sectionId) return;
    const element = document.getElementById(sectionId);
    if (!element) return;
    const offset = window.innerWidth <= 768 ? 80 : 10;
    const top =
      element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  // Sync local shared toggle from passengerData
  useEffect(() => {
    const enabled =
      Array.isArray(passengerData) &&
      passengerData.some((p) => p && p.weatherRefund);
    setLocalSharedWeatherRefund(!!enabled);
  }, [passengerData]);

  useEffect(() => {
    if (!forceWeatherRefundable) return;

    const currentTitle =
      selectedVoucherType?.title || selectedVoucher?.title || "";
    const hasMissingWeatherRefund =
      Array.isArray(passengerData) &&
      passengerData.some((passenger) => !passenger?.weatherRefund);

    if (
      chooseFlightType?.type === "Shared Flight" &&
      normalizeVoucherPriceTitle(currentTitle).includes("any day")
    ) {
      if (!localSharedWeatherRefund) {
        setLocalSharedWeatherRefund(true);
      }

      if (hasMissingWeatherRefund && setPassengerData) {
        setPassengerData(
          passengerData.map((passenger) => ({
            ...passenger,
            weatherRefund: true,
          })),
        );
      }
    }

    if (chooseFlightType?.type === "Private Charter" && currentTitle) {
      if (!privateWeatherRefundByVoucher[currentTitle]) {
        setPrivateWeatherRefundByVoucher((prev) => ({
          ...prev,
          [currentTitle]: true,
        }));
      }

      if (setPrivateCharterWeatherRefund && !privateCharterWeatherRefund) {
        setPrivateCharterWeatherRefund(true);
      }

      if (hasMissingWeatherRefund && setPassengerData) {
        setPassengerData(
          passengerData.map((passenger) => ({
            ...passenger,
            weatherRefund: true,
          })),
        );
      }
    }
  }, [
    chooseFlightType?.type,
    forceWeatherRefundable,
    localSharedWeatherRefund,
    passengerData,
    privateCharterWeatherRefund,
    privateWeatherRefundByVoucher,
    selectedVoucher,
    selectedVoucherType,
    setPassengerData,
    setPrivateCharterWeatherRefund,
  ]);

  // Keep global privateCharterWeatherRefund in sync with the currently selected voucher's toggle
  useEffect(() => {
    try {
      const currentTitle = selectedVoucherType?.title || selectedVoucher?.title;
      if (!currentTitle) return;
      const currentLocal =
        forceWeatherRefundable || !!privateWeatherRefundByVoucher[currentTitle];
      if (setPrivateCharterWeatherRefund) {
        setPrivateCharterWeatherRefund(currentLocal);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    forceWeatherRefundable,
    selectedVoucherType,
    selectedVoucher,
    privateWeatherRefundByVoucher,
  ]);

  // Re-build selected voucher pricing when Season Saver toggle changes
  useEffect(() => {
    if (!selectedVoucher || selectedVoucher.title !== "Flexible Weekday")
      return;
    const rebuilt = buildVoucherWithQuantity(selectedVoucher);
    setSelectedVoucher(rebuilt);
    setSelectedVoucherType(rebuilt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonSaver]);

  // Prefill passenger count and weather refundable from URL parameters (Shopify deep-link)
  // Wait for voucher types to be loaded before setting passenger count
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get("source") !== "shopify") return;

      const qpPassengers = parseInt(params.get("passengers") || "0", 10);
      const qpVoucherTitle = params.get("voucherTitle");
      const qpWeatherRefundable = params.get("weatherRefundable") === "true";

      // Wait for voucher types to be available
      const allTitles = [
        ...(Array.isArray(allVoucherTypesState)
          ? allVoucherTypesState.map((v) => v.title)
          : []),
        ...(Array.isArray(privateCharterVoucherTypes)
          ? privateCharterVoucherTypes.map((v) => v.title)
          : []),
      ];

      if (qpVoucherTitle && allTitles.length > 0) {
        // Decode URL-encoded title (e.g., "Flexible+Weekday" -> "Flexible Weekday")
        const decodedTitle = decodeURIComponent(
          qpVoucherTitle.replace(/\+/g, " "),
        );

        // Find matching title (case-insensitive, normalized)
        const normalize = (s) =>
          (s || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
        const targetTitle = allTitles.find(
          (t) =>
            normalize(t) === normalize(decodedTitle) ||
            normalize(t) === normalize(qpVoucherTitle),
        );

        if (targetTitle) {
          // Set passenger count if provided
          if (qpPassengers > 0) {
            setQuantities((prev) => {
              // Only update if not already set or if URL value is different
              if (prev[targetTitle] === qpPassengers) return prev;
              return {
                ...prev,
                [targetTitle]: qpPassengers,
                [decodedTitle]: qpPassengers, // Also set with decoded title
                [qpVoucherTitle]: qpPassengers, // Also set with original title in case of encoding mismatch
              };
            });
          }

          // Set weather refundable toggle if provided
          if (qpWeatherRefundable) {
            // Check if this is a Shared Flight (Any Day Flight) or Private Charter
            const isAnyDay = normalize(targetTitle).includes("any day");
            const isPrivateCharter =
              chooseFlightType?.type === "Private Charter";

            if (isAnyDay && chooseFlightType?.type === "Shared Flight") {
              // For Shared Flight Any Day, set localSharedWeatherRefund
              setLocalSharedWeatherRefund(true);
              // Also update passengerData to reflect weather refund
              if (Array.isArray(passengerData) && setPassengerData) {
                const updated = passengerData.map((p) => ({
                  ...p,
                  weatherRefund: true,
                }));
                setPassengerData(updated);
              }
            } else if (isPrivateCharter) {
              // For Private Charter, set per-voucher weather refund
              setPrivateWeatherRefundByVoucher((prev) => ({
                ...prev,
                [targetTitle]: true,
              }));
              if (Array.isArray(passengerData) && setPassengerData) {
                const updated = passengerData.map((p) => ({
                  ...p,
                  weatherRefund: true,
                }));
                setPassengerData(updated);
              }
              // If this voucher is selected, also update global state
              if (
                selectedVoucherType?.title === targetTitle &&
                setPrivateCharterWeatherRefund
              ) {
                setPrivateCharterWeatherRefund(true);
              }
            }
          }

          // Set Season Saver toggle if provided
          const qpSeasonSaver = params.get("seasonSaver") === "true";
          if (
            qpSeasonSaver &&
            normalize(targetTitle) === "flexible weekday" &&
            setSeasonSaver
          ) {
            setSeasonSaver(true);
          }
        } else {
        }
      }
    } catch (e) {
      console.error(
        "VoucherType: Error reading URL parameters for passenger count and weather refundable",
        e,
      );
    }
  }, [
    location.search,
    allVoucherTypesState,
    privateCharterVoucherTypes,
    chooseFlightType?.type,
    passengerData,
    setPassengerData,
    selectedVoucherType?.title,
    setPrivateCharterWeatherRefund,
  ]);

  // Ensure default quantity=2 for every voucher title once data is available
  useEffect(() => {
    const titles = [];
    try {
      // Use raw lists available at this point to avoid TDZ on voucherTypes
      if (Array.isArray(allVoucherTypesState)) {
        titles.push(...allVoucherTypesState.map((v) => v.title));
      }
      if (Array.isArray(privateCharterVoucherTypes)) {
        titles.push(...privateCharterVoucherTypes.map((v) => v.title));
      }
    } catch {}
    if (titles.length === 0) return;
    setQuantities((prev) => {
      const next = { ...prev };
      let changed = false;
      titles.forEach((t) => {
        if (next[t] == null || Number.isNaN(parseInt(next[t], 10))) {
          next[t] = 2; // default passengers
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [allVoucherTypesState, privateCharterVoucherTypes]);

  // Notification state for voucher type selection
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // Mobile breakpoint
  const [isMobile, setIsMobile] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollVouchersLeft, setCanScrollVouchersLeft] = useState(false);
  const [canScrollVouchersRight, setCanScrollVouchersRight] = useState(true);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const voucherContainerRef = useRef(null);
  const voucherHydrationStateRef = useRef({
    allVoucherTypesCount: 0,
    allVoucherTypesLoading: true,
    privateCharterVoucherTypesCount: 0,
    privateCharterVoucherTypesLoading: true,
    hasActivityData: false,
    activityDataLoading: false,
    chooseLocation: null,
  });
  const activePrivateCharterVoucherCount = useMemo(
    () => privateCharterVoucherTypes.filter((vt) => vt.is_active === 1).length,
    [privateCharterVoucherTypes],
  );

  // Helper: compute one slide width (+ gap) reliably on mobile
  const getMobileItemWidth = (container) => {
    if (!container) return 0;
    const firstChild = container.children && container.children[0];
    const rectWidth = firstChild
      ? firstChild.getBoundingClientRect().width
      : container.clientWidth;
    const style = window.getComputedStyle(container);
    const gap = parseFloat(style.columnGap || style.gap || "0") || 0;
    return rectWidth + gap;
  };

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 576);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Sync arrows/dots while swiping vouchers on mobile without a polling loop.
  useEffect(() => {
    if (!isMobile || activeAccordion !== "voucher-type") return;

    const sync = () => {
      const container =
        voucherContainerRef.current ||
        document.querySelector(".voucher-cards-container");
      if (!container || container.children.length === 0) return;
      const children = Array.from(container.children);
      const itemCount = children.length;
      if (itemCount === 0) return;
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < children.length; i++) {
        const cr = children[i].getBoundingClientRect();
        const dist = Math.abs(cr.left + cr.width / 2 - centerX);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      const clamped = Math.max(0, Math.min(best, itemCount - 1));
      setCurrentItemIndex(clamped);
      setCanScrollVouchersLeft(clamped > 0);
      setCanScrollVouchersRight(clamped < itemCount - 1);
    };

    let frameId = null;
    const requestSync = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      frameId = requestAnimationFrame(sync);
    };

    requestSync();
    const container =
      voucherContainerRef.current ||
      document.querySelector(".voucher-cards-container");
    if (container) {
      container.addEventListener("scroll", requestSync, { passive: true });
      container.addEventListener("touchmove", requestSync, { passive: true });
      container.addEventListener("touchend", requestSync, { passive: true });
      window.addEventListener("resize", requestSync);
      return () => {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
        }
        container.removeEventListener("scroll", requestSync);
        container.removeEventListener("touchmove", requestSync);
        container.removeEventListener("touchend", requestSync);
        window.removeEventListener("resize", requestSync);
      };
    }
    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [
    isMobile,
    activeAccordion,
    allVoucherTypesState.length,
    privateCharterVoucherTypes.length,
    chooseFlightType?.type,
  ]);

  // Reset animation flag after animation completes
  useEffect(() => {
    if (shouldAnimate) {
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate]);

  // Keep layout sensible per device and experience type
  useEffect(() => {
    if (isMobile) {
      setShowTwoVouchers(false);
    } else {
      // For Private Charter, always show two vouchers if available
      if (chooseFlightType?.type === "Private Charter") {
        // Check if we have active private charter voucher types available
        if (activePrivateCharterVoucherCount >= 2) {
          // Always start with two vouchers view for Private Charter
          setShowTwoVouchers(true);
          setCurrentViewIndex(0);

          // If there are more than 2 voucher types, we'll show navigation arrows and dots
          if (activePrivateCharterVoucherCount > 2) {
          }
        } else if (activePrivateCharterVoucherCount === 1) {
          setShowTwoVouchers(false);
          setCurrentViewIndex(0);
        } else {
          setShowTwoVouchers(false);
          setCurrentViewIndex(0);
        }
      } else {
        // For Shared Flight, default to two vouchers
        setShowTwoVouchers(true);
        setCurrentViewIndex(0);
      }
    }
  }, [
    isMobile,
    chooseFlightType?.type,
    activePrivateCharterVoucherCount,
    availableVoucherTypes.length,
  ]);

  // Fetch all voucher types from API
  const fetchAllVoucherTypes = async () => {
    try {
      setAllVoucherTypesLoading(true);

      // Include location parameter if available to get location-specific pricing
      const locationParam = chooseLocation
        ? `?location=${encodeURIComponent(chooseLocation)}`
        : "";
      const url = `${API_BASE_URL}/api/voucher-types${locationParam}`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          // Log the raw features data for debugging

          setAllVoucherTypesState(data.data);

          // Initialize quantities and pricing from API data
          const newQuantities = {};
          const newPricing = {};

          data.data.forEach((vt) => {
            newQuantities[vt.title] = 2;
            // Use the updated price_per_person from the API
            newPricing[vt.title.toLowerCase().replace(/\s+/g, "_") + "_price"] =
              parseFloat(vt.price_per_person);

            // Log the pricing information for debugging
          });

          setQuantities(newQuantities);
          setLocationPricing(newPricing);
        } else {
          console.error(
            "Regular voucher types API returned success: false:",
            data,
          );
        }
      } else {
        console.error(
          "Failed to fetch regular voucher types. Status:",
          response.status,
        );
      }
    } catch (error) {
      console.error("Error fetching regular voucher types:", error);
    } finally {
      setAllVoucherTypesLoading(false);
    }
  };

  useEffect(() => {
    fetchAllVoucherTypes();
  }, [API_BASE_URL, chooseLocation]); // Auto-refresh when location changes

  useEffect(() => {
    voucherHydrationStateRef.current = {
      allVoucherTypesCount: allVoucherTypesState.length,
      allVoucherTypesLoading,
      privateCharterVoucherTypesCount: privateCharterVoucherTypes.length,
      privateCharterVoucherTypesLoading,
      hasActivityData: Boolean(activityData),
      activityDataLoading,
      chooseLocation,
    };
  }, [
    activityData,
    activityDataLoading,
    allVoucherTypesLoading,
    allVoucherTypesState.length,
    chooseLocation,
    privateCharterVoucherTypes.length,
    privateCharterVoucherTypesLoading,
  ]);

  // Hydrate missing data when the accordion becomes active without forcing a reset.
  useEffect(() => {
    if (activeAccordion !== "voucher-type") return;

    const {
      allVoucherTypesCount,
      allVoucherTypesLoading: sharedLoading,
      privateCharterVoucherTypesCount,
      privateCharterVoucherTypesLoading: privateLoading,
      hasActivityData,
      activityDataLoading: activityLoading,
      chooseLocation: selectedLocation,
    } = voucherHydrationStateRef.current;

    if (allVoucherTypesCount === 0 && !sharedLoading) {
      fetchAllVoucherTypes();
    }

    if (privateCharterVoucherTypesCount === 0 && !privateLoading) {
      fetchPrivateCharterVoucherTypes();
    }

    if (selectedLocation && !hasActivityData && !activityLoading) {
      fetchActivityData();
    }
  }, [activeAccordion]);

  // Force refresh all data (can be called manually if needed)
  const forceRefreshAllData = () => {
    fetchAllVoucherTypes();
    fetchPrivateCharterVoucherTypes();
    if (chooseLocation) {
      fetchActivityData();
    }
  };

  // Add keyboard shortcut for manual refresh (Ctrl+R or Cmd+R)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "r") {
        event.preventDefault();

        forceRefreshAllData();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch private charter voucher types from API
  const fetchPrivateCharterVoucherTypes = async () => {
    try {
      setPrivateCharterVoucherTypesLoading(true);

      // Get only active private charter voucher types for frontend display
      // Include location to get activity-specific pricing
      const locationParam = chooseLocation
        ? `&location=${encodeURIComponent(chooseLocation)}`
        : "";
      // Include passengers to receive tiered pricing from backend.
      // Shopify deep-link passes ?source=shopify&passengers=<2|3|4|8>, so use it instead of a hardcoded default.
      const params = new URLSearchParams(location.search);
      const isShopifySource = params.get("source") === "shopify";
      const qpPassengers = parseInt(params.get("passengers") || "0", 10);
      const selectedPassengers =
        isShopifySource && Number.isFinite(qpPassengers) && qpPassengers > 0
          ? qpPassengers
          : 2;
      const response = await fetch(
        `${API_BASE_URL}/api/private-charter-voucher-types?active=true${locationParam}&passengers=${selectedPassengers}`,
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          setPrivateCharterVoucherTypes(data.data);

          // Initialize quantities for private charter voucher types
          const newQuantities = { ...quantities };
          data.data.forEach((vt) => {
            newQuantities[vt.title] = selectedPassengers;
          });
          setQuantities(newQuantities);
        } else {
          console.error(
            "Private charter voucher types API returned success: false:",
            data,
          );
        }
      } else {
        console.error(
          "Failed to fetch private charter voucher types. Status:",
          response.status,
        );
      }
    } catch (error) {
      console.error("Error fetching private charter voucher types:", error);
    } finally {
      setPrivateCharterVoucherTypesLoading(false);
    }
  };

  useEffect(() => {
    fetchPrivateCharterVoucherTypes();
  }, [API_BASE_URL, chooseLocation, location.search]);

  // Notify parent component when accordion loading states change
  useEffect(() => {
    if (onAccordionLoadingChange) {
      const isAccordionLoading =
        allVoucherTypesLoading ||
        privateCharterVoucherTypesLoading ||
        activityDataLoading;
      onAccordionLoadingChange({
        allVoucherTypesLoading,
        privateCharterVoucherTypesLoading,
        activityDataLoading,
        isAccordionLoading,
      });
    }
  }, [
    allVoucherTypesLoading,
    privateCharterVoucherTypesLoading,
    activityDataLoading,
    onAccordionLoadingChange,
  ]);

  // Fetch available voucher types for the selected location
  useEffect(() => {
    const fetchVoucherTypes = async () => {
      if (!chooseLocation) {
        setAvailableVoucherTypes([]);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/locationVoucherTypes/${encodeURIComponent(chooseLocation)}`,
        );
        if (response.data.success) {
          setAvailableVoucherTypes(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching voucher types:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVoucherTypes();
  }, [chooseLocation]);

  // Update locationPricing when selectedActivity changes
  useEffect(() => {
    if (selectedActivity && selectedActivity.length > 0) {
      const activity = selectedActivity[0];
      const newPricing = {
        weekday_morning_price:
          parseFloat(activity.weekday_morning_price) || 180,
        weekday_morning_sale_price: parseSalePriceNumber(
          activity.weekday_morning_sale_price,
        ),
        flexible_weekday_price:
          parseFloat(activity.flexible_weekday_price) || 200,
        flexible_weekday_sale_price: parseSalePriceNumber(
          activity.flexible_weekday_sale_price,
        ),
        any_day_flight_price: parseFloat(activity.any_day_flight_price) || 220,
        any_day_flight_sale_price: parseSalePriceNumber(
          activity.any_day_flight_sale_price,
        ),
      };

      setLocationPricing(newPricing);
    } else {
      // Fallback to default pricing
      const defaultPricing = {
        weekday_morning_price: 180,
        weekday_morning_sale_price: null,
        flexible_weekday_price: 200,
        flexible_weekday_sale_price: null,
        any_day_flight_price: 220,
        any_day_flight_sale_price: null,
      };

      setLocationPricing(defaultPricing);
    }
  }, [selectedActivity]);

  // Fetch activity data to get individual pricing for private charter voucher types
  const fetchActivityData = async () => {
    setActivityDataLoading(true);
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const url = chooseLocation
        ? `${API_BASE_URL}/api/activities/flight-types?location=${encodeURIComponent(chooseLocation)}&t=${timestamp}`
        : `${API_BASE_URL}/api/activities/flight-types?t=${timestamp}`;
      const response = await axios.get(url);
      if (response.data.success && response.data.data.length > 0) {
        // Prefer activity matching location; else first one that has private_charter_pricing; else first
        let activity = response.data.data[0];
        if (chooseLocation) {
          const matched = response.data.data.find(
            (a) =>
              (a.location || "").toLowerCase() ===
              (chooseLocation || "").toLowerCase(),
          );
          if (matched) activity = matched;
        } else {
          const withPricing = response.data.data.find(
            (a) => a && a.private_charter_pricing,
          );
          if (withPricing) activity = withPricing;
        }
        setActivityData(activity);
      } else {
      }
    } catch (error) {
      console.error("Error fetching activity data:", error);
    } finally {
      setActivityDataLoading(false);
    }
  };

  // Fetch activity data when location changes
  useEffect(() => {
    fetchActivityData();
  }, [chooseLocation]);

  // Ensure activity data is also available when switching flows (e.g., Flight Voucher / Buy Gift)
  useEffect(() => {
    if (chooseFlightType?.type === "Private Charter" && !activityData) {
      fetchActivityData();
    }
  }, [chooseFlightType?.type]);

  const voucherTypes = useMemo(() => {
    // Determine which voucher types to show based on selected experience
    const isPrivateCharter = chooseFlightType?.type === "Private Charter";

    if (isPrivateCharter) {
      // For Private Charter, show only active private charter voucher types
      if (
        privateCharterVoucherTypesLoading ||
        privateCharterVoucherTypes.length === 0
      ) {
        return [];
      }

      // Filter only active private charter voucher types
      const activePrivateCharterVoucherTypes =
        privateCharterVoucherTypes.filter(
          (vt) => vt.is_active === 1 && !isVoucherTitleHidden(vt.title),
        );

      if (activePrivateCharterVoucherTypes.length === 0) {
        return [];
      }

      const privateVouchers = activePrivateCharterVoucherTypes.map((vt) => {
        // Parse features from JSON string
        let features = [];
        try {
          // Clean up the JSON string first - fix common syntax errors
          let featuresJson = vt.features || "[]";

          // Fix common JSON syntax errors
          featuresJson = featuresJson
            .replace(/\."/g, '",') // Replace ." with ,"
            .replace(/,$/, "") // Remove trailing comma
            .replace(/,\s*]/g, "]"); // Remove comma before closing bracket

          features = JSON.parse(featuresJson);
        } catch (e) {
          console.warn(
            `VoucherType: ${vt.title} - Failed to parse features JSON:`,
            vt.features,
            "Error:",
            e,
          );
          console.warn(
            `VoucherType: ${vt.title} - Attempting to parse as array manually...`,
          );

          // Try to parse as a simple array by splitting on commas
          try {
            const cleanedFeatures = vt.features
              .replace(/[\[\]"]/g, "") // Remove brackets and quotes
              .split(",")
              .map((f) => f.trim())
              .filter((f) => f.length > 0);
            features = cleanedFeatures;
          } catch (manualError) {
            console.warn(
              `VoucherType: ${vt.title} - Manual parsing also failed:`,
              manualError,
            );
            features = [];
          }
        }

        // If no features are available, log a warning but don't use hardcoded fallback
        if (!features || features.length === 0) {
          console.warn(
            `VoucherType: ${vt.title} - No features available in database. Please check the Features (JSON Array) field in the admin panel.`,
          );
        }

        const activityOriginalPrice = getTieredGroupPrice(
          activityData?.private_charter_pricing,
          vt.title,
          2,
          vt.id,
        );
        const activitySalePrice = getTieredGroupPrice(
          activityData?.private_charter_sale_pricing,
          vt.title,
          2,
          vt.id,
        );
        const pricingState = resolveVoucherPricing({
          originalPrice: vt.original_price ?? activityOriginalPrice,
          salePrice: vt.sale_price ?? activitySalePrice,
          fallbackPrice: vt.price_per_person,
        });
        const basePrice = pricingState.currentPrice ?? 300;
        const originalBasePrice = pricingState.originalPrice ?? basePrice;
        const saleBasePrice = pricingState.salePrice;
        const priceUnit =
          vt.price_unit ||
          (activityOriginalPrice !== null || activitySalePrice !== null
            ? "total"
            : "pp");

        // For Private Charter with total pricing, card should show the total
        const totalPrice = basePrice;

        // Handle image URL properly - check if it's a full URL or relative path
        let imageUrl = weekdayMorningImg; // Default fallback
        if (vt.image_url) {
          if (vt.image_url.startsWith("http")) {
            imageUrl = vt.image_url;
          } else if (vt.image_url.startsWith("/uploads/")) {
            imageUrl = `${API_BASE_URL}${vt.image_url}`;
          } else {
            imageUrl = `${API_BASE_URL}/uploads/experiences/${vt.image_url}`;
          }
        }

        return {
          id: vt.id,
          title: vt.title,
          description:
            vt.description ||
            "Exclusive private balloon experience for your group. Perfect for special occasions and intimate groups.",
          image: imageUrl,
          imageTextTag: vt.image_text_tag || "",
          availability: vt.flight_days || "Any Day",
          validity: `Valid: ${vt.validity_months || 18} Months`,
          refundability: "Non-Refundable",
          inclusions: features,
          // Show terms only if provided; otherwise hide
          weatherClause: vt.terms && vt.terms.trim() !== "" ? vt.terms : "",
          price: totalPrice, // Total price for selected tier
          basePrice: basePrice, // Store base price (total) for calculations
          originalBasePrice: originalBasePrice,
          saleBasePrice: saleBasePrice,
          hasSalePrice: pricingState.hasSalePrice,
          priceUnit: priceUnit,
          maxPassengers: vt.max_passengers || 8,
          flightTime: vt.flight_time || "AM & PM",
          is_active: vt.is_active, // Add is_active to the voucher object
        };
      });

      return privateVouchers;
    } else {
      // For Shared Flight, show regular voucher types
      if (allVoucherTypesLoading || allVoucherTypesState.length === 0) {
        return [];
      }

      // Create voucher types for Shared Flight

      const sharedFlightVouchers = allVoucherTypesState
        .filter((vt) => !isVoucherTitleHidden(vt.title))
        .map((vt) => {
          const activityOriginalPrice = getSharedActivityOriginalPrice(
            activityData,
            vt.title,
          );
          const activitySalePrice = getSharedActivitySalePrice(
            activityData,
            vt.title,
          );
          const locationOriginalPrice = getSharedActivityOriginalPrice(
            locationPricing,
            vt.title,
          );
          const locationSalePrice = getSharedActivitySalePrice(
            locationPricing,
            vt.title,
          );
          const pricingState = resolveVoucherPricing({
            originalPrice:
              vt.original_price ??
              activityOriginalPrice ??
              locationOriginalPrice,
            salePrice: vt.sale_price ?? activitySalePrice ?? locationSalePrice,
            fallbackPrice: vt.price_per_person,
          });
          const basePrice = pricingState.currentPrice ?? 180;
          const originalBasePrice = pricingState.originalPrice ?? basePrice;
          const saleBasePrice = pricingState.salePrice;
          const priceUnit = "pp";

          // Don't calculate total price here - let the summary panel calculate it dynamically
          // based on the actual passenger count selected by the user

          // Handle image URL properly
          let imageUrl = weekdayMorningImg; // Default fallback
          if (vt.image_url) {
            if (vt.image_url.startsWith("http")) {
              imageUrl = vt.image_url;
            } else if (vt.image_url.startsWith("/uploads/")) {
              imageUrl = `${API_BASE_URL}${vt.image_url}`;
            } else {
              imageUrl = `${API_BASE_URL}/uploads/experiences/${vt.image_url}`;
            }
          }

          // Parse features from JSON string
          let features = [];

          // Debug: Log the raw features data

          try {
            // Clean up the JSON string first - fix common syntax errors
            let featuresJson = vt.features || "[]";

            // Fix common JSON syntax errors
            featuresJson = featuresJson
              .replace(/\."/g, '",') // Replace ." with ,"
              .replace(/,$/, "") // Remove trailing comma
              .replace(/,\s*]/g, "]"); // Remove comma before closing bracket

            features = JSON.parse(featuresJson);
          } catch (e) {
            console.warn(
              `VoucherType: ${vt.title} - Failed to parse features JSON:`,
              vt.features,
              "Error:",
              e,
            );
            console.warn(
              `VoucherType: ${vt.title} - Attempting to parse as array manually...`,
            );

            // Try to parse as a simple array by splitting on commas
            try {
              const cleanedFeatures = vt.features
                .replace(/[\[\]"]/g, "") // Remove brackets and quotes
                .split(",")
                .map((f) => f.trim())
                .filter((f) => f.length > 0);
              features = cleanedFeatures;
            } catch (manualError) {
              console.warn(
                `VoucherType: ${vt.title} - Manual parsing also failed:`,
                manualError,
              );
              features = [];
            }
          }

          // If no features are available, log a warning but don't use hardcoded fallback
          if (!features || features.length === 0) {
            console.warn(
              `VoucherType: ${vt.title} - No features available in database. Please check the Features (JSON Array) field in the admin panel.`,
            );
          }

          return {
            id: vt.id,
            title: vt.title,
            description:
              vt.description ||
              "Shared balloon experience with other passengers. Perfect for individuals and small groups.",
            image: imageUrl,
            imageTextTag: vt.image_text_tag || "",
            availability: vt.flight_days || "Any Day",
            validity: `Valid: ${vt.validity_months || 18} Months`,
            refundability: "Non-Refundable",
            inclusions: features,
            // Show terms only if provided; otherwise hide
            weatherClause: vt.terms && vt.terms.trim() !== "" ? vt.terms : "",
            price: basePrice, // Set price to basePrice, let summary calculate total
            basePrice: basePrice,
            originalBasePrice: originalBasePrice,
            saleBasePrice: saleBasePrice,
            hasSalePrice: pricingState.hasSalePrice,
            priceUnit: priceUnit,
            maxPassengers: vt.max_passengers || 8,
            flightTime: vt.flight_time || "AM & PM",
            is_active: vt.is_active, // Add is_active to the voucher object
          };
        });

      return sharedFlightVouchers;
    }
  }, [
    chooseFlightType?.type,
    allVoucherTypesState,
    allVoucherTypesLoading,
    privateCharterVoucherTypes,
    privateCharterVoucherTypesLoading,
    activityData,
    locationPricing,
    API_BASE_URL,
    chooseLocation,
    hiddenVoucherTitleSet,
  ]);

  // Expose voucher types to Google Merchant Center / Shopping via structured data
  // This generates a Product list for the current experience (Shared / Private Charter)
  // so Google can crawl `https://flyawayballooning-book.com/` and discover all
  // Any Day Flight, Flexible Weekday, Weekday Morning, Private Charter, Proposal Flight products.
  useEffect(() => {
    try {
      if (typeof window === "undefined" || typeof document === "undefined")
        return;
      if (!Array.isArray(voucherTypes) || voucherTypes.length === 0) return;

      // Use canonical production URL for structured data so Google Merchant Center and crawlers see consistent links
      const isProduction =
        typeof window !== "undefined" &&
        window.location.hostname === "flyawayballooning-book.com";
      const origin = isProduction
        ? "https://flyawayballooning-book.com"
        : typeof window !== "undefined"
          ? window.location.origin
          : "https://flyawayballooning-book.com";
      const path =
        (typeof window !== "undefined" && window.location.pathname) || "/";
      const baseUrl = `${origin}${path}`.replace(/\/$/, "") || origin;
      const flightTypeLabel = chooseFlightType?.type || "Shared Flight";
      const locationLabel = chooseLocation || "Bath";

      const products = voucherTypes
        .map((vt) => {
          const basePrice = Number(vt.basePrice || vt.price || 0);
          if (!basePrice || Number.isNaN(basePrice)) return null;

          const title = vt.title || "Balloon Flight";
          const sku = `${flightTypeLabel}-${title}`
            .toLowerCase()
            .replace(/\s+/g, "-");

          const params = new URLSearchParams();
          params.set("startAt", "voucher-type");
          params.set("voucherTitle", title);
          const url = `${baseUrl}?${params.toString()}`;

          return {
            "@type": "Product",
            name: `${title} - ${flightTypeLabel} - ${locationLabel}`,
            image: vt.image,
            description:
              vt.description ||
              "Hot air balloon flight experience with Fly Away Ballooning.",
            brand: {
              "@type": "Brand",
              name: "Fly Away Ballooning",
            },
            sku,
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "GBP",
              price: basePrice,
              availability: "http://schema.org/InStock",
            },
          };
        })
        .filter(Boolean);

      if (!products.length) return;

      const scriptId = "fab-google-merchant-products";
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = scriptId;
        document.head.appendChild(script);
      }

      const payload = {
        "@context": "https://schema.org",
        "@graph": products,
      };

      script.text = JSON.stringify(payload);
    } catch (e) {
      console.error("Error generating Google Merchant structured data:", e);
    }
  }, [voucherTypes, chooseFlightType?.type, chooseLocation]);

  // When coming from deep links (ör. Shopify) üst component sadece title/quantity
  // içeren bir selectedVoucherType gönderebiliyor. voucherTypes yüklendikten sonra
  // bu title’a göre gerçek voucher objesini bulup kartı seçili yapıyor ve fiyatı
  // otomatik hesaplıyoruz.
  useEffect(() => {
    try {
      if (!Array.isArray(voucherTypes) || voucherTypes.length === 0) return;

      // incoming from parent OR fallback to URL voucherTitle when parent does not provide one
      const urlParams = new URLSearchParams(window.location.search);
      const source = urlParams.get("source");
      const startAt = urlParams.get("startAt");
      const voucherTitleParam = urlParams.get("voucherTitle");

      // Google Merchant: No prefill when coming from Google Merchant (startAt/voucherTitle without source=shopify)
      // User must explicitly select everything - no auto-selection from URL
      const isGoogleMerchantUrl =
        source !== "shopify" &&
        (startAt === "voucher-type" || !!voucherTitleParam);
      if (isGoogleMerchantUrl) return;

      const normalize = (s) =>
        (s || "").toString().trim().toLowerCase().replace(/\s+/g, " ");

      const incomingTitle = selectedVoucherType?.title;
      const urlVoucherTitleRaw = urlParams.get("voucherTitle");
      const normalizedUrlTitle = urlVoucherTitleRaw
        ? normalize(decodeURIComponent(urlVoucherTitleRaw.replace(/\+/g, " ")))
        : null;

      // If parent already sent a fully enriched voucher, no need to re-run
      if (selectedVoucherType?.id && selectedVoucher) return;

      // Find target voucher using either incoming title or URL title
      const matched = voucherTypes.find((v) => {
        const vtNorm = normalize(v.title);
        if (incomingTitle && vtNorm === normalize(incomingTitle)) return true;
        if (normalizedUrlTitle && vtNorm === normalizedUrlTitle) return true;
        return false;
      });
      if (!matched) return;

      // prefer quantity from selectedVoucherType, then URL, then default 2
      const quantityFromProps =
        parseInt(
          selectedVoucherType?.quantity || selectedVoucherType?.passengers || 0,
          10,
        ) || 0;
      const urlPassengers =
        urlParams.get("source") === "shopify"
          ? parseInt(urlParams.get("passengers") || "0", 10)
          : 0;
      const finalQuantity =
        urlPassengers > 0
          ? urlPassengers
          : quantityFromProps > 0
            ? quantityFromProps
            : 2;

      setQuantities((prev) => ({
        ...prev,
        [matched.title]: finalQuantity,
      }));

      const finalEnriched = buildVoucherWithQuantity(matched, finalQuantity);

      // Weather Refundable toggle'ını set et (URL'den veya selectedVoucherType'dan)
      const shouldEnableWeatherRefund =
        selectedVoucherType?.weatherRefundable === true ||
        urlParams.get("weatherRefundable") === "true";
      if (shouldEnableWeatherRefund) {
        const isAnyDay =
          typeof matched.title === "string" &&
          matched.title.toLowerCase().includes("any day");
        const isPrivateCharter = chooseFlightType?.type === "Private Charter";

        if (isAnyDay && chooseFlightType?.type === "Shared Flight") {
          // For Shared Flight Any Day, set localSharedWeatherRefund
          setLocalSharedWeatherRefund(true);
          // Also update passengerData to reflect weather refund
          if (Array.isArray(passengerData) && setPassengerData) {
            const updated = passengerData.map((p) => ({
              ...p,
              weatherRefund: true,
            }));
            setPassengerData(updated);
          }
        } else if (isPrivateCharter) {
          // For Private Charter, set per-voucher weather refund
          setPrivateWeatherRefundByVoucher((prev) => ({
            ...prev,
            [matched.title]: true,
          }));
          if (Array.isArray(passengerData) && setPassengerData) {
            const updated = passengerData.map((p) => ({
              ...p,
              weatherRefund: true,
            }));
            setPassengerData(updated);
          }
          // Also update global state
          if (setPrivateCharterWeatherRefund) {
            setPrivateCharterWeatherRefund(true);
          }
        }
      }

      // Hem local hem de parent state'i update et – özet ekran + kartlar senkron
      setSelectedVoucher(finalEnriched);
      setSelectedVoucherType(finalEnriched);

      // Google Ads: GA_Product_Selected (Stage 4) - deep link flow
      const productType = finalEnriched?.title || "";
      const pricePoint =
        finalEnriched?.priceValue ?? finalEnriched?.price ?? "";
      if (productType) trackProductSelected(productType, pricePoint);

      // If coming from Shopify deep link, auto-open Terms & Conditions once and ensure accordion is open
      const isShopifySource = urlParams.get("source") === "shopify";
      const startAtVoucher =
        urlParams.get("startAt") === "voucher-type" ||
        !!urlParams.get("voucherTitle");
      if (
        !disableTermsPopup &&
        isShopifySource &&
        startAtVoucher &&
        !hasOpenedTermsFromDeepLink.current
      ) {
        hasOpenedTermsFromDeepLink.current = true;
        if (typeof setActiveAccordion === "function") {
          setActiveAccordion("voucher-type");
        }
        autoOpenedTermsRef.current = true;
        userDismissedTermsRef.current = false;
        // Auto-open Terms & Conditions for deep-linked voucher
        openTermsForVoucher(finalEnriched);
      }
    } catch (e) {
      console.error("VoucherType: Error applying deep-link voucher prefill", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voucherTypes, selectedVoucherType?.title, location.search]);

  // Safety net: if deep-link auto-open was triggered but modal got unmounted (e.g., accordion toggle), reopen it once.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isShopifySource = urlParams.get("source") === "shopify";
    const startAtVoucher =
      urlParams.get("startAt") === "voucher-type" ||
      !!urlParams.get("voucherTitle");
    if (
      !disableTermsPopup &&
      isShopifySource &&
      startAtVoucher &&
      autoOpenedTermsRef.current &&
      !userDismissedTermsRef.current &&
      selectedVoucher &&
      !showTerms
    ) {
      if (typeof setActiveAccordion === "function") {
        setActiveAccordion("voucher-type");
      }
      setShowTerms(true);
    }
  }, [
    showTerms,
    selectedVoucher,
    setActiveAccordion,
    location.search,
    disableTermsPopup,
  ]);

  // Remove the duplicate privateCharterVoucherTypesMemo since it's now integrated into voucherTypes

  const handleQuantityChange = (voucherTitle, value) => {
    const newValue = parseInt(value) || 2;

    // Check if Live Availability capacity limit is exceeded
    if (
      selectedDate &&
      selectedTime &&
      availableCapacity !== null &&
      newValue > availableCapacity
    ) {
      setShowCapacityWarning(true);
      return; // Don't update quantity
    }

    // For Private Charter, only allow specific passenger counts: 2, 3, 4, 8
    if (chooseFlightType?.type === "Private Charter") {
      const allowedPassengers = getAllowedPassengerOptions(voucherTitle);
      let finalValue = newValue;

      // If it's a manual input, find the closest allowed value
      if (typeof value === "string" || typeof value === "number") {
        finalValue = parseInt(value) || 2;
        // Find the closest allowed passenger count
        let closest = allowedPassengers[0];
        let minDiff = Math.abs(finalValue - closest);

        for (let allowed of allowedPassengers) {
          const diff = Math.abs(finalValue - allowed);
          if (diff < minDiff) {
            minDiff = diff;
            closest = allowed;
          }
        }
        finalValue = closest;
      }

      // Additional check for capacity limit
      if (
        selectedDate &&
        selectedTime &&
        availableCapacity !== null &&
        finalValue > availableCapacity
      ) {
        setShowCapacityWarning(true);
        return; // Don't update quantity
      }

      setQuantities((prev) => ({
        ...prev,
        [voucherTitle]: finalValue,
      }));
    } else {
      // For other flight types, use the original logic
      const finalValue = Math.max(1, parseInt(value) || 1);

      // Additional check for capacity limit
      if (
        selectedDate &&
        selectedTime &&
        availableCapacity !== null &&
        finalValue > availableCapacity
      ) {
        setShowCapacityWarning(true);
        return; // Don't update quantity
      }

      setQuantities((prev) => ({
        ...prev,
        [voucherTitle]: finalValue,
      }));
    }
  };

  // Helper function to get next allowed passenger count
  const getNextAllowedPassenger = (current, direction, voucherTitle = "") => {
    const allowedPassengers =
      chooseFlightType?.type === "Private Charter"
        ? getAllowedPassengerOptions(voucherTitle)
        : [1, 2, 3, 4, 5, 6, 7, 8];
    const currentIndex = allowedPassengers.indexOf(current);
    // If current not in array (e.g., direct input), snap to nearest valid value
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    if (direction === "next") {
      return allowedPassengers[
        Math.min(safeIndex + 1, allowedPassengers.length - 1)
      ];
    } else {
      return allowedPassengers[Math.max(safeIndex - 1, 0)];
    }
  };

  // Render voucher cards inline so mobile scroll state changes do not remount the image tree.
  const renderVoucherCard = ({
    voucher,
    onSelect,
    quantities,
    isSelected,
    slideDirection,
    shouldAnimate,
  }) => {
    // Compute dynamic display price for Private Charter based on selected passengers
    let privateCharterDisplayTotal = voucher.basePrice || voucher.price;
    let privateCharterOriginalTotal =
      voucher.originalBasePrice || privateCharterDisplayTotal;
    let privateCharterHasSalePrice = !!voucher.hasSalePrice;
    if (chooseFlightType?.type === "Private Charter") {
      const selectedPassengers = parseInt(quantities[voucher.title] || 2, 10);
      const originalTierPrice = getTieredGroupPrice(
        activityData?.private_charter_pricing,
        voucher.title,
        selectedPassengers,
        voucher.id,
      );
      const saleTierPrice = getTieredGroupPrice(
        activityData?.private_charter_sale_pricing,
        voucher.title,
        selectedPassengers,
        voucher.id,
      );

      if (originalTierPrice !== null) {
        privateCharterOriginalTotal = originalTierPrice;
      }

      if (saleTierPrice !== null) {
        privateCharterDisplayTotal = saleTierPrice;
        privateCharterHasSalePrice = true;
      } else if (originalTierPrice !== null) {
        privateCharterDisplayTotal = originalTierPrice;
        privateCharterHasSalePrice = false;
      }

      if (!privateCharterHasSalePrice) {
        privateCharterHasSalePrice = hasMeaningfulSalePrice(
          privateCharterOriginalTotal,
          privateCharterDisplayTotal,
        );
      }
    }
    const sharedPricingState =
      chooseFlightType?.type === "Shared Flight"
        ? resolveVoucherPricing({
            originalPrice:
              voucher.originalBasePrice ??
              getSharedActivityOriginalPrice(activityData, voucher.title) ??
              getSharedActivityOriginalPrice(locationPricing, voucher.title) ??
              voucher.basePrice ??
              voucher.price,
            salePrice:
              voucher.saleBasePrice ??
              getSharedActivitySalePrice(activityData, voucher.title) ??
              getSharedActivitySalePrice(locationPricing, voucher.title) ??
              (voucher.hasSalePrice
                ? voucher.basePrice || voucher.price
                : null),
            fallbackPrice: voucher.basePrice || voucher.price,
          })
        : null;
    const sharedDisplayBasePrice =
      sharedPricingState?.currentPrice ?? voucher.basePrice ?? voucher.price;
    const sharedOriginalBasePrice =
      sharedPricingState?.originalPrice ?? sharedDisplayBasePrice;
    const sharedHasSalePrice = sharedPricingState
      ? sharedPricingState.hasSalePrice ||
        hasMeaningfulSalePrice(sharedOriginalBasePrice, sharedDisplayBasePrice)
      : !!voucher.hasSalePrice;
    const isBuyVoucherFlow =
      activitySelect === "Flight Voucher" || activitySelect === "Buy Gift";
    const isSharedFlight = chooseFlightType?.type === "Shared Flight";
    const cardMinHeight = (() => {
      if (resolvedCompactVoucherCardMode) {
        return isMobile ? 420 : 460;
      }
      if (isBuyVoucherFlow) {
        if (isMobile) {
          // Mobile: align Shared Flight cards (Any Day / Flexible Weekday) to same height
          return isSharedFlight ? 560 : 520;
        }
        return isSharedFlight ? 540 : 500;
      }
      if (isMobile) {
        return isSharedFlight ? 560 : 540;
      }
      return isSharedFlight ? 600 : 540;
    })();

    return (
      <div
        className="voucher-type-card"
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          // Mobile: card wider (calc(100% - 12px) for slightly larger cards); desktop fixed width
          width: isMobile ? "calc(100% - 0px)" : "320px",
          minWidth: isMobile ? "calc(100% - 0px)" : "320px",
          maxWidth: isMobile ? "calc(100% - 0px)" : "320px",
          // Unified min height per flow/device to align Shared Flight cards (Any Day / Flexible Weekday) on mobile
          minHeight: cardMinHeight,
          flexShrink: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: isMobile ? "hidden" : "visible",
          animation: shouldAnimate
            ? slideDirection === "right"
              ? "slideInRight 0.3s ease-in-out"
              : slideDirection === "left"
                ? "slideInLeft 0.3s ease-in-out"
                : "none"
            : "none",
          border: isSelected ? "2px solid #03a9f4" : "none",
          scrollSnapAlign: isMobile ? "start" : "none",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 180,
            overflow: "hidden",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <img
            src={voucher.image}
            alt={voucher.title}
            loading={isMobile ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            onError={(e) => {
              // Hide image on error (blocked, 404, etc.) to prevent loading delays
              e.target.style.display = "none";
            }}
            onLoad={(e) => {
              // Clear any timeout on successful load
              if (e.target.dataset.timeoutId) {
                clearTimeout(parseInt(e.target.dataset.timeoutId));
                delete e.target.dataset.timeoutId;
              }
            }}
            onLoadStart={(e) => {
              // Set timeout to hide image if it takes too long (5 seconds)
              const timeoutId = setTimeout(() => {
                e.target.style.display = "none";
              }, 5000);
              e.target.dataset.timeoutId = timeoutId.toString();
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />

          {voucher.imageTextTag && (
            <div
              className="voucher-type-card-tag"
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                bottom: 16,
                background: "#FF6937",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                textAlign: "center",
                lineHeight: 1.2,
                maxWidth: "82%",
                whiteSpace: "normal",
                wordBreak: "break-word",
                boxShadow: "0 4px 10px rgba(255, 105, 55, 0.35)",
              }}
            >
              {voucher.imageTextTag}
            </div>
          )}
        </div>
        <div
          style={{
            padding: "16px",
            width: "100%",
            boxSizing: "border-box",
            display: "grid",
            flexDirection: "column",
            flex: 1,
            overflow: "visible",
            position: "relative",
          }}
        >
          <h3
            className="voucher-type-card-title"
            style={{
              fontSize: 18,
              fontWeight: 300,
              margin: 0,
              marginBottom: 6,
              color: "#4a4a4a",
            }}
          >
            {voucher.title}
          </h3>
          {!resolvedCompactVoucherCardMode && (
            <>
              {/* Duration and Passenger Capacity - below title */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 20 : 24,
                  marginBottom: 8,
                  color: "#666",
                  fontSize: isMobile ? 13 : 12,
                  flexWrap: "wrap",
                }}
              >
                <span
                  className="voucher-type-card-meta"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <AccessTimeIcon sx={{ fontSize: 18, color: "#888" }} />
                  <span>3-4 Hours</span>
                </span>
                <span
                  className="voucher-type-card-meta"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <GroupsIcon sx={{ fontSize: 18, color: "#888" }} />
                  <span>Max {voucher.maxPassengers || 8} Passengers</span>
                </span>
              </div>
              <div
                className="voucher-type-card-copy"
                style={{
                  fontSize: isMobile ? 14 : 13,
                  color: "#666",
                  marginBottom: 6,
                  lineHeight: "1.3",
                  fontStyle: "italic",
                }}
              >
                {voucher.description}
              </div>
              <div
                className="voucher-type-card-strong"
                style={{
                  fontSize: isMobile ? 14 : 13,
                  color: "#666",
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                {voucher.availability}
              </div>
              <div
                className="voucher-type-card-strong"
                style={{
                  fontSize: isMobile ? 14 : 13,
                  color: "#666",
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                {voucher.flightTime}
              </div>
              <div
                className="voucher-type-card-strong"
                style={{
                  fontSize: isMobile ? 14 : 13,
                  color: "#666",
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                {voucher.validity}
              </div>
              {(() => {
                const isAnyDay =
                  typeof voucher.title === "string" &&
                  voucher.title.toLowerCase().includes("any day");
                const isShared = chooseFlightType?.type === "Shared Flight";
                const isPrivate = chooseFlightType?.type === "Private Charter";
                const sharedEnabled =
                  isShared &&
                  isAnyDay &&
                  (forceWeatherRefundable || !!localSharedWeatherRefund);
                const privateEnabled =
                  isPrivate &&
                  (forceWeatherRefundable ||
                    !!privateWeatherRefundByVoucher?.[voucher.title]);
                const isRefundable = sharedEnabled || privateEnabled;
                return (
                  <div
                    className="voucher-type-card-refund-row"
                    style={{
                      fontSize: isMobile ? 12 : 13,
                      color: "#666",
                      marginBottom: 10,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "nowrap",
                      gap: isMobile ? "4px 8px" : "6px 16px",
                    }}
                  >
                    {!isRefundable ? (
                      <>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ flexShrink: 0, lineHeight: 1 }}>
                            🟢
                          </span>
                          <span>Re-Bookable</span>
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ flexShrink: 0, lineHeight: 1 }}>
                            🔴
                          </span>
                          <span>Non-Refundable</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ flexShrink: 0, lineHeight: 1 }}>
                            🟢
                          </span>
                          <span>Re-Bookable</span>
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ flexShrink: 0, lineHeight: 1 }}>
                            🟢
                          </span>
                          <span>Refundable</span>
                        </span>
                      </>
                    )}
                  </div>
                );
              })()}
              <div
                style={{
                  paddingLeft: 0,
                  margin: 0,
                  marginBottom: 10,
                  color: "#666",
                  fontSize: isMobile ? 14 : 13,
                  lineHeight: "1.3",
                }}
              >
                {(() => {
                  if (!voucher.inclusions || voucher.inclusions.length === 0) {
                    return (
                      <div style={{ fontStyle: "italic", color: "#999" }}>
                        Features will be loaded from the admin panel...
                      </div>
                    );
                  }

                  return voucher.inclusions.map((inclusion, i) => {
                    const isAnyDay =
                      typeof voucher.title === "string" &&
                      voucher.title.toLowerCase().includes("any day");
                    const displayText = String(inclusion || "").replace(
                      /^[•\s]+/,
                      "",
                    );
                    return (
                      <div key={i} style={{ marginBottom: 3 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              color: "#90EE90",
                              flexShrink: 0,
                              fontSize: "1.2em",
                              lineHeight: 1.3,
                            }}
                          >
                            •
                          </span>
                          <span style={{ flex: 1 }}>{displayText}</span>
                        </div>
                        {inclusion === "Flight Certificate" && !isAnyDay && (
                          <div
                            style={{
                              marginTop: 6,
                              marginLeft: 18,
                              fontSize: isMobile ? 14 : 12,
                              color: "#666",
                              lineHeight: "1.2",
                            }}
                          >
                            ✓ In the event of a flight cancellation, your
                            voucher remains valid for rebooking within 24
                            months. Fly within 6 attempts, or we'll extend your
                            voucher free of charge.
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
              {/* Dynamic cancellation policy message for Any Day Flight and Private Charter */}
              {(() => {
                const isAnyDay =
                  typeof voucher.title === "string" &&
                  voucher.title.toLowerCase().includes("any day");
                const isSharedFlight =
                  chooseFlightType?.type === "Shared Flight";
                const isPrivateCharter =
                  chooseFlightType?.type === "Private Charter";
                const isPrivateVoucher = isPrivateCharter && voucher.title;

                // Any Day Flight message
                if (
                  isSharedFlight &&
                  isAnyDay &&
                  activitySelect === "Book Flight"
                ) {
                  const anyDayMsg1 =
                    "✓ In the event of a flight cancellation, your voucher remains valid for rebooking within 24 months. Fly within 6 attempts, or we'll extend your voucher free of charge.";
                  const anyDayMsg2 =
                    "✓ In the event of a flight cancellation, your voucher remains valid for rebooking within 24 months. Alternatively, you may request a refund within 6 months of purchase.";
                  const isSharedRefundable =
                    forceWeatherRefundable || !!localSharedWeatherRefund;

                  return (
                    <div
                      style={{
                        fontSize: isMobile ? 14 : 13,
                        color: "#666",
                        marginBottom: 12,
                        lineHeight: "1.2",
                      }}
                    >
                      {isSharedRefundable ? anyDayMsg2 : anyDayMsg1}
                    </div>
                  );
                }

                // Private Charter message
                if (isPrivateVoucher && activitySelect === "Book Flight") {
                  const privateMsg1 =
                    "✓ In the event of a flight cancellation, your voucher remains valid for rebooking within 18 months. Fly within 6 attempts, or we'll extend your voucher free of charge.";
                  const privateMsg2 =
                    "✓ In the event of a flight cancellation, your voucher remains valid for rebooking within 18 months. Alternatively, you may request a refund within 6 months of purchase.";
                  const isPrivateRefundable =
                    forceWeatherRefundable ||
                    !!privateWeatherRefundByVoucher?.[voucher.title];

                  return (
                    <div
                      style={{
                        fontSize: isMobile ? 14 : 13,
                        color: "#666",
                        marginBottom: 12,
                        lineHeight: "1.2",
                        background: "#f8fafc",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        padding: "8px 10px",
                      }}
                    >
                      {isPrivateRefundable ? privateMsg2 : privateMsg1}
                    </div>
                  );
                }

                return null;
              })()}
              {/* Cancellation policy for Flexible Weekday and Weekday Morning - only for Book Flight Date */}
              {(() => {
                const isFlexibleWeekday = voucher.title === "Flexible Weekday";
                const isWeekdayMorning = voucher.title === "Weekday Morning";
                const isBookFlight = activitySelect === "Book Flight";

                if ((isFlexibleWeekday || isWeekdayMorning) && isBookFlight) {
                  return (
                    <div
                      style={{
                        fontSize: isMobile ? 14 : 13,
                        color: "#666",
                        marginBottom: 12,
                        lineHeight: "1.2",
                      }}
                    >
                      ✓ In the event of a flight cancellation, your voucher
                      remains valid for rebooking within 18 months. Fly within 6
                      attempts, or we'll extend your voucher free of charge.
                    </div>
                  );
                }
                return null;
              })()}
            </>
          )}

          {/* Weather refundable toggle moved below price, above Select */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              marginBottom:
                activitySelect === "Flight Voucher" ||
                activitySelect === "Buy Gift"
                  ? 6
                  : 12,
              gap: "8px",
            }}
          >
            <div
              className="voucher-type-passenger-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: isMobile ? "nowrap" : "wrap",
                // Ensure Proposal Flight passenger section has same height as Private Charter selector
                minHeight:
                  voucher.title &&
                  typeof voucher.title === "string" &&
                  voucher.title.toLowerCase().includes("proposal")
                    ? isMobile
                      ? "40px"
                      : "32px"
                    : "auto",
              }}
            >
              <label
                className="voucher-type-card-passenger-label"
                style={{
                  fontSize: isMobile ? 16 : 14,
                  color: "#4A4A4A",
                  fontWeight: isMobile ? 500 : 500,
                  marginBottom: "0",
                  whiteSpace: isMobile ? "nowrap" : "normal",
                  lineHeight: 1,
                }}
              >
                Passengers:
              </label>
              {voucher.title &&
              typeof voucher.title === "string" &&
              voucher.title.toLowerCase().includes("proposal") ? (
                <span
                  className="voucher-type-card-passenger-count"
                  style={{
                    fontSize: isMobile ? 16 : 14,
                    color: "#4A4A4A",
                    fontWeight: isMobile ? 500 : 600,
                    marginBottom: "0",
                    whiteSpace: isMobile ? "nowrap" : "normal",
                    lineHeight: 1,
                  }}
                >
                  2
                </span>
              ) : (
                <div
                  className="voucher-type-passenger-stepper"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? "14px" : "8px",
                  }}
                >
                  <button
                    className="voucher-stepper-button"
                    type="button"
                    onClick={() =>
                      handleQuantityChange(
                        voucher.title,
                        getNextAllowedPassenger(
                          parseInt(quantities[voucher.title] || 2, 10),
                          "prev",
                          voucher.title,
                        ),
                      )
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      width: isMobile ? 28 : 24,
                      height: isMobile ? 28 : 24,
                      minWidth: isMobile ? 28 : 24,
                      minHeight: isMobile ? 28 : 24,
                      border: "2px solid rgb(0, 235, 91)",
                      background: "transparent",
                      borderRadius: "50%",
                      cursor: "pointer",
                      fontSize: isMobile ? 16 : 14,
                      fontWeight: 500,
                      color: "rgb(0, 235, 91)",
                      lineHeight: 1,
                    }}
                  >
                    −
                  </button>
                  <span
                    className="voucher-type-card-passenger-count"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      minWidth: isMobile ? 0 : 0,
                      height: isMobile ? 28 : 24,
                      textAlign: "center",
                      fontSize: isMobile ? 15 : 14,
                      fontWeight: 600,
                      color: "#4a4a4a",
                      lineHeight: 1,
                    }}
                  >
                    {quantities[voucher.title] || 2}
                  </span>
                  <button
                    className="voucher-stepper-button"
                    type="button"
                    onClick={() =>
                      handleQuantityChange(
                        voucher.title,
                        getNextAllowedPassenger(
                          parseInt(quantities[voucher.title] || 2, 10),
                          "next",
                          voucher.title,
                        ),
                      )
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      width: isMobile ? 28 : 24,
                      height: isMobile ? 28 : 24,
                      minWidth: isMobile ? 28 : 24,
                      minHeight: isMobile ? 28 : 24,
                      border: "2px solid rgb(0, 235, 91)",
                      background: "transparent",
                      borderRadius: "50%",
                      cursor: "pointer",
                      fontSize: isMobile ? 16 : 14,
                      fontWeight: 500,
                      color: "rgb(0, 235, 91)",
                      lineHeight: 1,
                    }}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
          <div
            className="voucher-type-card-total"
            style={{
              fontWeight: 600,
              fontSize: 15,
              marginBottom:
                activitySelect === "Flight Voucher" ||
                activitySelect === "Buy Gift"
                  ? 6
                  : 10,
              color: "#4a4a4a",
            }}
          >
            {(() => {
              const isAnyDay =
                typeof voucher.title === "string" &&
                voucher.title.toLowerCase().includes("any day");
              const isSharedFlight = chooseFlightType?.type === "Shared Flight";
              const weatherRefundEnabled =
                isSharedFlight &&
                isAnyDay &&
                (forceWeatherRefundable || localSharedWeatherRefund);
              const passengerCount = parseInt(
                quantities[voucher.title] || 2,
                10,
              );
              const strikePriceStyle = {
                textDecoration: "line-through",
                color: "#9ca3af",
                fontWeight: 500,
                marginRight: 8,
              };

              if (chooseFlightType?.type === "Private Charter") {
                if (privateCharterHasSalePrice) {
                  return (
                    <>
                      <span style={strikePriceStyle}>
                        £{formatVoucherAmount(privateCharterOriginalTotal)}{" "}
                        total
                      </span>
                      <span>
                        £{formatVoucherAmount(privateCharterDisplayTotal || 0)}{" "}
                        total
                      </span>
                    </>
                  );
                }
                return `£${formatVoucherAmount(privateCharterDisplayTotal || 0)} total`;
              } else if (voucher.priceUnit === "total") {
                const currentTotalPrice = voucher.basePrice || voucher.price;
                const originalTotalPrice =
                  voucher.originalBasePrice || currentTotalPrice;

                if (voucher.hasSalePrice) {
                  return (
                    <>
                      <span style={strikePriceStyle}>
                        £{formatVoucherAmount(originalTotalPrice)} total
                      </span>
                      <span>
                        £{formatVoucherAmount(currentTotalPrice)} total
                      </span>
                    </>
                  );
                }

                return `£${formatVoucherAmount(currentTotalPrice)} total`;
              } else {
                const isFlexWeekday = voucher.title === "Flexible Weekday";
                const seasonSaverActive =
                  isFlexWeekday &&
                  seasonSaver &&
                  activityData?.season_saver_enabled &&
                  activityData?.season_saver_price;
                const basePrice = seasonSaverActive
                  ? parseFloat(activityData.season_saver_price)
                  : sharedDisplayBasePrice;
                const originalBasePrice = seasonSaverActive
                  ? sharedDisplayBasePrice
                  : sharedOriginalBasePrice;
                if (weatherRefundEnabled) {
                  const weatherRefundCost = 47.5 * passengerCount;
                  const totalPrice =
                    basePrice * passengerCount + weatherRefundCost;
                  if (sharedHasSalePrice && !seasonSaverActive) {
                    return (
                      <>
                        <span style={strikePriceStyle}>
                          £{formatVoucherAmount(originalBasePrice)} pp
                        </span>
                        <span>
                          £{formatVoucherAmount(basePrice)} pp | Total: £
                          {formatVoucherTotal(totalPrice)}
                        </span>
                      </>
                    );
                  }
                  return `£${formatVoucherTotal(totalPrice)} total`;
                }

                const totalPrice = basePrice * passengerCount;
                if (seasonSaverActive) {
                  return (
                    <>
                      <span style={strikePriceStyle}>
                        £{formatVoucherAmount(originalBasePrice)} pp
                      </span>
                      <span style={{ color: "#16a34a" }}>
                        £{formatVoucherAmount(basePrice)} pp | Total: £
                        {formatVoucherTotal(totalPrice)}
                      </span>
                    </>
                  );
                }
                if (sharedHasSalePrice) {
                  return (
                    <>
                      <span style={strikePriceStyle}>
                        £{formatVoucherAmount(originalBasePrice)} pp
                      </span>
                      <span>
                        £{formatVoucherAmount(basePrice)} pp | Total: £
                        {formatVoucherTotal(totalPrice)}
                      </span>
                    </>
                  );
                }

                return `£${formatVoucherAmount(basePrice)} pp | Total: £${formatVoucherTotal(totalPrice)}`;
              }
            })()}
          </div>
          {(() => {
            const isAnyDay =
              typeof voucher.title === "string" &&
              voucher.title.toLowerCase().includes("any day");
            const isFlexibleWeekday = voucher.title === "Flexible Weekday";
            const isWeekdayMorning = voucher.title === "Weekday Morning";
            const showWeatherRefundableShared =
              chooseFlightType?.type === "Shared Flight" &&
              activitySelect === "Book Flight" &&
              isAnyDay;
            const showWeatherRefundablePrivate =
              chooseFlightType?.type === "Private Charter" &&
              activitySelect === "Book Flight";
            const showSeasonSaver =
              chooseFlightType?.type === "Shared Flight" &&
              activitySelect === "Book Flight" &&
              isFlexibleWeekday &&
              activityData?.season_saver_enabled;

            // Always render a container div to maintain consistent card height across all vouchers
            const shouldShowWeatherContainer =
              showWeatherRefundableShared || showWeatherRefundablePrivate;
            const shouldShowToggleContainer =
              shouldShowWeatherContainer || showSeasonSaver;
            const isSharedFlight = chooseFlightType?.type === "Shared Flight";

            return (
              <div
                style={{
                  background: shouldShowToggleContainer
                    ? "#f8fafc"
                    : "transparent",
                  border: shouldShowToggleContainer
                    ? "1px solid #e5e7eb"
                    : "none",
                  borderRadius: 12,
                  padding: shouldShowToggleContainer ? "10px 12px" : "0",
                  marginBottom: shouldShowToggleContainer ? 10 : 0,
                  // Only reserve space when a toggle container is actually shown; otherwise no extra gap (fix mobile extra spacer)
                  minHeight: shouldShowToggleContainer ? "0px" : 0,
                  overflow: "visible",
                  position: "relative",
                }}
              >
                {showWeatherRefundableShared &&
                  (() => {
                    const enabled =
                      forceWeatherRefundable || localSharedWeatherRefund;
                    return (
                      <>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            marginBottom: enabled ? 6 : 0,
                            overflow: "visible",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              overflow: "visible",
                            }}
                          >
                            <span
                              className="voucher-type-card-toggle-label"
                              style={{ fontWeight: 600, fontSize: 14 }}
                            >
                              Weather Refundable
                            </span>
                            <BsInfoCircle
                              data-tooltip-id="weather-refundable-tooltip-shared"
                              style={{
                                color: "#3b82f6",
                                cursor: "pointer",
                                width: 14,
                                height: 14,
                              }}
                            />

                            <ReactTooltip
                              id="weather-refundable-tooltip-shared"
                              place="top"
                              content={
                                enabled
                                  ? "Optional weather protection: If your flight is cancelled due to weather, this cover refunds your flight price (excluding the cost of protection). Without it, your voucher is non-refundable but can be rebooked as needed."
                                  : "Optional weather protection: If your flight is cancelled due to weather, this cover refunds your flight price (excluding the cost of protection). Without it, your voucher is non-refundable but can be rebooked as needed."
                              }
                              style={{
                                maxWidth: "280px",
                                fontSize: "13px",
                                textAlign: "center",
                                backgroundColor: "#1f2937",
                                color: "#ffffff",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                zIndex: 9999,
                              }}
                            />
                          </div>
                          <label className="switch" style={{ margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={enabled}
                              disabled={forceWeatherRefundable}
                              onChange={() => {
                                if (forceWeatherRefundable) return;
                                const next = !enabled;
                                setLocalSharedWeatherRefund(next);
                                if (
                                  Array.isArray(passengerData) &&
                                  setPassengerData
                                ) {
                                  const updated = passengerData.map((p) => ({
                                    ...p,
                                    weatherRefund: next,
                                  }));
                                  setPassengerData(updated);
                                }
                              }}
                            />

                            <span className="slider round"></span>
                          </label>
                        </div>
                        {enabled && (
                          <div style={{ textAlign: "right" }}>
                            <span className="toggle-price-pill">
                              +£
                              {(
                                47.5 *
                                parseInt(quantities[voucher.title] || 2, 10)
                              ).toFixed(2)}{" "}
                              total
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                {showWeatherRefundablePrivate &&
                  (() => {
                    const enabled =
                      forceWeatherRefundable ||
                      !!privateWeatherRefundByVoucher[voucher.title];
                    return (
                      <>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            marginBottom: enabled ? 6 : 0,
                            overflow: "visible",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              overflow: "visible",
                            }}
                          >
                            <span
                              className="voucher-type-card-toggle-label"
                              style={{ fontWeight: 600, fontSize: 14 }}
                            >
                              Weather Refundable
                            </span>
                            <BsInfoCircle
                              data-tooltip-id={`weather-refundable-tooltip-private-${voucher.title}`}
                              style={{
                                color: "#3b82f6",
                                cursor: "pointer",
                                width: 14,
                                height: 14,
                              }}
                            />

                            <ReactTooltip
                              id={`weather-refundable-tooltip-private-${voucher.title}`}
                              place="top"
                              content={
                                enabled
                                  ? "Optional weather protection: If your flight is cancelled due to weather, this cover refunds your flight price (excluding the cost of protection). Without it, your voucher is non-refundable but can be rebooked as needed."
                                  : "Optional weather protection: If your flight is cancelled due to weather, this cover refunds your flight price (excluding the cost of protection). Without it, your voucher is non-refundable but can be rebooked as needed."
                              }
                              style={{
                                maxWidth: "280px",
                                fontSize: "13px",
                                textAlign: "center",
                                backgroundColor: "#1f2937",
                                color: "#ffffff",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                zIndex: 9999,
                              }}
                            />
                          </div>
                          <label className="switch" style={{ margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={enabled}
                              disabled={forceWeatherRefundable}
                              onChange={() => {
                                if (forceWeatherRefundable) return;
                                const next = !enabled;
                                // Enforce mutual exclusivity across voucher items
                                setPrivateWeatherRefundByVoucher(() => {
                                  const state = {};
                                  if (next) state[voucher.title] = true; // only this one on
                                  return state; // all others implicitly off
                                });
                                if (
                                  Array.isArray(passengerData) &&
                                  setPassengerData
                                ) {
                                  const updated = passengerData.map((p) => ({
                                    ...p,
                                    weatherRefund: next,
                                  }));
                                  setPassengerData(updated);
                                }
                                // If this card is selected, reflect to global for summary
                                if (
                                  isSelected &&
                                  setPrivateCharterWeatherRefund
                                ) {
                                  setPrivateCharterWeatherRefund(next);
                                }
                              }}
                            />

                            <span className="slider round"></span>
                          </label>
                        </div>
                        {enabled && (
                          <div style={{ textAlign: "right" }}>
                            <span className="toggle-price-pill">+ 10%</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                {showSeasonSaver &&
                  (() => {
                    const enabled = !!seasonSaver;
                    return (
                      <>
                        {shouldShowWeatherContainer && (
                          <div
                            style={{
                              borderTop: "1px solid #e5e7eb",
                              margin: "8px 0",
                            }}
                          />
                        )}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            marginBottom: enabled ? 6 : 0,
                            overflow: "visible",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              overflow: "visible",
                            }}
                          >
                            <span
                              className="voucher-type-card-toggle-label"
                              style={{ fontWeight: 600, fontSize: 14 }}
                            >
                              ☘️ Season Saver
                            </span>
                            <BsInfoCircle
                              data-tooltip-id="season-saver-tooltip"
                              style={{
                                color: "#16a34a",
                                cursor: "pointer",
                                width: 14,
                                height: 14,
                              }}
                            />

                            <ReactTooltip
                              id="season-saver-tooltip"
                              place="top"
                              content="Save with our Season Saver fare! Flights available October to May only (excludes June–August). Your voucher can be rebooked within the eligible season. Upgrade to a standard Flexible Weekday fare anytime via your customer portal."
                              style={{
                                maxWidth: "280px",
                                fontSize: "13px",
                                textAlign: "center",
                                backgroundColor: "#1f2937",
                                color: "#ffffff",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                zIndex: 9999,
                              }}
                            />
                          </div>
                          <label className="switch" style={{ margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => {
                                if (setSeasonSaver) setSeasonSaver(!enabled);
                              }}
                            />

                            <span className="slider round"></span>
                          </label>
                        </div>
                        {enabled && (
                          <div style={{ textAlign: "right" }}>
                            <span
                              className="toggle-price-pill"
                              style={{
                                background: "#dcfce7",
                                color: "#16a34a",
                              }}
                            >
                              £
                              {parseFloat(
                                activityData?.season_saver_price || 175,
                              ).toFixed(2)}{" "}
                              pp
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
              </div>
            );
          })()}
          <button
            className={`voucher-type-select-button${isSelected ? " voucher-type-select-button--selected" : ""}`}
            style={{
              width: "100%",
              marginTop:
                activitySelect === "Flight Voucher" ||
                activitySelect === "Buy Gift"
                  ? 8
                  : "auto",
            }}
            onClick={() => onSelect(voucher)}
          >
            {isSelected ? "Selected" : "Select"}
          </button>
        </div>
      </div>
    );
  };

  // Keep layout sensible per device and experience type

  const handlePrevVoucher = () => {
    if (!isMobile) return;

    const container = voucherContainerRef.current;
    if (!container) return;

    const firstChild = container.children[0];
    const gap = 12;
    const itemWidth = firstChild
      ? firstChild.getBoundingClientRect().width + gap
      : container.clientWidth;
    const newLeft = Math.max(0, container.scrollLeft - itemWidth);
    container.scrollTo({ left: newLeft, behavior: "smooth" });
    // Optimistically update index/arrows so back button appears immediately
    const itemCount = container.children.length;
    setCurrentItemIndex((prev) => Math.max(0, prev - 1));
    const tempIndex = Math.max(0, currentItemIndex - 1);
    setCanScrollVouchersLeft(tempIndex > 0);
    setCanScrollVouchersRight(tempIndex < itemCount - 1);
  };

  const handleNextVoucher = () => {
    if (!isMobile) return;

    const container = voucherContainerRef.current;
    if (!container) return;

    const firstChild = container.children[0];
    const gap = 12;
    const itemWidth = firstChild
      ? firstChild.getBoundingClientRect().width + gap
      : container.clientWidth;
    const newLeft = container.scrollLeft + itemWidth;
    container.scrollTo({ left: newLeft, behavior: "smooth" });
    // Optimistically update index/arrows so back button appears immediately
    const itemCount = container.children.length;
    setCurrentItemIndex((prev) => Math.min(prev + 1, itemCount - 1));
    const tempIndex = Math.min(currentItemIndex + 1, itemCount - 1);
    setCanScrollVouchersLeft(tempIndex > 0);
    setCanScrollVouchersRight(tempIndex < itemCount - 1);
  };

  /**
   * Helper to build a fully-populated voucher object with quantity and pricing.
   * This is shared between manual card selection and deep-link (Shopify) prefill.
   */
  const buildVoucherWithQuantity = (voucher, quantityRaw) => {
    // Ensure quantity defaults to 2 when not explicitly changed in UI
    // For Proposal Flight, force quantity to 2
    const isProposal =
      typeof voucher.title === "string" &&
      voucher.title.toLowerCase().includes("proposal");
    const safeQuantity = isProposal
      ? 2
      : parseInt(quantityRaw ?? quantities[voucher.title] ?? 2, 10) || 2;

    // Calculate total price based on price unit and experience type
    let totalPrice;
    let effectiveBasePrice = voucher.basePrice;
    let effectiveOriginalBasePrice =
      voucher.originalBasePrice ?? voucher.basePrice;
    let effectiveSaleBasePrice = voucher.saleBasePrice ?? null;
    let hasSalePrice = !!voucher.hasSalePrice;

    if (chooseFlightType?.type === "Private Charter") {
      // Activity tier values are already total for the selected passenger tier.
      const tierOriginalPrice = getTieredGroupPrice(
        activityData?.private_charter_pricing,
        voucher.title,
        safeQuantity,
        voucher.id,
      );
      const tierSalePrice = getTieredGroupPrice(
        activityData?.private_charter_sale_pricing,
        voucher.title,
        safeQuantity,
        voucher.id,
      );

      if (tierOriginalPrice !== null) {
        effectiveOriginalBasePrice = tierOriginalPrice;
      }

      if (tierSalePrice !== null) {
        effectiveBasePrice = tierSalePrice;
        effectiveSaleBasePrice = tierSalePrice;
        hasSalePrice = true;
      } else if (tierOriginalPrice !== null) {
        effectiveBasePrice = tierOriginalPrice;
        effectiveSaleBasePrice = null;
        hasSalePrice = false;
      }

      if (!hasSalePrice) {
        hasSalePrice = hasMeaningfulSalePrice(
          effectiveOriginalBasePrice,
          effectiveBasePrice,
        );
      }

      totalPrice = effectiveBasePrice || 0;
    } else if (voucher.priceUnit === "total") {
      // For total pricing, the price is already the total for the group
      totalPrice = effectiveBasePrice || voucher.price;
    } else {
      const sharedPricingState = resolveVoucherPricing({
        originalPrice:
          voucher.originalBasePrice ??
          getSharedActivityOriginalPrice(activityData, voucher.title) ??
          getSharedActivityOriginalPrice(locationPricing, voucher.title) ??
          voucher.basePrice ??
          voucher.price,
        salePrice:
          voucher.saleBasePrice ??
          getSharedActivitySalePrice(activityData, voucher.title) ??
          getSharedActivitySalePrice(locationPricing, voucher.title) ??
          (voucher.hasSalePrice ? voucher.basePrice || voucher.price : null),
        fallbackPrice: voucher.basePrice || voucher.price,
      });

      effectiveBasePrice =
        sharedPricingState.currentPrice ?? effectiveBasePrice ?? voucher.price;
      effectiveOriginalBasePrice =
        sharedPricingState.originalPrice ??
        effectiveOriginalBasePrice ??
        effectiveBasePrice;
      effectiveSaleBasePrice = sharedPricingState.salePrice;
      hasSalePrice =
        sharedPricingState.hasSalePrice ||
        hasMeaningfulSalePrice(effectiveOriginalBasePrice, effectiveBasePrice);

      // Season Saver price override for Flexible Weekday
      const isFlexWeekday =
        typeof voucher.title === "string" &&
        voucher.title === "Flexible Weekday";
      if (
        isFlexWeekday &&
        seasonSaver &&
        activityData?.season_saver_enabled &&
        activityData?.season_saver_price
      ) {
        effectiveBasePrice = parseFloat(activityData.season_saver_price);
        hasSalePrice = false;
        effectiveSaleBasePrice = null;
      }

      // For per-person pricing, multiply by quantity
      totalPrice = (effectiveBasePrice || voucher.price) * safeQuantity;
    }

    return {
      ...voucher,
      quantity: safeQuantity,
      totalPrice: totalPrice,
      basePrice: effectiveBasePrice || voucher.basePrice,
      originalBasePrice:
        effectiveOriginalBasePrice || effectiveBasePrice || voucher.basePrice,
      saleBasePrice: effectiveSaleBasePrice,
      hasSalePrice,
      priceUnit: voucher.priceUnit,
      // Ensure summary uses the correct total price for Private Charter
      price:
        chooseFlightType?.type === "Private Charter"
          ? totalPrice
          : voucher.priceUnit === "total"
            ? effectiveBasePrice || voucher.price
            : effectiveBasePrice || voucher.basePrice || voucher.price,
    };
  };

  useEffect(() => {
    const currentTitle = selectedVoucherType?.title || selectedVoucher?.title;
    if (!currentTitle) return;

    const nextQuantity =
      parseInt(
        quantities[currentTitle] ??
          selectedVoucherType?.quantity ??
          selectedVoucherType?.passengers ??
          selectedVoucher?.quantity ??
          selectedVoucher?.passengers ??
          0,
        10,
      ) || 0;

    if (!nextQuantity) return;

    const currentQuantity =
      parseInt(
        selectedVoucherType?.quantity ??
          selectedVoucherType?.passengers ??
          selectedVoucher?.quantity ??
          selectedVoucher?.passengers ??
          0,
        10,
      ) || 0;

    if (
      currentQuantity === nextQuantity &&
      Number(
        selectedVoucherType?.totalPrice ?? selectedVoucher?.totalPrice ?? 0,
      ) > 0
    ) {
      return;
    }

    const sourceVoucher =
      voucherTypes.find(
        (voucher) =>
          Number(voucher.id) ===
            Number(selectedVoucherType?.id || selectedVoucher?.id) ||
          normalizeVoucherPriceTitle(voucher.title) ===
            normalizeVoucherPriceTitle(currentTitle),
      ) ||
      selectedVoucher ||
      selectedVoucherType;

    if (!sourceVoucher) return;

    const rebuilt = buildVoucherWithQuantity(sourceVoucher, nextQuantity);
    const sameQuantity =
      Number(
        selectedVoucherType?.quantity ?? selectedVoucher?.quantity ?? 0,
      ) === Number(rebuilt.quantity);
    const sameTotal =
      Number(
        selectedVoucherType?.totalPrice ?? selectedVoucher?.totalPrice ?? 0,
      ) === Number(rebuilt.totalPrice ?? 0);
    const samePrice =
      Number(selectedVoucherType?.price ?? selectedVoucher?.price ?? 0) ===
      Number(rebuilt.price ?? 0);

    if (
      sameQuantity &&
      sameTotal &&
      samePrice &&
      (selectedVoucherType?.id || selectedVoucher?.id || null) ===
        (rebuilt.id || null)
    ) {
      return;
    }

    setSelectedVoucher(rebuilt);
    setSelectedVoucherType(rebuilt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chooseFlightType?.type,
    quantities,
    selectedVoucher?.id,
    selectedVoucher?.price,
    selectedVoucher?.quantity,
    selectedVoucher?.title,
    selectedVoucher?.totalPrice,
    selectedVoucherType?.id,
    selectedVoucherType?.price,
    selectedVoucherType?.quantity,
    selectedVoucherType?.title,
    selectedVoucherType?.totalPrice,
    voucherTypes,
  ]);

  const openTermsForVoucher = async (voucherObj) => {
    if (disableTermsPopup) {
      setSelectedVoucher(voucherObj);
      setSelectedVoucherType(voucherObj);
      setShowTerms(false);
      if (onTermsLoadingChange) {
        onTermsLoadingChange(false);
      }
      return;
    }

    // Ensure selected voucher is set before opening terms
    setSelectedVoucher(voucherObj);

    try {
      setTermsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/terms-and-conditions`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Find active terms mapped to this voucher type. Prefer lowest sort_order, then newest.
          const matches = json.data.filter((t) => {
            try {
              // Check if this voucher type is directly mapped
              if (
                t.voucher_type_id &&
                Number(t.voucher_type_id) === Number(voucherObj.id)
              ) {
                return t.is_active === 1 || t.is_active === true;
              }

              // Check if this voucher type is in voucher_type_ids array
              let voucherTypeIds = [];
              if (t.voucher_type_ids) {
                if (Array.isArray(t.voucher_type_ids)) {
                  voucherTypeIds = t.voucher_type_ids;
                } else {
                  try {
                    voucherTypeIds = JSON.parse(t.voucher_type_ids);
                  } catch (e) {
                    voucherTypeIds = [];
                  }
                }
              }
              if (
                Array.isArray(voucherTypeIds) &&
                voucherTypeIds.map(Number).includes(Number(voucherObj.id))
              ) {
                return t.is_active === 1 || t.is_active === true;
              }

              // Check if this voucher type is in private_voucher_type_ids array (for Private Charter)
              let privateVoucherTypeIds = [];
              if (t.private_voucher_type_ids) {
                if (Array.isArray(t.private_voucher_type_ids)) {
                  privateVoucherTypeIds = t.private_voucher_type_ids;
                } else {
                  try {
                    privateVoucherTypeIds = JSON.parse(
                      t.private_voucher_type_ids,
                    );
                  } catch (e) {
                    privateVoucherTypeIds = [];
                  }
                }
              }
              if (
                Array.isArray(privateVoucherTypeIds) &&
                privateVoucherTypeIds
                  .map(Number)
                  .includes(Number(voucherObj.id))
              ) {
                return t.is_active === 1 || t.is_active === true;
              }

              // Check if this voucher type is for Private Charter experience
              let experienceIds = [];
              if (t.experience_ids) {
                if (Array.isArray(t.experience_ids)) {
                  experienceIds = t.experience_ids;
                } else {
                  try {
                    experienceIds = JSON.parse(t.experience_ids);
                  } catch (e) {
                    experienceIds = [];
                  }
                }
              }
              if (
                chooseFlightType?.type === "Private Charter" &&
                Array.isArray(experienceIds) &&
                experienceIds.length > 0
              ) {
                return t.is_active === 1 || t.is_active === true;
              }

              // Check title match
              if (t.voucher_type_title) {
                const normalize = (s) =>
                  (s || "")
                    .toString()
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, " ");
                if (
                  normalize(t.voucher_type_title) ===
                  normalize(voucherObj.title)
                ) {
                  return t.is_active === 1 || t.is_active === true;
                }
              }

              // If no mapping info, skip
              return false;
            } catch (e) {
              return false;
            }
          });

          // Sort matches: 1) lowest sort_order; 2) newest updated_at
          matches.sort((a, b) => {
            const sortA = a.sort_order != null ? Number(a.sort_order) : 9999;
            const sortB = b.sort_order != null ? Number(b.sort_order) : 9999;
            if (sortA !== sortB) return sortA - sortB;
            const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
            const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
            return dateB - dateA; // newest first
          });

          const selectedTerms = matches.length > 0 ? matches[0].content : "";

          setTermsContent(selectedTerms || voucherObj.weatherClause || "");
        } else {
          setTermsContent(voucherObj.weatherClause || "");
        }
      } else {
        setTermsContent(voucherObj.weatherClause || "");
      }
    } catch (e) {
      setTermsContent(voucherObj.weatherClause || "");
    } finally {
      setTermsLoading(false);
      setShowTerms(true);
      // Notify parent component that terms loading is complete
      if (onTermsLoadingChange) {
        onTermsLoadingChange(false);
      }
    }
  };

  const handleSelectVoucher = async (voucher) => {
    // Reset Season Saver when selecting a non-Flexible-Weekday voucher
    if (voucher.title !== "Flexible Weekday" && setSeasonSaver) {
      setSeasonSaver(false);
    }
    const voucherWithQuantity = buildVoucherWithQuantity(voucher);

    setSelectedVoucher(voucherWithQuantity);

    if (disableTermsPopup) {
      setSelectedVoucherType(voucherWithQuantity);
      setShowTerms(false);
      setNotificationMessage(`${voucherWithQuantity?.title} Selected`);
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
      if (onTermsLoadingChange) {
        onTermsLoadingChange(false);
      }
      if (resolvedAutoAdvanceToSectionId && onSectionCompletion) {
        setTimeout(() => {
          onSectionCompletion("voucher-type");
        }, 50);
        setTimeout(() => {
          scrollToSectionById(resolvedAutoAdvanceToSectionId);
        }, 420);
      }
      return;
    }

    // Fetch Terms & Conditions for this voucher type from backend Settings
    try {
      setTermsLoading(true);
      // Notify parent component that terms loading started
      if (onTermsLoadingChange) {
        onTermsLoadingChange(true);
      }
      const res = await fetch(`${API_BASE_URL}/api/terms-and-conditions`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Find active terms mapped to this voucher type. Prefer lowest sort_order, then newest.
          const matches = json.data
            .filter((t) => {
              try {
                // Check if this voucher type is directly mapped
                if (
                  t.voucher_type_id &&
                  Number(t.voucher_type_id) === Number(voucher.id)
                ) {
                  return t.is_active === 1 || t.is_active === true;
                }

                // Check if this voucher type is in voucher_type_ids array
                let voucherTypeIds = [];
                if (t.voucher_type_ids) {
                  if (Array.isArray(t.voucher_type_ids)) {
                    voucherTypeIds = t.voucher_type_ids;
                  } else {
                    try {
                      voucherTypeIds = JSON.parse(t.voucher_type_ids);
                    } catch (e) {
                      voucherTypeIds = [];
                    }
                  }
                }
                if (
                  Array.isArray(voucherTypeIds) &&
                  voucherTypeIds.map(Number).includes(Number(voucher.id))
                ) {
                  return t.is_active === 1 || t.is_active === true;
                }

                // Check if this voucher type is in private_voucher_type_ids array (for Private Charter)
                let privateVoucherTypeIds = [];
                if (t.private_voucher_type_ids) {
                  if (Array.isArray(t.private_voucher_type_ids)) {
                    privateVoucherTypeIds = t.private_voucher_type_ids;
                  } else {
                    try {
                      privateVoucherTypeIds = JSON.parse(
                        t.private_voucher_type_ids,
                      );
                    } catch (e) {
                      privateVoucherTypeIds = [];
                    }
                  }
                }
                if (
                  Array.isArray(privateVoucherTypeIds) &&
                  privateVoucherTypeIds.map(Number).includes(Number(voucher.id))
                ) {
                  return t.is_active === 1 || t.is_active === true;
                }

                // Check if this voucher type is for Private Charter experience
                let experienceIds = [];
                if (t.experience_ids) {
                  if (Array.isArray(t.experience_ids)) {
                    experienceIds = t.experience_ids;
                  } else {
                    try {
                      experienceIds = JSON.parse(t.experience_ids);
                    } catch (e) {
                      experienceIds = [];
                    }
                  }
                }
                if (Array.isArray(experienceIds) && experienceIds.includes(2)) {
                  // 2 = Private Charter
                  // Check if this voucher type matches the selected voucher
                  let voucherTypeIds = [];
                  if (t.voucher_type_ids) {
                    if (Array.isArray(t.voucher_type_ids)) {
                      voucherTypeIds = t.voucher_type_ids;
                    } else {
                      try {
                        voucherTypeIds = JSON.parse(t.voucher_type_ids);
                      } catch (e) {
                        voucherTypeIds = [];
                      }
                    }
                  }

                  let privateVoucherTypeIds = [];
                  if (t.private_voucher_type_ids) {
                    if (Array.isArray(t.private_voucher_type_ids)) {
                      privateVoucherTypeIds = t.private_voucher_type_ids;
                    } else {
                      try {
                        privateVoucherTypeIds = JSON.parse(
                          t.private_voucher_type_ids,
                        );
                      } catch (e) {
                        privateVoucherTypeIds = [];
                      }
                    }
                  }

                  if (
                    Array.isArray(voucherTypeIds) &&
                    voucherTypeIds.map(Number).includes(Number(voucher.id))
                  ) {
                    return t.is_active === 1 || t.is_active === true;
                  }

                  if (
                    Array.isArray(privateVoucherTypeIds) &&
                    privateVoucherTypeIds
                      .map(Number)
                      .includes(Number(voucher.id))
                  ) {
                    return t.is_active === 1 || t.is_active === true;
                  }
                }

                return false;
              } catch {
                return false;
              }
            })
            .sort((a, b) => {
              const so = (a.sort_order ?? 0) - (b.sort_order ?? 0);
              if (so !== 0) return so;
              return (
                new Date(b.updated_at || b.created_at || 0) -
                new Date(a.updated_at || a.created_at || 0)
              );
            });
          const content = matches[0]?.content || "";
          setTermsContent(content);
        }
      }
    } catch (e) {
      setTermsContent(voucher.weatherClause || "");
    } finally {
      setTermsLoading(false);
      setShowTerms(true);
      // Notify parent component that terms loading is complete
      if (onTermsLoadingChange) {
        onTermsLoadingChange(false);
      }
    }
  };

  // Remove the condition that hides VoucherType for Private Charter
  // Both Shared Flight and Private Charter should be able to access voucher types

  return (
    <>
      {/* Notification for voucher type selection */}
      {showNotification && (
        <div
          style={{
            position: "fixed",
            [isMobile ? "top" : "bottom"]: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgb(3, 169, 244)",
            color: "white",
            padding: isMobile ? "8px 16px" : "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 9999,
            fontSize: isMobile ? "14px" : "16px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: isMobile
              ? "slideDown 0.3s ease-out"
              : "slideUp 0.3s ease-out",
            maxWidth: "90vw",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: isMobile ? "16px" : "18px" }}>✓</span>
          {notificationMessage}
        </div>
      )}

      <style>{scrollbarStyles}</style>
      {!disableTermsPopup && showTerms && selectedVoucher && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 2000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            className="modal-content"
            style={{
              background: "#ffffff",
              borderRadius: 12,
              maxWidth: 720,
              width: "92%",
              padding: "20px 24px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#111827",
                  textAlign: "center",
                }}
              >
                Terms & Conditions
              </h4>
            </div>
            <div
              style={{
                maxHeight: 360,
                overflowY: "auto",
                whiteSpace: "pre-line",
                color: "#374151",
                lineHeight: 1.6,
                fontSize: 14,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "12px 14px",
                background: "#f9fafb",
              }}
            >
              {termsLoading
                ? "Loading terms..."
                : termsContent || selectedVoucher?.weatherClause || ""}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
                marginTop: 16,
              }}
            >
              <button
                className="booking-shared-action-button"
                onClick={() => {
                  userDismissedTermsRef.current = true;
                  setShowTerms(false);
                }}
                style={{
                  flex: 1,
                  maxWidth: 220,
                  minHeight: 44,
                }}
              >
                Choose Different Voucher
              </button>
              <button
                className="booking-shared-action-button"
                onClick={() => {
                  setSelectedVoucherType(selectedVoucher);
                  userDismissedTermsRef.current = true;
                  setShowTerms(false);

                  // Google Ads: GA_Product_Selected (Stage 4)
                  const productType = selectedVoucher?.title || "";
                  const pricePoint =
                    selectedVoucher?.priceValue ?? selectedVoucher?.price ?? "";
                  if (productType)
                    trackProductSelected(productType, pricePoint);

                  // Show notification for voucher type selection after confirmation
                  setNotificationMessage(`${selectedVoucher?.title} Selected`);
                  setShowNotification(true);

                  // Auto-hide notification after 3 seconds
                  setTimeout(() => {
                    setShowNotification(false);
                  }, 3000);

                  // Trigger section completion after state update
                  setTimeout(() => {
                    if (onSectionCompletion) {
                      onSectionCompletion("voucher-type");
                    }
                  }, 300); // Longer delay to ensure state is fully updated
                }}
                style={{
                  flex: 1,
                  maxWidth: 220,
                  minHeight: 44,
                }}
                disabled={termsLoading}
              >
                Agree and Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      <Accordion
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              gap: "8px",
            }}
          >
            <span>Voucher Type</span>
          </div>
        }
        id="voucher-type"
        activeAccordion={activeAccordion}
        setActiveAccordion={setActiveAccordion}
        isDisabled={isDisabled}
      >
        {/* Have booking questions - compact section */}
        <div
          style={{
            background: "rgb(248, 250, 252)",
            padding: isMobile ? "12px 16px" : "16px 20px",
            borderRadius: "8px",
            margin: isMobile ? "0 0 16px 0" : "0 0 20px 0",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: isMobile ? "14px" : "15px",
              fontWeight: "200",
              color: "rgb(102, 102, 102)",
              marginBottom: "10px",
              margin: "0 0 10px 0",
            }}
          >
            Have booking questions?
          </p>

          <div
            style={{
              display: "flex",
              gap: isMobile ? "8px" : "12px",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="tel:+441823778127"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: isMobile ? "8px 14px" : "10px 16px",
                borderRadius: "6px",
                textDecoration: "none",
                color: "#03A9F4",
                boxShadow: "none",
                fontWeight: "500",
                fontSize: isMobile ? "13px" : "14px",
                transition: "transform 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                style={{ color: "#03A9F4" }}
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>+44 1823 778 127</span>
            </a>

            <a
              href="http://wa.me/message/CQZBMWVAP2LWM1"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: isMobile ? "8px 14px" : "10px 16px",
                borderRadius: "6px",
                textDecoration: "none",
                color: "#03A9F4",
                boxShadow: "none",
                fontWeight: "500",
                fontSize: isMobile ? "13px" : "14px",
                transition: "transform 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                style={{ color: "#03A9F4" }}
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span>Chat</span>
            </a>
          </div>
        </div>

        {/* Voucher Type Selection - wrapped with local container under panel */}
        <div style={{ width: "100%", maxWidth: 960, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              minHeight: "400px",
            }}
          >
            {/* Removed old left-side Private Charter weather refundable banner */}
            {(() => {
              if (
                privateCharterVoucherTypesLoading ||
                allVoucherTypesLoading ||
                activityDataLoading
              ) {
                return (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <h3 style={{ color: "#6b7280", marginBottom: "8px" }}>
                      Loading Voucher Types...
                    </h3>
                  </div>
                );
              }

              if (voucherTypes.length === 0) {
                return (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                      🎈
                    </div>
                    <h3 style={{ color: "#6b7280", marginBottom: "8px" }}>
                      No Voucher Types Available
                    </h3>
                    <p style={{ color: "#9ca3af" }}>
                      {chooseFlightType?.type === "Private Charter"
                        ? "No private charter voucher types are currently available for this location."
                        : "No shared flight voucher types are currently available for this location."}
                    </p>
                  </div>
                );
              }

              // For Private Charter, show navigation and all voucher types
              if (chooseFlightType?.type === "Private Charter") {
                const activeVouchers = voucherTypes.filter(
                  (vt) => vt.is_active !== false,
                );

                if (activeVouchers.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                      <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                        🎈
                      </div>
                      <h3 style={{ color: "#6b7280", marginBottom: "8px" }}>
                        No Active Voucher Types
                      </h3>
                      <p style={{ color: "#9ca3af" }}>
                        All private charter voucher types are currently
                        inactive.
                      </p>
                    </div>
                  );
                }

                // Desktop pagination helpers
                const pageSize = 2; // desktop shows 2 private charter vouchers per page
                const startIndex = currentViewIndex * pageSize;
                let vouchersToShow = [];

                // For mobile devices, show all vouchers in single container like PassengerInfo
                if (isMobile) {
                  return (
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      {/* Navigation Arrows - hidden on mobile (swipe only) */}

                      {/* Voucher Cards Container - Single container like PassengerInfo */}
                      <div
                        ref={voucherContainerRef}
                        className="voucher-cards-container"
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: "16px",
                          justifyContent: "flex-start",
                          alignItems: "stretch",
                          width: "100%",
                          overflowX: "auto",
                          overflowY: "visible",
                          paddingBottom:
                            activeVouchers.length > 1 ? "24px" : "10px",
                          paddingLeft: isMobile ? 16 : 0,
                          paddingRight: isMobile ? 16 : 0,
                          scrollBehavior: "smooth",
                          scrollSnapType: "x mandatory",
                          scrollPadding: isMobile ? "0 16px" : "0 8px",
                          WebkitOverflowScrolling: "touch",
                          overscrollBehaviorX: "contain",
                          overscrollBehaviorY: "auto",
                          position: "relative",
                          boxSizing: "border-box",
                        }}
                      >
                        {activeVouchers.map((voucher, index) => (
                          <div
                            key={voucher.id || index}
                            style={{
                              // Mobile: calc(100% - 12px) so next card peeks ~56px, current card keeps full usable width
                              width: isMobile ? "calc(100% - 12px)" : "auto",
                              minWidth: isMobile ? "calc(100% - 12px)" : "auto",
                              maxWidth: isMobile ? "calc(100% - 12px)" : "none",
                              flexShrink: 0,
                              scrollSnapAlign: "start",
                              display: "flex",
                              height: "100%",
                            }}
                          >
                            {renderVoucherCard({
                              voucher,
                              isSelected:
                                selectedVoucherType?.id === voucher.id,
                              onSelect: handleSelectVoucher,
                              quantities,
                              slideDirection,
                              shouldAnimate,
                            })}
                          </div>
                        ))}
                      </div>

                      {/* Pagination Dots (mobile) - match Select Experience */}
                      {isMobile && activeVouchers.length > 1 && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: -6,
                            left: "50%",
                            transform: "translateX(-50%)",
                            display: "flex",
                            gap: 8,
                          }}
                        >
                          {activeVouchers.map((_, i) => (
                            <div
                              key={i}
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background:
                                  i === currentItemIndex ? "#03a9f4" : "#ddd",
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                const container = voucherContainerRef.current;
                                if (!container) return;
                                const firstChild = container.children[0];
                                const gap = 16;
                                const itemWidth = firstChild
                                  ? firstChild.getBoundingClientRect().width +
                                    gap
                                  : container.clientWidth;
                                container.scrollTo({
                                  left: i * itemWidth,
                                  behavior: "smooth",
                                });
                                setCurrentItemIndex(i);
                                setCanScrollVouchersLeft(i > 0);
                                setCanScrollVouchersRight(
                                  i < activeVouchers.length - 1,
                                );
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  vouchersToShow = activeVouchers.slice(
                    startIndex,
                    startIndex + pageSize,
                  );
                }

                return (
                  <>
                    {/* Navigation Arrows - Desktop Only */}
                    {!isMobile && activeVouchers.length > pageSize && (
                      <>
                        {/* Left Arrow */}
                        {currentViewIndex > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              left: 20,
                              top: "50%",
                              transform: "translateY(-50%)",
                              zIndex: 10,
                              background: "rgba(255,255,255,0.9)",
                              borderRadius: "50%",
                              width: 40,
                              height: 40,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              border: "1px solid #ddd",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() =>
                              setCurrentViewIndex(
                                Math.max(0, currentViewIndex - 1),
                              )
                            }
                          >
                            <span
                              style={{
                                fontSize: 18,
                                color: "#666",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              ‹
                            </span>
                          </div>
                        )}

                        {/* Right Arrow */}
                        {startIndex + pageSize < activeVouchers.length && (
                          <div
                            style={{
                              position: "absolute",
                              right: 20,
                              top: "50%",
                              transform: "translateY(-50%)",
                              zIndex: 10,
                              background: "rgba(255,255,255,0.9)",
                              borderRadius: "50%",
                              width: 40,
                              height: 40,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              border: "1px solid #ddd",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() =>
                              setCurrentViewIndex(
                                Math.min(
                                  currentViewIndex + 1,
                                  Math.ceil(activeVouchers.length / pageSize) -
                                    1,
                                ),
                              )
                            }
                          >
                            <span
                              style={{
                                fontSize: 18,
                                color: "#666",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              ›
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Voucher Cards */}
                    <div
                      ref={isMobile ? voucherContainerRef : undefined}
                      className="voucher-cards-container"
                      style={{
                        display: "flex",
                        flexDirection: isMobile ? "row" : "row",
                        gap: isMobile ? "16px" : "20px",
                        justifyContent: isMobile ? "flex-start" : "center",
                        alignItems: "stretch",
                        width: "100%",
                        overflowX: isMobile ? "auto" : "visible",
                        paddingBottom: isMobile ? "10px" : "0",
                        scrollBehavior: "smooth",
                        scrollSnapType: isMobile ? "x mandatory" : "none",
                        scrollPadding: isMobile ? "0 6px" : "0",
                        WebkitOverflowScrolling: isMobile ? "touch" : undefined,
                        overscrollBehaviorX: isMobile ? "contain" : "auto",
                        overscrollBehaviorY: "auto",
                      }}
                    >
                      {vouchersToShow.map((voucher, index) => (
                        <div
                          key={`wrapper-${voucher.id || voucher.title || index}`}
                          style={{
                            // On mobile, match private charter width structure for consistency
                            width: isMobile ? "calc(100% - 0px)" : "auto",
                            minWidth: isMobile ? "calc(100% - 0px)" : "auto",
                            maxWidth: isMobile ? "calc(100% - 0px)" : "none",
                            display: "flex",
                            height: "100%",
                            flexShrink: 0,
                          }}
                        >
                          {renderVoucherCard({
                            voucher,
                            onSelect: handleSelectVoucher,
                            quantities,
                            isSelected: selectedVoucher?.id === voucher.id,
                            slideDirection,
                            shouldAnimate,
                          })}
                        </div>
                      ))}
                    </div>
                  </>
                );
              } else {
                // For Shared Flight, use existing logic
                const filteredVouchers = voucherTypes.filter(
                  (voucher) =>
                    availableVoucherTypes.length === 0 ||
                    availableVoucherTypes.includes(voucher.title),
                );

                if (filteredVouchers.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                      <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                        🎈
                      </div>
                      <h3 style={{ color: "#6b7280", marginBottom: "8px" }}>
                        No Available Voucher Types
                      </h3>
                      <p style={{ color: "#9ca3af" }}>
                        No voucher types are currently available for the
                        selected location.
                      </p>
                    </div>
                  );
                }

                // Desktop pagination: show 2 per page (third via next/back)
                const sfPageSize = 2;
                const sfStartIndex = currentViewIndex * sfPageSize;
                let vouchersToShow = [];

                // For mobile devices, show all vouchers for horizontal scroll
                if (isMobile) {
                  vouchersToShow = filteredVouchers;
                } else {
                  vouchersToShow = filteredVouchers.slice(
                    sfStartIndex,
                    sfStartIndex + sfPageSize,
                  );
                }

                return (
                  <>
                    {/* Navigation Arrows - Desktop only */}
                    {!isMobile && filteredVouchers.length > sfPageSize && (
                      <>
                        {/* Left Arrow */}
                        {currentViewIndex > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              left: 20,
                              top: "50%",
                              transform: "translateY(-50%)",
                              zIndex: 10,
                              background: "rgb(3, 169, 244)",
                              borderRadius: "50%",
                              width: 40,
                              height: 40,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() =>
                              setCurrentViewIndex(
                                Math.max(0, currentViewIndex - 1),
                              )
                            }
                          >
                            <ArrowBackIosIcon
                              style={{
                                fontSize: 20,
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            />
                          </div>
                        )}

                        {/* Right Arrow */}
                        {sfStartIndex + sfPageSize <
                          filteredVouchers.length && (
                          <div
                            style={{
                              position: "absolute",
                              right: 20,
                              top: "50%",
                              transform: "translateY(-50%)",
                              zIndex: 10,
                              background: "rgb(3, 169, 244)",
                              borderRadius: "50%",
                              width: 40,
                              height: 40,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() =>
                              setCurrentViewIndex(
                                Math.min(
                                  currentViewIndex + 1,
                                  Math.ceil(
                                    filteredVouchers.length / sfPageSize,
                                  ) - 1,
                                ),
                              )
                            }
                          >
                            <ArrowForwardIosIcon
                              style={{
                                fontSize: 20,
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* Navigation Arrows - hidden on mobile (swipe only) */}

                    {/* Voucher Cards */}
                    <div
                      ref={isMobile ? voucherContainerRef : undefined}
                      className="voucher-cards-container"
                      style={{
                        display: "flex",
                        flexDirection: isMobile ? "row" : "row",
                        gap: isMobile ? "12px" : "20px",
                        justifyContent: isMobile ? "flex-start" : "center",
                        alignItems: "stretch",
                        width: "100%",
                        overflowX: isMobile ? "auto" : "visible",
                        paddingBottom:
                          isMobile && filteredVouchers.length > 1
                            ? "24px"
                            : isMobile
                              ? "10px"
                              : "0",
                        paddingLeft: isMobile ? 8 : 0,
                        paddingRight: isMobile ? 8 : 0,
                        scrollBehavior: "smooth",
                        scrollSnapType: isMobile ? "x mandatory" : "none",
                        scrollPadding: isMobile ? "0 8px" : "0",
                        WebkitOverflowScrolling: isMobile ? "touch" : undefined,
                        overscrollBehaviorX: isMobile ? "contain" : "auto",
                        overscrollBehaviorY: "auto",
                        boxSizing: "border-box",
                      }}
                    >
                      {vouchersToShow.map((voucher, index) => (
                        <div
                          key={`wrapper-${voucher.id || voucher.title || index}`}
                          style={{
                            // Mobile: calc(100% - 12px) so next card peeks ~12px, current card keeps full usable width
                            width: isMobile ? "calc(100% - 12px)" : "auto",
                            minWidth: isMobile ? "calc(100% - 12px)" : "auto",
                            maxWidth: isMobile ? "calc(100% - 12px)" : "none",
                            display: "flex",
                            height: "100%",
                            flexShrink: 0,
                            scrollSnapAlign: isMobile ? "start" : undefined,
                          }}
                        >
                          {renderVoucherCard({
                            voucher,
                            onSelect: handleSelectVoucher,
                            quantities,
                            isSelected: selectedVoucher?.id === voucher.id,
                            slideDirection,
                            shouldAnimate,
                          })}
                        </div>
                      ))}
                    </div>

                    {/* Pagination Dots (Shared Flight mobile) - match Select Experience */}
                    {isMobile && filteredVouchers.length > 1 && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: -6,
                          left: "50%",
                          transform: "translateX(-50%)",
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        {filteredVouchers.map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background:
                                i === currentItemIndex ? "#03a9f4" : "#ddd",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              const container = voucherContainerRef.current;
                              if (!container) return;
                              const firstChild = container.children[0];
                              const gap = 12;
                              const itemWidth = firstChild
                                ? firstChild.getBoundingClientRect().width + gap
                                : container.clientWidth;
                              container.scrollTo({
                                left: i * itemWidth,
                                behavior: "smooth",
                              });
                              setCurrentItemIndex(i);
                              setCanScrollVouchersLeft(i > 0);
                              setCanScrollVouchersRight(
                                i < filteredVouchers.length - 1,
                              );
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                );
              }
            })()}
          </div>
        </div>

        {/* Reputation note under the whole voucher panel */}
        <div
          style={{
            width: "100%",
            maxWidth: 960,
            margin: "12px auto 0",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 500 }}>
            ★ Five-star rated by guests on Google, Facebook & TripAdvisor —
            you'll see why.
          </span>
        </div>
      </Accordion>

      {/* Capacity Warning Modal */}
      {showCapacityWarning && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 2000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            className="modal-content"
            style={{
              background: "#ffffff",
              borderRadius: 12,
              maxWidth: 420,
              width: "92%",
              padding: "20px 24px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h4
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "#dc3545",
                marginBottom: "12px",
              }}
            >
              Insufficient Capacity
            </h4>
            <p
              style={{
                color: "#374151",
                lineHeight: 1.5,
                fontSize: 16,
                marginBottom: "20px",
              }}
            >
              {availableCapacity === 1
                ? `Only ${availableCapacity} space is available for this date and time.`
                : `Only ${availableCapacity} spaces are available for this date and time.`}
            </p>
            <p
              style={{
                color: "#6b7280",
                lineHeight: 1.4,
                fontSize: 14,
                marginBottom: "20px",
              }}
            >
              Please select a different number of passengers or choose another
              date and time.
            </p>
            <button
              onClick={() => setShowCapacityWarning(false)}
              style={{
                background: "#dc3545",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: 8,
                cursor: "pointer",
                border: "none",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal removed */}
    </>
  );
};

// Custom comparison function to prevent re-render when only passengerCount changes
const areEqual = (prevProps, nextProps) => {
  // Compare all props except for chooseFlightType.passengerCount
  const prevFlightType = prevProps.chooseFlightType?.type;
  const nextFlightType = nextProps.chooseFlightType?.type;

  // Check if flight type changed (this should trigger re-render)
  if (prevFlightType !== nextFlightType) {
    return false;
  }

  // Check other props that should trigger re-render
  if (
    prevProps.activeAccordion !== nextProps.activeAccordion ||
    prevProps.selectedVoucherType !== nextProps.selectedVoucherType ||
    prevProps.activitySelect !== nextProps.activitySelect ||
    prevProps.chooseLocation !== nextProps.chooseLocation ||
    prevProps.selectedActivity !== nextProps.selectedActivity
  ) {
    return false;
  }

  // If none of the important props changed, don't re-render
  return true;
};

export default memo(VoucherType, areEqual);

// Mobile scroll bar styles + passenger row gaps (ships with bundle; fixes stale 4px on flyawayballooning-book.com)
const mobileScrollStyles = `
    @media (max-width: 576px) {
        /* Hide scrollbar for voucher cards container */
        .voucher-cards-container::-webkit-scrollbar {
            display: none;
        }
        .voucher-cards-container {
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
        }
        /* VoucherType card: label + (− / count / +) — was 4px on mobile in older builds */
        .voucher-type-passenger-row {
            gap: 8px !important;
        }
        .voucher-type-passenger-stepper {
            gap: 8px !important;
        }
    }
`;

// Add styles to document head
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = mobileScrollStyles;
  document.head.appendChild(styleElement);
}
