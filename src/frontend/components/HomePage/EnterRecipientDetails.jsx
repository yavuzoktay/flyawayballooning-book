// EnterRecipientDetails.js
import React, { useState, forwardRef, useImperativeHandle } from "react";
import Accordion from "../Common/Accordion";
import { BsInfoCircle } from "react-icons/bs";

const EnterRecipientDetails = forwardRef(({ isBookFlight, isRedeemVoucher, isFlightVoucher, isGiftVoucher, recipientDetails, setRecipientDetails, activeAccordion, setActiveAccordion }, ref) => {
    const [emailError, setEmailError] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (e) => {
        let value = e.target.value;
        
        // Handle input validation and filtering
        if (e.target.name === 'name') {
            // Only allow letters and spaces for name
            value = value.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]/g, '');
        } else if (e.target.name === 'phone') {
            // Only allow numbers for phone
            value = value.replace(/[^0-9]/g, '');
        }
        
        setRecipientDetails({ ...recipientDetails, [e.target.name]: value });
        
        // Clear validation error when user starts typing
        if (validationErrors[e.target.name]) {
            setValidationErrors(prev => ({ ...prev, [e.target.name]: false }));
        }
        
        if (e.target.name === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            setEmailError(value && !emailRegex.test(value));
        }
    };

    const handleCheckboxChange = () => {
        setRecipientDetails((prevDetails) => ({
            ...prevDetails,
            isNoRecipient: !prevDetails.isNoRecipient,
        }));
    };

    // Required validation function for Buy Gift
    const validateFields = () => {
        if (!isGiftVoucher) return true;
        
        const errors = {};
        
        // All fields are required again for Buy Gift
        
        // Name validation
        if (!recipientDetails.name || !recipientDetails.name.trim()) {
            errors.name = true;
            console.log('❌ Recipient name validation failed:', recipientDetails.name);
        }
        
        // Email validation (format + required)
        if (!recipientDetails.email || !recipientDetails.email.trim()) {
            errors.email = true;
            console.log('❌ Recipient email validation failed (empty):', recipientDetails.email);
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(recipientDetails.email.trim())) {
                errors.email = true;
                console.log('❌ Recipient email validation failed (format):', recipientDetails.email);
            }
        }
        
        // Phone validation  
        if (!recipientDetails.phone || !recipientDetails.phone.trim()) {
            errors.phone = true;
            console.log('❌ Recipient phone validation failed:', recipientDetails.phone);
        }
        
        // Date validation
        if (!recipientDetails.date || !recipientDetails.date.trim()) {
            errors.date = true;
            console.log('❌ Recipient date validation failed:', recipientDetails.date);
        } else {
            // Additional date format validation
            const dateValue = new Date(recipientDetails.date);
            if (isNaN(dateValue.getTime())) {
                errors.date = true;
                console.log('❌ Recipient date validation failed (invalid date):', recipientDetails.date);
            }
        }
        
        console.log('🎁 Recipient Details required validation result:', {
            recipientDetails,
            errors,
            isValid: Object.keys(errors).length === 0,
            message: 'All fields are required again for Buy Gift'
        });
        
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
                <form onSubmit={(e) => e.preventDefault()}>
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

