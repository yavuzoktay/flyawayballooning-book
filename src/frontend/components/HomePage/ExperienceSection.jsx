import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Accordion from "../Common/Accordion";
import { Link } from "react-router-dom";
import axios from "axios";
import { BsInfoCircle } from "react-icons/bs";
import sharedFlightImg from "../../../assets/images/shared-flight.jpg";
import privateCharterImg from "../../../assets/images/private-charter.jpg";
import config from "../../../config";
import { trackExperienceSelected } from "../../../utils/googleAdsTracking";
import {
  getPriorityImageProps,
  preloadImageUrls,
} from "../../../utils/preloadImages";

const weatherRefundableHoverTexts = {
  sharedFlight:
    "You can select a weather refund option for each passenger for an additional £47.50 per person. This option can be chosen when entering passenger information.",
  privateFlight:
    "You can make your experience weather refundable for an additional 10% of your experience cost. This option can be selected during the booking process.",
};

const API_BASE_URL = config.API_BASE_URL;

// Normalize image url coming from API (supports different field names and relative paths)
const getNormalizedImageUrl = (exp) => {
  const raw =
    exp?.image_url || exp?.image || exp?.imagePath || exp?.image_path || "";
  if (!raw) return "";
  try {
    const trimmed = String(raw).trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
      return trimmed;
    if (trimmed.startsWith("/uploads/")) return `${API_BASE_URL}${trimmed}`;
    if (trimmed.startsWith("uploads/")) return `${API_BASE_URL}/${trimmed}`;
    if (trimmed.startsWith("/")) return `${API_BASE_URL}${trimmed}`;
    return `${API_BASE_URL}/${trimmed}`;
  } catch (e) {
    console.warn("Failed to normalize experience image url:", raw, e);
    return "";
  }
};

