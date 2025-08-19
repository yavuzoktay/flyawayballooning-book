import React, { useState, useEffect } from "react";
import Accordion from "../Common/Accordion";
import AddOn1 from '../../../assets/images/addOn1.png';

const AddOnsSection = ({ isGiftVoucher, isRedeemVoucher, isFlightVoucher, chooseAddOn, setChooseAddOn, activeAccordion, setActiveAccordion, chooseLocation, chooseFlightType, activitySelect }) => {
    const [addToBookingItems, setAddToBookingItems] = useState([]);
    const [addToBookingLoading, setAddToBookingLoading] = useState(true);

    // Fetch add to booking items from API
    useEffect(() => {
        const fetchAddToBookingItems = async () => {
            try {
                setAddToBookingLoading(true);
                console.log('Fetching add-to-booking items...');
                const response = await fetch('/api/add-to-booking-items');
                console.log('API response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('API response data:', data);
                    if (data.success) {
                        setAddToBookingItems(data.data);
                        console.log('Set addToBookingItems:', data.data);
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
    }, [activitySelect]); // Refetch when journey type changes

    // Get filtered API items based on journey type
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
        
        console.log('Current journey type:', currentJourneyType);
        console.log('Available add-to-booking items:', addToBookingItems);
        
        // Filter API items by journey type and active status
        const apiItems = addToBookingItems
            .filter(item => {
                // Check if item is active
                if (!item.is_active) return false;
                
                // Check if item has journey_types and if it includes the current journey type
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
                        
                        console.log(`Item "${item.title}" journey types:`, journeyTypes);
                        console.log(`Checking if "${currentJourneyType}" is in:`, journeyTypes);
                        
                        return journeyTypes.includes(currentJourneyType);
                    } catch (error) {
                        console.warn(`Error parsing journey_types for item "${item.title}":`, error);
                        return false;
                    }
                }
                
                // If no journey_types specified, don't show the item
                return false;
            })
            .map(item => ({
                name: item.title,
                price: item.price.toString(),
                image: item.image_url ? item.image_url : AddOn1,
                description: item.description,
                category: item.category,
                isPhysicalItem: item.is_physical_item,
                priceUnit: item.price_unit
            }));
        
        console.log('Filtered API items for journey type:', currentJourneyType, ':', apiItems);
        return apiItems;
    };

    const filteredItems = getFilteredItems();
    console.log('Final filtered items:', filteredItems);
    console.log('Current activitySelect:', activitySelect);

    // Handle checkbox toggle when div is clicked
    function handleAddOnChange(name, price) {
        setChooseAddOn(prev => {
            prev = Array.isArray(prev) ? prev : []; // Ensure prev is always an array
            const exists = prev.some(addOn => addOn.name === name);
            return exists ? prev.filter(addOn => addOn.name !== name) : [...prev, { name, price }];
        });
    }    
    console.log('chooseAddOn?', chooseAddOn);


    return (
        <Accordion title="Add To Booking" id="add-on" activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion}>
            <div className="tab_box add-on-card scroll-box vouch">
                {addToBookingLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p>Loading add to booking items...</p>
                    </div>
                ) : (
                    filteredItems.map((item, index) => {
                        const isSelected = Array.isArray(chooseAddOn) && chooseAddOn.some(addOn => addOn.name === item.name);
                        return (
                            <div className={`loc_data ${isSelected ? 'active-add-on-wrap' : ""}`} key={index} onClick={() => handleAddOnChange(item.name, item.price)}>
                                <div>
                                    <img 
                                        src={item.image} 
                                        alt={item.name} 
                                        width="100%" 
                                        onError={(e) => {
                                            e.target.src = AddOn1; // Fallback to default image
                                        }}
                                    />
                                </div>
                                <div className="vouch-text">
                                    <div className="vouch-header">
                                        <p className="vouch-title">{item.name}</p>
                                        <p className="vouch-price">£{item.price}</p>
                                    </div>
                                    {item.description && (
                                        <p className="vouch-desc">{item.description}</p>
                                    )}
                                </div>
                                <span className={`add-on-input ${isSelected ? 'active-add-on' : ""}`}></span>
                            </div>
                        )
                    })
                )}
            </div>
        </Accordion>
    );
};

export default AddOnsSection;
