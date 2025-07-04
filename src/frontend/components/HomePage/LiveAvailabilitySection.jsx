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

    var final_pax_count = selectedActivity?.[0]?.seats;

    const today = new Date(); // Current date to compare
    const startDate = startOfWeek(startOfMonth(currentDate));
    const endDate = endOfWeek(endOfMonth(currentDate));
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

    const renderDays = () => {
        const days = [];
        let tempDate = new Date(startDate);
        while (tempDate <= endDate) {
            const dateCopy = new Date(tempDate);
            const isSameMonthAsCurrent = isSameMonth(dateCopy, currentDate);
            const isPastDate = isBefore(dateCopy, today);
            const isSelected = selectedDate && selectedDate.toDateString() === dateCopy.toDateString();
            const dateStr = format(dateCopy, 'yyyy-MM-dd');
            const isAvailable = availableDates.includes(dateStr);
            // const times = getTimesForDate(dateCopy); // Artık kullanılmıyor
            days.push(
                <div
                    key={dateCopy.toISOString()}
                    className={`day ${isSameMonthAsCurrent ? '' : ''} ${isPastDate || !isAvailable ? 'disabled' : 'available-day'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => (!isPastDate && isAvailable) && handleDateClick(dateCopy)}
                    style={{
                        opacity: isAvailable ? 1 : 0.5,
                        cursor: (!isPastDate && isAvailable) ? 'pointer' : 'not-allowed',
                        background: isAvailable ? (isSelected ? '#1976d2' : '#4caf50') : '',
                        color: isAvailable ? '#fff' : '#888',
                        borderRadius: 8,
                        margin: 2,
                        padding: 2,
                        minHeight: 48
                    }}
                >
                    <div>{format(dateCopy, 'd')}</div>
                    {/* Saatler kaldırıldı */}
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
                    <div className="header">
                        <div className='calender-prev calender-arrow' onClick={handlePrevMonth}><ArrowBackIosIcon /></div>
                        <h2>{format(currentDate, 'MMMM yyyy')}</h2>
                        <div className='calender-next calender-arrow' onClick={handleNextMonth}><ArrowForwardIosIcon /></div>
                    </div>
                    <div className="days">{renderDays()}</div>
                    {/* Saatler: sadece seçili günün açık saatleri */}
                    {selectedDate && (
                        <div style={{ marginTop: 24, marginBottom: 8 }}>
                            <div style={{ fontWeight: 500, marginBottom: 8 }}>Available Times for {format(selectedDate, 'MMMM d, yyyy')}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {getTimesForDate(selectedDate).length === 0 && <div style={{color:'#888'}}>No available times</div>}
                                {getTimesForDate(selectedDate).map(slot => {
                                    const isAvailable = slot.available > 0;
                                    return (
                                        <button
                                            key={slot.id}
                                            style={{
                                                background: isAvailable ? (selectedTime === slot.time ? '#1976d2' : '#2196f3') : '#888',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 8,
                                                padding: '12px 0',
                                                fontWeight: 600,
                                                fontSize: 16,
                                                marginBottom: 6,
                                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                                outline: selectedTime === slot.time ? '2px solid #1976d2' : 'none',
                                                opacity: isAvailable ? 1 : 0.5
                                            }}
                                            onClick={() => isAvailable && handleTimeClick(slot.time)}
                                            disabled={!isAvailable}
                                        >
                                            <span style={{ marginRight: 8 }}>🕒</span> {slot.time} <span style={{ marginLeft: 12 }}>{isAvailable ? `Available (${slot.available}/${slot.capacity})` : 'Full'}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {/* Tüm availabilities için tablo */}
                    {availabilities.length > 0 && (
                        <div style={{ marginTop: 32 }}>
                            <h4>Available Dates & Times</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ border: '1px solid #ccc', padding: 4 }}>Date</th>
                                        <th style={{ border: '1px solid #ccc', padding: 4 }}>Time</th>
                                        <th style={{ border: '1px solid #ccc', padding: 4 }}>Capacity</th>
                                        <th style={{ border: '1px solid #ccc', padding: 4 }}>Available</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {availabilities.map((a) => (
                                        <tr key={a.id} style={{ opacity: a.available > 0 ? 1 : 0.5 }}>
                                            <td style={{ border: '1px solid #ccc', padding: 4 }}>{a.date}</td>
                                            <td style={{ border: '1px solid #ccc', padding: 4 }}>{a.time}</td>
                                            <td style={{ border: '1px solid #ccc', padding: 4 }}>{a.capacity}</td>
                                            <td style={{ border: '1px solid #ccc', padding: 4 }}>{a.available}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
        </>
    );
};

export default LiveAvailabilitySection;
