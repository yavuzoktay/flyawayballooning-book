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

const LiveAvailabilitySection = ({ isGiftVoucher, isFlightVoucher, selectedDate, setSelectedDate, activeAccordion, setActiveAccordion, selectedActivity, availableSeats, chooseLocation, selectedTime, setSelectedTime, availabilities, activitySelect }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookedSeat, setBookedSeat] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [requestName, setRequestName] = useState("");
    const [requestPhone, setRequestPhone] = useState("");
    const [requestEmail, setRequestEmail] = useState("");
    const [requestLocation, setRequestLocation] = useState("");
    const [requestFlightType, setRequestFlightType] = useState("");
    const [requestDate, setRequestDate] = useState("");
    const allLocations = ["Bath", "Devon", "Somerset", "Bristol Fiesta"];
    const allFlightTypes = ["Book Flight", "Flight Voucher", "Redeem Voucher", "Buy Gift"];
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

    var final_pax_count = selectedActivity?.[0]?.seats;

    const today = new Date(); // Current date to compare
    // Change startDate and endDate to only cover the current month
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    // Terms for Bristol Fiesta
    const bristolFiestaTerms = [
        "Ballooning is a weather dependent activity.",
        "Your voucher is valid for 24 months.",
        "Without the weather refundable option your voucher is non-refundable under any circumstances. However, re-bookable as needed within voucher validity period.",
        "If you make 10 attempts to fly within 24 months which are cancelled by us, we will extend your voucher for a further 12 months free of charge.",
        "Within 48 hours of your flight no changes or cancellations can be made.",
        "Your flight will never expire so long as you meet the terms & conditions. "
    ];

    const handlePrevMonth = () => {
        setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1));
    };

    const handleDateClick = (date) => {
        if (!isBefore(date, today)) {
            // Tarih değiştirildiğinde selectedTime'ı sıfırla
            setSelectedTime(null);
            const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0); // Saat bilgisini sıfırla
            setSelectedDate(newDate);
        }
    };

    const handleTimeClick = (time) => {
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

    if (chooseLocation === '') {
        setIsModalOpen(true);
    }

    // Yeni: availabilities [{id, date, time, capacity, available, ...}] düz listede geliyor
    // Calendar için: hangi günlerde en az 1 açık slot var?
    console.log('LiveAvailabilitySection received availabilities:', availabilities);
    console.log('Current date range:', { startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd'), currentDate: format(currentDate, 'yyyy-MM-dd') });
    const availableDates = Array.from(new Set(availabilities.map(a => a.date)));
    console.log('Available dates from server:', availableDates);
    const getTimesForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        console.log(`Looking for date: ${dateStr}`);
        const matchingAvailabilities = availabilities.filter(a => {
            console.log(`Comparing ${a.date} with ${dateStr}, status: ${a.status}, available: ${a.available}`);
            return a.date === dateStr && (a.status === 'Open' || a.status === 'open' || a.available > 0);
        });
        console.log(`Found ${matchingAvailabilities.length} availabilities for ${dateStr}`);
        return matchingAvailabilities;
    };

    // Filter availabilities - show all open ones (no AM/PM filtering)
    const filteredAvailabilities = availabilities.filter(a => {
        // Only include if status is 'Open' or 'open' or available > 0
        const isOpen = a.status === 'Open' || a.status === 'open' || a.available > 0;
        return isOpen;
    });
    console.log('Filtered availabilities (all times):', filteredAvailabilities);
    // Günlük toplam available hesapla
    const getSpacesForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        console.log(`getSpacesForDate called for: ${dateStr}`);
        console.log(`Filtered availabilities:`, filteredAvailabilities);
        const slots = filteredAvailabilities.filter(a => {
            console.log(`Comparing slot date ${a.date} with ${dateStr}`);
            return a.date === dateStr;
        });
        const total = slots.reduce((sum, s) => sum + (s.available || 0), 0);
        console.log(`Date ${dateStr}: ${slots.length} slots, total: ${total}`);
        return { total, soldOut: slots.length > 0 && total === 0, slots };
    };

    const renderDays = () => {
        const weeks = [];
        let week = [];
        let tempDate = new Date(startDate);
        // Use startOfWeek to get the correct offset for the first row (Monday as first day)
        const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
        let dayPointer = new Date(weekStart);
        // Fill the first week
        for (let i = 0; i < 7; i++) {
            if (dayPointer < startDate) {
                week.push(<div key={`empty-start-${i}`} className="day empty-day" style={{ display: 'none' }}></div>);
            } else if (dayPointer > endDate) {
                week.push(<div key={`empty-end-firstrow-${i}`} className="day empty-day" style={{ display: 'none' }}></div>);
            } else {
                const dateCopy = new Date(dayPointer);
                const isPastDate = isBefore(dateCopy, today);
                const isSelected = selectedDate && selectedDate.toDateString() === dateCopy.toDateString();
                const { total, soldOut, slots } = getSpacesForDate(dateCopy);
                const isAvailable = total > 0;
                const pulse = isAvailable && total <= 4 && total > 0;
                week.push(
                    <div
                        key={dateCopy.toISOString()}
                        className={`day ${isPastDate || !isAvailable ? 'disabled' : ''} ${!isPastDate && isAvailable ? 'available-day' : ''} ${isSelected ? 'selected' : ''} ${soldOut ? 'sold-out' : ''} ${pulse && !isPastDate ? 'pulse' : ''}`}
                        onClick={() => (!isPastDate && isAvailable) && handleDateClick(dateCopy)}
                        style={{
                            opacity: isAvailable ? 0.5 : 0.5,
                            cursor: (!isPastDate && isAvailable) ? 'pointer' : 'not-allowed',
                            background: isSelected ? '#56C1FF' : isPastDate ? '#ddd' : soldOut ? '#bbb' : isAvailable ? '#61D836' : '',
                            color: isPastDate ? '#999' : isAvailable ? '#fff' : '#888',
                            borderRadius: 8,
                            margin: 2,
                            padding: 2,
                            minHeight: 48,
                            minWidth: 80,
                            maxWidth: 80,
                            width: 80,
                            height: 80,
                            boxSizing: 'border-box',
                            position: 'relative',
                            border: isSelected ? '2px solid #56C1FF' : 'none',
                            boxShadow: isSelected ? '0 0 0 2px #56C1FF' : 'none',
                            animation: pulse ? 'pulseAnim 1.2s infinite' : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div>{format(dateCopy, 'd')}</div>
                        {isAvailable && !isPastDate && <div style={{ fontSize: 12, marginTop: 2 }}>{soldOut ? 'Sold Out' : `${total} Space${total > 1 ? 's' : ''}`}</div>}
                    </div>
                );
            }
            dayPointer = addDays(dayPointer, 1);
        }
        weeks.push(week);
        // Fill the rest of the weeks
        while (dayPointer <= endDate) {
            let weekRow = [];
            for (let i = 0; i < 7; i++) {
                if (dayPointer > endDate) {
                    weekRow.push(<div key={`empty-end-${dayPointer.toISOString()}`} className="day empty-day" style={{ display: 'none' }}></div>);
                } else {
                    const dateCopy = new Date(dayPointer);
                    const isPastDate = isBefore(dateCopy, today);
                    const isSelected = selectedDate && selectedDate.toDateString() === dateCopy.toDateString();
                    const { total, soldOut, slots } = getSpacesForDate(dateCopy);
                    const isAvailable = total > 0;
                    const pulse = isAvailable && total <= 4 && total > 0;
                    weekRow.push(
                        <div
                            key={dateCopy.toISOString()}
                            className={`day ${isPastDate || !isAvailable ? 'disabled' : ''} ${!isPastDate && isAvailable ? 'available-day' : ''} ${isSelected ? 'selected' : ''} ${soldOut ? 'sold-out' : ''} ${pulse && !isPastDate ? 'pulse' : ''}`}
                            onClick={() => (!isPastDate && isAvailable) && handleDateClick(dateCopy)}
                            style={{
                                opacity: isAvailable ? 1 : 1,
                                cursor: (!isPastDate && isAvailable) ? 'pointer' : 'not-allowed',
                                background: isSelected ? '#56C1FF' : isPastDate ? '#ddd' : soldOut ? '#bbb' : isAvailable ? '#61D836' : '',
                                color: isPastDate ? '#999' : isAvailable ? '#fff' : '#888',
                                borderRadius: 8,
                                margin: 2,
                                padding: 2,
                                minHeight: 48,
                                minWidth: 80,
                                maxWidth: 80,
                                width: 80,
                                height: 80,
                                boxSizing: 'border-box',
                                position: 'relative',
                                border: isSelected ? '2px solid #56C1FF' : 'none',
                                boxShadow: isSelected ? '0 0 0 2px #56C1FF' : 'none',
                                animation: pulse ? 'pulseAnim 1.2s infinite' : 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <div>{format(dateCopy, 'd')}</div>
                            {isAvailable && !isPastDate && <div style={{ fontSize: 12, marginTop: 2 }}>{soldOut ? 'Sold Out' : `${total} Space${total > 1 ? 's' : ''}`}</div>}
                        </div>
                    );
                }
                dayPointer = addDays(dayPointer, 1);
            }
            weeks.push(weekRow);
        }
        return weeks.map((w, i) => <div key={`week-${i}`} style={{ display: 'flex', width: '100%' }}>{w}</div>);
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
                setRequestSuccess("Your request has been submitted!");
                setTimeout(() => {
                    setRequestModalOpen(false);
                    setRequestName(""); setRequestPhone(""); setRequestEmail(""); setRequestLocation(""); setRequestFlightType(""); setRequestDate("");
                    setRequestSuccess("");
                }, 1500);
            } else {
                setRequestError("Failed to submit request. Please try again.");
            }
        } catch (err) {
            setRequestError("Failed to submit request. Please try again.");
        }
    };

    // Alanların dolu olup olmadığını kontrol eden fonksiyon
    const isFormValid = requestName.trim() && requestEmail.trim() && requestLocation && requestFlightType && requestDate;

    // Submit butonuna tıklanınca eksik alanlar için error state'lerini tetikleyen fonksiyon
    const handleShowAllErrors = () => {
        if (!requestName.trim()) setNameError(true);
        if (!/^[a-zA-ZğüşöçıİĞÜŞÖÇ\s]+$/.test(requestName.trim())) { setNameFormatError(true); }
        if (!requestEmail.trim()) setEmailError(true);
        if (requestEmail && !/^\S+@\S+\.\S+$/.test(requestEmail)) { setEmailFormatError(true); }
        if (!requestLocation) setLocationError(true);
        if (!requestFlightType) setFlightTypeError(true);
        if (!requestDate) setDateError(true);
    };

    return (
        <>
            <Accordion title="Live Availability" id="live-availability" activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} className={`${isFlightVoucher || isGiftVoucher ? 'disable-acc' : ""}`}>
                <div className="calendar">
                    <div className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className='calender-prev calender-arrow' onClick={handlePrevMonth}><ArrowBackIosIcon /></div>
                            <h2 style={{ margin: '0 4px', fontWeight: 500, color: '#222', fontSize: 24, letterSpacing: 1 }}>{format(currentDate, 'MMMM yyyy')}</h2>
                            <div className='calender-next calender-arrow' onClick={handleNextMonth}><ArrowForwardIosIcon /></div>
                        </div>
                        {/* Real-time availability badge - responsive */}
                        <div className="realtime-badge-wrap">
                            <div className="realtime-badge">
                                <CheckIcon style={{ fontSize: 20, marginRight: 4 }} />
                                <span className="realtime-badge-text">Real-time availability</span>
                            </div>
                        </div>
                    </div>
                    {/* Centered currently viewing info under the heading */}
                    <div style={{ margin: '18px 0 0 0', fontSize: 16, color: '#222', borderRadius: 8, padding: 12, textAlign: 'center', fontWeight: 500, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
                        <div>Currently viewing: <b>{chooseLocation || 'Location Selected'}</b>, <b>{selectedActivity?.[0]?.type || 'Shared'}</b></div>
                        {selectedDate && selectedTime && (
                            <div>Current Selection: <b>{format(selectedDate, 'd/M/yyyy')}</b>, Meeting Time: <b>{selectedTime}</b></div>
                        )}
                    </div>
                    {/* Takvim alanı: */}
                    <div className="days-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0px', marginBottom: 0 }}>
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <div key={d} className="weekday-label" style={{ textAlign: 'center', fontWeight: 600, color: '#888', fontSize: 15, marginBottom: 8 }}>{d}</div>)}
                        {(() => {
                            const days = [];
                            let tempDate = new Date(startDate);
                            const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
                            let dayPointer = new Date(weekStart);
                            // Fill leading empty cells
                            for (let i = 0; i < 42; i++) { // 6 weeks max
                                if (i < 7 && dayPointer < startDate) {
                                    days.push(<div key={`empty-start-${i}`} className="day empty-day" style={{ display: 'none' }}></div>);
                                } else if (dayPointer > endDate) {
                                    days.push(<div key={`empty-end-${i}`} className="day empty-day" style={{ display: 'none' }}></div>);
                                } else if (dayPointer >= startDate && dayPointer <= endDate) {
                                    const dateCopy = new Date(dayPointer);
                                    const isPastDate = isBefore(dateCopy, today);
                                    const isSelected = selectedDate && selectedDate.toDateString() === dateCopy.toDateString();
                                    const { total, soldOut, slots } = getSpacesForDate(dateCopy);
                                    const isAvailable = total > 0;
                                    const pulse = isAvailable && total <= 4 && total > 0;
                                    days.push(
                                        <div
                                            key={dateCopy.toISOString()}
                                            className={`day ${isPastDate || !isAvailable ? 'disabled' : ''} ${!isPastDate && isAvailable ? 'available-day' : ''} ${isSelected ? 'selected' : ''} ${soldOut ? 'sold-out' : ''} ${pulse && !isPastDate ? 'pulse' : ''}`}
                                            onClick={() => (!isPastDate && isAvailable) && handleDateClick(dateCopy)}
                                            style={{
                                                opacity: isAvailable ? 1 : 1,
                                                cursor: (!isPastDate && isAvailable) ? 'pointer' : 'not-allowed',
                                                background: isSelected ? '#56C1FF' : isPastDate ? '#ddd' : soldOut ? '#bbb' : isAvailable ? '#61D836' : '',
                                                color: isPastDate ? '#999' : isAvailable ? '#fff' : '#888',
                                                borderRadius: 8,
                                                margin: 2,
                                                padding: 2,
                                                minHeight: 48,
                                                minWidth: 80,
                                                maxWidth: 80,
                                                width: 80,
                                                height: 80,
                                                boxSizing: 'border-box',
                                                position: 'relative',
                                                border: isSelected ? '2px solid #56C1FF' : 'none',
                                                boxShadow: isSelected ? '0 0 0 2px #56C1FF' : 'none',
                                                animation: pulse ? 'pulseAnim 1.2s infinite' : 'none',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <div>{format(dateCopy, 'd')}</div>
                                            {isAvailable && !isPastDate && <div style={{ fontSize: 12, marginTop: 2 }}>{soldOut ? 'Sold Out' : `${total} Space${total > 1 ? 's' : ''}`}</div>}
                                        </div>
                                    );
                                } else {
                                    days.push(<div key={`empty-mid-${i}`} className="day empty-day" style={{ display: 'none' }}></div>);
                                }
                                dayPointer = addDays(dayPointer, 1);
                            }
                            return days;
                        })()}
                    </div>
                    {/* Reschedule text below calendar */}
                    <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, color: '#888' }}>Reschedule your flight for free up to 5 days before your scheduled date.</span>
                    </div>
                    {/* Saatler: sadece seçili günün açık saatleri ve seçili AM/PM */}
                    {selectedDate && (
                        <div style={{ marginTop: 24, marginBottom: 8 }}>
                            <div style={{ fontWeight: 500, marginBottom: 8 }}>Available Times for {format(selectedDate, 'MMMM d, yyyy')}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {getSpacesForDate(selectedDate).slots.length === 0 && <div style={{color:'#888'}}>No available times</div>}
                                {getSpacesForDate(selectedDate).slots.map(slot => {
                                    // --- 8 saat kuralı ---
                                    let slotDateTime = new Date(selectedDate);
                                    if (slot.time) {
                                        const [h, m, s] = slot.time.split(':');
                                        slotDateTime.setHours(Number(h));
                                        slotDateTime.setMinutes(Number(m || 0));
                                        slotDateTime.setSeconds(Number(s || 0));
                                    }
                                    const now = new Date();
                                    const diffMs = slotDateTime - now;
                                    const diffHours = diffMs / (1000 * 60 * 60);
                                    const isAvailable = slot.available > 0;
                                    const isSelectable = isAvailable && diffHours >= 8;
                                    return (
                                        <Tooltip key={slot.id} title={!isSelectable ? 'Call/Text to book' : ''} arrow disableHoverListener={isSelectable}>
                                            <span style={{ width: '100%' }}>
                                                <button
                                                    style={{
                                                        background: '#56C1FF',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: 16,
                                                        padding: '8px 0',
                                                        fontWeight: 700,
                                                        fontSize: 22,
                                                        marginBottom: 12,
                                                        cursor: isSelectable ? 'pointer' : 'not-allowed',
                                                        outline: selectedTime === slot.time ? '2px solid #56C1FF' : 'none',
                                                        opacity: isAvailable ? 1 : 0.5,
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: 18,
                                                        letterSpacing: 1
                                                    }}
                                                    onClick={() => isSelectable && handleTimeClick(slot.time)}
                                                    disabled={!isSelectable}
                                                >
                                                    <span style={{ marginRight: 8, fontSize: 24 }}>🕒</span>
                                                    <span style={{ fontWeight: 700 }}>{slot.time}</span>
                                                    <span style={{ marginLeft: 18, fontWeight: 700 }}>Available ({slot.available}/{slot.capacity})</span>
                                                </button>
                                            </span>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {/* Add request date section below calendar */}
                    {activitySelect === 'Book Flight' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                                <span style={{ fontSize: 16, color: '#444' }}>Can’t see the date you are looking for?</span>
                                <button style={{
                                    background: '#56C1FF',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '8px 18px',
                                    fontWeight: 600,
                                    fontSize: 16,
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
                        title="Bristol Balloon Fiesta - Terms & Conditions"
                        bulletPoints={bristolFiestaTerms}
                    />
                    :
                    ""
            }
            <Modal
                isOpen={requestModalOpen}
                onClose={() => setRequestModalOpen(false)}
                title="Request Date"
                extraContent={
                    <form style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 16, minWidth: 340, width: '100%', maxWidth: 400, alignItems: 'stretch' }} onSubmit={e => {
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
                        <div style={{ marginBottom: 8, position: 'relative', width: '100%' }}>
                            <input type="text" placeholder="Name" value={requestName} onChange={e => {
                                const val = e.target.value.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]/g, '');
                                setRequestName(val);
                                setNameError(false);
                                setNameFormatError(false);
                            }} style={{ padding: 8, borderRadius: 4, border: nameError || nameFormatError ? '2px solid red' : '1px solid #ccc', width: '100%', margin: '0 auto', display: 'block', boxSizing: 'border-box' }} required />
                            {nameError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>This field is required</div>}
                            {nameFormatError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>Only letters allowed</div>}
                        </div>
                        <div style={{ marginBottom: 8, width: '100%' }}>
                            <input type="text" placeholder="Phone" value={requestPhone} onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setRequestPhone(val);
                                setPhoneFormatError(false);
                            }} style={{ padding: 8, borderRadius: 4, border: phoneFormatError ? '2px solid red' : '1px solid #ccc', width: '100%', margin: '0 auto', display: 'block', boxSizing: 'border-box' }} />
                            {phoneFormatError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>Only numbers allowed</div>}
                        </div>
                        <div style={{ marginBottom: 8, position: 'relative', width: '100%' }}>
                            <input type="email" placeholder="Email" value={requestEmail} onChange={e => {
                                setRequestEmail(e.target.value);
                                setEmailError(false);
                                setEmailFormatError(false);
                            }} style={{ padding: 8, borderRadius: 4, border: emailError || emailFormatError ? '2px solid red' : '1px solid #ccc', width: '100%', margin: '0 auto', display: 'block', boxSizing: 'border-box' }} required />
                            {emailError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>This field is required</div>}
                            {emailFormatError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>Invalid email format</div>}
                        </div>
                        <div style={{ marginBottom: 8, position: 'relative', width: '100%' }}>
                            <select value={requestLocation} onChange={e => { setRequestLocation(e.target.value); setLocationError(false); }} style={{ padding: 8, borderRadius: 4, border: locationError ? '2px solid red' : '1px solid #ccc', width: '100%', margin: '0 auto', display: 'block', boxSizing: 'border-box', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', height: 44, lineHeight: 'normal' }} required>
                                <option value="">Select Location</option>
                                {allLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                            {locationError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>This field is required</div>}
                        </div>
                        <div style={{ marginBottom: 8, position: 'relative', width: '100%' }}>
                            <select value={requestFlightType} onChange={e => { setRequestFlightType(e.target.value); setFlightTypeError(false); }} style={{ padding: 8, borderRadius: 4, border: flightTypeError ? '2px solid red' : '1px solid #ccc', width: '100%', margin: '0 auto', display: 'block', boxSizing: 'border-box', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', height: 44, lineHeight: 'normal' }} required>
                                <option value="">Select Flight Type</option>
                                <option value="Private Flight">Private Flight</option>
                                <option value="Shared Flight">Shared Flight</option>
                            </select>
                            {flightTypeError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>This field is required</div>}
                        </div>
                        <div style={{ marginBottom: 8, position: 'relative', width: '100%' }}>
                            <input type="date" value={requestDate} onChange={e => { setRequestDate(e.target.value); setDateError(false); }} style={{ padding: 8, borderRadius: 4, border: dateError ? '2px solid red' : '1px solid #ccc', width: '100%', margin: '0 auto', display: 'block', boxSizing: 'border-box' }} required />
                            {dateError && <div style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 2 }}>This field is required</div>}
                        </div>
                        {requestSuccess && <div style={{ color: 'green', textAlign: 'center' }}>{requestSuccess}</div>}
                        {requestError && <div style={{ color: 'red', textAlign: 'center' }}>{requestError}</div>}
                    </form>
                }
                submitButtonProps={{
                    disabled: !isFormValid,
                    onClick: handleShowAllErrors,
                    onSubmit: () => {
                        if (isFormValid) handleRequestSubmit();
                    }
                }}
            />
            <style>{`
                .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0px; }
                .weekday-label { text-align: center; font-weight: 600; color: #888; font-size: 15px; margin-bottom: 8px; }
                .day { width: 80px; height: 80px; min-width: 80px; max-width: 80px; min-height: 80px; max-height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 2px; margin-top: 2px; transition: box-shadow 0.2s; box-sizing: border-box; }
                .empty-day { background: none !important; border: none !important; box-shadow: none !important; }
                .day.selected { box-shadow: 0 0 0 2px #56C1FF; border: 2px solid #56C1FF; background: #61D836 !important; }
                .day.sold-out { background: #bbb !important; color: #fff !important; cursor: not-allowed !important; }
                .day.disabled { background: #ddd !important; color: #999 !important; cursor: not-allowed !important; }
                .day.pulse { animation: pulseAnim 1.2s infinite; }
                .available-day { background: #61D836 !important; }
                @keyframes pulseAnim { 0% { box-shadow: 0 0 0 0 #ff9800; } 70% { box-shadow: 0 0 0 8px rgba(255,152,0,0); } 100% { box-shadow: 0 0 0 0 rgba(255,152,0,0); } }
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
        </>
    );
};

export default LiveAvailabilitySection;
