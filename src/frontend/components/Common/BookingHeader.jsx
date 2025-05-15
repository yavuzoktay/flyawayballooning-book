import React, { useState, useEffect } from 'react';
import '../../../assets/css/frontend/booking-header.css';
import LOGO from '../../../assets/images/FAB_Logo_DarkBlue.png';

/**
 * BookingHeader component to display selected location, date, and countdown timer
 * Timer starts from 10 minutes when both location and date are selected
 */
const BookingHeader = ({ location, selectedDate }) => {
  const [minutes, setMinutes] = useState(10);
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Format time to display with leading zeros
  const formatTime = (time) => {
    return time < 10 ? `0${time}` : time;
  };

  // Format the date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayOfWeek = days[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = months[date.getMonth()];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Format time to 12-hour format with AM/PM
    const formattedHours = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${dayOfWeek}, ${month} ${dayOfMonth}${getDaySuffix(dayOfMonth)} - ${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  // Get the correct suffix for the day (1st, 2nd, 3rd, etc.)
  const getDaySuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Get the class name for the timer based on the time left
  const getTimerClass = () => {
    if (minutes < 2) return "timer-value critical";
    if (minutes < 5) return "timer-value warning";
    return "timer-value";
  };

  // Set up the countdown timer
  useEffect(() => {
    // Only start timer when both location and date are selected
    if (location && selectedDate && !timerActive) {
      setTimerActive(true);
      setMinutes(10);
      setSeconds(0);
    }

    // If timer is active, start countdown
    if (timerActive) {
      const interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          // Timer has reached 0:00
          clearInterval(interval);
          // Handle timer completion (e.g., redirect, show message)
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [location, selectedDate, minutes, seconds, timerActive]);

  // If no location or date is selected, don't render the header
  if (!location || !selectedDate) {
    return null;
  }

  // Ensure location has a name property, otherwise use a fallback
  const locationName = location?.name || (typeof location === 'string' ? location : 'Selected Location');

  return (
    <div className="booking-header-container">
      <div className="booking-header-content">
        <div className="booking-header-location-display">
          <div className="booking-header-location">{locationName}</div>
        </div>
        <div className="booking-header-center">
          <div className="booking-header-date">{formatDate(selectedDate)}</div>
        </div>
        <div className="booking-header-timer">
          <span className="timer-label">Time Remaining:</span>
          <span className={getTimerClass()}>{`${formatTime(minutes)}:${formatTime(seconds)}`}</span>
        </div>
      </div>
    </div>
  );
};

export default BookingHeader; 