const ExperienceSection = ({
  isRedeemVoucher,
  setChooseFlightType,
  addPassenger,
  setAddPassenger,
  activeAccordion,
  setActiveAccordion,
  setAvailableSeats,
  chooseLocation,
  isFlightVoucher,
  isGiftVoucher,
  onSectionCompletion,
  isDisabled = false,
}) => {
  // Safety check for required props - log error but don't return early to avoid hook violations
  const hasRequiredProps =
    setChooseFlightType &&
    setAddPassenger &&
    setActiveAccordion &&
    setAvailableSeats;
  if (!hasRequiredProps) {
    console.error("ExperienceSection: Missing required props", {
      setChooseFlightType: !!setChooseFlightType,
      setAddPassenger: !!setAddPassenger,
      setActiveAccordion: !!setActiveAccordion,
      setAvailableSeats: !!setAvailableSeats,
    });
  }

  const [selectedFlight, setSelectedFlight] = useState(null);
  const [locationPricing, setLocationPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [experiences, setExperiences] = useState([]);
  const [experiencesLoading, setExperiencesLoading] = useState(false);
  // Mobile carousel state for experiences
  const [currentExperienceIndex, setCurrentExperienceIndex] = useState(0);
  const [canScrollExperiencesLeft, setCanScrollExperiencesLeft] =
    useState(false);
  const [canScrollExperiencesRight, setCanScrollExperiencesRight] =
    useState(true);
  const experienceContainerRef = useRef(null);
  const experienceSnapTimeoutRef = useRef(null);

  // Terms & Conditions states
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsContent, setTermsContent] = useState("");
  const [termsLoading, setTermsLoading] = useState(false);

  // Function to fetch Terms & Conditions for experience type
  const fetchTermsForExperience = async (experienceType) => {
    try {
      setTermsLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/api/terms-and-conditions/experience/${experienceType}`,
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          // Get the first (highest priority) terms
          const terms = json.data[0];
          setTermsContent(terms.content || "");
          setShowTermsModal(true);
        } else {
          // Fallback to default terms
          setTermsContent("Terms and conditions will be displayed here.");
          setShowTermsModal(true);
        }
      } else {
        // Fallback to default terms
        setTermsContent("Terms and conditions will be displayed here.");
        setShowTermsModal(true);
      }
    } catch (error) {
      console.error("Error fetching terms for experience:", error);
      // Fallback to default terms
      setTermsContent("Terms and conditions will be displayed here.");
      setShowTermsModal(true);
    } finally {
      setTermsLoading(false);
    }
  };
  const [activitiesWithFlightTypes, setActivitiesWithFlightTypes] = useState(
    [],
  );

  // Mobile breakpoint
  const [isMobile, setIsMobile] = useState(false);

  // Notification state for experience selection
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const getExperienceItemWidth = useCallback((container) => {
    if (!container) return 0;
    const firstChild = container.children && container.children[0];
    const rectWidth = firstChild
      ? firstChild.getBoundingClientRect().width
      : container.clientWidth;
    const style = window.getComputedStyle(container);
    const gap = parseFloat(style.columnGap || style.gap || "0") || 0;
    return rectWidth + gap;
  }, []);

  const getExperienceScrollLeftForIndex = useCallback((container, index) => {
    if (!container) return 0;
    const itemWidth = getExperienceItemWidth(container);
    const maxScrollLeft = Math.max(
      container.scrollWidth - container.clientWidth,
      0,
    );
    if (!itemWidth) return 0;
    return Math.min(Math.max(index, 0) * itemWidth, maxScrollLeft);
  }, [getExperienceItemWidth]);

  // Sync arrows/dots while swiping experiences on mobile
  useEffect(() => {
    if (!isMobile) return;
    const container = experienceContainerRef.current;
    if (!container) return;

    let animationFrameId = null;
    const clearSnapTimeout = () => {
      if (experienceSnapTimeoutRef.current) {
        clearTimeout(experienceSnapTimeoutRef.current);
        experienceSnapTimeoutRef.current = null;
      }
    };

    const computeAndSet = () => {
      const itemCount = container.children.length;
      if (itemCount === 0) return;
      const itemWidth = getExperienceItemWidth(container);
      const maxScrollLeft = Math.max(
        container.scrollWidth - container.clientWidth,
        0,
      );
      const edgeThreshold = itemWidth > 0 ? itemWidth * 0.35 : 0;
      const rawIndex = itemWidth > 0 ? container.scrollLeft / itemWidth : 0;
      const nextIndex =
        maxScrollLeft > 0 &&
        maxScrollLeft - container.scrollLeft <= edgeThreshold
          ? itemCount - 1
          : Math.round(rawIndex);
      const clamped = Math.max(0, Math.min(nextIndex, itemCount - 1));
      setCurrentExperienceIndex((prev) => (prev === clamped ? prev : clamped));
      setCanScrollExperiencesLeft((prev) =>
        prev === (clamped > 0) ? prev : clamped > 0,
      );
      setCanScrollExperiencesRight((prev) =>
        prev === (clamped < itemCount - 1) ? prev : clamped < itemCount - 1,
      );
    };

    const snapToNearestCard = () => {
      const activeContainer = experienceContainerRef.current;
      if (!activeContainer || activeContainer.children.length === 0) return;

      const itemCount = activeContainer.children.length;
      const itemWidth = getExperienceItemWidth(activeContainer);
      const maxScrollLeft = Math.max(
        activeContainer.scrollWidth - activeContainer.clientWidth,
        0,
      );
      const edgeThreshold = itemWidth > 0 ? itemWidth * 0.35 : 0;
      const rawIndex =
        itemWidth > 0 ? activeContainer.scrollLeft / itemWidth : 0;
      const nextIndex =
        maxScrollLeft > 0 &&
        maxScrollLeft - activeContainer.scrollLeft <= edgeThreshold
          ? itemCount - 1
          : Math.round(rawIndex);
      const clamped = Math.max(0, Math.min(nextIndex, itemCount - 1));
      const targetLeft = getExperienceScrollLeftForIndex(
        activeContainer,
        clamped,
      );

      if (Math.abs(activeContainer.scrollLeft - targetLeft) > 2) {
        activeContainer.scrollTo({ left: targetLeft, behavior: "smooth" });
      }
    };

    const handleScroll = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(computeAndSet);
      clearSnapTimeout();
      experienceSnapTimeoutRef.current = setTimeout(snapToNearestCard, 90);
    };

    // initial
    computeAndSet();
    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      clearSnapTimeout();
    };
  }, [
    isMobile,
    experiences.length,
    getExperienceItemWidth,
    getExperienceScrollLeftForIndex,
  ]);

  const isBristol = useMemo(
    () => chooseLocation === "Bristol",
    [chooseLocation],
  );

  // Helper function to format price display
  const formatPriceDisplay = (price) => {
    // Remove unnecessary decimal zeros and format as integer if possible
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return "0";

    // If it's a whole number, display without decimals
    if (Number.isInteger(numPrice)) {
      return numPrice.toString();
    }

    // If it has decimals, remove trailing zeros
    return numPrice.toFixed(2).replace(/\.?0+$/, "");
  };

  const parseExperiencePrice = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const parsed = parseFloat(String(value).replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  };

  const parseExperienceSalePrice = (value) => {
    const parsed = parseExperiencePrice(value);
    if (parsed === null || parsed <= 0) return null;
    return parsed;
  };

  const buildExperiencePriceState = (originalPrice, salePrice) => {
    const resolvedOriginal = parseExperiencePrice(originalPrice);
    const resolvedSale = parseExperienceSalePrice(salePrice);
    const currentPrice =
      resolvedSale !== null ? resolvedSale : resolvedOriginal;

    return {
      originalPriceValue: resolvedOriginal,
      salePriceValue: resolvedSale,
      currentPriceValue: currentPrice,
      hasSalePrice: resolvedSale !== null,
    };
  };

  const lastFetchedLocationRef = useRef(null);

  // Fetch activities with flight types when location changes
  useEffect(() => {
    const fetchActivitiesWithFlightTypes = async () => {
      if (!chooseLocation) return;

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/activities/flight-types?location=${encodeURIComponent(chooseLocation)}`,
        );

        if (response.data.success) {
          setActivitiesWithFlightTypes(response.data.data);
        } else {
          console.error("Failed to fetch activities with flight types");
          setActivitiesWithFlightTypes([]);
        }
      } catch (error) {
        console.error("Error fetching activities with flight types:", error);
        setActivitiesWithFlightTypes([]);
      }
    };

    fetchActivitiesWithFlightTypes();
  }, [chooseLocation, API_BASE_URL]);

  // Fetch pricing data when location changes
  useEffect(() => {
    if (!chooseLocation) return;

    // Prevent duplicate fetches for the same location
    if (lastFetchedLocationRef.current === chooseLocation) return;
    lastFetchedLocationRef.current = chooseLocation;

    fetchLocationPricing();
  }, [chooseLocation, isBristol]);

  // Fetch experiences from API on component mount and when flight voucher status changes
  useEffect(() => {
    // Clear experiences first to prevent showing old images
    setExperiences([]);
    fetchExperiences();
  }, [isFlightVoucher, isGiftVoucher]);

  const fetchLocationPricing = async () => {
    if (!chooseLocation) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/locationPricing/${encodeURIComponent(chooseLocation)}`,
      );
      if (response.data.success) {
        setLocationPricing(response.data.data);
        // flight_type burada response.data.data.flight_type olarak gelir
      }
    } catch (error) {
      console.error("Error fetching location pricing:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create dynamic experiences based on location pricing and activity flight types
  const getExperiences = useMemo(() => {
    // Define experiencesArray first
    const sharedPriceState = buildExperiencePriceState(
      locationPricing?.shared_flight_from_price || 180,
      locationPricing?.shared_flight_from_sale_price,
    );
    const privatePriceState = buildExperiencePriceState(
      locationPricing?.private_charter_from_price || 900,
      locationPricing?.private_charter_from_sale_price,
    );
    const sharedPrice = sharedPriceState.currentPriceValue || 180;
    const privatePrice = privatePriceState.currentPriceValue || 900;

    // Calculate private flight prices based on group size
    const privatePrices = {
      2: privatePrice || 900,
      3: privatePrice ? Math.round(privatePrice * 1.5) : 1050,
      4: privatePrice ? Math.round(privatePrice * 2) : 1200,
      8: privatePrice ? Math.round(privatePrice * 2) : 1800,
    };

    const experiencesArray = [
      {
        title: "Shared Flight",
        img: sharedFlightImg,
        price: formatPriceDisplay(sharedPrice),
        priceValue: sharedPrice,
        originalPriceValue: sharedPriceState.originalPriceValue ?? sharedPrice,
        salePriceValue: sharedPriceState.salePriceValue,
        hasSalePrice: sharedPriceState.hasSalePrice,
        priceUnit: "pp",
        desc: "Join a Shared Flight with a maximum of 8 passengers. Perfect for Solo Travellers, Couples and Groups looking to Celebrate Special Occasions or Experience Ballooning.",
        details: [],
        maxFlight: "Max 8 per flight",
        passengerOptions: Array.from({ length: 8 }, (_, i) => i + 1), // Options 1 to 8
      },
      {
        title: "Private Charter",
        img: privateCharterImg,
        price: formatPriceDisplay(privatePrice || 900),
        priceValue: privatePrice || 900,
        originalPriceValue:
          privatePriceState.originalPriceValue || privatePrice || 900,
        salePriceValue: privatePriceState.salePriceValue,
        hasSalePrice: privatePriceState.hasSalePrice,
        priceUnit: "total",
        desc: "Private Charter balloon flights for 2,3,4 or 8 passengers. Mostly purchased for Significant Milestones, Proposals, Major Birthdays, Families or Groups of Friends.",
        details: [],
        maxFlight: "",
        passengerOptions: [2, 3, 4, 8],
        specialPrices: {
          2: privatePrice || 900, // Total price for 2 passengers
          3: privatePrice ? Math.round(privatePrice * 1.5) : 1050, // Total price for 3 passengers
          4: privatePrice ? Math.round(privatePrice * 2) : 1200, // Total price for 4 passengers
          8: privatePrice ? Math.round(privatePrice * 2) : 1800, // Total price for 8 passengers
        },
      },
    ];

    // If no locationPricing, return the basic experiences array
    if (!locationPricing) return experiencesArray;

    // Get allowed flight types from activities for this location
    let allowedFlightTypes = [];
    if (activitiesWithFlightTypes && Array.isArray(activitiesWithFlightTypes)) {
      allowedFlightTypes = activitiesWithFlightTypes
        .filter((activity) => activity && activity.location === chooseLocation)
        .flatMap((activity) => activity.experiences || [])
        .filter((type, index, arr) => arr.indexOf(type) === index); // Remove duplicates
    }

    if (isBristol) {
      allowedFlightTypes = ["Private Charter"];
    } else if (
      allowedFlightTypes.length === 0 &&
      locationPricing?.experiences
    ) {
      allowedFlightTypes = locationPricing.experiences;
    }

    // Filter experiences based on allowed flight types
    const filteredExperiences = experiencesArray.filter((experience) => {
      const isAllowed =
        allowedFlightTypes.length === 0 ||
        allowedFlightTypes.includes(experience.title);

      return isAllowed;
    });

    return filteredExperiences;
  }, [locationPricing, isBristol, activitiesWithFlightTypes, chooseLocation]);

  // Fetch experiences from API
  const fetchExperiences = async () => {
    setExperiencesLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/experiences`);
      if (response.data.success) {
        setExperiences(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching experiences:", error);
      // Fallback to default experiences if API fails
      setExperiences([]);
    } finally {
      setExperiencesLoading(false);
    }
  };

  // Cache-busting timestamp - only changes when experiences change
  const cacheTimestamp = useMemo(() => Date.now(), [experiences]);

  // Final experiences array - use API experiences if available, otherwise fallback to default
  const finalExperiences = useMemo(() => {
    // If experiences are loading, return empty to prevent showing old cached images
    if (experiencesLoading) {
      return [];
    }

    // Check if we have API experiences first
    if (experiences && experiences.length > 0) {
      // Get allowed flight types from activities for this location
      let allowedFlightTypes = [];
      if (
        activitiesWithFlightTypes &&
        Array.isArray(activitiesWithFlightTypes)
      ) {
        allowedFlightTypes = activitiesWithFlightTypes
          .filter(
            (activity) => activity && activity.location === chooseLocation,
          )
          .flatMap((activity) => activity.experiences || [])
          .filter((type, index, arr) => arr.indexOf(type) === index);
      }

      if (isBristol) {
        allowedFlightTypes = ["Private Charter"];
      } else if (
        allowedFlightTypes.length === 0 &&
        locationPricing?.experiences
      ) {
        allowedFlightTypes = locationPricing.experiences;
      }

      // Filter API experiences based on allowed flight types
      const filteredExperiences = experiences.filter((exp) => {
        const isAllowed =
          allowedFlightTypes.length === 0 ||
          allowedFlightTypes.includes(exp.title);
        return isAllowed;
      });

      if (filteredExperiences.length > 0) {
        return filteredExperiences.map((exp) => {
          // Get pricing from selected activity based on experience type
          let price = "";
          let originalPriceValue = null;
          let salePriceValue = null;
          let hasSalePrice = false;
          let priceUnit = "pp";

          if (locationPricing) {
            if (exp.title.toLowerCase().includes("shared")) {
              const sharedState = buildExperiencePriceState(
                locationPricing.shared_flight_from_price || 180,
                locationPricing.shared_flight_from_sale_price,
              );
              price = sharedState.currentPriceValue || 180;
              originalPriceValue = sharedState.originalPriceValue ?? price;
              salePriceValue = sharedState.salePriceValue;
              hasSalePrice = sharedState.hasSalePrice;
              priceUnit = "pp";
            } else if (exp.title.toLowerCase().includes("private")) {
              const privateState = buildExperiencePriceState(
                locationPricing.private_charter_from_price || 900,
                locationPricing.private_charter_from_sale_price,
              );
              price = privateState.currentPriceValue || 900;
              originalPriceValue = privateState.originalPriceValue ?? price;
              salePriceValue = privateState.salePriceValue;
              hasSalePrice = privateState.hasSalePrice;
              priceUnit = "total";
            }
          } else {
            // Fallback to default pricing
            if (exp.title.toLowerCase().includes("shared")) {
              price = 180;
              originalPriceValue = price;
              priceUnit = "pp";
            } else if (exp.title.toLowerCase().includes("private")) {
              price = 900;
              originalPriceValue = price;
              priceUnit = "total";
            }
          }

          // Only use API image, no fallback to prevent image flash
          // Add timestamp to image URL to prevent browser caching (timestamp only changes when experiences change)
          const apiImageUrl = getNormalizedImageUrl(exp);
          const imageUrlWithCache = apiImageUrl
            ? `${apiImageUrl}?v=${cacheTimestamp}`
            : null;

          return {
            title: exp.title,
            img: imageUrlWithCache, // Add cache-busting timestamp
            price: formatPriceDisplay(price),
            priceValue: price,
            originalPriceValue: originalPriceValue ?? price,
            salePriceValue: salePriceValue,
            hasSalePrice: hasSalePrice,
            priceUnit: priceUnit,
            desc: exp.description || "No description available",
            details: [],
            maxFlight: exp.max_passengers
              ? `Max ${exp.max_passengers} per flight`
              : "Max 8 per flight",
            passengerOptions: Array.from(
              { length: exp.max_passengers || 8 },
              (_, i) => i + 1,
            ),
          };
        });
      }
    }

    // Fallback to default experiences only if not loading
    return getExperiences;
  }, [
    experiences,
    experiencesLoading,
    locationPricing,
    isBristol,
    activitiesWithFlightTypes,
    chooseLocation,
    getExperiences,
    cacheTimestamp,
  ]);

  // Use finalExperiences instead of the old logic
  const filteredExperiences = finalExperiences || [];

  useEffect(() => {
    if (!filteredExperiences.length) return;

    preloadImageUrls(
      filteredExperiences.map((experience) => experience.img),
      { limit: Math.min(filteredExperiences.length, 4) },
    );
  }, [filteredExperiences]);

  // Debug: Log experiences data

  const handlePassengerChange = (index, value) => {
    if (!setAddPassenger) {
      console.error("setAddPassenger is not available");
      return;
    }

    if (!filteredExperiences || !Array.isArray(filteredExperiences)) {
      console.error("filteredExperiences is not available or not an array");
      return;
    }

    setAddPassenger((prev) => {
      const updatedPassengers = Array(filteredExperiences.length).fill(null); // Reset all selections
      updatedPassengers[index] = value ? parseInt(value) : null;
      return updatedPassengers;
    });
  };

  const handleSelectClick = (type, passengerCount, price, index) => {
    if (!passengerCount) {
      // If no passenger selected yet for Private Charter, default to minimum allowed
      if (type === "Private Charter") {
        passengerCount = 2;
      } else {
        console.error("No passenger count provided");
        return;
      }
    }

    // Safety check for experiences array
    if (!filteredExperiences || filteredExperiences.length === 0) {
      console.error("Experiences array is not available");
      return;
    }

    // Find the selected experience
    const selectedExp = filteredExperiences.find((exp) => exp.title === type);
    if (!selectedExp) {
      console.error("Selected experience not found:", type);
      return;
    }

    // Calculate the correct price using priceValue and priceUnit
    let finalPrice, totalPrice;
    const isPrivate = type === "Private Charter";

    if (isBristol && !isPrivate) {
      return;
    }

    if (isPrivate) {
      if (
        selectedExp.specialPrices &&
        selectedExp.specialPrices[passengerCount]
      ) {
        // Use special pricing if available (fallback experiences)
        const totalForGroup = selectedExp.specialPrices[passengerCount];
        totalPrice = totalForGroup;
        finalPrice = totalForGroup;
      } else {
        // Use priceValue and priceUnit from experience object
        const basePrice =
          selectedExp.priceValue || parseFloat(selectedExp.price || 0);
        const unit = selectedExp.priceUnit || "total";

        if (!basePrice || isNaN(basePrice)) {
          console.error("Private Charter pricing missing:", selectedExp);
          return;
        }

        if (unit === "total") {
          totalPrice = basePrice; // already total price
          finalPrice = basePrice;
        } else {
          totalPrice = basePrice * passengerCount; // per person
          finalPrice = basePrice;
        }
      }
    } else {
      // Shared Flight - use priceValue if available, otherwise fallback
      const basePrice =
        selectedExp.priceValue || parseFloat(selectedExp.price || 0);
      if (!basePrice || isNaN(basePrice)) {
        console.error("Shared Flight pricing missing:", selectedExp);
        return;
      }
      finalPrice = basePrice;
      totalPrice = basePrice * passengerCount;
    }

    const flightData = {
      type,
      passengerCount,
      price: finalPrice,
      totalPrice: totalPrice,
    };

    setSelectedFlight(flightData);

    if (setChooseFlightType) {
      setChooseFlightType(flightData);
    } else {
      console.error("setChooseFlightType is not available");
    }

    // Google Ads: GA_Experience_Selected (Stage 3) - Shared flight | Private flight
    const experienceType = type === "Private Charter" ? "private" : "shared";
    trackExperienceSelected(experienceType);

    // Show notification for experience selection
    setNotificationMessage(`${flightData.type} Selected`);
    setShowNotification(true);

    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);

    // Terms & Conditions modal removed from ExperienceSection
    // It will be shown in VoucherType component instead

    // Trigger section completion after state update
    setTimeout(() => {
      if (onSectionCompletion) {
        onSectionCompletion("experience");
      }
    }, 300); // Longer delay to ensure state is fully updated
  };

  // Debug logging for troubleshooting
  if (filteredExperiences.length === 0) {
  } else {
  }

  return (
    <>
      {/* Notification for experience selection */}
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

      <style>
        {`
                    .experience-scroll-outer {
                        overflow-x: hidden;
                        width: 100%;
                        max-width: 100%;
                        scrollbar-width: thin;
                        scrollbar-color: #666 #f1f1f1;
                        -webkit-overflow-scrolling: touch;
                    }
                    
                    .experience-scroll-outer::-webkit-scrollbar {
                        height: 8px;
                        width: 8px;
                    }
                    
                    .experience-scroll-outer::-webkit-scrollbar-track {
                        background: #f1f1f1;
                        border-radius: 4px;
                        margin: 0 1px;
                    }
                    
                    .experience-scroll-outer::-webkit-scrollbar-thumb {
                        background: #666;
                        border-radius: 4px;
                    }
                    
                    .experience-scroll-outer::-webkit-scrollbar-thumb:hover {
                        background: #555;
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
                `}
      </style>

      {!hasRequiredProps && (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#ffebee",
            color: "#c62828",
            borderRadius: "8px",
            margin: "20px",
            textAlign: "center",
          }}
        >
          <strong>Error:</strong> ExperienceSection is missing required props.
          Please check the console for details.
        </div>
      )}

      <Accordion
        title="Select Experience"
        id="experience"
        activeAccordion={activeAccordion}
        setActiveAccordion={setActiveAccordion}
        isDisabled={isDisabled}
      >
        {isMobile ? (
          // Mobile: horizontal layout with arrows and dots
          <div style={{ position: "relative", width: "100%" }}>
            {/* Left Arrow - hidden on mobile */}
            {!isMobile && canScrollExperiencesLeft && (
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  background: "rgb(3, 169, 244)",
                  borderRadius: "50%",
                  width: isMobile ? 36 : 56,
                  height: isMobile ? 36 : 56,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
                  border: "none",
                }}
                onClick={() => {
                  const container = experienceContainerRef.current;
                  if (!container) return;
                  container.scrollTo({
                    left: Math.max(
                      0,
                      container.scrollLeft - getExperienceItemWidth(container),
                    ),
                    behavior: "smooth",
                  });
                }}
              >
                <span
                  style={{
                    fontSize: isMobile ? 27 : 32,
                    color: "#fff",
                    margin: 0,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: isMobile ? "-3px" : "0px",
                  }}
                >
                  ‹
                </span>
              </div>
            )}
            {/* Right Arrow - hidden on mobile */}
            {!isMobile && canScrollExperiencesRight && (
              <div
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  background: "rgb(3, 169, 244)",
                  borderRadius: "50%",
                  width: isMobile ? 36 : 56,
                  height: isMobile ? 36 : 56,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
                  border: "none",
                }}
                onClick={() => {
                  const container = experienceContainerRef.current;
                  if (!container) return;
                  container.scrollTo({
                    left:
                      container.scrollLeft + getExperienceItemWidth(container),
                    behavior: "smooth",
                  });
                }}
              >
                <span
                  style={{
                    fontSize: isMobile ? 27 : 32,
                    color: "#fff",
                    margin: 0,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: isMobile ? "-3px" : "0px",
                  }}
                >
                  ›
                </span>
              </div>
            )}

            <div
              className="experience-scroll-outer"
              style={{
                width: "100%",
                padding: "0 8px",
                margin: "0 -8px",
              }}
            >
              <div
                ref={experienceContainerRef}
                className="experience-cards-container"
                style={{
                  display: "flex",
                  gap: "12px",
                  width: "100%",
                  padding: "0 8px",
                  overflowX: "auto",
                  overflowY: "hidden",
                  WebkitOverflowScrolling: "touch",
                  scrollSnapType: "x mandatory",
                  scrollPadding: "0 8px",
                  touchAction: "pan-x pinch-zoom",
                  overscrollBehaviorX: "contain",
                  overscrollBehaviorY: "auto",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {filteredExperiences && filteredExperiences.length > 0 ? (
                  filteredExperiences.map((experience, index) => (
                    <div
                      key={index}
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        width: "calc(100% - 12px)",
                        minWidth: "calc(100% - 12px)",
                        maxWidth: "calc(100% - 12px)",
                        // Reduce overall card height on mobile
                        minHeight: 380,
                        flexShrink: 0,
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        scrollSnapAlign: "start",
                        scrollSnapStop: "always",
                      }}
                    >
                      {experience.img ? (
                        <img
                          src={experience.img}
                          alt={experience.title}
                          {...getPriorityImageProps(index, 3)}
                          // Reduce image height to make the card shorter on mobile
                          style={{
                            width: "100%",
                            height: 120,
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            // Hide image on error (blocked, 404, etc.) to prevent loading delays
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: 120,
                            backgroundColor: "#f3f4f6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#9ca3af",
                            fontSize: 14,
                          }}
                        >
                          Loading...
                        </div>
                      )}
                      <div
                        style={{
                          padding: "10px",
                          width: "100%",
                          boxSizing: "border-box",
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                        }}
                      >
                        <h2
                          style={{
                            fontSize: 18,
                            fontWeight: 500,
                            margin: 0,
                            marginBottom: 4,
                            color: "#4a4a4a",
                          }}
                        >
                          {experience.title}
                        </h2>
                        <div
                          style={{
                            borderBottom: "1px solid #e0e0e0",
                            margin: "4px 0 8px 0",
                          }}
                        />
                        <div
                          style={{
                            fontSize: 13,
                            color: "#444",
                            marginBottom: 6,
                            lineHeight: "1.3",
                            flex: "1",
                          }}
                        >
                          {experience.desc}
                        </div>
                        <div
                          style={{
                            fontWeight: 500,
                            fontSize: 15,
                            marginBottom: 20,
                          }}
                        >
                          {experience.hasSalePrice ? (
                            <>
                              <span
                                style={{
                                  textDecoration: "line-through",
                                  color: "#9ca3af",
                                  marginRight: 8,
                                }}
                              >
                                {experience.title === "Shared Flight"
                                  ? `From £${formatPriceDisplay(experience.originalPriceValue)} per person`
                                  : `From £${formatPriceDisplay(experience.originalPriceValue)} per flight`}
                              </span>
                              <span>
                                {experience.title === "Shared Flight"
                                  ? `From £${experience.price} per person`
                                  : `From £${experience.price} per flight`}
                              </span>
                            </>
                          ) : experience.title === "Shared Flight" ? (
                            `From £${experience.price} per person`
                          ) : (
                            `From £${experience.price} per flight`
                          )}
                        </div>
                        <button
                          style={{
                            width: "100%",
                            background: "#00eb5b",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "8px 0",
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: "pointer",
                            marginTop: "auto",
                            marginBottom: 0,
                            transition: "background 0.2s",
                          }}
                          onClick={() => {
                            // Use the first valid passenger count for each experience type
                            const defaultPassengerCount =
                              Array.isArray(experience.passengerOptions) &&
                              experience.passengerOptions.length > 0
                                ? experience.passengerOptions[0]
                                : experience.max_passengers || 1;
                            const priceNumber = parseFloat(
                              experience.priceValue,
                            );

                            handleSelectClick(
                              experience.title,
                              defaultPassengerCount,
                              priceNumber,
                              index,
                            );
                          }}
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{ width: "100%", textAlign: "center", padding: 20 }}
                  >
                    {experiencesLoading
                      ? "Loading experiences..."
                      : "No experiences available."}
                  </div>
                )}
              </div>
            </div>

            {/* Dots */}
            {filteredExperiences && filteredExperiences.length > 1 && (
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
                {filteredExperiences.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background:
                        i === currentExperienceIndex ? "#03a9f4" : "#ddd",
                    }}
                    onClick={() => {
                      const container = experienceContainerRef.current;
                      if (!container) return;
                      container.scrollTo({
                        left: getExperienceScrollLeftForIndex(container, i),
                        behavior: "smooth",
                      });
                      setCurrentExperienceIndex(i);
                      setCanScrollExperiencesLeft(i > 0);
                      setCanScrollExperiencesRight(
                        i < container.children.length - 1,
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Desktop: original flexbox layout
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
              width: "100%",
              justifyContent: "flex-start",
            }}
          >
            {filteredExperiences && filteredExperiences.length > 0 ? (
              filteredExperiences.map((experience, index) => (
                <div
                  key={index}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                    width: "calc(50% - 10px)",
                    minWidth: "260px",
                    maxWidth: "400px",
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    flex: "1",
                  }}
                >
                  {experience.img ? (
                    <img
                      src={experience.img}
                      alt={experience.title}
                      {...getPriorityImageProps(index, 2)}
                      style={{ width: "100%", height: 160, objectFit: "cover" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: 160,
                        backgroundColor: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#9ca3af",
                        fontSize: 14,
                      }}
                    >
                      Loading...
                    </div>
                  )}
                  <div
                    style={{
                      padding: "20px 20px 16px 20px",
                      width: "100%",
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: 18,
                        fontWeight: 500,
                        margin: 0,
                        marginBottom: 6,
                        color: "#4a4a4a",
                      }}
                    >
                      {experience.title}
                    </h2>
                    <div
                      style={{
                        borderBottom: "1px solid #e0e0e0",
                        margin: "6px 0 12px 0",
                      }}
                    />
                    <div
                      style={{
                        fontSize: 14,
                        color: "#444",
                        marginBottom: 12,
                        lineHeight: "1.4",
                        flex: "1",
                      }}
                    >
                      {experience.desc}
                    </div>
                    <div
                      style={{
                        fontWeight: 500,
                        fontSize: 15,
                        marginBottom: 12,
                      }}
                    >
                      {experience.hasSalePrice ? (
                        <>
                          <span
                            style={{
                              textDecoration: "line-through",
                              color: "#9ca3af",
                              marginRight: 8,
                            }}
                          >
                            {experience.title === "Shared Flight"
                              ? `From £${formatPriceDisplay(experience.originalPriceValue)} per person`
                              : `From £${formatPriceDisplay(experience.originalPriceValue)} per flight`}
                          </span>
                          <span>
                            {experience.title === "Shared Flight"
                              ? `From £${experience.price} per person`
                              : `From £${experience.price} per flight`}
                          </span>
                        </>
                      ) : experience.title === "Shared Flight" ? (
                        `From £${experience.price} per person`
                      ) : (
                        `From £${experience.price} per flight`
                      )}
                    </div>
                    <button
                      style={{
                        width: "100%",
                        background: "#00eb5b",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 0",
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: "pointer",
                        marginTop: 6,
                        marginBottom: 0,
                        transition: "background 0.2s",
                      }}
                      onClick={() => {
                        // Use the first valid passenger count for each experience type
                        const defaultPassengerCount =
                          Array.isArray(experience.passengerOptions) &&
                          experience.passengerOptions.length > 0
                            ? experience.passengerOptions[0]
                            : experience.max_passengers || 1;
                        const priceNumber = parseFloat(experience.priceValue);

                        handleSelectClick(
                          experience.title,
                          defaultPassengerCount,
                          priceNumber,
                          index,
                        );
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ width: "100%", textAlign: "center", padding: 20 }}>
                {experiencesLoading
                  ? "Loading experiences..."
                  : "No experiences available."}
              </div>
            )}
          </div>
        )}
      </Accordion>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
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
              {termsLoading ? "Loading terms..." : termsContent}
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
                onClick={() => setShowTermsModal(false)}
                style={{
                  minWidth: 120,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExperienceSection;
