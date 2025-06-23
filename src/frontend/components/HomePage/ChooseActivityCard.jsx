import React, { useState, useEffect, useRef } from "react";
import "../HomePage/RedeemVoucher.css";
import RedeemVoucherCard from "./RedeemVoucherCard";
import { BsInfoCircle } from 'react-icons/bs';

const ChooseActivityCard = ({ activitySelect, setActivitySelect, onVoucherSubmit, voucherStatus }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [localVoucherCode, setLocalVoucherCode] = useState("");
    const cardBackRef = useRef(null);

    // Reset the flipped state when voucher status changes
    useEffect(() => {
        if (voucherStatus === "valid") {
            setIsFlipped(false);
        }
    }, [voucherStatus]);

    // When activity changes to "Redeem Voucher", flip to show the voucher input
    useEffect(() => {
        if (activitySelect === "Redeem Voucher") {
            setIsFlipped(true);
        } else {
            setIsFlipped(false);
        }
    }, [activitySelect]);

    const selectActivityData = [
        { value: 0, label: "Book Flight", subText: "" },
        { value: 1, label: "Flight Voucher", subText: "Choose Date & Location Later, valid 24 months" },
        { value: 2, label: "Redeem Voucher", subText: "" },
        { value: 3, label: "Buy Gift", subText: "Any Location, Valid 24 Months" }
    ];

    const handleActivitySelect = (label) => {
        // Always update the activity selection
        setActivitySelect(label);
        
        // If Redeem Voucher is clicked, always ensure it's flipped
        if (label === "Redeem Voucher") {
            setIsFlipped(true);
        }
    };

    const handleVoucherSubmit = (code) => {
        // Kodu sakla
        setLocalVoucherCode(code);
        
        // Kodu üst bileşene gönder (direkt string olarak)
        if (onVoucherSubmit) {
            onVoucherSubmit(code); // Direkt kodu string olarak gönderiyoruz
        }
        
        // Kart yüzünü çevir
        setTimeout(() => {
            setIsFlipped(false);
        }, 300);
    };

    // Handle clicks on the blue card back
    const handleCardBackClick = (e) => {
        // Only handle direct background clicks, not clicks on children
        if (e.target === cardBackRef.current) {
            setIsFlipped(false);
        }
    };

    // Görüntülenecek etiket metnini belirle
    const getVoucherDisplayText = () => {
        if (localVoucherCode) {
            return `Voucher Code: ${localVoucherCode}`;
        }
        return "Redeem Voucher";
    };

    // Özel CSS stillerini tanımla
    const checkStyle = {
        position: 'relative',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: '2px solid gray'
    };

    const activeCheckStyle = {
        ...checkStyle,
        backgroundColor: '#74da78',
        borderColor: '#74da78'
    };

    const checkIconStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
    };

    return (
        <div className="tab_box" style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', width: '100%', justifyContent: 'space-between' }}>
            {selectActivityData.map((item) => (
                <div className="book_data" key={item.value} style={{ height: "220px", minHeight: "220px", flex: '1 1 calc(50% - 20px)', margin: '0 0 20px 0', width: 'calc(50% - 20px)', boxSizing: 'border-box' }}>
                    {item.label === "Redeem Voucher" ? (
                        <div className={`card-flip-container ${isFlipped ? 'flipped' : ''}`} style={{ height: "100%", width: '100%' }}>
                            <div className="card-flipper" style={{ height: "100%", width: '100%' }}>
                                <div 
                                    className="card-front"
                                    onClick={() => {
                                        setActivitySelect('Redeem Voucher');
                                        setIsFlipped(true);
                                    }}
                                    style={{ height: '100%', width: '100%', padding: '0', boxSizing: 'border-box' }}
                                >
                                    <label 
                                        htmlFor={`activity-${item.label}`} 
                                        className={`book_data_label ${activitySelect === item.label ? 'active_book_data_label' : ""}`}
                                        style={{ 
                                            height: '100%',
                                            width: '100%',
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            borderRadius: '20px',
                                            padding: '30px 15px',
                                            margin: '0',
                                            boxSizing: 'border-box',
                                            position: 'relative'
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            id={`activity-${item.label}`}
                                            name="activity"
                                            value={item.label}
                                            checked={activitySelect === item.label}
                                            onChange={() => {}} // Handled by onClick
                                            style={{ display: 'none' }} // Hide input
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: '15px',
                                            right: '15px',
                                        }}>
                                            <div style={activitySelect === item.label ? activeCheckStyle : checkStyle}>
                                                {activitySelect === item.label && (
                                                    <span style={checkIconStyle}>✓</span>
                                                )}
                                            </div>
                                        </div>
                                        <h3>{localVoucherCode ? getVoucherDisplayText() : item.label}</h3>
                                        {item.subText && <p>{item.subText}</p>}
                                        {localVoucherCode && (
                                            <p style={{ fontSize: '12px', marginTop: '5px', color: activitySelect === item.label ? 'white' : '#666' }}>
                                                Click to enter new code
                                            </p>
                                        )}
                                    </label>
                                </div>
                                <div 
                                    className="card-back"
                                    ref={cardBackRef}
                                    onClick={e => {
                                        // Sadece input veya button dışında bir yere tıklanırsa flip
                                        if (
                                            e.target === cardBackRef.current ||
                                            (!e.target.closest('input') && !e.target.closest('button'))
                                        ) {
                                            setIsFlipped(false);
                                        }
                                    }}
                                    style={{ height: '100%', width: '100%', padding: '0', boxSizing: 'border-box' }}
                                >
                                    <RedeemVoucherCard onSubmit={handleVoucherSubmit} />
                                    {voucherStatus === "invalid" && (
                                        <div className="error-message" style={{ color: 'white', textAlign: 'center', fontSize: '12px', marginTop: '4px' }}>
                                            Invalid voucher code. Please try again.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <label 
                            htmlFor={`activity-${item.label}`} 
                            className={`book_data_label ${activitySelect === item.label ? 'active_book_data_label' : ""}`}
                            onClick={() => handleActivitySelect(item.label)}
                            style={{ 
                                height: '100%',
                                width: '100%',
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: '20px',
                                padding: '30px 15px',
                                margin: '0',
                                boxSizing: 'border-box',
                                position: 'relative'
                            }}
                        >
                            <input
                                type="radio"
                                id={`activity-${item.label}`}
                                name="activity"
                                value={item.label}
                                checked={activitySelect === item.label}
                                onChange={() => {}} // Handled by onClick
                                style={{ display: 'none' }} // Hide input
                            />
                            <div style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                            }}>
                                <div style={activitySelect === item.label ? activeCheckStyle : checkStyle}>
                                    {activitySelect === item.label && (
                                        <span style={checkIconStyle}>✓</span>
                                    )}
                                </div>
                            </div>
                            <h3>{item.label}</h3>
                            {(item.label === 'Flight Voucher' || item.label === 'Buy Gift') ? (
                                <div className="info-icon-container" style={{ position: 'relative', display: 'inline-block', marginTop: '10px' }}>
                                    <BsInfoCircle size={14} color="#0070f3" />
                                    <div className="hover-text">
                                        {item.subText}
                                    </div>
                                </div>
                            ) : (
                                item.subText && <p>{item.subText}</p>
                            )}
                        </label>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ChooseActivityCard;
