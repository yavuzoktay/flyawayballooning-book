import React, { useState } from "react";

const Accordion = ({ title, children, id, activeAccordion, setActiveAccordion, className, onBeforeClose }) => {
    const isOpen = activeAccordion === id;

    const toggleAccordion = () => {
        if (isOpen) {
            // If a guard is provided, allow it to cancel closing by returning false
            if (typeof onBeforeClose === 'function') {
                const canClose = onBeforeClose();
                if (canClose === false) {
                    return; // Prevent closing and keep the panel open
                }
            }
            setActiveAccordion(null);
        } else {
            setActiveAccordion(id);
        }
    };

    // Check if this is the "What would you like to do?" section
    const isActivitySection = id === "activity";

    return (
        <div className={`accordion-section ${className || ""}`}>
            <button 
                className={`accordion ${isOpen ? "active" : ""} ${isActivitySection ? "activity-accordion" : ""}`} 
                onClick={toggleAccordion}
                style={isActivitySection ? { fontSize: '22px', fontWeight: '500' } : {}}
            >
                {title}
                <span className="accordion-icon">{isOpen ? "-" : "+"}</span>
            </button>
            <div 
                className={`panel ${isActivitySection ? "activity-panel" : ""}`}
                style={{ 
                    display: isOpen ? "block" : "none",
                    overflow: "visible", // Allow content to overflow if needed
                    height: "auto", // Ensure auto height
                    transition: "height 0.3s ease" // Smooth transition for height changes
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default Accordion;
