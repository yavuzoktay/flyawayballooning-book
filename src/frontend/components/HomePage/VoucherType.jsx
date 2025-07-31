import React, { useState } from 'react';
import Accordion from '../Common/Accordion';
import weekdayMorningImg from '../../../assets/images/category1.jpeg';
import flexibleWeekdayImg from '../../../assets/images/category2.jpeg';
import anyDayFlightImg from '../../../assets/images/category3.jpg';

// Custom scrollbar styles
const scrollbarStyles = `
    .voucher-type-scroll-outer {
        overflow-x: auto;
        width: 100%;
        max-width: 100%;
        scrollbar-width: thin;
        scrollbar-color: #666 #f1f1f1;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar {
        height: 16px;
        width: 16px;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 8px;
        margin: 0 4px;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-thumb {
        background: #666;
        border-radius: 8px;
        border: 2px solid #f1f1f1;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-thumb:hover {
        background: #444;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-corner {
        background: #f1f1f1;
    }
`;

const VoucherType = ({ 
    activeAccordion, 
    setActiveAccordion = () => {}, 
    selectedVoucherType, 
    setSelectedVoucherType,
    activitySelect,
    chooseFlightType
}) => {
    const [quantities, setQuantities] = useState({
        'Weekday Morning': 1,
        'Flexible Weekday': 1,
        'Any Day Flight': 1
    });

    const voucherTypes = [
        {
            id: 'weekday-morning',
            title: 'Weekday Morning',
            image: weekdayMorningImg,
            refundability: 'Non-Refundable',
            availability: 'Monday - Friday AM',
            validity: 'Valid: 18 Months',
            inclusions: [
                'Around 1 Hour of Air Time.',
                'Complimentary Drink.',
                'Inflight Photos and 3D Flight Track.',
                'Upgradeable at Later Date.'
            ],
            weatherClause: 'Flights subject to weather – your voucher will remain valid and re-bookable within its validity period if cancelled due to weather.',
            price: 180
        },
        {
            id: 'flexible-weekday',
            title: 'Flexible Weekday',
            image: flexibleWeekdayImg,
            refundability: 'Non-Refundable',
            availability: 'Monday - Friday AM & PM',
            validity: 'Valid: 18 Months',
            inclusions: [
                'Around 1 Hour of Air Time.',
                'Complimentary Drink.',
                'Inflight Photos and 3D Flight Track.',
                'Upgradeable at Later Date.'
            ],
            weatherClause: 'Flights subject to weather – your voucher will remain valid and re-bookable within its validity period if cancelled due to weather.',
            price: 200
        },
        {
            id: 'any-day-flight',
            title: 'Any Day Flight',
            image: anyDayFlightImg,
            refundability: 'Refundable Option',
            availability: '7 Days A Week AM & PM',
            validity: 'Valid: 24 Months',
            inclusions: [
                'Around 1 Hour of Air Time',
                'Complimentary Drink',
                'Inflight Photos and 3D Flight Track',
                'Weather Refundable Option'
            ],
            weatherClause: 'Flights subject to weather – your voucher remains valid and rebookable, or refundable on request if you select the refundable option.',
            price: 220
        }
    ];

    const handleQuantityChange = (voucherTitle, value) => {
        setQuantities(prev => ({
            ...prev,
            [voucherTitle]: Math.max(0, parseInt(value) || 0)
        }));
    };

    const handleSelectVoucher = (voucher) => {
        const quantity = quantities[voucher.title];
        const totalPrice = voucher.price * quantity;
        
        const voucherWithQuantity = {
            ...voucher,
            quantity: quantity,
            totalPrice: totalPrice
        };
        
        setSelectedVoucherType(voucherWithQuantity);
        setActiveAccordion(null); // Close this accordion after selection
    };

    // Hide VoucherType section if "Private Charter" is selected
    if (chooseFlightType?.type === "Private Charter") {
        return null;
    }

    return (
        <>
            <style>{scrollbarStyles}</style>
            <Accordion
                title="Voucher Type"
                isActive={activeAccordion === 'voucher-type'}
                onToggle={() => setActiveAccordion('voucher-type')}
            >
                <div className="voucher-type-scroll-outer">
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'nowrap',
                            gap: '20px',
                            minWidth: '1020px', // 3 kart (3x320) + 2 gap (2x20)
                            justifyContent: 'flex-start',
                            padding: '0 10px',
                        }}
                    >
                        {voucherTypes.map((voucher, index) => (
                            <div key={index} style={{
                                background: '#fff',
                                borderRadius: 16,
                                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                                width: '320px',
                                minWidth: '320px',
                                flexShrink: 0,
                                padding: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}>
                                <img
                                    src={voucher.image}
                                    alt={voucher.title}
                                    style={{
                                        width: '100%',
                                        height: 180,
                                        objectFit: 'cover',
                                    }}
                                />
                                <div style={{
                                    padding: '16px',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%'
                                }}>
                                    <h3 style={{
                                        fontSize: 18,
                                        fontWeight: 600,
                                        margin: 0,
                                        marginBottom: 6,
                                        color: '#4a4a4a'
                                    }}>
                                        {voucher.title}
                                    </h3>
                                    <div style={{
                                        fontSize: 11,
                                        color: '#666',
                                        marginBottom: 6,
                                        fontWeight: 500
                                    }}>
                                        {voucher.refundability}
                                    </div>
                                    <div style={{
                                        fontSize: 11,
                                        color: '#666',
                                        marginBottom: 6
                                    }}>
                                        {voucher.availability}
                                    </div>
                                    <div style={{
                                        fontSize: 11,
                                        color: '#666',
                                        marginBottom: 10
                                    }}>
                                        {voucher.validity}
                                    </div>
                                    <ul style={{
                                        paddingLeft: 14,
                                        margin: 0,
                                        marginBottom: 10,
                                        color: '#444',
                                        fontSize: 12,
                                        lineHeight: '1.3'
                                    }}>
                                        {voucher.inclusions.map((inclusion, i) => (
                                            <li key={i} style={{ marginBottom: 3 }}>{inclusion}</li>
                                        ))}
                                    </ul>
                                    <div style={{
                                        fontSize: 10,
                                        color: '#666',
                                        marginBottom: 12,
                                        lineHeight: '1.2',
                                        fontStyle: 'italic'
                                    }}>
                                        {voucher.weatherClause}
                                    </div>
                                    <div style={{
                                        fontWeight: 600,
                                        fontSize: 15,
                                        marginBottom: 10,
                                        color: '#4a4a4a'
                                    }}>
                                        Price Per Person: £{voucher.price}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: 12,
                                        gap: '8px'
                                    }}>
                                        <label style={{
                                            fontSize: 13,
                                            color: '#666',
                                            fontWeight: 500
                                        }}>
                                            Passengers:
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={quantities[voucher.title]}
                                            onChange={(e) => handleQuantityChange(voucher.title, e.target.value)}
                                            style={{
                                                width: '50px',
                                                padding: '4px 6px',
                                                border: '1px solid #ddd',
                                                borderRadius: 4,
                                                fontSize: 13,
                                                textAlign: 'center'
                                            }}
                                        />
                                    </div>
                                    <button
                                        style={{
                                            width: '100%',
                                            background: '#03a9f4',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 8,
                                            padding: '10px 0',
                                            fontSize: 15,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            marginTop: 'auto',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = '#0288d1'}
                                        onMouseLeave={(e) => e.target.style.background = '#03a9f4'}
                                        onClick={() => handleSelectVoucher(voucher)}
                                    >
                                        Select
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Accordion>
        </>
    );
};

export default VoucherType; 