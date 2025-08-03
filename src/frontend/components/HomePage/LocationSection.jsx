import React, { useState, useEffect } from "react";
import Accordion from "../Common/Accordion";
import Image1 from '../../../assets/images/category1.jpeg';
import Image2 from '../../../assets/images/category2.jpeg';
import Image3 from '../../../assets/images/category3.jpg';
import Image4 from '../../../assets/images/category1.jpeg';
import axios from "axios";
import Modal from "../Common/Modal";

const imageMap = {
    "Bath": Image1,
    "Devon": Image2,
    "Somerset": Image3,
    "Bristol Fiesta": Image4,
};

const API_BASE_URL = process.env.REACT_APP_API_URL;

const LocationSection = ({ isGiftVoucher, isFlightVoucher, isRedeemVoucher, chooseLocation, setChooseLocation, activeAccordion, setActiveAccordion, setActivityId, setSelectedActivity, setAvailabilities }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingLocation, setPendingLocation] = useState('');
    const [locations, setLocations] = useState([]);

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
                    location: location
                });
                
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
        setActiveAccordion("location"); // Open the location accordion
        getActivityId(locName);
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
            <Accordion title="Select Flight Location" id="location" activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} className={`${isFlightVoucher ? 'disable-acc' : ''}`}>
                <div className="tab_box scroll-box">
                    {Array.from({ length: Math.ceil(locations.length / 2) }).map((_, rowIdx) => (
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
                                        <img src={loc.image} alt={loc.name} width="100%" />
                                        <h3>{loc.name}</h3>
                                        <span className={`location-radio ${chooseLocation == loc.name ? "active-loc-radio" : ""}`}></span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </Accordion>

            {/* Modal for Bristol Fiesta */}
            {/* Modal removed as per new requirements */}
        </>
    );
};

export default LocationSection;
