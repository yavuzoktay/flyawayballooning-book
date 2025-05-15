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

const LiveAvailabilitySection = ({ isGiftVoucher, isFlightVoucher, selectedDate, setSelectedDate, activeAccordion, setActiveAccordion, selectedActivity, availableSeats, chooseLocation }) => {
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

    if (chooseLocation === '') {
        setIsModalOpen(true);
    }


    useEffect(() => {
    }, [selectedDate]);

    const renderDays = () => {
        const days = [];
        let tempDate = new Date(startDate); // Ensure a fresh copy

        while (tempDate <= endDate) {
            const dateCopy = new Date(tempDate); // Create a new date instance
            const isSameMonthAsCurrent = isSameMonth(dateCopy, currentDate);
            const isPastDate = isBefore(dateCopy, today);
            const isSelected = selectedDate && selectedDate.toDateString() === dateCopy.toDateString();

            // Calculate available seats for this specific date
            let bookedSeatsForDay = availableSeats
                .filter(seat => seat.flight_date === format(dateCopy, 'dd-MM-yyyy'))
                .reduce((total, item) => total + parseInt(item.pax), 0);

            let availableSeatsCount = final_pax_count - bookedSeatsForDay;

            days.push(
                <div
                    key={dateCopy.toISOString()} // Unique key for React
                    className={`day ${isSameMonthAsCurrent ? '' : ''} ${isPastDate ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleDateClick(dateCopy)} // Ensure passing a new Date object
                >
                    <div>{format(dateCopy, 'd')}</div>
                    {!isPastDate && <div className="activity">{availableSeatsCount > 0 ? `${availableSeatsCount} Spaces` : 'Full'}</div>}
                </div>
            );

            tempDate = addDays(tempDate, 1); // Move to the next date safely
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
