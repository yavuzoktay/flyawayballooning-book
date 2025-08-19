import React, { useState, useEffect, useMemo } from "react";
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
    const [experiences, setExperiences] = useState([]);
    const [experiencesLoading, setExperiencesLoading] = useState(false);

    // Mobile breakpoint
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 576);
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Determine if Bristol pricing should be used
    const isBristol = useMemo(() => chooseLocation === 'Bristol Fiesta', [chooseLocation]);

    // Bristol-specific prices
    const bristolSharedPrice = 305;
    const bristolPrivatePrices = { 2: 1200, 3: 1500 };

    // Helper function to format price display
    const formatPriceDisplay = (price) => {
        // Remove unnecessary decimal zeros and format as integer if possible
        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) return '0';
        
        // If it's a whole number, display without decimals
        if (Number.isInteger(numPrice)) {
            return numPrice.toString();
        }
        
        // If it has decimals, remove trailing zeros
        return numPrice.toFixed(2).replace(/\.?0+$/, '');
    };

    // Debug: Log when isBristol changes
    useEffect(() => {
        console.log('ExperienceSection: isBristol changed to:', isBristol);
        console.log('ExperienceSection: chooseLocation is:', chooseLocation);
    }, [isBristol, chooseLocation]);

    // Fetch pricing data when location changes
    useEffect(() => {
        if (chooseLocation) {
            if (isBristol) {
                // For Bristol, set specific pricing data
                setLocationPricing({
                    shared_flight_from_price: bristolSharedPrice,
                    private_charter_from_price: bristolPrivatePrices[2], // Use 2-person price as base
                    flight_type: 'Private,Shared'
                });
            } else {
                fetchLocationPricing();
            }
        }
    }, [chooseLocation, isBristol, bristolSharedPrice, bristolPrivatePrices]);

    // Debug: Log when locationPricing changes
    useEffect(() => {
        console.log('ExperienceSection: locationPricing updated:', locationPricing);
        console.log('ExperienceSection: isBristol:', isBristol);
        console.log('ExperienceSection: chooseLocation:', chooseLocation);
    }, [locationPricing, isBristol, chooseLocation]);

    // Fetch experiences from API on component mount
    useEffect(() => {
        fetchExperiences();
    }, []);

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
    const getExperiences = useMemo(() => {
        const sharedPrice = isBristol ? bristolSharedPrice : (locationPricing?.shared_flight_from_price || 180);
        const privatePrice = isBristol ? null : (locationPricing?.private_charter_from_price || 900);

        console.log('ExperienceSection: getExperiences - isBristol:', isBristol);
        console.log('ExperienceSection: getExperiences - sharedPrice:', sharedPrice);
        console.log('ExperienceSection: getExperiences - privatePrice:', privatePrice);
        console.log('ExperienceSection: getExperiences - locationPricing:', locationPricing);

        // Calculate private flight prices based on group size
        const privatePrices = {
            2: privatePrice || 900,
            3: privatePrice ? Math.round(privatePrice * 1.5) : 1050,
            4: privatePrice ? Math.round(privatePrice * 2) : 1200,
            8: privatePrice ? Math.round(privatePrice * 2) : 1800
        };

        const experiencesArray = [
            {
                title: "Shared Flight",
                img: sharedFlightImg,
                price: formatPriceDisplay(sharedPrice),
                priceValue: sharedPrice,
                priceUnit: 'pp',
                desc: "Join a Shared Flight with a maximum of 8 passengers. Perfect for Solo Travellers, Couples and Groups looking to Celebrate Special Occasions or Experience Ballooning.",
                details: [],
                maxFlight: "Max 8 per flight",
                passengerOptions: Array.from({ length: 8 }, (_, i) => i + 1), // Options 1 to 8
            },
            {
                title: "Private Charter",
                img: privateCharterImg,
                price: isBristol 
                    ? formatPriceDisplay(bristolPrivatePrices[2] / 2)
                    : formatPriceDisplay(privatePrice || 900),
                priceValue: isBristol ? (bristolPrivatePrices[2] / 2) : (privatePrice || 900),
                priceUnit: isBristol ? 'pp' : 'total',
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
                    2: privatePrice || 900,  // Total price for 2 passengers
                    3: privatePrice ? Math.round(privatePrice * 1.5) : 1050,  // Total price for 3 passengers
                    4: privatePrice ? Math.round(privatePrice * 2) : 1200,  // Total price for 4 passengers
                    8: privatePrice ? Math.round(privatePrice * 2) : 1800   // Total price for 8 passengers
                }
            }
        ];
        return experiencesArray;
    }, [locationPricing, isBristol, bristolSharedPrice, bristolPrivatePrices]);

    // Fetch experiences from API
    const fetchExperiences = async () => {
        setExperiencesLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/experiences`);
            if (response.data.success) {
                setExperiences(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching experiences:', error);
            // Fallback to default experiences if API fails
            setExperiences([]);
        } finally {
            setExperiencesLoading(false);
        }
    };

    // Use API experiences if available, otherwise fallback to default
    const getExperiencesFromAPI = useMemo(() => {
        if (experiences.length > 0) {
            return experiences.map(exp => {
                // Get pricing from selected activity based on experience type
                let price = '';
                let priceUnit = 'pp';
                
                if (locationPricing) {
                    if (exp.title.toLowerCase().includes('shared')) {
                        price = locationPricing.shared_flight_from_price || 180;
                        priceUnit = 'pp';
                    } else if (exp.title.toLowerCase().includes('private')) {
                        price = locationPricing.private_charter_from_price || 900;
                        priceUnit = 'total';
                    }
                } else {
                    // Fallback to default pricing
                    if (exp.title.toLowerCase().includes('shared')) {
                        price = isBristol ? bristolSharedPrice : 180;
                        priceUnit = 'pp';
                    } else if (exp.title.toLowerCase().includes('private')) {
                        price = isBristol ? (bristolPrivatePrices[2] / 2) : 900;
                        priceUnit = isBristol ? 'pp' : 'total';
                    }
                }
                
                return {
                    title: exp.title,
                    img: exp.image_url ? `${API_BASE_URL}${exp.image_url}` : (exp.title.toLowerCase().includes('shared') ? sharedFlightImg : privateCharterImg),
                    price: formatPriceDisplay(price),
                    desc: exp.description,
                    details: [],
                    maxFlight: `Max ${exp.max_passengers} per flight`,
                    passengerOptions: Array.from({ length: exp.max_passengers }, (_, i) => i + 1),
                    max_passengers: exp.max_passengers,
                    isFromAPI: true,
                    priceValue: price,
                    priceUnit: priceUnit
                };
            });
        }
        return getExperiences;
    }, [experiences, locationPricing, isBristol, bristolSharedPrice, bristolPrivatePrices, getExperiences]);

    // --- FLIGHT TYPE FILTERING ---
    // locationPricing.flight_type ör: "Private,Shared"
    let allowedTypes = (locationPricing?.flight_type || '').split(',').map(t => t.trim()).filter(Boolean);
    
    // If no allowed types are specified (e.g., when locationPricing is not loaded yet), 
    // or if it's a voucher type, show all experiences
    if (allowedTypes.length === 0 || isFlightVoucher || isGiftVoucher) {
        allowedTypes = ['Shared', 'Private'];
    }
    
    const filteredExperiences = useMemo(() => {
        return getExperiencesFromAPI.filter(exp => {
            if (exp.title === "Shared Flight") return allowedTypes.includes("Shared");
            if (exp.title === "Private Charter") return allowedTypes.includes("Private");
            return false;
        });
    }, [getExperiencesFromAPI, allowedTypes, isFlightVoucher, isGiftVoucher]);
    
    // Debug: Log experiences data
    console.log('Experiences after filtering:', filteredExperiences);



    const handlePassengerChange = (index, value) => {
        setAddPassenger((prev) => {
            const updatedPassengers = Array(filteredExperiences.length).fill(null); // Reset all selections
            updatedPassengers[index] = value ? parseInt(value) : null;
            return updatedPassengers;
        });
    };

    const handleSelectClick = (type, passengerCount, price, index) => {
        console.log('handleSelectClick called with:', { type, passengerCount, price, index });
        
        if (!passengerCount) {
            // If no passenger selected yet for Private Charter, default to minimum allowed
            if (type === 'Private Charter') {
                const defaultPax = isBristol ? 2 : 2;
                passengerCount = defaultPax;
                console.log('Defaulting Private Charter pax to', passengerCount);
            } else {
                console.error('No passenger count provided');
                return;
            }
        }
        
        // Safety check for experiences array
        if (!filteredExperiences || filteredExperiences.length === 0) {
            console.error('Experiences array is not available');
            return;
        }

        // Find the selected experience
        const selectedExp = filteredExperiences.find(exp => exp.title === type);
        if (!selectedExp) {
            console.error('Selected experience not found:', type);
            return;
        }

        // Calculate the correct price using priceValue and priceUnit
        let finalPrice, totalPrice;
        const isPrivate = type === 'Private Charter';
        
        if (isBristol && !isPrivate) {
            // Shared Flight, Bristol pricing
            finalPrice = bristolSharedPrice;
            totalPrice = bristolSharedPrice * passengerCount;
        } else if (isBristol && isPrivate && (passengerCount === 2 || passengerCount === 3)) {
            // Private Flight, Bristol pricing for 2 or 3
            finalPrice = bristolPrivatePrices[passengerCount];
            totalPrice = bristolPrivatePrices[passengerCount];
        } else if (isPrivate) {
            if (selectedExp.specialPrices && selectedExp.specialPrices[passengerCount]) {
                // Use special pricing if available (fallback experiences)
                const totalForGroup = selectedExp.specialPrices[passengerCount];
                totalPrice = totalForGroup;
                finalPrice = totalForGroup;
            } else {
                // Use priceValue and priceUnit from experience object
                const basePrice = selectedExp.priceValue || parseFloat(selectedExp.price || 0);
                const unit = selectedExp.priceUnit || 'total';
                
                if (!basePrice || isNaN(basePrice)) {
                    console.error('Private Charter pricing missing:', selectedExp);
                    return;
                }
                
                if (unit === 'total') {
                    totalPrice = basePrice; // already total price
                    finalPrice = basePrice;
                } else {
                    totalPrice = basePrice * passengerCount; // per person
                    finalPrice = basePrice;
                }
            }
        } else {
            // Shared Flight - use priceValue if available, otherwise fallback
            const basePrice = selectedExp.priceValue || parseFloat(selectedExp.price || 0);
            if (!basePrice || isNaN(basePrice)) {
                console.error('Shared Flight pricing missing:', selectedExp);
                return;
            }
            finalPrice = basePrice;
            totalPrice = basePrice * passengerCount;
        }

        const flightData = { 
            type, 
            passengerCount, 
            price: finalPrice,
            totalPrice: totalPrice
        };
        console.log('Setting selected flight:', flightData);
        setSelectedFlight(flightData);
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
    if (filteredExperiences.length === 0) {
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', width: '100%', justifyContent: 'flex-start'}}>
                {filteredExperiences && filteredExperiences.length > 0 ? filteredExperiences.map((experience, index) => (
                    <div key={index} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', width: isMobile ? '100%' : 'calc(50% - 10px)', minWidth: isMobile ? '0' : '260px', maxWidth: '400px', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: isMobile ? '1 1 100%' : '1' }}>
                        <img 
                            src={experience.img || '/images/placeholder-experience.svg'} 
                            alt={experience.title} 
                            style={{ width: '100%', height: 160, objectFit: 'cover' }}
                            onError={(e) => {
                                e.target.src = '/images/placeholder-experience.svg';
                            }}
                        />
                        <div style={{ padding: '20px 20px 16px 20px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 300, margin: 0, marginBottom: 6, color: '#4a4a4a' }}>{experience.title}</h2>
                            <div style={{ borderBottom: '1px solid #e0e0e0', margin: '6px 0 12px 0' }} />
                            <div style={{ fontSize: 14, color: '#444', marginBottom: 12, lineHeight: '1.4', flex: '1' }}>{experience.desc}</div>
                            <div style={{ fontWeight: 500, fontSize: 18, marginBottom: 12 }}>
                                From £{experience.price}
                            </div>
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
                                    const defaultPassengerCount = (Array.isArray(experience.passengerOptions) && experience.passengerOptions.length > 0)
                                        ? experience.passengerOptions[0]
                                        : (experience.max_passengers || 1);
                                    const priceNumber = parseFloat(experience.priceValue);
                                    console.log('Button clicked:', {
                                        type: experience.title,
                                        passengerCount: defaultPassengerCount,
                                        price: priceNumber,
                                        index: index
                                    });
                                    handleSelectClick(
                                        experience.title,
                                        defaultPassengerCount,
                                        priceNumber,
                                        index
                                    );
                                }}
                            >
                                Select
                            </button>
                        </div>
                    </div>
                )) : (
                    <div style={{ width: '100%', textAlign: 'center', padding: 20 }}>No experiences available.</div>
                )}
            </div>
        </Accordion>
    );
};

export default ExperienceSection;
