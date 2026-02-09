// EnterRecipientDetails.js
import React, { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import Accordion from "../Common/Accordion";
import { BsInfoCircle } from "react-icons/bs";
import { Tooltip as ReactTooltip } from 'react-tooltip';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { trackCheckoutStarted } from '../../../utils/googleAdsTracking';

const EnterRecipientDetails = forwardRef(({ isBookFlight, isRedeemVoucher, isFlightVoucher, isGiftVoucher, recipientDetails, setRecipientDetails, activeAccordion, setActiveAccordion, onSectionCompletion, isDisabled = false }, ref) => {
    const [emailError, setEmailError] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    // Detect mobile viewport; only affects rendering of the gift date input
    useEffect(() => {
        const media = window.matchMedia('(max-width: 768px)');
        const setFlag = () => setIsMobile(media.matches);
        setFlag();
        try {
            media.addEventListener('change', setFlag);
        } catch (_) {
            // Safari fallback
            media.addListener(setFlag);
        }
        return () => {
            try {
                media.removeEventListener('change', setFlag);
            } catch (_) {
                media.removeListener(setFlag);
            }
        };
    }, []);

    // Convert date string to Date object for DatePicker
    const getDateValue = () => {
        if (!recipientDetails.date) return null;
        const date = new Date(recipientDetails.date);
        return isNaN(date.getTime()) ? null : date;
    };

    // Handle date change from DatePicker
    const handleDateChange = (date) => {
        if (date) {
            // Format date as YYYY-MM-DD for consistency
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            setRecipientDetails({ ...recipientDetails, date: formattedDate });
            
            // Clear validation error
            if (validationErrors.date) {
                setValidationErrors(prev => ({ ...prev, date: false }));
            }
        } else {
            setRecipientDetails({ ...recipientDetails, date: '' });
        }
    };
    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (e) => {
        // Google Ads: GA_Checkout_Started (Stage 6) - purchaser info for gift flow
        trackCheckoutStarted('purchaser');
        
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
        
        // Name her zaman zorunlu
        if (!recipientDetails.name || !recipientDetails.name.trim()) {
            errors.name = true;
            console.log('❌ Recipient name validation failed:', recipientDetails.name);
        }
        
        // Email: Buy Gift için OPSİYONEL, ama DOLDURULURSA format kontrolü yap
        if (recipientDetails.email && recipientDetails.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(recipientDetails.email.trim())) {
                errors.email = true;
                console.log('❌ Recipient email validation failed (format):', recipientDetails.email);
            }
        }
        
        // Phone: Buy Gift için OPSİYONEL, ama DOLDURULURSA sadece boşluk kontrolü yap
        if (recipientDetails.phone && !recipientDetails.phone.trim()) {
            errors.phone = true;
            console.log('❌ Recipient phone validation failed (whitespace-only):', recipientDetails.phone);
        }
        
        // Date her zaman zorunlu
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
            message: 'Name and Gift Date are required; email/phone optional for Buy Gift'
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
        const valid = validateFields();
        if (!valid) {
            alert('Recipient Details are required for Buy Gift. Please fill in Recipient Name and Gift Date.');
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <label style={{ 
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#374151',
                                margin: 0
                            }}>Recipient Name{isGiftVoucher && <span style={{ color: 'red' }}>*</span>}</label>
                            <BsInfoCircle 
                                data-tooltip-id="recipient-name-tooltip"
                                style={{ color: '#3b82f6', cursor: 'pointer', width: 14, height: 14, flexShrink: 0 }} 
                            />
                            <ReactTooltip
                                id="recipient-name-tooltip"
                                place="top"
                                content="Share the recipient's details so we can get in touch with them to arrange their flight. Rest assured, we won't contact them until after the gifted date has passed. Vouchers will be sent to the purchaser."
                                style={{
                                    maxWidth: '280px',
                                    fontSize: '13px',
                                    textAlign: 'center',
                                    backgroundColor: '#1f2937',
                                    color: '#ffffff',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    zIndex: 9999
                                }}
                            />
                        </div>
                        <input
                            type="text"
                            name="name"
                            required={isGiftVoucher}
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
                        }}>Recipient Email</label>
                        <input
                            type="email"
                            name="email"
                            // optional for Buy Gift
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
                        {validationErrors.email && !emailError && <span style={{ color: 'red', fontSize: 12 }}>Invalid or empty email</span>}
                    </div>

                    {/* Recipient Phone Number */}
                    <div style={{ width: '100%', minWidth: 0 }}>
                        <label style={{ 
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px',
                            display: 'block',
                        }}>Recipient Phone Number</label>
                        <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            name="phone"
                            // optional for Buy Gift
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
                        {isMobile ? (
                            // Mobile: Use native date input for better mobile experience
                            <div style={{ position: 'relative', width: '100%' }}>
                                <input
                                    type="date"
                                    name="date"
                                    value={recipientDetails.date || ''}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    required={isGiftVoucher}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: validationErrors.date ? '1.5px solid red' : '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '16px',
                                        minHeight: '44px',
                                        boxSizing: 'border-box',
                                        backgroundColor: '#fff',
                                        WebkitAppearance: 'none',
                                        appearance: 'none',
                                        color: recipientDetails.date ? '#374151' : 'transparent',
                                    }}
                                    className="recipient-date-input-mobile"
                                />
                                {!recipientDetails.date && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left: '16px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            pointerEvents: 'none',
                                            color: '#9ca3af',
                                            fontSize: '16px',
                                            userSelect: 'none',
                                        }}
                                        className="recipient-date-placeholder"
                                    >
                                        Select a date
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Desktop: Use DatePicker for better UX
                            <div style={{ position: 'relative' }}>
                                <DatePicker
                                    selected={getDateValue()}
                                    onChange={handleDateChange}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="Select a date"
                                    minDate={new Date()}
                                    required={isGiftVoucher}
                                    wrapperClassName="date-picker-wrapper"
                                    className={`recipient-date-input ${validationErrors.date ? 'error' : ''}`}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                        border: validationErrors.date ? '1.5px solid red' : '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    fontSize: '16px',
                                    minHeight: '35px',
                                    boxSizing: 'border-box',
                                        cursor: 'pointer',
                                        backgroundColor: '#fff',
                                    }}
                                    calendarClassName="recipient-date-calendar"
                                    popperPlacement="bottom"
                                    popperClassName="recipient-date-popper"
                                />
                            <style>{`
                                .date-picker-wrapper {
                                    width: 100%;
                                }
                                .recipient-date-input {
                                    width: 100% !important;
                                    padding: 12px 16px !important;
                                    border: 1px solid #e5e7eb !important;
                                    border-radius: 6px !important;
                                    font-size: 16px !important;
                                    min-height: 35px !important;
                                    box-sizing: border-box !important;
                                    cursor: pointer !important;
                                    background-color: #fff !important;
                                }
                                .recipient-date-input.error {
                                    border: 1.5px solid red !important;
                                }
                                .recipient-date-input:focus {
                                    outline: none !important;
                                    border-color: #3b82f6 !important;
                                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
                                }
                                .recipient-date-calendar {
                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
                                    border-radius: 8px !important;
                                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                                }
                                .recipient-date-calendar .react-datepicker__header {
                                    background-color: #3b82f6 !important;
                                    border-bottom: none !important;
                                    border-radius: 8px 8px 0 0 !important;
                                    padding-top: 12px !important;
                                }
                                .recipient-date-calendar .react-datepicker__current-month {
                                    color: #fff !important;
                                    font-weight: 600 !important;
                                    font-size: 16px !important;
                                }
                                .recipient-date-calendar .react-datepicker__day-name {
                                    color: #fff !important;
                                    font-weight: 500 !important;
                                }
                                .recipient-date-calendar .react-datepicker__day--selected,
                                .recipient-date-calendar .react-datepicker__day--keyboard-selected {
                                    background-color: #3b82f6 !important;
                                    border-radius: 6px !important;
                                }
                                .recipient-date-calendar .react-datepicker__day:hover {
                                    background-color: #dbeafe !important;
                                    border-radius: 6px !important;
                                }
                                .recipient-date-calendar .react-datepicker__day--today {
                                    font-weight: 600 !important;
                                    border: 1px solid #3b82f6 !important;
                                }
                                .recipient-date-calendar .react-datepicker__day--disabled {
                                    color: #d1d5db !important;
                                    cursor: not-allowed !important;
                                }
                                .recipient-date-popper {
                                    z-index: 9999 !important;
                                }
                            `}</style>
                            </div>
                        )}
                        <style>{`
                            /* Mobile native date input styling */
                            .recipient-date-input-mobile {
                                width: 100% !important;
                                padding: 12px 16px !important;
                                border: 1px solid #e5e7eb !important;
                                border-radius: 6px !important;
                                font-size: 16px !important;
                                min-height: 44px !important;
                                box-sizing: border-box !important;
                                background-color: #fff !important;
                                -webkit-appearance: none !important;
                                appearance: none !important;
                            }
                            .recipient-date-input-mobile:focus {
                                outline: none !important;
                                border-color: #3b82f6 !important;
                                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
                            }
                            .recipient-date-input-mobile::-webkit-calendar-picker-indicator {
                                cursor: pointer !important;
                                opacity: 1 !important;
                                width: 20px !important;
                                height: 20px !important;
                                padding: 4px !important;
                                position: relative !important;
                                z-index: 1 !important;
                            }
                            .recipient-date-input-mobile::-webkit-inner-spin-button,
                            .recipient-date-input-mobile::-webkit-clear-button {
                                display: none !important;
                            }
                            .recipient-date-placeholder {
                                pointer-events: none !important;
                                user-select: none !important;
                            }
                            @media (max-width: 768px) {
                                .recipient-date-input-mobile {
                                    font-size: 16px !important;
                                    padding: 14px 16px !important;
                                    min-height: 48px !important;
                                }
                                .recipient-date-placeholder {
                                    font-size: 16px !important;
                                    left: 16px !important;
                                }
                            }
                        `}</style>
                        {validationErrors.date && <span style={{ color: 'red', fontSize: 12, marginTop: '4px', display: 'block' }}>Gift date is required</span>}
                    </div>
                </div>
            </div>
        </Accordion>
    );
});

export default EnterRecipientDetails;

