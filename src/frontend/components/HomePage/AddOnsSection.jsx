import React, { useState, useEffect } from "react";
import Accordion from "../Common/Accordion";
import AddOn1 from '../../../assets/images/addOn1.png';
import config from '../../../config';

const AddOnsSection = ({ isGiftVoucher, isRedeemVoucher, isFlightVoucher, chooseAddOn, setChooseAddOn, activeAccordion, setActiveAccordion, chooseLocation, chooseFlightType, activitySelect, flightType }) => {
    const [addToBookingItems, setAddToBookingItems] = useState([]);
    const [addToBookingLoading, setAddToBookingLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Mobile detection
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 576);
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Fetch add to booking items from API
    useEffect(() => {
        const fetchAddToBookingItems = async () => {
            try {
                setAddToBookingLoading(true);
                console.log('Fetching add-to-booking items...');
                
                // Add cache busting parameter to prevent browser caching
                const timestamp = Date.now();
                const response = await fetch(`${config.API_BASE_URL}/api/add-to-booking-items?t=${timestamp}`, {
                    method: 'GET'
                });
                
                console.log('API response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('API response data:', data);
                    console.log('API response success:', data.success);
                    console.log('API response data length:', data.data ? data.data.length : 'undefined');
                    
                    if (data.success) {
                        // Add additional cache busting to image URLs
                        const itemsWithCacheBusting = data.data.map(item => ({
                            ...item,
                            image_url: item.image_url ? `${item.image_url}${item.image_url.includes('?') ? '&' : '?'}cb=${timestamp}` : null
                        }));
                        
                        // Debug: Log experience_types for each item
                        console.log('🔍 Raw API items before processing:');
                        data.data.forEach((item, index) => {
                            console.log(`   Item ${index + 1}: "${item.title}"`);
                            console.log(`     - id:`, item.id);
                            console.log(`     - is_active:`, item.is_active);
                            console.log(`     - journey_types:`, item.journey_types, 'Type:', typeof item.journey_types);
                            console.log(`     - locations:`, item.locations, 'Type:', typeof item.locations);
                            console.log(`     - experience_types:`, item.experience_types, 'Type:', typeof item.experience_types);
                        });
                        
                        console.log('🔍 Processed items with cache busting:');
                        itemsWithCacheBusting.forEach((item, index) => {
                            console.log(`   Item ${index + 1}: "${item.title}"`);
                            console.log(`     - experience_types:`, item.experience_types, 'Type:', typeof item.experience_types);
                        });
                        
                        setAddToBookingItems(itemsWithCacheBusting);
                        console.log('Set addToBookingItems with cache busting:', itemsWithCacheBusting);
                    } else {
                        console.error('API returned success: false:', data);
                    }
                } else {
                    console.error('API request failed with status:', response.status);
                }
            } catch (error) {
                console.error('Error fetching add to booking items:', error);
            } finally {
                setAddToBookingLoading(false);
            }
        };

        fetchAddToBookingItems();
    }, [activitySelect, chooseLocation, flightType]); // Refetch when journey type, location, or flight type changes

    // Get filtered API items based on journey type, location, and experience type
    const getFilteredItems = () => {
        // Determine current journey type based on user selections
        let currentJourneyType = 'Book Flight'; // Default
        
        if (activitySelect === 'Flight Voucher') {
            currentJourneyType = 'Flight Voucher';
        } else if (activitySelect === 'Redeem Voucher') {
            currentJourneyType = 'Redeem Voucher';
        } else if (activitySelect === 'Buy Gift') {
            currentJourneyType = 'Buy Gift';
        }
        
        console.log('🔍 Current journey type:', currentJourneyType);
        console.log('📍 Current location:', chooseLocation);
        console.log('✈️ Current flight type:', flightType);
        console.log('📦 Available add-to-booking items:', addToBookingItems);
        console.log('📦 Total items count:', addToBookingItems.length);
        
        // Filter API items by journey type, location, and experience type
        const apiItems = addToBookingItems
            .filter(item => {
                console.log(`\n🔍 Processing item: "${item.title}"`);
                console.log(`   - is_active:`, item.is_active);
                console.log(`   - journey_types:`, item.journey_types, 'Type:', typeof item.journey_types);
                console.log(`   - locations:`, item.locations, 'Type:', typeof item.locations);
                console.log(`   - experience_types:`, item.experience_types, 'Type:', typeof item.experience_types);
                
                // Check if item is active
                if (!item.is_active) {
                    console.log(`❌ Item "${item.title}" is not active`);
                    return false;
                }
                
                // Check journey types
                let journeyTypeMatch = false;
                if (item.journey_types) {
                    try {
                        let journeyTypes = [];
                        if (Array.isArray(item.journey_types)) {
                            journeyTypes = item.journey_types;
                        } else if (typeof item.journey_types === 'string') {
                            try {
                                journeyTypes = JSON.parse(item.journey_types);
                            } catch (parseError) {
                                // If JSON parsing fails, try to split by comma
                                if (item.journey_types.includes(',')) {
                                    journeyTypes = item.journey_types.split(',').map(type => type.trim());
                                } else {
                                    journeyTypes = [item.journey_types.trim()];
                                }
                            }
                        }
                        
                        // Ensure journeyTypes is always an array
                        if (!Array.isArray(journeyTypes)) {
                            journeyTypes = [journeyTypes];
                        }
                        
                        journeyTypeMatch = journeyTypes.includes(currentJourneyType);
                        console.log(`   🔍 Journey types parsed:`, journeyTypes, 'Current:', currentJourneyType, 'Match:', journeyTypeMatch);
                    } catch (error) {
                        console.warn(`❌ Error parsing journey_types for item "${item.title}":`, error);
                        return false;
                    }
                } else {
                    console.log(`❌ Item "${item.title}" has no journey types specified`);
                    return false;
                }
                
                // If journey type doesn't match, don't show the item
                if (!journeyTypeMatch) {
                    console.log(`❌ Item "${item.title}" failed journey type filter`);
                    return false;
                }
                
                // Check locations
                let locationMatch = false;
                if (item.locations && chooseLocation) {
                    try {
                        let locations = [];
                        if (Array.isArray(item.locations)) {
                            locations = item.locations;
                        } else if (typeof item.locations === 'string') {
                            try {
                                locations = JSON.parse(item.locations);
                            } catch (parseError) {
                                // If JSON parsing fails, try to split by comma
                                if (item.locations.includes(',')) {
                                    locations = item.locations.split(',').map(loc => loc.trim());
                                } else {
                                    locations = [item.locations.trim()];
                                }
                            }
                        }
                        
                        // Ensure locations is always an array
                        if (!Array.isArray(locations)) {
                            locations = [locations];
                        }
                        
                        locationMatch = locations.includes(chooseLocation);
                        console.log(`   📍 Locations parsed:`, locations, 'Current:', chooseLocation, 'Match:', locationMatch);
                    } catch (error) {
                        console.warn(`❌ Error parsing locations for item "${item.title}":`, error);
                        locationMatch = false;
                    }
                } else if (!item.locations) {
                    // If no locations specified, assume it applies to all locations
                    locationMatch = true;
                    console.log(`   📍 No locations specified, assuming all locations (Match: true)`);
                } else if (!chooseLocation) {
                    // If no location is selected, show all items
                    locationMatch = true;
                    console.log(`   📍 No location selected, showing all items (Match: true)`);
                }
                
                // Check experience types
                let experienceTypeMatch = false;
                if (item.experience_types && flightType) {
                    try {
                        let experienceTypes = [];
                        if (Array.isArray(item.experience_types)) {
                            experienceTypes = item.experience_types;
                        } else if (typeof item.experience_types === 'string') {
                            try {
                                experienceTypes = JSON.parse(item.experience_types);
                            } catch (parseError) {
                                // If JSON parsing fails, try to split by comma
                                if (item.experience_types.includes(',')) {
                                    experienceTypes = item.experience_types.split(',').map(exp => exp.trim());
                                } else {
                                    experienceTypes = [item.experience_types.trim()];
                                }
                            }
                        }
                        
                        // Ensure experienceTypes is always an array
                        if (!Array.isArray(experienceTypes)) {
                            experienceTypes = [experienceTypes];
                        }
                        
                        // Map flight type to experience type
                        let mappedFlightType = '';
                        if (flightType && typeof flightType === 'string') {
                            if (flightType.toLowerCase().includes('shared')) {
                                mappedFlightType = 'Shared Flight';
                            } else if (flightType.toLowerCase().includes('private')) {
                                mappedFlightType = 'Private Charter';
                            }
                        }
                        
                        // If we have a mapped flight type, check if it's in the experience types
                        if (mappedFlightType) {
                            experienceTypeMatch = experienceTypes.includes(mappedFlightType);
                        } else {
                            // If no flight type is selected or can't be mapped, show all items
                            experienceTypeMatch = true;
                        }
                        
                        console.log(`   ✈️ Experience types parsed:`, experienceTypes, 'Mapped flight type:', mappedFlightType, 'Current flight type:', flightType, 'Match:', experienceTypeMatch);
                    } catch (error) {
                        console.warn(`❌ Error parsing experience_types for item "${item.title}":`, error);
                        experienceTypeMatch = false;
                    }
                } else if (!item.experience_types) {
                    // If no experience types specified, assume it applies to all experience types
                    experienceTypeMatch = true;
                    console.log(`   ✈️ No experience types specified, assuming all experience types (Match: true)`);
                } else if (!flightType) {
                    // If no flight type is selected, show all items
                    experienceTypeMatch = true;
                    console.log(`   ✈️ No flight type selected, showing all items (Match: true)`);
                }
                
                // All three conditions must be met
                const finalMatch = journeyTypeMatch && locationMatch && experienceTypeMatch;
                console.log(`   🎯 Final result:`, finalMatch, '(Journey:', journeyTypeMatch, 'Location:', locationMatch, 'Experience:', experienceTypeMatch, ')');
                
                if (finalMatch) {
                    console.log(`   ✅ Item "${item.title}" PASSED all filters`);
                } else {
                    console.log(`   ❌ Item "${item.title}" FAILED filters`);
                }
                
                return finalMatch;
            })
            .map(item => ({
                name: item.title,
                price: item.price.toString(),
                image: item.image_url ? 
                    (item.image_url.startsWith('http') ? 
                        item.image_url : 
                        `${config.API_BASE_URL}${item.image_url}`) 
                    : AddOn1,
                description: item.description,
                category: item.category,
                isPhysicalItem: item.is_physical_item,
                priceUnit: item.price_unit
            }));
        
        console.log('🎯 Filtered API items for journey type:', currentJourneyType, 'location:', chooseLocation, 'and flight type:', flightType, ':', apiItems);
        console.log('🎯 Filtered items count:', apiItems.length);
        return apiItems;
    };

    const filteredItems = getFilteredItems();
    console.log('📊 Final filtered items:', filteredItems);
    console.log('📊 Current activitySelect:', activitySelect);
    console.log('📊 Current chooseLocation:', chooseLocation);
    console.log('📊 Total add-to-booking items:', addToBookingItems.length);
    console.log('📊 Filtered items count:', filteredItems.length);
    console.log('📊 Add to booking loading:', addToBookingLoading);

    // Handle checkbox toggle when div is clicked
    function handleAddOnChange(name, price) {
        setChooseAddOn(prev => {
            prev = Array.isArray(prev) ? prev : []; // Ensure prev is always an array
            const exists = prev.some(addOn => addOn.name === name);
            return exists ? prev.filter(addOn => addOn.name !== name) : [...prev, { name, price }];
        });
    }    
    console.log('chooseAddOn?', chooseAddOn);

    // Debug section visibility logic
    console.log('🔍 Section visibility check:');
    console.log('   - addToBookingLoading:', addToBookingLoading);
    console.log('   - filteredItems.length:', filteredItems.length);
    console.log('   - Will show section:', !addToBookingLoading && filteredItems.length > 0);

    // If no items to show, don't render the section at all
    if (!addToBookingLoading && filteredItems.length === 0) {
        console.log('❌ No add to booking items to display, hiding section');
        return null;
    }

    console.log('✅ Rendering Add to Booking section with', filteredItems.length, 'items');
    console.log('   - Section will be visible');
    console.log('   - Items to display:', filteredItems.map(item => item.name));

    return (
        <Accordion title="Add To Booking" id="add-on" activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion}>
            <div className="tab_box add-on-card scroll-box vouch">
                {addToBookingLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p>Loading add to booking items...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        <p>No items available for the selected journey type, location, and flight type.</p>
                    </div>
                ) : (
                    filteredItems.map((item, index) => {
                        const isSelected = Array.isArray(chooseAddOn) && chooseAddOn.some(addOn => addOn.name === item.name);
                        return (
                            <div className={`loc_data ${isSelected ? 'active-add-on-wrap' : ""}`} key={index} onClick={() => handleAddOnChange(item.name, item.price)} style={{
                                minHeight: isMobile ? '160px' : 'auto',
                                padding: isMobile ? '20px 16px' : '15px',
                                gap: isMobile ? '20px' : '20px',
                                alignItems: isMobile ? 'flex-start' : 'center',
                                overflow: isMobile ? 'hidden' : 'visible'
                            }}>
                                <div>
                                    <img 
                                        src={item.image} 
                                        alt={item.name} 
                                        style={{
                                            width: isMobile ? '80px' : '120px',
                                            height: isMobile ? '80px' : '120px',
                                            objectFit: 'cover',
                                            borderRadius: isMobile ? '10px' : '8px',
                                            border: isMobile ? '2px solid #e5e7eb' : '1px solid #e5e7eb',
                                            flexShrink: 0,
                                            boxShadow: isMobile ? '0 3px 6px rgba(0, 0, 0, 0.12)' : 'none',
                                            minWidth: isMobile ? '80px' : '120px',
                                            minHeight: isMobile ? '80px' : '120px'
                                        }}
                                        onError={(e) => {
                                            e.target.src = AddOn1; // Fallback to default image
                                        }}
                                    />
                                </div>
                                <div className="vouch-text" style={{
                                    flex: 1,
                                    minWidth: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: isMobile ? '12px' : '0',
                                    justifyContent: isMobile ? 'flex-start' : 'center',
                                    height: isMobile ? '120px' : 'auto',
                                    overflow: isMobile ? 'auto' : 'visible',
                                    paddingRight: isMobile ? '4px' : '0',
                                    width: isMobile ? 'calc(100% - 100px)' : 'auto'
                                }}>
                                    <div className="vouch-header" style={{
                                        display: 'flex',
                                        flexDirection: isMobile ? 'row' : 'row',
                                        alignItems: isMobile ? 'center' : 'center',
                                        justifyContent: isMobile ? 'space-between' : 'space-between',
                                        gap: isMobile ? '8px' : '15px',
                                        marginBottom: isMobile ? '8px' : '8px',
                                        width: '100%'
                                    }}>
                                        <p className="vouch-title" style={{
                                            margin: 0,
                                            fontWeight: isMobile ? '700' : '500',
                                            color: isMobile ? '#1f2937' : '#333',
                                            fontSize: isMobile ? '14px' : '14px',
                                            lineHeight: isMobile ? '1.4' : '1.4',
                                            flex: 1,
                                            minWidth: 0
                                        }}>{item.name}</p>
                                        <p className="vouch-price" style={{
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: isMobile ? '800' : '500',
                                            color: isMobile ? '#059669' : '#222',
                                            fontSize: isMobile ? '16px' : '14px',
                                            marginLeft: isMobile ? '8px' : '10px',
                                            flexShrink: 0
                                        }}>£{item.price}</p>
                                    </div>
                                    {item.description && (
                                        <div style={{
                                            flex: 1,
                                            overflow: isMobile ? 'auto' : 'visible',
                                            maxHeight: isMobile ? '80px' : 'none'
                                        }}>
                                            <p className="vouch-desc" style={{
                                                fontSize: isMobile ? '14px' : '12px',
                                                color: isMobile ? '#374151' : '#666',
                                                margin: 0,
                                                lineHeight: isMobile ? '1.4' : '1.3',
                                                display: isMobile ? 'block' : 'block',
                                                fontWeight: isMobile ? '400' : '400',
                                                paddingRight: isMobile ? '2px' : '0'
                                            }}>{item.description}</p>
                                        </div>
                                    )}
                                </div>
                                <span className={`add-on-input ${isSelected ? 'active-add-on' : ""}`} style={{
                                    position: 'absolute',
                                    right: isMobile ? '12px' : '15px',
                                    top: isMobile ? '12px' : '15px',
                                    width: isMobile ? '24px' : '20px',
                                    height: isMobile ? '24px' : '20px',
                                    border: `2px solid ${isSelected ? '#74da78' : 'gray'}`,
                                    borderRadius: '50%',
                                    background: isSelected ? '#74da78' : '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}>
                                    {isSelected && (
                                        <span style={{
                                            color: 'white',
                                            fontSize: isMobile ? '14px' : '12px',
                                            fontWeight: 'bold'
                                        }}>✓</span>
                                    )}
                                </span>
                            </div>
                        )
                    })
                )}
            </div>
        </Accordion>
    );
};

export default AddOnsSection;
