import { LocalizationProvider, StaticDatePicker } from "@mui/x-date-pickers";
import React from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from 'dayjs';




const ActivityCalender = ({ selectedDate, setSelectedDate }) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <StaticDatePicker
                displayStaticWrapperAs="desktop"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                minDate={dayjs()} // Disable past dates
                disablePast // Another way to disable past dates
                renderInput={(params) => <></>} // Removes the default input
            />
        </LocalizationProvider>
    );
};

export default ActivityCalender;
