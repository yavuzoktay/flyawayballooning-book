import React, { useState, useEffect } from "react";
import Accordion from "../Common/Accordion";
import { Link } from "react-router-dom";
import axios from 'axios';
import { BsInfoCircle } from 'react-icons/bs';
import sharedFlightImg from '../../../assets/images/shared-flight.jpg';
import privateCharterImg from '../../../assets/images/private-charter.jpg';
import config from '../../../config';

const weatherRefundableHoverTexts = {
    sharedFlight: "You can select a weather refund option for each passenger for an additional £47.50 per person. This option can be chosen when entering passenger information.",
    privateFlight: "You can make your experience weather refundable for an additional 10% of your experience cost. This option can be selected during the booking process."
};

const API_BASE_URL = config.API_BASE_URL;

const ExperienceSection = ({ isRedeemVoucher, setChooseFlightType, addPassenger, setAddPassenger, activeAccordion, setActiveAccordion, activityId, setAvailableSeats, chooseLocation, isFlightVoucher, isGiftVoucher }) => {
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [locationPricing, setLocationPricing] = useState(null);
    const [loading, setLoading] = useState(false);

    // Determine if Bristol pricing should be used
    const isBristol = chooseLocation === 'Bristol Fiesta';

    // Bristol-specific prices
    const bristolSharedPrice = 305;
    const bristolPrivatePrices = { 2: 1200, 3: 1500 };

    // Fetch pricing data when location changes
    useEffect(() => {
        if (chooseLocation && !isBristol) {
            fetchLocationPricing();
        }
    }, [chooseLocation]);

    const fetchLocationPricing = async () => {
        if (!chooseLocation) return;
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/locationPricing/${encodeURIComponent(chooseLocation)}`);
            if (response.data.success) {
                setLocationPricing(response.data.data);
                // flight_type burada response.data.data.flight_type olarak gelir
            }
        } catch (error) {
            console.error('Error fetching location pricing:', error);
        } finally {
            setLoading(false);
        }
    };

    // Create dynamic experiences based on location pricing
    const getExperiences = () => {
        const sharedPrice = isBristol ? bristolSharedPrice : (locationPricing?.shared_price || 180);
        const privatePrice = isBristol ? null : (locationPricing?.private_price || 900);

        // Calculate private flight prices based on group size
        const privatePrices = {
            2: privatePrice || 900,
            3: privatePrice ? Math.round(privatePrice * 1.5) : 1050,
            4: privatePrice ? Math.round(privatePrice * 2) : 1200,
            8: privatePrice ? Math.round(privatePrice * 4) : 1800
        };

        const experiencesArray = [
            {
                title: "Shared Flight",
                img: sharedFlightImg,
                price: sharedPrice.toString(),
                desc: "Join a Shared Flight with a maximum of 8 passengers. Perfect for Solo Travellers, Couples and Groups looking to Celebrate Special Occasions or Experience Ballooning.",
                details: [],
                maxFlight: "Max 8 per flight",
                passengerOptions: Array.from({ length: 8 }, (_, i) => i + 1), // Options 1 to 8
            },
            {
                title: "Private Charter",
                img: privateCharterImg,
                price: isBristol ? (bristolPrivatePrices[2] / 2).toString() : (privatePrice ? (privatePrice / 2).toString() : "450"), // Default per person price
                desc: isBristol 
                    ? "Private Charter balloon flights for 2 or 3 passengers. Mostly purchased for Significant Milestones, Proposals, Major Birthdays, Families or Groups of Friends."
                    : "Private Charter balloon flights for 2,3,4 or 8 passengers. Mostly purchased for Significant Milestones, Proposals, Major Birthdays, Families or Groups of Friends.",
                details: [],
                maxFlight: "",
                passengerOptions: isBristol ? [2, 3] : [2, 3, 4, 8],
                specialPrices: isBristol ? {
                    2: bristolPrivatePrices[2] / 2,  // Price per person for 2 passengers
                    3: bristolPrivatePrices[3] / 3   // Price per person for 3 passengers
                } : {
                    2: privatePrice ? (privatePrice / 2) : 450,  // Price per person for 2 passengers
                    3: privatePrice ? (privatePrice / 3) : 350,  // Price per person for 3 passengers
                    4: privatePrice ? (privatePrice / 4) : 300,  // Price per person for 4 passengers
                    8: privatePrice ? (privatePrice / 8) : 225   // Price per person for 8 passengers
                }
            }
        ];
        return experiencesArray;
    };

    // --- FLIGHT TYPE FILTERING ---
    // locationPricing.flight_type ör: "Private,Shared"
    let allowedTypes = (locationPricing?.flight_type || '').split(',').map(t => t.trim()).filter(Boolean);
    
    // If no allowed types are specified (e.g., when locationPricing is not loaded yet), 
    // or if it's a voucher type, show all experiences
    if (allowedTypes.length === 0 || isFlightVoucher || isGiftVoucher) {
        allowedTypes = ['Shared', 'Private'];
    }
    
    const experiences = getExperiences().filter(exp => {
        if (exp.title === "Shared Flight") return allowedTypes.includes("Shared");
        if (exp.title === "Private Charter") return allowedTypes.includes("Private");
        return false;
    });
    
    // Debug: Log experiences data
    console.log('Experiences after filtering:', experiences);



    const handlePassengerChange = (index, value) => {
        setAddPassenger((prev) => {
            const updatedPassengers = Array(experiences.length).fill(null); // Reset all selections
            updatedPassengers[index] = value ? parseInt(value) : null;
            return updatedPassengers;
        });
    };

    const handleSelectClick = (type, passengerCount, price, index) => {
        console.log('handleSelectClick called with:', { type, passengerCount, price, index });
        
        if (!passengerCount) {
            console.error('No passenger count provided');
            return; // Prevent selection without a valid passenger number
        }
        
        // Safety check for experiences array
        if (!experiences || experiences.length === 0) {
            console.error('Experiences array is not available');
            return;
        }

        // Calculate the correct price
        let finalPrice, totalPrice;
        if (isBristol && index === 0) {
            // Shared Flight, Bristol pricing
            finalPrice = bristolSharedPrice;
            totalPrice = bristolSharedPrice * passengerCount;
        } else if (isBristol && index === 1 && (passengerCount === 2 || passengerCount === 3)) {
            // Private Flight, Bristol pricing for 2 or 3
            finalPrice = bristolPrivatePrices[passengerCount];
            totalPrice = bristolPrivatePrices[passengerCount];
        } else if (index === 1) {
            // For Private Flight, calculate total price from specialPrices
            if (!experiences[1] || !experiences[1].specialPrices) {
                console.error('Private Charter pricing is not available');
                return;
            }
            const perPersonPrice = experiences[1].specialPrices[passengerCount];
            if (!perPersonPrice) {
                console.error('Invalid passenger count or missing pricing for Private Charter');
                return;
            }
            totalPrice = perPersonPrice * passengerCount;
            finalPrice = perPersonPrice; // Store the per person price
        } else {
            // For Shared Flight, calculate total from per person price
            finalPrice = price;
            totalPrice = price * passengerCount;
        }

        const flightData = { 
            type, 
            passengerCount, 
            price: finalPrice,
            totalPrice: totalPrice
        };
        console.log('Setting selected flight:', flightData);
        setSelectedFlight(flightData);
        // Directly confirm selection without showing Terms & Conditions popup
        console.log('Directly confirming selection');
        setChooseFlightType(flightData);
        getBookingDates(flightData.type);
    };



    // Get Booking Dates
    async function getBookingDates(type) {
        const response = await axios.post(`${API_BASE_URL}/api/getAvailableSeats`, {
            flight_type: type,
            activity_id: activityId
        });

        if (response.status === 200) {
            const data = response?.data?.result;
            setAvailableSeats(data);
            console.log('Available seats:', data);
        }
    }

    // Debug logging for troubleshooting
    if (experiences.length === 0) {
        console.log('WARNING: Experiences array is empty!');
        console.log('Location pricing:', locationPricing);
        console.log('Allowed types:', allowedTypes);
    }
    
    return (
        <Accordion
            title="Select Experience"
            id="select-experience"
            activeAccordion={activeAccordion}
            setActiveAccordion={setActiveAccordion}
        >
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '20px', width: '100%', justifyContent: 'flex-start'}}>
                {experiences && experiences.length > 0 ? experiences.map((experience, index) => (
                    <div key={index} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', width: 'calc(50% - 10px)', minWidth: '320px', maxWidth: '400px', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: '1' }}>
                        <img src={experience.img} alt={experience.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                        <div style={{ padding: '20px 20px 16px 20px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 300, margin: 0, marginBottom: 6, color: '#4a4a4a' }}>{experience.title}</h2>
                            <div style={{ borderBottom: '1px solid #e0e0e0', margin: '6px 0 12px 0' }} />
                            <div style={{ fontSize: 14, color: '#444', marginBottom: 12, lineHeight: '1.4', flex: '1' }}>{experience.desc}</div>
                            {experience.details.length > 0 && (
                                <ul style={{ paddingLeft: 16, margin: 0, marginBottom: 12, color: '#444', fontSize: 14 }}>
                                    {experience.details.map((detail, i) => (
                                        <li key={i}>{typeof detail === 'string' ? detail : detail.text}</li>
                                    ))}
                                </ul>
                            )}
                            <div style={{ fontWeight: 500, fontSize: 18, marginBottom: 12 }}>From £{experience.price}pp</div>
                            <button
                                style={{
                                    width: '100%',
                                    background: '#03a9f4',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '10px 0',
                                    fontSize: 16,
                                    fontWeight: 300,
                                    cursor: 'pointer',
                                    marginTop: 6,
                                    marginBottom: 0,
                                    transition: 'background 0.2s',
                                }}
                                onClick={() => {
                                    // Use the first valid passenger count for each experience type
                                    const defaultPassengerCount = experience.passengerOptions ? experience.passengerOptions[0] : 1;
                                    const priceNumber = parseFloat(experience.price);
                                    console.log('Button clicked:', {
                                        type: experience.title,
                                        passengerCount: defaultPassengerCount,
                                        price: priceNumber,
                                        index: index
                                    });
                                    handleSelectClick(experience.title, defaultPassengerCount, priceNumber, index);
                                }}
                            >
                                Select
                            </button>
                        </div>
                    </div>
                )) : (
                    <div style={{ textAlign: 'center', width: '100%', padding: '20px' }}>
                        <p>Loading experiences...</p>
                    </div>
                )}
            </div>


        </Accordion>
    );
};

export default ExperienceSection;
