import React, { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import Category1 from "../../assets/images/category1.jpeg";
import Category2 from "../../assets/images/category2.jpeg";
import Category3 from "../../assets/images/category3.jpg";
import Category4 from "../../assets/images/category4.jpg";
import ProCards from "../components/ProCards";
import ActivityDetails from "../components/ActivityDetails";
import PropTypes from  'prop-types';
import ActivityCalender from "../components/ActivityCalender";
import ByDateCalender from "../components/ByDateCalender";

// Accessibility props function
const a11yProps = (index) => {
    return {
        id: `simple-tab-${index}`,
        "aria-controls": `simple-tabpanel-${index}`,
    };
};

// CustomTabPanel component
const CustomTabPanel = ({ children, value, index, ...other }) => (
    <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
    >
        {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
    </div>
);

CustomTabPanel.propTypes = {
    children: PropTypes.node,
    value: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
};

const BookNow = () => {
    const [value, setValue] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [chooseDate, setChooseDate] = useState(null);

    const data = [
        {
            id: 1,
            title: "Shared Flights",
            subTitle: "Shared Balloon Flights",
            btnText: "Shop",
            Image: Category1,
        },
        {
            id: 2,
            title: "Private Experiences",
            subTitle: "Private Flights South West",
            btnText: "Shop",
            Image: Category2,
        },
        {
            id: 3,
            title: "Bristol Balloon Fiesta Flights",
            subTitle: "Fiesta Flights",
            btnText: "Shop",
            Image: Category3,
        },
        {
            id: 4,
            title: "Gift Cards",
            subTitle: "From £100",
            btnText: "Shop",
            Image: Category4,
        },
    ];
    const activities = [
        {
            categoryId: 1,
            title: "Somerset",
            subTitle: "Shared Balloon Flights",
            btnText: "Shop",
            Image: Category1,
        },
        {
            categoryId: 2,
            title: "Bath",
            subTitle: "Private Flights South West",
            btnText: "Shop",
            Image: Category2,
        },
        {
            categoryId: 3,
            title: "Bristol Balloon Fiesta Flights",
            subTitle: "Fiesta Flights",
            btnText: "Shop",
            Image: Category3,
        },
        {
            categoryId: 4,
            title: "Gift Cards",
            subTitle: "From £100",
            btnText: "Shop",
            Image: Category4,
        },
    ];

    // Handle tab change
    const handleChange = (event, newValue) => {
        setValue(newValue);
        if (newValue === 1) {
            setSelectedCategory(null);
        }
    };

    // Handle category click
    const handleCategoryClick = (categoryId) => {
        setSelectedCategory(categoryId); // Set selected category
        setValue(1); // Redirect to "Shop By Activity" tab
    };

    // Handle activity click
    const handleActivityClick = (activity) => {
        setSelectedActivity(activity); // Show activity details
    };

    const handleBack = () => {
        setSelectedActivity(null);
        setValue(1);
    };

    // Filter activities based on selected category
    const filteredActivities = selectedCategory
        ? activities.filter((activity) => activity.categoryId === selectedCategory)
        : activities;

    return (
        <div className="front-book-wrap">
            <Box sx={{ width: "100%" }}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                        <Tab label="Category" {...a11yProps(0)} />
                        <Tab label="Shop By Activity" {...a11yProps(1)} />
                        <Tab label="Shop By Date" {...a11yProps(2)} />
                    </Tabs>
                </Box>
                <CustomTabPanel value={value} index={0}>
                    <div className="category-wrap-card">
                        {data.map((item, index) => (
                            <div className="activity-card-wrap" key={index}>
                                <ProCards
                                    title={item.title}
                                    subTitle={item.subTitle}
                                    Image={item.Image}
                                    btnText={item.btnText}
                                    clickHandler={() => handleCategoryClick(item.id)}
                                />
                            </div>
                        ))}
                    </div>
                </CustomTabPanel>
                <CustomTabPanel value={value} index={1}>
                    {selectedActivity ? (
                        <ActivityDetails activity={selectedActivity} onBack={handleBack} />
                    ) : (
                        <div className="category-wrap-card">
                            {filteredActivities.map((activity, index) => (
                                <div className="activity-card-wrap" key={index}>
                                    <ProCards
                                        title={activity.title}
                                        subTitle={activity.subTitle}
                                        Image={activity.Image}
                                        btnText={activity.btnText}
                                        clickHandler={() => handleActivityClick(activity)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </CustomTabPanel>
                <CustomTabPanel value={value} index={2}>
                    <ByDateCalender selectedDate={chooseDate} setSelectedDate={setChooseDate} />
                </CustomTabPanel>
            </Box>
        </div>
    );
};

export default BookNow;
