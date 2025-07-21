import React, { useState, useEffect } from "react";
import Accordion from "../Common/Accordion";
import { Link } from "react-router-dom";
import axios from 'axios';
import { BsInfoCircle } from 'react-icons/bs';

const weatherRefundableHoverTexts = {
    sharedFlight: "You can select a weather refund option for each passenger for an additional £47.50 per person. This option can be chosen when entering passenger information.",
    privateFlight: "You can make your experience weather refundable for an additional 10% of your experience cost. This option can be selected during the booking process."
};

const API_BASE_URL = process.env.REACT_APP_API_URL;

const ExperienceSection = ({ isRedeemVoucher, setChooseFlightType, addPassenger, setAddPassenger, activeAccordion, setActiveAccordion, activityId, setAvailableSeats, chooseLocation, isFlightVoucher, isGiftVoucher }) => {
    const [showTerms, setShowTerms] = useState(false); // Controls modal visibility
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [locationPricing, setLocationPricing] = useState(null);
    const [loading, setLoading] = useState(false);

    // Determine if Bristol pricing should be used
    const isBristol = chooseLocation === 'Bristol Fiesta';

    // Bristol-specific prices
    const bristolSharedPrice = 305;
    const bristolPrivatePrices = { 2: 1200, 3: 1500 };

    // Fetch pricing data when location changes
    useEffect(() => {
        if (chooseLocation && !isBristol) {
            fetchLocationPricing();
        }
    }, [chooseLocation]);

    const fetchLocationPricing = async () => {
        if (!chooseLocation) return;
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/locationPricing/${encodeURIComponent(chooseLocation)}`);
            if (response.data.success) {
                setLocationPricing(response.data.data);
                // flight_type burada response.data.data.flight_type olarak gelir
            }
        } catch (error) {
            console.error('Error fetching location pricing:', error);
        } finally {
            setLoading(false);
        }
    };

    // Create dynamic experiences based on location pricing
    const getExperiences = () => {
        const sharedPrice = isBristol ? bristolSharedPrice : (locationPricing?.shared_price || 205);
        const privatePrice = isBristol ? null : (locationPricing?.private_price || 900);

        // Calculate private flight prices based on group size
        const privatePrices = {
            2: privatePrice || 900,
            3: privatePrice ? Math.round(privatePrice * 1.5) : 1050,
            4: privatePrice ? Math.round(privatePrice * 2) : 1200,
            8: privatePrice ? Math.round(privatePrice * 4) : 1800
        };

        return [
            {
                title: "Shared Flight",
                price: sharedPrice.toString(),
                desc: "Join a Shared Flight with a maximum of 8 passengers. Perfect for Solo Travellers, Couples and Groups looking to Celebrate Special Occasions or Experience Ballooning.",
                details: [
                    "Around 1 Hour of Air Time", 
                    "Complimentary Drink", 
                    "Free Inflight Photo's and 3D Flight Track", 
                    "24 Month Validity", 
                    {
                        text: "Weather Refundable Option",
                        info: weatherRefundableHoverTexts.sharedFlight
                    }
                ],
                maxFlight: "Max 8 per flight",
                passengerOptions: Array.from({ length: 8 }, (_, i) => i + 1), // Options 1 to 8
            },
            {
                title: "Private Flight",
                price: privatePrice ? (privatePrice / 2).toString() : "450", // Default per person price
                desc: "Private Charter balloon flights for 2,3,4 or 8 passengers. Mostly purchased for Significant Milestones, Proposals, Major Birthdays, Families or Groups of Friends.",
                details: [
                    "A Private Charter Balloon Flight", 
                    "Around 1 Hour of Air Time", 
                    "Choice of Champagne or Prosecco", 
                    "Free Inflight Photo's and 3D Flight Track", 
                    "24 Month Validity", 
                    {
                        text: "Weather Refundable Option",
                        info: weatherRefundableHoverTexts.privateFlight
                    }
                ],
                maxFlight: "",
                passengerOptions: [2, 3, 4, 8],
                specialPrices: {
                    2: privatePrice ? (privatePrice / 2) : 450,  // Price per person for 2 passengers
                    3: privatePrice ? (privatePrice / 3) : 350,  // Price per person for 3 passengers
                    4: privatePrice ? (privatePrice / 4) : 300,  // Price per person for 4 passengers
                    8: privatePrice ? (privatePrice / 8) : 225   // Price per person for 8 passengers
                },
                totalPrices: privatePrices
            },
        ];
    };

    // --- FLIGHT TYPE FILTERING ---
    // locationPricing.flight_type ör: "Private,Shared"
    let allowedTypes = (locationPricing?.flight_type || '').split(',').map(t => t.trim()).filter(Boolean);
    if ((isFlightVoucher || isGiftVoucher) && allowedTypes.length === 0) {
        allowedTypes = ['Shared', 'Private'];
    }
    const experiences = getExperiences().filter(exp => {
        if (exp.title === "Shared Flight") return allowedTypes.includes("Shared");
        if (exp.title === "Private Flight") return allowedTypes.includes("Private");
        return false;
    });
    
    // Debug: Log experiences data
    console.log('Experiences updated:', experiences);
    console.log('Location pricing:', locationPricing);

    // For Private Flight, adjust passenger options and description for Bristol
    const privatePassengerOptions = isBristol ? [2, 3] : [2, 3, 4, 8];
    const privateDesc = isBristol
        ? "Private Charter balloon flights for 2 or 3 passengers. Mostly purchased for Significant Milestones, Proposals, Major Birthdays, Families or Groups of Friends."
        : "Private Charter balloon flights for 2,3,4 or 8 passengers. Mostly purchased for Significant Milestones, Proposals, Major Birthdays, Families or Groups of Friends.";

    // Bristol-specific terms
    const bristolTerms = [
        'Balloon flights are highly dependent on weather conditions and will only proceed if deemed safe by the flight director on the day of the event.',
        'Fiesta Flights are strictly non-refundable under any circumstances and cannot be deferred to the following year\'s Bristol Balloon Fiesta.',
        'If your 2025 Bristol Balloon Fiesta Flight is cancelled, your voucher will remain valid for 24 months and can be redeemed against the equivalent flight i.e a private or shared flight (excluding fiesta flights).',
        'Due to high demand and very limited availability, we are unable to accommodate rescheduling requests during the Fiesta.',
        'Flight premiums are strictly non-refundable under any circumstances due to the additional costs associated with attending the event.',
        'If you are not happy with these terms and conditions please do not book this flight.'
    ];

    // Flight Voucher için özel terms
    const flightVoucherTerms = [
        'Ballooning is a weather dependent activity.',
        'Flight Vouchers are valid for a strict 24 months.',
        'If 10 attempts to fly are made within 24 months which are cancelled by us, we will extend the voucher for a further 12 months free of charge.',
        'The date of your booked flight must be in the validity of your flight voucher.',
        'Non-refundable under any circumstances.',
        'Your flight voucher will never expire so long as you meet the terms & conditions.'
    ];

    // Buy Gift için özel terms
    const buyGiftTerms = [
        "Remember, vouchers are valid for a strict period of 24 months from the original purchase date. For your voucher to be extended for a further 12 months free of charge, you must have made at least 10 attempts to fly within the voucher's validity period.",
        "You can purchase a 12 month voucher extension for £30pp whilst redeeming, instead of £60pp if needed later.",
        "All voucher extension fees must be paid within the validity of your current voucher."
    ];

    const handlePassengerChange = (index, value) => {
        setAddPassenger((prev) => {
            const updatedPassengers = Array(experiences.length).fill(null); // Reset all selections
            updatedPassengers[index] = value ? parseInt(value) : null;
            return updatedPassengers;
        });
    };

    const handleSelectClick = (type, passengerCount, price, index) => {
        if (!passengerCount) return; // Prevent selection without a valid passenger number

        // Calculate the correct price
        let finalPrice, totalPrice;
        if (isBristol && index === 0) {
            // Shared Flight, Bristol pricing
            finalPrice = bristolSharedPrice;
            totalPrice = bristolSharedPrice * passengerCount;
        } else if (isBristol && index === 1 && (passengerCount === 2 || passengerCount === 3)) {
            // Private Flight, Bristol pricing for 2 or 3
            finalPrice = bristolPrivatePrices[passengerCount];
            totalPrice = bristolPrivatePrices[passengerCount];
        } else if (index === 1) {
            // For Private Flight, use the total price directly from experiences
            totalPrice = experiences[1].totalPrices[passengerCount];
            finalPrice = experiences[1].specialPrices[passengerCount]; // Still store the per person price
        } else {
            // For Shared Flight, calculate total from per person price
            finalPrice = price;
            totalPrice = price * passengerCount;
        }

        setSelectedFlight({ 
            type, 
            passengerCount, 
            price: finalPrice,
            totalPrice: totalPrice
        });
        setShowTerms(true); // Show modal
    };

    const confirmSelection = () => {
        if (selectedFlight) {
            setChooseFlightType(selectedFlight);
            getBookingDates(selectedFlight.type);
        }
        setShowTerms(false); // Close modal
    };

    // Get Booking Dates
    async function getBookingDates(type) {
        const response = await axios.post(`${API_BASE_URL}/api/getAvailableSeats`, {
            flight_type: type,
            activity_id: activityId
        });

        if (response.status === 200) {
            const data = response?.data?.result;
            setAvailableSeats(data);
            console.log('Available seats:', data);
        }
    }

    return (
        <Accordion title="Select Experience" id="experience" activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} className={`${isRedeemVoucher ? 'disable-acc' : ''}`} >
            {loading && !isBristol && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    Loading pricing information...
                </div>
            )}
            <div className="flii-scroll" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '8px' }}>
                {experiences.map((exp, index) => (
                    <div className="flight-data" key={index} style={{ flex: '0 0 48%', padding: '15px', boxSizing: 'border-box', border: '1.5px solid #00000080', backgroundColor: '#fff' }}>
                        <div className="flight-head-bin">
                            <h3>{exp.title}</h3>
                            <hr />
                        </div>
                        <div className="full-flight">
                            <p>{index === 1 ? privateDesc : exp.desc}</p>
                            <div className="content-flight">
                                <div className="shared-row">
                                    <ul>
                                        {exp.details.map((detail, i) => {
                                            // Hide Weather Refundable Option if Book Flight and Bristol Fiesta selected
                                            if (
                                                chooseLocation === 'Bristol Fiesta' &&
                                                !isFlightVoucher && !isGiftVoucher && !isRedeemVoucher &&
                                                detail.text === 'Weather Refundable Option'
                                            ) {
                                                return null;
                                            }
                                            return (
                                                (typeof detail === 'string' || (!((isFlightVoucher || isGiftVoucher) && detail.text === 'Weather Refundable Option')))
                                                ? (
                                                    <li key={i} style={typeof detail !== 'string' ? { alignItems: 'baseline', minHeight: '24px' } : {}}>
                                                        {typeof detail === 'string' ? (
                                                            detail
                                                        ) : (
                                                            <span style={{ gap: '6px' }}>
                                                                {detail.text}
                                                                <div className="info-icon-container">
                                                                    <BsInfoCircle size={14} />
                                                                    <div className="hover-text">
                                                                        {detail.info}
                                                                    </div>
                                                                </div>
                                                            </span>
                                                        )}
                                                    </li>
                                                ) : null
                                            );
                                        })}
                                    </ul>
                                </div>
                                <hr />
                                <div className="presger_count">
                                    <div className="pera">
                                        <p>
                                            {index === 0 
                                                ? addPassenger[index] 
                                                    ? `${addPassenger[index]} Passenger${addPassenger[index] > 1 ? 's' : ''}: £${isBristol ? bristolSharedPrice * addPassenger[index] : addPassenger[index] * exp.price}`
                                                    : `Passengers: £${isBristol ? bristolSharedPrice : exp.price}pp`
                                                : index === 1 
                                                ? addPassenger[index] 
                                                    ? (isBristol && (addPassenger[index] === 2 || addPassenger[index] === 3)
                                                        ? `Private for ${addPassenger[index]} - £${bristolPrivatePrices[addPassenger[index]]} per flight`
                                                        : `${addPassenger[index]} Passengers: £${exp.totalPrices[addPassenger[index]]}`)
                                                    : (isBristol
                                                        ? <span>Private for 2 - £1200 per flight<br/>Private for 3 - £1500 per flight</span>
                                                        : <span>2 Passengers: £{exp.totalPrices[2]}<br/>3 Passengers: £{exp.totalPrices[3]}<br/>4 Passengers: £{exp.totalPrices[4]}<br/>8 Passengers: £{exp.totalPrices[8]}</span>)
                                                : `Passengers: £${exp.price}pp`
                                            }
                                        </p>
                                        {exp.title === "Shared Flight" && <p>{exp.maxFlight}</p>}
                                    </div>
                                    <div className="num_count">
                                        <select
                                            name="passengerCount"
                                            value={addPassenger[index] || ""}
                                            onChange={(e) => handlePassengerChange(index, e.target.value)}
                                            className="border p-2 rounded"
                                        >
                                            <option value="">Select</option> {/* Placeholder option */}
                                            {(index === 1 ? privatePassengerOptions : exp.passengerOptions).map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="book_select_btn">
                                    <Link onClick={() => handleSelectClick(exp.title, addPassenger[index], exp.price, index)}
                                        className={`select-btn ${!addPassenger[index] ? "disabled" : ""}`}>
                                        Select
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Terms & Conditions Modal */}
            {showTerms && (
                <>
                    <div className="overlay"></div>
                    <div className="popup">
                        <div className="modal-content">
                            <div className="popup-text">
                                <h3>TERMS & CONDITIONS</h3>
                                {selectedFlight && (
                                    <p style={{ fontSize: '16px', marginTop: '10px' }}>
                                        {selectedFlight.type} for {selectedFlight.passengerCount} passengers: 
                                        <strong> £{selectedFlight.totalPrice}</strong> 
                                        {selectedFlight.type === "Shared Flight" && (
                                            <span style={{ fontSize: '14px', display: 'block', marginTop: '5px' }}>
                                                (£{selectedFlight.price} per person)
                                            </span>
                                        )}
                                    </p>
                                )}
                            </div>
                            <ul>
                                {(isGiftVoucher
                                    ? buyGiftTerms
                                    : isFlightVoucher
                                        ? flightVoucherTerms
                                        : (chooseLocation === 'Bristol Fiesta' ? bristolTerms : [
                                            'Ballooning is a weather-dependent activity.',
                                            'Your voucher is valid for 24 months.',
                                            'Without the weather refundable option, your voucher is non-refundable under any circumstances. However, re-bookable as needed within the voucher validity period.',
                                            'If you make 10 attempts to fly within 24 months which are cancelled by us, we will extend your voucher for a further 12 months free of charge.',
                                            'Within 48 hours of your flight, no changes or cancellations can be made.',
                                            'Your flight will never expire so long as you meet the terms & conditions.'
                                        ])
                                ).map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                                <li><a href="https://flyawayballooning.com/pages/terms-conditions" target="_blank" rel="noopener noreferrer" style={{ color: '#000000b5', fontSize: '18px', textDecoration: 'underline' }}>See Full Terms & Conditions</a></li>
                            </ul>
                            <div className="modal-buttons">
                                <button className="confirm-btn" onClick={confirmSelection}>Confirm</button>
                                <button className="cancel-btn" onClick={() => setShowTerms(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Accordion>
    );
};

export default ExperienceSection;
