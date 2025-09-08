import React, { useState, useEffect } from 'react';
import '../../../assets/css/frontend/booking-header.css';
import LOGO from '../../../assets/images/FAB_Logo_DarkBlue.png';

/**
 * BookingHeader component to display selected location, date, and countdown timer
 * Timer starts from 5 minutes when both location and date are selected
 */
const BookingHeader = ({ location, selectedDate, selectedTime, countdownSeconds, onTimeout }) => {
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Format time to display with leading zeros
  const formatTime = (time) => {
    return time < 10 ? `0${time}` : time;
  };

  // Format the date for display
  const formatDate = (dateString, timeString) => {
    if (!dateString) return '';

    console.log('formatDate called with:', { dateString, timeString });

    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayOfWeek = days[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = months[date.getMonth()];
    
    // Use the selectedTime prop for accurate time display
    let formattedTime = '';
    if (timeString) {
      console.log('Processing timeString:', timeString);
      // Parse the time string (e.g., "17:00:00" or "17:00")
      const timeParts = timeString.split(':');
      console.log('Time parts:', timeParts);
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        
        console.log('Parsed hours and minutes:', { hours, minutes });
        
        // Format time to 12-hour format with AM/PM
        const formattedHours = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        
        formattedTime = `${formattedHours}:${formattedMinutes} ${ampm}`;
        console.log('Formatted time from timeString:', formattedTime);
      }
    }
    
    // Fallback to date object time if timeString is not available
    if (!formattedTime) {
      console.log('Using fallback time from date object');
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const formattedHours = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      formattedTime = `${formattedHours}:${formattedMinutes} ${ampm}`;
      console.log('Fallback formatted time:', formattedTime);
    }

    const result = `${dayOfWeek}, ${month} ${dayOfMonth}${getDaySuffix(dayOfMonth)} - ${formattedTime}`;
    console.log('Final formatted result:', result);
    return result;
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
    return "timer-value normal";
  };

  // Set up the countdown timer using countdownSeconds from props
  useEffect(() => {
    if (countdownSeconds !== null && countdownSeconds !== undefined) {
      const mins = Math.floor(countdownSeconds / 60);
      const secs = countdownSeconds % 60;
      setMinutes(mins);
      setSeconds(secs);
      setTimerActive(true);
    } else {
      setTimerActive(false);
      setMinutes(5);
      setSeconds(0);
    }
  }, [countdownSeconds]);

  // Debug logging
  console.log('BookingHeader props:', { location, selectedDate, selectedTime, countdownSeconds });
  
  // If no location or date is selected, don't render the header
  if (!location || !selectedDate || !selectedTime) {
    return null;
  }

  // Ensure location has a name property, otherwise use a fallback
  const locationName = location?.name || (typeof location === 'string' ? location : 'Selected Location');

  return (
    <div className="booking-header-outer-center" style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative', minWidth: '400px' }}>
      <div className="booking-header-content" style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
        <div className="booking-header-location-display">
          <div className="booking-header-location">{locationName}</div>
        </div>
        {!isMobile && (
          <div className="booking-header-center">
            <div className="booking-header-date">{formatDate(selectedDate, selectedTime)}</div>
          </div>
        )}
        {!isMobile && (
          <div className="booking-header-timer">
            <span className="timer-label">Time Remaining:</span>
            <span className={getTimerClass()}>{`${formatTime(minutes)}:${formatTime(seconds)}`}</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default BookingHeader; 