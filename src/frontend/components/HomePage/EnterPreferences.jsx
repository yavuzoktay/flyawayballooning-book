// EnterPreferences.js
import React from "react";
import Accordion from "../Common/Accordion";
import { BsInfoCircle } from "react-icons/bs";

const preferredLocation = [
    "Bath",
    "Taunton & South Somerset",
    "Exeter & Tiverton"
]

const preferedTime = [
    "Morning",
    "Afternoon & Evening"
]

const preferedDay = [
    "Weekend Only",
    "Weekday & Weekend"
];

const EnterPreferences = ({ isGiftVoucher, isRedeemVoucher, preference, setPreference, activeAccordion, setActiveAccordion, showEdit, setShowEdit }) => {
    const handlePreferChange = (e, category) => {
        const { value, checked } = e.target;

        setPreference((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [value]: checked, // Store each selection dynamically
            },
        }));
    };

    const headingStyle = { fontSize: '18px', fontWeight: '500', color: '#444444' };

    return (
        <Accordion 
            title="Select Preferences"
            id="preference" 
            activeAccordion={activeAccordion} 
            setActiveAccordion={setActiveAccordion} 
            className={`${isGiftVoucher ? 'disable-acc' : ""}`}
        >
            <div className="tab_box Profered-scroll Proferences_box-wrap">
                <div className="pro_head" style={{ position: 'relative', marginBottom: '4px', width: '100%' }}>
                    <div className="preferences-info-wrapper" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <label>Preferred Location</label>
                        <div className="info-icon-container">
                            <BsInfoCircle size={14} />
                            <div className="hover-text">
                                <p>Receive short notice flight notifications - This does not commit you to any day, time or location and does not necessarily mean that we will be in touch with you.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="Proferences_box">
                    <div className="Proferences_data">
                        <div className="add_check">
                            {preferredLocation.map((input, index) => (
                                <label className="chaque final-prefer-check" key={index}>
                                    <input
                                        type="checkbox"
                                        value={input}
                                        checked={preference.location[input] || false}
                                        onChange={(e) => handlePreferChange(e, "location")}
                                    />
                                    <span>{input}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pro_head" style={{ marginBottom: '16px' }}>
                        <label>Preferred Time</label>
                    </div>
                    <div className="Proferences_data">
                        {preferedTime.map((input, index) => (
                            <label className="chaque final-prefer-check" key={index}>
                                <input
                                    type="checkbox"
                                    value={input}
                                    checked={preference.time[input] || false}
                                    onChange={(e) => handlePreferChange(e, "time")}
                                />
                                <span>{input}</span>
                            </label>
                        ))}
                    </div>

                    <div className="pro_head" style={{ marginBottom: '16px' }}>
                        <label>Preferred Day</label>
                    </div>
                    <div className="Proferences_data">
                        {preferedDay.map((input, index) => (
                            <label className="chaque final-prefer-check" key={index}>
                                <input
                                    type="checkbox"
                                    value={input}
                                    checked={preference.day[input] || false}
                                    onChange={(e) => handlePreferChange(e, "day")}
                                />
                                <span>{input}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </Accordion>
    );
};

export default EnterPreferences;
