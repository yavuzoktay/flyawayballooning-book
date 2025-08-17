import React, { useState, forwardRef, useImperativeHandle, useEffect } from "react";
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
    const [additionalInfoQuestions, setAdditionalInfoQuestions] = useState([]);
    const [additionalInfoLoading, setAdditionalInfoLoading] = useState(true);

    // Fetch additional information questions from API
    useEffect(() => {
        const fetchAdditionalInfoQuestions = async () => {
            try {
                setAdditionalInfoLoading(true);
                const response = await fetch('http://localhost:3002/api/additional-information-questions');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setAdditionalInfoQuestions(data.data);
                    }
                }
            } catch (error) {
                console.error('Error fetching additional information questions:', error);
            } finally {
                setAdditionalInfoLoading(false);
            }
        };

        fetchAdditionalInfoQuestions();
    }, []);

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
        
        // Validate API questions
        additionalInfoQuestions
            .filter(q => q.is_active && q.is_required)
            .forEach(question => {
                const fieldName = `question_${question.id}`;
                if (!additionalInfo[fieldName]?.trim()) {
                    errors[fieldName] = true;
                }
            });
        
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

                {/* API Questions */}
                {additionalInfoLoading ? (
                    <div className="mt-4 text-center">
                        <p>Loading additional questions...</p>
                    </div>
                ) : (
                    additionalInfoQuestions
                        .filter(question => question.is_active)
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map(question => {
                            const fieldName = `question_${question.id}`;
                            const isRequired = question.is_required;
                            
                            return (
                                <div key={question.id} className="selector mt-4">
                                    <label className="block text-base font-semibold">
                                        {question.question_text}
                                        {isRequired && <span style={{ color: 'red' }}>*</span>}
                                    </label>
                                    
                                    {question.question_type === 'dropdown' && (
                                        <select
                                            name={fieldName}
                                            className="w-full border p-2 rounded mt-2"
                                            onChange={handleChange}
                                            value={additionalInfo[fieldName] || ""}
                                            required={isRequired}
                                            style={validationErrors[fieldName] ? { border: '1.5px solid red' } : {}}
                                        >
                                            <option value="">Please select</option>
                                            {question.options && question.options !== '[]' && 
                                                JSON.parse(question.options).map((option, index) => (
                                                    <option key={index} value={option}>{option}</option>
                                                ))
                                            }
                                        </select>
                                    )}
                                    
                                    {question.question_type === 'text' && (
                                        <textarea
                                            name={fieldName}
                                            rows="3"
                                            className="w-full border p-2 rounded mt-2"
                                            onChange={handleChange}
                                            value={additionalInfo[fieldName] || ""}
                                            placeholder={question.placeholder_text || ""}
                                            required={isRequired}
                                            style={validationErrors[fieldName] ? { border: '1.5px solid red' } : {}}
                                        />
                                    )}
                                    
                                    {question.question_type === 'radio' && (
                                        <div className="mt-2">
                                            {question.options && question.options !== '[]' && 
                                                JSON.parse(question.options).map((option, index) => (
                                                    <label key={index} className="block mb-2">
                                                        <input
                                                            type="radio"
                                                            name={fieldName}
                                                            value={option}
                                                            onChange={handleChange}
                                                            checked={additionalInfo[fieldName] === option}
                                                            required={isRequired}
                                                            className="mr-2"
                                                        />
                                                        {option}
                                                    </label>
                                                ))
                                            }
                                        </div>
                                    )}
                                    
                                    {question.question_type === 'checkbox' && (
                                        <div className="mt-2">
                                            {question.options && question.options !== '[]' && 
                                                JSON.parse(question.options).map((option, index) => (
                                                    <label key={index} className="block mb-2">
                                                        <input
                                                            type="checkbox"
                                                            name={fieldName}
                                                            value={option}
                                                            onChange={(e) => {
                                                                const currentValues = additionalInfo[fieldName] ? additionalInfo[fieldName].split(',').filter(v => v.trim()) : [];
                                                                if (e.target.checked) {
                                                                    currentValues.push(option);
                                                                } else {
                                                                    const index = currentValues.indexOf(option);
                                                                    if (index > -1) {
                                                                        currentValues.splice(index, 1);
                                                                    }
                                                                }
                                                                setAdditionalInfo(prev => ({
                                                                    ...prev,
                                                                    [fieldName]: currentValues.join(', ')
                                                                }));
                                                            }}
                                                            checked={additionalInfo[fieldName] ? additionalInfo[fieldName].split(',').map(v => v.trim()).includes(option) : false}
                                                            className="mr-2"
                                                        />
                                                        {option}
                                                    </label>
                                                ))
                                            }
                                        </div>
                                    )}
                                    
                                    {question.help_text && (
                                        <p className="text-sm text-gray-600 mt-1">{question.help_text}</p>
                                    )}
                                    
                                    {validationErrors[fieldName] && (
                                        <span style={{ color: 'red', fontSize: 12 }}>
                                            This field is required
                                        </span>
                                    )}
                                </div>
                            );
                        })
                )}
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