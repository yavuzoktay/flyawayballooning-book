// EnterRecipientDetails.js
import React, { useState, forwardRef, useImperativeHandle } from "react";
import Accordion from "../Common/Accordion";
import { BsInfoCircle } from "react-icons/bs";

const EnterRecipientDetails = forwardRef(({ isBookFlight, isRedeemVoucher, isFlightVoucher, isGiftVoucher, recipientDetails, setRecipientDetails, activeAccordion, setActiveAccordion }, ref) => {
    const [emailError, setEmailError] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (e) => {
        setRecipientDetails({ ...recipientDetails, [e.target.name]: e.target.value });
        
        // Clear validation error when user starts typing
        if (validationErrors[e.target.name]) {
            setValidationErrors(prev => ({ ...prev, [e.target.name]: false }));
        }
        
        if (e.target.name === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            setEmailError(e.target.value && !emailRegex.test(e.target.value));
        }
    };

    const handleCheckboxChange = () => {
        setRecipientDetails((prevDetails) => ({
            ...prevDetails,
            isNoRecipient: !prevDetails.isNoRecipient,
        }));
    };

    // Validation function for Buy Gift
    const validateFields = () => {
        if (!isGiftVoucher) return true;
        
        const errors = {};
        if (!recipientDetails.name || !recipientDetails.name.trim()) errors.name = true;
        if (!recipientDetails.email || !recipientDetails.email.trim()) errors.email = true;
        if (!recipientDetails.phone || !recipientDetails.phone.trim()) errors.phone = true;
        if (!recipientDetails.date || !recipientDetails.date.trim()) errors.date = true;
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Expose validation function to parent
    useImperativeHandle(ref, () => ({
        validate: validateFields
    }));

    return (
        <Accordion 
            title="Recipient Details"  
            id="recipent-details" 
            activeAccordion={activeAccordion} 
            setActiveAccordion={setActiveAccordion} 
            className={`${isFlightVoucher || isRedeemVoucher || isBookFlight ? 'disable-acc' : ''}`} 
            disabled={isBookFlight}
        >
            <div className="Recipient">
                <form action="/submit" method="post">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>Recipient Name{isGiftVoucher && <span style={{ color: 'red' }}>*</span>}</label>
                        <div className="info-icon-container recipient-tooltip">
                            <BsInfoCircle size={14} style={{ width: 14, height: 14 }} />
                            <div className="hover-text recipient-hover-text">
                                <p>Share the recipient's details so we can get in touch with them to arrange their flight. Rest assured, we won't contact them until after the gifted date has passed. Vouchers will be sent to the purchaser.</p>
                            </div>
                        </div>
                    </div>
                    <br />
                    <input
                        type="text"
                        onInput={e => e.target.value = e.target.value.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]/g, '')}
                        name="name"
                        required={isGiftVoucher}
                        value={recipientDetails.name}
                        onChange={handleChange}
                        placeholder="Recipient Name"
                        style={validationErrors.name ? { border: '1.5px solid red' } : {}}
                    />
                    {validationErrors.name && <span style={{ color: 'red', fontSize: 12 }}>Recipient name is required</span>}
                    <br /><br />

                    <label>Recipient Email{isGiftVoucher && <span style={{ color: 'red' }}>*</span>}</label><br />
                    <input
                        type="email"
                        name="email"
                        required={isGiftVoucher}
                        value={recipientDetails.email}
                        onChange={handleChange}
                        placeholder="Recipient Email"
                        style={(emailError || validationErrors.email) ? { border: '1.5px solid red' } : {}}
                    />
                    {emailError && <span style={{ color: 'red', fontSize: 12 }}>Invalid email format</span>}
                    {validationErrors.email && !emailError && <span style={{ color: 'red', fontSize: 12 }}>Recipient email is required</span>}
                    <br /><br />

                    <label>Recipient Phone Number{isGiftVoucher && <span style={{ color: 'red' }}>*</span>}</label><br />
                    <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onInput={e => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                        name="phone"
                        required={isGiftVoucher}
                        value={recipientDetails.phone}
                        onChange={handleChange}
                        placeholder="Recipient Phone Number"
                        style={validationErrors.phone ? { border: '1.5px solid red' } : {}}
                    />
                    {validationErrors.phone && <span style={{ color: 'red', fontSize: 12 }}>Recipient phone number is required</span>}
                    <br /><br />

                    <label>Date Voucher to be Gifted{isGiftVoucher && <span style={{ color: 'red' }}>*</span>}</label><br />
                    <input
                        type="date"
                        name="date"
                        value={recipientDetails.date || ''}
                        onChange={handleChange}
                        required={isGiftVoucher}
                        style={validationErrors.date ? { border: '1.5px solid red' } : {}}
                    />
                    {validationErrors.date && <span style={{ color: 'red', fontSize: 12 }}>Gift date is required</span>}
                </form>
            </div>
        </Accordion>
    );
});

export default EnterRecipientDetails;
