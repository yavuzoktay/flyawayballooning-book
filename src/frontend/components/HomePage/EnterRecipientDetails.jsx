// EnterRecipientDetails.js
import React, { useState } from "react";
import Accordion from "../Common/Accordion";
import { BsInfoCircle } from "react-icons/bs";

const EnterRecipientDetails = ({ isBookFlight, isRedeemVoucher, isFlightVoucher, recipientDetails, setRecipientDetails, activeAccordion, setActiveAccordion }) => {
    const handleChange = (e) => {
        setRecipientDetails({ ...recipientDetails, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = () => {
        setRecipientDetails((prevDetails) => ({
            ...prevDetails,
            isNoRecipient: !prevDetails.isNoRecipient,
        }));
    };

    return (
        <Accordion 
            title="Enter Recipient Details"  
            id="recipent-details" 
            activeAccordion={activeAccordion} 
            setActiveAccordion={setActiveAccordion} 
            className={`${isFlightVoucher || isRedeemVoucher || isBookFlight ? 'disable-acc' : ''}`} 
            disabled={isBookFlight}
        >
            <div className="Recipient">
                <form action="/submit" method="post">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>Recipient Name</label>
                        <div className="info-icon-container">
                            <BsInfoCircle size={14} color="#0070f3" />
                            <div className="hover-text">
                                Share the recipient's details so we can get in touch with them to arrange their flight. 
                                Rest assured, we won't contact them until after the gifted date has passed. 
                                Vouchers will be sent to the purchaser.
                            </div>
                        </div>
                    </div>
                    <br />
                    <input
                        type="text"
                        name="name"
                        required
                        value={recipientDetails.name}
                        onChange={handleChange}
                    /><br /><br />

                    <label>Recipient Email</label><br />
                    <input
                        type="email"
                        name="email"
                        required
                        value={recipientDetails.email}
                        onChange={handleChange}
                    /><br /><br />

                    <label>Recipient Phone Number</label><br />
                    <input
                        type="tel"
                        name="phone"
                        required
                        value={recipientDetails.phone}
                        onChange={handleChange}
                    /><br /><br />

                    <label>Date Voucher to be Gifted</label><br />
                    <input
                        type="date"
                        name="date"
                        value={recipientDetails.date}
                        onChange={handleChange}
                    />
                </form>
            </div>
        </Accordion>
    );
};

export default EnterRecipientDetails;
