import React, { useState } from 'react';
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

const ByDateCalender = ({ selectedDate, setSelectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date(); // Current date to compare
  const startDate = startOfWeek(startOfMonth(currentDate));
  const endDate = endOfWeek(endOfMonth(currentDate));

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date) => {
    if (!isBefore(date, today)) {
      setSelectedDate(date);
    }
  };

  const renderDays = () => {
    const days = [];
    let date = startDate;

    while (date <= endDate) {
      const isSameMonthAsCurrent = isSameMonth(date, currentDate);
      const isPastDate = isBefore(date, today); // Check if date is before today
      const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

      days.push(
        <div
          key={date}
          className={`day ${isSameMonthAsCurrent ? '' : ''} ${isPastDate ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => handleDateClick(date)}
        >
          <div>{format(date, 'd')}</div>
          {!isPastDate && <div className="activity">Shop 5 Activities</div>} {/* Show activities only for current or future dates */}
        </div>
      );
      date = addDays(date, 1);
    }

    return days;
  };

  console.log('selectedDate', selectedDate);
  

  return (
    <div className="calendar">
      <div className="header">
        <div className='calender-prev calender-arrow' onClick={handlePrevMonth}><ArrowBackIosIcon /></div>
        <h2>{format(currentDate, 'MMMM yyyy')}</h2>
        <div className='calender-next calender-arrow' onClick={handleNextMonth}><ArrowForwardIosIcon /></div>
      </div>
      <div className="days">{renderDays()}</div>
    </div>
  );
};

export default ByDateCalender;
