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
                        <div 
                            className="info-icon-container"
                            style={{ position: 'relative', zIndex: 1000 }}
                            onMouseOver={(e) => {
                                const tooltip = e.currentTarget.querySelector('.recipient-info-tooltip');
                                if (tooltip) tooltip.style.visibility = 'visible';
                                if (tooltip) tooltip.style.opacity = '1';
                            }}
                            onMouseOut={(e) => {
                                const tooltip = e.currentTarget.querySelector('.recipient-info-tooltip');
                                if (tooltip) tooltip.style.visibility = 'hidden';
                                if (tooltip) tooltip.style.opacity = '0';
                            }}
                        >
                            <BsInfoCircle size={20} color="#000000" />
                            <div 
                                className="recipient-info-tooltip" 
                                style={{ 
                                    position: 'absolute',
                                    visibility: 'hidden',
                                    opacity: 0,
                                    width: '320px',
                                    background: '#333',
                                    color: '#fff',
                                    textAlign: 'center',
                                    borderRadius: '6px',
                                    padding: '10px',
                                    zIndex: 1001,
                                    top: '30px',
                                    right: '-20px',
                                    transition: 'opacity 0.3s, visibility 0.3s',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
                                }}
                            >
                                Share the recipient's details so we can get in touch with them to arrange their flight. 
                                Rest assured, we won't contact them until after the gifted date has passed. 
                                Vouchers will be sent to the purchaser.
                                <div style={{
                                    content: '',
                                    position: 'absolute',
                                    top: '-10px',
                                    right: '25px',
                                    borderWidth: '5px',
                                    borderStyle: 'solid',
                                    borderColor: 'transparent transparent #333 transparent'
                                }}></div>
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
