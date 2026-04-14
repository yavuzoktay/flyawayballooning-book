import axios from "axios";
import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Divider,
  Button,
} from "@mui/material";
import {
  SiVisa,
  SiAmericanexpress,
  SiApplepay,
} from "react-icons/si";
import { FcGoogle } from "react-icons/fc";

import config from "../../../config";
import { getGoogleAdsIdsForCheckout } from "../../../utils/googleAdsTracking";
import { navigateToMainSite } from "../../../utils/crossDomainNavigation";
const API_BASE_URL = config.API_BASE_URL;

const stripePromise = loadStripe(config.STRIPE_PUBLIC_KEY);

const RightInfoCard = ({
  activitySelect,
  chooseLocation,
  chooseFlightType,
  chooseAddOn,
  passengerData,
  additionalInfo,
  recipientDetails,
  selectedDate,
  selectedTime,
  activeAccordion,
  setActiveAccordion,
  isFlightVoucher,
  isRedeemVoucher,
  isGiftVoucher,
  voucherCode,
  resetBooking,
  preference,
  validateBuyGiftFields,
  selectedVoucherType,
  voucherStatus,
  voucherData,
  privateCharterWeatherRefund,
  activityId,
  onBook,
  seasonSaver,
  hideAddOnsSection = false,
  hideAdditionalInfoSection = false,
  hiddenSectionIds = [],
}) => {
  // IMMEDIATE DEBUG LOG TO TEST IF COMPONENT RENDERS

  // Force immediate debug for Buy Gift
  if (activitySelect === "Buy Gift") {
  }

  // Mobile breakpoint + drawer state
  const [isMobile, setIsMobile] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [successModalOpen, setSuccessModalOpen] = React.useState(false);
  const [successModalData, setSuccessModalData] = React.useState(null);
  const summaryScrollRef = React.useRef(null);
  const hasAutoScrolledSummaryRef = React.useRef(false);
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 576);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  // Prevent background scroll when drawer is open
  React.useEffect(() => {
    if (isDrawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isDrawerOpen]);

  // Function to format date
  const formatDate = (date) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formattedDate = new Date(date).toLocaleDateString("en-US", options);

    // Get the day of the month
    const day = new Date(date).getDate();

    // Function to get the correct ordinal suffix for the day
    const getOrdinalSuffix = (day) => {
      if (day > 3 && day < 21) return "th";
      switch (day % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    // Adding the ordinal suffix to the day
    const formattedDay = day + getOrdinalSuffix(day);

    // Replace the day with the formatted day with suffix
    return formattedDate.replace(day, formattedDay);
  };

  // Function to format date with time
  const formatDateWithTime = (date, time) => {
    if (!date || !time) return "";

    const formattedDate = formatDate(date);
    return `${formattedDate} at ${time}`;
  };

  // Calculate total price
  const flightTypePrice = chooseFlightType?.totalPrice || 0;

  // Calculate voucher type price dynamically based on current quantity and base price
  let voucherTypePrice = 0;
  if (selectedVoucherType) {
    const isPrivateCharter = chooseFlightType?.type === "Private Charter";
    if (isPrivateCharter) {
      // Private charter prices from Shopify/booking are already total for the group
      voucherTypePrice =
        selectedVoucherType.totalPrice ??
        selectedVoucherType.price ??
        selectedVoucherType.basePrice ??
        0;
    } else if (selectedVoucherType.priceUnit === "total") {
      // For total pricing, use the price as is
      voucherTypePrice = selectedVoucherType.price;
    } else {
      // For per-person pricing, calculate based on quantity and base price
      const basePrice =
        selectedVoucherType.basePrice || selectedVoucherType.price;
      const quantity = selectedVoucherType.quantity || 1;
      voucherTypePrice = basePrice * quantity;
    }
  }
  const addOnPrice = chooseAddOn.reduce((total, addOn) => {
    return total + (addOn.price !== "TBC" ? parseFloat(addOn.price) : 0); // Ignore "TBC" prices
  }, 0); // Opsiyonel - boş array ise 0 döner

  // Weather Refundable price calculation
  let weatherRefundPrice = 0;

  if (
    chooseFlightType?.type === "Private Charter" &&
    privateCharterWeatherRefund
  ) {
    // For Private Charter: One-time charge of 10% of voucher type price
    const voucherPrice = selectedVoucherType?.price || 0;
    weatherRefundPrice = voucherPrice * 0.1;
  } else {
    // For Shared Flight: £47.50 per passenger
    // Check if it's Any Day Flight with Weather Refundable enabled
    const isAnyDayFlight =
      selectedVoucherType?.title &&
      selectedVoucherType.title.toLowerCase().includes("any day");
    const isSharedFlight = chooseFlightType?.type === "Shared Flight";
    const weatherRefundEnabled =
      isSharedFlight &&
      isAnyDayFlight &&
      Array.isArray(passengerData) &&
      passengerData.some((p) => p && p.weatherRefund);

    if (weatherRefundEnabled && selectedVoucherType?.quantity) {
      weatherRefundPrice = selectedVoucherType.quantity * 47.5;
    } else {
      weatherRefundPrice = 0;
    }
  }

  // Calculate total price based on activity type and selections
  let totalPrice = 0;

  if (activitySelect === "Book Flight") {
    // For Book Flight, only include voucher type price and add-ons
    totalPrice =
      parseFloat(voucherTypePrice) +
      parseFloat(addOnPrice) +
      weatherRefundPrice;
  } else if (
    activitySelect === "Flight Voucher" ||
    activitySelect === "Buy Gift"
  ) {
    // For Flight Voucher and Buy Gift, only show total when voucher type is selected
    if (selectedVoucherType) {
      const isPrivateCharter = chooseFlightType?.type === "Private Charter";
      const vtPrice = isPrivateCharter
        ? (selectedVoucherType?.totalPrice ?? selectedVoucherType?.price ?? 0)
        : voucherTypePrice;
      totalPrice =
        parseFloat(vtPrice) + parseFloat(addOnPrice) + weatherRefundPrice;
    }
  } else if (activitySelect === "Redeem Voucher") {
    // For Redeem Voucher, total price should be 0 since voucher covers the cost
    // Only add-ons and weather refund should be charged
    totalPrice = parseFloat(addOnPrice) + weatherRefundPrice;
  } else {
    // For other activity types, include all components
    totalPrice =
      parseFloat(flightTypePrice) +
      parseFloat(voucherTypePrice) +
      parseFloat(addOnPrice) +
      weatherRefundPrice;
  }
  const [animatedTotal, setAnimatedTotal] = React.useState(0);
  React.useEffect(() => {
    const target = Number(totalPrice) || 0;
    const start = Number(animatedTotal) || 0;
    if (Math.abs(target - start) < 0.01) {
      setAnimatedTotal(target);
      return;
    }
    const duration = 420;
    const startedAt = performance.now();
    let rafId = null;
    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedTotal(start + (target - start) * eased);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [totalPrice]);

  // Helper to check if an object is non-empty
  const isNonEmptyObject = (obj) =>
    obj && typeof obj === "object" && Object.keys(obj).length > 0;

  // Helper to check if recipient details are complete for Buy Gift
  const isRecipientDetailsValid = (details) => {
    if (!details || typeof details !== "object") {
      return false;
    }

    // Check each field individually with proper null/undefined checks
    const hasName =
      details.name &&
      typeof details.name === "string" &&
      details.name.trim() !== "";
    const hasEmail =
      details.email &&
      typeof details.email === "string" &&
      details.email.trim() !== "";
    const hasPhone =
      typeof details.phone === "string" && details.phone.length > 0;
    const hasDate =
      details.date &&
      typeof details.date === "string" &&
      details.date.trim() !== "";

    // Email format validation (optional field)
    let emailFormatValid = true;
    if (hasEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      emailFormatValid = emailRegex.test(details.email.trim());
    }

    // Phone validation: optional but must not be whitespace-only if provided
    let phoneValid = true;
    if (hasPhone && !details.phone.trim()) {
      phoneValid = false;
    }

    // Date format validation (required)
    let dateFormatValid = true;
    if (hasDate) {
      const dateValue = new Date(details.date);
      dateFormatValid = !isNaN(dateValue.getTime());
    }

    // For Buy Gift: only Recipient Name and Gift Date are required.
    const isComplete =
      hasName && hasDate && emailFormatValid && phoneValid && dateFormatValid;

    return isComplete;
  };
  // Helper to check if an array is non-empty
  const isNonEmptyArray = (arr) => Array.isArray(arr) && arr.length > 0;

  // Helper to check additionalInfo completion state
  // Rule:
  // - If there are required questions, ALL required must be provided
  // - If there are NO required questions, only mark as completed when the user has provided at least one answer
  // - If no info yet, not completed (prevents momentary tick before questions load)
  const isAdditionalInfoValid = (info) => {
    if (!info || typeof info !== "object") return false;
    const requiredKeys = Array.isArray(info.__requiredKeys)
      ? info.__requiredKeys
      : [];
    if (requiredKeys.length > 0) {
      return requiredKeys.every((k) => {
        const v = info[k];
        return typeof v === "string"
          ? v.trim() !== ""
          : v !== undefined && v !== null && v !== false;
      });
    }
    // When nothing is required, consider it complete only if at least one answer exists
    const answerKeys = Object.keys(info).filter((k) =>
      k.startsWith("question_"),
    );
    return answerKeys.some((k) => {
      const v = info[k];
      return typeof v === "string"
        ? v.trim() !== ""
        : v !== undefined && v !== null && v !== false;
    });
  };

  // Book button enable logic:
  // - Redeem Voucher: only require main fields (already handled)
  // - Flight Voucher: require chooseFlightType, passengerData (at least one with firstName), additionalInfo, recipientDetails
  // - Buy Gift: require chooseFlightType, passengerData (at least one with firstName), additionalInfo, recipientDetails
  // - Book Flight: require all fields including complete passenger information
  // Note: chooseAddOn (Add To Booking) is now optional for all activity types
  const hasPassenger =
    Array.isArray(passengerData) &&
    passengerData.some((p) => p.firstName && p.firstName.trim() !== "");

  // Enhanced passenger validation for Book Flight
  // Validation rules:
  // - Passenger 1 (index 0): firstName, lastName, weight, phone, email (all required)
  // - Passenger 2+ (index 1+): firstName, lastName, weight (phone and email not required)
  const isPassengerInfoComplete =
    Array.isArray(passengerData) &&
    passengerData.every((passenger, index) => {
      const isFirstPassenger = index === 0;

      // All passengers need: firstName, lastName, weight
      const basicInfoValid =
        passenger.firstName &&
        passenger.firstName.trim() !== "" &&
        passenger.lastName &&
        passenger.lastName.trim() !== "" &&
        passenger.weight &&
        (typeof passenger.weight === "string"
          ? passenger.weight.trim() !== ""
          : passenger.weight !== null && passenger.weight !== undefined);

      // Only first passenger needs: phone and email (with countryCode)
      const contactInfoValid = isFirstPassenger
        ? passenger.phone &&
          passenger.phone.trim() !== "" &&
          (passenger.countryCode || "+44") &&
          passenger.email &&
          passenger.email.trim() !== ""
        : true;

      const isValid = basicInfoValid && contactInfoValid;

      // Debug logging for passenger validation
      if (!isValid) {
      }

      return isValid;
    });

  // Debug logging for passenger validation

  // Special validation for Buy Gift (no weight required, contact info only required for first passenger)
  const isBuyGiftPassengerComplete = (() => {
    if (!Array.isArray(passengerData)) {
      return false;
    }

    if (passengerData.length === 0) {
      return false;
    }

    const isComplete = passengerData.every((passenger, index) => {
      const isFirstPassenger = index === 0;

      // All passengers need: firstName, lastName (no weight for Buy Gift)
      const basicInfoValid =
        passenger.firstName &&
        passenger.firstName.trim() !== "" &&
        passenger.lastName &&
        passenger.lastName.trim() !== "";

      // Only first passenger needs: phone (email no longer required for Purchaser Information)
      const contactInfoValid = isFirstPassenger
        ? passenger.phone && passenger.phone.trim() !== ""
        : true;

      const passengerValid = basicInfoValid && contactInfoValid;

      return passengerValid;
    });

    return isComplete;
  })();

  const isBookDisabled = isRedeemVoucher
    ? !(
        (
          activitySelect &&
          voucherCode &&
          String(voucherCode).trim() &&
          voucherStatus === "valid" &&
          chooseLocation &&
          chooseFlightType &&
          selectedVoucherType &&
          selectedDate &&
          selectedTime &&
          isPassengerInfoComplete
        )
        // additionalInfo is optional for Redeem Voucher
        // Flight Type green tick = voucherStatus valid; Book disabled when tick missing
      )
    : isFlightVoucher
      ? !(
          (
            chooseFlightType &&
            selectedVoucherType &&
            isPassengerInfoComplete &&
            (hideAdditionalInfoSection || isAdditionalInfoValid(additionalInfo))
          )
          // chooseAddOn artık opsiyonel - isNonEmptyArray(chooseAddOn) kaldırıldı
        )
      : isGiftVoucher
        ? !(
            chooseFlightType &&
            selectedVoucherType &&
            // chooseAddOn artık opsiyonel - isNonEmptyArray(chooseAddOn) kaldırıldı
            isBuyGiftPassengerComplete &&
            // isAdditionalInfoValid(additionalInfo) - now optional for Buy Gift
            isRecipientDetailsValid(recipientDetails)
          )
        : !(
            activitySelect &&
            chooseLocation &&
            chooseFlightType &&
            selectedVoucherType &&
            // chooseAddOn artık opsiyonel - isNonEmptyArray(chooseAddOn) kaldırıldı
            isPassengerInfoComplete &&
            // Enforce Additional Information required fields dynamically
            (hideAdditionalInfoSection ||
              isAdditionalInfoValid(additionalInfo)) &&
            selectedDate &&
            selectedTime
          );

  // IMMEDIATE BUY GIFT CONDITIONS CHECK
  // Define variables outside the if block for proper scope
  let strictValidation = false;
  let buyGiftShouldBeEnabled = false;

  if (isGiftVoucher) {
    const condition1 = !!chooseFlightType;
    const condition2 = !!selectedVoucherType;
    const condition3 = isBuyGiftPassengerComplete;
    const condition4 = isAdditionalInfoValid(additionalInfo); // This stays optional
    const condition5 = isRecipientDetailsValid(recipientDetails); // Skippable

    // Updated validation for Buy Gift - Recipient Details and Purchaser Info required, Additional Info optional
    strictValidation = (() => {
      // Verify essential conditions
      if (!chooseFlightType?.type) return false;
      if (!selectedVoucherType?.title) return false;

      // Passenger validation (first passenger must have all fields)
      if (!Array.isArray(passengerData) || passengerData.length === 0)
        return false;
      const firstPassenger = passengerData[0];
      if (!firstPassenger?.firstName?.trim()) return false;
      if (!firstPassenger?.lastName?.trim()) return false;
      if (!firstPassenger?.phone?.trim()) return false;
      // Email not required for Purchaser Information
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // Recipient details are required
      if (!recipientDetails?.name?.trim()) return false;
      if (!recipientDetails?.email?.trim()) return false;
      if (!recipientDetails?.phone?.trim()) return false;
      if (!recipientDetails?.date?.trim()) return false;
      // Recipient email format validation
      if (!emailRegex.test(recipientDetails.email.trim())) return false;
      // Date format validation
      const dateValue = new Date(recipientDetails.date);
      if (isNaN(dateValue.getTime())) return false;

      // Additional info is optional - no validation needed

      return true;
    })();

    buyGiftShouldBeEnabled = !!(
      (condition1 && condition2 && condition3 && condition5 && strictValidation)
      // condition4 (additionalInfo) is optional
    );

    // Show which conditions are failing (updated for Buy Gift)
    const failingConditions = [];
    if (!condition1) failingConditions.push("1. Flight Type not selected");
    if (!condition2) failingConditions.push("2. Voucher Type not selected");
    if (!condition3)
      failingConditions.push("3. Purchaser Information incomplete");
    if (!condition5) failingConditions.push("4. Recipient Details incomplete");
    if (!strictValidation)
      failingConditions.push("5. Format validation failed");
    // Note: Additional Info (condition4) is optional

    if (failingConditions.length > 0) {
    } else {
    }

    // Individual detailed check
  }

  // Debug logging for Book Flight validation
  if (activitySelect === "Book Flight") {
  }

  // ALWAYS LOG ACTIVITY SELECT AND GIFT VOUCHER STATUS

  // Debug logging for Buy Gift
  if (isGiftVoucher) {
    // Detailed debugging

    // Check each condition separately for Buy Gift

    // Enhanced debugging for each individual condition

    if (Array.isArray(passengerData)) {
      passengerData.forEach((passenger, index) => {});
    }
  }

  const [showWarning, setShowWarning] = React.useState(false);

  // Send Data To Backend
  const handleBookData = async () => {
    // Validate Buy Gift and Flight Voucher fields if needed
    if ((isGiftVoucher || isFlightVoucher) && validateBuyGiftFields) {
      const isValid = validateBuyGiftFields();
      if (!isValid) {
        return; // Validation failed, don't proceed
      }
    }
    if (isFlightVoucher || isGiftVoucher) {
      // Debug: Log the selectedVoucherType

      // Validate that selectedVoucherType is set
      if (!selectedVoucherType || !selectedVoucherType.title) {
        alert("Please select a voucher type before proceeding with payment.");
        return;
      }

      // VOUCHER DATA PREPARATION (Flight Voucher ve Gift Voucher için Stripe ödeme)
      const computedNumberOfPassengers = (() => {
        // Prefer quantity attached to selected voucher by VoucherType component
        const voucherQuantity = parseInt(selectedVoucherType?.quantity, 10);
        if (!Number.isNaN(voucherQuantity) && voucherQuantity > 0)
          return voucherQuantity;

        // Next, use passenger count selected in the Experience step (e.g., Private Charter selector)
        const chooseFlightCount = parseInt(
          chooseFlightType?.passengerCount,
          10,
        );
        if (!Number.isNaN(chooseFlightCount) && chooseFlightCount > 0)
          return chooseFlightCount;

        // Fallback to number of passengers entered in the form
        if (Array.isArray(passengerData) && passengerData.length > 0)
          return passengerData.length;

        return 1;
      })();
      const isPrivateCharter = chooseFlightType?.type === "Private Charter";
      const voucherData = {
        // For Gift Vouchers: name/email/phone/mobile should be PURCHASER info (from PassengerInfo form)
        // For Flight Vouchers: name/email/phone/mobile should be the main contact info
        name: isGiftVoucher
          ? (
              (passengerData?.[0]?.firstName || "") +
              " " +
              (passengerData?.[0]?.lastName || "")
            ).trim()
          : recipientDetails?.name?.trim() ||
            (
              (passengerData?.[0]?.firstName || "") +
              " " +
              (passengerData?.[0]?.lastName || "")
            ).trim(),
        weight: passengerData?.[0]?.weight || "",
        flight_type: chooseFlightType?.type || "",
        voucher_type: isFlightVoucher ? "Flight Voucher" : "Gift Voucher",
        // For Private Charter, keep the selected title (e.g., Proposal Flight); backend now accepts any detail
        voucher_type_detail: selectedVoucherType?.title?.trim() || "",
        email: isGiftVoucher
          ? (passengerData?.[0]?.email || "").trim()
          : (recipientDetails?.email || passengerData?.[0]?.email || "").trim(),
        phone: isGiftVoucher
          ? (
              (passengerData?.[0]?.countryCode || "") +
              (passengerData?.[0]?.phone || "")
            ).trim()
          : (
              recipientDetails?.phone ||
              (passengerData?.[0]?.countryCode || "") +
                (passengerData?.[0]?.phone || "")
            ).trim(),
        mobile: isGiftVoucher
          ? (
              (passengerData?.[0]?.countryCode || "") +
              (passengerData?.[0]?.phone || "")
            ).trim()
          : (
              recipientDetails?.phone ||
              (passengerData?.[0]?.countryCode || "") +
                (passengerData?.[0]?.phone || "")
            ).trim(),
        redeemed: "No",
        paid: totalPrice, // already computed correctly for both Shared and Private
        offer_code: "",
        voucher_ref: voucherCode || "",
        // Recipient information (only for Gift Vouchers)
        recipient_name: isGiftVoucher ? recipientDetails?.name || "" : "",
        recipient_email: isGiftVoucher ? recipientDetails?.email || "" : "",
        recipient_phone: isGiftVoucher ? recipientDetails?.phone || "" : "",
        recipient_gift_date: isGiftVoucher ? recipientDetails?.date || "" : "",
        // Purchaser information (explicitly set for Gift Vouchers)
        purchaser_name: isGiftVoucher
          ? (
              (passengerData?.[0]?.firstName || "") +
              " " +
              (passengerData?.[0]?.lastName || "")
            ).trim()
          : "",
        purchaser_email: isGiftVoucher
          ? (passengerData?.[0]?.email || "").trim()
          : "",
        purchaser_phone: isGiftVoucher
          ? (
              (passengerData?.[0]?.countryCode || "") +
              (passengerData?.[0]?.phone || "")
            ).trim()
          : "",
        purchaser_mobile: isGiftVoucher
          ? (
              (passengerData?.[0]?.countryCode || "") +
              (passengerData?.[0]?.phone || "")
            ).trim()
          : "",
        numberOfPassengers: computedNumberOfPassengers,
        // Persist selection context needed for Private Charter code generation
        preferred_location: chooseLocation || "",
        experience_type: chooseFlightType?.type || "",
        passengerData: passengerData.map((p) => ({
          ...p,
          phone:
            p.countryCode && p.phone
              ? `${p.countryCode}${p.phone}`.trim()
              : p.phone || "",
        })), // Send passenger data with combined phone numbers (countryCode + phone)
        preferred_location:
          preference && preference.location
            ? Object.keys(preference.location)
                .filter((k) => preference.location[k])
                .join(", ")
            : null,
        preferred_time:
          preference && preference.time
            ? Object.keys(preference.time)
                .filter((k) => preference.time[k])
                .join(", ")
            : null,
        preferred_day:
          preference && preference.day
            ? Object.keys(preference.day)
                .filter((k) => preference.day[k])
                .join(", ")
            : null,
        additionalInfo: additionalInfo,
        add_to_booking_items:
          chooseAddOn && chooseAddOn.length > 0 ? chooseAddOn : null,
      };

      // Sending voucher data to backend

      try {
        // Start Stripe Checkout Session - for VOUCHER
        const userSessionData = { ...getGoogleAdsIdsForCheckout() };
        const sessionRes = await axios.post(
          `${API_BASE_URL}/api/create-checkout-session`,
          {
            totalPrice,
            currency: "GBP",
            voucherData,
            type: "voucher",
            userSessionData,
          },
        );
        if (!sessionRes.data.success) {
          alert(
            "Payment could not be initiated: " +
              (sessionRes.data.message || "Unknown error"),
          );
          return;
        }
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
          sessionId: sessionRes.data.sessionId,
        });
        if (error) {
          alert("Stripe redirect error: " + error.message);
        }
        // After successful payment, voucher code generation and createVoucher will be triggered via webhook
      } catch (error) {
        console.error("Error while starting Stripe Checkout:", error);
        const backendMsg =
          error?.response?.data?.message ||
          error?.response?.data?.error?.message;
        const stripeMsg = error?.response?.data?.error?.type
          ? `${error.response.data.error.type}${error.response.data.error.code ? " (" + error.response.data.error.code + ")" : ""}`
          : "";
        const finalMsg = backendMsg || error?.message || "Unknown error";
        alert(
          `An error occurred while starting payment. ${stripeMsg ? "[" + stripeMsg + "] " : ""}${finalMsg}`,
        );
      }
      return;
    }

    // REDEEM VOUCHER FLOW (Stripe ödeme olmadan direkt createVoucher)
    if (isRedeemVoucher) {
      // Redeem Voucher akışında voucher type bilgisi, admin panelindeki
      // Edit Voucher Code ekranından (voucher_type / voucher_type_detail)
      // veya frontend'de seçilmiş voucherType'tan gelebilir.
      const effectiveVoucherTypeTitle =
        selectedVoucherType?.title ||
        voucherData?.voucher_type_detail ||
        voucherData?.voucher_type ||
        voucherData?.applicable_voucher_types ||
        null;

      const effectiveSelectedVoucherType =
        selectedVoucherType ||
        (effectiveVoucherTypeTitle
          ? { title: effectiveVoucherTypeTitle }
          : null);

      // Booking data preparation for Redeem Voucher
      let bookingDateStr = selectedDate;
      if (selectedDate instanceof Date && selectedTime) {
        const [h, m, s] = selectedTime.split(":");
        const localDate = new Date(selectedDate);
        localDate.setHours(Number(h));
        localDate.setMinutes(Number(m));
        localDate.setSeconds(Number(s) || 0);
        bookingDateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")} ${String(localDate.getHours()).padStart(2, "0")}:${String(localDate.getMinutes()).padStart(2, "0")}:${String(localDate.getSeconds()).padStart(2, "0")}`;
      } else if (selectedDate instanceof Date) {
        bookingDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
      }

      const bookingData = {
        activitySelect: "Redeem Voucher",
        chooseLocation,
        chooseFlightType,
        selectedVoucherType: effectiveSelectedVoucherType,
        chooseAddOn: Array.isArray(chooseAddOn) ? chooseAddOn : [],
        passengerData,
        additionalInfo,
        recipientDetails: null, // Not applicable for Redeem Voucher
        selectedDate: bookingDateStr,
        selectedTime: selectedTime || null,
        totalPrice: totalPrice,
        voucher_code: voucherCode,
        flight_attempts: 0,
        preferred_location:
          preference && preference.location
            ? Object.keys(preference.location)
                .filter((k) => preference.location[k])
                .join(", ")
            : null,
        preferred_time:
          preference && preference.time
            ? Object.keys(preference.time)
                .filter((k) => preference.time[k])
                .join(", ")
            : null,
        preferred_day:
          preference && preference.day
            ? Object.keys(preference.day)
                .filter((k) => preference.day[k])
                .join(", ")
            : null,
        selectedVoucherType: effectiveSelectedVoucherType
          ? {
              id: effectiveSelectedVoucherType.id || null,
              title: effectiveVoucherTypeTitle,
              quantity: effectiveSelectedVoucherType.quantity,
              totalPrice: effectiveSelectedVoucherType.totalPrice || totalPrice,
            }
          : null,
        voucher_type: effectiveVoucherTypeTitle,
      };

      // Debug: Log the booking data being sent

      // If totalPrice > 0 (Add To Booking items added), go to Stripe payment flow
      if (totalPrice > 0) {
      } else {
        // If totalPrice = 0, create booking directly without Stripe

        try {
          // Normalize selectedDate to a timezone-safe string, so backend sees exactly
          // the date the user picked in the calendar (no UTC shift).
          let bookingDateStr = selectedDate;
          if (selectedDate instanceof Date && selectedTime) {
            const [h, m, s] = selectedTime.split(":");
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth() + 1; // 0-11
            const day = selectedDate.getDate();
            const hour = Number(h) || 0;
            const minute = Number(m) || 0;
            const second = Number(s) || 0;
            bookingDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
          } else if (selectedDate instanceof Date) {
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth() + 1;
            const day = selectedDate.getDate();
            bookingDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          }

          // Call simplified createRedeemBooking endpoint for Redeem Voucher
          const redeemBookingData = {
            activitySelect,
            chooseLocation,
            chooseFlightType,
            passengerData,
            additionalInfo,
            selectedDate: bookingDateStr,
            selectedTime,
            voucher_code: voucherCode ? voucherCode.trim() : null,
            totalPrice,
            activity_id: activityId,
          };

          const response = await axios.post(
            `${API_BASE_URL}/api/createRedeemBooking`,
            redeemBookingData,
          );

          if (response.data.success) {
            // Mark the original voucher as redeemed
            try {
              const redeemResponse = await axios.post(
                `${API_BASE_URL}/api/redeem-voucher`,
                {
                  voucher_code: voucherCode ? voucherCode.trim() : null,
                  booking_id: response.data.bookingId,
                },
              );

              // Show success modal with booking summary regardless of voucher marking result
              let bookingDateStr = selectedDate;
              if (selectedDate instanceof Date && selectedTime) {
                const [h, m, s] = selectedTime.split(":");
                const localDate = new Date(selectedDate);
                localDate.setHours(Number(h));
                localDate.setMinutes(Number(m));
                localDate.setSeconds(Number(s) || 0);
                bookingDateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")} ${String(localDate.getHours()).padStart(2, "0")}:${String(localDate.getMinutes()).padStart(2, "0")}:${String(localDate.getSeconds()).padStart(2, "0")}`;
              } else if (selectedDate instanceof Date) {
                bookingDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
              }
              setSuccessModalData({
                bookingId: response.data.bookingId,
                location: chooseLocation,
                flightDate: bookingDateStr,
                selectedTime: selectedTime,
                passengers: passengerData,
                voucherCode: voucherCode,
                additionalInfo: additionalInfo,
                addToBooking: chooseAddOn,
                voucherMarkError: redeemResponse.data.success
                  ? null
                  : redeemResponse.data.message,
              });
              setSuccessModalOpen(true);
            } catch (redeemError) {
              console.error("=== REDEEM VOUCHER ERROR ===");
              console.error("Error:", redeemError);
              console.error("Response:", redeemError.response?.data);

              // Show success modal with booking summary even if voucher marking failed
              let bookingDateStr = selectedDate;
              if (selectedDate instanceof Date && selectedTime) {
                const [h, m, s] = selectedTime.split(":");
                const localDate = new Date(selectedDate);
                localDate.setHours(Number(h));
                localDate.setMinutes(Number(m));
                localDate.setSeconds(Number(s) || 0);
                bookingDateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")} ${String(localDate.getHours()).padStart(2, "0")}:${String(localDate.getMinutes()).padStart(2, "0")}:${String(localDate.getSeconds()).padStart(2, "0")}`;
              } else if (selectedDate instanceof Date) {
                bookingDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
              }
              setSuccessModalData({
                bookingId: response.data.bookingId,
                location: chooseLocation,
                flightDate: bookingDateStr,
                selectedTime: selectedTime,
                passengers: passengerData,
                voucherCode: voucherCode,
                additionalInfo: additionalInfo,
                addToBooking: chooseAddOn,
                voucherMarkError:
                  redeemError.response?.data?.message || redeemError.message,
              });
              setSuccessModalOpen(true);
            }
            // Clear form after successful operation
            resetBooking();
          } else {
            alert(
              "An error occurred while creating the booking: " +
                (response.data.error ||
                  response.data.message ||
                  "Unknown error"),
            );
          }
        } catch (error) {
          console.error("Error while creating booking:", error);
          console.error("Error response:", error.response?.data);
          const errorMessage =
            error.response?.data?.error ||
            error.response?.data?.message ||
            "Unknown error";
          alert(
            "An error occurred while creating the booking: " + errorMessage,
          );
        }
        return; // Exit early since we handled the booking
      }
      // Continue to Stripe flow below if totalPrice > 0
    }
    // BOOK FLIGHT FLOW (Stripe ile ödeme)
    let bookingDateStr = selectedDate;
    if (selectedDate instanceof Date && selectedTime) {
      const [h, m, s] = selectedTime.split(":");
      const localDate = new Date(selectedDate);
      localDate.setHours(Number(h));
      localDate.setMinutes(Number(m));
      localDate.setSeconds(Number(s) || 0);
      bookingDateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")} ${String(localDate.getHours()).padStart(2, "0")}:${String(localDate.getMinutes()).padStart(2, "0")}:${String(localDate.getSeconds()).padStart(2, "0")}`;
    } else if (selectedDate instanceof Date) {
      bookingDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    }
    const bookingData = {
      activitySelect,
      chooseLocation,
      chooseFlightType,
      chooseAddOn: Array.isArray(chooseAddOn) ? chooseAddOn : [], // Opsiyonel - boş array olabilir
      passengerData,
      additionalInfo,
      recipientDetails,
      selectedDate: bookingDateStr,
      selectedTime: selectedTime || null,
      totalPrice,
      voucher_code: voucherCode,
      flight_attempts: chooseFlightType?.flight_attempts || 0,
      preferred_location:
        preference && preference.location
          ? Object.keys(preference.location)
              .filter((k) => preference.location[k])
              .join(", ")
          : null,
      preferred_time:
        preference && preference.time
          ? Object.keys(preference.time)
              .filter((k) => preference.time[k])
              .join(", ")
          : null,
      preferred_day:
        preference && preference.day
          ? Object.keys(preference.day)
              .filter((k) => preference.day[k])
              .join(", ")
          : null,
      // Include selected voucher type so backend can persist it correctly
      selectedVoucherType: selectedVoucherType
        ? {
            id: selectedVoucherType.id,
            title: selectedVoucherType.title,
            quantity: selectedVoucherType.quantity,
            totalPrice: selectedVoucherType.totalPrice,
          }
        : null,
      voucher_type: selectedVoucherType?.title || null,
    };
    try {
      // Start Stripe Checkout Session
      const userSessionData = { ...getGoogleAdsIdsForCheckout() };
      const sessionRes = await axios.post(
        `${API_BASE_URL}/api/create-checkout-session`,
        {
          totalPrice,
          currency: "GBP",
          bookingData,
          type: "booking",
          userSessionData,
        },
      );

      // Response kontrolü
      if (!sessionRes.data || !sessionRes.data.success) {
        const errorMessage = sessionRes.data?.message || "Unknown error";
        console.error("Backend error:", errorMessage);
        alert("Payment could not be initiated: " + errorMessage);
        return;
      }

      if (!sessionRes.data.sessionId) {
        console.error("Session ID not found in response");
        alert("Payment could not be initiated: Session ID not found");
        return;
      }
      const stripe = await stripePromise;

      try {
        // New approach in Stripe SDK
        const result = await stripe.redirectToCheckout({
          sessionId: sessionRes.data.sessionId,
        });

        if (result.error) {
          console.error("Stripe redirect error:", result.error);
          alert("Stripe redirect error: " + result.error.message);
        } else {
        }
      } catch (stripeError) {
        console.error("Stripe redirect failed:", stripeError);
        alert("Stripe redirect failed: " + stripeError.message);
      }
      // Başarılı ödeme sonrası createBooking çağrısı success_url ile tetiklenecek (webhook veya frontend ile)
    } catch (error) {
      console.error("Error while starting Stripe Checkout:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      const backendMsg =
        error?.response?.data?.message || error?.response?.data?.error?.message;
      const stripeMsg = error?.response?.data?.error?.type
        ? `${error.response.data.error.type}${error.response.data.error.code ? " (" + error.response.data.error.code + ")" : ""}`
        : "";
      const finalMsg = backendMsg || error?.message || "Unknown error";
      alert(
        `An error occurred while starting payment. ${stripeMsg ? "[" + stripeMsg + "] " : ""}${finalMsg}`,
      );
    }
  };

  const triggerBookAction = onBook || handleBookData;
  const isBookFlight = activitySelect === "Book Flight";
  const shouldShowAddOnSummary = !hideAddOnsSection;
  const shouldShowAdditionalInfoSummary = !hideAdditionalInfoSection;
  const isSectionInteractive = (sectionId) =>
    !hiddenSectionIds.includes(sectionId);
  const getSectionClickHandler = (sectionId) =>
    isSectionInteractive(sectionId)
      ? () => setActiveAccordion(sectionId)
      : undefined;

  const getSectionRowStyle = (sectionId) => ({
    cursor: isSectionInteractive(sectionId) ? "pointer" : "default",
  });

  // Update the sectionSpacing to a slightly larger value for more visual balance (e.g., 24px)
  const sectionSpacing = { marginBottom: "24px" };

  // --- Mobile drawer compact section list ---
  const mobileSections = [
    {
      id: "activity",
      title: "Flight Type",
      value: activitySelect
        ? activitySelect === "Redeem Voucher" && voucherCode
          ? `${activitySelect} - ${voucherStatus === "invalid" ? "Invalid" : voucherCode}`
          : activitySelect
        : "",
      completed:
        !!activitySelect &&
        (activitySelect !== "Redeem Voucher" || voucherStatus === "valid"),
    },
    ...(activitySelect === "Book Flight"
      ? [
          // Required order: Location → Experience → Voucher Type (if applicable) → Live Availability
          {
            id: "location",
            title: "Location",
            value: chooseLocation || "",
            completed: !!chooseLocation,
          },
          {
            id: "experience",
            title: "Experience",
            value: chooseFlightType?.type || "",
            completed: !!chooseFlightType?.type,
          },
          {
            id: "voucher-type",
            title: "Voucher Type",
            value: selectedVoucherType
              ? `${seasonSaver ? "☘️ " : ""}${selectedVoucherType.title} (${selectedVoucherType.quantity})`
              : "",
            completed: !!selectedVoucherType,
          },
          {
            id: "live-availability",
            title: "Live Availability",
            value:
              selectedDate && selectedTime
                ? formatDateWithTime(selectedDate, selectedTime)
                : "",
            completed: !!(selectedDate && selectedTime),
          },
          {
            id: "passenger-info",
            title: "Passenger Information",
            value:
              Array.isArray(passengerData) &&
              passengerData.some((p) => p.firstName)
                ? "Provided"
                : "",
            completed: isPassengerInfoComplete,
          },
          ...(shouldShowAdditionalInfoSummary
            ? [
                {
                  id: "additional-info",
                  title: "Additional Information",
                  value: isAdditionalInfoValid(additionalInfo)
                    ? "Provided"
                    : "",
                  completed: isAdditionalInfoValid(additionalInfo),
                },
              ]
            : []),
          ...(shouldShowAddOnSummary
            ? [
                {
                  id: "add-on",
                  title: "Add To Booking",
                  value:
                    Array.isArray(chooseAddOn) && chooseAddOn.length > 0
                      ? `${chooseAddOn.length} selected`
                      : "",
                  completed:
                    Array.isArray(chooseAddOn) && chooseAddOn.length > 0,
                },
              ]
            : []),
        ]
      : []),
    ...(activitySelect === "Redeem Voucher"
      ? [
          {
            id: "location",
            title: "Location",
            value: chooseLocation || "",
            completed: !!chooseLocation,
          },
          {
            id: "experience",
            title: "Experience",
            value: chooseFlightType?.type || "",
            completed: !!chooseFlightType?.type,
          },
          {
            id: "live-availability",
            title: "Live Availability",
            value:
              selectedDate && selectedTime
                ? formatDateWithTime(selectedDate, selectedTime)
                : "",
            completed: !!(selectedDate && selectedTime),
          },
          {
            id: "passenger-info",
            title: "Passenger Information",
            value:
              Array.isArray(passengerData) &&
              passengerData.some((p) => p.firstName)
                ? "Provided"
                : "",
            completed: isPassengerInfoComplete,
          },
          ...(shouldShowAdditionalInfoSummary
            ? [
                {
                  id: "additional-info",
                  title: "Additional Information",
                  value: isAdditionalInfoValid(additionalInfo)
                    ? "Provided"
                    : "",
                  completed: isAdditionalInfoValid(additionalInfo),
                },
              ]
            : []),
          ...(shouldShowAddOnSummary
            ? [
                {
                  id: "add-on",
                  title: "Add To Booking",
                  value:
                    Array.isArray(chooseAddOn) && chooseAddOn.length > 0
                      ? `${chooseAddOn.length} selected`
                      : "",
                  completed:
                    Array.isArray(chooseAddOn) && chooseAddOn.length > 0,
                },
              ]
            : []),
        ]
      : []),
    ...(activitySelect === "Flight Voucher"
      ? [
          {
            id: "experience",
            title: "Experience",
            value: chooseFlightType?.type || "",
            completed: !!chooseFlightType?.type,
          },
          {
            id: "voucher-type",
            title: "Voucher Type",
            value: selectedVoucherType
              ? `${seasonSaver ? "☘️ " : ""}${selectedVoucherType.title} (${selectedVoucherType.quantity})`
              : "",
            completed: !!selectedVoucherType,
          },
          {
            id: "passenger-info",
            title: "Passenger Information",
            value:
              Array.isArray(passengerData) &&
              passengerData.some((p) => p.firstName)
                ? "Provided"
                : "",
            completed: isPassengerInfoComplete,
          },
          ...(shouldShowAdditionalInfoSummary
            ? [
                {
                  id: "additional-info",
                  title: "Additional Information",
                  value: isAdditionalInfoValid(additionalInfo)
                    ? "Provided"
                    : "",
                  completed: isAdditionalInfoValid(additionalInfo),
                },
              ]
            : []),
          ...(shouldShowAddOnSummary
            ? [
                {
                  id: "add-on",
                  title: "Add To Booking",
                  value:
                    Array.isArray(chooseAddOn) && chooseAddOn.length > 0
                      ? `${chooseAddOn.length} selected`
                      : "",
                  completed:
                    Array.isArray(chooseAddOn) && chooseAddOn.length > 0,
                },
              ]
            : []),
        ]
      : []),
    ...(activitySelect === "Buy Gift"
      ? [
          {
            id: "experience",
            title: "Experience",
            value: chooseFlightType?.type || "",
            completed: !!chooseFlightType?.type,
          },
          {
            id: "voucher-type",
            title: "Voucher Type",
            value: selectedVoucherType
              ? `${seasonSaver ? "☘️ " : ""}${selectedVoucherType.title} (${selectedVoucherType.quantity})`
              : "",
            completed: !!selectedVoucherType,
          },
          {
            id: "passenger-info",
            title: "Purchaser Information",
            value:
              Array.isArray(passengerData) &&
              passengerData.some((p) => p.firstName)
                ? "Provided"
                : "",
            completed: isBuyGiftPassengerComplete,
          },
          {
            id: "recipient-details",
            title: "Recipient Details",
            value: recipientDetails?.name ? "Provided" : "",
            completed: !!recipientDetails?.name,
          },
        ]
      : []),
  ];

  const normalizedSummarySectionId =
    activeAccordion === "preference" ? "select-preferences" : activeAccordion;
  const summaryAutoScrollTargetId =
    (normalizedSummarySectionId &&
      mobileSections.some((section) => section.id === normalizedSummarySectionId)
      ? normalizedSummarySectionId
      : null) ||
    mobileSections.find((section) => !section.completed)?.id ||
    mobileSections[mobileSections.length - 1]?.id ||
    null;
  const summaryAutoScrollSnapshot = mobileSections
    .map(
      (section) =>
        `${section.id}:${section.completed ? 1 : 0}:${section.value || ""}`,
    )
    .join("|");

  React.useEffect(() => {
    if (isMobile || !summaryAutoScrollTargetId) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      const container = summaryScrollRef.current;
      if (!container) return;

      const getSummarySectionElement = (sectionId) =>
        sectionId
          ? container.querySelector(`[data-summary-section="${sectionId}"]`)
          : null;

      const target =
        getSummarySectionElement(summaryAutoScrollTargetId) ||
        getSummarySectionElement(
          mobileSections.find(
            (section) =>
              !section.completed && getSummarySectionElement(section.id),
          )?.id,
        ) ||
        getSummarySectionElement(
          [...mobileSections]
            .reverse()
            .find((section) => getSummarySectionElement(section.id))?.id,
        );

      if (!target) return;

      const prefersReducedMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ??
        false;

      container.scrollTo({
        top: Math.max(target.offsetTop - 16, 0),
        behavior:
          hasAutoScrolledSummaryRef.current && !prefersReducedMotion
            ? "smooth"
            : "auto",
      });

      hasAutoScrolledSummaryRef.current = true;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isMobile, summaryAutoScrollTargetId, summaryAutoScrollSnapshot]);

  return (
    <>
      {/* Desktop/Tablet full card */}
      <div style={{ display: isMobile ? "none" : "block" }}>
        <div className="book_active summary-desktop-card">
          <div className="book_data_active summary-desktop-inner">
            <div className="summary-desktop-scroll" ref={summaryScrollRef}>
            {/* En üstte Flight Type/What would you like to do? */}
            <div className="book_data_active" data-summary-section="activity">
              <div
                className={`row-1 ${(() => {
                  // For Redeem Voucher, only show green tick if voucher is valid
                  if (activitySelect === "Redeem Voucher") {
                    return voucherStatus === "valid" ? "active-card-val" : "";
                  }
                  // For other activity types, show green tick if selected
                  return activitySelect ? "active-card-val" : "";
                })()}`}
              >
                <span className="active-book-card"></span>
                <div className="active-book-cont">
                  <h3>Flight Type</h3>
                  <p>
                    {activitySelect
                      ? activitySelect === "Redeem Voucher" &&
                        voucherCode &&
                        voucherStatus === "valid"
                        ? `${activitySelect} - ${voucherCode}`
                        : activitySelect === "Redeem Voucher" &&
                            voucherCode &&
                            voucherStatus === "invalid"
                          ? `${activitySelect} - Invalid Code`
                          : activitySelect === "Book Flight"
                            ? "Book Flight Date"
                            : activitySelect === "Flight Voucher"
                              ? "Buy Flight Voucher"
                              : activitySelect === "Buy Gift"
                                ? "Buy Gift Voucher"
                                : activitySelect
                      : ""}
                  </p>
                </div>
              </div>
            </div>
            {activitySelect === "Book Flight" && (
              <>
                <div
                  className="book_data_active"
                  data-summary-section="location"
                  onClick={getSectionClickHandler("location")}
                  style={getSectionRowStyle("location")}
                >
                  {" "}
                  <div
                    className={`row-1 ${chooseLocation ? "active-card-val" : ""}`}
                  >
                    {" "}
                    <span className="active-book-card"></span>
                    <div className="active-book-cont">
                      <h3>Location</h3>
                      <p>{chooseLocation ? chooseLocation : ""}</p>
                    </div>
                  </div>
                </div>
                <div
                  className="book_data_active"
                  data-summary-section="experience"
                  onClick={getSectionClickHandler("experience")}
                  style={getSectionRowStyle("experience")}
                >
                  {" "}
                  <div
                    className={`row-1 ${chooseFlightType.passengerCount ? "active-card-val" : ""}`}
                  >
                    {" "}
                    <span className="active-book-card"></span>
                    <div className="active-book-cont">
                      <h3>Experience</h3>
                      <p>
                        {chooseFlightType.passengerCount
                          ? chooseFlightType?.type
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="book_data_active"
                  data-summary-section="voucher-type"
                  onClick={getSectionClickHandler("voucher-type")}
                  style={getSectionRowStyle("voucher-type")}
                >
                  {" "}
                  <div
                    className={`row-1 ${selectedVoucherType ? "active-card-val" : ""}`}
                  >
                    {" "}
                    <span className="active-book-card"></span>
                    <div className="active-book-cont final-active-book-cont">
                      <div className="active-book-left">
                        <h3>Voucher Type</h3>
                        <p>
                          {selectedVoucherType
                            ? `${selectedVoucherType.title} (${selectedVoucherType.quantity} passenger${selectedVoucherType.quantity > 1 ? "s" : ""})`
                            : ""}
                        </p>
                      </div>
                      <div className="active-book-right">
                        <p>
                          {selectedVoucherType
                            ? "£" +
                              (chooseFlightType?.type === "Private Charter"
                                ? (selectedVoucherType.totalPrice ??
                                  selectedVoucherType.price ??
                                  0)
                                : voucherTypePrice
                              ).toFixed(2)
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Private Charter Weather Refundable Display */}
                {chooseFlightType?.type === "Private Charter" &&
                  privateCharterWeatherRefund && (
                    <div className="book_data_active">
                      {" "}
                      <div className="row-1 active-card-val">
                        {" "}
                        <span className="active-book-card"></span>
                        <div className="active-book-cont final-active-book-cont">
                          <div className="active-book-left">
                            <h3>Weather Refundable</h3>
                            <p>One-time charge for entire booking</p>
                          </div>
                          <div className="active-book-right">
                            <p>
                              £{(selectedVoucherType?.price * 0.1).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                {chooseFlightType?.type === "Shared Flight" &&
                  weatherRefundPrice > 0 && (
                    <div className="book_data_active">
                      {" "}
                      <div className="row-1 active-card-val">
                        {" "}
                        <span className="active-book-card"></span>
                        <div className="active-book-cont final-active-book-cont">
                          <div className="active-book-left">
                            <h3>Weather Refundable</h3>
                            <p>£47.50 per passenger</p>
                          </div>
                          <div className="active-book-right">
                            <p>£{weatherRefundPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                <div
                  className="book_data_active"
                  data-summary-section="live-availability"
                  onClick={() => setActiveAccordion("live-availability")}
                >
                  {" "}
                  <div
                    className={`row-1 ${selectedDate && selectedTime ? "active-card-val" : ""}`}
                  >
                    {" "}
                    <span className="active-book-card"></span>
                    <div className="active-book-cont final-active-book-cont">
                      <div className="active-book-left">
                        <h3>Live Availability</h3>
                        <p>
                          {selectedDate && selectedTime
                            ? formatDateWithTime(selectedDate, selectedTime)
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="book_data_active"
                  data-summary-section="passenger-info"
                  onClick={() => setActiveAccordion("passenger-info")}
                >
                  {" "}
                  <div
                    className={`row-1 ${passengerData && passengerData.length > 0 && passengerData[0].firstName !== "" ? "active-card-val" : ""}`}
                  >
                    {" "}
                    <span className="active-book-card"></span>
                    <div className="active-book-cont final-active-book-cont">
                      <div className="active-book-left">
                        <h3>Passenger Information</h3>
                        {passengerData &&
                        passengerData.length > 0 &&
                        passengerData.some(
                          (p) => p.firstName && p.firstName.trim() !== "",
                        )
                          ? passengerData.map((data, index) =>
                              data.firstName ? (
                                <div key={index}>
                                  <p>
                                    {"Passenger " +
                                      `${index + 1}` +
                                      ": " +
                                      data.firstName +
                                      " " +
                                      data.lastName +
                                      " " +
                                      data.weight +
                                      "kg"}
                                  </p>
                                </div>
                              ) : null,
                            )
                          : null}
                      </div>
                    </div>
                  </div>
                </div>
                {shouldShowAdditionalInfoSummary && (
                  <div
                    className="book_data_active"
                    data-summary-section="additional-info"
                    onClick={() => setActiveAccordion("additional-info")}
                  >
                    {" "}
                    <div
                      className={`row-1 ${isAdditionalInfoValid(additionalInfo) ? "active-card-val" : ""}`}
                    >
                      {" "}
                      <span className="active-book-card"></span>
                      <div
                        className="active-book-cont final-active-book-cont"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div className="active-book-left">
                          <h3>Additional Information</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Preferences only for non-Book Flight and non-Redeem Voucher */}
                {activitySelect !== "Book Flight" &&
                  activitySelect !== "Redeem Voucher" && (
                    <div
                      className="book_data_active"
                      data-summary-section="select-preferences"
                      onClick={() => setActiveAccordion("select-preferences")}
                    >
                      {" "}
                      <div
                        className={`row-1 ${activeAccordion === "select-preferences" || activeAccordion === "preference" ? "active-card-val" : ""}`}
                      >
                        {" "}
                        <span className="active-book-card"></span>
                        <div
                          className="active-book-cont final-active-book-cont"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div className="active-book-left">
                            <h3>Preferences</h3>
                            {preference &&
                            ((preference.location &&
                              Object.values(preference.location).some(
                                Boolean,
                              )) ||
                              (preference.time &&
                                Object.values(preference.time).some(Boolean)) ||
                              (preference.day &&
                                Object.values(preference.day).some(
                                  Boolean,
                                ))) ? null : (
                              <p>Not Provided</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                {shouldShowAddOnSummary && (
                  <div
                    className="book_data_active"
                    data-summary-section="add-on"
                    onClick={() => setActiveAccordion("add-on")}
                  >
                    {" "}
                    <div
                      className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? "active-card-val" : ""}`}
                    >
                      {" "}
                      <span className="active-book-card"></span>
                      <div className="active-book-cont final-active-book-cont">
                        <div className="active-book-left">
                          <h3>Add To Booking</h3>
                          {chooseAddOn?.length > 0
                            ? chooseAddOn?.map((data, index) => (
                                <div
                                  className="active-book-cont final-active-book-cont"
                                  key={index}
                                >
                                  <div className="active-book-left">
                                    <p>{data.name}</p>
                                  </div>
                                  <div className="active-book-right">
                                    <p>
                                      £
                                      {data.name == "Weather Refundable" ||
                                      data.name == "Weather Refundable "
                                        ? " 47.50"
                                        : data.price}
                                    </p>
                                  </div>
                                </div>
                              ))
                            : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {activitySelect === "Redeem Voucher" && (
              <>
                <div
                  className="book_data_active"
                  data-summary-section="location"
                  onClick={() => setActiveAccordion("location")}
                >
                  {" "}
                  <div
                    className={`row-1 ${chooseLocation ? "active-card-val" : ""}`}
                  >
                    {" "}
                    <span className="active-book-card"></span>
                    <div className="book-cont">
                      <h3>Location</h3>
                      <p>{chooseLocation ? chooseLocation : ""}</p>
                    </div>
                  </div>
                </div>
                <div
                  className="book_data_active"
                  data-summary-section="live-availability"
                  onClick={() => setActiveAccordion("live-availability")}
                >
                  {" "}
                  <div
                    className={`row-1 ${selectedDate && selectedTime ? "active-card-val" : ""}`}
                  >
                    {" "}
                    <span className="active-book-card"></span>
                    <div className="book-cont final-active-book-cont">
                      <div className="active-book-left">
                        <h3>Live Availability</h3>
                        <p>
                          {selectedDate && selectedTime
                            ? formatDateWithTime(selectedDate, selectedTime)
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="book_data_active"
                  data-summary-section="passenger-info"
                  onClick={() => setActiveAccordion("passenger-info")}
                >
                  {" "}
                  <div
                    className={`row-1 ${passengerData && passengerData.length > 0 && passengerData[0].firstName !== "" ? "active-card-val" : ""}`}
                  >
                    {" "}
                    <span className="active-book-card"></span>
                    <div className="book-cont final-active-book-cont">
                      <div className="active-book-left">
                        <h3>Passenger Information</h3>
                        {passengerData &&
                        passengerData.length > 0 &&
                        passengerData.some(
                          (p) => p.firstName && p.firstName.trim() !== "",
                        )
                          ? passengerData.map((data, index) =>
                              data.firstName ? (
                                <div key={index}>
                                  <p>
                                    {"Passenger " +
                                      `${index + 1}` +
                                      ": " +
                                      data.firstName +
                                      " " +
                                      data.lastName +
                                      " " +
                                      data.weight +
                                      "kg"}
                                  </p>
                                </div>
                              ) : null,
                            )
                          : null}
                      </div>
                    </div>
                  </div>
                </div>
                {shouldShowAdditionalInfoSummary && (
                  <div
                    className="book_data_active"
                    data-summary-section="additional-info"
                    onClick={() => setActiveAccordion("additional-info")}
                  >
                    {" "}
                    <div
                      className={`row-1 ${isAdditionalInfoValid(additionalInfo) ? "active-card-val" : ""}`}
                    >
                      {" "}
                      <span className="active-book-card"></span>
                      <div
                        className="book-cont final-active-book-cont"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div className="active-book-left">
                          <h3>Additional Information</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Preferences REMOVED for Redeem Voucher */}
                {shouldShowAddOnSummary && (
                  <div
                    className="book_data_active"
                    data-summary-section="add-on"
                    onClick={() => setActiveAccordion("add-on")}
                  >
                    {" "}
                    <div
                      className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? "active-card-val" : ""}`}
                    >
                      {" "}
                      <span className="active-book-card"></span>
                      <div className="book-cont final-active-book-cont">
                        <div className="book-left">
                          <h3>Add To Booking</h3>
                          {chooseAddOn?.length > 0
                            ? chooseAddOn?.map((data, index) => (
                                <div
                                  className="book-cont final-active-book-cont"
                                  key={index}
                                >
                                  <div className="book-left">
                                    <p>{data.name}</p>
                                  </div>
                                  <div className="book-right">
                                    <p>
                                      £
                                      {data.name == "Weather Refundable" ||
                                      data.name == "Weather Refundable "
                                        ? " 47.50"
                                        : data.price}
                                    </p>
                                  </div>
                                </div>
                              ))
                            : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {activitySelect === "Buy Gift" && (
              <>
                <div
                  className="book_data_active"
                  data-summary-section="experience"
                  onClick={() => setActiveAccordion("experience")}
                >
                  {" "}
                  <div
                    className={`row-1 ${chooseFlightType.passengerCount ? "active-card-val" : ""}`}
                  >
                    {" "}
                    <span className="active-book-card"></span>
                    <div className="active-book-cont">
                      <h3>Experience</h3>
                      <p>
                        {chooseFlightType.passengerCount
                          ? chooseFlightType?.type
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="book_data_active"
                  data-summary-section="voucher-type"
                  onClick={() => setActiveAccordion("voucher-type")}
                >
                  {" "}
                  <div
                    className={`row-1 ${selectedVoucherType ? "active-card-val" : ""}`}
                  >
                    {" "}
                    <span className="active-book-card"></span>
                    <div className="active-book-cont final-active-book-cont">
                      <div className="active-book-left">
                        <h3>Voucher Type</h3>
                        <p>
                          {selectedVoucherType
                            ? `${selectedVoucherType.title} (${selectedVoucherType.quantity} passenger${selectedVoucherType.quantity > 1 ? "s" : ""})`
                            : ""}
                        </p>
                      </div>
                      <div className="active-book-right">
                        <p>
                          {selectedVoucherType
                            ? "£" +
                              (chooseFlightType?.type === "Private Charter"
                                ? (selectedVoucherType.totalPrice ??
                                  selectedVoucherType.price ??
                                  0)
                                : voucherTypePrice
                              ).toFixed(2)
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Private Charter Weather Refundable Display */}
                {chooseFlightType?.type === "Private Charter" &&
                  privateCharterWeatherRefund && (
                    <div className="book_data_active">
                      {" "}
                      <div className="row-1 active-card-val">
                        {" "}
                        <span className="active-book-card"></span>
                        <div className="book-cont final-active-book-cont">
                          <div className="active-book-left">
                            <h3>Weather Refundable</h3>
                            <p>One-time charge for entire booking</p>
                          </div>
                          <div className="book-right">
                            <p>
                              £{(selectedVoucherType?.price * 0.1).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                {chooseFlightType?.type === "Shared Flight" &&
                  weatherRefundPrice > 0 && (
                    <div className="book_data_active">
                      {" "}
                      <div className="row-1 active-card-val">
                        {" "}
                        <span className="active-book-card"></span>
                        <div className="book-cont final-active-book-cont">
                          <div className="book-left">
                            <h3>Weather Refundable</h3>
                            <p>£47.50 per passenger</p>
                          </div>
                          <div className="book-right">
                            <p>£{weatherRefundPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                {/* Swap order for Buy Gift: Purchaser Information above Recipient Details */}
                <div
                  className="book_data_active"
                  data-summary-section="passenger-info"
                  onClick={() => setActiveAccordion("passenger-info")}
                >
                  {" "}
                  <div
                    className={`row-1 ${passengerData && passengerData.length > 0 && passengerData[0].firstName !== "" ? "active-card-val" : ""}`}
                  >
                    {" "}
                    <span className="active-book-card"></span>
                    <div className="active-book-cont final-active-book-cont">
                      <div className="active-book-left">
                        <h3>Purchaser Information</h3>
                        {passengerData &&
                        passengerData.length > 0 &&
                        passengerData.some(
                          (p) => p.firstName && p.firstName.trim() !== "",
                        )
                          ? passengerData.map((data, index) =>
                              data.firstName ? (
                                <div key={index}>
                                  <p>{data.firstName + " " + data.lastName}</p>
                                  {data.weatherRefund && (
                                    <p
                                      style={{
                                        marginTop: "8px !important",
                                        color: "#666",
                                      }}
                                    >
                                      £47.50 Refundable
                                    </p>
                                  )}
                                </div>
                              ) : null,
                            )
                          : null}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="book_data_active"
                  data-summary-section="recipient-details"
                  onClick={() => setActiveAccordion("recipient-details")}
                >
                  {" "}
                  <div
                    className={`row-1 ${recipientDetails?.name ? "active-card-val" : ""}`}
                  >
                    {" "}
                    <span className="active-book-card"></span>
                    <div className="active-book-cont">
                      <h3>Recipient Details</h3>
                      <p>
                        {recipientDetails?.name ? recipientDetails.name : ""}
                      </p>
                    </div>
                  </div>
                </div>
                {shouldShowAddOnSummary && (
                  <div
                    className="book_data_active"
                    data-summary-section="add-on"
                    onClick={() => setActiveAccordion("add-on")}
                  >
                    {" "}
                    <div
                      className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? "active-card-val" : ""}`}
                    >
                      {" "}
                      <span className="active-book-card"></span>
                      <div className="active-book-cont final-active-book-cont">
                        <div className="active-book-left">
                          <h3>Add To Booking</h3>
                          {chooseAddOn?.length > 0
                            ? chooseAddOn?.map((data, index) => (
                                <div
                                  className="active-book-cont final-active-book-cont"
                                  key={index}
                                >
                                  <div className="active-book-left">
                                    <p>{data.name}</p>
                                  </div>
                                  <div className="active-book-right">
                                    <p>
                                      £
                                      {data.name == "Weather Refundable" ||
                                      data.name == "Weather Refundable "
                                        ? " 47.50"
                                        : data.price}
                                    </p>
                                  </div>
                                </div>
                              ))
                            : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {activitySelect === "Flight Voucher" && (
              <>
                <div
                  className="book_data_active"
                  data-summary-section="experience"
                  onClick={() => setActiveAccordion("experience")}
                >
                  {" "}
                  <div
                    className={`row-1 ${chooseFlightType.passengerCount ? "active-card-val" : ""}`}
                  >
                    {" "}
                    <span className="active-book-card"></span>
                    <div className="active-book-cont">
                      <h3>Experience</h3>
                      <p>
                        {chooseFlightType.passengerCount
                          ? chooseFlightType?.type
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="book_data_active"
                  data-summary-section="voucher-type"
                  onClick={() => setActiveAccordion("voucher-type")}
                >
                  {" "}
                  <div
                    className={`row-1 ${selectedVoucherType ? "active-card-val" : ""}`}
                  >
                    {" "}
                    <span className="active-book-card"></span>
                    <div className="active-book-cont final-active-book-cont">
                      <div className="active-book-left">
                        <h3>Voucher Type</h3>
                        <p>
                          {selectedVoucherType
                            ? `${selectedVoucherType.title} (${selectedVoucherType.quantity} passenger${selectedVoucherType.quantity > 1 ? "s" : ""})`
                            : ""}
                        </p>
                      </div>
                      <div className="active-book-right">
                        <p>
                          {selectedVoucherType
                            ? "£" +
                              (chooseFlightType?.type === "Private Charter"
                                ? (selectedVoucherType.totalPrice ??
                                  selectedVoucherType.price ??
                                  0)
                                : voucherTypePrice
                              ).toFixed(2)
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Private Charter Weather Refundable Display */}
                {chooseFlightType?.type === "Private Charter" &&
                  privateCharterWeatherRefund && (
                    <div className="book_data_active">
                      {" "}
                      <div className="row-1 active-card-val">
                        {" "}
                        <span className="active-book-card"></span>
                        <div className="book-cont final-active-book-cont">
                          <div className="book-left">
                            <h3>Weather Refundable</h3>
                            <p>One-time charge for entire booking</p>
                          </div>
                          <div className="book-right">
                            <p>
                              £{(selectedVoucherType?.price * 0.1).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                {chooseFlightType?.type === "Shared Flight" &&
                  weatherRefundPrice > 0 && (
                    <div className="book_data_active">
                      {" "}
                      <div className="row-1 active-card-val">
                        {" "}
                        <span className="active-book-card"></span>
                        <div className="book-cont final-active-book-cont">
                          <div className="book-left">
                            <h3>Weather Refundable</h3>
                            <p>£47.50 per passenger</p>
                          </div>
                          <div className="book-right">
                            <p>£{weatherRefundPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                <div
                  className="book_data_active"
                  data-summary-section="passenger-info"
                  onClick={() => setActiveAccordion("passenger-info")}
                >
                  {" "}
                  <div
                    className={`row-1 ${passengerData && passengerData.length > 0 && passengerData[0].firstName !== "" ? "active-card-val" : ""}`}
                  >
                    {" "}
                    <span className="active-book-card"></span>
                    <div className="active-book-cont final-active-book-cont">
                      <div className="active-book-left">
                        <h3>Passenger Information</h3>
                        {passengerData &&
                        passengerData.length > 0 &&
                        passengerData.some(
                          (p) => p.firstName && p.firstName.trim() !== "",
                        )
                          ? passengerData.map((data, index) =>
                              data.firstName ? (
                                <div key={index}>
                                  <p>
                                    {"Passenger " +
                                      `${index + 1}` +
                                      ": " +
                                      data.firstName +
                                      " " +
                                      data.lastName +
                                      " " +
                                      data.weight +
                                      "kg"}
                                  </p>
                                </div>
                              ) : null,
                            )
                          : null}
                      </div>
                    </div>
                  </div>
                </div>
                {shouldShowAdditionalInfoSummary && (
                  <div
                    className="book_data_active"
                    data-summary-section="additional-info"
                    onClick={() => setActiveAccordion("additional-info")}
                  >
                    {" "}
                    <div
                      className={`row-1 ${isAdditionalInfoValid(additionalInfo) ? "active-card-val" : ""}`}
                    >
                      {" "}
                      <span className="active-book-card"></span>
                      <div
                        className="active-book-cont final-active-book-cont"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div className="active-book-left">
                          <h3>Additional Information</h3>
                          {isAdditionalInfoValid(additionalInfo) ? null : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Preferences removed for Flight Voucher */}
                {shouldShowAddOnSummary && (
                  <div
                    className="book_data_active"
                    data-summary-section="add-on"
                    onClick={() => setActiveAccordion("add-on")}
                  >
                    {" "}
                    <div
                      className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? "active-card-val" : ""}`}
                    >
                      {" "}
                      <span className="active-book-card"></span>
                      <div className="active-book-cont final-active-book-cont">
                        <div className="active-book-left">
                          <h3>Add To Booking</h3>
                          {chooseAddOn?.length > 0
                            ? chooseAddOn?.map((data, index) => (
                                <div
                                  className="active-book-cont final-active-book-cont"
                                  key={index}
                                >
                                  <div className="active-book-left">
                                    <p>{data.name}</p>
                                  </div>
                                  <div className="active-book-right">
                                    <p>
                                      £
                                      {data.name == "Weather Refundable" ||
                                      data.name == "Weather Refundable "
                                        ? " 47.50"
                                        : data.price}
                                    </p>
                                  </div>
                                </div>
                              ))
                            : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            </div>
            <div className="summary-desktop-footer">
              <div className="summary-desktop-footer-top">
                <div
                  className="bottom_main summary-desktop-total"
                  style={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 2,
                  }}
                >
                  {activitySelect === "Redeem Voucher" && voucherData && (
                    <p
                      style={{
                        textDecoration: "line-through",
                        color: "#999",
                        fontSize: "0.9rem",
                        margin: "0 0 2px 0",
                      }}
                    >
                      £
                      {parseFloat(
                        voucherData.paid_amount ||
                          voucherData.detail?.paid ||
                          voucherData.final_amount ||
                          100,
                      ).toFixed(2)}
                    </p>
                  )}
                  <h3 className="summary-total-line">
                    Total:
                    <span className="total-price-animated">{`£${animatedTotal.toFixed(2)}`}</span>
                  </h3>
                </div>
                <div className="summary-desktop-book-row">
                  <button
                    className={`booking_btn final_booking-button${isBookDisabled ? " disabled" : ""}`}
                    disabled={isBookDisabled}
                    style={{
                      color: "#fff",
                      fontWeight: 500,
                      borderRadius: "8px",
                      padding: "7px 20px",
                      cursor: isBookDisabled ? "not-allowed" : "pointer",
                      opacity: 1,
                      border: "none",
                    }}
                    onClick={() => {
                      if (isBookDisabled) return;
                      setShowWarning(false);
                      triggerBookAction();
                    }}
                    type="button"
                  >
                    Book
                  </button>
                </div>
              </div>
              <div className="summary-payment-block">
                <div
                  className="summary-payment-icons"
                  aria-label="Supported payment methods"
                >
                  <SiVisa className="payment-icon payment-icon--visa" />
                  <span
                    className="payment-icon payment-icon--mastercard-mark"
                    aria-hidden="true"
                  >
                    <span className="payment-mastercard-circle payment-mastercard-circle--left" />
                    <span className="payment-mastercard-circle payment-mastercard-circle--right" />
                  </span>
                  <SiAmericanexpress className="payment-icon payment-icon--amex" />
                  <SiApplepay className="payment-icon payment-icon--applepay" />
                  <span
                    className="payment-icon payment-icon--googlepay-mark"
                    aria-hidden="true"
                  >
                    <FcGoogle className="payment-google-g" />
                  </span>
                </div>
                <span className="summary-secure-payment">Secure Payment</span>
              </div>
            </div>
            {showWarning && (
              <div
                className="validation-shake summary-desktop-warning"
                style={{
                  color: "red",
                  marginTop: 10,
                  fontSize: "14px",
                  textAlign: "center",
                }}
              >
                {activitySelect === "Book Flight" && (
                  <>
                    Please complete all required fields:
                    <br />
                    • Flight Location and Experience
                    <br />
                    • Voucher Type
                    <br />
                    • Live Availability (Date & Time)
                    <br />
                    • Passenger Information (All fields required)
                    <br />
                    {shouldShowAdditionalInfoSummary && (
                      <>
                        • Additional Information
                        <br />
                      </>
                    )}
                    {shouldShowAddOnSummary && <>• Add to Booking</>}
                  </>
                )}
                {activitySelect === "Redeem Voucher" && (
                  <>
                    Please complete all required fields:
                    <br />
                    • Flight Location and Experience
                    <br />
                    • Live Availability (Date & Time)
                    <br />
                    • Passenger Information (All fields required)
                    <br />
                    {shouldShowAdditionalInfoSummary && (
                      <>
                        • Additional Information
                        <br />
                      </>
                    )}
                    {shouldShowAddOnSummary && <>• Add to Booking</>}
                  </>
                )}
                {activitySelect === "Flight Voucher" && (
                  <>
                    Please complete all required fields:
                    <br />
                    • Experience
                    <br />
                    • Passenger Information (All fields required)
                    <br />
                    {shouldShowAdditionalInfoSummary && (
                      <>
                        • Additional Information
                        <br />
                      </>
                    )}
                    {shouldShowAddOnSummary && <>• Add to Booking</>}
                  </>
                )}
                {activitySelect === "Buy Gift" && (
                  <>
                    Please complete all required fields:
                    <br />
                    • Experience
                    <br />
                    • Voucher Type
                    <br />
                    • Recipient Details
                    <br />
                    • Purchaser Information (All fields required)
                    <br />• Add to Booking
                  </>
                )}
                {activitySelect !== "Book Flight" &&
                  activitySelect !== "Redeem Voucher" &&
                  activitySelect !== "Flight Voucher" &&
                  activitySelect !== "Buy Gift" &&
                  "Please fill in all required steps before booking."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky summary + drawer - show after activity is selected (even if Book is disabled) */}
      {isMobile && activitySelect && (
        <>
          <div className="summary-sticky" onClick={() => setIsDrawerOpen(true)}>
            <div className="summary-sticky-left">
              <strong className="summary-sticky-label">Summary</strong>
              <div
                style={{
                  marginLeft: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {activitySelect === "Redeem Voucher" && voucherData && (
                  <span
                    style={{
                      textDecoration: "line-through",
                      color: "#999",
                      fontSize: "0.9rem",
                    }}
                  >
                    £
                    {parseFloat(
                      voucherData.paid_amount ||
                        voucherData.detail?.paid ||
                        voucherData.final_amount ||
                        100,
                    ).toFixed(2)}
                  </span>
                )}
                <span style={{ color: "#666" }}>
                  {activitySelect === "Redeem Voucher"
                    ? `£${totalPrice.toFixed(2)}`
                    : totalPrice > 0
                      ? `£${totalPrice.toFixed(2)}`
                      : ""}
                </span>
              </div>
            </div>
            <button
              className="summary-sticky-book"
              disabled={isBookDisabled}
              onClick={(e) => {
                e.stopPropagation();
                if (!isBookDisabled) triggerBookAction();
              }}
              onMouseEnter={() => {}}
            >
              Book
            </button>
          </div>
          {isDrawerOpen && (
            <div
              className="summary-overlay"
              onClick={() => setIsDrawerOpen(false)}
            >
              <div
                className="summary-drawer"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="summary-drawer-header">
                  <span className="summary-drawer-heading">Booking Summary</span>
                  <button
                    type="button"
                    className="drawer-close"
                    aria-label="Close booking summary"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    <span className="drawer-close-line drawer-close-line--first" />
                    <span className="drawer-close-line drawer-close-line--second" />
                  </button>
                </div>
                <div className="summary-drawer-body">
                  {mobileSections.map((s) => (
                    <div
                      key={s.id}
                      className={`summary-row ${s.completed ? "completed" : ""}`}
                      onClick={() => {
                        if (!isSectionInteractive(s.id)) return;
                        setIsDrawerOpen(false);
                        setActiveAccordion(s.id);
                      }}
                      style={{
                        cursor: isSectionInteractive(s.id)
                          ? "pointer"
                          : "default",
                      }}
                    >
                      <div className="summary-row-left">
                        <div className="summary-dot" />
                        <div>
                          <div className="summary-row-title">{s.title}</div>
                          <div className="summary-row-sub">{s.value}</div>
                        </div>
                      </div>
                      <div
                        className="summary-chevron"
                        style={{
                          opacity: isSectionInteractive(s.id) ? 1 : 0.35,
                        }}
                      >
                        ›
                      </div>
                    </div>
                  ))}
                </div>
                <div className="summary-drawer-footer">
                  <div
                    className="summary-total"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                    }}
                  >
                    {activitySelect === "Redeem Voucher" && voucherData && (
                      <span
                        style={{
                          textDecoration: "line-through",
                          color: "#999",
                          fontSize: "0.9rem",
                          marginBottom: "4px",
                        }}
                      >
                        £
                        {parseFloat(
                          voucherData.paid_amount ||
                            voucherData.detail?.paid ||
                            voucherData.final_amount ||
                            100,
                        ).toFixed(2)}
                      </span>
                    )}
                    <span>
                      {activitySelect === "Redeem Voucher"
                        ? `£${totalPrice.toFixed(2)}`
                        : totalPrice > 0
                          ? `£${totalPrice.toFixed(2)}`
                          : ""}
                    </span>
                  </div>
                  <button
                    className="summary-primary"
                    disabled={isBookDisabled}
                    onClick={() => {
                      if (!isBookDisabled) triggerBookAction();
                    }}
                    style={{
                      width: "55%",
                      maxWidth: 220,
                      minWidth: 160,
                      alignSelf: "center",
                    }}
                  >
                    Book
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Success Modal for Redeem Voucher */}
      <Dialog
        open={successModalOpen}
        onClose={() => {
          setSuccessModalOpen(false);
          setSuccessModalData(null);
          navigateToMainSite();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{ fontWeight: 700, fontSize: 24, pb: 2, color: "#3274b4" }}
        >
          {successModalData?.voucherMarkError
            ? "✓ Booking Created Successfully!"
            : "✓ Voucher Successfully Redeemed!"}
        </DialogTitle>
        <DialogContent>
          {successModalData && (
            <Box sx={{ py: 2 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 2, color: "#3274b4" }}
              >
                Booking Summary
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  Booking ID
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {successModalData.bookingId}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  Location
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {successModalData.location || "N/A"}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  Live Availability
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {successModalData.flightDate
                    ? new Date(successModalData.flightDate).toLocaleDateString(
                        "en-GB",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      ) +
                      (successModalData.selectedTime
                        ? ` at ${successModalData.selectedTime}`
                        : "")
                    : "N/A"}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  Voucher Code
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 500, color: "#3274b4" }}
                >
                  {successModalData.voucherCode || "N/A"}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 600, mb: 1 }}
                >
                  Passengers
                </Typography>
                {successModalData.passengers &&
                successModalData.passengers.length > 0 ? (
                  successModalData.passengers.map((passenger, index) => (
                    <Typography key={index} variant="body1" sx={{ mb: 0.5 }}>
                      {index + 1}. {passenger.firstName} {passenger.lastName}
                      {passenger.weight ? ` (${passenger.weight}kg)` : ""}
                      {passenger.weatherRefund ? " - WX Refundable" : ""}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body1">No passengers</Typography>
                )}
              </Box>

              {shouldShowAdditionalInfoSummary &&
                successModalData.additionalInfo &&
                (successModalData.additionalInfo.notes ||
                  Object.keys(successModalData.additionalInfo).length > 0) && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      >
                        Additional Information
                      </Typography>
                      {successModalData.additionalInfo.notes ? (
                        <Typography
                          variant="body1"
                          sx={{ whiteSpace: "pre-wrap" }}
                        >
                          {successModalData.additionalInfo.notes}
                        </Typography>
                      ) : (
                        <Typography variant="body1" color="text.secondary">
                          No additional information provided
                        </Typography>
                      )}
                    </Box>
                  </>
                )}

              {successModalData.addToBooking &&
                successModalData.addToBooking.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      >
                        Add To Booking
                      </Typography>
                      {successModalData.addToBooking.map((item, index) => (
                        <Typography
                          key={index}
                          variant="body1"
                          sx={{ mb: 0.5 }}
                        >
                          •{" "}
                          {typeof item === "object"
                            ? item.title || item.name
                            : item}
                        </Typography>
                      ))}
                    </Box>
                  </>
                )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, justifyContent: "center" }}>
          <Button
            onClick={() => {
              setSuccessModalOpen(false);
              setSuccessModalData(null);
              navigateToMainSite();
            }}
            variant="contained"
            color="primary"
            sx={{
              minWidth: 120,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RightInfoCard;
