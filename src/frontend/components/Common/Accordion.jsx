import React, { useEffect, useRef, useState } from "react";

const PANEL_VERTICAL_PADDING = 24;
const PANEL_TRANSITION_MS = 180;

const Accordion = ({
  title,
  children,
  id,
  activeAccordion,
  setActiveAccordion,
  className,
  onBeforeClose,
  isDisabled = false,
}) => {
  const isOpen = activeAccordion === id;

  const toggleAccordion = () => {
    // Eğer accordion disabled ise hiçbir şey yapma
    if (isDisabled) {
      return;
    }

    if (isOpen) {
      // If a guard is provided, allow it to cancel closing by returning false
      if (typeof onBeforeClose === "function") {
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
  const panelContentRef = useRef(null);
  const animationFrameRef = useRef(null);
  const overflowUnlockTimerRef = useRef(null);
  const [panelMaxHeight, setPanelMaxHeight] = useState(
    isOpen ? "9999px" : "0px",
  );
  const [allowPanelOverflow, setAllowPanelOverflow] = useState(false);

  useEffect(() => {
    const clearPendingSync = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (overflowUnlockTimerRef.current) {
        clearTimeout(overflowUnlockTimerRef.current);
        overflowUnlockTimerRef.current = null;
      }
    };

    if (!panelContentRef.current) {
      clearPendingSync();
      return undefined;
    }

    const syncPanelHeight = () => {
      if (!panelContentRef.current) return;
      setPanelMaxHeight(
        `${panelContentRef.current.scrollHeight + PANEL_VERTICAL_PADDING}px`,
      );

      if (isPassengerInfoSection || !isOpen) {
        setAllowPanelOverflow(false);
        return;
      }

      setAllowPanelOverflow(false);
      overflowUnlockTimerRef.current = setTimeout(() => {
        setAllowPanelOverflow(true);
      }, PANEL_TRANSITION_MS + 40);
    };

    const schedulePanelSync = () => {
      clearPendingSync();
      animationFrameRef.current = requestAnimationFrame(() => {
        syncPanelHeight();
      });
    };

    if (isOpen) {
      schedulePanelSync();

      const resizeObserver =
        typeof ResizeObserver !== "undefined"
          ? new ResizeObserver(() => {
              if (!isOpen) return;
              schedulePanelSync();
            })
          : null;

      if (resizeObserver && panelContentRef.current) {
        resizeObserver.observe(panelContentRef.current);
      }

      const handleWindowResize = () => {
        schedulePanelSync();
      };

      window.addEventListener("resize", handleWindowResize);

      return () => {
        clearPendingSync();
        window.removeEventListener("resize", handleWindowResize);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }

    clearPendingSync();
    setAllowPanelOverflow(false);
    setPanelMaxHeight("0px");
    return undefined;
  }, [isOpen, children, isPassengerInfoSection]);

  return (
    <div
      id={id || undefined}
      data-accordion-id={id || undefined}
      className={`accordion-section ${className || ""}`}
      style={{
        ...(isDisabled && !isOpen
          ? {
              opacity: "0.5",
              pointerEvents: "none",
              cursor: "not-allowed",
            }
          : {}),
      }}
    >
      <button
        className={`accordion ${isOpen ? "active" : ""} ${isActivitySection ? "activity-accordion" : ""} ${isDisabled ? "disabled" : ""}`}
        onClick={toggleAccordion}
        style={{
          ...(isActivitySection ? { fontSize: "22px", fontWeight: "500" } : {}),
          ...(isDisabled
            ? {
                cursor: "not-allowed",
              }
            : {}),
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
          display: "block",
          overflow: isOpen
            ? isPassengerInfoSection
              ? "hidden"
              : allowPanelOverflow
                ? "visible"
                : "hidden"
            : "hidden",
          maxHeight: panelMaxHeight,
          padding: isOpen ? "10px 5px 20px 5px" : "0 5px",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateY(0)" : "translateY(-2px)",
          transition: `max-height ${PANEL_TRANSITION_MS}ms ease, opacity 140ms ease, transform 140ms ease`,
          willChange: "max-height, opacity, transform",
          // Ensure panel content is always clickable when open, even if accordion is disabled
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        <div ref={panelContentRef} className="accordion-panel-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Accordion;
