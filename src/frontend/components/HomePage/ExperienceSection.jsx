import React, { useState } from "react";
import Accordion from "../Common/Accordion";
import { Link } from "react-router-dom";
import axios from 'axios';
import { BsInfoCircle } from 'react-icons/bs';

const weatherRefundableHoverTexts = {
    sharedFlight: "You can select a weather refund option for each passenger for an additional £47.50 per person. This option can be chosen when entering passenger information.",
    privateFlight: "You can make your experience weather refundable for an additional 10% of your experience cost. This option can be selected during the booking process."
};

const experiences = [
    {
        title: "Shared Flight",
        price: "205",
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
        price: "205",
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
            2: 205,  // Price per person for 2 passengers
            3: 195,  // Price per person for 3 passengers
            4: 185,  // Price per person for 4 passengers
            8: 175   // Price per person for 8 passengers
        },
        totalPrices: {
            2: 900,  // Total price for 2 passengers
            3: 1050, // Total price for 3 passengers
            4: 1200, // Total price for 4 passengers
            8: 1800  // Total price for 8 passengers
        }
    },
];

const ExperienceSection = ({ isRedeemVoucher, setChooseFlightType, addPassenger, setAddPassenger, activeAccordion, setActiveAccordion, activityId, setAvailableSeats, chooseLocation, isFlightVoucher, isGiftVoucher }) => {
    const [showTerms, setShowTerms] = useState(false); // Controls modal visibility
    const [selectedFlight, setSelectedFlight] = useState(null);

    // Determine if Bristol pricing should be used
    const isBristol = chooseLocation === 'Bristol Fiesta';

    // Bristol-specific prices
    const bristolSharedPrice = 305;
    const bristolPrivatePrices = { 2: 1200, 3: 1500 };

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
        } else if (index === 1 && experiences[1].totalPrices && experiences[1].totalPrices[passengerCount]) {
            // For Private Flight, use the total price directly
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
        const response = await axios.post("/api/getAvailableSeats", {
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
            <div className="flii-scroll" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '8px' }}>
                {experiences.map((exp, index) => (
                    <div className="flight-data" key={index} style={{ flex: '0 0 48%', padding: '15px', boxSizing: 'border-box', border: '1.5px solid #00000080' }}>
                        <div className="flight-head-bin">
                            <h3>{exp.title}</h3>
                            <hr />
                        </div>
                        <div className="full-flight">
                            <p>{index === 1 ? privateDesc : exp.desc}</p>
                            <div className="content-flight">
                                <div className="shared-row">
                                    <ul>
                                        {exp.details.map((detail, i) => (
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
                                        ))}
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
                                                        : <span>2 Passengers: £900<br/>3 Passengers: £1050<br/>4 Passengers: £1200<br/>8 Passengers: £1800</span>)
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
                                {(chooseLocation === 'Bristol Fiesta' ? bristolTerms : [
                                    'Ballooning is a weather-dependent activity.',
                                    'Your voucher is valid for 24 months.',
                                    'Without the weather refundable option, your voucher is non-refundable under any circumstances. However, re-bookable as needed within the voucher validity period.',
                                    'If you make 10 attempts to fly within 24 months which are cancelled by us, we will extend your voucher for a further 12 months free of charge.',
                                    'Within 48 hours of your flight, no changes or cancellations can be made.',
                                    'Your flight will never expire so long as you meet the terms & conditions.'
                                ]).map((item, idx) => (
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
