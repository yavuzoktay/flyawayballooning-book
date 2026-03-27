import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../HomePage/RedeemVoucher.css";
import RedeemVoucherCard from "./RedeemVoucherCard";
import { BsInfoCircle } from 'react-icons/bs';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import config from '../../../config';
import { trackFunnelStart, activityToFunnelType } from '../../../utils/googleAdsTracking';

const ChooseActivityCard = ({ activitySelect, setActivitySelect, onVoucherSubmit, voucherStatus, voucherCode, voucherData, onValidate, onSectionCompletion, allowedActivities = null }) => {
    const API_BASE_URL = config.API_BASE_URL;
    const [isFlipped, setIsFlipped] = useState(false);
    const [localVoucherCode, setLocalVoucherCode] = useState("");
    const [voucherTypes, setVoucherTypes] = useState([]);
    const [voucherTypesLoading, setVoucherTypesLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
    const cardBackRef = useRef(null);
    
    // Mobile tooltip state for info icons
    const [activeMobileTooltip, setActiveMobileTooltip] = useState(null);
    
    // Notification state for flight type selection
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const mobileActivityCardHeight = '120px';
    const desktopActivityCardHeight = '220px';
    const activityCardHeight = isMobile ? mobileActivityCardHeight : desktopActivityCardHeight;

    // Handle window resize for responsive design
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            console.log('ChooseActivityCard resize:', window.innerWidth, 'isMobile:', mobile);
            setIsMobile(mobile);
        };

        // Set initial state
        handleResize();
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Add a global hook class for Android-specific mobile tweaks
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        if (!root) return;
        if (isAndroid) root.classList.add('is-android');
        return () => {
            if (isAndroid) root.classList.remove('is-android');
        };
    }, [isAndroid]);

    // When leaving mobile view, close any active tooltip
    useEffect(() => {
        if (!isMobile && activeMobileTooltip) {
            setActiveMobileTooltip(null);
        }
    }, [isMobile, activeMobileTooltip]);

    // Close mobile tooltip when tapping outside
    useEffect(() => {
        if (!activeMobileTooltip) return;

        const handleOutside = () => setActiveMobileTooltip(null);

        window.addEventListener('touchstart', handleOutside);
        window.addEventListener('mousedown', handleOutside);

        return () => {
            window.removeEventListener('touchstart', handleOutside);
            window.removeEventListener('mousedown', handleOutside);
        };
    }, [activeMobileTooltip]);


    // Fetch voucher types from API
    useEffect(() => {
        const fetchVoucherTypes = async () => {
            try {
                setVoucherTypesLoading(true);
                const response = await fetch(`${API_BASE_URL}/api/voucher-types`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setVoucherTypes(data.data);
                    }
                }
            } catch (error) {
                console.error('Error fetching voucher types:', error);
            } finally {
                setVoucherTypesLoading(false);
            }
        };

        fetchVoucherTypes();
    }, []);

    // Reset the flipped state when voucher status changes
    useEffect(() => {
        if (voucherStatus === "valid") {
            // Wait a bit to show the success message before flipping back
            setTimeout(() => {
                setIsFlipped(false);
            }, 2000);
        } else if (voucherStatus === "invalid") {
            // Keep the card flipped for invalid vouchers so user can see the error
            // The card will flip back when user clicks on the back
        }
    }, [voucherStatus]);

    // Update localVoucherCode when voucherCode prop changes
    useEffect(() => {
        if (voucherCode) {
            setLocalVoucherCode(voucherCode);
        }
    }, [voucherCode]);

    // When activity changes to "Redeem Voucher", flip to show the voucher input
    useEffect(() => {
        if (activitySelect === "Redeem Voucher") {
            setIsFlipped(true);
        } else {
            setIsFlipped(false);
        }
    }, [activitySelect]);

    const selectActivityData = [
        { value: 0, label: "Book Flight", displayLabel: "Book Flight Date", subText: "" },
        { value: 1, label: "Flight Voucher", displayLabel: "Buy Flight Voucher", subText: "" },
        { value: 3, label: "Buy Gift", displayLabel: "Buy Gift Voucher", subText: "" },
        { value: 2, label: "Redeem Voucher", subText: "" }
    ];
    const visibleActivityCards = Array.isArray(allowedActivities) && allowedActivities.length > 0
        ? selectActivityData.filter((item) => allowedActivities.includes(item.label))
        : selectActivityData;

    const getTooltipContent = (label) => {
        switch (label) {
            case 'Book Flight':
                return 'See live availability and secure your flight date and time.';
            case 'Flight Voucher':
                return 'Buy now and choose your flight date, time and location later.';
            case 'Buy Gift':
                return 'Gift the experience - they’ll choose when and where to fly.';
            default:
                return 'Redeem your code';
        }
    };

    const handleActivitySelect = (label) => {
        // Always update the activity selection
        setActivitySelect(label);
        
        // Google Ads: GA_Funnel_Start (Stage 1) - only for booking/gift/voucher paths
        const funnelType = activityToFunnelType(label);
        if (funnelType) {
            trackFunnelStart(funnelType);
        }
        
        // Show notification for flight type selection
        setNotificationMessage(`${label} Selected`);
        setShowNotification(true);
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
            setShowNotification(false);
        }, 3000);
        
        // Do NOT trigger onSectionCompletion here.
        // Parent Index.jsx listens to activitySelect change and
        // resets flow + opens the first section for the new flight type.
        // The parent's useEffect will reset all progress and mark 'activity' as completed.
        
        // If Redeem Voucher is clicked, always ensure it's flipped
        if (label === "Redeem Voucher") {
            setIsFlipped(true);
        }
    };

    const handleVoucherSubmit = (code) => {
        // Kodu sakla
        setLocalVoucherCode(code);
        
        // Kodu üst bileşene gönder (direkt string olarak)
        if (onVoucherSubmit) {
            onVoucherSubmit(code); // Direkt kodu string olarak gönderiyoruz
        }
        
        // Kart yüzünü çevir
        setTimeout(() => {
            setIsFlipped(false);
        }, 300);
    };

    // Handle clicks on the blue card back
    const handleCardBackClick = (e) => {
        // Only handle direct background clicks, not clicks on children
        if (e.target === cardBackRef.current) {
            setIsFlipped(false);
        }
    };

    // Görüntülenecek etiket metnini belirle
    const getVoucherDisplayText = () => {
        if (localVoucherCode) {
            return `Voucher Code: ${localVoucherCode}`;
        }
        return "Redeem Voucher";
    };

    // Özel CSS stillerini tanımla
    const checkStyle = {
        position: 'relative',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: '2px solid gray'
    };

    const activeCheckStyle = {
        ...checkStyle,
        backgroundColor: '#74da78',
        border: '2px solid #74da78' // Use border instead of borderColor to avoid conflict
    };

    const checkIconStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
    };

    // Debug: Log the data being rendered
    console.log('ChooseActivityCard render:', { isMobile, selectActivityData: visibleActivityCards.length });
    
    return (
        <>
            {/* Notification for flight type selection */}
            {/* Local 'Selected' toast removed - global Selected+Next toast handles this */}
            
            <div className="tab_box choose-activity-tab-box" style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: isMobile ? '8px' : '10px', 
            width: '100%', 
            justifyContent: isMobile ? 'flex-start' : 'space-between' 
        }}>
            {/* Debug: Show total count */}

            {visibleActivityCards.map((item, index) => {
                console.log('Rendering item:', item.label, 'index:', index, 'isMobile:', isMobile);
                return (
                <div className="book_data choose-activity-card" key={item.value} style={{ 
                    height: activityCardHeight, 
                    minHeight: activityCardHeight, 
                    maxHeight: activityCardHeight,
                    flex: isMobile ? '1 1 100%' : '1 1 calc(50% - 20px)', 
                    margin: isMobile ? '0 0 8px 0' : '0', 
                    width: isMobile ? '100%' : 'calc(50% - 20px)', 
                    boxSizing: 'border-box' 
                }}>
                    {item.label === "Redeem Voucher" ? (
                        <div className={`card-flip-container ${isFlipped ? 'flipped' : ''}`} style={{ height: activityCardHeight, width: '100%', position: 'relative' }}>
                            <div className="card-flipper" style={{ height: activityCardHeight, width: '100%', position: 'relative' }}>
                                <div 
                                    className="card-front"
                                    onClick={() => {
                                        setActivitySelect('Redeem Voucher');
                                        // Show notification for Redeem Voucher selection
                                        setNotificationMessage('Redeem Voucher Selected');
                                        setShowNotification(true);
                                        setTimeout(() => {
                                            setShowNotification(false);
                                        }, 3000);
                                        setIsFlipped(true);
                                    }}
                                    style={{ height: activityCardHeight, width: '100%', padding: '0', boxSizing: 'border-box', position: 'absolute', top: 0, left: 0 }}
                                >
                                                                            <label 
                                        htmlFor={`activity-${item.label}`} 
                                        className={`book_data_label choose-activity-card-label ${activitySelect === item.label ? 'active_book_data_label' : ""}`}
                                        style={{ 
                                            height: '100%',
                                            width: '100%',
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            borderRadius: '20px',
                                            padding: isMobile ? '15px 10px' : '30px 15px',
                                            margin: '0',
                                            boxSizing: 'border-box',
                                            position: 'relative'
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            id={`activity-${item.label}`}
                                            name="activity"
                                            value={item.label}
                                            checked={activitySelect === item.label}
                                            onChange={() => {}} // Handled by onClick
                                            style={{ display: 'none' }} // Hide input
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: '15px',
                                            right: '15px',
                                        }}>
                                            <div style={activitySelect === item.label ? activeCheckStyle : checkStyle}>
                                                {activitySelect === item.label && (
                                                    <span style={checkIconStyle}>✓</span>
                                                )}
                                            </div>
                                        </div>
                                        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                            {item.displayLabel || item.label}
                                        </h3>
                                        {item.subText && <p>{item.subText}</p>}
                                        {localVoucherCode && (
                                            <div style={{ 
                                                fontSize: '14px', 
                                                marginTop: '8px', 
                                                color: activitySelect === item.label ? '#03a9f4' : '#666',
                                                fontWeight: '500',
                                                backgroundColor: activitySelect === item.label ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                display: 'inline-block'
                                            }}>
                                                Voucher: {localVoucherCode}
                                            </div>
                                        )}
                                    </label>
                                </div>
                                <div 
                                    className="card-back"
                                    ref={cardBackRef}
                                    onClick={e => {
                                        // Sadece input veya button dışında bir yere tıklanırsa flip
                                        if (
                                            e.target === cardBackRef.current
                                        ) {
                                            setIsFlipped(false);
                                        }
                                    }}
                                    style={{ 
                                        height: activityCardHeight, 
                                        width: '100%', 
                                        padding: '0', 
                                        boxSizing: 'border-box', 
                                        position: 'absolute', 
                                        top: 0, 
                                        left: 0,
                                        borderRadius: '20px',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <RedeemVoucherCard
                                        onSubmit={handleVoucherSubmit}
                                        voucherStatus={voucherStatus}
                                        voucherCode={localVoucherCode}
                                        voucherData={voucherData}
                                        onValidate={onValidate}
                                    />
                                    {voucherStatus === "invalid" && (
                                        <div className="error-message" style={{ color: 'white', textAlign: 'center', fontSize: '12px', marginTop: '4px' }}>
                                            Invalid voucher code. Please try again.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <label htmlFor={`activity-${item.label}`} className={`book_data_label choose-activity-card-label ${activitySelect === item.label ? 'active_book_data_label' : ""}`} style={{ 
                            height: '100%', 
                            width: '100%', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            borderRadius: '20px', 
                            padding: isMobile ? '15px 10px' : '30px 15px', 
                            margin: '0', 
                            boxSizing: 'border-box', 
                            position: 'relative' 
                        }}>
                            <input type="radio" id={`activity-${item.label}`} name="activity" value={item.label} checked={activitySelect === item.label} onChange={() => handleActivitySelect(item.label)} style={{ display: 'none' }} />
                            <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                                <div style={activitySelect === item.label ? activeCheckStyle : checkStyle}>
                                    {activitySelect === item.label && (
                                        <span style={checkIconStyle}>✓</span>
                                    )}
                                </div>
                            </div>
                            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                {item.displayLabel || item.label}
                                {(() => {
                                    const tooltipPlace = (item.label === 'Book Flight' || item.label === 'Buy Gift' || item.label === 'Flight Voucher') ? 'left' : 'top';
                                    return (
                                        <>
                                <BsInfoCircle 
                                    data-tooltip-id={`activity-tooltip-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
                                                data-tooltip-place={tooltipPlace}
                                                data-tooltip-offset="10"
                                                data-tooltip-variant="dark"
                                                data-tooltip-float="true"
                                    style={{ color: '#3b82f6', cursor: 'pointer', width: 14, height: 14 }} 
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    if (isMobile) {
                                                        setActiveMobileTooltip(prev => prev === item.label ? null : item.label);
                                                    }
                                                }}
                                                onTouchStart={e => {
                                                    e.stopPropagation();
                                                    if (isMobile) {
                                                        setActiveMobileTooltip(prev => prev === item.label ? null : item.label);
                                                    }
                                                }}
                                />
                                            {!isMobile && (
                                <ReactTooltip
                                    id={`activity-tooltip-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
                                                    place={tooltipPlace}
                                                    positionStrategy="fixed"
                                                    offset={12}
                                                    content={getTooltipContent(item.label)}
                                    style={{
                                                        maxWidth: '260px',
                                        fontSize: '13px',
                                        textAlign: 'center',
                                        backgroundColor: '#1f2937',
                                        color: '#ffffff',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                                        zIndex: 100000
                                                    }}
                                                />
                                            )}
                                        </>
                                    );
                                })()}
                                {isMobile && activeMobileTooltip === item.label && (
                                    <div
                                        className="mobile-activity-tooltip"
                                        onClick={e => e.stopPropagation()}
                                        onTouchStart={e => e.stopPropagation()}
                                        style={{
                                            position: 'absolute',
                                            top: '20px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            backgroundColor: 'rgba(31,41,55,0.95)',
                                            color: '#ffffff',
                                            borderRadius: '12px',
                                            padding: '10px 14px',
                                            fontSize: '13px',
                                            lineHeight: 1.4,
                                            textAlign: 'center',
                                            width: 'min(240px, 85vw)',
                                            boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
                                            zIndex: 100001
                                        }}
                                    >
                                        <span>{getTooltipContent(item.label)}</span>
                                    </div>
                                )}
                            </h3>
                            {item.subText && <p>{item.subText}</p>}
                        </label>
                    )}
                </div>
            );
            })}
            <style>{`
                /* Ensure info hover appears above cards on all breakpoints */
                .choose-activity-tab-box { overflow: visible !important; }
                .choose-activity-tab-box .choose-activity-card { overflow: visible !important; position: relative; }
                .choose-activity-card-label,
                .choose-activity-card .card-front,
                .choose-activity-card .card-back {
                    overflow: visible !important;
                    position: relative;
                    z-index: 2;
                }
                @media (max-width: 768px) {
                    .choose-activity-tab-box { 
                        gap: 8px !important; 
                        flex-direction: column !important;
                        width: 100% !important;
                        display: flex !important;
                    }
                    /* Prevent tooltip clipping on mobile */
                    .info-icon-container .hover-text { 
                        max-width: 95vw !important; 
                        min-width: 350px !important;
                        width: max-content !important; 
                        white-space: normal !important; 
                        word-break: break-word !important; 
                        line-height: 1.6 !important; 
                        box-sizing: border-box !important; 
                        padding: 20px 24px !important;
                        font-size: 16px !important;
                        min-height: 80px !important;
                        /* Show tooltip above card on mobile */
                        position: absolute !important;
                        top: -140px !important;
                        left: 50% !important;
                        transform: translateX(-50%) !important;
                        z-index: 100000 !important;
                        background: rgba(0,0,0,0.95) !important;
                        border-radius: 12px !important;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
                    }
                    /* Ensure cards don't cover the tooltip */
                    .choose-activity-tab-box .choose-activity-card { position: relative !important; z-index: 1 !important; }
                    .choose-activity-tab-box .choose-activity-card { 
                        width: 100% !important; 
                        min-height: ${mobileActivityCardHeight} !important; 
                        height: ${mobileActivityCardHeight} !important; 
                        max-height: ${mobileActivityCardHeight} !important;
                        flex: 1 1 100% !important; 
                        margin: 0 0 8px 0 !important;
                        max-width: 100% !important;
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    }
                    .choose-activity-card-label {
                        min-height: ${mobileActivityCardHeight} !important;
                        max-height: ${mobileActivityCardHeight} !important;
                        padding: 16px 14px !important;
                        justify-content: center !important;
                    }
                    .choose-activity-card-label h3 {
                        font-size: 17px !important;
                        line-height: 1.25 !important;
                        margin: 0 !important;
                    }
                }
                /* Android mobile: match iOS card heights */
                @media (max-width: 768px) {
                    .is-android .choose-activity-tab-box .choose-activity-card,
                    .is-android .choose-activity-tab-box .choose-activity-card:nth-child(1),
                    .is-android .choose-activity-tab-box .choose-activity-card:nth-child(2),
                    .is-android .choose-activity-tab-box .choose-activity-card:nth-child(3),
                    .is-android .choose-activity-tab-box .choose-activity-card:nth-child(4) {
                        height: ${mobileActivityCardHeight} !important;
                        min-height: ${mobileActivityCardHeight} !important;
                        max-height: ${mobileActivityCardHeight} !important;
                    }
                }
                @media (max-width: 576px) {
                    .choose-activity-tab-box { 
                        gap: 6px !important; 
                    }
                    .choose-activity-tab-box .choose-activity-card { 
                        min-height: ${mobileActivityCardHeight} !important; 
                        height: ${mobileActivityCardHeight} !important; 
                        max-height: ${mobileActivityCardHeight} !important;
                        margin: 0 0 6px 0 !important;
                    }
                    .choose-activity-card-label h3 {
                        font-size: 16px !important;
                    }
                }
                @media (max-width: 480px) {
                    .choose-activity-tab-box { 
                        gap: 4px !important; 
                    }
                    .choose-activity-tab-box .choose-activity-card { 
                        min-height: ${mobileActivityCardHeight} !important; 
                        height: ${mobileActivityCardHeight} !important; 
                        max-height: ${mobileActivityCardHeight} !important;
                        margin: 0 0 4px 0 !important;
                    }
                    .choose-activity-card-label h3 {
                        font-size: 15px !important;
                    }
                    .choose-activity-card-label {
                        border-radius: 16px !important;
                        padding: 14px 12px !important;
                    }
                }
                
                /* Force all items to be visible on mobile */
                @media (max-width: 768px) {
                    .choose-activity-tab-box .choose-activity-card:nth-child(1),
                    .choose-activity-tab-box .choose-activity-card:nth-child(2),
                    .choose-activity-tab-box .choose-activity-card:nth-child(3),
                    .choose-activity-tab-box .choose-activity-card:nth-child(4) {
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        height: ${mobileActivityCardHeight} !important;
                        min-height: ${mobileActivityCardHeight} !important;
                        max-height: ${mobileActivityCardHeight} !important;
                    }
                }
                
                /* Notification animation */
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `}</style>
        </div>
        </>
    );
};

export default ChooseActivityCard;
