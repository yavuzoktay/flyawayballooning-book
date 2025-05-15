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
            className={`${isRedeemVoucher || isGiftVoucher ? 'disable-acc' : ""}`}
        >
            <div className="tab_box Profered-scroll Proferences_box-wrap">
                <div className="pro_head" style={{ position: 'relative', marginBottom: '4px', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <label>Preferred Location</label>
                        <div 
                            className="info-icon-container"
                            style={{ position: 'relative', zIndex: 1000, marginLeft: 'auto' }}
                            onMouseOver={(e) => {
                                const tooltip = e.currentTarget.querySelector('.preferences-info-tooltip');
                                if (tooltip) tooltip.style.visibility = 'visible';
                                if (tooltip) tooltip.style.opacity = '1';
                            }}
                            onMouseOut={(e) => {
                                const tooltip = e.currentTarget.querySelector('.preferences-info-tooltip');
                                if (tooltip) tooltip.style.visibility = 'hidden';
                                if (tooltip) tooltip.style.opacity = '0';
                            }}
                        >
                            <BsInfoCircle size={20} color="#000000" />
                            <div 
                                className="preferences-info-tooltip" 
                                style={{ 
                                    position: 'absolute',
                                    visibility: 'hidden',
                                    opacity: 0,
                                    width: '320px',
                                    background: '#333',
                                    color: '#fff',
                                    textAlign: 'center',
                                    borderRadius: '6px',
                                    padding: '10px',
                                    zIndex: 1001,
                                    top: '30px',
                                    right: '-20px',
                                    transition: 'opacity 0.3s, visibility 0.3s',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
                                }}
                            >
                                Receive short notice flight notifications - This does not commit you to any day, time or location and does not necessarily mean that we will be in touch with you.
                                <div style={{
                                    content: '',
                                    position: 'absolute',
                                    top: '-10px',
                                    right: '25px',
                                    borderWidth: '5px',
                                    borderStyle: 'solid',
                                    borderColor: 'transparent transparent #333 transparent'
                                }}></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="Proferences_box">
                    <div className="Proferences_data">
                        <div className="add_check">
                            {preferredLocation.map((input, index) => (
                                <label className="row-1 bod-area chaque final-prefer-check" key={index}>
                                    <input
                                        type="checkbox"
                                        value={input}
                                        checked={preference.location[input] || false}
                                        onChange={(e) => handlePreferChange(e, "location")} // Pass category
                                    />
                                    {input}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pro_head" style={{ marginBottom: '16px' }}>
                        <label>Preferred Time</label>
                    </div>
                    <div className="Proferences_data">
                        {preferedTime.map((input, index) => (
                            <label className="row-1 bod-area chaque final-prefer-check" key={index}>
                                <input
                                    type="checkbox"
                                    value={input}
                                    checked={preference.time[input] || false}
                                    onChange={(e) => handlePreferChange(e, "time")} // Pass category
                                />
                                {input}
                            </label>
                        ))}
                    </div>

                    <div className="pro_head" style={{ marginBottom: '16px' }}>
                        <label>Preferred Day</label>
                    </div>
                    <div className="Proferences_data">
                        {preferedDay.map((input, index) => (
                            <label className="row-1 bod-area chaque final-prefer-check" key={index}>
                                <input
                                    type="checkbox"
                                    value={input}
                                    checked={preference.day[input] || false}
                                    onChange={(e) => handlePreferChange(e, "day")} // Pass category
                                />
                                {input}
                            </label>
                        ))}
                    </div>
                    
                    <div className="Proferences_data" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <label className="row-1 bod-area chaque final-prefer-check">
                            <input
                                type="checkbox"
                                value="Don't enter preferences"
                                checked={preference.noPreferences || false}
                                onChange={(e) => {
                                    const { checked } = e.target;
                                    setPreference((prev) => ({
                                        ...prev,
                                        noPreferences: checked
                                    }));
                                }}
                            />
                            Don't enter preferences
                        </label>
                    </div>
                </div>
            </div>
        </Accordion>
    );
};

export default EnterPreferences;
