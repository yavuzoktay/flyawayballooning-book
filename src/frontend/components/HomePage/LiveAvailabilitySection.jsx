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
            if (w <= 360) setDaySize(38);
            else if (w <= 420) setDaySize(42);
            else if (w <= 480) setDaySize(46);
            else if (w <= 576) setDaySize(50);
            else if (w <= 768) setDaySize(58);
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
    // For Book Flight: also need voucher type
    // For Redeem Voucher: only need location and activity
    // For Bristol Fiesta: only need location and activity (no voucher type required)
    const isLocationAndExperienceSelected = chooseLocation && selectedActivity && selectedActivity.length > 0 && (
        (activitySelect === 'Book Flight' && chooseFlightType && chooseFlightType.type && selectedVoucherType) ||
        (activitySelect === 'Redeem Voucher') ||
        (chooseLocation === 'Bristol Fiesta') || // Bristol Fiesta için sadece lokasyon ve aktivite yeterli
        (activitySelect !== 'Book Flight' && activitySelect !== 'Redeem Voucher')
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
        if (!isLocationAndExperienceSelected) {
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
        if (!isLocationAndExperienceSelected) {
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

    // Yeni: availabilities [{id, date, time, capacity, available, ...}] düz listede geliyor
    // Calendar için: hangi günlerde en az 1 açık slot var?
    console.log('LiveAvailabilitySection received availabilities:', availabilities);
    console.log('Current date range:', { startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd'), currentDate: format(currentDate, 'yyyy-MM-dd') });
    
    // Filter availabilities - respect selected voucher type when provided
    // Only filter if location and experience are selected
    const filteredAvailabilities = isLocationAndExperienceSelected ? availabilities.filter(a => {
        // Check multiple conditions for availability
        const isOpen = a.status === 'Open' || a.status === 'open' || a.status === 'Open' || a.available > 0;
        const hasCapacity = a.capacity && a.capacity > 0;
        const isAvailable = isOpen && hasCapacity;
        // If voucher type is selected, restrict to matching voucher types (backend includes 'voucher_types' on each availability)
        const matchesVoucher = selectedVoucherType?.title ? (
            Array.isArray(a.voucher_types)
                ? a.voucher_types.includes(selectedVoucherType.title)
                : (typeof a.voucher_types === 'string'
                    ? a.voucher_types.split(',').map(s => s.trim()).includes(selectedVoucherType.title)
                    : true)
        ) : true;
        console.log(`Availability ${a.id}: date=${a.date}, status=${a.status}, available=${a.available}, capacity=${a.capacity}, isAvailable=${isAvailable}, matchesVoucher=${matchesVoucher}, voucher_types=${a.voucher_types}`);
        return isAvailable && matchesVoucher;
    }) : [];
    console.log('Filtered availabilities (all times):', filteredAvailabilities);
    
    // Alternative filtering: if the above is too restrictive, try this
    const alternativeFiltered = isLocationAndExperienceSelected ? availabilities.filter(a => {
        // More permissive filtering
        const hasDate = a.date && a.date.length > 0;
        const hasCapacity = a.capacity && a.capacity > 0;
        const isAvailable = hasDate && hasCapacity;
        console.log(`Alternative filter ${a.id}: date=${a.date}, status=${a.status}, available=${a.available}, capacity=${a.capacity}, isAvailable=${isAvailable}`);
        return isAvailable;
    }) : [];
    console.log('Alternative filtered availabilities:', alternativeFiltered);
    
    // Use the more permissive filtering if the strict one returns nothing
    const finalFilteredAvailabilities = filteredAvailabilities.length > 0 ? filteredAvailabilities : alternativeFiltered;
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
        const matchingAvailabilities = finalFilteredAvailabilities.filter(a => {
            console.log(`Comparing ${a.date} with ${dateStr}, status: ${a.status}, available: ${a.available}`);
            return a.date === dateStr;
        });
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
        
        // Check ALL availabilities for this date (including capacity = 0)
        const allSlotsForDate = availabilities.filter(a => a.date === dateStr);
        console.log(`All slots for ${dateStr}:`, allSlotsForDate);
        console.log(`Slot statuses for ${dateStr}:`, allSlotsForDate.map(slot => ({ 
            id: slot.id, 
            status: slot.status, 
            available: slot.available, 
            capacity: slot.capacity,
            date: slot.date
        })));
        console.log(`Raw availabilities for ${dateStr}:`, availabilities.filter(a => a.date === dateStr));
        
        // Get open/available slots (capacity > 0) for totals
        const availableSlots = finalFilteredAvailabilities.filter(a => a.date === dateStr);
        const total = availableSlots.reduce((sum, s) => sum + (s.available || s.capacity || 0), 0);
        
        // Sold out: when there are slots for this date but total available capacity is 0
        // Also check for closed status slots
        const hasClosedSlots = allSlotsForDate.some(slot => slot.status === 'Closed' || slot.status === 'closed' || slot.status === 'closed');
        const hasOpenSlots = allSlotsForDate.some(slot => slot.status === 'Open' || slot.status === 'open');
        const soldOut = (allSlotsForDate.length > 0 && total === 0) || hasClosedSlots;
        
        console.log(`Date ${dateStr}: allSlots=${allSlotsForDate.length}, availableSlots=${availableSlots.length}, total=${total}, hasClosedSlots=${hasClosedSlots}, hasOpenSlots=${hasOpenSlots}, soldOut=${soldOut}`);
        // IMPORTANT: return ALL slots for the popup (including 0 available) so users can see Sold Out times
        return { total, soldOut, slots: allSlotsForDate };
    };

        const renderDays = () => {
        const days = [];
        let dayPointer = new Date(startDate);
        
        // Use startOfWeek to get the correct offset for the first row (Monday as first day)
        const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
        dayPointer = new Date(weekStart);
        
        // Fill all days for the grid (6 weeks * 7 days = 42 days)
        for (let i = 0; i < 42; i++) {
            if (dayPointer < startDate) {
                // Before the month starts
                days.push(<div key={`empty-start-${i}`} className="day empty-day" style={{ display: 'none' }}></div>);
            } else if (dayPointer > endDate) {
                // After the month ends
                days.push(<div key={`empty-end-${i}`} className="day empty-day" style={{ display: 'none' }}></div>);
            } else {
                // Within the month
                const dateCopy = new Date(dayPointer);
                // Create date strings manually to avoid timezone issues
                const dateCopyYear = dateCopy.getFullYear();
                const dateCopyMonth = dateCopy.getMonth();
                const dateCopyDay = dateCopy.getDate();
                const dateCopyStartOfDay = new Date(dateCopyYear, dateCopyMonth, dateCopyDay, 0, 0, 0, 0);
                
                const todayYear = today.getFullYear();
                const todayMonth = today.getMonth();
                const todayDay = today.getDate();
                const todayStartOfDay = new Date(todayYear, todayMonth, todayDay, 0, 0, 0, 0);
                
                const isPastDate = dateCopyStartOfDay < todayStartOfDay;
                const isSelected = selectedDate && selectedDate.toDateString() === dateCopy.toDateString();
                const { total, soldOut, slots } = getSpacesForDate(dateCopy);
                // Fix: isAvailable should be true if there are slots (even if sold out)
                const isAvailable = total > 0 || soldOut;
                const pulse = false; // disable pulsing highlight
                
                // Determine if date should be interactive
                const isInteractive = !isPastDate && isAvailable && isLocationAndExperienceSelected && !soldOut;
                
                days.push(
                    <div
                        key={`${dateCopy.getFullYear()}-${String(dateCopy.getMonth() + 1).padStart(2, '0')}-${String(dateCopy.getDate()).padStart(2, '0')}`}
                        className={`day ${isPastDate || (!isAvailable && !soldOut) ? 'disabled' : ''} ${!isPastDate && isAvailable && !soldOut ? 'available-day' : ''} ${isSelected ? 'selected' : ''} ${soldOut ? 'sold-out' : ''} ${pulse && !isPastDate ? 'pulse' : ''}`}
                        onClick={() => isInteractive && handleDateClick(dateCopy)}
                        style={{
                            // Past days should always appear dimmed
                            opacity: isPastDate ? 0.5 : (soldOut ? 1 : (isAvailable ? (isLocationAndExperienceSelected ? 1 : 0.3) : 0.5)),
                            cursor: isInteractive ? 'pointer' : 'not-allowed',
                            background: isSelected ? '#56C1FF' : isPastDate ? '#ddd' : soldOut ? '#888' : isAvailable ? '#61D836' : '',
                            color: isPastDate ? '#999' : soldOut ? '#fff' : isAvailable ? '#fff' : '#888',
                            borderRadius: isMobile ? 6 : 8,
                            margin: isMobile ? 1 : 2,
                            padding: isMobile ? 1 : 2,
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
                            fontSize: isMobile ? 14 : 18, 
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
                                {`${total} Space${total > 1 ? 's' : ''}`}
                            </div>
                        )}
                        {soldOut && !isPastDate && (
                            <div style={{ 
                                fontSize: isMobile ? 9 : 11, 
                                marginTop: isMobile ? 2 : 4, 
                                color: '#fff', 
                                fontWeight: 600,
                                lineHeight: 1,
                                textAlign: 'center'
                            }}>
                                Sold Out
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
                    backgroundColor: '#4CAF50',
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
                            gap: 2px !important;
                            padding: 0 4px !important;
                        }
                        
                        .calendar .day {
                            margin: 1px !important;
                            padding: 1px !important;
                        }
                        
                        .calendar .weekday-label {
                            font-size: 11px !important;
                            margin-bottom: 4px !important;
                            padding: 2px !important;
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
                            gap: 1px !important;
                            padding: 0 2px !important;
                        }
                        
                        .calendar .day {
                            margin: 0.5px !important;
                            padding: 0.5px !important;
                        }
                        
                        .calendar .weekday-label {
                            font-size: 10px !important;
                            margin-bottom: 2px !important;
                            padding: 1px !important;
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
                                padding: isMobile ? '6px 10px' : '8px 12px'
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
                        gap: isMobile ? '2px' : '4px', 
                        marginBottom: 0, 
                        width: '100%', 
                        maxWidth: '100%', 
                        margin: '0 auto', 
                        padding: isMobile ? '0 4px' : '0 6px', 
                        boxSizing: 'border-box' 
                    }}>
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                            <div key={d} className="weekday-label" style={{ 
                                textAlign: 'center', 
                                fontWeight: 600, 
                                color: '#888', 
                                fontSize: isMobile ? 11 : 15, 
                                marginBottom: isMobile ? 4 : 8,
                                padding: isMobile ? '2px' : '4px'
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
                        <span style={{ 
                            fontSize: isMobile ? 14 : 14, 
                            color: '#888',
                            lineHeight: isMobile ? 1.3 : 1.4
                        }}>
                            Reschedule your flight for free up to 5 days before your scheduled date.
                        </span>
                    </div>

                    {/* Add request date section below calendar */}
                    {activitySelect === 'Book Flight' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                                <span style={{ fontSize: isMobile ? 12 : 13, color: '#777' }}>Can’t see the date you are looking for?</span>
                                <button style={{
                                    background: '#56C1FF',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: isMobile ? '5px 12px' : '6px 14px',
                                    fontWeight: 600,
                                    fontSize: isMobile ? 13 : 14,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(86,193,255,0.12)'
                                }} onClick={() => setRequestModalOpen(true)}>Request Date</button>
                            </div>
                        </div>
                    )}
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
                            Back to calendar
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
                                        const isAvailable = (slot.available || 0) > 0;
                                        const insufficientForPassengers = selectedVoucherType && selectedPassengers > (slot.available || 0);
                                        const within8h = diffHours < 8 && diffHours > 0;
                                        const enoughSeats = (slot.available || 0) >= selectedPassengers;
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
                                        
                                        return (
                                            <div key={slot.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? 6 : 12 }}>
                                                <button
                                                    style={{
                                                        background: isSelectable ? '#61D836' : '#ccc',
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
                                                        transition: 'all 0.2s ease',
                                                        transform: tempSelectedTime === slot.time ? (isMobile ? 'scale(1)' : 'scale(1.02)') : 'scale(1)',
                                                        position: 'relative',
                                                        boxShadow: tempSelectedTime === slot.time ? '0 0 0 2px #56C1FF' : 'none',
                                                        boxSizing: 'border-box',
                                                        marginBottom: isMobile ? 6 : 0,
                                                        marginLeft: isMobile ? '2px' : '0',
                                                        marginRight: isMobile ? '2px' : '0',
                                                        minHeight: isMobile ? '40px' : 'auto'
                                                    }}
                                                    onClick={() => isSelectable && setTempSelectedTime(slot.time)}
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
                                                            lineHeight: 1
                                                        }}>
                                                            {formattedTime}
                                                        </span>
                                                        <span style={{ 
                                                            fontWeight: 600, 
                                                            fontSize: '11px',
                                                            lineHeight: 1,
                                                            opacity: 0.9
                                                        }}>
                                                            {slot.available} Space{slot.available > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    // Desktop layout - horizontal
                                                    <>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <span style={{ fontWeight: 700, fontSize: '18px' }}>{formattedTime}</span>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontWeight: 600, fontSize: '16px' }}>
                                                                {slot.available} Space{slot.available > 1 ? 's' : ''}
                                                            </div>
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
                                                        textTransform: 'uppercase',
                                                        textShadow: '0 1px 2px rgba(0,0,0,0.35)'
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
                                                        textTransform: 'uppercase',
                                                        textShadow: '0 1px 2px rgba(0,0,0,0.35)'
                                                    }}>
                                                        Too few seats
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
                                                        textTransform: 'uppercase',
                                                        textShadow: '0 1px 2px rgba(0,0,0,0.35)'
                                                    }}>
                                                        Call to Book
                                                    </div>
                                                ) : slot.available <= 2 ? (
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
                                                        textTransform: 'uppercase',
                                                        textShadow: '0 1px 2px rgba(0,0,0,0.35)'
                                                    }}>
                                                        High Demand
                                                    </div>
                                                ) : (slot.available === 3 || slot.available === 4) && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        pointerEvents: 'none',
                                                        fontWeight: 800,
                                                        fontSize: isMobile ? 16 : 14,
                                                        letterSpacing: isMobile ? 0.2 : 0.4,
                                                        color: '#ffffff',
                                                        textTransform: 'uppercase',
                                                        textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        Spaces Running Low
                                                    </div>
                                                )}
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
                                        Back to calendar
                                    </button>
                                    <button
                                        style={{
                                            background: '#10b981',
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
                                
                                {/* Informational Text (hidden on mobile) */}
                                {!isMobile && (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        marginTop: 16, 
                                        color: '#666', 
                                        fontSize: '12px',
                                        lineHeight: '1.3',
                                        fontStyle: 'italic'
                                    }}>
                                        Hot air balloons can only fly twice a day – around sunrise and sunset. Meeting times are set according to these times.
                                    </div>
                                )}
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
                .weekday-label { 
                    text-align: center; 
                    font-weight: 600; 
                    color: #888; 
                    font-size: ${isMobile ? 13 : 15}px;
                    margin-bottom: 8px; 
                    padding: 8px;
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
                .empty-day { 
                    background: none !important; 
                    border: none !important; 
                    box-shadow: none !important; 
                    width: 80px;
                    height: 80px;
                }
                .day.selected { 
                    box-shadow: 0 0 0 2px #56C1FF; 
                    border: 2px solid #56C1FF; 
                    background: #56C1FF !important;
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
                    background: #61D836 !important; 
                    color: white !important;
                    cursor: pointer;
                }
                /* Emphasize interactivity on hover */
                .day.available-day:hover {
                    transform: translateY(-2px) scale(1.03);
                    box-shadow: 0 8px 18px rgba(0,0,0,0.15), 0 0 0 3px rgba(86,193,255,0.6);
                    outline: 2px solid #56C1FF;
                }
                /* Add subtle focus-visible style for keyboard users */
                .day.available-day:focus-visible {
                    outline: 3px solid #56C1FF;
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