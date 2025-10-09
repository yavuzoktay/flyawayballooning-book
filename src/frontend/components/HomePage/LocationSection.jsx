import React, { useState, useEffect } from "react";
import Accordion from "../Common/Accordion";
import Image1 from '../../../assets/images/category1.jpeg';
import Image2 from '../../../assets/images/category2.jpeg';
import Image3 from '../../../assets/images/category3.jpg';
import Image4 from '../../../assets/images/category1.jpeg';
import axios from "axios";
import Modal from "../Common/Modal";
import config from '../../../config';

const imageMap = {
    "Bath": Image1,
    "Devon": Image2,
    "Somerset": Image3,
    "Bristol Fiesta": Image4,
};

const API_BASE_URL = config.API_BASE_URL;

const LocationSection = ({ isGiftVoucher, isFlightVoucher, isRedeemVoucher, chooseLocation, setChooseLocation, activeAccordion, setActiveAccordion, setActivityId, setSelectedActivity, setAvailabilities, selectedVoucherType, chooseFlightType, onSectionCompletion, isDisabled = false }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingLocation, setPendingLocation] = useState('');
    const [locations, setLocations] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    
    // Notification state for location selection
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");

    // Handle window resize for responsive design
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            console.log('LocationSection resize:', window.innerWidth, 'isMobile:', mobile);
            setIsMobile(mobile);
        };

        // Set initial state
        handleResize();
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/activeLocations`)
            .then(res => {
                if (res.data.success) {
                    console.log('API Response:', res.data.data);
                    const mappedLocations = res.data.data.map(l => ({
                        name: l.location,
                        image: l.image ? `${API_BASE_URL}${l.image}` : imageMap[l.location]
                    }));
                    console.log('Mapped locations:', mappedLocations);
                    setLocations(mappedLocations);
                }
            })
            .catch(error => {
                console.error('Error fetching locations:', error);
            });
    }, []);

    // Terms for Bristol Fiesta
    const bristolFiestaTerms = [
        "Balloon flights are highly dependent on weather conditions and will only proceed if deemed safe by the flight director on the day of the event.",
        "Fiesta Flights are strictly non-refundable under any circumstances and cannot be deferred to the following year's Bristol Balloon Fiesta.",
        "If your 2025 Bristol Balloon Fiesta Flight is cancelled, your voucher will remain valid for 24 months and can be redeemed against the equivalent flight i.e a private or shared flight (excluding fiesta flights).",
        "Due to high demand and very limited availability, we are unable to accommodate rescheduling requests during the Fiesta.",
        "Flight premiums are strictly non-refundable under any circumstances due to the additional costs associated with attending the event.",
        "If you are not happy with these terms and conditions please do not book this flight."
    ];

    // Special link for full terms and conditions
    const termsLink = (
        <a href="https://flyawayballooning.com/pages/terms-conditions" target="_blank" rel="noopener noreferrer" style={{color: '#03A9F4', textDecoration: 'underline'}}>
            See full Terms & Conditions
        </a>
    );

    // Get Activity Id   

    async function getActivityId(location) {
        try {
            // First get the activity details
            const activityResponse = await axios.post(`${API_BASE_URL}/api/getActivityId`, {
                location: location
            });

            if (activityResponse.status === 200 && activityResponse.data.success) {
                const activity = activityResponse.data.activity;
                setActivityId(activity?.id || '');
                setSelectedActivity(activity ? [activity] : []);
                
                // Then get filtered availabilities using the new endpoint
                const params = new URLSearchParams({
                    location: location,
                    activityId: activity?.id
                });
                
                // Add voucher type filter if selected
                if (selectedVoucherType?.title) {
                    params.append('voucherTypes', selectedVoucherType.title);
                }
                
                // Add flight type filter if selected
                if (chooseFlightType?.type && chooseFlightType.type !== 'Shared Flight') {
                    params.append('flightType', chooseFlightType.type);
                }
                
                const availabilitiesResponse = await axios.get(`${API_BASE_URL}/api/availabilities/filter?${params.toString()}`);
                if (availabilitiesResponse.status === 200 && availabilitiesResponse.data.success) {
                    const avails = availabilitiesResponse.data.data || [];
                    console.log('LocationSection received availabilities:', avails);
                    setAvailabilities(avails);
                } else {
                    setAvailabilities([]);
                }
            } else {
                setActivityId('');
                setSelectedActivity([]);
                setAvailabilities([]);
            }
        } catch (error) {
            console.error("Error fetching activity ID:", error);
            setActivityId('');
            setSelectedActivity([]);
            setAvailabilities([]);
        }
    }

    const handleLocationSelect = (locName) => {
        // Disable Bristol Fiesta for Redeem Voucher
        if (isRedeemVoucher && locName === "Bristol Fiesta") {
            return; // Do nothing, location is disabled
        }
        // Remove modal for Bristol Fiesta, select directly
        confirmLocation(locName);
    };

    const confirmLocation = (locName) => {
        setChooseLocation(locName);
        getActivityId(locName);
        
        // Show notification for location selection
        setNotificationMessage(`${locName} Selected`);
        setShowNotification(true);
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
            setShowNotification(false);
        }, 3000);
        
        // Trigger section completion after state update
        setTimeout(() => {
            if (onSectionCompletion) {
                console.log('📍 LocationSection: Calling onSectionCompletion for location');
                onSectionCompletion('location');
            }
        }, 300); // Longer delay to ensure state is fully updated
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setPendingLocation('');
    };

    const handleModalConfirm = () => {
        setIsModalOpen(false);
        if (pendingLocation) {
            confirmLocation(pendingLocation);
        }
    };

    return (
        <>
            {/* Notification for location selection */}
            {showNotification && (
                <div style={{
                    position: 'fixed',
                    [isMobile ? 'top' : 'bottom']: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#00eb5b',
                    color: 'white',
                    padding: isMobile ? '8px 16px' : '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    zIndex: 9999,
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: isMobile ? 'slideDown 0.3s ease-out' : 'slideUp 0.3s ease-out',
                    maxWidth: '90vw',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: isMobile ? '16px' : '18px' }}>✓</span>
                    {notificationMessage}
                </div>
            )}
            
            <Accordion title="Select Flight Location" id="location" activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} className={`${isFlightVoucher ? 'disable-acc' : ''}`} isDisabled={isDisabled}>
                <div className="tab_box scroll-box">

                    
                    {isMobile ? (
                        // Mobile: Single column layout
                        locations.map((loc) => {
                            const isDisabled = isRedeemVoucher && loc.name === "Bristol Fiesta";
                            return (
                                <div 
                                    className={`loc_data location_data ${chooseLocation == loc.name ? "active-loc" : ""} ${isDisabled ? "disabled-location" : ""}`} 
                                    key={loc.name} 
                                    onClick={() => handleLocationSelect(loc.name)}
                                    style={{
                                        opacity: isDisabled ? 0.5 : 1,
                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                        filter: isDisabled ? 'grayscale(100%)' : 'none',
                                        width: '100%',
                                        marginBottom: '16px',
                                        minHeight: '180px',
                                        height: 'auto'
                                    }}
                                >
                                    <img src={loc.image} alt={loc.name} width="100%" style={{ 
                                        height: '120px', 
                                        objectFit: 'cover',
                                        transition: 'transform 0.3s ease',
                                        cursor: 'pointer'
                                    }} 
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isDisabled) {
                                            e.target.style.transform = 'scale(1.05)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'scale(1)';
                                    }}
                                    />
                                    <h3>{loc.name}</h3>
                                    <span className={`location-radio ${chooseLocation == loc.name ? "active-loc-radio" : ""}`} style={{ 
                                        position: 'absolute', 
                                        top: '10px', 
                                        right: '10px',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        border: chooseLocation == loc.name ? '2px solid #74da78' : '2px solid #ccc',
                                        backgroundColor: chooseLocation == loc.name ? '#74da78' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {chooseLocation == loc.name && (
                                            <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                                        )}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        // Desktop: Two column layout
                        Array.from({ length: Math.ceil(locations.length / 2) }).map((_, rowIdx) => (
                            <div className="location-row" style={{ display: 'flex', width: '100%', gap: 24 }} key={rowIdx}>
                                {locations.slice(rowIdx * 2, rowIdx * 2 + 2).map((loc, index) => {
                                    const isDisabled = isRedeemVoucher && loc.name === "Bristol Fiesta";
                                    return (
                                        <div 
                                            className={`loc_data location_data ${chooseLocation == loc.name ? "active-loc" : ""} ${isDisabled ? "disabled-location" : ""}`} 
                                            key={loc.name} 
                                            onClick={() => handleLocationSelect(loc.name)}
                                            style={{
                                                opacity: isDisabled ? 0.5 : 1,
                                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                filter: isDisabled ? 'grayscale(100%)' : 'none'
                                            }}
                                        >
                                            <img src={loc.image} alt={loc.name} width="100%" onError={(e) => { e.target.style.display = 'none'; }} />
                                            <h3>{loc.name}</h3>
                                            <span className={`location-radio ${chooseLocation == loc.name ? "active-loc-radio" : ""}`}></span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>
            </Accordion>

            {/* Modal for Bristol Fiesta */}
            {/* Modal removed as per new requirements */}
            
            {/* Mobile-specific CSS for better responsive design */}
            <style>{`
                @media (max-width: 768px) {
                    .tab_box.scroll-box {
                        padding: 0 8px;
                    }
                    
                    .tab_box .loc_data.location_data {
                        margin-bottom: 16px !important;
                        border-radius: 12px !important;
                        min-height: 180px !important;
                        height: auto !important;
                        position: relative !important;
                        overflow: hidden !important;
                    }
                    
                    .tab_box .loc_data.location_data h3 {
                        font-size: 16px !important;
                        margin: 0 !important;
                        position: absolute !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        color: #333 !important;
                        z-index: 2 !important;
                        padding: 8px 12px !important;
                        border-radius: 0 0 6px 6px !important;
                        background: #ffffff !important;
                        text-shadow: none !important;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    
                    .tab_box .loc_data.location_data img {
                        border-radius: 8px 8px 0 0 !important;
                        height: 120px !important;
                        object-fit: cover !important;
                        width: calc(100% + 24px) !important;
                        transition: transform 0.3s ease !important;
                        cursor: pointer !important;
                    }
                    
                    .tab_box .loc_data.location_data:hover img {
                        transform: scale(1.05) !important;
                    }
                    /* Gradient removed as per requirements */
                }
                
                @media (max-width: 576px) {
                    .tab_box.scroll-box {
                        padding: 0 6px;
                    }
                    
                    .tab_box .loc_data.location_data {
                        margin-bottom: 14px !important;
                        min-height: 160px !important;
                        
                    }
                    
                    .tab_box .loc_data.location_data h3 {
                        font-size: 15px !important;
                        margin: 0 !important;
                        position: absolute !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        color: #333 !important;
                        z-index: 2 !important;
                        padding: 8px 12px !important;
                        border-radius: 0 0 6px 6px !important;
                        background: #ffffff !important;
                        text-shadow: none !important;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    
                    .tab_box .loc_data.location_data img {
                        width: calc(100% + 20px) !important;
                        transition: transform 0.3s ease !important;
                        cursor: pointer !important;
                    }
                    
                    .tab_box .loc_data.location_data:hover img {
                        transform: scale(1.05) !important;
                    }
                }
                
                @media (max-width: 480px) {
                    .tab_box.scroll-box {
                        padding: 0 4px;
                    }
                    
                    .tab_box .loc_data.location_data {
                        margin-bottom: 12px !important;
                        min-height: 150px !important;
                        
                    }
                    
                    .tab_box .loc_data.location_data h3 {
                        font-size: 14px !important;
                        margin: 0 !important;
                        position: absolute !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        color: #333 !important;
                        z-index: 2 !important;
                        padding: 6px 10px !important;
                        border-radius: 0 0 6px 6px !important;
                        background: #ffffff !important;
                        text-shadow: none !important;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    
                    .tab_box .loc_data.location_data img {
                        transition: transform 0.3s ease !important;
                        cursor: pointer !important;
                    }
                    
                    .tab_box .loc_data.location_data:hover img {
                        transform: scale(1.05) !important;
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
        </>
    );
};

export default LocationSection;
