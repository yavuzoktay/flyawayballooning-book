// EnterRecipientDetails.js
import React, { useState, forwardRef, useImperativeHandle } from "react";
import Accordion from "../Common/Accordion";
import { BsInfoCircle } from "react-icons/bs";

const EnterRecipientDetails = forwardRef(({ isBookFlight, isRedeemVoucher, isFlightVoucher, isGiftVoucher, recipientDetails, setRecipientDetails, activeAccordion, setActiveAccordion, onSectionCompletion, isDisabled = false }, ref) => {
    const [emailError, setEmailError] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [skipRecipientDetails, setSkipRecipientDetails] = useState(false);

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

    const handleSkipRecipientDetails = () => {
        setSkipRecipientDetails(true);
        // Clear any validation errors
        setValidationErrors({});
        setEmailError(false);
        
        // Mark recipient details as skipped in the state
        setRecipientDetails(prev => ({
            ...prev,
            isSkipped: true
        }));
        
        // Trigger section completion to move to next step
        if (onSectionCompletion) {
            onSectionCompletion('recipient-details');
        }
    };

    // Required validation function for Buy Gift
    const validateFields = () => {
        if (!isGiftVoucher) return true;
        
        // If user chose to skip recipient details, validation passes
        if (skipRecipientDetails || recipientDetails?.isSkipped) return true;
        
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

    // Warn on close if Buy Gift and required fields are empty
    const onBeforeClose = () => {
        if (!isGiftVoucher) return true;
        // If user chose to skip, allow closing without validation
        if (skipRecipientDetails || recipientDetails?.isSkipped) return true;
        const valid = validateFields();
        if (!valid) {
            alert('Recipient Details are required for Buy Gift. Please fill in all fields or choose "Don’t enter recipient details".');
            return false; // prevent closing
        }
        return true;
    };

    return (
        <Accordion 
            title="Recipient Details"  
            id="recipient-details" 
            activeAccordion={activeAccordion} 
            setActiveAccordion={setActiveAccordion} 
            className={`${isFlightVoucher || isRedeemVoucher || isBookFlight ? 'disable-acc' : ''}`}
            isDisabled={isDisabled} 
            disabled={isBookFlight}
            onBeforeClose={onBeforeClose}
        >
            <div className="Recipient">
                {/* Skip Recipient Details Button */}
                {isGiftVoucher && !skipRecipientDetails && !recipientDetails?.isSkipped && (
                    <div style={{ 
                        marginBottom: '20px', 
                        padding: '12px', 
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <button
                            type="button"
                            onClick={handleSkipRecipientDetails}
                            style={{
                                border: '1px solid #d1d5db',
                                background: '#fff',
                                color: '#374151',
                                padding: '8px 14px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                                transition: 'all 0.2s ease',
                                boxSizing: 'border-box',
                                minHeight: '36px'
                            }}
                        >
                            Don’t enter recipient details
                        </button>
                    </div>
                )}

                {/* Show success message if skipped */}
                {isGiftVoucher && (skipRecipientDetails || recipientDetails?.isSkipped) && (
                    <div style={{ 
                        marginBottom: '20px', 
                        padding: '12px', 
                        backgroundColor: '#d4edda', 
                        border: '1px solid #c3e6cb', 
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <p style={{ 
                            margin: '0', 
                            fontSize: '14px', 
                            color: '#155724',
                            fontWeight: '500'
                        }}>
                            ✓ Recipient details skipped - you can add them later
                        </p>
                    </div>
                )}

                <div className="form-presnger" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px',
                    width: '100%',
                    maxWidth: '100%',
                    margin: '0',
                    padding: '0 8px'
                }}>
                    {/* Recipient Name */}
                    <div style={{ width: '100%', minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label style={{ 
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '4px',
                                display: 'block',
                            }}>Recipient Name{isGiftVoucher && <span style={{ color: 'red' }}>*</span>}</label>
                            <div className="info-icon-container recipient-tooltip">
                                <BsInfoCircle size={14} style={{ width: 14, height: 14 }} />
                                <div className="hover-text recipient-hover-text">
                                    <p>Share the recipient's details so we can get in touch with them to arrange their flight. Rest assured, we won't contact them until after the gifted date has passed. Vouchers will be sent to the purchaser.</p>
                                </div>
                            </div>
                        </div>
                        <input
                            type="text"
                            name="name"
                            required={isGiftVoucher && !(skipRecipientDetails || recipientDetails?.isSkipped)}
                            value={recipientDetails.name}
                            onChange={handleChange}
                            placeholder="Recipient Name"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #e5e7eb',
                                borderRadius: 'px',
                                fontSize: '16px',
                                minHeight: '35px',
                                boxSizing: 'border-box',
                                ...(validationErrors.name ? { border: '1.5px solid red' } : {})
                            }}
                        />
                        {validationErrors.name && <span style={{ color: 'red', fontSize: 12 }}>Recipient name is required</span>}
                    </div>

                    {/* Recipient Email */}
                    <div style={{ width: '100%', minWidth: 0 }}>
                        <label style={{ 
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px',
                            display: 'block',
                        }}>Recipient Email{isGiftVoucher && <span style={{ color: 'red' }}>*</span>}</label>
                        <input
                            type="email"
                            name="email"
                            required={isGiftVoucher && !(skipRecipientDetails || recipientDetails?.isSkipped)}
                            value={recipientDetails.email}
                            onChange={handleChange}
                            placeholder="Recipient Email"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '16px',
                                minHeight: '35px',
                                boxSizing: 'border-box',
                                ...((emailError || validationErrors.email) ? { border: '1.5px solid red' } : {})
                            }}
                        />
                        {emailError && <span style={{ color: 'red', fontSize: 12 }}>Invalid email format</span>}
                        {validationErrors.email && !emailError && <span style={{ color: 'red', fontSize: 12 }}>Recipient email is required</span>}
                    </div>

                    {/* Recipient Phone Number */}
                    <div style={{ width: '100%', minWidth: 0 }}>
                        <label style={{ 
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px',
                            display: 'block',
                        }}>Recipient Phone Number{isGiftVoucher && <span style={{ color: 'red' }}>*</span>}</label>
                        <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            name="phone"
                            required={isGiftVoucher && !(skipRecipientDetails || recipientDetails?.isSkipped)}
                            value={recipientDetails.phone}
                            onChange={handleChange}
                            placeholder="Recipient Phone Number"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '16px',
                                minHeight: '35px',
                                boxSizing: 'border-box',
                                ...(validationErrors.phone ? { border: '1.5px solid red' } : {})
                            }}
                        />
                        {validationErrors.phone && <span style={{ color: 'red', fontSize: 12 }}>Recipient phone number is required</span>}
                    </div>

                    {/* Date Voucher to be Gifted */}
                    <div style={{ width: '100%', minWidth: 0 }}>
                        <label style={{ 
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px',
                            display: 'block',
                        }}>Date Voucher to be Gifted{isGiftVoucher && <span style={{ color: 'red' }}>*</span>}</label>
                        <input
                            type="date"
                            name="date"
                            value={recipientDetails.date || ''}
                            onChange={handleChange}
                            required={isGiftVoucher && !(skipRecipientDetails || recipientDetails?.isSkipped)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '16px',
                                minHeight: '35px',
                                boxSizing: 'border-box',
                                ...(validationErrors.date ? { border: '1.5px solid red' } : {})
                            }}
                            className="recipient-date-input"
                        />
                        {validationErrors.date && <span style={{ color: 'red', fontSize: 12 }}>Gift date is required</span>}
                    </div>
                </div>
            </div>
        </Accordion>
    );
});

export default EnterRecipientDetails;

