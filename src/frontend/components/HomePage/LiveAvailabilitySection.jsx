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
import axios from 'axios';

const LiveAvailabilitySection = ({ isGiftVoucher, isFlightVoucher, selectedDate, setSelectedDate, activeAccordion, setActiveAccordion, selectedActivity, availableSeats, chooseLocation, selectedTime, setSelectedTime, availabilities }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookedSeat, setBookedSeat] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ampm, setAmpm] = useState('PM');

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
            const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), today.getHours(), today.getMinutes(), today.getSeconds()); // Maintain the current time
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
            setSelectedDate(newDate);
        }
    };

    if (chooseLocation === '') {
        setIsModalOpen(true);
    }

    // Yeni: availabilities [{id, date, time, capacity, available, ...}] düz listede geliyor
    // Calendar için: hangi günlerde en az 1 açık slot var?
    const availableDates = Array.from(new Set(availabilities.map(a => {
        // DD/MM/YYYY -> YYYY-MM-DD
        if (a.date && a.date.includes('/')) {
            const [day, month, year] = a.date.split('/');
            return `${year}-${month}-${day}`;
        }
        return a.date;
    })));
    const getTimesForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        // availabilities'deki date'i de aynı şekilde dönüştür
        return availabilities.filter(a => {
            if (a.date && a.date.includes('/')) {
                const [day, month, year] = a.date.split('/');
                return `${year}-${month}-${day}` === dateStr;
            }
            return a.date === dateStr;
        });
    };

    // Filter availabilities by AM/PM
    const filteredAvailabilities = availabilities.filter(a => {
        if (!a.time) return true;
        const hour = parseInt(a.time.split(':')[0], 10);
        return ampm === 'AM' ? hour < 12 : hour >= 12;
    });
    // Günlük toplam available hesapla
    const getSpacesForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const slots = filteredAvailabilities.filter(a => {
            if (a.date && a.date.includes('/')) {
                const [day, month, year] = a.date.split('/');
                return `${year}-${month}-${day}` === dateStr;
            }
            return a.date === dateStr;
        });
        const total = slots.reduce((sum, s) => sum + (s.available || 0), 0);
        return { total, soldOut: slots.length > 0 && total === 0, slots };
    };

    const renderDays = () => {
        const days = [];
        let tempDate = new Date(startDate);
        while (tempDate <= endDate) {
            const dateCopy = new Date(tempDate);
            const isPastDate = isBefore(dateCopy, today);
            const isSelected = selectedDate && selectedDate.toDateString() === dateCopy.toDateString();
            const { total, soldOut, slots } = getSpacesForDate(dateCopy);
            const isAvailable = total > 0;
            const pulse = isAvailable && total <= 4 && total > 0;
            days.push(
                <div
                    key={dateCopy.toISOString()}
                    className={`day ${isPastDate || !isAvailable ? 'disabled' : ''} ${isAvailable ? 'available-day' : ''} ${isSelected ? 'selected' : ''} ${soldOut ? 'sold-out' : ''} ${pulse ? 'pulse' : ''}`}
                    onClick={() => (!isPastDate && isAvailable) && handleDateClick(dateCopy)}
                    style={{
                        opacity: isAvailable ? 1 : 0.5,
                        cursor: (!isPastDate && isAvailable) ? 'pointer' : 'not-allowed',
                        background: isSelected ? '#56C1FF' : soldOut ? '#bbb' : isAvailable ? '#61D836' : '',
                        color: isAvailable ? '#fff' : '#888',
                        borderRadius: 8,
                        margin: 2,
                        padding: 2,
                        minHeight: 48,
                        position: 'relative',
                        border: isSelected ? '2px solid #56C1FF' : 'none',
                        boxShadow: isSelected ? '0 0 0 2px #56C1FF' : 'none',
                        animation: pulse ? 'pulseAnim 1.2s infinite' : 'none'
                    }}
                >
                    <div>{format(dateCopy, 'd')}</div>
                    {isAvailable && <div style={{ fontSize: 12, marginTop: 2 }}>{soldOut ? 'Sold Out' : `${total} Space${total > 1 ? 's' : ''}`}</div>}
                </div>
            );
            tempDate = addDays(tempDate, 1);
        }
        return days;
    };

    return (
        <>
            <Accordion title="Live Availability" id="live-availability" activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} className={`${isFlightVoucher || isGiftVoucher ? 'disable-acc' : ""}`}>
                <div className="calendar">
                    <div className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%' }}>
                        <div style={{ position: 'absolute', left: 0, display: 'flex', gap: 8 }}>
                            <button className={`ampm-btn ${ampm === 'AM' ? 'active' : ''}`} onClick={() => setAmpm('AM')}>AM</button>
                            <button className={`ampm-btn ${ampm === 'PM' ? 'active' : ''}`} onClick={() => setAmpm('PM')}>PM</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className='calender-prev calender-arrow' onClick={handlePrevMonth}><ArrowBackIosIcon /></div>
                            <h2 style={{ margin: '0 24px', fontWeight: 400, color: '#222', fontSize: 32, letterSpacing: 1 }}>{format(currentDate, 'MMMM yyyy')}</h2>
                            <div className='calender-next calender-arrow' onClick={handleNextMonth}><ArrowForwardIosIcon /></div>
                        </div>
                    </div>
                    <div className="days-grid">
                        <div className="weekdays-row">
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <div key={d} className="weekday-label">{d}</div>)}
                        </div>
                        <div className="days">{renderDays()}</div>
                    </div>
                    {/* Saatler: sadece seçili günün açık saatleri ve seçili AM/PM */}
                    {selectedDate && (
                        <div style={{ marginTop: 24, marginBottom: 8 }}>
                            <div style={{ fontWeight: 500, marginBottom: 8 }}>Available Times for {format(selectedDate, 'MMMM d, yyyy')} ({ampm})</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {getSpacesForDate(selectedDate).slots.filter(slot => {
                                    if (!slot.time) return true;
                                    const hour = parseInt(slot.time.split(':')[0], 10);
                                    return ampm === 'AM' ? hour < 12 : hour >= 12;
                                }).length === 0 && <div style={{color:'#888'}}>No available times</div>}
                                {getSpacesForDate(selectedDate).slots.filter(slot => {
                                    if (!slot.time) return true;
                                    const hour = parseInt(slot.time.split(':')[0], 10);
                                    return ampm === 'AM' ? hour < 12 : hour >= 12;
                                }).map(slot => {
                                    const isAvailable = slot.available > 0;
                                    return (
                                        <button
                                            key={slot.id}
                                            style={{
                                                background: '#56C1FF',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 16,
                                                padding: '8px 0',
                                                fontWeight: 700,
                                                fontSize: 22,
                                                marginBottom: 12,
                                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                                outline: selectedTime === slot.time ? '2px solid #56C1FF' : 'none',
                                                opacity: isAvailable ? 1 : 0.5,
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 18,
                                                letterSpacing: 1
                                            }}
                                            onClick={() => isAvailable && handleTimeClick(slot.time)}
                                            disabled={!isAvailable}
                                        >
                                            <span style={{ marginRight: 8, fontSize: 24 }}>🕒</span>
                                            <span style={{ fontWeight: 700 }}>{slot.time}</span>
                                            <span style={{ marginLeft: 18, fontWeight: 700 }}>Available ({slot.available}/{slot.capacity})</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {/* Seçili gün ve slot bilgisi */}
                    <div style={{ marginTop: 24, fontSize: 15, color: '#222', background: '#f7f7f7', borderRadius: 8, padding: 12 }}>
                        <div>Currently viewing: <b>{chooseLocation || 'Location Selected'}</b>, <b>{selectedActivity?.[0]?.type || 'Shared'}</b>, <b>{ampm}</b></div>
                        {selectedDate && selectedTime && (
                            <div>Current Selection: <b>{format(selectedDate, 'd/M/yyyy')}</b>, Meeting Time: <b>{selectedTime}</b></div>
                        )}
                    </div>
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
            <style>{`
                .ampm-btn { padding: 6px 18px; border-radius: 6px; border: none; background: #eee; color: #222; font-weight: 600; font-size: 16px; margin-right: 4px; cursor: pointer; }
                .ampm-btn.active { background: #56C1FF; color: #fff; }
                .days-grid { margin-top: 12px; }
                .weekdays-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
                .weekday-label { flex: 1; text-align: center; font-weight: 600; color: #888; font-size: 15px; }
                .days { display: flex; flex-wrap: wrap; }
                .day { width: 13.5%; min-width: 44px; min-height: 54px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 4px; transition: box-shadow 0.2s; }
                .day.selected { box-shadow: 0 0 0 2px #56C1FF; border: 2px solid #56C1FF; background: #56C1FF !important; }
                .day.sold-out { background: #bbb !important; color: #fff !important; cursor: not-allowed !important; }
                .day.pulse { animation: pulseAnim 1.2s infinite; }
                .available-day { background: #61D836 !important; }
                @keyframes pulseAnim { 0% { box-shadow: 0 0 0 0 #ff9800; } 70% { box-shadow: 0 0 0 8px rgba(255,152,0,0); } 100% { box-shadow: 0 0 0 0 rgba(255,152,0,0); } }
            `}</style>
        </>
    );
};

export default LiveAvailabilitySection;
