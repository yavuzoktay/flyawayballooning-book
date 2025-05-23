import React, { useState } from "react";
import Accordion from "../Common/Accordion";
import Image1 from '../../../assets/images/category1.jpeg';
import Image2 from '../../../assets/images/category2.jpeg';
import Image3 from '../../../assets/images/category3.jpg';
import Image4 from '../../../assets/images/category1.jpeg';
import axios from "axios";
import Modal from "../Common/Modal";

const locations = [
    { name: "Bath", image: Image1, value: 0 },
    { name: "Devon", image: Image2, value: 1 },
    { name: "Somerset", image: Image3, value: 2 },
    { name: "Bristol Fiesta", image: Image4, value: 3 },
];

const LocationSection = ({ isGiftVoucher, isFlightVoucher, chooseLocation, setChooseLocation, activeAccordion, setActiveAccordion, setActivityId, setSelectedActivity }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingLocation, setPendingLocation] = useState('');

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
            const response = await axios.post("/api/getActivityId", {
                location: location
            });

            if (response.status === 200) {
                var data = response?.data?.result || [];
                console.log('activity id', response.data);
                
                if (data.length > 0) {
                    var activity_id = data[0]?.activity_sku || '';
                    setActivityId(activity_id);
                    setSelectedActivity(data);
                } else {
                    console.log('No activities found for this location');
                    setActivityId('');
                    setSelectedActivity([]);
                }
            }
        } catch (error) {
            console.error("Error fetching activity ID:", error);
            // Kullanıcıya daha dostane bir hata mesajı göstermek için bir state eklenebilir
            setActivityId('');
            setSelectedActivity([]);
        }
    }

    const handleLocationSelect = (locName) => {
        if (locName === "Bristol Fiesta") {
            setPendingLocation(locName);
            setIsModalOpen(true);
        } else {
            // Diğer lokasyonlar için doğrudan seçim yap
            confirmLocation(locName);
        }
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
                    {locations.map((loc, index) => (
                        <div className={`loc_data location_data ${chooseLocation == loc.name ? "active-loc" : ""}`} key={index} onClick={() => handleLocationSelect(loc.name)}>
                            <img src={loc.image} alt={loc.name} width="100%" />
                            <h3>{loc.name}</h3>
                            <span className={`location-radio ${chooseLocation == loc.name ? "active-loc-radio" : ""}`}></span>
                        </div>
                    ))}
                </div>
            </Accordion>

            {/* Modal for Bristol Fiesta */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onConfirm={handleModalConfirm}
                title="Bristol Balloon Fiesta - Terms & Conditions"
                bulletPoints={bristolFiestaTerms}
                extraContent={termsLink}
            />
        </>
    );
};

export default LocationSection;
