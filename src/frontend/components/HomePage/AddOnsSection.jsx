import React from "react";
import Accordion from "../Common/Accordion";
import AddOn1 from '../../../assets/images/addOn1.png';
import AddOn2 from '../../../assets/images/addOn2.png';

const AddOnsSection = ({ isGiftVoucher, isRedeemVoucher, isFlightVoucher, chooseAddOn, setChooseAddOn, activeAccordion, setActiveAccordion, chooseLocation, chooseFlightType, activitySelect }) => {

    var addOns;
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

    // Buy Gift seçiliyse postal voucher ekle
    if (activitySelect === "Buy Gift") {
        addOns = [
            ...addOns,
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
        <Accordion title="Add To Booking" id="add-on" activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} className={`${isFlightVoucher || isRedeemVoucher ? 'disable-acc' : ''}`} >
            <div className="tab_box add-on-card scroll-box vouch">
                {addOns.map((item, index) => {
                    const isSelected = Array.isArray(chooseAddOn) && chooseAddOn.some(addOn => addOn.name === item.name);
                    return (
                        <div className={`loc_data ${isSelected ? 'active-add-on-wrap' : ""}`} key={index} onClick={() => handleAddOnChange(item.name, item.price)}>
                            <div>
                                <img src={item.image} alt={item.name} width="100%" />
                            </div>
                            <div className="vouch-text">
                                <p>{item.name} {item.isPostal && isSelected && <span style={{ color: '#4CAF50', fontWeight: 600 }}>+£7.50</span>}</p>
                                <p>{item.name !== 'Weather Refundable' ? "£" : ""}{item.price}{item.name === 'Weather Refundable' ? "%" : ""}</p>
                            </div>
                            <span className={`add-on-input ${isSelected ? 'active-add-on' : ""}`}></span>
                        </div>
                    )
                })}
            </div>
        </Accordion>
    );
};

export default AddOnsSection;
