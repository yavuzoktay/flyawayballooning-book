import React, { useEffect, useRef, useState } from "react";

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
    const panelRef = useRef(null);
    const [panelMaxHeight, setPanelMaxHeight] = useState(isOpen ? '9999px' : '0px');

    useEffect(() => {
        if (!panelRef.current) return;
        if (isOpen) {
            const nextHeight = `${panelRef.current.scrollHeight + 24}px`;
            setPanelMaxHeight(nextHeight);
            const syncHeight = () => {
                if (panelRef.current) {
                    setPanelMaxHeight(`${panelRef.current.scrollHeight + 24}px`);
                }
            };
            window.addEventListener('resize', syncHeight);
            return () => window.removeEventListener('resize', syncHeight);
        }
        setPanelMaxHeight('0px');
    }, [isOpen, children]);

    return (
        <div 
            id={id || undefined}
            data-accordion-id={id || undefined}
            className={`accordion-section ${className || ""}`}
            style={{
                ...(isDisabled && !isOpen ? {
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
                ref={panelRef}
                id={id ? `${id}-panel` : undefined}
                data-accordion-panel-id={id || undefined}
                className={`panel ${isActivitySection ? "activity-panel" : ""}`}
                style={{ 
                    display: 'block',
                    overflow: isPassengerInfoSection ? "hidden" : "visible", // Passenger Info: contain overflow, others: visible
                    maxHeight: panelMaxHeight,
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
                    transition: "max-height 0.35s ease, opacity 0.2s ease, transform 0.25s ease",
                    // Ensure panel content is always clickable when open, even if accordion is disabled
                    pointerEvents: isOpen ? 'auto' : 'none'
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default Accordion;
