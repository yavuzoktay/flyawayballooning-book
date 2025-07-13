// EnterRecipientDetails.js
import React, { useState } from "react";
import Accordion from "../Common/Accordion";
import { BsInfoCircle } from "react-icons/bs";

const EnterRecipientDetails = ({ isBookFlight, isRedeemVoucher, isFlightVoucher, recipientDetails, setRecipientDetails, activeAccordion, setActiveAccordion }) => {
    const [emailError, setEmailError] = useState(false);

    const handleChange = (e) => {
        setRecipientDetails({ ...recipientDetails, [e.target.name]: e.target.value });
        if (e.target.name === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            setEmailError(e.target.value && !emailRegex.test(e.target.value));
        }
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
                        <div className="info-icon-container recipient-tooltip">
                            <BsInfoCircle size={14} style={{ width: 14, height: 14 }} />
                            <div className="hover-text recipient-hover-text">
                                <p>Share the recipient's details so we can get in touch with them to arrange their flight. Rest assured, we won't contact them until after the gifted date has passed. Vouchers will be sent to the purchaser.</p>
                            </div>
                        </div>
                    </div>
                    <br />
                    <input
                        type="text"
                        onInput={e => e.target.value = e.target.value.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]/g, '')}
                        name="name"
                        required
                        value={recipientDetails.name}
                        onChange={handleChange}
                        placeholder="Recipient Name"
                    /><br /><br />

                    <label>Recipient Email</label><br />
                    <input
                        type="email"
                        name="email"
                        required
                        value={recipientDetails.email}
                        onChange={handleChange}
                        placeholder="Recipient Email"
                        style={emailError ? { border: '1.5px solid red' } : {}}
                    />
                    {emailError && <span style={{ color: 'red', fontSize: 12 }}>Invalid email format</span>}
                    <br /><br />

                    <label>Recipient Phone Number</label><br />
                    <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onInput={e => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                        name="phone"
                        required
                        value={recipientDetails.phone}
                        onChange={handleChange}
                        placeholder="Recipient Phone Number"
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
