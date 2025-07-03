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

export function validatePreferences(preference) {
    return {
        location: !Object.values(preference.location || {}).some(Boolean),
        time: !Object.values(preference.time || {}).some(Boolean),
        day: !Object.values(preference.day || {}).some(Boolean),
    };
}

const EnterPreferences = ({ isGiftVoucher, isRedeemVoucher, preference, setPreference, activeAccordion, setActiveAccordion, showEdit, setShowEdit, errors = {} }) => {
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
                    <div className="Proferences_data" style={errors.location ? { border: '1.5px solid red', borderRadius: 6, padding: 4 } : {}}>
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
                        {errors.location && <span style={{ color: 'red', fontSize: 12 }}>Select at least one location</span>}
                    </div>

                    <div className="pro_head" style={{ marginBottom: '16px' }}>
                        <label>Preferred Time</label>
                    </div>
                    <div className="Proferences_data" style={errors.time ? { border: '1.5px solid red', borderRadius: 6, padding: 4 } : {}}>
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
                        {errors.time && <span style={{ color: 'red', fontSize: 12 }}>Select at least one time</span>}
                    </div>

                    <div className="pro_head" style={{ marginBottom: '16px' }}>
                        <label>Preferred Day</label>
                    </div>
                    <div className="Proferences_data" style={errors.day ? { border: '1.5px solid red', borderRadius: 6, padding: 4 } : {}}>
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
                        {errors.day && <span style={{ color: 'red', fontSize: 12 }}>Select at least one day</span>}
                    </div>
                </div>
            </div>
        </Accordion>
    );
};

export default EnterPreferences;
