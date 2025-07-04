import axios from "axios";
import React, { useRef, useState } from "react";
import { validatePassengers } from "./PassengerInfo";
import { validateAdditionalInfo } from "./AdditionalInfo";
import { validatePreferences } from "./EnterPreferences";

const RightInfoCard = ({ activitySelect, chooseLocation, chooseFlightType, chooseAddOn, passengerData, additionalInfo, recipientDetails, selectedDate, selectedTime, activeAccordion, setActiveAccordion, isFlightVoucher, isRedeemVoucher, isGiftVoucher, voucherCode, resetBooking, preference }) => {

    const passengerInfoRef = useRef(null);
    const [passengerErrors, setPassengerErrors] = useState([]);
    const [additionalErrors, setAdditionalErrors] = useState({});
    const [preferenceErrors, setPreferenceErrors] = useState({});
    const additionalInfoRef = useRef(null);
    const preferenceRef = useRef(null);

    // Function to format date
    const formatDate = (date) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        const formattedDate = new Date(date).toLocaleDateString('en-US', options);

        // Get the day of the month
        const day = new Date(date).getDate();

        // Function to get the correct ordinal suffix for the day
        const getOrdinalSuffix = (day) => {
            if (day > 3 && day < 21) return 'th';
            switch (day % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        };

        // Adding the ordinal suffix to the day
        const formattedDay = day + getOrdinalSuffix(day);

        // Replace the day with the formatted day with suffix
        return formattedDate.replace(day, formattedDay);
    };

    // Function to format date and time
    const formatDateTime = (date, time) => {
        if (!date) return 'Not Selected';
        const d = new Date(date);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let dateStr = d.toLocaleDateString('en-US', options);
        // Saat varsa ekle
        if (time) {
            let [h, m] = time.split(':');
            let hour = Number(h);
            let ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12 || 12;
            dateStr += `, ${hour}:${m} ${ampm}`;
        } else if (d.getHours() || d.getMinutes()) {
            // Tarih objesinde saat atanmışsa onu da göster
            let hour = d.getHours();
            let min = d.getMinutes();
            let ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12 || 12;
            dateStr += `, ${hour}:${min.toString().padStart(2, '0')} ${ampm}`;
        }
        return dateStr;
    };

    // Calculate total price
    const flightTypePrice = chooseFlightType?.totalPrice || 0;
    const addOnPrice = chooseAddOn.reduce((total, addOn) => {
        if (addOn.name === "Weather Refundable") {
            return total + (flightTypePrice * 0.1); // Add 10% of flightTypePrice
        }
        return total + (addOn.price !== "TBC" ? parseFloat(addOn.price) : 0); // Ignore "TBC" prices
    }, 0);
    // Add Weather Refundable for Shared Flight
    let weatherRefundTotal = 0;
    if (chooseFlightType?.type === 'Shared Flight' && Array.isArray(passengerData)) {
        weatherRefundTotal = passengerData.filter(p => p.weatherRefund).length * 47.5;
    }
    const totalPrice = parseFloat(flightTypePrice) + parseFloat(addOnPrice) + weatherRefundTotal;


    // Send Data To Backend
    const handleBookData = async () => {
        console.log("Book button clicked");
        console.log("additionalInfo state before validation:", additionalInfo);
        console.log("preference state before validation:", preference);
        // Validate passengers
        const errors = validatePassengers(passengerData);
        setPassengerErrors(errors);
        const hasPassengerError = errors.some(e => Object.values(e).some(Boolean));
        if (hasPassengerError) {
            console.log("Passenger validation failed", errors);
        }
        // Validate additional info
        const addErrors = validateAdditionalInfo(additionalInfo, chooseFlightType?.type);
        setAdditionalErrors(addErrors);
        const hasAdditionalError = Object.values(addErrors).some(Boolean);
        if (hasAdditionalError) {
            console.log("Additional info validation failed", addErrors);
        }
        // Validate preferences
        const prefErrors = validatePreferences(preference);
        setPreferenceErrors(prefErrors);
        const hasPreferenceError = Object.values(prefErrors).some(Boolean);
        if (hasPreferenceError) {
            console.log("Preference validation failed", prefErrors);
        }
        // Scroll and open relevant section if error
        if (hasPassengerError) {
            setActiveAccordion && setActiveAccordion("passenger-info");
            setTimeout(() => {
                if (passengerInfoRef.current) {
                    passengerInfoRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 100);
            return;
        }
        if (hasAdditionalError) {
            setActiveAccordion && setActiveAccordion("additional-info");
            setTimeout(() => {
                if (additionalInfoRef.current) {
                    additionalInfoRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 100);
            return;
        }
        if (hasPreferenceError) {
            setActiveAccordion && setActiveAccordion("preference");
            setTimeout(() => {
                if (preferenceRef.current) {
                    preferenceRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 100);
            return;
        }
        if (isFlightVoucher || isRedeemVoucher) {
            // Only send to /api/createVoucher and then fetch vouchers
            const voucherData = {
                name: recipientDetails?.name || "",
                flight_type: chooseFlightType?.type || "",
                voucher_type: isFlightVoucher ? "Flight Voucher" : "Redeem Voucher",
                email: recipientDetails?.email || "",
                phone: recipientDetails?.phone || "",
                expires: "",
                redeemed: "No",
                paid: totalPrice,
                offer_code: "",
                voucher_ref: voucherCode || ""
            };
            try {
                // Always POST, do not block for empty fields
                const voucherResp = await axios.post('http://localhost:3000/api/createVoucher', voucherData);
                if (!voucherResp.data.success) {
                    alert('Voucher creation failed: ' + (voucherResp.data.message || voucherResp.data.error || 'Unknown error'));
                    return;
                }
                await axios.get('http://localhost:3000/api/getAllVoucherData');
                alert('Voucher created successfully!');
                resetBooking();
            } catch (error) {
                alert('An error occurred while creating voucher.');
            }
            return;
        }
        try {
            const response = await axios.post('http://localhost:3000/api/createBooking', {
                activitySelect,
                chooseLocation,
                chooseFlightType,
                chooseAddOn: Array.isArray(chooseAddOn) ? chooseAddOn : [],
                passengerData,
                additionalInfo,
                recipientDetails,
                selectedDate,
                totalPrice,
                voucher_code: voucherCode,
                flight_attempts: chooseFlightType?.flight_attempts || 0,
                preference
            });
            console.log("Booking response:", response);
            if (response.data.success) {
                alert('Booking successful! Booking ID: ' + response.data.bookingId);
                resetBooking(); 
            } else {
                alert('Booking failed: ' + response.data.message);
            }
        } catch (error) {
            console.error('Error during booking:', error);
            alert('An error occurred while trying to book. Please try again.');
        }
    }

    return (
        <div className="book_active">
            <div className="book_data_active">
                <div className={`row-1 ${activitySelect ? 'active-card-val' : ''}`}>
                    <span className="active-book-card"></span>
                    <div className="active-book-cont">
                        <h3>Booking Type</h3>
                        <p>{activitySelect ? activitySelect : "Not Selected"}</p>
                        {isRedeemVoucher && voucherCode && (
                            <p className="voucher-code">
                                <small>Voucher Code: <strong>{voucherCode}</strong></small>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className={`book_data_active ${isFlightVoucher || isGiftVoucher ? 'disable-acc' : ''}`} onClick={() => setActiveAccordion("location")}>
                <div className={`row-1 ${chooseLocation ? 'active-card-val' : ''}`}>
                    <span className="active-book-card"></span>
                    <div className="active-book-cont">
                        <h3>Location</h3>
                        <p>{chooseLocation ? chooseLocation : "Not Selected"}</p>
                    </div>
                </div>
            </div>

            <div className={`book_data_active ${isRedeemVoucher ? 'disable-acc' : ''}`} onClick={() => setActiveAccordion("experience")}>
                <div className={`row-1 ${chooseFlightType.passengerCount ? 'active-card-val' : ''}`}>
                    <span className="active-book-card"></span>
                    <div className="active-book-cont final-active-book-cont">
                        <div className="active-book-left">
                            <h3>Flight Type</h3>
                            <p>{chooseFlightType.passengerCount ? 
                                `${chooseFlightType?.type} - ${chooseFlightType.passengerCount} ${chooseFlightType.passengerCount === 1 ? 'Passenger' : 'Passengers'}` 
                                : "Not Selected"}</p>
                        </div>
                        <div className="active-book-right">
                            <p>{chooseFlightType.passengerCount ? "£" + chooseFlightType.totalPrice : ""}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`book_data_active ${isFlightVoucher || isGiftVoucher ? 'disable-acc' : ''}`} onClick={() => setActiveAccordion("live-availability")}>
                <div className={`row-1 ${selectedDate ? 'active-card-val' : ''}`}>
                    <span className="active-book-card"></span>
                    <div className="active-book-cont final-active-book-cont">
                        <div className="active-book-left">
                            <h3>Flight Date & Meeting Time</h3>
                            <p>{formatDateTime(selectedDate, selectedTime)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`book_data_active ${isFlightVoucher || isRedeemVoucher || isGiftVoucher ? 'disable-acc' : ''}`} onClick={() => setActiveAccordion("add-on")}>
                <div className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? 'active-card-val' : ''}`}>
                    <span className="active-book-card"></span>
                    <div className="active-book-cont final-active-book-cont">
                        <div className="active-book-left">
                            <h3>Add To Booking</h3>
                            {
                                chooseAddOn?.length > 0 || weatherRefundTotal > 0 ?
                                    <>
                                        {chooseAddOn?.map((data, index) => (
                                            <div className="active-book-cont final-active-book-cont" key={index}>
                                                <div className="active-book-left" >
                                                    <p>{data.name}</p>
                                                </div>
                                                <div className="active-book-right">
                                                    <p>£{data.name == 'Weather Refundable' ? flightTypePrice * 0.1 : data.price}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {weatherRefundTotal > 0 && (
                                            <div className="active-book-cont final-active-book-cont">
                                                <div className="active-book-left" >
                                                    <p>Weather Refundable</p>
                                                </div>
                                                <div className="active-book-right">
                                                    <p>£{weatherRefundTotal.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                    :
                                    <p style={{paddingTop: "10px"}}>Not Selected</p>
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div className={`book_data_active`} onClick={() => setActiveAccordion("passenger-info")} ref={passengerInfoRef}>
                <div className={`row-1 ${passengerData[0].firstName !== '' ? 'active-card-val' : ''}`}>
                    <span className="active-book-card"></span>
                    <div className="active-book-cont final-active-book-cont">
                        <div className="active-book-left">
                            <h3>Passenger Information</h3>
                            {
                                passengerData.length > 0 ?
                                    passengerData?.map((data, index) => {
                                        // Weather Refundable bilgisi weatherRefund özelliğinde saklanıyor
                                        console.log(`Passenger ${index+1} data:`, data); // Debug için
                                        return (
                                            <>
                                                <p key={index} >{data.firstName != '' ? 
                                                    "Passenger " + `${index + 1}` + ": " + 
                                                    data.firstName + " " + data.lastName + " " + 
                                                    data.weight + "kg" + 
                                                    (data.weatherRefund ? " - Refundable" : "") 
                                                    : ""}
                                                </p>
                                            </>
                                        )
                                    })
                                    :
                                    "Not Provided"
                            }
                        </div>
                    </div>
                </div>
                {passengerErrors.some(e => Object.values(e).some(Boolean)) && (
                    <div style={{ color: 'red', fontWeight: 600, marginTop: 8 }}>Please fill in all required passenger fields.</div>
                )}
            </div>

            <div className={`book_data_active`} onClick={() => setActiveAccordion("additional-info")} ref={additionalInfoRef}>
                <div className={`row-1 ${Object.values(additionalErrors).some(Boolean) ? 'active-card-val' : ''}`}>
                    <span className="active-book-card"></span>
                    <div className="active-book-cont final-active-book-cont">
                        <div className="active-book-left">
                            <h3>Additional Information</h3>
                            {
                                Object.values(additionalErrors).some(Boolean) ?
                                    Object.entries(additionalErrors).map(([key, error]) => (
                                        <p key={key}>{error}</p>
                                    ))
                                    :
                                    "Not Provided"
                            }
                        </div>
                    </div>
                </div>
                {Object.values(additionalErrors).some(Boolean) && (
                    <div style={{ color: 'red', fontWeight: 600, marginTop: 8 }}>Please fill in all required additional information fields.</div>
                )}
            </div>

            <div className={`book_data_active`} onClick={() => setActiveAccordion("preference")} ref={preferenceRef}>
                <div className={`row-1 ${Object.values(preferenceErrors).some(Boolean) ? 'active-card-val' : ''}`}>
                    <span className="active-book-card"></span>
                    <div className="active-book-cont final-active-book-cont">
                        <div className="active-book-left">
                            <h3>Enter Preferences</h3>
                            {
                                Object.values(preferenceErrors).some(Boolean) ?
                                    Object.entries(preferenceErrors).map(([key, error]) => (
                                        <p key={key}>{error}</p>
                                    ))
                                    :
                                    "Not Provided"
                            }
                        </div>
                    </div>
                </div>
                {Object.values(preferenceErrors).some(Boolean) && (
                    <div style={{ color: 'red', fontWeight: 600, marginTop: 8 }}>Please select at least one option in each preferences group.</div>
                )}
            </div>

            <div className="bottom_main">
                <h3>Total</h3>
                <p style={{ fontWeight: 500, fontSize: '1.2rem' }}>£{totalPrice > 0 ? totalPrice.toFixed(2) : "0.00"}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '0px', marginBottom: '0px' }}>
                <button
                    className="booking_btn clear_booking-button"
                    style={{
                        background: '#fff',
                        color: '#444',
                        border: '1.5px solid #bbb',
                        boxShadow: 'none',
                        fontWeight: 500,
                        borderRadius: '8px',
                        padding: '8px 22px',
                        cursor: 'pointer',
                        opacity: 1
                    }}
                    onClick={resetBooking}
                    type="button"
                >
                    Clear
                </button>
                <button
                    className="booking_btn final_booking-button"
                    style={{
                        background: (
                            (isFlightVoucher || isRedeemVoucher)
                                ? '#3274b4'
                                : (activitySelect && chooseLocation && chooseFlightType && chooseAddOn && passengerData && additionalInfo && recipientDetails && selectedDate) ? '#3274b4' : '#eee'
                        ),
                        color: '#fff',
                        fontWeight: 500,
                        borderRadius: '8px',
                        padding: '8px 22px',
                        cursor: (
                            (isFlightVoucher || isRedeemVoucher)
                                ? 'pointer'
                                : (activitySelect && chooseLocation && chooseFlightType && chooseAddOn && passengerData && additionalInfo && recipientDetails && selectedDate)
                        ) ? 'pointer' : 'not-allowed',
                        opacity: (
                            (isFlightVoucher || isRedeemVoucher)
                                ? 1
                                : (activitySelect && chooseLocation && chooseFlightType && chooseAddOn && passengerData && additionalInfo && recipientDetails && selectedDate)
                        ) ? 1 : 0.5
                    }}
                    disabled={
                        (isFlightVoucher || isRedeemVoucher)
                            ? false
                            : !(activitySelect && chooseLocation && chooseFlightType && chooseAddOn && passengerData && additionalInfo && recipientDetails && selectedDate)
                    }
                    onClick={handleBookData}
                    type="button"
                >
                    Book
                </button>
            </div>
        </div>
    )
}

export default RightInfoCard;
