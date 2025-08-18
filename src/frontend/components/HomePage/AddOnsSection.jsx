import React, { useState, useEffect } from "react";
import Accordion from "../Common/Accordion";
import AddOn1 from '../../../assets/images/addOn1.png';
import AddOn2 from '../../../assets/images/addOn2.png';

const AddOnsSection = ({ isGiftVoucher, isRedeemVoucher, isFlightVoucher, chooseAddOn, setChooseAddOn, activeAccordion, setActiveAccordion, chooseLocation, chooseFlightType, activitySelect }) => {
    const [addToBookingItems, setAddToBookingItems] = useState([]);
    const [addToBookingLoading, setAddToBookingLoading] = useState(true);

    // Fetch add to booking items from API
    useEffect(() => {
        const fetchAddToBookingItems = async () => {
            try {
                setAddToBookingLoading(true);
                const response = await fetch('http://localhost:3002/api/add-to-booking-items');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setAddToBookingItems(data.data);
                    }
                }
            } catch (error) {
                console.error('Error fetching add to booking items:', error);
            } finally {
                setAddToBookingLoading(false);
            }
        };

        fetchAddToBookingItems();
    }, []);

    // Combine API items with hardcoded items based on conditions
    var addOns = [];
    
    if (chooseLocation == 'Somerset' && chooseFlightType?.type == "Private Flight") {
        addOns = [
            { name: "Choose Launch Site", price: "165", image: AddOn2 }
        ];
    } else if (chooseFlightType?.type == "Private Flight" && chooseFlightType?.passengerCount == 2) {
        addOns = [
            { name: "Proposal Package", price: "155", image: AddOn1 }
        ];
    } else if (activitySelect == "Redeem Voucher" || activitySelect == "Buy Gift") {
        addOns = [
            { name: "Voucher Extension", price: "25", image: AddOn1 },
            { name: "FAB Cap", price: "20", image: AddOn2 },
        ];
    } else if (chooseFlightType?.type == "Private Flight") {
        addOns = [
            { name: "FAB Cap", price: "20", image: AddOn2 },
            { name: "Inflight Video", price: "50", image: AddOn1 },
            { name: "Upgrade Field Drinks", price: "TBC", image: AddOn2 },
            { name: "Weather Refundable", price: "10", image: AddOn1 }
        ];
    } else {
        addOns = [
            { name: "FAB Cap", price: "20", image: AddOn2 }
        ];
    }

    // Add API items to the list
    if (addToBookingItems.length > 0) {
        const apiItems = addToBookingItems
            .filter(item => item.is_active)
            .map(item => ({
                name: item.title,
                price: item.price.toString(),
                image: item.image_url ? item.image_url : AddOn1,
                description: item.description,
                category: item.category,
                isPhysicalItem: item.is_physical_item,
                priceUnit: item.price_unit
            }));
        
        addOns = [...addOns, ...apiItems];
    }

    // Buy Gift seçiliyse sadece postal voucher göster
    if (activitySelect === "Buy Gift") {
        addOns = [
            { name: "Postal vouchers", price: "7.50", image: AddOn1, isPostal: true }
        ];
    }

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
                    addOns.map((item, index) => {
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
                                        <p className="vouch-title">{item.name} {item.isPostal && isSelected && <span style={{ color: '#4CAF50', fontWeight: 500 }}>+£7.50</span>}</p>
                                        <p className="vouch-price">{item.name !== 'Weather Refundable' ? "£" : ""}{item.price}{item.name === 'Weather Refundable' ? "%" : ""}</p>
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
