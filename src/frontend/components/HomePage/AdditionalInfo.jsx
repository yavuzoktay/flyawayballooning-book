import React, { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import Accordion from "../Common/Accordion";
import config from '../../../config';

const AdditionalInfo = forwardRef(({ isGiftVoucher, isRedeemVoucher, isBookFlight, isFlightVoucher, additionalInfo, setAdditionalInfo, activeAccordion, setActiveAccordion, flightType, errors = {} }, ref) => {
    const [validationErrors, setValidationErrors] = useState({});
    const [additionalInfoQuestions, setAdditionalInfoQuestions] = useState([]);
    const [additionalInfoLoading, setAdditionalInfoLoading] = useState(true);

    // Fetch additional information questions from API
    useEffect(() => {
        const fetchAdditionalInfoQuestions = async () => {
            try {
                setAdditionalInfoLoading(true);
                const response = await fetch(`${config.API_BASE_URL}/api/additional-information-questions`);
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
    }, [isBookFlight, isFlightVoucher, isRedeemVoucher, isGiftVoucher]); // Refetch when journey type changes

    // Determine current journey type based on props
    const getCurrentJourneyType = () => {
        if (isBookFlight) return 'Book Flight';
        if (isFlightVoucher) return 'Flight Voucher';
        if (isRedeemVoucher) return 'Redeem Voucher';
        if (isGiftVoucher) return 'Buy Gift';
        return 'Book Flight'; // Default
    };

    // Filter questions by journey type
    const getFilteredQuestions = () => {
        const currentJourneyType = getCurrentJourneyType();
        console.log('Current journey type:', currentJourneyType);
        console.log('Available questions:', additionalInfoQuestions);
        
        return additionalInfoQuestions
            .filter(question => {
                // Check if question is active
                if (!question.is_active) return false;
                
                // Check if question has journey_types and if it includes the current journey type
                if (question.journey_types) {
                    try {
                        let journeyTypes = [];
                        if (Array.isArray(question.journey_types)) {
                            journeyTypes = question.journey_types;
                        } else if (typeof question.journey_types === 'string') {
                            try {
                                journeyTypes = JSON.parse(question.journey_types);
                            } catch (parseError) {
                                // If JSON parsing fails, try to split by comma
                                if (question.journey_types.includes(',')) {
                                    journeyTypes = question.journey_types.split(',').map(type => type.trim());
                                } else {
                                    journeyTypes = [question.journey_types.trim()];
                                }
                            }
                        }
                        
                        console.log(`Question "${question.question_text}" journey types:`, journeyTypes);
                        console.log(`Checking if "${currentJourneyType}" is in:`, journeyTypes);
                        
                        return journeyTypes.includes(currentJourneyType);
                    } catch (error) {
                        console.warn(`Error parsing journey_types for question "${question.question_text}":`, error);
                        return false;
                    }
                }
                
                // If no journey_types specified, don't show the question
                return false;
            })
            .sort((a, b) => a.sort_order - b.sort_order);
    };

    const filteredQuestions = getFilteredQuestions();
    console.log('Filtered questions for journey type:', getCurrentJourneyType(), ':', filteredQuestions);

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
        
        // Only validate API questions - no hardcoded fields
        filteredQuestions
            .filter(q => q.is_required)
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
                    filteredQuestions.map(question => {
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
                                        {question.options && question.options !== '[]' && (() => {
                                            try {
                                                const parsedOptions = JSON.parse(question.options);
                                                if (Array.isArray(parsedOptions)) {
                                                    return parsedOptions.map((option, index) => (
                                                        <option key={index} value={option}>{option}</option>
                                                    ));
                                                } else {
                                                    return <option value="">Invalid options format</option>;
                                                }
                                            } catch (parseError) {
                                                console.warn('Error parsing question options:', parseError, 'Raw value:', question.options);
                                                return <option value="">Invalid options format</option>;
                                            }
                                        })()}
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
                                        {question.options && question.options !== '[]' && (() => {
                                            try {
                                                const parsedOptions = JSON.parse(question.options);
                                                if (Array.isArray(parsedOptions)) {
                                                    return parsedOptions.map((option, index) => (
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
                                                    ));
                                                } else {
                                                    return <div className="text-red-500 text-sm">Invalid options format</div>;
                                                }
                                            } catch (parseError) {
                                                console.warn('Error parsing question options:', parseError, 'Raw value:', question.options);
                                                return <div className="text-red-500 text-sm">Invalid options format</div>;
                                            }
                                        })()}
                                    </div>
                                )}
                                
                                {question.question_type === 'checkbox' && (
                                    <div className="mt-2">
                                        {question.options && question.options !== '[]' && (() => {
                                            try {
                                                const parsedOptions = JSON.parse(question.options);
                                                if (Array.isArray(parsedOptions)) {
                                                    return parsedOptions.map((option, index) => (
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
                                                    ));
                                                } else {
                                                    return <div className="text-red-500 text-sm">Invalid options format</div>;
                                                }
                                            } catch (parseError) {
                                                console.warn('Error parsing question options:', parseError, 'Raw value:', question.options);
                                                return <div className="text-red-500 text-sm">Invalid options format</div>;
                                            }
                                        })()}
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
                
                {/* API Questions are already rendered above */}
            </div>
        </Accordion>
    );
});

export default AdditionalInfo;