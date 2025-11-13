import React, { useState } from "react";

const Accordion = ({ title, children, id, activeAccordion, setActiveAccordion, className, onBeforeClose, isDisabled = false }) => {
    const isOpen = activeAccordion === id;

    const toggleAccordion = () => {
        // Eğer accordion disabled ise hiçbir şey yapma
        if (isDisabled) {
            return;
        }
        
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

    // Check if this is the Passenger Information section - needs overflow control
    const isPassengerInfoSection = id === "passenger-info";

    return (
        <div 
            id={id || undefined}
            data-accordion-id={id || undefined}
            className={`accordion-section ${className || ""}`}
            style={{
                ...(isDisabled ? {
                    opacity: '0.5',
                    pointerEvents: 'none',
                    cursor: 'not-allowed'
                } : {})
            }}
        >
            <button 
                className={`accordion ${isOpen ? "active" : ""} ${isActivitySection ? "activity-accordion" : ""} ${isDisabled ? "disabled" : ""}`} 
                onClick={toggleAccordion}
                style={{
                    ...(isActivitySection ? { fontSize: '22px', fontWeight: '500' } : {}),
                    ...(isDisabled ? { 
                        cursor: 'not-allowed'
                    } : {})
                }}
                disabled={isDisabled}
            >
                {title}
                <span className="accordion-icon">{isOpen ? "-" : "+"}</span>
            </button>
            <div 
                id={id ? `${id}-panel` : undefined}
                data-accordion-panel-id={id || undefined}
                className={`panel ${isActivitySection ? "activity-panel" : ""}`}
                style={{ 
                    display: isOpen ? "block" : "none",
                    overflow: isPassengerInfoSection ? "hidden" : "visible", // Passenger Info: contain overflow, others: visible
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
