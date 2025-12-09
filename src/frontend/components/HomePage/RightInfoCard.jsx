import axios from "axios";
import React from "react";
import { loadStripe } from '@stripe/stripe-js';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Divider, Button } from "@mui/material";

import config from '../../../config';
const API_BASE_URL = config.API_BASE_URL;

const stripePromise = loadStripe(config.STRIPE_PUBLIC_KEY);

const RightInfoCard = ({ activitySelect, chooseLocation, chooseFlightType, chooseAddOn, passengerData, additionalInfo, recipientDetails, selectedDate, selectedTime, activeAccordion, setActiveAccordion, isFlightVoucher, isRedeemVoucher, isGiftVoucher, voucherCode, resetBooking, preference, validateBuyGiftFields, selectedVoucherType, voucherStatus, voucherData, privateCharterWeatherRefund, activityId }) => {
    
    // IMMEDIATE DEBUG LOG TO TEST IF COMPONENT RENDERS
    console.log('🔥 RightInfoCard component rendered!', { 
        activitySelect, 
        isGiftVoucher,
        timestamp: new Date().getTime(),
        version: 'v2.0'
    });
    
    // Force immediate debug for Buy Gift
    if (activitySelect === 'Buy Gift') {
        console.log('🎁 BUY GIFT DETECTED!', { 
            activitySelect, 
            isGiftVoucher,
            chooseFlightType,
            selectedVoucherType,
            passengerData,
            additionalInfo,
            recipientDetails
        });
    }

    // Mobile breakpoint + drawer state
    const [isMobile, setIsMobile] = React.useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
    const [successModalOpen, setSuccessModalOpen] = React.useState(false);
    const [successModalData, setSuccessModalData] = React.useState(null);
    React.useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 576);
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    // Prevent background scroll when drawer is open
    React.useEffect(() => {
        if (isDrawerOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = prev; };
        }
    }, [isDrawerOpen]);

    // Function to format date
    const formatDate = (date) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = new Date(date).toLocaleDateString('en-US', options);

        // Get the day of the month
        const day = new Date(date).getDate();

        // Function to get the correct ordinal suffix for the day
        const getOrdinalSuffix = (day) => {
            if (day > 3 && day < 21) return 'th';
            switch (day % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        };

        // Adding the ordinal suffix to the day
        const formattedDay = day + getOrdinalSuffix(day);

        // Replace the day with the formatted day with suffix
        return formattedDate.replace(day, formattedDay);
    };

    // Function to format date with time
    const formatDateWithTime = (date, time) => {
        if (!date || !time) return '';
        
        const formattedDate = formatDate(date);
        return `${formattedDate} at ${time}`;
    };

    // Calculate total price
    const flightTypePrice = chooseFlightType?.totalPrice || 0;
    
    // Calculate voucher type price dynamically based on current quantity and base price
    let voucherTypePrice = 0;
    if (selectedVoucherType) {
        const isPrivateCharter = chooseFlightType?.type === 'Private Charter';
        if (isPrivateCharter) {
            // Private charter prices from Shopify/booking are already total for the group
            voucherTypePrice = selectedVoucherType.totalPrice ?? selectedVoucherType.price ?? selectedVoucherType.basePrice ?? 0;
        } else if (selectedVoucherType.priceUnit === 'total') {
            // For total pricing, use the price as is
            voucherTypePrice = selectedVoucherType.price;
        } else {
            // For per-person pricing, calculate based on quantity and base price
            const basePrice = selectedVoucherType.basePrice || selectedVoucherType.price;
            const quantity = selectedVoucherType.quantity || 1;
            voucherTypePrice = basePrice * quantity;
        }
        console.log('RightInfoCard: Voucher type price calculation:', {
            title: selectedVoucherType.title,
            basePrice: selectedVoucherType.basePrice,
            price: selectedVoucherType.price,
            totalPrice: selectedVoucherType.totalPrice,
            priceUnit: selectedVoucherType.priceUnit,
            quantity: selectedVoucherType.quantity,
            isPrivateCharter,
            calculatedTotal: voucherTypePrice
        });
    }
    const addOnPrice = chooseAddOn.reduce((total, addOn) => {
        return total + (addOn.price !== "TBC" ? parseFloat(addOn.price) : 0); // Ignore "TBC" prices
    }, 0); // Opsiyonel - boş array ise 0 döner
    
    // Weather Refundable price calculation
    let weatherRefundPrice = 0;
    
    if (chooseFlightType?.type === "Private Charter" && privateCharterWeatherRefund) {
        // For Private Charter: One-time charge of 10% of voucher type price
        const voucherPrice = selectedVoucherType?.price || 0;
        weatherRefundPrice = voucherPrice * 0.1;
        console.log('RightInfoCard: Private Charter weather refundable:', voucherPrice, '* 0.1 =', weatherRefundPrice);
    } else {
        // For Shared Flight: £47.50 per passenger
        // Check if it's Any Day Flight with Weather Refundable enabled
        const isAnyDayFlight = selectedVoucherType?.title && selectedVoucherType.title.toLowerCase().includes('any day');
        const isSharedFlight = chooseFlightType?.type === 'Shared Flight';
        const weatherRefundEnabled = isSharedFlight && isAnyDayFlight && Array.isArray(passengerData) && passengerData.some(p => p && p.weatherRefund);
        
        if (weatherRefundEnabled && selectedVoucherType?.quantity) {
            weatherRefundPrice = selectedVoucherType.quantity * 47.50;
            console.log('RightInfoCard: Any Day Flight weather refundable:', selectedVoucherType.quantity, 'passengers * £47.50 = £', weatherRefundPrice);
        } else {
            weatherRefundPrice = 0;
            console.log('RightInfoCard: Shared Flight weather refundable disabled or not Any Day Flight');
        }
    }
    
    // Calculate total price based on activity type and selections
    let totalPrice = 0;
    
    if (activitySelect === 'Book Flight') {
        // For Book Flight, only include voucher type price and add-ons
        totalPrice = parseFloat(voucherTypePrice) + parseFloat(addOnPrice) + weatherRefundPrice;
    } else if (activitySelect === 'Flight Voucher' || activitySelect === 'Buy Gift') {
        // For Flight Voucher and Buy Gift, only show total when voucher type is selected
        if (selectedVoucherType) {
            const isPrivateCharter = chooseFlightType?.type === 'Private Charter';
            const vtPrice = isPrivateCharter
                ? (selectedVoucherType?.totalPrice ?? selectedVoucherType?.price ?? 0)
                : voucherTypePrice;
            totalPrice = parseFloat(vtPrice) + parseFloat(addOnPrice) + weatherRefundPrice;
        }
    } else if (activitySelect === 'Redeem Voucher') {
        // For Redeem Voucher, total price should be 0 since voucher covers the cost
        // Only add-ons and weather refund should be charged
        totalPrice = parseFloat(addOnPrice) + weatherRefundPrice;
    } else {
        // For other activity types, include all components
        totalPrice = parseFloat(flightTypePrice) + parseFloat(voucherTypePrice) + parseFloat(addOnPrice) + weatherRefundPrice;
    }

    // Helper to check if an object is non-empty
    const isNonEmptyObject = (obj) => obj && typeof obj === 'object' && Object.keys(obj).length > 0;
    
    // Helper to check if recipient details are complete for Buy Gift (allow skip)
    const isRecipientDetailsValid = (details) => {
        if (!details || typeof details !== 'object') {
            console.log('❌ recipientDetails is null/undefined or not object:', details);
            return false;
        }
        
        // If user clicked "Don't enter recipient details", treat as valid
        if (details.isSkipped === true) {
            console.log('✅ Recipient details marked as skipped – treating as valid');
            return true;
        }
        
        // Check each field individually with proper null/undefined checks
        const hasName = details.name && typeof details.name === 'string' && details.name.trim() !== '';
        const hasEmail = details.email && typeof details.email === 'string' && details.email.trim() !== '';
        const hasPhone = details.phone && typeof details.phone === 'string' && details.phone.trim() !== '';
        const hasDate = details.date && typeof details.date === 'string' && details.date.trim() !== '';
        
        // Email format validation
        let emailFormatValid = true;
        if (hasEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            emailFormatValid = emailRegex.test(details.email.trim());
        }
        
        // Date format validation
        let dateFormatValid = true;
        if (hasDate) {
            const dateValue = new Date(details.date);
            dateFormatValid = !isNaN(dateValue.getTime());
        }
        
        const isComplete = hasName && hasEmail && hasPhone && hasDate && emailFormatValid && dateFormatValid;
        
        console.log('🎁 recipientDetails validation (with skip support):', {
            details,
            hasName: { value: details.name, valid: hasName },
            hasEmail: { value: details.email, valid: hasEmail },
            hasPhone: { value: details.phone, valid: hasPhone },
            hasDate: { value: details.date, valid: hasDate },
            emailFormatValid,
            dateFormatValid,
            isComplete,
            note: 'All fields required unless user chose to skip'
        });
        
        return isComplete;
    };
    // Helper to check if an array is non-empty
    const isNonEmptyArray = (arr) => Array.isArray(arr) && arr.length > 0;
    console.log("additionalInfo:", additionalInfo);
    // Helper to check additionalInfo completion state
    // Rule:
    // - If there are required questions, ALL required must be provided
    // - If there are NO required questions, only mark as completed when the user has provided at least one answer
    // - If no info yet, not completed (prevents momentary tick before questions load)
    const isAdditionalInfoValid = (info) => {
      if (!info || typeof info !== 'object') return false;
      const requiredKeys = Array.isArray(info.__requiredKeys) ? info.__requiredKeys : [];
      if (requiredKeys.length > 0) {
        return requiredKeys.every((k) => {
          const v = info[k];
          return typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null && v !== false;
        });
      }
      // When nothing is required, consider it complete only if at least one answer exists
      const answerKeys = Object.keys(info).filter((k) => k.startsWith('question_'));
      return answerKeys.some((k) => {
        const v = info[k];
        return typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null && v !== false;
      });
    };

    // Book button enable logic:
    // - Redeem Voucher: only require main fields (already handled)
    // - Flight Voucher: require chooseFlightType, passengerData (at least one with firstName), additionalInfo, recipientDetails
    // - Buy Gift: require chooseFlightType, passengerData (at least one with firstName), additionalInfo, recipientDetails
    // - Book Flight: require all fields including complete passenger information
    // Note: chooseAddOn (Add To Booking) is now optional for all activity types
    const hasPassenger = Array.isArray(passengerData) && passengerData.some(p => p.firstName && p.firstName.trim() !== '');
    
    // Enhanced passenger validation for Book Flight
    // Validation rules:
    // - Passenger 1 (index 0): firstName, lastName, weight, phone, email (all required)
    // - Passenger 2+ (index 1+): firstName, lastName, weight (phone and email not required)
    const isPassengerInfoComplete = Array.isArray(passengerData) && passengerData.every((passenger, index) => {
        const isFirstPassenger = index === 0;
        
        // All passengers need: firstName, lastName, weight
        const basicInfoValid = passenger.firstName && passenger.firstName.trim() !== '' &&
               passenger.lastName && passenger.lastName.trim() !== '' &&
               (passenger.weight && (typeof passenger.weight === 'string' ? passenger.weight.trim() !== '' : passenger.weight !== null && passenger.weight !== undefined));
        
        // Only first passenger needs: phone and email
        const contactInfoValid = isFirstPassenger ? 
            (passenger.phone && passenger.phone.trim() !== '' && passenger.email && passenger.email.trim() !== '') : 
            true;
        
        const isValid = basicInfoValid && contactInfoValid;
        
        // Debug logging for passenger validation
        if (!isValid) {
            console.log(`Passenger ${index + 1} validation failed:`, {
                isFirstPassenger,
                firstName: passenger.firstName,
                lastName: passenger.lastName,
                weight: passenger.weight,
                weightType: typeof passenger.weight,
                phone: passenger.phone,
                email: passenger.email,
                basicInfoValid,
                contactInfoValid,
                passenger: passenger
            });
        }
        
        return isValid;
    });
    
    // Debug logging for passenger validation
    console.log('Passenger validation debug:', {
        passengerData: passengerData,
        isPassengerInfoComplete,
        passengerCount: Array.isArray(passengerData) ? passengerData.length : 0,
        passengerDetails: Array.isArray(passengerData) ? passengerData.map((p, index) => ({
            passengerNumber: index + 1,
            isFirstPassenger: index === 0,
            firstName: p.firstName,
            lastName: p.lastName,
            weight: p.weight,
            weightType: typeof p.weight,
            phone: p.phone,
            email: p.email,
            hasFirstName: !!(p.firstName && p.firstName.trim() !== ''),
            hasLastName: !!(p.lastName && p.lastName.trim() !== ''),
            hasWeight: !!(p.weight && (typeof p.weight === 'string' ? p.weight.trim() !== '' : p.weight !== null && p.weight !== undefined)),
            hasPhone: !!(p.phone && p.phone.trim() !== ''),
            hasEmail: !!(p.email && p.email.trim() !== ''),
            contactInfoRequired: index === 0,
            contactInfoValid: index === 0 ? !!(p.phone && p.phone.trim() !== '') : true
        })) : []
    });
    
    // Special validation for Buy Gift (no weight required, contact info only required for first passenger)
    const isBuyGiftPassengerComplete = (() => {
        if (!Array.isArray(passengerData)) {
            console.log('❌ passengerData is not an array:', passengerData);
            return false;
        }
        
        if (passengerData.length === 0) {
            console.log('❌ passengerData is empty array');
            return false;
        }
        
        const isComplete = passengerData.every((passenger, index) => {
            const isFirstPassenger = index === 0;
            
            // All passengers need: firstName, lastName (no weight for Buy Gift)
            const basicInfoValid = passenger.firstName && passenger.firstName.trim() !== '' &&
                   passenger.lastName && passenger.lastName.trim() !== '';
            
            // Only first passenger needs: phone (email no longer required for Purchaser Information)
            const contactInfoValid = isFirstPassenger ? 
                (passenger.phone && passenger.phone.trim() !== '') : 
                true;
            
            const passengerValid = basicInfoValid && contactInfoValid;
            
            console.log(`👤 Passenger ${index + 1} validation:`, {
                passenger,
                isFirstPassenger,
                basicInfoValid: { 
                    firstName: { value: passenger.firstName, valid: !!(passenger.firstName && passenger.firstName.trim()) },
                    lastName: { value: passenger.lastName, valid: !!(passenger.lastName && passenger.lastName.trim()) }
                },
                contactInfoValid: isFirstPassenger ? {
                    phone: { value: passenger.phone, valid: !!(passenger.phone && passenger.phone.trim()) },
                    email: { value: passenger.email, valid: !!(passenger.email && passenger.email.trim()) }
                } : 'Not required (not first passenger)',
                passengerValid
            });
            
            return passengerValid;
        });
        
        console.log('👥 isBuyGiftPassengerComplete result:', {
            passengerData,
            passengerCount: passengerData.length,
            isComplete
        });
        
        return isComplete;
    })();
    
    const isBookDisabled = isRedeemVoucher
        ? !(
            activitySelect &&
            chooseLocation &&
            chooseFlightType &&
            selectedVoucherType &&
            selectedDate &&
            selectedTime &&
            isPassengerInfoComplete
            // additionalInfo is optional for Redeem Voucher
            // chooseAddOn artık opsiyonel - isNonEmptyArray(chooseAddOn) kaldırıldı
        )
        : isFlightVoucher
        ? !(
            chooseFlightType &&
            selectedVoucherType &&
            isPassengerInfoComplete &&
            isAdditionalInfoValid(additionalInfo)
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
            isAdditionalInfoValid(additionalInfo) &&
            selectedDate &&
            selectedTime
        );

    // IMMEDIATE DEBUG FOR BOOK DISABLED STATUS
    console.log('📊 BOOK DISABLED CALCULATION:', {
        activitySelect,
        isGiftVoucher,
        isRedeemVoucher,
        isBookDisabled,
        chooseLocation,
        chooseFlightType,
        selectedVoucherType,
        selectedDate,
        selectedTime,
        isPassengerInfoComplete,
        timestamp: new Date().toLocaleTimeString()
    });

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
            if (!Array.isArray(passengerData) || passengerData.length === 0) return false;
            const firstPassenger = passengerData[0];
            if (!firstPassenger?.firstName?.trim()) return false;
            if (!firstPassenger?.lastName?.trim()) return false;
            if (!firstPassenger?.phone?.trim()) return false;
            // Email not required for Purchaser Information
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            // Recipient details can be skipped
            if (!recipientDetails?.isSkipped) {
                if (!recipientDetails?.name?.trim()) return false;
                if (!recipientDetails?.email?.trim()) return false;
                if (!recipientDetails?.phone?.trim()) return false;
                if (!recipientDetails?.date?.trim()) return false;
                // Recipient email format validation
                if (!emailRegex.test(recipientDetails.email.trim())) return false;
                // Date format validation
                const dateValue = new Date(recipientDetails.date);
                if (isNaN(dateValue.getTime())) return false;
            }
            
            // Additional info is optional - no validation needed
            
            return true;
        })();
        
        buyGiftShouldBeEnabled = !!(
            condition1 &&
            condition2 &&
            condition3 &&
            condition5 &&
            strictValidation
            // condition4 (additionalInfo) is optional
        );
        
        console.log('🔒 Buy Gift Strict Validation:', {
            strictValidation,
            firstPassengerCheck: passengerData[0] ? {
                firstName: !!passengerData[0]?.firstName?.trim(),
                lastName: !!passengerData[0]?.lastName?.trim(),
                phone: !!passengerData[0]?.phone?.trim(),
                email: !!passengerData[0]?.email?.trim(),
                emailFormat: passengerData[0]?.email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passengerData[0].email.trim()) : false
            } : 'No first passenger',
            recipientCheck: recipientDetails?.isSkipped ? 'SKIPPED' : {
                name: !!recipientDetails?.name?.trim(),
                email: !!recipientDetails?.email?.trim(),
                phone: !!recipientDetails?.phone?.trim(),
                date: !!recipientDetails?.date?.trim(),
                emailFormat: recipientDetails?.email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientDetails.email.trim()) : false,
                dateValid: recipientDetails?.date ? !isNaN(new Date(recipientDetails.date).getTime()) : false
            }
        });
        
        console.log('🚨 BUY GIFT UPDATED CONDITIONS CHECK:', {
            condition1_chooseFlightType: condition1,
            condition2_selectedVoucherType: condition2,
            condition3_isBuyGiftPassengerComplete: condition3,
            condition4_additionalInfo: condition4,
            condition5_recipientDetails: condition5,
            strictValidation: strictValidation,
            recipientDetailsRaw: recipientDetails,
            passengerDataRaw: passengerData,
            additionalInfoRaw: additionalInfo,
            ALL_CONDITIONS_MET: buyGiftShouldBeEnabled,
            CURRENT_isBookDisabled: isBookDisabled,
            EXPECTED_isBookDisabled: !buyGiftShouldBeEnabled,
            note: 'Flight Type, Voucher Type, Purchaser Info, and Recipient Details are required. Additional Info is optional.'
        });
        
        // Show which conditions are failing (updated for Buy Gift)
        const failingConditions = [];
        if (!condition1) failingConditions.push('1. Flight Type not selected');
        if (!condition2) failingConditions.push('2. Voucher Type not selected');
        if (!condition3) failingConditions.push('3. Purchaser Information incomplete');
        if (!condition5) failingConditions.push('4. Recipient Details incomplete');
        if (!strictValidation) failingConditions.push('5. Format validation failed');
        // Note: Additional Info (condition4) is optional
        
        if (failingConditions.length > 0) {
            console.log('❌ FAILING CONDITIONS:', failingConditions);
        } else {
            console.log('✅ ALL CONDITIONS PASSED - BOOK SHOULD BE ENABLED!');
        }

        // Individual detailed check
        console.log('🔍 DETAILED CONDITIONS:');
        console.log('1. chooseFlightType:', chooseFlightType);
        console.log('2. selectedVoucherType:', selectedVoucherType);
        console.log('3. passengerData:', passengerData);
        console.log('4. additionalInfo:', additionalInfo);
        console.log('5. recipientDetails:', recipientDetails);
    }

    // Debug logging for Book Flight validation
    if (activitySelect === 'Book Flight') {
        console.log('Book Flight validation debug:', {
            activitySelect: !!activitySelect,
            chooseLocation: !!chooseLocation,
            chooseFlightType: !!chooseFlightType,
            selectedVoucherType: !!selectedVoucherType,
            selectedDate: !!selectedDate,
            selectedTime: !!selectedTime,
            isPassengerInfoComplete,
            additionalInfo: isAdditionalInfoValid(additionalInfo),
            additionalInfoRaw: additionalInfo,
            additionalInfoKeys: additionalInfo ? Object.keys(additionalInfo) : [],
            additionalInfoValues: additionalInfo ? Object.values(additionalInfo) : [],
            recipientDetails: isRecipientDetailsValid(recipientDetails),
            isBookDisabled
        });
        
        // Check each validation condition separately
        console.log('Book Flight individual conditions:', {
            condition1: !!activitySelect,
            condition2: !!chooseLocation,
            condition3: !!chooseFlightType,
            condition4: !!selectedVoucherType,
            condition5: !!selectedDate,
            condition6: !!selectedTime,
            condition7: isPassengerInfoComplete,
            condition8: 'additionalInfo is now optional'
        });
        
        // Debug date and time specifically
        console.log('Date and Time debug:', {
            selectedDate: selectedDate,
            selectedTime: selectedTime,
            selectedDateType: typeof selectedDate,
            selectedTimeType: typeof selectedTime,
            selectedDateValid: !!selectedDate,
            selectedTimeValid: !!selectedTime
        });
    }

    // ALWAYS LOG ACTIVITY SELECT AND GIFT VOUCHER STATUS
    console.log('=== ACTIVITY DEBUG ===', {
        activitySelect,
        isGiftVoucher,
        isFlightVoucher,
        isRedeemVoucher
    });

    // Debug logging for Buy Gift
    if (isGiftVoucher) {
        console.log('Buy Gift Debug:', {
            chooseFlightType: !!chooseFlightType,
            selectedVoucherType: !!selectedVoucherType,
            chooseAddOn: isNonEmptyArray(chooseAddOn), // Opsiyonel - sadece bilgi amaçlı
            isPassengerInfoComplete,
            additionalInfo: isNonEmptyObject(additionalInfo),
            recipientDetails: isRecipientDetailsValid(recipientDetails),
            isBookDisabled
        });
        
        // Detailed debugging
        console.log('Buy Gift Detailed Debug:', {
            chooseFlightType: chooseFlightType,
            selectedVoucherType: selectedVoucherType,
            chooseAddOn: chooseAddOn, // Opsiyonel - sadece bilgi amaçlı
            passengerData: passengerData,
            additionalInfo: additionalInfo,
            recipientDetails: recipientDetails,
            isPassengerInfoComplete: isPassengerInfoComplete
        });
        
        // Check each condition separately for Buy Gift
        console.log('=== BUY GIFT DETAILED VALIDATION DEBUG ===');
        console.log('Buy Gift Updated Conditions Check:', {
            condition1_chooseFlightType: !!chooseFlightType,
            condition2_selectedVoucherType: !!selectedVoucherType,
            condition3_isBuyGiftPassengerComplete: isBuyGiftPassengerComplete,
            condition5_recipientDetails: isRecipientDetailsValid(recipientDetails),
            strictValidation: strictValidation,
            SHOULD_BE_ENABLED: buyGiftShouldBeEnabled,
            CURRENT_isBookDisabled: isBookDisabled,
            note: 'Purchaser info and recipient details are REQUIRED. Additional info is OPTIONAL.'
        });
        
        // Enhanced debugging for each individual condition
        console.log('=== INDIVIDUAL CONDITION ANALYSIS ===');
        console.log('1. chooseFlightType:', {
            value: chooseFlightType,
            valid: !!chooseFlightType,
            type: chooseFlightType?.type,
            passengerCount: chooseFlightType?.passengerCount
        });
        
        console.log('2. selectedVoucherType:', {
            value: selectedVoucherType,
            valid: !!selectedVoucherType,
            title: selectedVoucherType?.title,
            price: selectedVoucherType?.price_per_person
        });
        
        console.log('3. isBuyGiftPassengerComplete:', {
            value: isBuyGiftPassengerComplete,
            passengerDataLength: Array.isArray(passengerData) ? passengerData.length : 'Not array',
            passengerData: passengerData,
            passengerValidationDetails: Array.isArray(passengerData) ? passengerData.map((p, index) => ({
                passengerNumber: index + 1,
                isFirstPassenger: index === 0,
                firstName: p.firstName,
                lastName: p.lastName,
                phone: p.phone,
                email: p.email,
                basicInfoValid: !!(p.firstName && p.firstName.trim() !== '' && p.lastName && p.lastName.trim() !== ''),
                contactInfoValid: index === 0 ? !!(p.phone && p.phone.trim() !== '' && p.email && p.email.trim() !== '') : true,
                overallValid: !!(p.firstName && p.firstName.trim() !== '' && p.lastName && p.lastName.trim() !== '' && (index === 0 ? (p.phone && p.phone.trim() !== '' && p.email && p.email.trim() !== '') : true))
            })) : []
        });
        
        if (Array.isArray(passengerData)) {
            passengerData.forEach((passenger, index) => {
                console.log(`Passenger ${index + 1} validation:`, {
                    firstName: {value: passenger.firstName, valid: !!(passenger.firstName && passenger.firstName.trim() !== '')},
                    lastName: {value: passenger.lastName, valid: !!(passenger.lastName && passenger.lastName.trim() !== '')},
                    phone: {value: passenger.phone, valid: !!(passenger.phone && passenger.phone.trim() !== '')},
                    email: {value: passenger.email, valid: !!(passenger.email && passenger.email.trim() !== '')},
                    overallValid: !!(passenger.firstName && passenger.firstName.trim() !== '' &&
                                   passenger.lastName && passenger.lastName.trim() !== '' &&
                                   passenger.phone && passenger.phone.trim() !== '' &&
                                   passenger.email && passenger.email.trim() !== '')
                });
            });
        }
        
        console.log('4. additionalInfo:', {
            value: additionalInfo,
            valid: isAdditionalInfoValid(additionalInfo),
            keys: additionalInfo ? Object.keys(additionalInfo) : [],
            values: additionalInfo ? Object.values(additionalInfo) : []
        });
        
        console.log('5. recipientDetails:', {
            value: recipientDetails,
            valid: isRecipientDetailsValid(recipientDetails),
            keys: recipientDetails ? Object.keys(recipientDetails) : [],
            values: recipientDetails ? Object.values(recipientDetails) : [],
            validationDetails: {
                hasName: !!(recipientDetails && recipientDetails.name && recipientDetails.name.trim()),
                hasEmail: !!(recipientDetails && recipientDetails.email && recipientDetails.email.trim()),
                hasPhone: !!(recipientDetails && recipientDetails.phone && recipientDetails.phone.trim()),
                hasDate: !!(recipientDetails && recipientDetails.date && recipientDetails.date.trim())
            }
        });
    }

    const [showWarning, setShowWarning] = React.useState(false);

    // Send Data To Backend
    const handleBookData = async () => {
        console.log("Book button clicked");
        console.log("API_BASE_URL:", API_BASE_URL);
        
        // Validate Buy Gift and Flight Voucher fields if needed
        if ((isGiftVoucher || isFlightVoucher) && validateBuyGiftFields) {
            const isValid = validateBuyGiftFields();
            if (!isValid) {
                return; // Validation failed, don't proceed
            }
        }
        if (isFlightVoucher || isGiftVoucher) {
            // Debug: Log the selectedVoucherType
            console.log('=== VOUCHER DATA PREPARATION DEBUG ===');
            console.log('selectedVoucherType:', selectedVoucherType);
            console.log('selectedVoucherType?.title:', selectedVoucherType?.title);
            console.log('isFlightVoucher:', isFlightVoucher);
            console.log('isGiftVoucher:', isGiftVoucher);
            
            // Validate that selectedVoucherType is set
            if (!selectedVoucherType || !selectedVoucherType.title) {
                alert('Please select a voucher type before proceeding with payment.');
                return;
            }
            
            // VOUCHER DATA PREPARATION (Flight Voucher ve Gift Voucher için Stripe ödeme)
    const computedNumberOfPassengers = (() => {
        // Prefer quantity attached to selected voucher by VoucherType component
        const voucherQuantity = parseInt(selectedVoucherType?.quantity, 10);
        if (!Number.isNaN(voucherQuantity) && voucherQuantity > 0) return voucherQuantity;

        // Next, use passenger count selected in the Experience step (e.g., Private Charter selector)
        const chooseFlightCount = parseInt(chooseFlightType?.passengerCount, 10);
        if (!Number.isNaN(chooseFlightCount) && chooseFlightCount > 0) return chooseFlightCount;

        // Fallback to number of passengers entered in the form
        if (Array.isArray(passengerData) && passengerData.length > 0) return passengerData.length;

        return 1;
    })();
            const isPrivateCharter = chooseFlightType?.type === 'Private Charter';
            const voucherData = {
                // For Gift Vouchers: name/email/phone/mobile should be PURCHASER info (from PassengerInfo form)
                // For Flight Vouchers: name/email/phone/mobile should be the main contact info
                name: isGiftVoucher ? 
                    ((passengerData?.[0]?.firstName || '') + ' ' + (passengerData?.[0]?.lastName || '')).trim() :
                    (recipientDetails?.name?.trim() || ((passengerData?.[0]?.firstName || '') + ' ' + (passengerData?.[0]?.lastName || '')).trim()),
                weight: passengerData?.[0]?.weight || "",
                flight_type: chooseFlightType?.type || "",
                voucher_type: isFlightVoucher ? "Flight Voucher" : "Gift Voucher",
                // For Private Charter, keep the selected title (e.g., Proposal Flight); backend now accepts any detail
                voucher_type_detail: selectedVoucherType?.title?.trim() || "",
                email: isGiftVoucher ? 
                    (passengerData?.[0]?.email || "").trim() :
                    (recipientDetails?.email || passengerData?.[0]?.email || "").trim(),
                phone: isGiftVoucher ? 
                    (passengerData?.[0]?.phone || "").trim() :
                    (recipientDetails?.phone || passengerData?.[0]?.phone || "").trim(),
                mobile: isGiftVoucher ? 
                    (passengerData?.[0]?.phone || "").trim() :
                    (recipientDetails?.phone || passengerData?.[0]?.phone || "").trim(),
                redeemed: "No",
                paid: totalPrice, // already computed correctly for both Shared and Private
                offer_code: "",
                voucher_ref: voucherCode || "",
                // Recipient information (only for Gift Vouchers)
                recipient_name: isGiftVoucher ? (recipientDetails?.name || "") : "",
                recipient_email: isGiftVoucher ? (recipientDetails?.email || "") : "",
                recipient_phone: isGiftVoucher ? (recipientDetails?.phone || "") : "",
                recipient_gift_date: isGiftVoucher ? (recipientDetails?.date || "") : "",
                // Purchaser information (explicitly set for Gift Vouchers)
                purchaser_name: isGiftVoucher ? ((passengerData?.[0]?.firstName || '') + ' ' + (passengerData?.[0]?.lastName || '')).trim() : "",
                purchaser_email: isGiftVoucher ? (passengerData?.[0]?.email || "").trim() : "",
                purchaser_phone: isGiftVoucher ? (passengerData?.[0]?.phone || "").trim() : "",
                purchaser_mobile: isGiftVoucher ? (passengerData?.[0]?.phone || "").trim() : "",
                numberOfPassengers: computedNumberOfPassengers,
                // Persist selection context needed for Private Charter code generation
                preferred_location: chooseLocation || '',
                experience_type: chooseFlightType?.type || '',
                passengerData: passengerData, // Send the actual passenger data array
                preferred_location: preference && preference.location ? Object.keys(preference.location).filter(k => preference.location[k]).join(', ') : null,
                preferred_time: preference && preference.time ? Object.keys(preference.time).filter(k => preference.time[k]).join(', ') : null,
                preferred_day: preference && preference.day ? Object.keys(preference.day).filter(k => preference.day[k]).join(', ') : null,
                additionalInfo: additionalInfo,
                add_to_booking_items: (chooseAddOn && chooseAddOn.length > 0) ? chooseAddOn : null
            };
            
            // Sending voucher data to backend
            console.log('RightInfoCard - chooseAddOn state:', chooseAddOn);
            console.log('RightInfoCard - chooseAddOn length:', chooseAddOn ? chooseAddOn.length : 'null/undefined');
            console.log('RightInfoCard - add_to_booking_items being sent:', voucherData.add_to_booking_items);
            
            
            
            try {
                // Start Stripe Checkout Session - for VOUCHER
                const sessionRes = await axios.post(`${API_BASE_URL}/api/create-checkout-session`, {
                    totalPrice,
                    currency: 'GBP',
                    voucherData,
                    type: 'voucher'
                });
                if (!sessionRes.data.success) {
                    alert('Payment could not be initiated: ' + (sessionRes.data.message || 'Unknown error'));
                    return;
                }
                const stripe = await stripePromise;
                const { error } = await stripe.redirectToCheckout({ sessionId: sessionRes.data.sessionId });
                if (error) {
                    alert('Stripe redirect error: ' + error.message);
                }
                // After successful payment, voucher code generation and createVoucher will be triggered via webhook
            } catch (error) {
                console.error('Error while starting Stripe Checkout:', error);
                const backendMsg = error?.response?.data?.message || error?.response?.data?.error?.message;
                const stripeMsg = error?.response?.data?.error?.type ? `${error.response.data.error.type}${error.response.data.error.code ? ' ('+error.response.data.error.code+')' : ''}` : '';
                const finalMsg = backendMsg || error?.message || 'Unknown error';
                alert(`An error occurred while starting payment. ${stripeMsg ? '['+stripeMsg+'] ' : ''}${finalMsg}`);
            }
            return;
        }
        
        // REDEEM VOUCHER FLOW (Stripe ödeme olmadan direkt createVoucher)
        if (isRedeemVoucher) {
            // Debug: Log the selectedVoucherType
            console.log('=== REDEEM VOUCHER DEBUG ===');
            console.log('selectedVoucherType:', selectedVoucherType);
            console.log('selectedVoucherType?.title:', selectedVoucherType?.title);
            
            // Validate that selectedVoucherType is set
            if (!selectedVoucherType || !selectedVoucherType.title) {
                alert('Please select a voucher type before proceeding.');
                return;
            }
            
            // Booking data preparation for Redeem Voucher
            let bookingDateStr = selectedDate;
            if (selectedDate instanceof Date && selectedTime) {
                const [h, m, s] = selectedTime.split(":");
                const localDate = new Date(selectedDate);
                localDate.setHours(Number(h));
                localDate.setMinutes(Number(m));
                localDate.setSeconds(Number(s) || 0);
                bookingDateStr = `${localDate.getFullYear()}-${String(localDate.getMonth()+1).padStart(2,'0')}-${String(localDate.getDate()).padStart(2,'0')} ${String(localDate.getHours()).padStart(2,'0')}:${String(localDate.getMinutes()).padStart(2,'0')}:${String(localDate.getSeconds()).padStart(2,'0')}`;
            } else if (selectedDate instanceof Date) {
                bookingDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
            }
            
            const bookingData = {
                activitySelect: "Redeem Voucher",
                chooseLocation,
                chooseFlightType,
                selectedVoucherType,
                chooseAddOn: Array.isArray(chooseAddOn) ? chooseAddOn : [],
                passengerData,
                additionalInfo,
                recipientDetails: null, // Not applicable for Redeem Voucher
                selectedDate: bookingDateStr,
                selectedTime: selectedTime || null,
                totalPrice: totalPrice,
                voucher_code: voucherCode,
                flight_attempts: 0,
                preferred_location: preference && preference.location ? Object.keys(preference.location).filter(k => preference.location[k]).join(', ') : null,
                preferred_time: preference && preference.time ? Object.keys(preference.time).filter(k => preference.time[k]).join(', ') : null,
                preferred_day: preference && preference.day ? Object.keys(preference.day).filter(k => preference.day[k]).join(', ') : null,
                selectedVoucherType: selectedVoucherType ? {
                    id: selectedVoucherType.id || null,
                    title: selectedVoucherType.title,
                    quantity: selectedVoucherType.quantity,
                    totalPrice: selectedVoucherType.totalPrice || totalPrice
                } : null,
                voucher_type: selectedVoucherType?.title || null
            };
            
            // Debug: Log the booking data being sent
            console.log('=== REDEEM VOUCHER BOOKING DATA BEING SENT ===');
            console.log('bookingData:', bookingData);
            console.log('totalPrice:', totalPrice);
            
            // If totalPrice > 0 (Add To Booking items added), go to Stripe payment flow
            if (totalPrice > 0) {
                console.log('🔄 Total price is greater than 0, redirecting to Stripe payment...');
                // Don't return here - continue to Stripe flow below
            } else {
                // If totalPrice = 0, create booking directly without Stripe
                console.log('✅ Total price is 0, creating booking directly without Stripe...');
                
                try {
                    // Call simplified createRedeemBooking endpoint for Redeem Voucher
                    const redeemBookingData = {
                        activitySelect,
                        chooseLocation,
                        chooseFlightType,
                        passengerData,
                        additionalInfo,
                        selectedDate,
                        selectedTime,
                        voucher_code: voucherCode ? voucherCode.trim() : null,
                        totalPrice,
                        activity_id: activityId
                    };
                    
                    console.log('=== REDEEM BOOKING DATA ===');
                    console.log('Redeem Booking Data:', redeemBookingData);
                    
                    const response = await axios.post(`${API_BASE_URL}/api/createRedeemBooking`, redeemBookingData);
                        
                        if (response.data.success) {
                            console.log('=== BOOKING CREATED SUCCESSFULLY ===');
                            console.log('Booking ID:', response.data.bookingId);
                            
                            // Mark the original voucher as redeemed
                            try {
                                console.log('=== MARKING VOUCHER AS REDEEMED ===');
                                console.log('Voucher Code:', voucherCode);
                                console.log('Booking ID:', response.data.bookingId);
                                
                                const redeemResponse = await axios.post(`${API_BASE_URL}/api/redeem-voucher`, {
                                    voucher_code: voucherCode ? voucherCode.trim() : null,
                                    booking_id: response.data.bookingId
                                });
                                
                                console.log('=== REDEEM VOUCHER RESPONSE ===');
                                console.log('Success:', redeemResponse.data.success);
                                console.log('Message:', redeemResponse.data.message);
                                
                                // Show success modal with booking summary regardless of voucher marking result
                                let bookingDateStr = selectedDate;
                                if (selectedDate instanceof Date && selectedTime) {
                                    const [h, m, s] = selectedTime.split(":");
                                    const localDate = new Date(selectedDate);
                                    localDate.setHours(Number(h));
                                    localDate.setMinutes(Number(m));
                                    localDate.setSeconds(Number(s) || 0);
                                    bookingDateStr = `${localDate.getFullYear()}-${String(localDate.getMonth()+1).padStart(2,'0')}-${String(localDate.getDate()).padStart(2,'0')} ${String(localDate.getHours()).padStart(2,'0')}:${String(localDate.getMinutes()).padStart(2,'0')}:${String(localDate.getSeconds()).padStart(2,'0')}`;
                                } else if (selectedDate instanceof Date) {
                                    bookingDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
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
                                    voucherMarkError: redeemResponse.data.success ? null : redeemResponse.data.message
                                });
                                setSuccessModalOpen(true);
                            } catch (redeemError) {
                                console.error('=== REDEEM VOUCHER ERROR ===');
                                console.error('Error:', redeemError);
                                console.error('Response:', redeemError.response?.data);
                                
                                // Show success modal with booking summary even if voucher marking failed
                                let bookingDateStr = selectedDate;
                                if (selectedDate instanceof Date && selectedTime) {
                                    const [h, m, s] = selectedTime.split(":");
                                    const localDate = new Date(selectedDate);
                                    localDate.setHours(Number(h));
                                    localDate.setMinutes(Number(m));
                                    localDate.setSeconds(Number(s) || 0);
                                    bookingDateStr = `${localDate.getFullYear()}-${String(localDate.getMonth()+1).padStart(2,'0')}-${String(localDate.getDate()).padStart(2,'0')} ${String(localDate.getHours()).padStart(2,'0')}:${String(localDate.getMinutes()).padStart(2,'0')}:${String(localDate.getSeconds()).padStart(2,'0')}`;
                                } else if (selectedDate instanceof Date) {
                                    bookingDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
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
                                    voucherMarkError: redeemError.response?.data?.message || redeemError.message
                                });
                                setSuccessModalOpen(true);
                            }
                            // Clear form after successful operation
                            resetBooking();
                        } else {
                            alert('An error occurred while creating the booking: ' + (response.data.error || response.data.message || 'Unknown error'));
                        }
                    } catch (error) {
                        console.error('Error while creating booking:', error);
                        console.error('Error response:', error.response?.data);
                        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Unknown error';
                        alert('An error occurred while creating the booking: ' + errorMessage);
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
            bookingDateStr = `${localDate.getFullYear()}-${String(localDate.getMonth()+1).padStart(2,'0')}-${String(localDate.getDate()).padStart(2,'0')} ${String(localDate.getHours()).padStart(2,'0')}:${String(localDate.getMinutes()).padStart(2,'0')}:${String(localDate.getSeconds()).padStart(2,'0')}`;
        } else if (selectedDate instanceof Date) {
            bookingDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
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
            preferred_location: preference && preference.location ? Object.keys(preference.location).filter(k => preference.location[k]).join(', ') : null,
            preferred_time: preference && preference.time ? Object.keys(preference.time).filter(k => preference.time[k]).join(', ') : null,
            preferred_day: preference && preference.day ? Object.keys(preference.day).filter(k => preference.day[k]).join(', ') : null,
            // Include selected voucher type so backend can persist it correctly
            selectedVoucherType: selectedVoucherType ? {
                id: selectedVoucherType.id,
                title: selectedVoucherType.title,
                quantity: selectedVoucherType.quantity,
                totalPrice: selectedVoucherType.totalPrice
            } : null,
            voucher_type: selectedVoucherType?.title || null
        };
        try {
            // Start Stripe Checkout Session
            // localStorage.setItem('pendingBookingData', JSON.stringify(bookingData)); // ARTIK GEREK YOK
            const sessionRes = await axios.post(`${API_BASE_URL}/api/create-checkout-session`, {
                totalPrice,
                currency: 'GBP',
                bookingData,
                type: 'booking'
            });
            
            console.log('Backend response:', sessionRes.data);
            
            // Response kontrolü
            if (!sessionRes.data || !sessionRes.data.success) {
                const errorMessage = sessionRes.data?.message || 'Unknown error';
                console.error('Backend error:', errorMessage);
                alert('Payment could not be initiated: ' + errorMessage);
                return;
            }
            
            if (!sessionRes.data.sessionId) {
                console.error('Session ID not found in response');
                alert('Payment could not be initiated: Session ID not found');
                return;
            }
            const stripe = await stripePromise;
            console.log('Redirecting to Stripe with sessionId:', sessionRes.data.sessionId);
            
            try {
                // New approach in Stripe SDK
                const result = await stripe.redirectToCheckout({ 
                    sessionId: sessionRes.data.sessionId 
                });
                
                if (result.error) {
                    console.error('Stripe redirect error:', result.error);
                    alert('Stripe redirect error: ' + result.error.message);
                } else {
                    console.log('Stripe redirect successful');
                }
            } catch (stripeError) {
                console.error('Stripe redirect failed:', stripeError);
                alert('Stripe redirect failed: ' + stripeError.message);
            }
            // Başarılı ödeme sonrası createBooking çağrısı success_url ile tetiklenecek (webhook veya frontend ile)
        } catch (error) {
            console.error('Error while starting Stripe Checkout:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                response: error.response?.data
            });
            const backendMsg = error?.response?.data?.message || error?.response?.data?.error?.message;
            const stripeMsg = error?.response?.data?.error?.type ? `${error.response.data.error.type}${error.response.data.error.code ? ' ('+error.response.data.error.code+')' : ''}` : '';
            const finalMsg = backendMsg || error?.message || 'Unknown error';
            alert(`An error occurred while starting payment. ${stripeMsg ? '['+stripeMsg+'] ' : ''}${finalMsg}`);
        }
    }

    const isBookFlight = activitySelect === "Book Flight";

    // Update the sectionSpacing to a slightly larger value for more visual balance (e.g., 24px)
    const sectionSpacing = { marginBottom: '24px' };

    // --- Mobile drawer compact section list ---
    const mobileSections = [
        { id: 'activity', title: 'Flight Type', value: activitySelect ? (activitySelect === 'Redeem Voucher' && voucherCode ? `${activitySelect} - ${voucherStatus === 'invalid' ? 'Invalid' : voucherCode}` : activitySelect) : '', completed: !!activitySelect && (activitySelect !== 'Redeem Voucher' || voucherStatus === 'valid') },
        ...(activitySelect === 'Book Flight' ? [
            // Required order: Location → Experience → Voucher Type (if applicable) → Live Availability
            { id: 'location', title: 'Location', value: chooseLocation || '', completed: !!chooseLocation },
            { id: 'experience', title: 'Experience', value: chooseFlightType?.type || '', completed: !!chooseFlightType?.type },
            ...(chooseLocation !== 'Bristol Fiesta' ? [{ id: 'voucher-type', title: 'Voucher Type', value: selectedVoucherType ? `${selectedVoucherType.title} (${selectedVoucherType.quantity})` : '', completed: !!selectedVoucherType }] : []),
            { id: 'live-availability', title: 'Live Availability', value: (selectedDate && selectedTime) ? formatDateWithTime(selectedDate, selectedTime) : '', completed: !!(selectedDate && selectedTime) },
            { id: 'passenger-info', title: 'Passenger Information', value: (Array.isArray(passengerData) && passengerData.some(p => p.firstName)) ? 'Provided' : '', completed: isPassengerInfoComplete },
            { id: 'additional-info', title: 'Additional Information', value: isAdditionalInfoValid(additionalInfo) ? 'Provided' : '', completed: isAdditionalInfoValid(additionalInfo) },
            { id: 'add-on', title: 'Add To Booking', value: (Array.isArray(chooseAddOn) && chooseAddOn.length > 0) ? `${chooseAddOn.length} selected` : '', completed: (Array.isArray(chooseAddOn) && chooseAddOn.length > 0) }
        ] : []),
        ...(activitySelect === 'Redeem Voucher' ? [
            { id: 'location', title: 'Location', value: chooseLocation || '', completed: !!chooseLocation },
            { id: 'experience', title: 'Experience', value: chooseFlightType?.type || '', completed: !!chooseFlightType?.type },
            { id: 'live-availability', title: 'Live Availability', value: (selectedDate && selectedTime) ? formatDateWithTime(selectedDate, selectedTime) : '', completed: !!(selectedDate && selectedTime) },
            { id: 'passenger-info', title: 'Passenger Information', value: (Array.isArray(passengerData) && passengerData.some(p => p.firstName)) ? 'Provided' : '', completed: isPassengerInfoComplete },
            { id: 'additional-info', title: 'Additional Information', value: isAdditionalInfoValid(additionalInfo) ? 'Provided' : '', completed: isAdditionalInfoValid(additionalInfo) },
            { id: 'add-on', title: 'Add To Booking', value: (Array.isArray(chooseAddOn) && chooseAddOn.length > 0) ? `${chooseAddOn.length} selected` : '', completed: (Array.isArray(chooseAddOn) && chooseAddOn.length > 0) }
        ] : []),
        ...(activitySelect === 'Flight Voucher' ? [
            { id: 'experience', title: 'Experience', value: chooseFlightType?.type || '', completed: !!chooseFlightType?.type },
            { id: 'voucher-type', title: 'Voucher Type', value: selectedVoucherType ? `${selectedVoucherType.title} (${selectedVoucherType.quantity})` : '', completed: !!selectedVoucherType },
            { id: 'passenger-info', title: 'Passenger Information', value: (Array.isArray(passengerData) && passengerData.some(p => p.firstName)) ? 'Provided' : '', completed: isPassengerInfoComplete },
            { id: 'additional-info', title: 'Additional Information', value: isAdditionalInfoValid(additionalInfo) ? 'Provided' : '', completed: isAdditionalInfoValid(additionalInfo) },
            { id: 'add-on', title: 'Add To Booking', value: (Array.isArray(chooseAddOn) && chooseAddOn.length > 0) ? `${chooseAddOn.length} selected` : '', completed: (Array.isArray(chooseAddOn) && chooseAddOn.length > 0) }
        ] : []),
        ...(activitySelect === 'Buy Gift' ? [
            { id: 'experience', title: 'Experience', value: chooseFlightType?.type || '', completed: !!chooseFlightType?.type },
            { id: 'voucher-type', title: 'Voucher Type', value: selectedVoucherType ? `${selectedVoucherType.title} (${selectedVoucherType.quantity})` : '', completed: !!selectedVoucherType },
            { id: 'passenger-info', title: 'Purchaser Information', value: (Array.isArray(passengerData) && passengerData.some(p => p.firstName)) ? 'Provided' : '', completed: isBuyGiftPassengerComplete },
            { id: 'recipient-details', title: 'Recipient Details', value: recipientDetails?.name ? 'Provided' : (recipientDetails?.isSkipped ? 'Skipped' : ''), completed: !!recipientDetails?.name || !!recipientDetails?.isSkipped }
        ] : [])
    ];

    return (
        <>
            {/* Desktop/Tablet full card */}
            <div style={{ display: isMobile ? 'none' : 'block' }}>
                <div className="book_active">
                    <div className="book_data_active">
                        {/* En üstte Flight Type/What would you like to do? */}
                        <div className="book_data_active">
                            <div className={`row-1 ${(() => {
                                // For Redeem Voucher, only show green tick if voucher is valid
                                if (activitySelect === 'Redeem Voucher') {
                                    return voucherStatus === 'valid' ? 'active-card-val' : '';
                                }
                                // For other activity types, show green tick if selected
                                return activitySelect ? 'active-card-val' : '';
                            })()}`}>
                                <span className="active-book-card"></span>
                                <div className="active-book-cont">
                                    <h3>Flight Type</h3>
                                    <p>
                                        {activitySelect ? (
                                            activitySelect === 'Redeem Voucher' && voucherCode && voucherStatus === 'valid' ? 
                                            `${activitySelect} - ${voucherCode}` : 
                                            activitySelect === 'Redeem Voucher' && voucherCode && voucherStatus === 'invalid' ?
                                            `${activitySelect} - Invalid Code` :
                                            (activitySelect === 'Book Flight' ? 'Book Flight Date' : (activitySelect === 'Flight Voucher' ? 'Buy Flight Voucher' : (activitySelect === 'Buy Gift' ? 'Buy Gift Voucher' : activitySelect)))
                                        ) : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {activitySelect === 'Book Flight' && (
                            <>
                                <div className="book_data_active" onClick={() => setActiveAccordion("location")}> <div className={`row-1 ${chooseLocation ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont"><h3>Location</h3><p>{chooseLocation ? chooseLocation : ""}</p></div></div></div>
                                <div className="book_data_active" onClick={() => setActiveAccordion("experience")}> <div className={`row-1 ${chooseFlightType.passengerCount ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont"><h3>Experience</h3><p>{chooseFlightType.passengerCount ? chooseFlightType?.type : ""}</p></div></div></div>
                                {chooseLocation !== "Bristol Fiesta" && (
                                    <div className="book_data_active" onClick={() => setActiveAccordion("voucher-type")}> <div className={`row-1 ${selectedVoucherType ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Voucher Type</h3><p>{selectedVoucherType ? `${selectedVoucherType.title} (${selectedVoucherType.quantity} passenger${selectedVoucherType.quantity > 1 ? 's' : ''})` : ""}</p></div><div className="active-book-right"><p>{selectedVoucherType ? "£" + ((chooseFlightType?.type === 'Private Charter' ? (selectedVoucherType.totalPrice ?? selectedVoucherType.price ?? 0) : voucherTypePrice).toFixed(2)) : ""}</p></div></div></div></div>
                                )}
                                {/* Private Charter Weather Refundable Display */}
                                {chooseFlightType?.type === "Private Charter" && privateCharterWeatherRefund && (
                                    <div className="book_data_active"> <div className="row-1 active-card-val"> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Weather Refundable</h3><p>One-time charge for entire booking</p></div><div className="active-book-right"><p>£{(selectedVoucherType?.price * 0.1).toFixed(2)}</p></div></div></div></div>
                                )}
                                {chooseFlightType?.type === "Shared Flight" && weatherRefundPrice > 0 && (
                                    <div className="book_data_active"> <div className="row-1 active-card-val"> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Weather Refundable</h3><p>£47.50 per passenger</p></div><div className="active-book-right"><p>£{weatherRefundPrice.toFixed(2)}</p></div></div></div></div>
                                )}
                                <div className="book_data_active" onClick={() => setActiveAccordion("live-availability")}> <div className={`row-1 ${selectedDate && selectedTime ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Live Availability</h3><p>{selectedDate && selectedTime ? formatDateWithTime(selectedDate, selectedTime) : ""}</p></div></div></div></div>
                                <div className="book_data_active" onClick={() => setActiveAccordion("passenger-info")}> <div className={`row-1 ${passengerData && passengerData.length > 0 && passengerData[0].firstName !== '' ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Passenger Information</h3>{(passengerData && passengerData.length > 0 && passengerData.some(p => p.firstName && p.firstName.trim() !== '')) ? passengerData.map((data, index) => (data.firstName ? <div key={index}><p>{"Passenger " + `${index + 1}` + ": " + data.firstName + " " + data.lastName + " " + data.weight + "kg"}</p></div> : null)) : null}</div></div></div></div>
                                <div className="book_data_active" onClick={() => setActiveAccordion("additional-info")}> <div className={`row-1 ${isAdditionalInfoValid(additionalInfo) ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div className="active-book-left"><h3>Additional Information</h3></div></div></div></div>
                                {/* Preferences only for non-Book Flight and non-Redeem Voucher */}
                                {activitySelect !== 'Book Flight' && activitySelect !== 'Redeem Voucher' && (
                                    <div className="book_data_active" onClick={() => setActiveAccordion("select-preferences")}> <div className={`row-1 ${(activeAccordion === 'select-preferences' || activeAccordion === 'preference') ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div className="active-book-left"><h3>Preferences</h3>{(preference && ((preference.location && Object.values(preference.location).some(Boolean)) || (preference.time && Object.values(preference.time).some(Boolean)) || (preference.day && Object.values(preference.day).some(Boolean)))) ? null : <p>Not Provided</p>}</div></div></div></div>
                                )}
                                <div className="book_data_active" onClick={() => setActiveAccordion("add-on")}> <div className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Add To Booking</h3>{chooseAddOn?.length > 0 ? chooseAddOn?.map((data, index) => (<div className="active-book-cont final-active-book-cont" key={index}><div className="active-book-left" ><p>{data.name}</p></div><div className="active-book-right"><p>£{(data.name == 'Weather Refundable' || data.name == 'Weather Refundable ') ? ' 47.50' : data.price}</p></div></div>)) : null}</div></div></div></div>
                            </>
                        )}
                        {activitySelect === 'Redeem Voucher' && (
                            <>
                                <div className="book_data_active" onClick={() => setActiveAccordion("location")}> <div className={`row-1 ${chooseLocation ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="book-cont"><h3>Location</h3><p>{chooseLocation ? chooseLocation : ""}</p></div></div></div>
                                <div className="book_data_active" onClick={() => setActiveAccordion("live-availability")}> <div className={`row-1 ${selectedDate && selectedTime ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="book-cont final-active-book-cont"><div className="active-book-left"><h3>Live Availability</h3><p>{selectedDate && selectedTime ? formatDateWithTime(selectedDate, selectedTime) : ""}</p></div></div></div></div>
                                <div className="book_data_active" onClick={() => setActiveAccordion("passenger-info")}> <div className={`row-1 ${passengerData && passengerData.length > 0 && passengerData[0].firstName !== '' ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="book-cont final-active-book-cont"><div className="active-book-left"><h3>Passenger Information</h3>{(passengerData && passengerData.length > 0 && passengerData.some(p => p.firstName && p.firstName.trim() !== '')) ? passengerData.map((data, index) => (data.firstName ? <div key={index}><p>{"Passenger " + `${index + 1}` + ": " + data.firstName + " " + data.lastName + " " + data.weight + "kg"}</p></div> : null)) : null}</div></div></div></div>
                                <div className="book_data_active" onClick={() => setActiveAccordion("additional-info")}> <div className={`row-1 ${isAdditionalInfoValid(additionalInfo) ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="book-cont final-active-book-cont" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div className="active-book-left"><h3>Additional Information</h3></div></div></div></div>
                                {/* Preferences REMOVED for Redeem Voucher */}
                                <div className="book_data_active" onClick={() => setActiveAccordion("add-on")}> <div className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="book-cont final-active-book-cont"><div className="book-left"><h3>Add To Booking</h3>{chooseAddOn?.length > 0 ? chooseAddOn?.map((data, index) => (<div className="book-cont final-active-book-cont" key={index}><div className="book-left" ><p>{data.name}</p></div><div className="book-right"><p>£{(data.name == 'Weather Refundable' || data.name == 'Weather Refundable ') ? ' 47.50' : data.price}</p></div></div>)) : null}</div></div></div></div>
                            </>
                        )}
                        {activitySelect === 'Buy Gift' && (
                            <>
                                <div className="book_data_active" onClick={() => setActiveAccordion("experience")}> <div className={`row-1 ${chooseFlightType.passengerCount ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont"><h3>Experience</h3><p>{chooseFlightType.passengerCount ? chooseFlightType?.type : ""}</p></div></div></div>
                                {chooseLocation !== "Bristol Fiesta" && (
                                    <div className="book_data_active" onClick={() => setActiveAccordion("voucher-type")}> <div className={`row-1 ${selectedVoucherType ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Voucher Type</h3><p>{selectedVoucherType ? `${selectedVoucherType.title} (${selectedVoucherType.quantity} passenger${selectedVoucherType.quantity > 1 ? 's' : ''})` : ""}</p></div><div className="active-book-right"><p>{selectedVoucherType ? "£" + ((chooseFlightType?.type === 'Private Charter' ? (selectedVoucherType.totalPrice ?? selectedVoucherType.price ?? 0) : voucherTypePrice).toFixed(2)) : ""}</p></div></div></div></div>
                                )}
                                {/* Private Charter Weather Refundable Display */}
                                {chooseFlightType?.type === "Private Charter" && privateCharterWeatherRefund && (
                                    <div className="book_data_active"> <div className="row-1 active-card-val"> <span className="active-book-card"></span><div className="book-cont final-active-book-cont"><div className="active-book-left"><h3>Weather Refundable</h3><p>One-time charge for entire booking</p></div><div className="book-right"><p>£{(selectedVoucherType?.price * 0.1).toFixed(2)}</p></div></div></div></div>
                                )}
                                {chooseFlightType?.type === "Shared Flight" && weatherRefundPrice > 0 && (
                                    <div className="book_data_active"> <div className="row-1 active-card-val"> <span className="active-book-card"></span><div className="book-cont final-active-book-cont"><div className="book-left"><h3>Weather Refundable</h3><p>£47.50 per passenger</p></div><div className="book-right"><p>£{weatherRefundPrice.toFixed(2)}</p></div></div></div></div>
                                )}
                                {/* Swap order for Buy Gift: Purchaser Information above Recipient Details */}
                                <div className="book_data_active" onClick={() => setActiveAccordion("passenger-info")}> <div className={`row-1 ${passengerData && passengerData.length > 0 && passengerData[0].firstName !== '' ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Purchaser Information</h3>{(passengerData && passengerData.length > 0 && passengerData.some(p => p.firstName && p.firstName.trim() !== '')) ? passengerData.map((data, index) => (data.firstName ? <div key={index}><p>{data.firstName + " " + data.lastName}</p>{data.weatherRefund && <p style={{marginTop: '8px !important', color: '#666'}}>£47.50 Refundable</p>}</div> : null)) : null}</div></div></div></div>
                                <div className="book_data_active" onClick={() => setActiveAccordion("recipient-details")}> <div className={`row-1 ${recipientDetails?.name || recipientDetails?.isSkipped ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont"><h3>Recipient Details</h3><p>{recipientDetails?.name ? recipientDetails.name : (recipientDetails?.isSkipped ? "Skipped" : "")}</p></div></div></div>
                                <div className="book_data_active" onClick={() => setActiveAccordion("add-on")}> <div className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Add To Booking</h3>{chooseAddOn?.length > 0 ? chooseAddOn?.map((data, index) => (<div className="active-book-cont final-active-book-cont" key={index}><div className="active-book-left" ><p>{data.name}</p></div><div className="active-book-right"><p>£{(data.name == 'Weather Refundable' || data.name == 'Weather Refundable ') ? ' 47.50' : data.price}</p></div></div>)) : null}</div></div></div></div>
                            </>
                        )}
                        {activitySelect === 'Flight Voucher' && (
                            <>
                                <div className="book_data_active" onClick={() => setActiveAccordion("experience")}> <div className={`row-1 ${chooseFlightType.passengerCount ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont"><h3>Experience</h3><p>{chooseFlightType.passengerCount ? chooseFlightType?.type : ""}</p></div></div></div>
                                {chooseLocation !== "Bristol Fiesta" && (
                                    <div className="book_data_active" onClick={() => setActiveAccordion("voucher-type")}> <div className={`row-1 ${selectedVoucherType ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Voucher Type</h3><p>{selectedVoucherType ? `${selectedVoucherType.title} (${selectedVoucherType.quantity} passenger${selectedVoucherType.quantity > 1 ? 's' : ''})` : ""}</p></div><div className="active-book-right"><p>{selectedVoucherType ? "£" + ((chooseFlightType?.type === 'Private Charter' ? (selectedVoucherType.totalPrice ?? selectedVoucherType.price ?? 0) : voucherTypePrice).toFixed(2)) : ""}</p></div></div></div></div>
                                )}
                                {/* Private Charter Weather Refundable Display */}
                                {chooseFlightType?.type === "Private Charter" && privateCharterWeatherRefund && (
                                    <div className="book_data_active"> <div className="row-1 active-card-val"> <span className="active-book-card"></span><div className="book-cont final-active-book-cont"><div className="book-left"><h3>Weather Refundable</h3><p>One-time charge for entire booking</p></div><div className="book-right"><p>£{(selectedVoucherType?.price * 0.1).toFixed(2)}</p></div></div></div></div>
                                )}
                                {chooseFlightType?.type === "Shared Flight" && weatherRefundPrice > 0 && (
                                    <div className="book_data_active"> <div className="row-1 active-card-val"> <span className="active-book-card"></span><div className="book-cont final-active-book-cont"><div className="book-left"><h3>Weather Refundable</h3><p>£47.50 per passenger</p></div><div className="book-right"><p>£{weatherRefundPrice.toFixed(2)}</p></div></div></div></div>
                                )}
                                <div className="book_data_active" onClick={() => setActiveAccordion("passenger-info")}> <div className={`row-1 ${passengerData && passengerData.length > 0 && passengerData[0].firstName !== '' ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Passenger Information</h3>{(passengerData && passengerData.length > 0 && passengerData.some(p => p.firstName && p.firstName.trim() !== '')) ? passengerData.map((data, index) => (data.firstName ? <div key={index}><p>{"Passenger " + `${index + 1}` + ": " + data.firstName + " " + data.lastName + " " + data.weight + "kg"}</p></div> : null)) : null}</div></div></div></div>
                                <div className="book_data_active" onClick={() => setActiveAccordion("additional-info")}> <div className={`row-1 ${isAdditionalInfoValid(additionalInfo) ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div className="active-book-left"><h3>Additional Information</h3>{isAdditionalInfoValid(additionalInfo) ? null : null}</div></div></div></div>
                                {/* Preferences removed for Flight Voucher */}
                                <div className="book_data_active" onClick={() => setActiveAccordion("add-on")}> <div className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Add To Booking</h3>{chooseAddOn?.length > 0 ? chooseAddOn?.map((data, index) => (<div className="active-book-cont final-active-book-cont" key={index}><div className="active-book-left" ><p>{data.name}</p></div><div className="active-book-right"><p>£{(data.name == 'Weather Refundable' || data.name == 'Weather Refundable ') ? ' 47.50' : data.price}</p></div></div>)) : null}</div></div></div></div>
                            </>
                        )}
                        <div className="bottom_main">
                            <h3>Total</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                {activitySelect === 'Redeem Voucher' && voucherData && (
                                    <p style={{ 
                                        textDecoration: 'line-through', 
                                        color: '#999', 
                                        fontSize: '0.9rem',
                                        margin: '0 0 4px 0'
                                    }}>
                                        £{(parseFloat(voucherData.paid_amount || voucherData.detail?.paid || voucherData.final_amount || 100)).toFixed(2)}
                                    </p>
                                )}
                                <p style={{ fontWeight: 500, fontSize: '1.2rem', margin: 0 }}>
                                    {activitySelect === 'Redeem Voucher' ? 
                                        `£${totalPrice.toFixed(2)}` : 
                                        (totalPrice > 0 ? `£${totalPrice.toFixed(2)}` : "")
                                    }
                                </p>
                            </div>
                        </div>
                        {!isBookDisabled && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '0px', marginBottom: '0px' }}>
                                <button
                                    className="booking_btn final_booking-button"
                                    style={{
                                        background: '#00eb5b',
                                        color: '#fff',
                                        fontWeight: 500,
                                        borderRadius: '8px',
                                        padding: '8px 22px',
                                        cursor: 'pointer',
                                        opacity: 1,
                                        border: 'none'
                                    }}
                                    onClick={() => {
                                        setShowWarning(false);
                                        handleBookData();
                                    }}
                                    type="button"
                                >
                                    Book
                                </button>
                            </div>
                        )}
                        {showWarning && (
                            <div style={{ color: 'red', marginTop: 10, fontSize: '14px', textAlign: 'center' }}>
                                {activitySelect === 'Book Flight' && (
                                    <>
                                        Please complete all required fields:<br/>
                                        • Flight Location and Experience<br/>
                                        • Voucher Type<br/>
                                        • Live Availability (Date & Time)<br/>
                                        • Passenger Information (All fields required)<br/>
                                        • Additional Information<br/>
                                        • Add to Booking
                                    </>
                                )}
                                {activitySelect === 'Redeem Voucher' && (
                                    <>
                                        Please complete all required fields:<br/>
                                        • Flight Location and Experience<br/>
                                        • Live Availability (Date & Time)<br/>
                                        • Passenger Information (All fields required)<br/>
                                        • Additional Information<br/>
                                        • Add to Booking
                                    </>
                                )}
                                {activitySelect === 'Flight Voucher' && (
                                    <>
                                        Please complete all required fields:<br/>
                                        • Experience<br/>
                                        • Passenger Information (All fields required)<br/>
                                        • Additional Information<br/>
                                        • Add to Booking
                                    </>
                                )}
                                {activitySelect === 'Buy Gift' && (
                                    <>
                                        Please complete all required fields:<br/>
                                        • Experience<br/>
                                        • Voucher Type<br/>
                                        • Recipient Details<br/>
                                        • Purchaser Information (All fields required)<br/>
                                        • Add to Booking
                                    </>
                                )}
                                {activitySelect !== 'Book Flight' && activitySelect !== 'Redeem Voucher' && activitySelect !== 'Flight Voucher' && activitySelect !== 'Buy Gift' && (
                                    'Please fill in all required steps before booking.'
                                )}
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
                            <strong>Summary</strong>
                            <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {activitySelect === 'Redeem Voucher' && voucherData && (
                                    <span style={{ 
                                        textDecoration: 'line-through', 
                                        color: '#999', 
                                        fontSize: '0.9rem' 
                                    }}>
                                        £{(parseFloat(voucherData.paid_amount || voucherData.detail?.paid || voucherData.final_amount || 100)).toFixed(2)}
                                    </span>
                                )}
                                <span style={{ color: '#666' }}>
                                    {activitySelect === 'Redeem Voucher' ? 
                                        `£${totalPrice.toFixed(2)}` : 
                                        (totalPrice > 0 ? `£${totalPrice.toFixed(2)}` : '')
                                    }
                                </span>
                            </div>
                        </div>
                        <button
                            className="summary-sticky-book"
                            disabled={isBookDisabled}
                            onClick={(e) => { e.stopPropagation(); if (!isBookDisabled) handleBookData(); }}
                            onMouseEnter={() => {
                                console.log('=== MOBILE STICKY BOOK (HOVER) ===', {
                                    isBookDisabled,
                                    activitySelect,
                                    isGiftVoucher,
                                    buttonText: isBookDisabled ? 'DISABLED' : 'ENABLED'
                                });
                            }}
                            style={{ background: '#00eb5b', color: '#fff', border: 'none' }}
                        >
                            Book
                        </button>
                    </div>
                    {isDrawerOpen && (
                        <div className="summary-overlay" onClick={() => setIsDrawerOpen(false)}>
                            <div className="summary-drawer" onClick={(e) => e.stopPropagation()}>
                                <div className="summary-drawer-header">
                                    <span>Booking Summary</span>
                                    <button className="drawer-close" onClick={() => setIsDrawerOpen(false)}>✕</button>
                                </div>
                                <div className="summary-drawer-body">
                                    {mobileSections.map((s) => (
                                        <div key={s.id} className={`summary-row ${s.completed ? 'completed' : ''}`} onClick={() => { setIsDrawerOpen(false); setActiveAccordion(s.id); }}>
                                            <div className="summary-row-left">
                                                <div className="summary-dot" />
                                                <div>
                                                    <div className="summary-row-title">{s.title}</div>
                                                    <div className="summary-row-sub">{s.value}</div>
                                                </div>
                                            </div>
                                            <div className="summary-chevron">›</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="summary-drawer-footer">
                                    <div className="summary-total" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        {activitySelect === 'Redeem Voucher' && voucherData && (
                                            <span style={{ 
                                                textDecoration: 'line-through', 
                                                color: '#999', 
                                                fontSize: '0.9rem',
                                                marginBottom: '4px'
                                            }}>
                                                £{(parseFloat(voucherData.paid_amount || voucherData.detail?.paid || voucherData.final_amount || 100)).toFixed(2)}
                                            </span>
                                        )}
                                        <span>
                                            {activitySelect === 'Redeem Voucher' ? 
                                                `£${totalPrice.toFixed(2)}` : 
                                                (totalPrice > 0 ? `£${totalPrice.toFixed(2)}` : '')
                                            }
                                        </span>
                                    </div>
                                    <button
                                        className="summary-primary"
                                        disabled={isBookDisabled}
                                        onClick={() => { if (!isBookDisabled) handleBookData(); }}
                                        style={{
                                            width: '55%',
                                            maxWidth: 220,
                                            minWidth: 160,
                                            alignSelf: 'center'
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
                onClose={() => setSuccessModalOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: 24, pb: 2, color: '#3274b4' }}>
                    {successModalData?.voucherMarkError ? '✓ Booking Created Successfully!' : '✓ Voucher Successfully Redeemed!'}
                </DialogTitle>
                <DialogContent>
                    {successModalData && (
                        <Box sx={{ py: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#3274b4' }}>
                                Booking Summary
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Booking ID
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {successModalData.bookingId}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Location
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {successModalData.location || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Live Availability
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {successModalData.flightDate 
                                        ? new Date(successModalData.flightDate).toLocaleDateString('en-GB', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        }) + (successModalData.selectedTime ? ` at ${successModalData.selectedTime}` : '')
                                        : 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Voucher Code
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: '#3274b4' }}>
                                    {successModalData.voucherCode || 'N/A'}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                                    Passengers
                                </Typography>
                                {successModalData.passengers && successModalData.passengers.length > 0 ? (
                                    successModalData.passengers.map((passenger, index) => (
                                        <Typography key={index} variant="body1" sx={{ mb: 0.5 }}>
                                            {index + 1}. {passenger.firstName} {passenger.lastName} 
                                            {passenger.weight ? ` (${passenger.weight}kg)` : ''}
                                            {passenger.weatherRefund ? ' - WX Refundable' : ''}
                                        </Typography>
                                    ))
                                ) : (
                                    <Typography variant="body1">No passengers</Typography>
                                )}
                            </Box>

                            {successModalData.additionalInfo && (successModalData.additionalInfo.notes || Object.keys(successModalData.additionalInfo).length > 0) && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                                            Additional Information
                                        </Typography>
                                        {successModalData.additionalInfo.notes ? (
                                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
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

                            {successModalData.addToBooking && successModalData.addToBooking.length > 0 && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                                            Add To Booking
                                        </Typography>
                                        {successModalData.addToBooking.map((item, index) => (
                                            <Typography key={index} variant="body1" sx={{ mb: 0.5 }}>
                                                • {typeof item === 'object' ? item.title || item.name : item}
                                            </Typography>
                                        ))}
                                    </Box>
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 2, justifyContent: 'center' }}>
                    <Button
                        onClick={() => {
                            setSuccessModalOpen(false);
                            setSuccessModalData(null);
                        }}
                        variant="contained"
                        color="primary"
                        sx={{
                            minWidth: 120,
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default RightInfoCard;
