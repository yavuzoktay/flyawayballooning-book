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
    const [termsContent, setTermsContent] = useState('');
    const [termsLoading, setTermsLoading] = useState(false);

    // Mobile breakpoint
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 576);
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Keep layout sensible per device
    useEffect(() => {
        if (isMobile) {
            setShowTwoVouchers(false);
        } else {
            setShowTwoVouchers(true);
            setCurrentViewIndex(0);
        }
    }, [isMobile]);

    // Fetch all voucher types from API
    useEffect(() => {
        const fetchAllVoucherTypes = async () => {
            try {
                setAllVoucherTypesLoading(true);
                const response = await fetch(`${API_BASE_URL}/api/voucher-types`);
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

    const voucherTypes = useMemo(() => {
        if (allVoucherTypesLoading || allVoucherTypes.length === 0) {
            return [];
        }

        console.log('VoucherType: Creating voucherTypes with locationPricing:', locationPricing);

        return allVoucherTypes.map(vt => {
            // Parse features from JSON string
            let features = [];
            try {
                features = JSON.parse(vt.features || '[]');
            } catch (e) {
                features = ['Around 1 Hour of Air Time', 'Complimentary Drink', 'Inflight Photos and 3D Flight Track'];
            }

            // Get pricing from activity settings based on voucher type title
            let price = 0;
            if (locationPricing) {
                if (vt.title.toLowerCase().includes('weekday morning')) {
                    price = locationPricing.weekday_morning_price || 180;
                } else if (vt.title.toLowerCase().includes('flexible weekday')) {
                    price = locationPricing.flexible_weekday_price || 200;
                } else if (vt.title.toLowerCase().includes('any day flight')) {
                    price = locationPricing.any_day_flight_price || 220;
                } else {
                    // Fallback to API pricing if no match found
                    price = parseFloat(vt.price_per_person) || 180;
                }
            } else {
                // Fallback to API pricing if no location pricing available
                price = parseFloat(vt.price_per_person) || 180;
            }

            console.log(`VoucherType: ${vt.title} - API price: ${vt.price_per_person}, Activity price: ${price}`);

            return {
                id: vt.id,
                title: vt.title,
                description: vt.description || 'No description available',
                image: vt.image_url ? (vt.image_url.startsWith('/uploads/') ? vt.image_url : vt.image_url) : weekdayMorningImg, // Fallback to default image
                refundability: 'Non-Refundable',
                availability: vt.flight_days,
                validity: `Valid: ${vt.validity_months} Months`,
                inclusions: features,
                weatherClause: vt.terms && vt.terms.trim() !== '' ? vt.terms : 'Flights subject to weather – your voucher will remain valid and re-bookable within its validity period if cancelled due to weather.',
                price: price
            };
        });
    }, [allVoucherTypes, allVoucherTypesLoading, locationPricing]);

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

    const handleSelectVoucher = async (voucher) => {
        const quantity = quantities[voucher.title];
        const totalPrice = voucher.price * quantity;
        
        const voucherWithQuantity = {
            ...voucher,
            quantity: quantity,
            totalPrice: totalPrice
        };
        
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
                {showTerms && selectedVoucher && (
                    <div className="modal-overlay" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:2000,display:'flex',justifyContent:'center',alignItems:'center'}}>
                        <div className="modal-content" style={{background:'#ffffff',borderRadius:12,maxWidth:720,width:'92%',padding:'20px 24px',boxShadow:'0 10px 40px rgba(0,0,0,0.2)'}}>
                            <div style={{display:'flex',alignItems:'center',marginBottom:12}}>
                                <h3 style={{margin:0,fontSize:20,fontWeight:700,color:'#111827'}}>Terms & Conditions</h3>
                            </div>
                            <div style={{maxHeight:360,overflowY:'auto',whiteSpace:'pre-line',color:'#374151',lineHeight:1.6,fontSize:14,border:'1px solid #e5e7eb',borderRadius:8,padding:'12px 14px',background:'#f9fafb'}}>
                                {termsLoading ? 'Loading terms...' : (termsContent || selectedVoucher?.weatherClause || '')}
                            </div>
                            <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:16}}>
                                <button onClick={() => { setShowTerms(false); }} style={{border:'1px solid #d1d5db',background:'#fff',color:'#374151',padding:'8px 14px',borderRadius:8,cursor:'pointer'}}>Cancel</button>
                                <button onClick={() => { setSelectedVoucherType(selectedVoucher); setActiveAccordion(null); setShowTerms(false); }} style={{background:'#10b981',color:'#fff',padding:'8px 14px',borderRadius:8,cursor:'pointer',border:'none'}} disabled={termsLoading}>Confirm</button>
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
                            padding: isMobile ? '16px' : '40px 60px',
                            minHeight: isMobile ? 'auto' : '400px',
                            position: 'relative',
                            width: '100%'
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
                                                            <div style={{ fontSize: 10, color: '#666', marginBottom: 4, lineHeight: '1.2', fontStyle: 'italic' }}>{voucher.description}</div>
                                                            <div style={{ fontSize: 11, color: '#666', marginBottom: 3, fontWeight: 500 }}>{voucher.refundability}</div>
                                                            <div style={{ fontSize: 11, color: '#666', marginBottom: 3 }}>{voucher.availability}</div>
                                                            <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>{voucher.validity}</div>
                                                            <ul style={{ paddingLeft: 10, margin: 0, marginBottom: 6, color: '#444', fontSize: 11, lineHeight: '1.2' }}>
                                                                {voucher.inclusions.map((inclusion, i) => (
                                                                    <li key={i} style={{ marginBottom: 1 }}>{inclusion}</li>
                                                                ))}
                                                            </ul>
                                                            <div style={{ fontSize: 10, color: '#666', marginBottom: 6, lineHeight: '1.1', fontStyle: 'italic' }}>{voucher.weatherClause}</div>
                                                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#4a4a4a' }}>From £{voucher.price}</div>
                                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: '4px' }}>
                                                                <label style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Passengers:</label>
                                                                <input type="number" min="0" value={quantities[voucher.title]} onChange={(e) => handleQuantityChange(voucher.title, e.target.value)} style={{ width: '40px', padding: '2px 4px', border: '1px solid #ddd', borderRadius: 3, fontSize: 11, textAlign: 'center' }} />
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
                                                        <h3 style={{ fontSize: 18, fontWeight: 300, margin: 0, marginBottom: 6, color: '#4a4a4a' }}>{voucher.title}</h3>
                                                        <div style={{ fontSize: 12, color: '#666', marginBottom: 8, lineHeight: '1.3', fontStyle: 'italic' }}>{voucher.description}</div>
                                                        <div style={{ fontSize: 14, color: '#666', marginBottom: 6, fontWeight: 500 }}>{voucher.refundability}</div>
                                                        <div style={{ fontSize: 14, color: '#666', marginBottom: 6 }}>{voucher.availability}</div>
                                                        <div style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>{voucher.validity}</div>
                                                        <ul style={{ paddingLeft: 14, margin: 0, marginBottom: 10, color: '#444', fontSize: 14, lineHeight: '1.3' }}>
                                                            {voucher.inclusions.map((inclusion, i) => (
                                                                <li key={i} style={{ marginBottom: 3 }}>{inclusion}</li>
                                                            ))}
                                                        </ul>
                                                        <div style={{ fontSize: 12, color: '#666', marginBottom: 12, lineHeight: '1.2', fontStyle: 'italic' }}>{voucher.weatherClause}</div>
                                                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10, color: '#4a4a4a' }}>From £{voucher.price}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: '8px' }}>
                                                            <label style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>Passengers:</label>
                                                            <input type="number" min="0" value={quantities[voucher.title]} onChange={(e) => handleQuantityChange(voucher.title, e.target.value)} style={{ width: '50px', padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, textAlign: 'center' }} />
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
                                            <div style={{ fontSize: 14, color: '#666', marginBottom: 6, fontWeight: 500 }}>{currentVoucher.refundability}</div>
                                            <div style={{ fontSize: 14, color: '#666', marginBottom: 6 }}>{currentVoucher.availability}</div>
                                            <div style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>{currentVoucher.validity}</div>
                                            <ul style={{ paddingLeft: 14, margin: 0, marginBottom: 10, color: '#444', fontSize: 14, lineHeight: '1.3' }}>
                                                {currentVoucher.inclusions.map((inclusion, i) => (
                                                    <li key={i} style={{ marginBottom: 3 }}>{inclusion}</li>
                                                ))}
                                            </ul>
                                            <div style={{ fontSize: 12, color: '#666', marginBottom: 12, lineHeight: '1.2', fontStyle: 'italic' }}>{currentVoucher.weatherClause}</div>
                                            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10, color: '#4a4a4a' }}>From £{currentVoucher.price}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: '8px' }}>
                                                <label style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>Passengers:</label>
                                                <input type="number" min="0" value={quantities[currentVoucher.title]} onChange={(e) => handleQuantityChange(currentVoucher.title, e.target.value)} style={{ width: '50px', padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, textAlign: 'center' }} />
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
                                <p>No voucher types available for this location.</p>
                            </div>
                        )}
                        
                        {/* Dot Navigation - hidden on mobile */}
                        {(() => {
                            if (isMobile) return null;
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

            {/* Terms & Conditions Modal removed */}
        </>
    );
};

export default VoucherType; 