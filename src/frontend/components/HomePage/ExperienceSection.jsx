import React, { useState, useEffect, useMemo, useRef } from "react";
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

// Normalize image url coming from API (supports different field names and relative paths)
const getNormalizedImageUrl = (exp) => {
    const raw = exp?.image_url || exp?.image || exp?.imagePath || exp?.image_path || '';
    if (!raw) return '';
    try {
        const trimmed = String(raw).trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
        if (trimmed.startsWith('/uploads/')) return `${API_BASE_URL}${trimmed}`;
        if (trimmed.startsWith('uploads/')) return `${API_BASE_URL}/${trimmed}`;
        if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
        return `${API_BASE_URL}/${trimmed}`;
    } catch (e) {
        console.warn('Failed to normalize experience image url:', raw, e);
        return '';
    }
};

const ExperienceSection = ({ isRedeemVoucher, setChooseFlightType, addPassenger, setAddPassenger, activeAccordion, setActiveAccordion, setAvailableSeats, chooseLocation, isFlightVoucher, isGiftVoucher, onSectionCompletion }) => {
    // Safety check for required props - log error but don't return early to avoid hook violations
    const hasRequiredProps = setChooseFlightType && setAddPassenger && setActiveAccordion && setAvailableSeats;
    if (!hasRequiredProps) {
        console.error('ExperienceSection: Missing required props', {
            setChooseFlightType: !!setChooseFlightType,
            setAddPassenger: !!setAddPassenger,
            setActiveAccordion: !!setActiveAccordion,
            setAvailableSeats: !!setAvailableSeats
        });
    }

    const [selectedFlight, setSelectedFlight] = useState(null);
    const [locationPricing, setLocationPricing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [experiences, setExperiences] = useState([]);
    const [experiencesLoading, setExperiencesLoading] = useState(false);
    
    // Terms & Conditions states
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsContent, setTermsContent] = useState('');
    const [termsLoading, setTermsLoading] = useState(false);
    
    // Function to fetch Terms & Conditions for experience type
    const fetchTermsForExperience = async (experienceType) => {
        try {
            setTermsLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/terms-and-conditions/experience/${experienceType}`);
            if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                    // Get the first (highest priority) terms
                    const terms = json.data[0];
                    setTermsContent(terms.content || '');
                    setShowTermsModal(true);
                } else {
                    // Fallback to default terms
                    setTermsContent('Terms and conditions will be displayed here.');
                    setShowTermsModal(true);
                }
            } else {
                // Fallback to default terms
                setTermsContent('Terms and conditions will be displayed here.');
                setShowTermsModal(true);
            }
        } catch (error) {
            console.error('Error fetching terms for experience:', error);
            // Fallback to default terms
            setTermsContent('Terms and conditions will be displayed here.');
            setShowTermsModal(true);
        } finally {
            setTermsLoading(false);
        }
    };
    const [activitiesWithFlightTypes, setActivitiesWithFlightTypes] = useState([]);

    // Mobile breakpoint
    const [isMobile, setIsMobile] = useState(false);
    
    // Notification state for experience selection
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 768);
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

    const lastFetchedLocationRef = useRef(null);

    // Fetch activities with flight types when location changes
    useEffect(() => {
        const fetchActivitiesWithFlightTypes = async () => {
            if (!chooseLocation) return;
            
            try {
                console.log('Fetching activities with flight types for location:', chooseLocation);
                const response = await axios.get(`${API_BASE_URL}/api/activities/flight-types?location=${encodeURIComponent(chooseLocation)}`);
                
                if (response.data.success) {
                    setActivitiesWithFlightTypes(response.data.data);
                    console.log('Activities with flight types:', response.data.data);
                } else {
                    console.error('Failed to fetch activities with flight types');
                    setActivitiesWithFlightTypes([]);
                }
            } catch (error) {
                console.error('Error fetching activities with flight types:', error);
                setActivitiesWithFlightTypes([]);
            }
        };

        fetchActivitiesWithFlightTypes();
    }, [chooseLocation, API_BASE_URL]);

    // Fetch pricing data when location changes
    useEffect(() => {
        if (!chooseLocation) return;

        // Prevent duplicate fetches for the same location
        if (lastFetchedLocationRef.current === chooseLocation) return;
        lastFetchedLocationRef.current = chooseLocation;

        if (isBristol) {
            // For Bristol, set specific pricing data
            setLocationPricing({
                shared_flight_from_price: bristolSharedPrice,
                private_charter_from_price: bristolPrivatePrices[2], // Use 2-person price as base
                flight_type: ['Private', 'Shared'], // Use array format for consistency
                experiences: ['Private Charter', 'Shared Flight'] // Map to experience names
            });
        } else {
            fetchLocationPricing();
        }
    }, [chooseLocation, isBristol]);

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

    // Create dynamic experiences based on location pricing and activity flight types
    const getExperiences = useMemo(() => {
        // Define experiencesArray first
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

        // If no locationPricing, return the basic experiences array
        if (!locationPricing) return experiencesArray;

        // Get allowed flight types from activities for this location
        let allowedFlightTypes = [];
        if (activitiesWithFlightTypes && Array.isArray(activitiesWithFlightTypes)) {
            allowedFlightTypes = activitiesWithFlightTypes
                .filter(activity => activity && activity.location === chooseLocation)
                .flatMap(activity => (activity.experiences || []))
                .filter((type, index, arr) => arr.indexOf(type) === index); // Remove duplicates
        }

        // If no flight types from activities, try to get from locationPricing
        if (allowedFlightTypes.length === 0 && locationPricing?.experiences) {
            allowedFlightTypes = locationPricing.experiences;
        }

        console.log('ExperienceSection: Allowed flight types from activities:', allowedFlightTypes);
        console.log('ExperienceSection: Activities for location:', activitiesWithFlightTypes?.filter(a => a?.location === chooseLocation) || []);
        console.log('ExperienceSection: Location pricing experiences:', locationPricing?.experiences);

        // Filter experiences based on allowed flight types
        const filteredExperiences = experiencesArray.filter(experience => {
            const isAllowed = allowedFlightTypes.length === 0 || allowedFlightTypes.includes(experience.title);
            console.log(`ExperienceSection: ${experience.title} - Allowed: ${isAllowed}`);
            return isAllowed;
        });

        console.log('ExperienceSection: Filtered experiences:', filteredExperiences);
        return filteredExperiences;
    }, [locationPricing, isBristol, bristolSharedPrice, bristolPrivatePrices, activitiesWithFlightTypes, chooseLocation]);

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

    // Final experiences array - use API experiences if available, otherwise fallback to default
    const finalExperiences = useMemo(() => {
        // Check if we have API experiences first
        if (experiences && experiences.length > 0) {
            // Get allowed flight types from activities for this location
            let allowedFlightTypes = [];
            if (activitiesWithFlightTypes && Array.isArray(activitiesWithFlightTypes)) {
                allowedFlightTypes = activitiesWithFlightTypes
                    .filter(activity => activity && activity.location === chooseLocation)
                    .flatMap(activity => (activity.experiences || []))
                    .filter((type, index, arr) => arr.indexOf(type) === index);
            }

            // If no flight types from activities, try to get from locationPricing
            if (allowedFlightTypes.length === 0 && locationPricing?.experiences) {
                allowedFlightTypes = locationPricing.experiences;
            }

            // Filter API experiences based on allowed flight types
            const filteredExperiences = experiences.filter(exp => {
                const isAllowed = allowedFlightTypes.length === 0 || allowedFlightTypes.includes(exp.title);
                return isAllowed;
            });

            if (filteredExperiences.length > 0) {
                return filteredExperiences.map(exp => {
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
                        img: getNormalizedImageUrl(exp) || (exp.title.toLowerCase().includes('shared') ? sharedFlightImg : privateCharterImg),
                        price: formatPriceDisplay(price),
                        priceValue: price,
                        priceUnit: priceUnit,
                        desc: exp.description || 'No description available',
                        details: [],
                        maxFlight: exp.max_passengers ? `Max ${exp.max_passengers} per flight` : "Max 8 per flight",
                        passengerOptions: Array.from({ length: exp.max_passengers || 8 }, (_, i) => i + 1)
                    };
                });
            }
        }
        
        // Fallback to default experiences
        return getExperiences;
    }, [experiences, locationPricing, isBristol, bristolSharedPrice, bristolPrivatePrices, activitiesWithFlightTypes, chooseLocation, getExperiences]);

    // Use finalExperiences instead of the old logic
    const filteredExperiences = finalExperiences || [];
    
    // Debug: Log experiences data
    console.log('Experiences after filtering:', filteredExperiences);



    const handlePassengerChange = (index, value) => {
        if (!setAddPassenger) {
            console.error('setAddPassenger is not available');
            return;
        }
        
        if (!filteredExperiences || !Array.isArray(filteredExperiences)) {
            console.error('filteredExperiences is not available or not an array');
            return;
        }
        
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
        
        if (setChooseFlightType) {
            setChooseFlightType(flightData);
        } else {
            console.error('setChooseFlightType is not available');
        }
        
        // Show notification for experience selection
        setNotificationMessage(`${flightData.type} Selected`);
        setShowNotification(true);
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
            setShowNotification(false);
        }, 3000);
        
        // Terms & Conditions modal removed from ExperienceSection
        // It will be shown in VoucherType component instead
        
        // Trigger section completion after state update
        setTimeout(() => {
            if (onSectionCompletion) {
                console.log('✈️ ExperienceSection: Calling onSectionCompletion for experience');
                onSectionCompletion('experience');
            }
        }, 300); // Longer delay to ensure state is fully updated
    };





    // Debug logging for troubleshooting
    if (filteredExperiences.length === 0) {
        console.log('WARNING: Experiences array is empty!');
        console.log('Location pricing:', locationPricing);
        console.log('Activities with flight types:', activitiesWithFlightTypes);
        console.log('Allowed flight types:', activitiesWithFlightTypes && Array.isArray(activitiesWithFlightTypes) 
            ? activitiesWithFlightTypes
                .filter(activity => activity && activity.location === chooseLocation)
                .flatMap(activity => (activity.experiences || []))
                .filter((type, index, arr) => arr.indexOf(type) === index)
            : []);
        console.log('Location pricing experiences:', locationPricing?.experiences);
    } else {
        console.log('Experiences available:', filteredExperiences.map(exp => exp.title));
    }
    
    return (
        <>
            {/* Notification for experience selection */}
            {showNotification && (
                <div style={{
                    position: 'fixed',
                    [isMobile ? 'top' : 'bottom']: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#4CAF50',
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
            
            <style>
                {`
                    .experience-scroll-outer {
                        overflow-x: auto;
                        width: 100%;
                        max-width: 100%;
                        scrollbar-width: thin;
                        scrollbar-color: #666 #f1f1f1;
                        -webkit-overflow-scrolling: touch;
                    }
                    
                    .experience-scroll-outer::-webkit-scrollbar {
                        height: 8px;
                        width: 8px;
                    }
                    
                    .experience-scroll-outer::-webkit-scrollbar-track {
                        background: #f1f1f1;
                        border-radius: 4px;
                        margin: 0 1px;
                    }
                    
                    .experience-scroll-outer::-webkit-scrollbar-thumb {
                        background: #666;
                        border-radius: 4px;
                    }
                    
                    .experience-scroll-outer::-webkit-scrollbar-thumb:hover {
                        background: #555;
                    }
                    
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
                `}
            </style>
            
            {!hasRequiredProps && (
                <div style={{ 
                    padding: '20px', 
                    backgroundColor: '#ffebee', 
                    color: '#c62828', 
                    borderRadius: '8px', 
                    margin: '20px',
                    textAlign: 'center'
                }}>
                    <strong>Error:</strong> ExperienceSection is missing required props. Please check the console for details.
                </div>
            )}
            
            <Accordion
                title="Select Experience"
                id="experience"
                activeAccordion={activeAccordion}
                setActiveAccordion={setActiveAccordion}
            >
            {isMobile ? (
                // Mobile: horizontal layout with horizontal scrolling
                <div className="experience-scroll-outer" style={{ 
                    width: '100%', 
                    padding: '0 8px',
                    margin: '0 -8px'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        width: 'max-content',
                        padding: '0 8px'
                    }}>
                        {filteredExperiences && filteredExperiences.length > 0 ? filteredExperiences.map((experience, index) => (
                            <div key={index} style={{ 
                                background: '#fff', 
                                borderRadius: 12, 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
                                width: '260px',
                                minWidth: '260px',
                                flexShrink: 0,
                                padding: 0, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                overflow: 'hidden'
                            }}>
                        <img 
                            src={experience.img || '/images/placeholder-experience.svg'} 
                            alt={experience.title} 
                            style={{ width: '100%', height: 120, objectFit: 'cover' }}
                            onError={(e) => {
                                e.target.src = '/images/placeholder-experience.svg';
                            }}
                        />
                        <div style={{ padding: '12px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <h2 style={{ fontSize: 15, fontWeight: 300, margin: 0, marginBottom: 4, color: '#4a4a4a' }}>{experience.title}</h2>
                            <div style={{ borderBottom: '1px solid #e0e0e0', margin: '4px 0 8px 0' }} />
                            <div style={{ fontSize: 12, color: '#444', marginBottom: 8, lineHeight: '1.3', flex: '1' }}>{experience.desc}</div>
                            <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 8 }}>
                                {experience.title === 'Shared Flight' 
                                    ? `From £${experience.price} per person` 
                                    : `From £${experience.price} per flight`}
                            </div>
                            <button
                                style={{
                                    width: '100%',
                                    background: '#03a9f4',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '8px 0',
                                    fontSize: 14,
                                    fontWeight: 300,
                                    cursor: 'pointer',
                                    marginTop: 4,
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
                </div>
            ) : (
                // Desktop: original flexbox layout
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', width: '100%', justifyContent: 'flex-start'}}>
                    {filteredExperiences && filteredExperiences.length > 0 ? filteredExperiences.map((experience, index) => (
                        <div key={index} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', width: 'calc(50% - 10px)', minWidth: '260px', maxWidth: '400px', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: '1' }}>
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
                                <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 12 }}>
                                    {experience.title === 'Shared Flight' 
                                        ? `From £${experience.price} per person` 
                                        : `From £${experience.price} per flight`}
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
            )}
        </Accordion>
        
        {/* Terms & Conditions Modal */}
        {showTermsModal && (
            <div className="modal-overlay" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:2000,display:'flex',justifyContent:'center',alignItems:'center'}}>
                <div className="modal-content" style={{background:'#ffffff',borderRadius:12,maxWidth:720,width:'92%',padding:'20px 24px',boxShadow:'0 10px 40px rgba(0,0,0,0.2)'}}>
                    <div style={{display:'flex',justifyContent:'center',alignItems:'center',marginBottom:12}}>
                        <h4 style={{margin:0,fontSize:20,fontWeight:700,color:'#111827',textAlign:'center'}}>Terms & Conditions</h4>
                    </div>
                    <div style={{maxHeight:360,overflowY:'auto',whiteSpace:'pre-line',color:'#374151',lineHeight:1.6,fontSize:14,border:'1px solid #e5e7eb',borderRadius:8,padding:'12px 14px',background:'#f9fafb'}}>
                        {termsLoading ? 'Loading terms...' : termsContent}
                    </div>
                    <div style={{display:'flex',justifyContent:'center',gap:10,marginTop:16}}>
                        <button 
                            onClick={() => setShowTermsModal(false)}
                            style={{background:'#6b7280',color:'#fff',padding:'8px 14px',borderRadius:8,cursor:'pointer',border:'none'}}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default ExperienceSection;
