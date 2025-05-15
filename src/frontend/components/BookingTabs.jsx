import { Box, Button, Checkbox, FormControlLabel, Paper, Radio, RadioGroup, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";
import ActivityCalender from "./ActivityCalender";
import QuantityInput from "./QuantityInput";
import AmtRadioCheck from "./AmtRadioCheck";

const TabPanel = ({ children, value, index }) => {
    return (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && (
                <Box sx={{ p: 0 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
};

const BookingTabs = ({ onQuantityChange, selectAmt, handleAmtChange, options }) => {
    const [value, setValue] = useState(0);
    const [laterDateChecked, setLaterDateChecked] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    const handleTabChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box>
            <Tabs value={value} onChange={handleTabChange} aria-label="Booking Tabs">
                <Tab label="Calendar" />
                <Tab label="Choose Date Later" />
            </Tabs>
            <TabPanel value={value} index={0}>
                <ActivityCalender selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                <div className="quantityt-amt-wrap">
                    <div className="amt-wrap">
                        <Typography>Shared Flight £205.00</Typography>
                        <span>£205 Per Person</span>
                    </div>
                    <div className="qty-input-wrap">
                        <QuantityInput onChange={onQuantityChange} />
                    </div>
                </div>
                <AmtRadioCheck selectAmt={selectAmt} handleAmtChange={handleAmtChange} options={options} />
                <div className="time-slot-wrap">
                    <Button variant="contained" sx={{ marginRight: "10px" }}>
                        7:00 AM - Available
                    </Button>
                    <Button variant="contained">3:30 PM - Available</Button>
                </div>
            </TabPanel>
            <TabPanel value={value} index={1}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={laterDateChecked}
                            onChange={(e) => setLaterDateChecked(e.target.checked)}
                        />
                    }
                    label="Choose Date Later"
                />
                <AmtRadioCheck selectAmt={selectAmt} handleAmtChange={handleAmtChange} options={options} />
            </TabPanel>
        </Box>
    );
};

export default BookingTabs;