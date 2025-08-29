import React, { useState, useEffect } from 'react';
import Accordion from '../Common/Accordion';
import axios from 'axios';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import weekdayMorningImg from '../../../assets/images/category1.jpeg';
import flexibleWeekdayImg from '../../../assets/images/category2.jpeg';
import anyDayFlightImg from '../../../assets/images/category3.jpg';
import { useMemo } from 'react';
import config from '../../../config';

// Custom scrollbar styles
const scrollbarStyles = `
    .voucher-type-scroll-outer {
        overflow-x: auto;
        width: 100%;
        max-width: 100%;
        scrollbar-width: thin;
        scrollbar-color: #666 #f1f1f1;
        -webkit-overflow-scrolling: touch;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar {
        height: 12px;
        width: 12px;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 6px;
        margin: 0 2px;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-thumb {
        background: #666;
        border-radius: 6px;
        border: 2px solid #f1f1f1;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-thumb:hover {
        background: #444;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-corner {
        background: #f1f1f1;
    }
    
    /* Mobile-specific scrollbar styles */
    @media (max-width: 768px) {
        .voucher-type-scroll-outer::-webkit-scrollbar {
            height: 6px;
        }
        .voucher-type-scroll-outer::-webkit-scrollbar-track {
            background: #e0e0e0;
            margin: 0 1px;
        }
        .voucher-type-scroll-outer::-webkit-scrollbar-thumb {
            background: #999;
            border: 1px solid #e0e0e0;
        }
        
        .voucher-type-scroll-outer {
            padding: 0 4px !important;
            margin: 0 -4px !important;
        }
        
        .voucher-type-scroll-outer > div {
            gap: 8px !important;
            padding: 0 4px !important;
        }
    }
    
    @media (max-width: 480px) {
        .voucher-type-scroll-outer::-webkit-scrollbar {
            height: 4px;
        }
        
        .voucher-type-scroll-outer {
            padding: 0 2px !important;
            margin: 0 -2px !important;
        }
        
        .voucher-type-scroll-outer > div {
            gap: 6px !important;
            padding: 0 2px !important;
        }
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideInLeft {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

const VoucherType = ({ 
    activeAccordion, 
    setActiveAccordion = () => {}, 
    selectedVoucherType, 
    setSelectedVoucherType,
    activitySelect,
    chooseFlightType,
    chooseLocation,
    selectedActivity
}) => {
    const API_BASE_URL = config.API_BASE_URL;
    const [quantities, setQuantities] = useState({});
    const [showTerms, setShowTerms] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [availableVoucherTypes, setAvailableVoucherTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locationPricing, setLocationPricing] = useState({});
    const [currentViewIndex, setCurrentViewIndex] = useState(0);
    const [showTwoVouchers, setShowTwoVouchers] = useState(true);
    const [slideDirection, setSlideDirection] = useState('right');
    const [allVoucherTypes, setAllVoucherTypes] = useState([]);
    const [allVoucherTypesLoading, setAllVoucherTypesLoading] = useState(true);
    const [privateCharterVoucherTypes, setPrivateCharterVoucherTypes] = useState([]);
    const [privateCharterVoucherTypesLoading, setPrivateCharterVoucherTypesLoading] = useState(true);
    const [termsContent, setTermsContent] = useState('');
    const [termsLoading, setTermsLoading] = useState(false);
    const [activityData, setActivityData] = useState(null);
    const [activityDataLoading, setActivityDataLoading] = useState(false);

    // Mobile breakpoint
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 576);
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Keep layout sensible per device and experience type
    useEffect(() => {
        if (isMobile) {
            setShowTwoVouchers(false);
        } else {
            // For Private Charter, show two vouchers if available
            if (chooseFlightType?.type === "Private Charter") {
                // Check if we have active private charter voucher types available
                const activePrivateCharterVoucherTypes = privateCharterVoucherTypes.filter(vt => vt.is_active === 1);
                if (activePrivateCharterVoucherTypes && activePrivateCharterVoucherTypes.length >= 2) {
                    // Always start with two vouchers view for Private Charter
                    setShowTwoVouchers(true);
                    setCurrentViewIndex(0);
                    console.log('VoucherType: Setting Private Charter to show two vouchers (active count:', activePrivateCharterVoucherTypes.length, ')');
                    console.log('VoucherType: Available voucher types:', activePrivateCharterVoucherTypes.map(vt => vt.title));
                    
                    // If there are more than 2 voucher types, we'll show navigation arrows and dots
                    if (activePrivateCharterVoucherTypes.length > 2) {
                        console.log('VoucherType: Private Charter has more than 2 voucher types, navigation arrows and dots will be shown');
                        console.log('VoucherType: Total available:', activePrivateCharterVoucherTypes.length);
                        console.log('VoucherType: Will show first 2 initially, then allow navigation to others');
                    }
                } else if (activePrivateCharterVoucherTypes && activePrivateCharterVoucherTypes.length === 1) {
                    setShowTwoVouchers(false);
                    setCurrentViewIndex(0);
                    console.log('VoucherType: Setting Private Charter to show single voucher (active count:', activePrivateCharterVoucherTypes.length, ')');
                } else {
                    setShowTwoVouchers(false);
                    setCurrentViewIndex(0);
                    console.log('VoucherType: Setting Private Charter to show no vouchers (active count:', activePrivateCharterVoucherTypes.length, ')');
                }
            } else {
                // For Shared Flight, default to two vouchers
                setShowTwoVouchers(true);
                setCurrentViewIndex(0);
                console.log('VoucherType: Setting Shared Flight to show two vouchers');
            }
        }
    }, [isMobile, chooseFlightType?.type, privateCharterVoucherTypes, availableVoucherTypes]);

    // Fetch all voucher types from API
    useEffect(() => {
        const fetchAllVoucherTypes = async () => {
            try {
                setAllVoucherTypesLoading(true);
                console.log('Fetching regular voucher types from:', `${API_BASE_URL}/api/voucher-types`);
                
                const response = await fetch(`${API_BASE_URL}/api/voucher-types`);
                console.log('Regular voucher types response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Regular voucher types data:', data);
                    
                    if (data.success) {
                        setAllVoucherTypes(data.data);
                        
                        // Initialize quantities and pricing from API data
                        const newQuantities = {};
                        const newPricing = {};
                        
                        data.data.forEach(vt => {
                            newQuantities[vt.title] = 2;
                            newPricing[vt.title.toLowerCase().replace(/\s+/g, '_') + '_price'] = parseFloat(vt.price_per_person);
                        });
                        
                        setQuantities(newQuantities);
                        setLocationPricing(newPricing);
                        
                        console.log('Regular voucher types loaded successfully:', data.data.length, 'types');
                    } else {
                        console.error('Regular voucher types API returned success: false:', data);
                    }
                } else {
                    console.error('Failed to fetch regular voucher types. Status:', response.status);
                }
            } catch (error) {
                console.error('Error fetching regular voucher types:', error);
            } finally {
                setAllVoucherTypesLoading(false);
            }
        };

        fetchAllVoucherTypes();
    }, [API_BASE_URL]);

    // Fetch private charter voucher types from API
    useEffect(() => {
        const fetchPrivateCharterVoucherTypes = async () => {
            try {
                setPrivateCharterVoucherTypesLoading(true);
                console.log('Fetching private charter voucher types from:', `${API_BASE_URL}/api/private-charter-voucher-types`);
                
                // Get only active private charter voucher types for frontend display
                const response = await fetch(`${API_BASE_URL}/api/private-charter-voucher-types?active=true`);
                console.log('Private charter voucher types response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Private charter voucher types data:', data);
                    
                    if (data.success) {
                        setPrivateCharterVoucherTypes(data.data);
                        
                        // Initialize quantities for private charter voucher types
                        const newQuantities = { ...quantities };
                        data.data.forEach(vt => {
                            newQuantities[vt.title] = 2;
                        });
                        setQuantities(newQuantities);
                        
                        console.log('Private charter voucher types loaded successfully:', data.data.length, 'types');
                    } else {
                        console.error('Private charter voucher types API returned success: false:', data);
                    }
                } else {
                    console.error('Failed to fetch private charter voucher types. Status:', response.status);
                }
            } catch (error) {
                console.error('Error fetching private charter voucher types:', error);
            } finally {
                setPrivateCharterVoucherTypesLoading(false);
            }
        };

        fetchPrivateCharterVoucherTypes();
    }, [API_BASE_URL]);

    // Fetch available voucher types for the selected location
    useEffect(() => {
        const fetchVoucherTypes = async () => {
            if (!chooseLocation) {
                setAvailableVoucherTypes([]);
                return;
            }
            
            setLoading(true);
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/locationVoucherTypes/${encodeURIComponent(chooseLocation)}`);
                if (response.data.success) {
                    setAvailableVoucherTypes(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching voucher types:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVoucherTypes();
    }, [chooseLocation]);

    // Update locationPricing when selectedActivity changes
    useEffect(() => {
        console.log('VoucherType: selectedActivity changed:', selectedActivity);
        if (selectedActivity && selectedActivity.length > 0) {
            const activity = selectedActivity[0];
            const newPricing = {
                weekday_morning_price: parseFloat(activity.weekday_morning_price) || 180,
                flexible_weekday_price: parseFloat(activity.flexible_weekday_price) || 200,
                any_day_flight_price: parseFloat(activity.any_day_flight_price) || 220
            };
            console.log('VoucherType: Setting locationPricing from activity:', newPricing);
            setLocationPricing(newPricing);
        } else {
            // Fallback to default pricing
            const defaultPricing = {
                weekday_morning_price: 180,
                flexible_weekday_price: 200,
                any_day_flight_price: 220
            };
            console.log('VoucherType: Using default pricing:', defaultPricing);
            setLocationPricing(defaultPricing);
        }
    }, [selectedActivity]);

    // Fetch activity data to get individual pricing for private charter voucher types
    useEffect(() => {
        const fetchActivityData = async () => {
            if (!chooseLocation) {
                setActivityData(null);
                return;
            }
            
            setActivityDataLoading(true);
            try {
                const response = await axios.get(`${API_BASE_URL}/api/activities/flight-types?location=${encodeURIComponent(chooseLocation)}`);
                if (response.data.success && response.data.data.length > 0) {
                    // Get the first activity for this location
                    const activity = response.data.data[0];
                    setActivityData(activity);
                    console.log('VoucherType: Activity data loaded:', activity);
                    console.log('VoucherType: Private charter pricing field:', activity.private_charter_pricing);
                    console.log('VoucherType: Private charter pricing type:', typeof activity.private_charter_pricing);
                    console.log('VoucherType: Shared flight pricing fields:', {
                        weekday_morning_price: activity.weekday_morning_price,
                        flexible_weekday_price: activity.flexible_weekday_price,
                        any_day_flight_price: activity.any_day_flight_price,
                        shared_flight_from_price: activity.shared_flight_from_price
                    });
                } else {
                    console.log('VoucherType: No activity data found for location:', chooseLocation);
                }
            } catch (error) {
                console.error('Error fetching activity data:', error);
            } finally {
                setActivityDataLoading(false);
            }
        };

        fetchActivityData();
    }, [chooseLocation]);

    const voucherTypes = useMemo(() => {
        // Determine which voucher types to show based on selected experience
        const isPrivateCharter = chooseFlightType?.type === "Private Charter";
        
        console.log('VoucherType: voucherTypes useMemo triggered');
        console.log('VoucherType: chooseFlightType:', chooseFlightType);
        console.log('VoucherType: isPrivateCharter:', isPrivateCharter);
        console.log('VoucherType: allVoucherTypes count:', allVoucherTypes.length);
        console.log('VoucherType: privateCharterVoucherTypes count:', privateCharterVoucherTypes.length);
        
        if (isPrivateCharter) {
            // For Private Charter, show only active private charter voucher types
            if (privateCharterVoucherTypesLoading || privateCharterVoucherTypes.length === 0) {
                console.log('VoucherType: Private Charter - no voucher types available yet');
                return [];
            }
            
            // Filter only active private charter voucher types
            const activePrivateCharterVoucherTypes = privateCharterVoucherTypes.filter(vt => vt.is_active === 1);
            
            if (activePrivateCharterVoucherTypes.length === 0) {
                console.log('VoucherType: Private Charter - no active voucher types available');
                return [];
            }
            
            console.log('VoucherType: Creating private charter voucher types with locationPricing:', locationPricing);
            console.log('VoucherType: All Private Charter voucher types count:', privateCharterVoucherTypes.length);
            console.log('VoucherType: Active Private Charter voucher types count:', activePrivateCharterVoucherTypes.length);
            console.log('VoucherType: Active Private Charter voucher types:', activePrivateCharterVoucherTypes.map(vt => vt.title));
            
            const privateVouchers = activePrivateCharterVoucherTypes.map(vt => {
                console.log(`VoucherType: Processing voucher type: ${vt.title} (ID: ${vt.id})`);
                
                // Parse features from JSON string
                let features = [];
                try {
                    features = JSON.parse(vt.features || '[]');
                } catch (e) {
                    // Default features for private charter
                    features = ['Private Balloon', 'Flexible Timing', 'Personalized Experience', 'Complimentary Drinks', 'Professional Photos', '3D Flight Track'];
                }

                // For private charter, use the individual pricing from activity data
                let basePrice = 300; // Default fallback base price per person
                let priceUnit = 'pp'; // Default to per person pricing
                
                console.log(`VoucherType: Processing pricing for ${vt.title} (ID: ${vt.id})`);
                console.log(`VoucherType: Activity data available:`, !!activityData);
                console.log(`VoucherType: Private charter pricing available:`, !!(activityData && activityData.private_charter_pricing));
                
                if (activityData && activityData.private_charter_pricing) {
                    try {
                        let pricingData = activityData.private_charter_pricing;
                        if (typeof pricingData === 'string') {
                            pricingData = JSON.parse(pricingData);
                        }
                        
                        console.log(`VoucherType: Parsed pricing data:`, pricingData);
                        console.log(`VoucherType: Looking for pricing for voucher ID: ${vt.id}`);
                        
                        // Try both string and number keys for the voucher type ID
                        const voucherId = vt.id;
                        const stringId = voucherId.toString();
                        
                        if (pricingData && (pricingData[voucherId] || pricingData[stringId])) {
                            basePrice = parseFloat(pricingData[voucherId] || pricingData[stringId]);
                            priceUnit = 'pp'; // This is base price per person
                            console.log(`VoucherType: Using individual pricing for ${vt.title}: £${basePrice} per person`);
                        } else {
                            console.log(`VoucherType: No individual pricing found for ${vt.title} (ID: ${voucherId}), using default: £${basePrice} per person`);
                            console.log(`VoucherType: Available pricing keys:`, Object.keys(pricingData || {}));
                        }
                    } catch (e) {
                        console.error('Error parsing private charter pricing:', e);
                        console.log(`VoucherType: Using default pricing due to parsing error: £${basePrice} per person`);
                    }
                } else {
                    console.log(`VoucherType: No activity data or pricing available for ${vt.title}, using default: £${basePrice} per person`);
                }
                
                // Calculate total price for 2 passengers (default) to show in the card
                const defaultPassengers = 2;
                const totalPrice = basePrice * defaultPassengers;

                // Handle image URL properly - check if it's a full URL or relative path
                let imageUrl = weekdayMorningImg; // Default fallback
                if (vt.image_url) {
                    if (vt.image_url.startsWith('http')) {
                        imageUrl = vt.image_url;
                    } else if (vt.image_url.startsWith('/uploads/')) {
                        imageUrl = `${API_BASE_URL}${vt.image_url}`;
                    } else {
                        imageUrl = `${API_BASE_URL}/uploads/experiences/${vt.image_url}`;
                    }
                }

                console.log(`VoucherType: Private Charter ${vt.title} - API price: ${vt.price_per_person}, Price unit: ${priceUnit}, Image: ${imageUrl}`);

                return {
                    id: vt.id,
                    title: vt.title,
                    description: vt.description || 'Exclusive private balloon experience for your group. Perfect for special occasions and intimate groups.',
                    image: imageUrl,
                    refundability: 'Non-Refundable',
                    availability: vt.flight_days || 'Any Day',
                    validity: `Valid: ${vt.validity_months || 18} Months`,
                    inclusions: features,
                    weatherClause: vt.terms && vt.terms.trim() !== '' ? vt.terms : 'Private charters subject to weather conditions. Your voucher remains valid and re-bookable within its validity period if cancelled due to weather.',
                    price: totalPrice, // Show total price for default passengers
                    basePrice: basePrice, // Store base price per person for calculations
                    priceUnit: priceUnit,
                    maxPassengers: vt.max_passengers || 8,
                    flightTime: vt.flight_time || 'AM & PM'
                };
            });
            
            console.log('VoucherType: Private Charter voucher types created:', privateVouchers.length);
            console.log('VoucherType: Final Private Charter pricing:', privateVouchers.map(vt => ({ title: vt.title, price: vt.price, priceUnit: vt.priceUnit })));
            console.log('VoucherType: Private Charter voucher types for selection:', privateVouchers);
            console.log('VoucherType: Private Charter - returning voucher types for display');
            return privateVouchers;
        } else {
            // For Shared Flight, show regular voucher types
            if (allVoucherTypesLoading || allVoucherTypes.length === 0) {
                console.log('VoucherType: Shared Flight - no voucher types available yet');
                return [];
            }

            console.log('VoucherType: Creating regular voucher types with activityData:', activityData);
            console.log('VoucherType: Creating regular voucher types with locationPricing (fallback):', locationPricing);
            console.log('VoucherType: Shared Flight voucher types count:', allVoucherTypes.length);
            console.log('VoucherType: Shared Flight voucher types:', allVoucherTypes.map(vt => vt.title));

            const regularVouchers = allVoucherTypes.map(vt => {
                // Parse features from JSON string
                let features = [];
                try {
                    features = JSON.parse(vt.features || '[]');
                } catch (e) {
                    features = ['Around 1 Hour of Air Time', 'Complimentary Drink', 'Inflight Photos and 3D Flight Track'];
                }

                // Get pricing from activity data (activity popup) based on voucher type title
                let price = 0;
                if (activityData) {
                    console.log(`VoucherType: Shared Flight - Using activity data for ${vt.title}:`, {
                        weekday_morning_price: activityData.weekday_morning_price,
                        flexible_weekday_price: activityData.flexible_weekday_price,
                        any_day_flight_price: activityData.any_day_flight_price
                    });
                    
                    if (vt.title.toLowerCase().includes('weekday morning')) {
                        price = parseFloat(activityData.weekday_morning_price) || 180;
                    } else if (vt.title.toLowerCase().includes('flexible weekday')) {
                        price = parseFloat(activityData.flexible_weekday_price) || 200;
                    } else if (vt.title.toLowerCase().includes('any day flight')) {
                        price = parseFloat(activityData.any_day_flight_price) || 220;
                    } else {
                        // Fallback to API pricing if no match found
                        price = parseFloat(vt.price_per_person) || 180;
                    }
                } else {
                    // Fallback to locationPricing if no activity data available
                    if (locationPricing) {
                        if (vt.title.toLowerCase().includes('weekday morning')) {
                            price = locationPricing.weekday_morning_price || 180;
                        } else if (vt.title.toLowerCase().includes('flexible weekday')) {
                            price = locationPricing.flexible_weekday_price || 200;
                        } else if (vt.title.toLowerCase().includes('any day flight')) {
                            price = locationPricing.any_day_flight_price || 220;
                        } else {
                            price = parseFloat(vt.price_per_person) || 180;
                        }
                    } else {
                        // Final fallback to API pricing
                        price = parseFloat(vt.price_per_person) || 180;
                    }
                }

                // Handle image URL properly - check if it's a full URL or relative path
                let imageUrl = weekdayMorningImg; // Default fallback
                if (vt.image_url) {
                    if (vt.image_url.startsWith('http')) {
                        imageUrl = vt.image_url;
                    } else if (vt.image_url.startsWith('/uploads/')) {
                        imageUrl = `${API_BASE_URL}${vt.image_url}`;
                    } else {
                        imageUrl = `${API_BASE_URL}/uploads/experiences/${vt.image_url}`;
                    }
                }

                console.log(`VoucherType: Regular ${vt.title} - API price: ${vt.price_per_person}, Activity price: ${price}, Image: ${imageUrl}`);

                return {
                    id: vt.id,
                    title: vt.title,
                    description: vt.description || 'No description available',
                    image: imageUrl,
                    refundability: 'Non-Refundable',
                    availability: vt.flight_days || 'Monday - Friday',
                    validity: `Valid: ${vt.validity_months || 18} Months`,
                    inclusions: features,
                    weatherClause: vt.terms && vt.terms.trim() !== '' ? vt.terms : 'Flights subject to weather – your voucher will remain valid and re-bookable within its validity period if cancelled due to weather.',
                    price: price,
                    priceUnit: 'pp',
                    maxPassengers: vt.max_passengers || 8,
                    flightTime: vt.flight_time || 'AM'
                };
            });
            
            console.log('VoucherType: Regular voucher types created:', regularVouchers.length);
            console.log('VoucherType: Final Shared Flight pricing:', regularVouchers.map(vt => ({ title: vt.title, price: vt.price, priceUnit: vt.priceUnit })));
            console.log('VoucherType: Shared Flight - returning voucher types for display');
            return regularVouchers;
        }
    }, [allVoucherTypes, allVoucherTypesLoading, privateCharterVoucherTypes, privateCharterVoucherTypesLoading, locationPricing, chooseFlightType?.type, activityData]);

    // Remove the duplicate privateCharterVoucherTypesMemo since it's now integrated into voucherTypes

    const handleQuantityChange = (voucherTitle, value) => {
        // For Private Charter, only allow specific passenger counts: 2, 3, 4, 8
        if (chooseFlightType?.type === "Private Charter") {
            const allowedPassengers = [2, 3, 4, 8];
            let newValue = parseInt(value) || 2;
            
            // If it's a manual input, find the closest allowed value
            if (typeof value === 'string' || typeof value === 'number') {
                newValue = parseInt(value) || 2;
                // Find the closest allowed passenger count
                let closest = allowedPassengers[0];
                let minDiff = Math.abs(newValue - closest);
                
                for (let allowed of allowedPassengers) {
                    const diff = Math.abs(newValue - allowed);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closest = allowed;
                    }
                }
                newValue = closest;
            }
            
            console.log(`Private Charter quantity change for ${voucherTitle}: ${newValue} passengers`);
            
            setQuantities(prev => ({
                ...prev,
                [voucherTitle]: newValue
            }));
        } else {
            // For other flight types, use the original logic
            setQuantities(prev => ({
                ...prev,
                [voucherTitle]: Math.max(1, parseInt(value) || 1)
            }));
        }
    };

    // Helper function to get next/previous allowed passenger count for Private Charter
    const getNextAllowedPassenger = (currentValue, direction) => {
        if (chooseFlightType?.type !== "Private Charter") {
            return direction === 'next' ? currentValue + 1 : currentValue - 1;
        }
        
        const allowedPassengers = [2, 3, 4, 8];
        const currentIndex = allowedPassengers.indexOf(currentValue);
        
        if (direction === 'next') {
            // Find next allowed value, wrap around to first if at end
            if (currentIndex === -1 || currentIndex === allowedPassengers.length - 1) {
                return allowedPassengers[0];
            }
            return allowedPassengers[currentIndex + 1];
        } else {
            // Find previous allowed value, wrap around to last if at beginning
            if (currentIndex === -1 || currentIndex === 0) {
                return allowedPassengers[allowedPassengers.length - 1];
            }
            return allowedPassengers[currentIndex - 1];
        }
    };

    const handlePrevVoucher = () => {
        setSlideDirection('left');
        if (chooseFlightType?.type === "Private Charter") {
            // For Private Charter, cycle through available voucher types
            const activePrivateCharterVoucherTypes = privateCharterVoucherTypes.filter(vt => vt.is_active === 1);
            console.log('Private Charter Prev - Active voucher types:', activePrivateCharterVoucherTypes.length, 'Current showTwoVouchers:', showTwoVouchers, 'Current index:', currentViewIndex);
            
            if (activePrivateCharterVoucherTypes.length >= 4) {
                // 4 or more voucher types - cycle through them
                if (showTwoVouchers) {
                    setShowTwoVouchers(false);
                    setCurrentViewIndex(2); // Move to third voucher
                    console.log('Moving to third voucher (index 2)');
                } else if (currentViewIndex === 2) {
                    setShowTwoVouchers(false);
                    setCurrentViewIndex(3); // Move to fourth voucher
                    console.log('Moving to fourth voucher (index 3)');
                } else if (currentViewIndex === 3) {
                    setShowTwoVouchers(true);
                    setCurrentViewIndex(0); // Back to first two vouchers
                    console.log('Moving back to first two vouchers (index 0)');
                } else {
                    setShowTwoVouchers(true);
                    setCurrentViewIndex(0);
                    console.log('Moving back to first two vouchers (index 0)');
                }
            } else if (activePrivateCharterVoucherTypes.length >= 3) {
                // 3 voucher types - cycle through them
                if (showTwoVouchers) {
                    setShowTwoVouchers(false);
                    setCurrentViewIndex(2); // Move to third voucher
                    console.log('Moving to third voucher (index 2)');
                } else {
                    setShowTwoVouchers(true);
                    setCurrentViewIndex(0); // Back to first two vouchers
                    console.log('Moving back to first two vouchers (index 0)');
                }
            } else if (activePrivateCharterVoucherTypes.length > 1) {
                // Only 2 voucher types, just toggle between single and two-voucher view
                setShowTwoVouchers(!showTwoVouchers);
                setCurrentViewIndex(0);
                console.log('Toggling between single and two-voucher view');
            }
        } else {
            // For Shared Flight, use original logic
            setShowTwoVouchers(true);
            setCurrentViewIndex(0);
        }
    };

    const handleNextVoucher = () => {
        setSlideDirection('right');
        if (chooseFlightType?.type === "Private Charter") {
            // For Private Charter, cycle through available voucher types
            const activePrivateCharterVoucherTypes = privateCharterVoucherTypes.filter(vt => vt.is_active === 1);
            console.log('Private Charter Next - Active voucher types:', activePrivateCharterVoucherTypes.length, 'Current showTwoVouchers:', showTwoVouchers, 'Current index:', currentViewIndex);
            
            if (activePrivateCharterVoucherTypes.length >= 4) {
                // 4 or more voucher types - cycle through them
                if (showTwoVouchers) {
                    setShowTwoVouchers(false);
                    setCurrentViewIndex(2); // Move to third voucher
                    console.log('Moving to third voucher (index 2)');
                } else if (currentViewIndex === 2) {
                    setShowTwoVouchers(false);
                    setCurrentViewIndex(3); // Move to fourth voucher
                    console.log('Moving to fourth voucher (index 3)');
                } else if (currentViewIndex === 3) {
                    setShowTwoVouchers(true);
                    setCurrentViewIndex(0); // Back to first two vouchers
                    console.log('Moving back to first two vouchers (index 0)');
                } else {
                    setShowTwoVouchers(true);
                    setCurrentViewIndex(0);
                    console.log('Moving back to first two vouchers (index 0)');
                }
            } else if (activePrivateCharterVoucherTypes.length >= 3) {
                // 3 voucher types - cycle through them
                if (showTwoVouchers) {
                    setShowTwoVouchers(false);
                    setCurrentViewIndex(2); // Move to third voucher
                    console.log('Moving to third voucher (index 2)');
                } else {
                    setShowTwoVouchers(true);
                    setCurrentViewIndex(0); // Back to first two vouchers
                    console.log('Moving back to first two vouchers (index 0)');
                }
            } else if (activePrivateCharterVoucherTypes.length > 1) {
                // Only 2 voucher types, just toggle between single and two-voucher view
                setShowTwoVouchers(!showTwoVouchers);
                setCurrentViewIndex(0);
                console.log('Toggling between single and two-voucher view');
            }
        } else {
            // For Shared Flight, use original logic
            const filteredVouchers = voucherTypes.filter(voucher => 
                availableVoucherTypes.length === 0 || availableVoucherTypes.includes(voucher.title)
            );
            
            if (showTwoVouchers) {
                setShowTwoVouchers(false);
                setCurrentViewIndex(2); // Move to third voucher (Any Day Flight)
            } else {
                setShowTwoVouchers(true);
                setCurrentViewIndex(0);
            }
        }
    };

    const handleSelectVoucher = async (voucher) => {
        const quantity = quantities[voucher.title];
        
        console.log('VoucherType: handleSelectVoucher called with:', voucher);
        console.log('VoucherType: Quantity for', voucher.title, ':', quantity);
        
        // Calculate total price based on price unit and experience type
        let totalPrice;
        if (chooseFlightType?.type === "Private Charter" && voucher.basePrice) {
            // For Private Charter, use basePrice per person
            totalPrice = voucher.basePrice * quantity;
            console.log('VoucherType: Private Charter pricing:', voucher.basePrice, '×', quantity, '=', totalPrice);
        } else if (voucher.priceUnit === 'total') {
            // For total pricing, the price is already the total for the group
            totalPrice = voucher.price;
            console.log('VoucherType: Using total pricing:', totalPrice);
        } else {
            // For per-person pricing, multiply by quantity
            totalPrice = voucher.price * quantity;
            console.log('VoucherType: Using per-person pricing:', voucher.price, '×', quantity, '=', totalPrice);
        }
        
        const voucherWithQuantity = {
            ...voucher,
            quantity: quantity,
            totalPrice: totalPrice
        };
        
        console.log('VoucherType: Created voucherWithQuantity:', voucherWithQuantity);
        setSelectedVoucher(voucherWithQuantity);
        
        // Fetch Terms & Conditions for this voucher type from backend Settings
        try {
            setTermsLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/terms-and-conditions`);
            if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    // Find active terms mapped to this voucher type. Prefer lowest sort_order, then newest.
                    const matches = json.data.filter(t => {
                        try {
                            if (t.voucher_type_id && Number(t.voucher_type_id) === Number(voucher.id)) {
                                return (t.is_active === 1 || t.is_active === true);
                            }
                            const ids = t.voucher_type_ids ? JSON.parse(t.voucher_type_ids) : [];
                            return Array.isArray(ids) && ids.map(Number).includes(Number(voucher.id)) && (t.is_active === 1 || t.is_active === true);
                        } catch { return false; }
                    }).sort((a,b) => {
                        const so = (a.sort_order ?? 0) - (b.sort_order ?? 0);
                        if (so !== 0) return so;
                        return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
                    });
                    const content = matches[0]?.content || '';
                    setTermsContent(content);
                }
            }
        } catch (e) {
            setTermsContent(voucher.weatherClause || '');
        } finally {
            setTermsLoading(false);
            setShowTerms(true);
        }
    };

    // Remove the condition that hides VoucherType for Private Charter
    // Both Shared Flight and Private Charter should be able to access voucher types

    return (
        <>
            <style>{scrollbarStyles}</style>
            <Accordion
                title="Voucher Type"
                id="voucher-type"
                activeAccordion={activeAccordion}
                setActiveAccordion={setActiveAccordion}
            >
                {showTerms && selectedVoucher && (
                    <div className="modal-overlay" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:2000,display:'flex',justifyContent:'center',alignItems:'center'}}>
                        <div className="modal-content" style={{background:'#ffffff',borderRadius:12,maxWidth:720,width:'92%',padding:'20px 24px',boxShadow:'0 10px 40px rgba(0,0,0,0.2)'}}>
                            <div style={{display:'flex',justifyContent:'center',alignItems:'center',marginBottom:12}}>
                                <h4 style={{margin:0,fontSize:20,fontWeight:700,color:'#111827',textAlign:'center'}}>Terms & Conditions</h4>
                            </div>
                            <div style={{maxHeight:360,overflowY:'auto',whiteSpace:'pre-line',color:'#374151',lineHeight:1.6,fontSize:14,border:'1px solid #e5e7eb',borderRadius:8,padding:'12px 14px',background:'#f9fafb'}}>
                                {termsLoading ? 'Loading terms...' : (termsContent || selectedVoucher?.weatherClause || '')}
                            </div>
                            <div style={{display:'flex',justifyContent:'center',gap:10,marginTop:16}}>
                                <button onClick={() => { setShowTerms(false); }} style={{border:'1px solid #d1d5db',background:'#fff',color:'#374151',padding:'8px 14px',borderRadius:8,cursor:'pointer'}}>Choose Different Voucher</button>
                                <button onClick={() => { 
                                    console.log('VoucherType: Confirm button clicked, setting selectedVoucherType:', selectedVoucher);
                                    setSelectedVoucherType(selectedVoucher); 
                                    setActiveAccordion(null); 
                                    setShowTerms(false); 
                                }} style={{background:'#10b981',color:'#fff',padding:'8px 14px',borderRadius:8,cursor:'pointer',border:'none'}} disabled={termsLoading}>Confirm</button>
                            </div>
                        </div>
                    </div>
                )}
                <div style={{ position: 'relative', width: '100%' }}>
                    {/* Navigation Arrows - hidden on mobile */}
                    {(() => {
                        if (isMobile) return null;
                        const filteredVouchers = voucherTypes.filter(voucher => 
                            availableVoucherTypes.length === 0 || availableVoucherTypes.includes(voucher.title)
                        );
                        
                                                        // For Private Charter, show navigation if there are multiple active voucher types
                        const shouldShowNavigation = chooseFlightType?.type === "Private Charter" ? 
                            (filteredVouchers.length > 1) : 
                            (filteredVouchers.length > 1);
                        
                        console.log('VoucherType: Navigation visibility check:', {
                            experienceType: chooseFlightType?.type,
                            filteredVouchersLength: filteredVouchers.length,
                            shouldShowNavigation: shouldShowNavigation,
                            filteredVouchers: filteredVouchers.map(v => ({ title: v.title, is_active: v.is_active }))
                        });
                        
                        if (!shouldShowNavigation) return null;
                        
                        return (
                            <>
                                {/* Show left arrow if not in two-voucher view or for Private Charter with multiple options */}
                                {(!showTwoVouchers || (chooseFlightType?.type === "Private Charter" && filteredVouchers.length > 2)) && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        left: 20, 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        zIndex: 10,
                                        background: 'rgba(255,255,255,0.9)',
                                        borderRadius: '50%',
                                        width: 40,
                                        height: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        border: '1px solid #ddd',
                                        transition: 'all 0.2s ease'
                                    }} onClick={handlePrevVoucher}>
                                        <ArrowBackIosIcon style={{ 
                                            fontSize: 20, 
                                            color: '#666',
                                            marginLeft: 5 // optical centering to match forward button
                                        }} />
                                    </div>
                                )}
                                {/* Show right arrow if there are more voucher types to show */}
                                {((showTwoVouchers && filteredVouchers.length > 2) || 
                                  (chooseFlightType?.type === "Private Charter" && filteredVouchers.length > 2)) && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        right: 20, 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        zIndex: 10,
                                        background: 'rgba(255,255,255,0.9)',
                                        borderRadius: '50%',
                                        width: 40,
                                        height: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        border: '1px solid #ddd',
                                        transition: 'all 0.2s ease'
                                    }} onClick={handleNextVoucher}>
                                        <ArrowForwardIosIcon style={{ fontSize: 20, color: '#666' }} />
                                    </div>
                                )}
                            </>
                        );
                    })()}
                    
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: isMobile ? '16px' : '40px 60px',
                            minHeight: isMobile ? 'auto' : '400px',
                            position: 'relative',
                            width: '100%',
                            maxWidth: 1080,
                            margin: '0 auto',
                            boxSizing: 'border-box'
                        }}
                    >
                        {loading || allVoucherTypesLoading || (chooseFlightType?.type === "Private Charter" && privateCharterVoucherTypesLoading) ? (
                            <div style={{ textAlign: 'center', width: '100%', padding: '20px' }}>
                                <p>Loading voucher types...</p>
                            </div>
                        ) : voucherTypes
                            .filter(voucher => {
                                // For Private Charter, don't apply location filtering since they're generally available everywhere
                                if (chooseFlightType?.type === "Private Charter") {
                                    return true; // Show all private charter voucher types
                                }
                                // For Shared Flight, apply location filtering
                                return availableVoucherTypes.length === 0 || availableVoucherTypes.includes(voucher.title);
                            })
                            .length > 0 ? (
                            (() => {
                                const filteredVouchers = voucherTypes.filter(voucher => {
                                    // For Private Charter, don't apply location filtering since they're generally available everywhere
                                    // But ensure we only show active voucher types
                                    if (chooseFlightType?.type === "Private Charter") {
                                        const isActive = voucher.is_active !== false;
                                        console.log(`Private Charter voucher ${voucher.title} (ID: ${voucher.id}) - is_active:`, voucher.is_active, 'Filtered:', isActive);
                                        return isActive; // Show active private charter voucher types
                                    }
                                    // For Shared Flight, apply location filtering
                                    return availableVoucherTypes.length === 0 || availableVoucherTypes.includes(voucher.title);
                                });
                                
                                console.log('VoucherType: Available voucher types for location:', availableVoucherTypes);
                                console.log('VoucherType: All voucher types:', voucherTypes.map(v => ({ title: v.title, id: v.id, is_active: v.is_active })));
                                console.log('VoucherType: Filtered voucher types:', filteredVouchers.map(v => ({ title: v.title, id: v.id, is_active: v.is_active })));
                                console.log('VoucherType: Experience type:', chooseFlightType?.type);
                                console.log('VoucherType: Private Charter voucher types from API:', privateCharterVoucherTypes.map(vt => ({ title: vt.title, id: vt.id, is_active: vt.is_active })));
                                
                                // Mobile: horizontal layout with horizontal scrolling
                                if (isMobile) {
                                    return (
                                        <div className="voucher-type-scroll-outer" style={{ 
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
                                                {filteredVouchers.map((voucher) => (
                                                    <div key={voucher.id} style={{
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
                                                            src={voucher.image}
                                                            alt={voucher.title}
                                                            style={{ width: '100%', height: 120, objectFit: 'cover' }}
                                                        />
                                                        <div style={{ padding: '10px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                            <h3 style={{ fontSize: 15, fontWeight: 300, margin: 0, marginBottom: 3, color: '#4a4a4a' }}>{voucher.title}</h3>
                                                            <div style={{ fontSize: 13, color: '#666', marginBottom: 4, lineHeight: '1.2', fontStyle: 'italic' }}>{voucher.description}</div>
                                                            <div style={{ fontSize: 13, color: '#666', marginBottom: 3, fontWeight: 600 }}>{voucher.refundability}</div>
                                                            <div style={{ fontSize: 13, color: '#666', marginBottom: 3, fontWeight: 600 }}>{voucher.availability}</div>
                                                            <div style={{ fontSize: 13, color: '#666', marginBottom: 3, fontWeight: 600 }}>{voucher.flightTime}</div>
                                                            <div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 600 }}>{voucher.validity}</div>
                                                            <ul style={{ paddingLeft: 10, margin: 0, marginBottom: 6, color: '#666', fontSize: 13, lineHeight: '1.2' }}>
                                                                {voucher.inclusions.map((inclusion, i) => (
                                                                    <li key={i} style={{ marginBottom: 1 }}>{inclusion}</li>
                                                                ))}
                                                            </ul>
                                                            <div style={{ fontSize: 13, color: '#666', marginBottom: 6, lineHeight: '1.1' }}>{voucher.weatherClause}</div>
                                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: '4px' }}>
                                                                <label style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Passengers:</label>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuantityChange(voucher.title, getNextAllowedPassenger(parseInt(quantities[voucher.title] || 2, 10), 'prev'))}
                                                                        style={{ padding: '2px 6px', border: '1px solid #ddd', background: '#f9f9f9', borderRadius: 3, cursor: 'pointer' }}
                                                                    >
                                                                        −
                                                                    </button>
                                                                    <input 
                                                                        type="number" 
                                                                        min={chooseFlightType?.type === "Private Charter" ? 2 : 1}
                                                                        max={chooseFlightType?.type === "Private Charter" ? 8 : (voucher.maxPassengers || 8)}
                                                                        value={quantities[voucher.title] || 2} 
                                                                        onChange={(e) => handleQuantityChange(voucher.title, e.target.value)} 
                                                                        style={{ width: '40px', padding: '2px 4px', border: '1px solid #ddd', borderRadius: 3, fontSize: 11, textAlign: 'center' }} 
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuantityChange(voucher.title, getNextAllowedPassenger(parseInt(quantities[voucher.title] || 2, 10), 'next'))}
                                                                        style={{ padding: '2px 6px', border: '1px solid #ddd', background: '#f9f9f9', borderRadius: 3, cursor: 'pointer' }}
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#4a4a4a' }}>
                                                                {chooseFlightType?.type === "Private Charter" && voucher.basePrice ? 
                                                                    `From £${voucher.basePrice} pp` : 
                                                                    (voucher.priceUnit === 'total' ? `£${voucher.price} total` : `From £${voucher.price} pp`)
                                                                }
                                                            </div>
                                                            <button style={{ width: '100%', background: '#03a9f4', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 'auto', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#0288d1'} onMouseLeave={(e) => e.target.style.background = '#03a9f4'} onClick={() => handleSelectVoucher(voucher)}>
                                                                Select
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }

                                // Desktop / tablet: original layout
                                // Show two vouchers side by side (Weekday Morning and Flexible Weekday)
                                // For Private Charter, also show two vouchers side by side if available
                                const shouldShowTwoVouchers = (showTwoVouchers && filteredVouchers.length >= 2) || 
                                    (chooseFlightType?.type === "Private Charter" && filteredVouchers.length >= 2);
                                
                                console.log('VoucherType: Two vouchers layout check:', {
                                    experienceType: chooseFlightType?.type,
                                    showTwoVouchers: showTwoVouchers,
                                    filteredVouchersLength: filteredVouchers.length,
                                    shouldShowTwoVouchers: shouldShowTwoVouchers,
                                    filteredVouchers: filteredVouchers.map(v => ({ title: v.title, is_active: v.is_active }))
                                });
                                
                                if (shouldShowTwoVouchers) {
                                    // For Private Charter, show current view based on showTwoVouchers state
                                    // If showTwoVouchers is true, show first 2 vouchers
                                    // If showTwoVouchers is false, show single voucher at currentViewIndex
                                    let vouchersToShow;
                                    if (chooseFlightType?.type === "Private Charter") {
                                        if (showTwoVouchers) {
                                            // Show first 2 vouchers when in two-voucher view
                                            vouchersToShow = filteredVouchers.slice(0, 2);
                                            console.log('Private Charter: Showing first 2 vouchers:', vouchersToShow.map(v => v.title));
                                        } else {
                                            // Show single voucher at current index when in single-voucher view
                                            vouchersToShow = [filteredVouchers[currentViewIndex]];
                                            console.log('Private Charter: Showing single voucher at index', currentViewIndex, ':', vouchersToShow.map(v => v.title));
                                        }
                                    } else {
                                        // For Shared Flight, always show first 2 vouchers
                                        vouchersToShow = filteredVouchers.slice(0, 2);
                                    }
                                    
                                    console.log('VoucherType: Vouchers to show:', {
                                        experienceType: chooseFlightType?.type,
                                        showTwoVouchers: showTwoVouchers,
                                        currentViewIndex: currentViewIndex,
                                        vouchersToShow: vouchersToShow.map(v => v.title),
                                        totalFilteredVouchers: filteredVouchers.map(v => v.title)
                                    });
                                    
                                    return (
                                        <div style={{
                                            display: 'flex',
                                            gap: '20px',
                                            justifyContent: 'center',
                                            alignItems: 'flex-start',
                                            transition: 'transform 0.3s ease-in-out'
                                        }}>
                                            {vouchersToShow.map((voucher, index) => (
                                                <div key={voucher.id} style={{
                                                    background: '#fff',
                                                    borderRadius: 16,
                                                    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                                                    width: '320px',
                                                    minWidth: '320px',
                                                    flexShrink: 0,
                                                    padding: 0,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    overflow: 'hidden'
                                                }}>
                                                    <img
                                                        src={voucher.image}
                                                        alt={voucher.title}
                                                        style={{
                                                            width: '100%',
                                                            height: 180,
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                    <div style={{
                                                        padding: '16px',
                                                        width: '100%',
                                                        boxSizing: 'border-box',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        height: '100%'
                                                    }}>
                                                        <h3 style={{ fontSize: 18, fontWeight: 300, margin: 0, marginBottom: 6, color: '#4a4a4a' }}>{voucher.title}</h3>
                                                        <div style={{ fontSize: 13, color: '#666', marginBottom: 8, lineHeight: '1.3', fontStyle: 'italic' }}>{voucher.description}</div>
                                                        <div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 600 }}>{voucher.refundability}</div>
                                                        <div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 600 }}>{voucher.availability}</div>
                                                        <div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 600 }}>{voucher.flightTime}</div>
                                                        <div style={{ fontSize: 13, color: '#666', marginBottom: 10, fontWeight: 600 }}>{voucher.validity}</div>
                                                        <ul style={{ paddingLeft: 14, margin: 0, marginBottom: 10, color: '#666', fontSize: 13, lineHeight: '1.3' }}>
                                                            {voucher.inclusions.map((inclusion, i) => (
                                                                <li key={i} style={{ marginBottom: 3 }}>{inclusion}</li>
                                                            ))}
                                                        </ul>
                                                        <div style={{ fontSize: 13, color: '#666', marginBottom: 12, lineHeight: '1.2' }}>{voucher.weatherClause}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: '8px' }}>
                                                            <label style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>Passengers:</label>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuantityChange(voucher.title, getNextAllowedPassenger(parseInt(quantities[voucher.title] || 2, 10), 'prev'))}
                                                                    style={{ padding: '4px 8px', border: '1px solid #ddd', background: '#f9f9f9', borderRadius: 4, cursor: 'pointer' }}
                                                                >
                                                                    −
                                                                </button>
                                                                <input 
                                                                    type="number" 
                                                                    min={chooseFlightType?.type === "Private Charter" ? 2 : 1}
                                                                    max={chooseFlightType?.type === "Private Charter" ? 8 : (voucher.maxPassengers || 8)}
                                                                    value={quantities[voucher.title] || 2} 
                                                                    onChange={(e) => handleQuantityChange(voucher.title, e.target.value)} 
                                                                    style={{ width: '50px', padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, textAlign: 'center' }} 
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuantityChange(voucher.title, getNextAllowedPassenger(parseInt(quantities[voucher.title] || 2, 10), 'next'))}
                                                                    style={{ padding: '4px 8px', border: '1px solid #ddd', background: '#f9f9f9', borderRadius: 4, cursor: 'pointer' }}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10, color: '#4a4a4a' }}>
                                                            {chooseFlightType?.type === "Private Charter" && voucher.basePrice ? 
                                                                `From £${voucher.basePrice} pp` : 
                                                                (voucher.priceUnit === 'total' ? `£${voucher.price} total` : `From £${voucher.price} pp`)
                                                            }
                                                        </div>
                                                        <button style={{ width: '100%', background: '#03a9f4', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 'auto', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#0288d1'} onMouseLeave={(e) => e.target.style.background = '#03a9f4'} onClick={() => handleSelectVoucher(voucher)}>
                                                            Select
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }
                                
                                // Show single voucher (Any Day Flight) when not in two-voucher view
                                const currentVoucher = filteredVouchers[currentViewIndex];
                                
                                if (!currentVoucher) {
                                    setCurrentViewIndex(0);
                                    return null;
                                }
                                
                                return (
                                    <div key={currentVoucher.id} style={{
                                        background: '#fff',
                                        borderRadius: 16,
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                                        width: '320px',
                                        minWidth: '320px',
                                        flexShrink: 0,
                                        padding: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        animation: slideDirection === 'right' ? 'slideInRight 0.3s ease-in-out' : 'slideInLeft 0.3s ease-in-out'
                                    }}>
                                        <img src={currentVoucher.image} alt={currentVoucher.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                                        <div style={{ padding: '16px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                            <h3 style={{ fontSize: 18, fontWeight: 300, margin: 0, marginBottom: 6, color: '#4a4a4a' }}>{currentVoucher.title}</h3>
                                            <div style={{ fontSize: 14, color: '#666', marginBottom: 6, fontWeight: 600 }}>{currentVoucher.refundability}</div>
                                            <div style={{ fontSize: 14, color: '#666', marginBottom: 6, fontWeight: 600 }}>{currentVoucher.availability}</div>
                                            <div style={{ fontSize: 14, color: '#666', marginBottom: 6, fontWeight: 600 }}>{currentVoucher.flightTime}</div>
                                            <div style={{ fontSize: 14, color: '#666', marginBottom: 10, fontWeight: 600 }}>{currentVoucher.validity}</div>
                                            <ul style={{ paddingLeft: 14, margin: 0, marginBottom: 10, color: '#666', fontSize: 13, lineHeight: '1.3' }}>
                                                {currentVoucher.inclusions.map((inclusion, i) => (
                                                    <li key={i} style={{ marginBottom: 3 }}>{inclusion}</li>
                                                ))}
                                            </ul>
                                            <div style={{ fontSize: 13, color: '#666', marginBottom: 12, lineHeight: '1.2' }}>{currentVoucher.weatherClause}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: '8px' }}>
                                                <label style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>Passengers:</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuantityChange(currentVoucher.title, getNextAllowedPassenger(parseInt(quantities[currentVoucher.title] || 2, 10), 'prev'))}
                                                        style={{ padding: '4px 8px', border: '1px solid #ddd', background: '#f9f9f9', borderRadius: 4, cursor: 'pointer' }}
                                                    >
                                                        −
                                                    </button>
                                                                                                    <input 
                                                    type="number" 
                                                    min={chooseFlightType?.type === "Private Charter" ? 2 : 1}
                                                    max={chooseFlightType?.type === "Private Charter" ? 8 : (currentVoucher.maxPassengers || 8)}
                                                    value={quantities[currentVoucher.title] || 2} 
                                                    onChange={(e) => handleQuantityChange(currentVoucher.title, e.target.value)} 
                                                    style={{ width: '50px', padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, textAlign: 'center' }} 
                                                />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuantityChange(currentVoucher.title, getNextAllowedPassenger(parseInt(quantities[currentVoucher.title] || 2, 10), 'next'))}
                                                        style={{ padding: '4px 8px', border: '1px solid #ddd', background: '#f9f9f9', borderRadius: 4, cursor: 'pointer' }}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10, color: '#4a4a4a' }}>
                                                {chooseFlightType?.type === "Private Charter" && currentVoucher.basePrice ? 
                                                    `From £${currentVoucher.basePrice} pp` : 
                                                    (currentVoucher.priceUnit === 'total' ? `£${currentVoucher.price} total` : `From £${currentVoucher.price} pp`)
                                                }
                                            </div>
                                            <button style={{ width: '100%', background: '#03a9f4', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 'auto', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#0288d1'} onMouseLeave={(e) => e.target.style.background = '#03a9f4'} onClick={() => handleSelectVoucher(currentVoucher)}>
                                                Select
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()
                        ) : (
                            <div style={{ textAlign: 'center', width: '100%', padding: '20px' }}>
                                {chooseFlightType?.type === "Private Charter" ? (
                                    <div>
                                        <p>No active private charter voucher types available.</p>
                                        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                                            Please check with our team for private charter availability or contact support to activate voucher types.
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                                            Total voucher types: {privateCharterVoucherTypes.length} | Active: {privateCharterVoucherTypes.filter(vt => vt.is_active === 1).length}
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                                            Available voucher types: {privateCharterVoucherTypes.filter(vt => vt.is_active === 1).map(vt => vt.title).join(', ')}
                                        </p>
                                    </div>
                                ) : (
                                    <p>No voucher types available for this location.</p>
                                )}
                            </div>
                        )}
                        
                        {/* Dot Navigation - hidden on mobile */}
                        {(() => {
                            if (isMobile) return null;
                            const filteredVouchers = voucherTypes.filter(voucher => 
                                availableVoucherTypes.length === 0 || availableVoucherTypes.includes(voucher.title)
                            );
                            
                            // For Private Charter, always show dots if there are multiple active voucher types
                            const shouldShowDots = chooseFlightType?.type === "Private Charter" ? 
                                (filteredVouchers.length > 1) : 
                                (filteredVouchers.length > 1);
                            
                            console.log('VoucherType: Dot navigation visibility check:', {
                                experienceType: chooseFlightType?.type,
                                filteredVouchersLength: filteredVouchers.length,
                                shouldShowDots: shouldShowDots,
                                filteredVouchers: filteredVouchers.map(v => ({ title: v.title, is_active: v.is_active }))
                            });
                            
                            if (shouldShowDots) {
                                return (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginTop: '20px',
                                        position: 'absolute',
                                        bottom: '10px',
                                        left: '50%',
                                        transform: 'translateX(-50%)'
                                    }}>
                                        {filteredVouchers.map((_, index) => (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    if (chooseFlightType?.type === "Private Charter") {
                                                        // For Private Charter, handle navigation based on available voucher types
                                                        const activePrivateCharterVoucherTypes = privateCharterVoucherTypes.filter(vt => vt.is_active === 1);
                                                        console.log('Private Charter dot click - Index:', index, 'Active count:', activePrivateCharterVoucherTypes.length);
                                                        
                                                        if (activePrivateCharterVoucherTypes.length >= 4) {
                                                            // 4 or more voucher types - show first two together, then individual ones
                                                            if (index === 0 || index === 1) {
                                                                setShowTwoVouchers(true);
                                                                setCurrentViewIndex(0);
                                                                console.log('Showing first two vouchers together (index 0-1)');
                                                            } else if (index === 2) {
                                                                setShowTwoVouchers(false);
                                                                setCurrentViewIndex(2);
                                                                console.log('Showing third voucher (index 2)');
                                                            } else if (index === 3) {
                                                                setShowTwoVouchers(false);
                                                                setCurrentViewIndex(3);
                                                                console.log('Showing fourth voucher (index 3)');
                                                            } else {
                                                                setShowTwoVouchers(false);
                                                                setCurrentViewIndex(index);
                                                                console.log('Showing voucher at index:', index);
                                                            }
                                                        } else if (activePrivateCharterVoucherTypes.length >= 3) {
                                                            // 3 voucher types - show first two together, then individual one
                                                            if (index === 0 || index === 1) {
                                                                setShowTwoVouchers(true);
                                                                setCurrentViewIndex(0);
                                                                console.log('Showing first two vouchers together');
                                                            } else {
                                                                setShowTwoVouchers(false);
                                                                setCurrentViewIndex(index);
                                                                console.log('Showing single voucher at index:', index);
                                                            }
                                                        } else if (activePrivateCharterVoucherTypes.length >= 2) {
                                                            // Only 2 voucher types - toggle between single and two-voucher view
                                                            if (index === 0 || index === 1) {
                                                                setShowTwoVouchers(true);
                                                                setCurrentViewIndex(0);
                                                                console.log('Showing two vouchers together');
                                                            } else {
                                                                setShowTwoVouchers(false);
                                                                setCurrentViewIndex(index);
                                                                console.log('Showing single voucher at index:', index);
                                                            }
                                                        } else {
                                                            // Single voucher type, just update index
                                                            setCurrentViewIndex(index);
                                                            console.log('Single voucher type, updating index to:', index);
                                                        }
                                                    } else {
                                                        // For Shared Flight, use original logic
                                                        if (index === 0 || index === 1) {
                                                            setShowTwoVouchers(true);
                                                            setCurrentViewIndex(0);
                                                        } else {
                                                            setShowTwoVouchers(false);
                                                            setCurrentViewIndex(index);
                                                        }
                                                    }
                                                }}
                                                style={{
                                                    width: '10px',
                                                    height: '10px',
                                                    borderRadius: '50%',
                                                    backgroundColor: (showTwoVouchers && (index === 0 || index === 1)) || (!showTwoVouchers && index === currentViewIndex) ? '#03a9f4' : '#ddd',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s ease'
                                                }}
                                            />
                                        ))}
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>
            </Accordion>

            {/* Terms & Conditions Modal removed */}
        </>
    );
};

export default VoucherType;  