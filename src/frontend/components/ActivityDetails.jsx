import React, { useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import HomeIcon from '@mui/icons-material/Home';
import BookingTabs from "./BookingTabs";

const ActivityDetails = ({ activity, onBack }) => {
    const [selectAmt, setSelectAmt] = useState("2");
    const handleQuantityChange = (quantity) => {
        console.log("Selected Quantity:", quantity);
    };

    const handleAmtChange = (event) => {
        setSelectAmt(event.target.value);
      };
    
      const options = [
        { value: "2", label: "Flight for 2", price: "£900.00", description: "Price for 2 passengers" },
        { value: "3", label: "Flight for 3", price: "£1,050.00", description: "Price for 3 passengers" },
        { value: "4", label: "Flight for 4", price: "£1,200.00", description: "Price for 4 passengers" },
        { value: "8", label: "Flight for 8", price: "£1,800.00", description: "Price for 8 passengers" },
      ];

    if (!activity) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="body1" component="div">
                    No activity selected. Please select an activity to view details.
                </Typography>
                <Button variant="contained" onClick={onBack}>
                    <HomeIcon />
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 1 }}>
            <div className="single-activity-wrap">
                <div className='back-icon-wrap' onClick={onBack} sx={{ mb: 2 }}>
                    <HomeIcon />
                </div>
                <Typography variant="h1" component="h1">
                    {activity.title}
                </Typography>
                <Typography variant="h3" component="h3">
                    {activity.subTitle}
                </Typography>
                <div className="activity-single-wrap">
                    <div className="single-left-activity">
                        <img
                            src={activity.Image}
                            alt={activity.title}
                            style={{ width: "100%", height: "auto", borderRadius: "8px", marginBottom: "20px" }}
                        />
                        <Typography variant="h2" component="h2">
                            Overview
                        </Typography>
                        <ul>
                            <li>Around 1 hour of flight time.</li>
                            <li>Free inflight photos and 3D flight track.</li>
                            <li>Complimentary drink.</li>
                            <li>Passenger safety briefing before take-off.</li>
                            <li>Complete flight and ground insurance.</li>
                            <li>24-month validity.</li>
                        </ul>
                        <Typography variant="body1" component="div">
                            £205 per person
                        </Typography>

                        <Typography variant="h2" component="h2">
                            Photo Gallery
                        </Typography>
                        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                            {[...Array(4)].map((_, index) => (
                                <img
                                    key={index}
                                    src={activity.Image} // Placeholder gallery images
                                    alt="Gallery"
                                    style={{ width: "20%", height: "auto", borderRadius: "8px" }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="single-right-activity">
                        <BookingTabs onQuantityChange={handleQuantityChange} selectAmt={selectAmt} handleAmtChange={handleAmtChange} options={options} />
                    </div>
                </div>
            </div>
        </Box>
    );
};

ActivityDetails.propTypes = {
    activity: PropTypes.object,
    onBack: PropTypes.func.isRequired,
};

export default ActivityDetails;
