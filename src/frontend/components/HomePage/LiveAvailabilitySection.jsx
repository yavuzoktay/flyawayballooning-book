import React, { useEffect, useState } from "react";
import Accordion from "../Common/Accordion";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isBefore,
    isSameMonth
} from 'date-fns';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import Modal from "../Common/Modal";
import LocationSection from "./LocationSection";
import ChooseActivityCard from "./ChooseActivityCard";
import axios from 'axios';
import Tooltip from '@mui/material/Tooltip';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CheckIcon from '@mui/icons-material/Check';

const LiveAvailabilitySection = ({ isGiftVoucher, isFlightVoucher, selectedDate, setSelectedDate, activeAccordion, setActiveAccordion, selectedActivity, availableSeats, chooseLocation, selectedTime, setSelectedTime, availabilities, activitySelect, chooseFlightType, selectedVoucherType, onSectionCompletion, isDisabled = false }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookedSeat, setBookedSeat] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Bristol Fiesta için Ağustos ayı mantığı, diğer lokasyonlar için güncel ay
    useEffect(() => {
        if (chooseLocation === "Bristol Fiesta") {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth(); // 0-11, Ağustos = 7
            
            // Eğer şu anki ay Ağustos'tan sonraysa, gelecek yılın Ağustos'unu göster
            // Eğer şu anki ay Ağustos'tan önceyse, bu yılın Ağustos'unu göster
            let targetYear = currentYear;
            if (currentMonth > 7) { // Ağustos'tan sonra
                targetYear = currentYear + 1;
            }
            
            // Ağustos ayını hedefle (month = 7, 0-indexed)
            const augustDate = new Date(targetYear, 7, 1);
            setCurrentDate(augustDate);
        } else if (chooseLocation) {
            // Diğer lokasyonlar için güncel aya dön
            const now = new Date();
            setCurrentDate(now);
        }
    }, [chooseLocation]);

    // Bristol Fiesta için müsaitlik kontrolü - Ağustos aylarında müsaitlik var mı kontrol et
    useEffect(() => {
        if (chooseLocation === "Bristol Fiesta") {
            // Müsaitlik verisi henüz yüklenmemişse, sadece Ağustos ayına geç
            if (!availabilities || availabilities.length === 0) {
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth();
                
                let startYear = currentYear;
                if (currentMonth > 7) { // Ağustos'tan sonra
                    startYear = currentYear + 1;
                }
                
                const augustDate = new Date(startYear, 7, 1);
                setCurrentDate(augustDate);
                console.log(`Bristol Fiesta: No availabilities loaded yet, setting to August ${startYear}`);
                return;
            }
            
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            
            // Başlangıç yılı belirle
            let startYear = currentYear;
            if (currentMonth > 7) { // Ağustos'tan sonra
                startYear = currentYear + 1;
            }
            
            // Ağustos aylarında müsaitlik kontrolü (maksimum 5 yıl ileriye bak)
            let targetYear = startYear;
            let foundAvailability = false;
            
            for (let year = startYear; year <= startYear + 5; year++) {
                const augustDate = new Date(year, 7, 1); // Ağustos ayı
                const yearMonth = format(augustDate, 'yyyy-MM');
                
                // Bu yılın Ağustos ayında müsaitlik var mı kontrol et
                const augustAvailabilities = availabilities.filter(a => {
                    if (!a.date) return false;
                    const availabilityDate = new Date(a.date);
                    const availabilityYearMonth = format(availabilityDate, 'yyyy-MM');
                    return availabilityYearMonth === yearMonth && 
                           (a.status === 'Open' || a.status === 'open') && 
                           a.capacity > 0;
                });
                
                if (augustAvailabilities.length > 0) {
                    targetYear = year;
                    foundAvailability = true;
                    break;
                }
            }
            
            // Müsaitlik bulunan yılın Ağustos ayına geç
            if (foundAvailability) {
                const targetAugustDate = new Date(targetYear, 7, 1);
                setCurrentDate(targetAugustDate);
                console.log(`Bristol Fiesta: Found availability in August ${targetYear}, switching to that month`);
            } else {
                console.log(`Bristol Fiesta: No availability found in August for years ${startYear}-${startYear + 5}`);
            }
        }
    }, [chooseLocation, availabilities]);
    
    // Notification state for time selection
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");

    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [requestName, setRequestName] = useState("");
    const [requestPhone, setRequestPhone] = useState("");
    const [requestEmail, setRequestEmail] = useState("");
    const [requestLocation, setRequestLocation] = useState("");
    const [requestFlightType, setRequestFlightType] = useState("");
    const [requestDate, setRequestDate] = useState("");
    const allLocations = ["Bath", "Devon", "Somerset", "Bristol Fiesta"];
    const allFlightTypes = ["Book Flight Date", "Buy Flight Voucher", "Redeem Voucher", "Buy Gift Voucher"];
    const [requestSuccess, setRequestSuccess] = useState("");
    const [requestError, setRequestError] = useState("");
    // State'e yeni bir error ekle
    const [formError, setFormError] = useState("");
    // Her input için ayrı error state
    const [nameError, setNameError] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [locationError, setLocationError] = useState(false);
    const [flightTypeError, setFlightTypeError] = useState(false);
    const [dateError, setDateError] = useState(false);
    // Ek hata state'leri
    const [nameFormatError, setNameFormatError] = useState(false);
    const [phoneFormatError, setPhoneFormatError] = useState(false);
    const [emailFormatError, setEmailFormatError] = useState(false);
    
    // Derive available experiences for selected location from ExperienceSection data
    const availableExperiencesForLocation = React.useMemo(() => {
        try {
            if (Array.isArray(selectedActivity) && selectedActivity.length > 0) {
                const names = new Set();
                selectedActivity.forEach(a => {
                    if (Array.isArray(a?.flight_types)) {
                        a.flight_types.forEach(ft => ft?.type && names.add(ft.type));
                    } else if (a?.experience_type) {
                        names.add(a.experience_type);
                    }
                });
                if (names.size > 0) return Array.from(names);
            }
            if (chooseFlightType?.type) return [chooseFlightType.type];
            return ['Shared Flight', 'Private Charter'];
        } catch (_) {
            return ['Shared Flight', 'Private Charter'];
        }
    }, [selectedActivity, chooseFlightType]);
    
    // New state for time selection popup
    const [timeSelectionModalOpen, setTimeSelectionModalOpen] = useState(false);
    const [selectedDateForTime, setSelectedDateForTime] = useState(null);
    const [tempSelectedTime, setTempSelectedTime] = useState(null);
    // Hover state for time buttons (desktop only)
    const [hoveredTime, setHoveredTime] = useState(null);
    
    // Timeout functionality removed
    
    // Removed capacity warning modal approach; we'll indicate issues inline in time picker
    
    // Get selected passenger count from voucher type
    const getSelectedPassengerCount = () => {
        if (!selectedVoucherType?.quantity) {
            return 2; // Default passenger count
        }
        return selectedVoucherType.quantity;
    };

    // Responsive calendar cell size for mobile
    const [daySize, setDaySize] = useState(80);
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const computeSizes = () => {
            const w = window.innerWidth;
            setIsMobile(w <= 768);
            // 7 columns must fit within container padding; pick safe sizes
            if (w <= 360) setDaySize(32);
            else if (w <= 420) setDaySize(36);
            else if (w <= 480) setDaySize(40);
            else if (w <= 576) setDaySize(44);
            else if (w <= 768) setDaySize(48);
            else setDaySize(80);
        };
        computeSizes();
        window.addEventListener('resize', computeSizes);
        return () => window.removeEventListener('resize', computeSizes);
    }, []);

    var final_pax_count = selectedActivity?.[0]?.seats;

    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0, 0); // Current date at start of day in local timezone
    // Change startDate and endDate to only cover the current month
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    
    // Check if location and experience are selected
    // For Book Flight: need flight type (voucher type filtering happens later in the filter function, so we allow filtering even without voucher type)
    // For Redeem Voucher: only need location and activity
    // For Bristol Fiesta: only need location and activity (no voucher type required)
    // For Shopify flow: if selectedActivity exists, allow showing availabilities even if chooseFlightType is temporarily reset
    const isShopifyFlow = (() => {
        try {
            const params = new URLSearchParams(window.location.search || '');
            return params.get('source') === 'shopify';
        } catch {
            return false;
        }
    })();
    
    // Detect Bing/Edge browser for more aggressive availability display
    const isBingBrowser = (() => {
        try {
            return navigator.userAgent.includes('Edg') || navigator.userAgent.includes('Bing');
        } catch {
            return false;
        }
    })();
    
    // For Shopify flow, if we have location and selectedActivity, allow showing availabilities even if chooseFlightType is temporarily empty
    // This handles the case where chooseFlightType gets reset but we still want to show availabilities
    const hasLocationAndActivity = chooseLocation && selectedActivity && selectedActivity.length > 0;
    const hasFlightTypeOrShopify = chooseFlightType?.type || (isShopifyFlow && hasLocationAndActivity);
    
    // For Shopify flow, also check if we have availabilities data - if we do, allow showing them even if chooseFlightType is temporarily empty
    // This is important for Chrome and Bing browsers where state updates might happen in different order
    const hasAvailabilitiesData = availabilities && availabilities.length > 0;
    const shopifyFlowWithData = isShopifyFlow && hasLocationAndActivity && hasAvailabilitiesData;
    
    // For Bing browser, also allow showing availabilities if we have location, activity, and availabilities data
    // This handles cases where Bing browser state updates happen in different order
    const bingBrowserWithData = isBingBrowser && hasLocationAndActivity && hasAvailabilitiesData;
    
    const isLocationAndExperienceSelected = !!(
        hasLocationAndActivity && (
            (activitySelect === 'Book Flight' && (hasFlightTypeOrShopify || shopifyFlowWithData || bingBrowserWithData)) || // Allow filtering by flight type OR if Shopify flow with selectedActivity OR if Shopify flow with availabilities data OR if Bing browser with availabilities data
        (activitySelect === 'Redeem Voucher') ||
        (chooseLocation === 'Bristol Fiesta') || // Bristol Fiesta için sadece lokasyon ve aktivite yeterli
        (activitySelect !== 'Book Flight' && activitySelect !== 'Redeem Voucher')
        )
    );
    
    // Terms for Bristol Fiesta
    const bristolFiestaTerms = [
        "Ballooning is a weather dependent activity.",
        "Your voucher is valid for 24 months.",
        "Without the weather refundable option your voucher is non-refundable under any circumstances. However, re-bookable as needed within voucher validity period.",
        "If you make 10 attempts to fly within 24 months which are cancelled by us, we will extend your voucher for a further 12 months free of charge.",
        "Within 48 hours of your flight no changes or cancellations can be made.",
        "Your flight will never expire so long as you meet the terms & conditions. "
    ];
    
    // PRODUCTION DEBUG: Monitor availabilities state changes
    useEffect(() => {
        console.log('=== LiveAvailabilitySection availabilities changed ===');
        console.log('New availabilities count:', availabilities?.length);
        console.log('New availabilities data:', availabilities);
        console.log('isLocationAndExperienceSelected:', isLocationAndExperienceSelected);
        console.log('==================================================');
    }, [availabilities, isLocationAndExperienceSelected]);
    
    // PRODUCTION DEBUG: Monitor Voucher Type changes
    useEffect(() => {
        console.log('=== VOUCHER TYPE CHANGED DEBUG ===');
        console.log('selectedVoucherType:', selectedVoucherType);
        console.log('availabilities count:', availabilities?.length);
        console.log('availabilities data:', availabilities);
        console.log('chooseLocation:', chooseLocation);
        console.log('selectedActivity:', selectedActivity);
        console.log('chooseFlightType:', chooseFlightType);
        console.log('activitySelect:', activitySelect);
        console.log('================================');
    }, [selectedVoucherType, availabilities, chooseLocation, selectedActivity, chooseFlightType, activitySelect]);
    
    // PRODUCTION DEBUG: Monitor isLocationAndExperienceSelected changes
    useEffect(() => {
        console.log('=== isLocationAndExperienceSelected DEBUG ===');
        console.log('chooseLocation:', chooseLocation);
        console.log('selectedActivity:', selectedActivity);
        console.log('chooseFlightType:', chooseFlightType);
        console.log('selectedVoucherType:', selectedVoucherType);
        console.log('activitySelect:', activitySelect);
        console.log('Result:', isLocationAndExperienceSelected);
        console.log('==========================================');
    }, [chooseLocation, selectedActivity, chooseFlightType, selectedVoucherType, activitySelect, isLocationAndExperienceSelected]);

    const handlePrevMonth = () => {
        if (chooseLocation === "Bristol Fiesta") {
            // Bristol Fiesta için sadece Ağustos ayları arasında geçiş yap
            const prevAugust = subMonths(currentDate, 12); // 1 yıl önceki Ağustos
            setCurrentDate(prevAugust);
        } else {
            setCurrentDate(subMonths(currentDate, 1));
        }
    };

    const handleNextMonth = () => {
        if (chooseLocation === "Bristol Fiesta") {
            // Bristol Fiesta için sadece Ağustos ayları arasında geçiş yap
            const nextAugust = addMonths(currentDate, 12); // 1 yıl sonraki Ağustos
            setCurrentDate(nextAugust);
        } else {
            setCurrentDate(addMonths(currentDate, 1));
        }
    };

    const handleDateClick = (date) => {
        // Only allow date selection if location and experience are selected
        // For Shopify flow and Bing browser, allow selection even if chooseFlightType is temporarily empty (if we have availabilities data)
        if (!isLocationAndExperienceSelected && !shopifyFlowWithData && !bingBrowserWithData) {
            setIsModalOpen(true);
            return;
        }
        
        // Check if voucher type is selected (required for capacity check)
        if (!selectedVoucherType) {
            console.log('No voucher type selected, allowing date selection');
            // Continue with normal flow
        }
        
        // Create date strings manually to avoid timezone issues
        const dateYear = date.getFullYear();
        const dateMonth = date.getMonth();
        const dateDay = date.getDate();
        const dateStartOfDay = new Date(dateYear, dateMonth, dateDay, 0, 0, 0, 0);
        
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();
        const todayDay = today.getDate();
        const todayStartOfDay = new Date(todayYear, todayMonth, todayDay, 0, 0, 0, 0);
        
        if (dateStartOfDay >= todayStartOfDay) {
            // Show time selection popup instead of directly setting the date
            setSelectedDateForTime(date);
            setTempSelectedTime(null); // Reset temporary time selection
            setTimeSelectionModalOpen(true);
        }
    };

    const handleTimeClick = (time) => {
        // Only allow time selection if location and experience are selected
        // For Shopify flow and Bing browser, allow selection even if chooseFlightType is temporarily empty (if we have availabilities data)
        if (!isLocationAndExperienceSelected && !shopifyFlowWithData && !bingBrowserWithData) {
            setIsModalOpen(true);
            return;
        }
        
        setSelectedTime(time);
        // Seçilen saat ile birlikte tarihi güncelle (tarih saat birleşik olsun)
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            const [h, m] = time.split(':');
            newDate.setHours(Number(h));
            newDate.setMinutes(Number(m));
            newDate.setSeconds(0); // Saniyeyi sıfırla
            setSelectedDate(newDate);
        }
    };

    // Handle time selection from popup
    const handleTimeSelection = (time) => {
        // Capacity will be indicated inline; selection for insufficient slots is disabled in the UI
        
        setSelectedDate(selectedDateForTime);
        setSelectedTime(time);
        setTimeSelectionModalOpen(false);
        setTempSelectedTime(null); // Reset temporary selection
        
        // Show notification for time selection
        const formattedDate = format(selectedDateForTime, 'MMMM d, yyyy');
        setNotificationMessage(`${formattedDate} at ${time} Selected`);
        setShowNotification(true);
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
            setShowNotification(false);
        }, 3000);
        
        // Trigger section completion to close current section and open next one
        if (onSectionCompletion) {
            onSectionCompletion('live-availability');
        }
        
        // Countdown timer removed - no automatic timeout
    };
    
    // Countdown timer functions removed - no automatic timeout
    
    // Countdown timer cleanup removed - no automatic timeout
    
    // Countdown timer cleanup removed - no automatic timeout

    // Check if form is valid for submission
    const isFormValid = requestName.trim() && requestEmail.trim() && requestLocation && requestFlightType && requestDate;

    const handleShowAllErrors = () => {
        if (!requestName.trim()) setNameError(true);
        if (!requestEmail.trim()) setEmailError(true);
        if (!requestLocation) setLocationError(true);
        if (!requestFlightType) setFlightTypeError(true);
        if (!requestDate) setDateError(true);
    };

    if (chooseLocation === '') {
        setIsModalOpen(true);
    }

    const normalizeVoucherName = (value = '') => {
        if (typeof value !== 'string') return '';
        return value.replace(/\([^)]*\)/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    };

    const parseNumber = (value, fallback = 0) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    };

    const getSlotStatus = (slot) => (slot?.calculated_status || slot?.status || '').toLowerCase();

    const isPrivateSelection = (chooseFlightType?.type || '').toLowerCase().includes('private');
    const requiredSeats = Math.max(1, parseInt(chooseFlightType?.passengerCount, 10) || (isPrivateSelection ? 8 : 1));

    const getRemainingSeats = (slot) => {
        if (!slot) return 0;
        if (slot.calculated_available !== undefined && slot.calculated_available !== null) {
            return Math.max(0, parseNumber(slot.calculated_available, 0));
        }
        if (typeof slot.actualAvailable === 'number') {
            return Math.max(0, slot.actualAvailable);
        }
        if (typeof slot.available === 'number') {
            return Math.max(0, slot.available);
        }
        if (typeof slot.shared_capacity === 'number' && typeof slot.shared_booked === 'number') {
            return Math.max(0, slot.shared_capacity - slot.shared_booked);
        }
        if (typeof slot.shared_capacity === 'number') {
            return Math.max(0, slot.shared_capacity);
        }
        return 0;
    };

    // Balloon 210 is a global resource across locations for a given date+time.
    // If any shared booking has consumed Balloon 210 at that date+time, large Private Charter (5–8 pax)
    // must NOT be selectable in ANY location at that same date+time.
    const normalizeSlotDate = (value) => {
        if (!value) return '';
        return String(value).split('T')[0].split(' ')[0].trim();
    };
    const normalizeSlotTime = (value) => {
        if (!value) return '';
        return String(value).trim();
    };
    const balloon210InUseByDateTime = React.useMemo(() => {
        const map = new Map();
        (availabilities || []).forEach(s => {
            const dateKey = normalizeSlotDate(s?.date);
            const timeKey = normalizeSlotTime(s?.time);
            if (!dateKey || !timeKey) return;
            const key = `${dateKey}|${timeKey}`;
            const balloon210LockedAny = Number(s?.balloon210_locked || s?.shared_slots_used || 0) > 0;
            const sharedBookedAny = Number(s?.shared_booked || s?.shared_consumed_pax || 0);
            if (balloon210LockedAny || sharedBookedAny > 0) {
                map.set(key, true);
            }
        });
        return map;
    }, [availabilities]);

    const getAvailableSeatsForSelection = (slot) => {
        if (!slot) return 0;

        const baseAvailable = getRemainingSeats(slot);
        const balloon210Locked = Number(slot.balloon210_locked || slot.shared_slots_used || 0) > 0;
        const sharedBooked = Number(slot.shared_booked || slot.shared_consumed_pax || 0);
        const isSmallPrivateSelection = isPrivateSelection && requiredSeats > 0 && requiredSeats <= 4;

        // SHARED FLOW (uses Balloon 210)
        if (!isPrivateSelection) {
            // If Balloon 210 is assigned to a different location, no shared seats are available for this location
            // Shared flights can share Balloon 210 within the same location, but not across different locations
            if (balloon210Locked) {
                return 0;
            }
            return baseAvailable;
        }

        // PRIVATE FLOW
        if (isSmallPrivateSelection) {
            // 1–4 pax private charter uses Balloon 105 resource
            const remaining105 = (typeof slot.private_charter_small_remaining === 'number')
                ? slot.private_charter_small_remaining
                : (Number(slot.private_charter_small_bookings || 0) > 0 ? 0 : 4);

            if (remaining105 <= 0) {
                return 0;
            }

            return remaining105 >= requiredSeats ? remaining105 : 0;
        }

        // Large private charter (5–8 pax) uses Balloon 210 exclusively
        const slotDateKey = normalizeSlotDate(slot?.date);
        const slotTimeKey = normalizeSlotTime(slot?.time);
        const balloon210InUseGlobally = slotDateKey && slotTimeKey
            ? Boolean(balloon210InUseByDateTime.get(`${slotDateKey}|${slotTimeKey}`))
            : false;

        // If Balloon 210 is already consumed by shared at this date+time (any location), block large private.
        // Also block if this specific slot indicates Balloon 210 is locked or shared booked.
        if (balloon210Locked || sharedBooked > 0 || balloon210InUseGlobally) {
            return 0;
        }

        return baseAvailable >= requiredSeats ? baseAvailable : 0;
    };

    const getVoucherTypesForAvailability = (availability) => {
        if (!availability) return [];
        const fromArray = (value) => value.map(item => {
            if (typeof item === 'string') {
                return item.trim();
            }
            return item;
        }).filter(Boolean);
        
        // First check voucher_types_array (already parsed)
        if (Array.isArray(availability.voucher_types_array) && availability.voucher_types_array.length > 0) {
            return fromArray(availability.voucher_types_array);
        }
        
        // Then check voucher_types as array
        if (Array.isArray(availability.voucher_types) && availability.voucher_types.length > 0) {
            return fromArray(availability.voucher_types);
        }
        
        // Parse string voucher_types (handles both "Proposal Flight ,Private Charter" and "Private Charter,Proposal Flight")
        const parseString = (str) => {
            if (!str || typeof str !== 'string') return [];
            // Split by comma and trim each part, then filter out empty strings
            return str.split(',').map(s => s.trim()).filter(Boolean);
        };
        
        if (typeof availability.voucher_types === 'string' && availability.voucher_types.trim() !== '') {
            return parseString(availability.voucher_types);
        }
        
        if (typeof availability.activity_voucher_types === 'string' && availability.activity_voucher_types.trim() !== '') {
            return parseString(availability.activity_voucher_types);
        }
        
        return [];
    };

    // Yeni: availabilities [{id, date, time, capacity, available, ...}] düz listede geliyor
    // Calendar için: hangi günlerde en az 1 açık slot var?
    console.log('LiveAvailabilitySection received availabilities:', availabilities);
    console.log('Current date range:', { startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd'), currentDate: format(currentDate, 'yyyy-MM-dd') });
    
    // Filter availabilities - respect selected voucher type when provided
    // Only filter if location and experience are selected
    const voucherWildcardTerms = ['any voucher', 'any vouchers', 'all voucher types', 'all vouchers', 'any', 'all', 'any voucher type', 'any voucher types', 'any voucher option'];
    const matchesLocation = (availability) => {
        if (!chooseLocation) return true;
        if (!availability?.location) return true;
        return availability.location === chooseLocation;
    };
    const matchesExperience = (availability) => {
        if (!chooseFlightType?.type) return true;
        
        if (!Array.isArray(availability?.flight_types_array) || availability.flight_types_array.length === 0) {
            // Fallback: check flight_types string if flight_types_array is empty
            if (availability?.flight_types) {
                const flightTypesStr = String(availability.flight_types).toLowerCase();
                const selectedType = (chooseFlightType.type || '').toLowerCase().trim();
                if (selectedType.includes('shared') && flightTypesStr.includes('shared')) {
                    return true;
                }
                if (selectedType.includes('private') && flightTypesStr.includes('private')) {
                    return true;
                }
            }
            return true;
        }

        const selectedType = (chooseFlightType.type || '').toLowerCase().trim();
        if (!selectedType) return true;

        const normalize = (value = '') => value.toLowerCase().trim();
        const selectedKeywords = {
            shared: selectedType.includes('shared'),
            private: selectedType.includes('private'),
            charter: selectedType.includes('charter'),
        };

        const matchResult = availability.flight_types_array.some(type => {
            const normalizedType = normalize(type);
            if (!normalizedType) return false;
            if (normalizedType === selectedType) return true;
            if (normalizedType.includes(selectedType) || selectedType.includes(normalizedType)) return true;

            const typeKeywords = {
                shared: normalizedType.includes('shared'),
                private: normalizedType.includes('private'),
                charter: normalizedType.includes('charter'),
            };

            // Consider it a match if both describe the same general experience (shared/private charter)
            if (selectedKeywords.shared && typeKeywords.shared) return true;
            if (selectedKeywords.private && typeKeywords.private) return true;
            if (selectedKeywords.charter && typeKeywords.charter) return true;

            return false;
        });
        
        return matchResult;
    };

    // Helper function to check if a date is a weekday (Monday-Friday)
    const isWeekday = (date) => {
        const day = date.getDay();
        return day >= 1 && day <= 5; // Monday = 1, Friday = 5
    };

    // Helper function to check if a time is morning (typically before 12:00 PM)
    const isMorning = (time) => {
        if (!time) return false;
        // Parse time string (format: "HH:mm" or "HH:mm:ss")
        const timeParts = time.split(':');
        const hour = parseInt(timeParts[0], 10);
        return hour < 12; // Morning is before 12:00 PM
    };

    // Filter availabilities based on voucher type for both Redeem Voucher and Book Flight
    const filterByVoucherType = (availability) => {
        // Apply voucher type filtering for both Redeem Voucher and Book Flight
        // Only filter if voucher type is selected and it's one of the shared voucher types that require date/time filtering
        if (!selectedVoucherType?.title) {
            return true; // No filtering needed
        }

        // Only apply date/time filtering for shared voucher types (Weekday Morning, Flexible Weekday, Any Day Flight)
        // Private voucher types (Private Charter, Proposal Flight) don't need date/time filtering
        const voucherType = selectedVoucherType.title;
        const sharedVoucherTypes = ['Weekday Morning', 'Weekday Morning Flight', 'Flexible Weekday', 'Flexible Weekday Flight', 'Any Day Flight', 'Anytime', 'Any Day'];
        if (!sharedVoucherTypes.includes(voucherType)) {
            return true; // No filtering needed for private voucher types
        }
        
        // Parse availability date safely
        let availabilityDate = null;
        if (availability.date) {
            try {
                // Handle different date formats
                if (typeof availability.date === 'string') {
                    // If date includes time, extract just the date part
                    const datePart = availability.date.split(' ')[0];
                    availabilityDate = new Date(datePart + 'T00:00:00'); // Add time to avoid timezone issues
                } else {
                    availabilityDate = new Date(availability.date);
                }
                
                // Check if date is valid
                if (isNaN(availabilityDate.getTime())) {
                    return true; // Invalid date, don't filter
                }
            } catch (e) {
                console.warn('Error parsing availability date:', availability.date, e);
                return true; // Error parsing, don't filter
            }
        }
        
        if (!availabilityDate) return true; // If no date, don't filter

        // Weekday Morning voucher → Show weekday mornings only
        if (voucherType === 'Weekday Morning' || voucherType === 'Weekday Morning Flight') {
            return isWeekday(availabilityDate) && isMorning(availability.time);
        }
        
        // Flexible Weekday voucher → Show all weekdays (any time)
        if (voucherType === 'Flexible Weekday' || voucherType === 'Flexible Weekday Flight') {
            return isWeekday(availabilityDate);
        }
        
        // Anytime voucher (Any Day Flight) → Show all available schedules
        if (voucherType === 'Any Day Flight' || voucherType === 'Anytime' || voucherType === 'Any Day') {
            return true; // Show all dates
        }

        // Default: show all if voucher type doesn't match known types
        return true;
    };

    // For Shopify flow and Bing browser, allow filtering even if chooseFlightType is temporarily empty
    // This ensures availabilities are shown in Chrome and Bing browsers where state updates might happen in different order
    const shouldFilterAvailabilities = isLocationAndExperienceSelected || shopifyFlowWithData || bingBrowserWithData;
    
    const filteredAvailabilities = shouldFilterAvailabilities ? availabilities.filter(a => {
        const slotStatus = getSlotStatus(a);
        const availableForSelection = getAvailableSeatsForSelection(a);
        const isOpen = slotStatus === 'open' || availableForSelection > 0;
        const hasCapacity = availableForSelection > 0 || (a.capacity && a.capacity > 0);
        const matchesExp = matchesExperience(a);
        const matchesLoc = matchesLocation(a);
        const isAvailable = isOpen && hasCapacity && matchesLoc && matchesExp;
        
        // If voucher type is selected, restrict to matching voucher types (backend includes 'voucher_types' on each availability)
        const availabilityVoucherTypes = getVoucherTypesForAvailability(a);
        const normalizedAvailabilityTypes = availabilityVoucherTypes.map(normalizeVoucherName);
        const normalizedSelectedVoucher = normalizeVoucherName(selectedVoucherType?.title || '');
        const isWildcardVoucher = normalizedAvailabilityTypes.length === 0 ||
            normalizedAvailabilityTypes.some(type => voucherWildcardTerms.includes(type));
        
        // Check for exact match first
        let matchesVoucher = false;
        if (!normalizedSelectedVoucher || isWildcardVoucher) {
            matchesVoucher = true;
        } else {
            // First try exact match on normalized strings (this should work for "Proposal Flight" -> "proposal flight")
            // Handle both "proposal flight" and "proposal flight " (with trailing space after normalization)
            matchesVoucher = normalizedAvailabilityTypes.some(type => {
                const normalizedType = type.trim();
                return normalizedType === normalizedSelectedVoucher || normalizedType === normalizedSelectedVoucher.trim();
            });
            
            // Also try exact match on raw strings (case-insensitive, trimmed) as a fallback
            // This handles cases like "Proposal Flight ,Private Charter" or "Private Charter,Proposal Flight"
            if (!matchesVoucher && selectedVoucherType?.title) {
                const selectedTitleLower = selectedVoucherType.title.toLowerCase().trim();
                matchesVoucher = availabilityVoucherTypes.some(type => {
                    const typeStr = typeof type === 'string' ? type : String(type);
                    const typeLower = typeStr.toLowerCase().trim();
                    // Check for exact match (handles both "proposal flight" and "proposal flight " with trailing space)
                    return typeLower === selectedTitleLower || 
                           typeLower === selectedTitleLower + ' ' ||
                           selectedTitleLower === typeLower + ' ';
                });
            }
            
            // If still no exact match, check for private flight voucher types (Proposal Flight and Private Charter)
            // These can sometimes be stored differently but refer to the same availability
            if (!matchesVoucher) {
                // Check if selected voucher is "Proposal Flight" (normalized: "proposal flight")
                // Handle both "Proposal Flight" and "Proposal Flight " (with trailing space)
                const selectedTitle = selectedVoucherType?.title || '';
                const selectedTitleLower = selectedTitle.toLowerCase().trim();
                const isProposalFlight = (normalizedSelectedVoucher.includes('proposal') && !normalizedSelectedVoucher.includes('private charter')) ||
                    (selectedTitleLower === 'proposal flight' || selectedTitleLower.includes('proposal flight'));
                
                // Check if selected voucher is "Private Charter" (normalized: "private charter")
                const isPrivateCharter = normalizedSelectedVoucher.includes('private charter') || 
                    (normalizedSelectedVoucher.includes('private') && !normalizedSelectedVoucher.includes('proposal') && !normalizedSelectedVoucher.includes('charter')) ||
                    (selectedTitleLower === 'private charter' || selectedTitleLower.includes('private charter'));
                
                if (isProposalFlight) {
                    // If selected is "Proposal Flight", check if availability has "Proposal Flight" in its voucher types
                    // This handles cases where availability has "Proposal Flight" or "Private Charter,Proposal Flight" or "Proposal Flight ,Private Charter"
                    // Check normalized strings first
                    matchesVoucher = normalizedAvailabilityTypes.some(type => {
                        // Check for exact "proposal flight" match or "proposal" without "private charter"
                        // Note: type is already normalized (lowercase) from normalizeVoucherName
                        // Handle both "proposal flight" and "proposal flight " (with trailing space after normalization)
                        const normalizedType = type.trim();
                        return normalizedType === 'proposal flight' || 
                               (normalizedType.includes('proposal') && !normalizedType.includes('private charter'));
                    });
                    
                    // Also check raw strings for "Proposal Flight" (case-insensitive, trimmed)
                    // This handles cases like "Proposal Flight ,Private Charter" or "Private Charter,Proposal Flight"
                    if (!matchesVoucher) {
                        matchesVoucher = availabilityVoucherTypes.some(type => {
                            const typeStr = typeof type === 'string' ? type : String(type);
                            const typeLower = typeStr.toLowerCase().trim();
                            // Check for exact match or partial match
                            // Handle both "proposal flight" and "proposal flight " (with trailing space)
                            return typeLower === 'proposal flight' || 
                                   typeLower === 'proposal flight ' ||
                                   (typeLower.includes('proposal flight') && !typeLower.includes('private charter')) ||
                                   (typeLower.includes('proposal') && !typeLower.includes('private charter'));
                        });
                    }
                } else if (isPrivateCharter) {
                    // If selected is "Private Charter", check if availability has "Private Charter" in its voucher types
                    // This handles cases where availability has "Private Charter" or "Private Charter,Proposal Flight" or "Proposal Flight ,Private Charter"
                    matchesVoucher = normalizedAvailabilityTypes.some(type => {
                        // Check for exact "private charter" match or "private charter" with or without "proposal"
                        // Note: type is already normalized (lowercase) from normalizeVoucherName
                        const normalizedType = type.trim();
                        return normalizedType === 'private charter' || 
                               normalizedType.includes('private charter');
                    });
                    
                    // Also check raw strings for "Private Charter" (case-insensitive, trimmed)
                    // This handles cases like "Private Charter,Proposal Flight" or "Proposal Flight ,Private Charter"
                    if (!matchesVoucher) {
                        matchesVoucher = availabilityVoucherTypes.some(type => {
                            const typeStr = typeof type === 'string' ? type : String(type);
                            const typeLower = typeStr.toLowerCase().trim();
                            return typeLower === 'private charter' || 
                                   typeLower === 'private charter ' ||
                                   typeLower.includes('private charter');
                        });
                    }
                }
            }
        }
        
        // Additional debug logging for Proposal Flight and Private Charter
        if (normalizedSelectedVoucher && (normalizedSelectedVoucher.includes('proposal') || normalizedSelectedVoucher.includes('private'))) {
            console.log(`[Voucher Match Debug] Availability ${a.id}: normalizedSelectedVoucher="${normalizedSelectedVoucher}", normalizedAvailabilityTypes=${JSON.stringify(normalizedAvailabilityTypes)}, matchesVoucher=${matchesVoucher}, exactMatch=${normalizedAvailabilityTypes.includes(normalizedSelectedVoucher)}, rawVoucherTypes=${JSON.stringify(availabilityVoucherTypes)}`);
        }
        
        // Apply voucher type filtering for Redeem Voucher
        const matchesVoucherTypeFilter = filterByVoucherType(a);
        
        console.log(`Availability ${a.id}: date=${a.date}, time=${a.time}, status=${a.status}, available=${a.available}, capacity=${a.capacity}, isAvailable=${isAvailable}, matchesVoucher=${matchesVoucher}, matchesVoucherTypeFilter=${matchesVoucherTypeFilter}, voucher_types=${JSON.stringify(availabilityVoucherTypes)}, normalizedAvailabilityTypes=${JSON.stringify(normalizedAvailabilityTypes)}, normalizedSelectedVoucher=${normalizedSelectedVoucher}`);
        return isAvailable && matchesVoucher && matchesVoucherTypeFilter;
    }) : [];
    console.log('Filtered availabilities (all times):', filteredAvailabilities);
    
    // Alternative filtering: if the above is too restrictive, try this
    // For Shopify flow, allow filtering even if chooseFlightType is temporarily empty
    const alternativeFiltered = shouldFilterAvailabilities ? availabilities.filter(a => {
        const hasDate = a.date && a.date.length > 0;
        const hasCapacity = getAvailableSeatsForSelection(a) > 0 || (a.capacity && a.capacity > 0);
        const isAvailable = hasDate && hasCapacity && matchesLocation(a) && matchesExperience(a);
        
        // Apply voucher type filtering for Redeem Voucher
        const matchesVoucherTypeFilter = filterByVoucherType(a);
        
        console.log(`Alternative filter ${a.id}: date=${a.date}, time=${a.time}, status=${a.status}, available=${a.available}, capacity=${a.capacity}, isAvailable=${isAvailable}, matchesVoucherTypeFilter=${matchesVoucherTypeFilter}`);
        return isAvailable && matchesVoucherTypeFilter;
    }) : [];
    console.log('Alternative filtered availabilities:', alternativeFiltered);
    
    // Use the more permissive filtering if the strict one returns nothing
    const mergeAvailabilityLists = () => {
        if (filteredAvailabilities.length === 0) {
            return alternativeFiltered;
        }
        const slotKey = (slot) => slot?.id ?? `${slot?.date || 'n/a'}|${slot?.time || '00:00'}|${slot?.location || ''}|${slot?.activity_id || ''}`;
        const strictKeys = new Set(filteredAvailabilities.map(slotKey));
        const merged = [...filteredAvailabilities];
        alternativeFiltered.forEach(slot => {
            const key = slotKey(slot);
            if (!strictKeys.has(key)) {
                merged.push(slot);
            }
        });
        return merged;
    };

    let finalFilteredAvailabilities = mergeAvailabilityLists();
    
    // For Chrome browser, if finalFilteredAvailabilities is empty but we have availabilities data
    // and location/experience are selected, manually filter availabilities
    // This handles cases where state updates happen in different order in Chrome
    const isChromeBrowser = (() => {
        try {
            return navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
        } catch {
            return false;
        }
    })();
    
    if (isChromeBrowser && finalFilteredAvailabilities.length === 0 && availabilities && availabilities.length > 0) {
        const hasLocationAndActivity = chooseLocation && selectedActivity && selectedActivity.length > 0;
        const hasFlightTypeOrShopify = chooseFlightType?.type || (isShopifyFlow && hasLocationAndActivity);
        const chromeShouldFilter = hasLocationAndActivity && (
            (activitySelect === 'Book Flight' && hasFlightTypeOrShopify) ||
            (activitySelect === 'Redeem Voucher') ||
            (chooseLocation === 'Bristol Fiesta') ||
            (activitySelect !== 'Book Flight' && activitySelect !== 'Redeem Voucher')
        );
        
        if (chromeShouldFilter) {
            console.log('⚠️ Chrome - finalFilteredAvailabilities is empty, manually filtering availabilities');
            finalFilteredAvailabilities = availabilities.filter(a => {
                const hasDate = a.date && a.date.length > 0;
                const hasCapacity = getAvailableSeatsForSelection(a) > 0 || (a.capacity && a.capacity > 0);
                const isAvailable = hasDate && hasCapacity && matchesLocation(a) && matchesExperience(a);
                const matchesVoucherTypeFilter = filterByVoucherType(a);
                return isAvailable && matchesVoucherTypeFilter;
            });
            console.log('Chrome - Manually filtered availabilities:', finalFilteredAvailabilities.length);
        }
    }
    
    console.log('Final filtered availabilities:', finalFilteredAvailabilities);
    
    const availableDates = Array.from(new Set(finalFilteredAvailabilities.map(a => a.date)));
    console.log('Available dates from server:', availableDates);
    
    const getTimesForDate = (date) => {
        // Use local date string to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        console.log(`Looking for date: ${dateStr}`);
        let matchingAvailabilities = finalFilteredAvailabilities.filter(a => {
            console.log(`Comparing ${a.date} with ${dateStr}, status: ${a.status}, available: ${a.available}`);
            return a.date === dateStr;
        });
        
        // For Chrome browser, if matchingAvailabilities is empty but availabilities has data,
        // manually filter availabilities for this date
        if (isChromeBrowser && matchingAvailabilities.length === 0 && availabilities && availabilities.length > 0 && shouldFilterAvailabilities) {
            console.log('⚠️ Chrome - getTimesForDate: matchingAvailabilities is empty, manually filtering');
            matchingAvailabilities = availabilities.filter(a => {
                const matchesLoc = matchesLocation(a);
                const matchesExp = matchesExperience(a);
                const matchesVoucherTypeFilter = filterByVoucherType(a);
                return a.date === dateStr && matchesLoc && matchesExp && matchesVoucherTypeFilter;
            });
            console.log(`Chrome - Manually filtered times for ${dateStr}:`, matchingAvailabilities.length);
        }
        
        // Apply additional voucher type filtering for Weekday Morning (must be morning times)
        // Apply for both Redeem Voucher and Book Flight
        if ((activitySelect === 'Redeem Voucher' || activitySelect === 'Book Flight') && selectedVoucherType?.title) {
            const voucherType = selectedVoucherType.title;
            if (voucherType === 'Weekday Morning' || voucherType === 'Weekday Morning Flight') {
                // Filter to only show morning times (before 12:00 PM)
                matchingAvailabilities = matchingAvailabilities.filter(a => isMorning(a.time));
                console.log(`After morning filter: ${matchingAvailabilities.length} availabilities for ${dateStr}`);
            }
        }
        
        console.log(`Found ${matchingAvailabilities.length} availabilities for ${dateStr}`);
        return matchingAvailabilities;
    };

    // Günlük toplam available hesapla
    const getSpacesForDate = (date) => {
        // Use local date string to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        console.log(`getSpacesForDate called for: ${dateStr}`);
        console.log(`Input date object:`, date);
        console.log(`Manual date string:`, dateStr);
        console.log(`Today object:`, today);
        console.log(`Today manual:`, `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
        console.log(`All availabilities:`, availabilities);
        console.log(`Sample availability dates:`, availabilities.slice(0, 3).map(a => ({ id: a.id, date: a.date, originalDate: a.date })));
        console.log(`finalFilteredAvailabilities length:`, finalFilteredAvailabilities.length);
        console.log(`shouldFilterAvailabilities:`, shouldFilterAvailabilities);
        console.log(`isLocationAndExperienceSelected:`, isLocationAndExperienceSelected);
        
        // For Chrome browser, if finalFilteredAvailabilities is empty but availabilities has data,
        // use availabilities directly with location/experience filtering
        // This handles cases where state updates happen in different order in Chrome
        let slotsToUse = finalFilteredAvailabilities;
        if (finalFilteredAvailabilities.length === 0 && availabilities && availabilities.length > 0 && shouldFilterAvailabilities) {
            console.log('⚠️ Chrome - finalFilteredAvailabilities is empty, using availabilities with manual filtering');
            // Manually filter availabilities for this date
            slotsToUse = availabilities.filter(a => {
                const matchesLoc = matchesLocation(a);
                const matchesExp = matchesExperience(a);
                return a.date === dateStr && matchesLoc && matchesExp;
            });
            console.log(`Chrome - Manually filtered slots for ${dateStr}:`, slotsToUse.length);
        }
        
        // Check ALL availabilities for this date (including capacity = 0) - use filtered list
        const allSlotsForDate = slotsToUse.filter(a => a.date === dateStr);
        console.log(`All slots for ${dateStr}:`, allSlotsForDate);
        console.log(`Slot statuses for ${dateStr}:`, allSlotsForDate.map(slot => ({ 
            id: slot.id, 
            status: slot.status, 
            available: slot.available, 
            capacity: slot.capacity,
            date: slot.date,
            time: slot.time
        })));
        console.log(`Raw availabilities for ${dateStr}:`, slotsToUse.filter(a => a.date === dateStr));
        
        // Get open/available slots (capacity > 0) for totals
        const availableSlots = slotsToUse.filter(a => a.date === dateStr);
        const total = availableSlots.reduce((sum, s) => sum + getAvailableSeatsForSelection(s), 0);
        const sharedTotal = availableSlots.reduce((sum, s) => sum + getRemainingSeats(s), 0);
        
        const hasOpenSlots = allSlotsForDate.some(slot => getSlotStatus(slot) === 'open' || getRemainingSeats(slot) > 0);
        const hasClosedSlots = allSlotsForDate.some(slot => getSlotStatus(slot) === 'closed');
        const allSlotsClosed = allSlotsForDate.length > 0 && allSlotsForDate.every(slot => getSlotStatus(slot) === 'closed' && getRemainingSeats(slot) <= 0);
        const selectionHasAvailability = availableSlots.some(slot => getAvailableSeatsForSelection(slot) > 0);
        const sharedSoldOut = (allSlotsForDate.length > 0 && sharedTotal === 0 && !hasOpenSlots) || allSlotsClosed;
        const selectionSoldOut = availableSlots.length === 0 || !selectionHasAvailability;
        const privateAvailable = isPrivateSelection ? selectionHasAvailability : !sharedSoldOut;
        
        console.log(`Date ${dateStr}: allSlots=${allSlotsForDate.length}, availableSlots=${availableSlots.length}, total=${total}, sharedTotal=${sharedTotal}, selectionHasAvailability=${selectionHasAvailability}, soldOutSelection=${selectionSoldOut}, soldOutShared=${sharedSoldOut}`);
        // IMPORTANT: return ALL slots for the popup (including 0 available) so users can see Sold Out times
        return {
            total,
            sharedTotal,
            sharedSoldOut,
            privateAvailable,
            soldOut: selectionSoldOut,
            slots: allSlotsForDate
        };
    };

        const renderDays = () => {
        const days = [];
        
        // Use startOfWeek to get the correct offset for the first row (Monday as first day)
        // Create dates using local components to avoid timezone issues
        const startDateYear = startDate.getFullYear();
        const startDateMonth = startDate.getMonth();
        const startDateDay = startDate.getDate();
        const startDateLocal = new Date(startDateYear, startDateMonth, startDateDay, 0, 0, 0, 0);
        
        const weekStart = startOfWeek(startDateLocal, { weekStartsOn: 1 });
        // Ensure weekStart is also in local timezone
        const weekStartYear = weekStart.getFullYear();
        const weekStartMonth = weekStart.getMonth();
        const weekStartDay = weekStart.getDate();
        let dayPointer = new Date(weekStartYear, weekStartMonth, weekStartDay, 0, 0, 0, 0);
        
        // Calculate the end of the week that contains the end of the month
        const endDateYear = endDate.getFullYear();
        const endDateMonth = endDate.getMonth();
        const endDateDay = endDate.getDate();
        const endDateLocal = new Date(endDateYear, endDateMonth, endDateDay, 0, 0, 0, 0);
        const weekEnd = endOfWeek(endDateLocal, { weekStartsOn: 1 });
        
        // Fill days from week start to week end to ensure correct grid alignment
        while (dayPointer <= weekEnd) {
            // Create date copy using local components to avoid timezone shifts
            const dayPointerYear = dayPointer.getFullYear();
            const dayPointerMonth = dayPointer.getMonth();
            const dayPointerDay = dayPointer.getDate();
            const dateCopy = new Date(dayPointerYear, dayPointerMonth, dayPointerDay, 0, 0, 0, 0);
            
            const isBeforeMonth = dateCopy < startDateLocal;
            const isAfterMonth = dateCopy > endDateLocal;
            
            if (isBeforeMonth || isAfterMonth) {
                // Before or after the month - render empty placeholder to maintain grid alignment
                // Keep element in DOM with minimal size to maintain grid structure
                days.push(
                    <div
                        key={`empty-${dateCopy.getTime()}`}
                        className="day empty-day"
                        style={{
                            visibility: 'hidden',
                            opacity: 0,
                            pointerEvents: 'none',
                            minHeight: daySize,
                            minWidth: daySize,
                            height: daySize,
                            width: daySize,
                            padding: 0,
                            margin: isMobile ? '1px' : 2,
                            border: 'none',
                            background: 'transparent'
                        }}
                        aria-hidden="true"
                    />
                );
                // Increment dayPointer using addDays (timezone-safe)
                dayPointer = addDays(dayPointer, 1);
                continue;
            } else {
                // Within the month
                // dateCopy is already created using local components above
                const dateCopyStartOfDay = dateCopy;
                
                const todayYear = today.getFullYear();
                const todayMonth = today.getMonth();
                const todayDay = today.getDate();
                const todayStartOfDay = new Date(todayYear, todayMonth, todayDay, 0, 0, 0, 0);
                
                const isPastDate = dateCopyStartOfDay < todayStartOfDay;
                const isSelected = selectedDate && selectedDate.toDateString() === dateCopy.toDateString();
                
                // Apply voucher type filtering for both Redeem Voucher and Book Flight - check if this date should be shown
                let shouldShowDate = true;
                if ((activitySelect === 'Redeem Voucher' || activitySelect === 'Book Flight') && selectedVoucherType?.title) {
                    const voucherType = selectedVoucherType.title;
                    // Weekday Morning voucher → Show weekday mornings only
                    if (voucherType === 'Weekday Morning' || voucherType === 'Weekday Morning Flight') {
                        // Must be weekday AND have morning slots available
                        const isWeekdayDate = isWeekday(dateCopy);
                        if (isWeekdayDate) {
                            // Check if there are any morning slots for this date
                            const year = dateCopy.getFullYear();
                            const month = String(dateCopy.getMonth() + 1).padStart(2, '0');
                            const day = String(dateCopy.getDate()).padStart(2, '0');
                            const dateStr = `${year}-${month}-${day}`;
                            const slotsForDate = finalFilteredAvailabilities.filter(a => a.date === dateStr);
                            const hasMorningSlots = slotsForDate.some(slot => isMorning(slot.time));
                            shouldShowDate = hasMorningSlots;
                        } else {
                            shouldShowDate = false;
                        }
                    }
                    // Flexible Weekday voucher → Show all weekdays (any time)
                    else if (voucherType === 'Flexible Weekday' || voucherType === 'Flexible Weekday Flight') {
                        shouldShowDate = isWeekday(dateCopy);
                    }
                    // Anytime voucher (Any Day Flight) → Show all available schedules
                    // No filtering needed, shouldShowDate remains true
                }
                
                const { total, sharedSoldOut, privateAvailable, soldOut: soldOutFromCalc, slots } = getSpacesForDate(dateCopy);
                // soldOutFromCalc already represents "sold out for this specific selection"
                const soldOut = soldOutFromCalc;
                const isAvailable = shouldShowDate && !soldOut && (isPrivateSelection ? privateAvailable : total > 0);
                const pulse = false; // disable pulsing highlight
                
                // If shouldShowDate is false (due to voucher type filtering), show date as disabled/grey
                // This applies to weekend dates for "Weekday Morning" or "Flexible Weekday" vouchers
                if (!shouldShowDate && (activitySelect === 'Redeem Voucher' || activitySelect === 'Book Flight') && selectedVoucherType?.title) {
                    // Override isAvailable and isInteractive to make date disabled
                    const isAvailable = false;
                    const isInteractive = false;
                    const soldOut = false; // Not sold out, just not available for this voucher type
                    
                    days.push(
                        <div
                            key={`${dateCopy.getFullYear()}-${String(dateCopy.getMonth() + 1).padStart(2, '0')}-${String(dateCopy.getDate()).padStart(2, '0')}`}
                            className={`day disabled`}
                            style={{
                                cursor: 'not-allowed',
                                background: '#bbb',
                                color: '#fff',
                                borderRadius: isMobile ? 4 : 8,
                                margin: isMobile ? '1px' : 2,
                                padding: isMobile ? '0' : 2,
                                minHeight: daySize,
                                minWidth: daySize,
                                maxWidth: daySize,
                                width: daySize,
                                height: daySize,
                                boxSizing: 'border-box',
                                position: 'relative',
                                border: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            aria-disabled="true"
                        >
                            <div style={{ 
                                fontSize: isMobile ? 12 : 18, 
                                fontWeight: 600,
                                lineHeight: 1,
                                color: '#fff'
                            }}>
                                {format(dateCopy, 'd')}
                            </div>
                        </div>
                    );
                    // Increment dayPointer using addDays (timezone-safe)
                    dayPointer = addDays(dayPointer, 1);
                    continue;
                }
                
                // Determine if date should be interactive
                // For Shopify flow and Bing browser, allow interaction even if chooseFlightType is temporarily empty (if we have availabilities data)
                const isInteractive = !isPastDate && isAvailable && (isLocationAndExperienceSelected || shopifyFlowWithData || bingBrowserWithData) && !soldOut;
                
                days.push(
                    <div
                        key={`${dateCopy.getFullYear()}-${String(dateCopy.getMonth() + 1).padStart(2, '0')}-${String(dateCopy.getDate()).padStart(2, '0')}`}
                        className={`day ${isPastDate || (!isAvailable && !soldOut) ? 'disabled' : ''} ${!isPastDate && isAvailable && !soldOut ? 'available-day' : ''} ${isSelected ? 'selected' : ''} ${soldOut ? 'sold-out' : ''} ${pulse && !isPastDate ? 'pulse' : ''}`}
                        onClick={() => isInteractive && handleDateClick(dateCopy)}
                        style={{
                            // Past days should always appear dimmed
                            opacity: isPastDate ? 0.5 : (soldOut ? 1 : (isAvailable ? (isLocationAndExperienceSelected ? 1 : 0.3) : 0.5)),
                            cursor: isInteractive ? 'pointer' : 'not-allowed',
                            background: isSelected ? '#56C1FF' : isPastDate ? '#ddd' : soldOut ? '#888' : isAvailable ? '#00eb5b' : '',
                            color: isPastDate ? '#999' : soldOut ? '#fff' : isAvailable ? '#fff' : '#888',
                            borderRadius: isMobile ? 4 : 8,
                            margin: isMobile ? '1px' : 2,
                            padding: isMobile ? '0' : 2,
                            minHeight: daySize,
                            minWidth: daySize,
                            maxWidth: daySize,
                            width: daySize,
                            height: daySize,
                            boxSizing: 'border-box',
                            position: 'relative',
                            border: isSelected ? '2px solid #56C1FF' : 'none',
                            boxShadow: isSelected ? '0 0 0 2px #56C1FF' : 'none',
                            // Disable pulsing shadow
                            animation: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div style={{ 
                            fontSize: isMobile ? 12 : 18, 
                            fontWeight: 600,
                            lineHeight: 1
                        }}>
                            {format(dateCopy, 'd')}
                        </div>
                        {isAvailable && !isPastDate && !isMobile && (
                            <div style={{ 
                                fontSize: 11, 
                                marginTop: 4, 
                                fontWeight: 500,
                                lineHeight: 1,
                                textAlign: 'center'
                            }}>
                                {(chooseFlightType?.type || '').toLowerCase().includes('private') ? 'Available' : `${total} Space${total > 1 ? 's' : ''}`}
                            </div>
                        )}
                        {soldOut && !isPastDate && (
                            <div style={{ 
                                fontSize: isMobile ? 7.5 : 11, 
                                marginTop: isMobile ? 2 : 4, 
                                color: '#fff', 
                                fontWeight: 600,
                                lineHeight: 1,
                                textAlign: 'center'
                            }}>
                                Not Available
                            </div>
                        )}
                        {/* Remove "Not Available" text to clean up layout */}
                        {/* {!isAvailable && !isPastDate && !soldOut && (
                            <div style={{ fontSize: 12, marginTop: 2, color: '#666' }}>
                                Not Available
                            </div>
                        )} */}
                        {/* Remove instruction text from calendar boxes to fix layout */}
                        {/* {!isLocationAndExperienceSelected && isAvailable && !isPastDate && (
                            <div style={{ fontSize: 10, marginTop: 2, color: '#666', textAlign: 'center' }}>
                                {activitySelect === 'Redeem Voucher' ? 'Select Location & Experience' : 'Select Location, Experience & Voucher Type'}
                            </div>
                        )} */}
                    </div>
                );
            }
            // Increment dayPointer using addDays (timezone-safe)
            dayPointer = addDays(dayPointer, 1);
        }
        
        return days;
    };

    const handleRequestSubmit = async () => {
        setRequestSuccess("");
        setRequestError("");
        try {
            const res = await axios.post(
                process.env.REACT_APP_API_URL + "/api/date-request",
                {
                    name: requestName,
                    phone: requestPhone,
                    email: requestEmail,
                    location: requestLocation,
                    flight_type: requestFlightType,
                    requested_date: requestDate
                }
            );
            if (res.data.success) {
                setRequestSuccess("We will be in touch shortly");
                setTimeout(() => {
                    setRequestModalOpen(false);
                    setRequestName(""); setRequestPhone(""); setRequestEmail(""); setRequestLocation(""); setRequestFlightType(""); setRequestDate("");
                    setRequestSuccess("");
                }, 5000);
            } else {
                setRequestError("Failed to submit request. Please try again.");
            }
        } catch (err) {
            setRequestError("Failed to submit request. Please try again.");
        }
    };



    return (
        <>
            {/* Notification for time selection */}
            {showNotification && (
                <div style={{
                    position: 'fixed',
                    [isMobile ? 'top' : 'bottom']: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#03A9F4',
                    color: 'white',
                    padding: isMobile ? '8px 16px' : '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    zIndex: 9999,
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: isMobile ? 'slideDown 0.3s ease-out' : 'slideUp 0.3s ease-out',
                    maxWidth: '90vw',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: isMobile ? '16px' : '18px' }}>✓</span>
                    {notificationMessage}
                </div>
            )}
            
            <style>
                {`
                    @media (max-width: 768px) {
                        .calendar .days-grid {
                            column-gap: 0px !important;
                            row-gap: 2px !important;
                            padding: 0 2px !important;
                        }
                        
                        .calendar .day {
                            margin: 1px !important;
                            padding: 0 !important;
                        }
                        
                        .calendar .weekday-label {
                            font-size: 11px !important;
                            margin-bottom: 2px !important;
                            padding: 0 !important;
                        }
                        
                        .calendar .header {
                            flex-direction: column !important;
                            gap: 12px !important;
                        }
                        
                        .calendar .realtime-badge {
                            font-size: 12px !important;
                            padding: 6px 10px !important;
                        }
                        
                        .calendar .realtime-badge svg {
                            font-size: 16px !important;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        .calendar .days-grid {
                            column-gap: 0px !important;
                            row-gap: 7px !important;
                            padding: 0 1px !important;
                        }
                        
                        .calendar .day {
                            margin: 0px !important;
                            padding: 0px !important;
                        }
                        
                        .calendar .weekday-label {
                            font-size: 10px !important;
                            margin-bottom: 2px !important;
                            padding: 0px !important;
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
                `}
            </style>
            <Accordion title="Live Availability" id="live-availability" activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} className={`${isFlightVoucher || isGiftVoucher ? 'disable-acc' : ""}`} isDisabled={isDisabled}>
                <div className="calendar">
                    <div className="header" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        position: 'relative', 
                        width: '100%',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '12px' : '0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8 }}>
                            <div className='calender-prev calender-arrow' onClick={handlePrevMonth}><ArrowBackIosIcon /></div>
                            <h2 style={{ 
                                margin: '0 4px', 
                                fontWeight: 500, 
                                color: '#222', 
                                fontSize: isMobile ? 18 : 24, 
                                letterSpacing: 1 
                            }}>
                                {format(currentDate, 'MMMM yyyy')}
                            </h2>
                            <div className='calender-next calender-arrow' onClick={handleNextMonth}><ArrowForwardIosIcon /></div>
                        </div>
                        
                        {/* Real-time availability badge - responsive */}
                        <div className="realtime-badge-wrap">
                            <div className="realtime-badge" style={{
                                fontSize: isMobile ? 14 : 14,
                                padding: isMobile ? '6px 10px' : '8px 12px',
                                background: '#00eb5b'
                            }}>
                                <CheckIcon style={{ fontSize: isMobile ? 16 : 20, marginRight: 4 }} />
                                <span className="realtime-badge-text">Real-time availability</span>
                            </div>
                        </div>
                    </div>
                    {/* Centered currently viewing info under the heading */}
                    <div style={{ 
                        margin: isMobile ? '12px 0 0 0' : '18px 0 0 0', 
                        fontSize: isMobile ? 14 : 16, 
                        color: '#222', 
                        borderRadius: 8, 
                        padding: isMobile ? '8px' : '12px', 
                        textAlign: 'center', 
                        fontWeight: 500, 
                        maxWidth: 600, 
                        marginLeft: 'auto', 
                        marginRight: 'auto' 
                    }}>
                        {isLocationAndExperienceSelected ? (
                            <>
                                <div style={{ fontSize: isMobile ? 14 : 16 }}>
                                    Currently viewing: <b>{chooseLocation}</b>, <b>{chooseFlightType.type}</b>
                                </div>
                                {selectedDate && selectedTime && (
                                    <div style={{ 
                                        marginTop: isMobile ? 6 : 8, 
                                        padding: isMobile ? '6px 12px' : '8px 16px', 
                                        background: '#e8f5e8', 
                                        borderRadius: 6, 
                                        border: '1px solid #28a745',
                                        fontSize: isMobile ? 12 : 14
                                    }}>
                                        ✅ <b>Selected:</b> {format(selectedDate, 'EEEE, MMMM d, yyyy')} at <b>{selectedTime}</b>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ 
                                color: '#666',
                                fontSize: isMobile ? 14 : 16,
                                lineHeight: isMobile ? 1.3 : 1.4
                            }}>
                                {activitySelect === 'Redeem Voucher' ? 
                                    'Please select a Flight Location and Experience to view available dates and times' :
                                    'Please select a Flight Location, Experience, and Voucher Type to view available dates and times'
                                }
                            </div>
                        )}
                    </div>
                    {/* Takvim alanı: */}
                    <div className="days-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(7, 1fr)', 
                        gap: isMobile ? '0px' : '4px', 
                        marginBottom: 0, 
                        width: '100%', 
                        maxWidth: '100%', 
                        margin: '0 auto', 
                        padding: isMobile ? '0 2px' : '0 6px', 
                        boxSizing: 'border-box' 
                    }}>
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                            <div key={d} className="weekday-label" style={{ 
                                textAlign: 'center', 
                                fontWeight: 600, 
                                color: '#888', 
                                fontSize: isMobile ? 10 : 15, 
                                marginBottom: isMobile ? 1 : 8,
                                padding: isMobile ? '0' : '4px',
                                // Mobilde tarih kutularıyla aynı boyutta olması için
                                ...(isMobile ? {
                                    width: daySize,
                                    height: 'auto',
                                    minWidth: daySize,
                                    maxWidth: daySize,
                                    boxSizing: 'border-box',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                } : {})
                            }}>
                                {d}
                            </div>
                        ))}
                        {renderDays()}
                    </div>
                    {/* Reschedule text below calendar */}
                    <div style={{ 
                        textAlign: 'center', 
                        marginTop: isMobile ? 16 : 20, 
                        marginBottom: 2 
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8, 
                            justifyContent: 'center', 
                            color: '#666', 
                            textAlign: 'center' 
                    }}>
                        <span style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                                justifyContent: 'center',
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                backgroundColor: '#10b981',
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 800,
                                lineHeight: 1
                            }}>✓</span>
                            <span style={{ fontSize: 12, lineHeight: '1.3', fontStyle: 'italic' }}>
                                Reschedule for free up to 120 hours before.
                        </span>
                        </div>
                    </div>

                    {/* Request Date button hidden */}
                </div>
            </Accordion>
            {
                activeAccordion ?
                    <Modal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        title={activitySelect === 'Redeem Voucher' ? "Select Location & Experience" : "Bristol Balloon Fiesta - Terms & Conditions"}
                        bulletPoints={activitySelect === 'Redeem Voucher' ? ["Please select a flight location and experience first to view available dates and times."] : bristolFiestaTerms}
                    />
                    :
                    ""
            }
            <Modal
                isOpen={requestModalOpen}
                onClose={() => setRequestModalOpen(false)}
                title="Request Date"
                showCloseButton={true}
                extraContent={
                    <form style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 16, minWidth: 340, width: '100%', maxWidth: 480, alignItems: 'center', marginLeft: 'auto', marginRight: 'auto' }} onSubmit={e => {
                        e.preventDefault();
                        let hasError = false;
                        setNameError(false); setEmailError(false); setLocationError(false); setFlightTypeError(false); setDateError(false);
                        setNameFormatError(false); setPhoneFormatError(false); setEmailFormatError(false);
                        if (!requestName.trim()) { setNameError(true); hasError = true; }
                        if (!/^[a-zA-ZğüşöçıİĞÜŞÖÇ\s]+$/.test(requestName.trim())) { setNameFormatError(true); hasError = true; }
                        if (!requestEmail.trim()) { setEmailError(true); hasError = true; }
                        if (requestEmail && !/^\S+@\S+\.\S+$/.test(requestEmail)) { setEmailFormatError(true); hasError = true; }
                        if (!requestLocation) { setLocationError(true); hasError = true; }
                        if (!requestFlightType) { setFlightTypeError(true); hasError = true; }
                        if (!requestDate) { setDateError(true); hasError = true; }
                        if (requestPhone && /[^0-9]/.test(requestPhone)) { setPhoneFormatError(true); hasError = true; }
                        if (hasError) { return; }
                        handleRequestSubmit();
                    }}>
                        <div style={{ marginBottom: 8, position: 'relative', width: '100%', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                            <input type="text" placeholder="Name" value={requestName} onChange={e => {
                                const val = e.target.value.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]/g, '');
                                setRequestName(val);
                                setNameError(false);
                                setNameFormatError(false);
                            }} style={{ padding: 8, borderRadius: 4, border: nameError || nameFormatError ? '2px solid red' : '1px solid #ccc', width: '100%', margin: '0 auto', display: 'block', boxSizing: 'border-box' }} required />
                            {nameError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>This field is required</div>}
                            {nameFormatError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>Only letters allowed</div>}
                        </div>
                        <div style={{ marginBottom: 8, width: '100%', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                            <input type="text" placeholder="Phone" value={requestPhone} onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setRequestPhone(val);
                                setPhoneFormatError(false);
                            }} style={{ padding: 8, borderRadius: 4, border: phoneFormatError ? '2px solid red' : '1px solid #ccc', width: '100%', margin: '0 auto', display: 'block', boxSizing: 'border-box' }} />
                            {phoneFormatError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>Only numbers allowed</div>}
                        </div>
                        <div style={{ marginBottom: 8, position: 'relative', width: '100%', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                            <input type="email" placeholder="Email" value={requestEmail} onChange={e => {
                                setRequestEmail(e.target.value);
                                setEmailError(false);
                                setEmailFormatError(false);
                            }} style={{ padding: 8, borderRadius: 4, border: emailError || emailFormatError ? '2px solid red' : '1px solid #ccc', width: '100%', margin: '0 auto', display: 'block', boxSizing: 'border-box' }} required />
                            {emailError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>This field is required</div>}
                            {emailFormatError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>Invalid email format</div>}
                        </div>
                        <div style={{ marginBottom: 8, position: 'relative', width: '100%', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                            <select value={requestLocation} onChange={e => { setRequestLocation(e.target.value); setLocationError(false); }} style={{ padding: 8, borderRadius: 4, border: locationError ? '2px solid red' : '1px solid #ccc', width: '100%', margin: '0 auto', display: 'block', boxSizing: 'border-box', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', height: 44, lineHeight: 'normal' }} required>
                                <option value="">Select Location</option>
                                {allLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                            {locationError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>This field is required</div>}
                        </div>
                        <div style={{ marginBottom: 8, position: 'relative', width: '100%', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                            <select value={requestFlightType} onChange={e => { setRequestFlightType(e.target.value); setFlightTypeError(false); }} style={{ padding: 8, borderRadius: 4, border: flightTypeError ? '2px solid red' : '1px solid #ccc', width: '100%', margin: '0 auto', display: 'block', boxSizing: 'border-box', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', height: 44, lineHeight: 'normal' }} required>
                                <option value="">Select Flight Type</option>
                                {(chooseLocation && Array.isArray(availableExperiencesForLocation) ? availableExperiencesForLocation : ['Shared Flight','Private Charter']).map((label) => (
                                    <option key={label} value={label}>{label}</option>
                                ))}
                            </select>
                            {flightTypeError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>This field is required</div>}
                        </div>
                        <div style={{ marginBottom: 8, position: 'relative', width: '100%' }}>
                            <input type="date" value={requestDate} onChange={e => { setRequestDate(e.target.value); setDateError(false); }} style={{ padding: 8, borderRadius: 4, border: dateError ? '2px solid red' : '1px solid #ccc', width: '100%', margin: '0 auto', display: 'block', boxSizing: 'border-box', height: 44, maxWidth: 420 }} required />
                            {dateError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>This field is required</div>}
                        </div>
                        {requestSuccess && <div style={{ color: 'green', textAlign: 'center' }}>{requestSuccess}</div>}
                        {requestError && <div style={{ color: 'red', textAlign: 'center' }}>{requestError}</div>}
                    </form>
                }
                actionButtons={
                    <>
                        <button
                            type="submit"
                            disabled={!isFormValid}
                            onClick={() => {
                                if (isFormValid) handleRequestSubmit();
                            }}
                            style={{
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '6px',
                                background: isFormValid ? '#10b981' : '#ccc',
                                color: '#fff',
                                cursor: isFormValid ? 'pointer' : 'not-allowed',
                                fontSize: '14px',
                                fontWeight: '500',
                                minWidth: '80px'
                            }}
                        >
                            Submit
                        </button>
                        <button
                            type="button"
                            onClick={() => setRequestModalOpen(false)}
                            style={{
                                padding: '10px 20px',
                                border: '1px solid #ccc',
                                borderRadius: '6px',
                                background: '#fff',
                                color: '#333',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                minWidth: '80px'
                            }}
                        >
                            Choose Another Date
                        </button>
                    </>
                }
            />
            
            {/* Time Selection Popup Modal */}
            <Modal
                isOpen={timeSelectionModalOpen}
                onClose={() => setTimeSelectionModalOpen(false)}
                title={`Select Time for ${selectedDateForTime ? format(selectedDateForTime, 'MMMM d, yyyy') : ''}`}
                extraContent={
                    <div style={{ 
                        minWidth: isMobile ? '100%' : 400, 
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                        padding: isMobile ? '0' : '0'
                    }}>
                        {selectedDateForTime && (
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: isMobile ? 4 : 12,
                                width: '100%',
                                boxSizing: 'border-box'
                            }}>
                                <div style={{ 
                                    textAlign: 'center', 
                                    marginBottom: isMobile ? 8 : 16, 
                                    color: '#666',
                                    fontSize: isMobile ? 12 : 16,
                                    lineHeight: 1.3,
                                    padding: isMobile ? '0 4px' : '0'
                                }}>
                                    {/* Removed subtitle requesting preferred time per user request */}
                                </div>
                                {/* Removed top-level 'Call to Book' banner; handled per-slot now */}
                                {(() => {
                                    const { slots } = getSpacesForDate(selectedDateForTime);
                                    if (slots.length === 0) {
                                        return (
                                            <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                                                No available times for this date
                                            </div>
                                        );
                                    }
                                    const selectedPassengers = getSelectedPassengerCount();
                                    return slots.map(slot => {
                                        // 8 hour rule check
                                        let slotDateTime = new Date(selectedDateForTime);
                                        if (slot.time) {
                                            const [h, m, s] = slot.time.split(':');
                                            slotDateTime.setHours(Number(h));
                                            slotDateTime.setMinutes(Number(m || 0));
                                            slotDateTime.setSeconds(Number(s || 0));
                                        }
                                        const now = new Date();
                                        const diffMs = slotDateTime - now;
                                        const diffHours = diffMs / (1000 * 60 * 60);
                                        // Use the same availability logic as calendar totals:
                                        // this accounts for shared/private resource constraints (Balloon 210 / 105) and global locks.
                                        const availableForSelection = getAvailableSeatsForSelection(slot);
                                        const isAvailable = availableForSelection > 0;

                                        // For shared bookings, don't allow selecting a slot that can't fit all passengers.
                                        // For private bookings, getAvailableSeatsForSelection already returns 0 when the slot can't fit.
                                        const isPrivateCharter = (chooseFlightType?.type || '').toLowerCase().includes('private');
                                        const insufficientForPassengers = selectedVoucherType && selectedPassengers > availableForSelection && !isPrivateCharter;
                                        const within8h = diffHours < 8 && diffHours > 0;
                                        const enoughSeats = availableForSelection >= selectedPassengers;
                                        const showCallToBookForSlot = within8h && enoughSeats; // override labels when true
                                        // Selectable only if there are seats and rules met
                                        const isSelectable = isAvailable && diffHours >= 8 && !insufficientForPassengers;
                                        // Format time to 12-hour with AM/PM for display
                                        const formattedTime = (() => {
                                            try {
                                                const [hh, mm] = slot.time.split(':');
                                                const d = new Date();
                                                d.setHours(Number(hh) || 0, Number(mm) || 0, 0, 0);
                                                return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                                            } catch (e) {
                                                return slot.time?.split(':').slice(0, 2).join(':');
                                            }
                                        })();
                                        const isPrivateCharterExperience = (chooseFlightType?.type || '').toLowerCase().includes('private charter');
                                        
                                        // Availability label rules:
                                        // - Private Charter: just "Available" / "Not Available"
                                        // - Other experiences: "<n> Spaces" / "Sold Out" (mevcut davranış)
                                        const availabilityLabel = (() => {
                                            if (isPrivateCharterExperience) {
                                                return availableForSelection > 0 ? 'Available' : 'Not Available';
                                            }
                                            return availableForSelection > 0
                                                ? `${availableForSelection} Space${availableForSelection === 1 ? '' : 's'}`
                                                : 'Sold Out';
                                        })();
                                        const shouldShowAvailabilityLabel = !!availabilityLabel;

                                        return (
                                            <div key={slot.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? 6 : 12 }}>
                                                <button
                                                    style={{
                                                        background: isSelectable ? '#00eb5b' : '#ccc',
                                                        color: '#fff',
                                                        border: tempSelectedTime === slot.time ? (isMobile ? '1px solid #56C1FF' : '2px solid #56C1FF') : (isMobile ? '1px solid transparent' : '2px solid transparent'),
                                                        borderRadius: isMobile ? 6 : 12,
                                                        padding: isMobile ? '8px 12px' : '16px 20px',
                                                        fontWeight: 600,
                                                        fontSize: isMobile ? 14 : 18,
                                                        cursor: isSelectable ? 'pointer' : 'not-allowed',
                                                        opacity: isSelectable ? 1 : 0.6,
                                                        width: isMobile ? 'calc(100% - 4px)' : '70%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: isMobile ? 'center' : 'space-between',
                                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                                        transform: (() => {
                                                            if (tempSelectedTime === slot.time) return isMobile ? 'scale(1)' : 'scale(1.02)';
                                                            if (!isMobile && hoveredTime === slot.time && isSelectable) return 'translateY(-2px) scale(1.03)';
                                                            return 'scale(1)';
                                                        })(),
                                                        boxShadow: (!isMobile && hoveredTime === slot.time && isSelectable) ? '0 8px 18px rgba(0,0,0,0.15), 0 0 0 3px rgba(86,193,255,0.35)' : (tempSelectedTime === slot.time ? '0 0 0 2px #56C1FF' : 'none'),
                                                        position: 'relative',
                                                        boxSizing: 'border-box',
                                                        marginBottom: isMobile ? 6 : 0,
                                                        marginLeft: isMobile ? '2px' : '0',
                                                        marginRight: isMobile ? '2px' : '0',
                                                        minHeight: isMobile ? '40px' : 'auto'
                                                    }}
                                                    onClick={() => isSelectable && setTempSelectedTime(slot.time)}
                                                    onMouseEnter={() => { if (!isMobile) setHoveredTime(slot.time); }}
                                                    onMouseLeave={() => { if (!isMobile) setHoveredTime(null); }}
                                                    disabled={!isSelectable}
                                                >
                                                {isMobile ? (
                                                    // Mobile layout - horizontal single line
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        flexDirection: 'row', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'space-between',
                                                        width: '100%',
                                                        gap: 8
                                                    }}>
                                                        <span style={{ 
                                                            fontWeight: 700, 
                                                            fontSize: '16px',
                                                            fontFamily: 'Gilroy Sans Serif, sans-serif',
                                                            lineHeight: 1
                                                        }}>
                                                            {formattedTime}
                                                        </span>
                                                        {shouldShowAvailabilityLabel && (
                                                            <span style={{ 
                                                                fontWeight: 700, 
                                                                fontSize: '16px',
                                                                fontFamily: 'Gilroy Sans Serif, sans-serif',
                                                                lineHeight: 1,
                                                                opacity: 0.9
                                                            }}>
                                                                {availabilityLabel}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // Desktop layout - horizontal
                                                    <>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <span style={{ fontWeight: 700, fontSize: '16px', fontFamily: 'Gilroy Sans Serif, sans-serif' }}>{formattedTime}</span>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        {shouldShowAvailabilityLabel && (
                                                            <div style={{ fontWeight: 600, fontSize: '16px', fontFamily: 'Gilroy Sans Serif, sans-serif' }}>
                                                                {availabilityLabel}
                                                            </div>
                                                        )}
                                                    </div>
                                                    </>
                                                )}
                                                {/* Center label based on remaining spaces or passenger-capacity mismatch */}
                                                {(!isAvailable) ? (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        pointerEvents: 'none',
                                                        fontWeight: 800,
                                                        fontSize: isMobile ? 16 : 16,
                                                        letterSpacing: isMobile ? 0.2 : 0.5,
                                                        color: '#ffffff',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        Sold Out
                                                    </div>
                                                ) : insufficientForPassengers ? (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        pointerEvents: 'none',
                                                        fontWeight: 800,
                                                        fontSize: isMobile ? 16 : 16,
                                                        letterSpacing: isMobile ? 0.2 : 0.5,
                                                        color: '#ffffff',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        Not Available
                                                    </div>
                                                ) : showCallToBookForSlot ? (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        pointerEvents: 'none',
                                                        fontWeight: 800,
                                                        fontSize: isMobile ? 16 : 16,
                                                        letterSpacing: isMobile ? 0.2 : 0.5,
                                                        color: '#ffffff',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        Call to Book
                                                    </div>
                                                ) : availableForSelection <= 2 && !isPrivateCharter ? (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        pointerEvents: 'none',
                                                        fontWeight: 700,
                                                        fontSize: '16px',
                                                        fontFamily: 'Gilroy Sans Serif, sans-serif',
                                                        letterSpacing: isMobile ? 0.2 : 0.5,
                                                        color: '#ffffff',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        High Demand
                                                    </div>
                                                ) : (availableForSelection === 3 || availableForSelection === 4) && !isPrivateCharter ? (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        pointerEvents: 'none',
                                                        fontWeight: 700,
                                                        fontSize: '16px',
                                                        fontFamily: 'Gilroy Sans Serif, sans-serif',
                                                        letterSpacing: isMobile ? 0.2 : 0.4,
                                                        color: '#ffffff',
                                                        textTransform: 'uppercase',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        Nearly Full
                                                    </div>
                                                ) : null}
                                                </button>
                                            </div>
                                        );
                                    });
                                })()}
                                
                                {/* Confirm and Cancel Buttons */}
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'center',
                                    gap: 10, 
                                    marginTop: 16,
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}>
                                    <button
                                        style={{
                                            border: '1px solid #d1d5db',
                                            background: '#fff',
                                            color: '#374151',
                                            padding: '8px 14px',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            fontSize: isMobile ? 14 : 14,
                                            fontWeight: 500,
                                            transition: 'all 0.2s ease',
                                            boxSizing: 'border-box',
                                            minHeight: isMobile ? '36px' : 'auto'
                                        }}
                                        onClick={() => {
                                            setTimeSelectionModalOpen(false);
                                            setTempSelectedTime(null);
                                        }}
                                    >
                                        Choose Another Date
                                    </button>
                                    <button
                                        style={{
                                            background: '#00eb5b',
                                            color: '#fff',
                                            padding: '8px 14px',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            border: 'none',
                                            fontSize: isMobile ? 14 : 14,
                                            fontWeight: 500,
                                            opacity: tempSelectedTime ? 1 : 0.5,
                                            transition: 'all 0.2s ease',
                                            boxSizing: 'border-box',
                                            minHeight: isMobile ? '36px' : 'auto'
                                        }}
                                        onClick={() => {
                                            if (tempSelectedTime) {
                                                handleTimeSelection(tempSelectedTime);
                                            }
                                        }}
                                        disabled={!tempSelectedTime}
                                    >
                                        Confirm
                                    </button>
                                </div>
                                
                                {/* Informational Text - centered with tick on all devices */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 16, color: '#666', textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            backgroundColor: '#10b981',
                                            color: '#fff',
                                            fontSize: 12,
                                            fontWeight: 800,
                                            lineHeight: 1
                                        }}>✓</span>
                                        <span style={{ fontSize: 12, lineHeight: '1.3', fontStyle: 'italic' }}>
                                            Times are set according to sunrise and sunset.
                                        </span>
                                    </div>
                            </div>
                        )}
                    </div>
                }
            />
            
            <style>{`
                .days-grid { 
                    display: grid; 
                    grid-template-columns: repeat(7, 1fr); 
                    gap: 0px; 
                    width: 100%;
                    max-width: 100%;
                    margin: 0 auto;
                    padding: 0 4px;
                }
                @media (max-width: 768px) {
                    .days-grid {
                        column-gap: 0px !important;
                        row-gap: 2px !important;
                        padding: 0 2px !important;
                    }
                }
                .weekday-label { 
                    text-align: center; 
                    font-weight: 600; 
                    color: #888; 
                    font-size: ${isMobile ? 13 : 15}px;
                    margin-bottom: 8px; 
                    padding: 8px;
                }
                @media (max-width: 768px) {
                    .weekday-label {
                        padding: 0 !important;
                        margin: 0 !important;
                        margin-bottom: 1px !important;
                        font-size: 10px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        box-sizing: border-box !important;
                    }
                }
                .day { 
                    width: 80px; 
                    height: 80px; 
                    min-width: 80px; 
                    max-width: 80px; 
                    min-height: 80px; 
                    max-height: 80px; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    margin: 2px; 
                    transition: all 0.2s ease; 
                    box-sizing: border-box;
                    border-radius: 8px;
                }
                @media (max-width: 768px) {
                    .day {
                        margin: 1px !important;
                        padding: 0 !important;
                    }
                }
                .empty-day { 
                    background: none !important; 
                    border: none !important; 
                    box-shadow: none !important; 
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
                @media (max-width: 768px) {
                    .empty-day {
                        height: auto !important;
                        min-width: 0 !important;
                        min-height: 0 !important;
                    }
                }
                .day.selected { 
                    box-shadow: 0 0 0 2px #00eb5b; 
                    border: 2px solid #00eb5b; 
                    background: #00eb5b !important;
                    color: white !important;
                }
                .day.sold-out { 
                    background: #bbb !important; 
                    color: #fff !important; 
                    cursor: not-allowed !important; 
                }
                .day.disabled { 
                    background: #ededed;
                    color: #999;
                }
                .day.available-day {
                    background: #03A9F4 !important; 
                    color: white !important;
                    cursor: pointer;
                }
                /* Emphasize interactivity on hover */
                .day.available-day:hover {
                    transform: translateY(-2px) scale(1.03);
                    box-shadow: 0 8px 18px rgba(0,0,0,0.15), 0 0 0 3px rgba(86,193,255,0.6);
                    outline: 2px solid #00eb5b;
                }
                /* Add subtle focus-visible style for keyboard users */
                .day.available-day:focus-visible {
                    outline: 3px solid #00eb5b;
                    box-shadow: 0 0 0 4px rgba(86,193,255,0.35);
                }
                /* pulse animation disabled */
                
                @media (max-width: 768px) {
                    .days-grid {
                        max-width: 100%;
                        grid-template-columns: repeat(7, 1fr);
                    }
                }
            `}</style>
            <style>{`
.realtime-badge-wrap {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  z-index: 2;
}
@media (max-width: 700px) {
  .realtime-badge-wrap {
    position: static;
    transform: none;
    justify-content: center;
    margin: 8px 0 0 0;
  }
}
.realtime-badge {
  background: #61D836;
  color: #fff;
  border-radius: 7px;
  padding: 2px 10px;
  font-weight: 600;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.realtime-badge-text {
  font-size: 12px;
  font-weight: 600;
}
            `}</style>
            
            {/* Removed standalone capacity warning modal */}
            
            {/* Timeout Modal removed - no automatic timeout */}
        </>
    );
};

export default LiveAvailabilitySection;