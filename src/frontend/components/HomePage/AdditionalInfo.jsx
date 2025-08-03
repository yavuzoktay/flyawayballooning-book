import React, { useState, forwardRef, useImperativeHandle } from "react";
import Accordion from "../Common/Accordion";

const hearUs = [
    "Spotted our Balloon, Vehicle or Trailer",
    "Visit Bristol/Bath",
    "The Bath Gin Company",
    "TripAdvisor",
    "Word of Mouth",
    "Received Gift Voucher",
    "Printed Advert, Poster or Banner",
    "I've Forgotten",
    "Instagram",
    "Hotel/B&B",
    "Google",
    "Facebook",
    "Email Marketing",
    "Bing"
];

const ballooningReason = [
    "Birthday",
    "Anniversary",
    "Christmas Gift",
    "Other Celebration",
    "Bucket List",
    "Family Experience",
    "Romantic Date/Proposal",
    "Tourist Activity",
    "Recommended",
    "Escaping The Everyday"
]

const prefer = [
    "Champagne",
    "Prosecco",
    "No Drink",
    "We'll bring our own"
]

export function validateAdditionalInfo(additionalInfo, flightType, isBookFlight = false, isRedeemVoucher = false) {
    return {
        notes: !additionalInfo.notes,
        hearAboutUs: !additionalInfo.hearAboutUs,
        reason: !additionalInfo.reason,
        prefer: (isBookFlight || isRedeemVoucher) && flightType === "Private Charter" ? !additionalInfo.prefer : false,
    };
}

const AdditionalInfo = forwardRef(({ isGiftVoucher, isRedeemVoucher, isBookFlight, isFlightVoucher, additionalInfo, setAdditionalInfo, activeAccordion, setActiveAccordion, flightType, errors = {} }, ref) => {
    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;

        setAdditionalInfo((prev) => ({
            ...prev,
            [name]: value, // Directly set the value instead of handling checkboxes
        }));

        // Clear validation error when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: false }));
        }
    };

    // Validation function
    const validateFields = () => {
        const errors = {};
        
        // Additional Notes is NOT required
        // Only validate other fields
        
        if (!additionalInfo.hearAboutUs?.trim()) errors.hearAboutUs = true;
        if (!additionalInfo.reason?.trim()) errors.reason = true;
        
        // Prefer is only required for Book Flight or Redeem Voucher with Private Charter
        if ((isBookFlight || isRedeemVoucher) && flightType === 'Private Charter' && !additionalInfo.prefer?.trim()) {
            errors.prefer = true;
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Expose validation function to parent
    useImperativeHandle(ref, () => ({
        validate: validateFields
    }));

    return (
        <Accordion title="Additional Information" id="additional-info" activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion}>
            <div className="add-info p-4">
                <div className="addition-info-notes">
                    <label className="block mb-2 text-base font-semibold">Additional Notes:</label>
                    <textarea
                        name="notes"
                        rows="4"
                        cols="50"
                        className="w-full border p-2 rounded"
                        onChange={handleChange}
                        value={additionalInfo.notes || ""}
                    ></textarea>
                </div>
                {(isBookFlight || isRedeemVoucher) && flightType === 'Private Charter' && (
                    <div className="mt-4 prefer">
                        <label className="block text-base font-semibold">Which would you prefer?<span style={{ color: 'red' }}>*</span></label>
                        <select
                            name="prefer"
                            className="w-full border p-2 rounded mt-2"
                            value={additionalInfo.prefer || ""}
                            onChange={handleChange}
                            required
                            style={validationErrors.prefer ? { border: '1.5px solid red' } : {}}
                        >
                            <option value="">Please select</option>
                            {prefer.map((input, index) => (
                                <option key={index} value={input}>{input}</option>
                            ))}
                        </select>
                        {validationErrors.prefer && <span style={{ color: 'red', fontSize: 12 }}>Please select a preference</span>}
                    </div>
                )}
                {(isRedeemVoucher || isBookFlight || isFlightVoucher) && (
                    <div className="selector mt-4">
                        <label className="block text-base font-semibold">Would you like to receive short notice flight availability?</label>
                        <select
                            name="shortNoticeAvailability"
                            className="w-full border p-2 rounded mt-2"
                            onChange={handleChange}
                            value={additionalInfo.shortNoticeAvailability || ""}
                        >
                            <option value="">Please select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                )}
                
                {isFlightVoucher && (
                    <div className="selector mt-4">
                        <label className="block text-base font-semibold">Which location would you like to fly?</label>
                        <select
                            name="preferredLocation"
                            className="w-full border p-2 rounded mt-2"
                            onChange={handleChange}
                            value={additionalInfo.preferredLocation || ""}
                        >
                            <option value="">Please select</option>
                            <option value="Bath">Bath</option>
                            <option value="Somerset">Somerset</option>
                            <option value="Devon">Devon</option>
                        </select>
                    </div>
                )}

                <div className="selector  mt-4">
                    <p className="block text-base font-semibold">How did you hear about us?<span style={{ color: 'red' }}>*</span></p>
                    <select 
                        name="hearAboutUs" 
                        className="w-full border p-2 rounded mt-2" 
                        onChange={handleChange} 
                        value={additionalInfo.hearAboutUs || ""} 
                        required
                        style={validationErrors.hearAboutUs ? { border: '1.5px solid red' } : {}}
                    >
                        <option value="">Please select</option>
                        {
                            hearUs?.map((opt) => {
                                return (
                                    <option key={opt} value={opt}>{opt}</option>
                                )
                            })
                        }
                    </select>
                    {validationErrors.hearAboutUs && <span style={{ color: 'red', fontSize: 12 }}>Please select how you heard about us</span>}
                </div>

                <div className="selector  mt-4">
                    <label className="block text-base font-semibold">Why Hot Air Ballooning?<span style={{ color: 'red' }}>*</span></label>
                    <select 
                        name="reason" 
                        className="w-full border p-2 rounded mt-2" 
                        onChange={handleChange} 
                        value={additionalInfo.reason || ""} 
                        required
                        style={validationErrors.reason ? { border: '1.5px solid red' } : {}}
                    >
                        <option value="">Please select</option>
                        {
                            ballooningReason?.map((opt) => {
                                return (
                                    <option key={opt} value={opt}>{opt}</option>
                                )
                            })
                        }
                    </select>
                    {validationErrors.reason && <span style={{ color: 'red', fontSize: 12 }}>Please select why you chose hot air ballooning</span>}
                </div>
            </div>
        </Accordion>
    );
});

export default AdditionalInfo;