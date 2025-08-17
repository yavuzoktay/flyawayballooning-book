import React, { useState, useEffect } from 'react';
import Accordion from '../Common/Accordion';
import axios from 'axios';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import weekdayMorningImg from '../../../assets/images/category1.jpeg';
import flexibleWeekdayImg from '../../../assets/images/category2.jpeg';
import anyDayFlightImg from '../../../assets/images/category3.jpg';
import { useMemo } from 'react';

// Custom scrollbar styles
const scrollbarStyles = `
    .voucher-type-scroll-outer {
        overflow-x: auto;
        width: 100%;
        max-width: 100%;
        scrollbar-width: thin;
        scrollbar-color: #666 #f1f1f1;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar {
        height: 16px;
        width: 16px;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 8px;
        margin: 0 4px;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-thumb {
        background: #666;
        border-radius: 8px;
        border: 2px solid #f1f1f1;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-thumb:hover {
        background: #444;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-corner {
        background: #f1f1f1;
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

    // Fetch all voucher types from API
    useEffect(() => {
        const fetchAllVoucherTypes = async () => {
            try {
                setAllVoucherTypesLoading(true);
                const response = await fetch('http://localhost:3002/api/voucher-types');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setAllVoucherTypes(data.data);
                        
                        // Initialize quantities and pricing from API data
                        const newQuantities = {};
                        const newPricing = {};
                        
                        data.data.forEach(vt => {
                            newQuantities[vt.title] = 1;
                            newPricing[vt.title.toLowerCase().replace(/\s+/g, '_') + '_price'] = parseFloat(vt.price_per_person);
                        });
                        
                        setQuantities(newQuantities);
                        setLocationPricing(newPricing);
                    }
                }
            } catch (error) {
                console.error('Error fetching voucher types:', error);
            } finally {
                setAllVoucherTypesLoading(false);
            }
        };

        fetchAllVoucherTypes();
    }, []);

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
        if (selectedActivity && selectedActivity.length > 0) {
            const activity = selectedActivity[0];
            setLocationPricing({
                weekday_morning_price: parseFloat(activity.weekday_morning_price) || 180,
                flexible_weekday_price: parseFloat(activity.flexible_weekday_price) || 200,
                any_day_flight_price: parseFloat(activity.any_day_flight_price) || 220
            });
        } else {
            // Fallback to default pricing
            setLocationPricing({
                weekday_morning_price: 180,
                flexible_weekday_price: 200,
                any_day_flight_price: 220
            });
        }
    }, [selectedActivity]);

    const voucherTypes = useMemo(() => {
        if (allVoucherTypesLoading || allVoucherTypes.length === 0) {
            return [];
        }

        return allVoucherTypes.map(vt => {
            // Parse features from JSON string
            let features = [];
            try {
                features = JSON.parse(vt.features || '[]');
            } catch (e) {
                features = ['Around 1 Hour of Air Time', 'Complimentary Drink', 'Inflight Photos and 3D Flight Track'];
            }

            return {
                id: vt.id,
                title: vt.title,
                description: vt.description || 'No description available',
                image: vt.image_url ? (vt.image_url.startsWith('/uploads/') ? vt.image_url : vt.image_url) : weekdayMorningImg, // Fallback to default image
                refundability: 'Non-Refundable',
                availability: vt.flight_days,
                validity: `Valid: ${vt.validity_months} Months`,
                inclusions: features,
                weatherClause: vt.terms || 'Flights subject to weather – your voucher will remain valid and re-bookable within its validity period if cancelled due to weather.',
                price: parseFloat(vt.price_per_person)
            };
        });
    }, [allVoucherTypes, allVoucherTypesLoading]);

    const handleQuantityChange = (voucherTitle, value) => {
        setQuantities(prev => ({
            ...prev,
            [voucherTitle]: Math.max(0, parseInt(value) || 0)
        }));
    };

    const handlePrevVoucher = () => {
        setSlideDirection('left');
        setShowTwoVouchers(true);
        setCurrentViewIndex(0);
    };

    const handleNextVoucher = () => {
        setSlideDirection('right');
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
    };

    const handleSelectVoucher = (voucher) => {
        const quantity = quantities[voucher.title];
        const totalPrice = voucher.price * quantity;
        
        const voucherWithQuantity = {
            ...voucher,
            quantity: quantity,
            totalPrice: totalPrice
        };
        
        setSelectedVoucher(voucherWithQuantity);
        
        // Fetch terms and conditions for this voucher type
        if (voucher.id) {
            console.log('VoucherType: Fetching terms for voucher:', voucher);
            fetchTermsForVoucher(voucher.id);
        }
        
        setShowTerms(true); // Show modal
    };

    const confirmSelection = () => {
        if (selectedVoucher) {
            console.log('VoucherType: Setting selectedVoucherType to:', selectedVoucher);
            setSelectedVoucherType(selectedVoucher);
            setActiveAccordion(null); // Close this accordion after selection
        }
        setShowTerms(false); // Close modal
    };

    // Fetch terms and conditions from API
    const [termsAndConditions, setTermsAndConditions] = useState([]);
    const [termsLoading, setTermsLoading] = useState(false);

    const fetchTermsForVoucher = async (voucherTypeId) => {
        try {
            setTermsLoading(true);
            console.log('VoucherType: Fetching terms for voucher type ID:', voucherTypeId);
            
            const response = await axios.get(`/api/terms-and-conditions/voucher-type/${voucherTypeId}`);
            console.log('VoucherType: Terms API response:', response.data);
            
            if (response.data.success) {
                setTermsAndConditions(response.data.data);
                console.log('VoucherType: Terms set to:', response.data.data);
            }
        } catch (error) {
            console.error('VoucherType: Error fetching terms and conditions:', error);
            setTermsAndConditions([]);
        } finally {
            setTermsLoading(false);
        }
    };

    const getTermsForVoucher = (voucherTitle) => {
        // Return terms from API if available, otherwise show loading or empty state
        if (termsLoading) {
            return ['Loading terms and conditions...'];
        }
        
        if (termsAndConditions.length === 0) {
            return ['Terms and conditions not available for this voucher type.'];
        }
        
        // Return the content from the first available terms
        const terms = termsAndConditions[0];
        if (terms && terms.content) {
            return terms.content.split('\n').filter(line => line.trim() !== '');
        }
        
        return ['Terms and conditions not available for this voucher type.'];
    };

    // Hide VoucherType section if "Private Charter" is selected
    if (chooseFlightType?.type === "Private Charter") {
        return null;
    }

    return (
        <>
            <style>{scrollbarStyles}</style>
            <Accordion
                title="Voucher Type"
                id="voucher-type"
                activeAccordion={activeAccordion}
                setActiveAccordion={setActiveAccordion}
            >
                <div style={{ position: 'relative', width: '100%' }}>
                    {/* Navigation Arrows */}
                    {(() => {
                        const filteredVouchers = voucherTypes.filter(voucher => 
                            availableVoucherTypes.length === 0 || availableVoucherTypes.includes(voucher.title)
                        );
                        return (
                            <>
                                {/* Show left arrow if not in two-voucher view */}
                                {!showTwoVouchers && (
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
                                {/* Show right arrow if in two-voucher view and there's a third voucher */}
                                {(showTwoVouchers && filteredVouchers.length >= 3) && (
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
                            padding: '40px 60px',
                            minHeight: '400px',
                            position: 'relative'
                        }}
                    >
                        {loading || allVoucherTypesLoading ? (
                            <div style={{ textAlign: 'center', width: '100%', padding: '20px' }}>
                                <p>Loading voucher types...</p>
                            </div>
                        ) : voucherTypes
                            .filter(voucher => availableVoucherTypes.length === 0 || availableVoucherTypes.includes(voucher.title))
                            .length > 0 ? (
                            (() => {
                                const filteredVouchers = voucherTypes.filter(voucher => 
                                    availableVoucherTypes.length === 0 || availableVoucherTypes.includes(voucher.title)
                                );
                                
                                // Show two vouchers side by side (Weekday Morning and Flexible Weekday)
                                if (showTwoVouchers && filteredVouchers.length >= 2) {
                                    return (
                                        <div style={{
                                            display: 'flex',
                                            gap: '20px',
                                            justifyContent: 'center',
                                            alignItems: 'flex-start',
                                            transition: 'transform 0.3s ease-in-out'
                                        }}>
                                            {filteredVouchers.slice(0, 2).map((voucher, index) => (
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
                                                        <h3 style={{
                                                            fontSize: 18,
                                                            fontWeight: 300,
                                                            margin: 0,
                                                            marginBottom: 6,
                                                            color: '#4a4a4a'
                                                        }}>
                                                            {voucher.title}
                                                        </h3>
                                                        <div style={{
                                                            fontSize: 12,
                                                            color: '#666',
                                                            marginBottom: 8,
                                                            lineHeight: '1.3',
                                                            fontStyle: 'italic'
                                                        }}>
                                                            {voucher.description}
                                                        </div>
                                                        <div style={{
                                                            fontSize: 14,
                                                            color: '#666',
                                                            marginBottom: 6,
                                                            fontWeight: 500
                                                        }}>
                                                            {voucher.refundability}
                                                        </div>
                                                        <div style={{
                                                            fontSize: 14,
                                                            color: '#666',
                                                            marginBottom: 6
                                                        }}>
                                                            {voucher.availability}
                                                        </div>
                                                        <div style={{
                                                            fontSize: 14,
                                                            color: '#666',
                                                            marginBottom: 10
                                                        }}>
                                                            {voucher.validity}
                                                        </div>
                                                        <ul style={{
                                                            paddingLeft: 14,
                                                            margin: 0,
                                                            marginBottom: 10,
                                                            color: '#444',
                                                            fontSize: 14,
                                                            lineHeight: '1.3'
                                                        }}>
                                                            {voucher.inclusions.map((inclusion, i) => (
                                                                <li key={i} style={{ marginBottom: 3 }}>{inclusion}</li>
                                                            ))}
                                                        </ul>
                                                        <div style={{
                                                            fontSize: 12,
                                                            color: '#666',
                                                            marginBottom: 12,
                                                            lineHeight: '1.2',
                                                            fontStyle: 'italic'
                                                        }}>
                                                            {voucher.weatherClause}
                                                        </div>
                                                        <div style={{
                                                            fontWeight: 600,
                                                            fontSize: 15,
                                                            marginBottom: 10,
                                                            color: '#4a4a4a'
                                                        }}>
                                                            Price Per Person: £{voucher.price}
                                                        </div>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            marginBottom: 12,
                                                            gap: '8px'
                                                        }}>
                                                            <label style={{
                                                                fontSize: 13,
                                                                color: '#666',
                                                                fontWeight: 500
                                                            }}>
                                                                Passengers:
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={quantities[voucher.title]}
                                                                onChange={(e) => handleQuantityChange(voucher.title, e.target.value)}
                                                                style={{
                                                                    width: '50px',
                                                                    padding: '4px 6px',
                                                                    border: '1px solid #ddd',
                                                                    borderRadius: 4,
                                                                    fontSize: 13,
                                                                    textAlign: 'center'
                                                                }}
                                                            />
                                                        </div>
                                                        <button
                                                            style={{
                                                                width: '100%',
                                                                background: '#03a9f4',
                                                                color: '#fff',
                                                                border: 'none',
                                                                borderRadius: 8,
                                                                padding: '10px 0',
                                                                fontSize: 15,
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                marginTop: 'auto',
                                                                transition: 'background 0.2s',
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = '#0288d1'}
                                                            onMouseLeave={(e) => e.target.style.background = '#03a9f4'}
                                                            onClick={() => handleSelectVoucher(voucher)}
                                                        >
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
                                <img
                                    src={currentVoucher.image}
                                    alt={currentVoucher.title}
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
                                    <h3 style={{
                                        fontSize: 18,
                                        fontWeight: 300,
                                        margin: 0,
                                        marginBottom: 6,
                                        color: '#4a4a4a'
                                    }}>
                                        {currentVoucher.title}
                                    </h3>
                                    <div style={{
                                        fontSize: 14,
                                        color: '#666',
                                        marginBottom: 6,
                                        fontWeight: 500
                                    }}>
                                        {currentVoucher.refundability}
                                    </div>
                                    <div style={{
                                        fontSize: 14,
                                        color: '#666',
                                        marginBottom: 6
                                    }}>
                                        {currentVoucher.availability}
                                    </div>
                                    <div style={{
                                        fontSize: 14,
                                        color: '#666',
                                        marginBottom: 10
                                    }}>
                                        {currentVoucher.validity}
                                    </div>
                                    <ul style={{
                                        paddingLeft: 14,
                                        margin: 0,
                                        marginBottom: 10,
                                        color: '#444',
                                        fontSize: 14,
                                        lineHeight: '1.3'
                                    }}>
                                        {currentVoucher.inclusions.map((inclusion, i) => (
                                            <li key={i} style={{ marginBottom: 3 }}>{inclusion}</li>
                                        ))}
                                    </ul>
                                    <div style={{
                                        fontSize: 12,
                                        color: '#666',
                                        marginBottom: 12,
                                        lineHeight: '1.2',
                                        fontStyle: 'italic'
                                    }}>
                                        {currentVoucher.weatherClause}
                                    </div>
                                    <div style={{
                                        fontWeight: 600,
                                        fontSize: 15,
                                        marginBottom: 10,
                                        color: '#4a4a4a'
                                    }}>
                                        Price Per Person: £{currentVoucher.price}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: 12,
                                        gap: '8px'
                                    }}>
                                        <label style={{
                                            fontSize: 13,
                                            color: '#666',
                                            fontWeight: 500
                                        }}>
                                            Passengers:
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={quantities[currentVoucher.title]}
                                            onChange={(e) => handleQuantityChange(currentVoucher.title, e.target.value)}
                                            style={{
                                                width: '50px',
                                                padding: '4px 6px',
                                                border: '1px solid #ddd',
                                                borderRadius: 4,
                                                fontSize: 13,
                                                textAlign: 'center'
                                            }}
                                        />
                                    </div>
                                    <button
                                        style={{
                                            width: '100%',
                                            background: '#03a9f4',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 8,
                                            padding: '10px 0',
                                            fontSize: 15,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            marginTop: 'auto',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = '#0288d1'}
                                        onMouseLeave={(e) => e.target.style.background = '#03a9f4'}
                                        onClick={() => handleSelectVoucher(currentVoucher)}
                                    >
                                        Select
                                    </button>
                                </div>
                            </div>
                            );
                            })()
                        ) : (
                            <div style={{ textAlign: 'center', width: '100%', padding: '20px' }}>
                                <p>No voucher types available for this location.</p>
                            </div>
                        )}
                        
                        {/* Dot Navigation */}
                        {(() => {
                            const filteredVouchers = voucherTypes.filter(voucher => 
                                availableVoucherTypes.length === 0 || availableVoucherTypes.includes(voucher.title)
                            );
                            
                            if (filteredVouchers.length > 1) {
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
                                                    if (index === 0 || index === 1) {
                                                        setShowTwoVouchers(true);
                                                        setCurrentViewIndex(0);
                                                    } else {
                                                        setShowTwoVouchers(false);
                                                        setCurrentViewIndex(index);
                                                    }
                                                }}
                                                style={{
                                                    width: '10px',
                                                    height: '10px',
                                                    borderRadius: '50%',
                                                    backgroundColor: (showTwoVouchers && (index === 0 || index === 1)) || (!showTwoVouchers && index === currentViewIndex) ? '#03a9f4' : '#ddd',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.3s ease'
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

            {/* Terms & Conditions Modal */}
            {showTerms && (
                <>
                    <div className="overlay"></div>
                    <div className="popup">
                        <div className="modal-content">
                            <div className="popup-text">
                                <h3>TERMS & CONDITIONS</h3>
                                {selectedVoucher && (
                                    <p style={{ fontSize: '16px', marginTop: '10px' }}>
                                        {selectedVoucher.title} for {selectedVoucher.quantity} passengers: 
                                        <strong> £{selectedVoucher.totalPrice}</strong> 
                                        <span style={{ fontSize: '14px', display: 'block', marginTop: '5px' }}>
                                            (£{selectedVoucher.price} per person)
                                        </span>
                                    </p>
                                )}
                            </div>
                            <ul>
                                {termsLoading ? (
                                    <li>Loading terms and conditions...</li>
                                ) : (
                                    <>
                                        {getTermsForVoucher(selectedVoucher?.title).map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                        <li><a href="https://flyawayballooning.com/pages/terms-conditions" target="_blank" rel="noopener noreferrer" style={{ color: '#000000b5', fontSize: '18px', textDecoration: 'underline' }}>See full Terms & Conditions</a></li>
                                    </>
                                )}
                            </ul>
                            <div className="modal-buttons">
                                <button className="confirm-btn" onClick={confirmSelection}>Confirm</button>
                                <button className="cancel-btn" onClick={() => setShowTerms(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default VoucherType; 