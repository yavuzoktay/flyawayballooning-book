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

export function validateAdditionalInfo(additionalInfo, flightType) {
    return {
        notes: !additionalInfo.notes,
        hearAboutUs: !additionalInfo.hearAboutUs,
        reason: !additionalInfo.reason,
        prefer: flightType !== "Shared Flight" ? !additionalInfo.prefer : false,
    };
}

const AdditionalInfo = ({ isGiftVoucher, isRedeemVoucher, isFlightVoucher, additionalInfo, setAdditionalInfo, activeAccordion, setActiveAccordion, flightType, errors = {} }) => {
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
                        value={additionalInfo.notes || ""}
                        style={errors.notes ? { border: '1.5px solid red' } : {}}
                    ></textarea>
                    {errors.notes && <span style={{ color: 'red', fontSize: 12 }}>Required</span>}
                </div>
                {!isGiftVoucher && !isRedeemVoucher && (
                    <div className="mt-4 prefer">
                        <label className="block text-base font-semibold">Which would you prefer?</label>
                        <select
                            name="prefer"
                            className="w-full border p-2 rounded mt-2"
                            value={additionalInfo.prefer || ""}
                            onChange={handleChange}
                            style={errors.prefer ? { border: '1.5px solid red' } : {}}
                        >
                            <option value="">Please select</option>
                            {prefer.map((input, index) => (
                                <option key={index} value={input}>{input}</option>
                            ))}
                        </select>
                        {errors.prefer && <span style={{ color: 'red', fontSize: 12 }}>Required</span>}
                    </div>
                )}

                <div className="selector mt-4">
                    <p className="block text-base font-semibold">How did you hear about us?</p>
                    <select name="hearAboutUs" className="w-full border p-2 rounded mt-2" onChange={handleChange} value={additionalInfo.hearAboutUs || ""} style={errors.hearAboutUs ? { border: '1.5px solid red' } : {}}>
                        <option value="">Please select</option>
                        {
                            hearUs?.map((opt) => {
                                return (
                                    <option key={opt} value={opt}>{opt}</option>
                                )
                            })
                        }
                    </select>
                    {errors.hearAboutUs && <span style={{ color: 'red', fontSize: 12 }}>Required</span>}
                </div>

                <div className="selector  mt-4">
                    <label className="block text-base font-semibold">Why Hot Air Ballooning?</label>
                    <select name="reason" className="w-full border p-2 rounded mt-2" onChange={handleChange} value={additionalInfo.reason || ""} style={errors.reason ? { border: '1.5px solid red' } : {}}>
                        <option value="">Please select</option>
                        {
                            ballooningReason?.map((opt) => {
                                return (
                                    <option key={opt} value={opt}>{opt}</option>
                                )
                            })
                        }
                    </select>
                    {errors.reason && <span style={{ color: 'red', fontSize: 12 }}>Required</span>}
                </div>
            </div>
        </Accordion>
    );
};

export default AdditionalInfo;