import React, { useState } from "react";
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

const AdditionalInfo = ({ isGiftVoucher, isRedeemVoucher, isFlightVoucher, isBookFlight, additionalInfo, setAdditionalInfo, activeAccordion, setActiveAccordion, flightType }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;

        setAdditionalInfo((prev) => ({
            ...prev,
            [name]: value, // Directly set the value instead of handling checkboxes
        }));
    };





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
                    ></textarea>
                </div>
                {isBookFlight && flightType !== "Shared Flight" && (
                <div className="mt-4 prefer">
                    <label className="block text-base font-semibold">Which would you prefer?</label>
                    <div className="add_check">
                        {prefer.map((input, index) => (
                            <label className="chaque final-prefer-check" key={index}>
                                <input
                                    type="radio"
                                    name="prefer"
                                    value={input}
                                    checked={additionalInfo.prefer === input}
                                    onChange={handleChange}
                                />
                                <span>{input}</span>
                            </label>
                        ))}
                    </div>
                </div>
                )}

                <div className="selector mt-4">
                    <p className="block text-base font-semibold">How did you hear about us?</p>
                    <select name="hearAboutUs" className="w-full border p-2 rounded mt-2" onChange={handleChange}>
                        <option value="">Please select</option>
                        {
                            hearUs?.map((opt) => {
                                return (
                                    <option key={opt} value={opt}>{opt}</option>
                                )
                            })
                        }
                    </select>
                </div>

                <div className="selector  mt-4">
                    <label className="block text-base font-semibold">Why Hot Air Ballooning?</label>
                    <select name="reason" className="w-full border p-2 rounded mt-2" onChange={handleChange}>
                        <option value="">Please select</option>
                        {
                            ballooningReason?.map((opt) => {
                                return (
                                    <option key={opt} value={opt}>{opt}</option>
                                )
                            })
                        }
                    </select>
                </div>
            </div>
        </Accordion>
    );
};

export default AdditionalInfo;