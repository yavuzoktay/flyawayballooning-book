import axios from "axios";
import React from "react";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const RightInfoCard = ({ activitySelect, chooseLocation, chooseFlightType, chooseAddOn, passengerData, additionalInfo, recipientDetails, selectedDate, activeAccordion, setActiveAccordion, isFlightVoucher, isRedeemVoucher, isGiftVoucher, voucherCode, resetBooking, preference }) => {

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

    // Calculate total price
    const flightTypePrice = chooseFlightType?.totalPrice || 0;
    const addOnPrice = chooseAddOn.reduce((total, addOn) => {
        if (addOn.name === "Weather Refundable") {
            return total + (flightTypePrice * 0.1); // Add 10% of flightTypePrice
        }
        return total + (addOn.price !== "TBC" ? parseFloat(addOn.price) : 0); // Ignore "TBC" prices
    }, 0);
    const totalPrice = parseFloat(flightTypePrice) + parseFloat(addOnPrice);

    // Helper to check if an object is non-empty
    const isNonEmptyObject = (obj) => obj && typeof obj === 'object' && Object.keys(obj).length > 0;
    // Helper to check if an array is non-empty
    const isNonEmptyArray = (arr) => Array.isArray(arr) && arr.length > 0;
    console.log("additionalInfo:", additionalInfo);
    // Helper to check if additionalInfo has at least one filled value
    const isAdditionalInfoFilled = (info) => {
      if (!info || typeof info !== 'object') return false;
      return Object.values(info).some(val => {
        if (typeof val === 'string') {
          return val.trim() !== '';
        }
        if (typeof val === 'object' && val !== null) {
          // Eğer obje ise ve en az bir anahtarı varsa ve o anahtarın değeri doluysa true
          return Object.values(val).some(
            v => typeof v === 'string' ? v.trim() !== '' : !!v
          );
        }
        return !!val;
      });
    };

    // Book button enable logic:
    // - Redeem Voucher: only require main fields (already handled)
    // - Flight Voucher: require chooseFlightType, passengerData (at least one with firstName), additionalInfo, recipientDetails
    // - Buy Gift: require chooseFlightType, chooseAddOn (at least one), passengerData (at least one with firstName), additionalInfo, recipientDetails
    // - Book Flight: require all fields (as before)
    const hasPassenger = Array.isArray(passengerData) && passengerData.some(p => p.firstName && p.firstName.trim() !== '');
    const isBookDisabled = isRedeemVoucher
        ? !(
            activitySelect &&
            chooseLocation &&
            chooseFlightType &&
            isNonEmptyObject(additionalInfo) &&
            isNonEmptyObject(recipientDetails)
        )
        : isFlightVoucher
        ? !(
            chooseFlightType &&
            hasPassenger &&
            isNonEmptyObject(additionalInfo) &&
            isNonEmptyObject(recipientDetails)
        )
        : isGiftVoucher
        ? !(
            chooseFlightType &&
            isNonEmptyArray(chooseAddOn) &&
            hasPassenger &&
            isNonEmptyObject(additionalInfo) &&
            isNonEmptyObject(recipientDetails)
        )
        : !(
            activitySelect &&
            chooseLocation &&
            chooseFlightType &&
            isNonEmptyArray(chooseAddOn) &&
            isNonEmptyArray(passengerData) &&
            isNonEmptyObject(additionalInfo) &&
            isNonEmptyObject(recipientDetails) &&
            selectedDate
        );

    const [showWarning, setShowWarning] = React.useState(false);

    // Send Data To Backend
    const handleBookData = async () => {
        console.log("Book button clicked");
        console.log("API_BASE_URL:", API_BASE_URL);
        if (isFlightVoucher || isRedeemVoucher || isGiftVoucher) {
            // VOUCHER POST
            const voucherData = {
                name: recipientDetails?.name || "",
                flight_type: chooseFlightType?.type || "",
                voucher_type: isFlightVoucher ? "Flight Voucher" : isRedeemVoucher ? "Redeem Voucher" : "Gift Voucher",
                email: recipientDetails?.email || "",
                phone: recipientDetails?.phone || "",
                redeemed: "No",
                paid: totalPrice,
                offer_code: "",
                voucher_ref: voucherCode || ""
            };
            try {
                const response = await axios.post(`${API_BASE_URL}/api/createVoucher`, voucherData);
                console.log("Voucher response:", response);
                if (response.data.success) {
                    alert('Voucher created successfully!');
                    resetBooking();
                } else {
                    alert('Voucher creation failed: ' + response.data.message);
                }
            } catch (error) {
                console.error('Error during voucher creation:', error);
                alert('An error occurred while creating voucher.');
            }
            return;
        }
        // BOOK FLIGHT FLOW
        const bookingData = {
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
            preferred_location: preference && preference.location ? Object.keys(preference.location).filter(k => preference.location[k]).join(', ') : null,
            preferred_time: preference && preference.time ? Object.keys(preference.time).filter(k => preference.time[k]).join(', ') : null,
            preferred_day: preference && preference.day ? Object.keys(preference.day).filter(k => preference.day[k]).join(', ') : null
        };
        console.log("Booking data to send:", bookingData);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/createBooking`, bookingData);
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

    const isBookFlight = activitySelect === "Book Flight";

    return (
        <div className="book_active">
            <div className="book_data_active">
                {activitySelect === 'Book Flight' && (
                    <>
                        {/* Booking Type */}
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
                        {/* Location */}
                        <div className={`book_data_active ${isFlightVoucher || isGiftVoucher ? 'disable-acc' : ''}`} onClick={() => setActiveAccordion("location")}> 
                            <div className={`row-1 ${chooseLocation ? 'active-card-val' : ''}`}> 
                                <span className="active-book-card"></span>
                                <div className="active-book-cont">
                                    <h3>Location</h3>
                                    <p>{chooseLocation ? chooseLocation : "Not Selected"}</p>
                                </div>
                            </div>
                        </div>
                        {/* Flight Type */}
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
                        {/* Flight Date & Meeting Time */}
                        <div className={`book_data_active ${isFlightVoucher || isGiftVoucher ? 'disable-acc' : ''}`} onClick={() => setActiveAccordion("live-availability")}> 
                            <div className={`row-1 ${selectedDate ? 'active-card-val' : ''}`}> 
                                <span className="active-book-card"></span>
                                <div className="active-book-cont final-active-book-cont">
                                    <div className="active-book-left">
                                        <h3>Flight Date & Meeting Time</h3>
                                        <p>{selectedDate ? formatDate(selectedDate) : "Not Selected"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Add To Booking */}
                        <div className={`book_data_active ${isFlightVoucher || isRedeemVoucher || isGiftVoucher ? 'disable-acc' : ''}`} onClick={() => setActiveAccordion("add-on")}> 
                            <div className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? 'active-card-val' : ''}`}> 
                                <span className="active-book-card"></span>
                                <div className="active-book-cont final-active-book-cont">
                                    <div className="active-book-left">
                                        <h3>Add To Booking</h3>
                                        {
                                            chooseAddOn?.length > 0 ?
                                                chooseAddOn?.map((data, index) => (
                                                    <div className="active-book-cont final-active-book-cont" key={index}>
                                                        <div className="active-book-left" >
                                                            <p>{data.name}</p>
                                                        </div>
                                                        <div className="active-book-right">
                                                            <p>£{data.name == 'Weather Refundable' ? flightTypePrice * 0.1 : data.price}</p>
                                                        </div>
                                                    </div>
                                                ))
                                                :
                                                <p style={{paddingTop: "10px"}}>Not Selected</p>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Passenger Information */}
                        <div className={`book_data_active`} onClick={() => setActiveAccordion("passenger-info")}> 
                            <div className={`row-1 ${passengerData[0].firstName !== '' ? 'active-card-val' : ''}`}> 
                                <span className="active-book-card"></span>
                                <div className="active-book-cont final-active-book-cont">
                                    <div className="active-book-left">
                                        <h3>Passenger Information</h3>
                                        {
                                            passengerData.length > 0 ?
                                                passengerData?.map((data, index) => {
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
                        </div>
                        {/* Additional Information */}
                        <div className="book_data_active" onClick={() => setActiveAccordion("additional-info")}> 
                            <div className={`row-1 ${isAdditionalInfoFilled(additionalInfo) ? 'active-card-val' : ''}`}> 
                                <span className="active-book-card"></span>
                                <div className="active-book-cont final-active-book-cont" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="active-book-left">
                                        <h3>Additional Information</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Select Preferences */}
                        <div className="book_data_active" onClick={() => setActiveAccordion("select-preferences")}> 
                            <div className={`row-1 ${preference ? 'active-card-val' : ''}`}> 
                                <span className="active-book-card"></span>
                                <div className="active-book-cont final-active-book-cont" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="active-book-left">
                                        <h3>Select Preferences</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Show Flight Type for both Book Flight and Flight Voucher, but hide for Redeem Voucher */}
                {((isFlightVoucher) && !isRedeemVoucher) && (
                    <div className={`book_data_active`} onClick={() => setActiveAccordion("experience")}> 
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
                )}

                {/* Location for Book Flight and Redeem Voucher: Show for Book Flight and Redeem Voucher */}
                {(isRedeemVoucher) && (
                    <div className="book_data_active" onClick={() => setActiveAccordion("location")}> 
                        <div className={`row-1 ${chooseLocation ? 'active-card-val' : ''}`}> 
                            <span className="active-book-card"></span>
                            <div className="active-book-cont">
                                <h3>Location</h3>
                                <p>{chooseLocation ? chooseLocation : 'Not Selected'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add To Booking summary row: always active for Redeem Voucher, hidden for Flight Voucher */}
                {!isFlightVoucher && (
                    <div className={`book_data_active`} onClick={() => setActiveAccordion("add-on")}> 
                        <div className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? 'active-card-val' : ''}`}> 
                            <span className="active-book-card"></span>
                            <div className="active-book-cont final-active-book-cont">
                                <div className="active-book-left">
                                    <h3>Add To Booking</h3>
                                    {
                                        chooseAddOn?.length > 0 ?
                                            chooseAddOn?.map((data, index) => (
                                                <div className="active-book-cont final-active-book-cont" key={index}>
                                                    <div className="active-book-left" >
                                                        <p>{data.name}</p>
                                                    </div>
                                                    <div className="active-book-right">
                                                        <p>£{data.name == 'Weather Refundable' ? flightTypePrice * 0.1 : data.price}</p>
                                                    </div>
                                                </div>
                                            ))
                                            :
                                            <p style={{paddingTop: "10px"}}>Not Selected</p>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Additional Information for Flight Voucher only (in Add To Booking's place) */}
                {isFlightVoucher && (
                    <div className="book_data_active" onClick={() => setActiveAccordion("additional-info")}> 
                        <div className={`row-1 ${isAdditionalInfoFilled(additionalInfo) ? 'active-card-val' : ''}`}> 
                            <span className="active-book-card"></span>
                            <div className="active-book-cont final-active-book-cont" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className="active-book-left">
                                    <h3>Additional Information</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Passenger Information and Select Preferences for Flight Voucher */}
                {isFlightVoucher && (
                    <>
                        {/* Passenger Information for Flight Voucher */}
                        <div className={`book_data_active`} onClick={() => setActiveAccordion("passenger-info")}> 
                            <div className={`row-1 ${passengerData[0].firstName !== '' ? 'active-card-val' : ''}`}> 
                                <span className="active-book-card"></span>
                                <div className="active-book-cont final-active-book-cont">
                                    <div className="active-book-left">
                                        <h3>Passenger Information</h3>
                                        {
                                            passengerData.length > 0 ?
                                                passengerData?.map((data, index) => {
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
                        </div>
                        {/* Select Preferences for Flight Voucher (immediately after Passenger Information) */}
                        <div className="book_data_active" onClick={() => setActiveAccordion("preference")}> 
                            <div className={`row-1 ${(
                                (preference && (
                                    (preference.location && Object.values(preference.location).some(Boolean)) ||
                                    (preference.time && Object.values(preference.time).some(Boolean)) ||
                                    (preference.day && Object.values(preference.day).some(Boolean))
                                )) ? 'active-card-val' : ''
                            )}`}> 
                                <span className="active-book-card"></span>
                                <div className="active-book-cont final-active-book-cont" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="active-book-left">
                                        <h3>Select Preferences</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {/* Hide Flight Date & Meeting Time for Buy Gift, Flight Voucher, Redeem Voucher */}
                {isBookFlight && (
                    <div className={`book_data_active ${isFlightVoucher || isGiftVoucher ? 'disable-acc' : ''}`} onClick={() => setActiveAccordion("live-availability")}> 
                        <div className={`row-1 ${selectedDate ? 'active-card-val' : ''}`}> 
                            <span className="active-book-card"></span>
                            <div className="active-book-cont final-active-book-cont">
                                <div className="active-book-left">
                                    <h3>Flight Date & Meeting Time</h3>
                                    <p>{selectedDate ? formatDate(selectedDate) : "Not Selected"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional Information and Passenger Information at the bottom for Book Flight */}
                {(
                    <>
                        {/* Passenger Information for Book Flight */}
                        <div className={`book_data_active`} onClick={() => setActiveAccordion("passenger-info")}> 
                            <div className={`row-1 ${passengerData[0].firstName !== '' ? 'active-card-val' : ''}`}> 
                                <span className="active-book-card"></span>
                                <div className="active-book-cont final-active-book-cont">
                                    <div className="active-book-left">
                                        <h3>Passenger Information</h3>
                                        {
                                            passengerData.length > 0 ?
                                                passengerData?.map((data, index) => {
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
                        </div>
                        {/* Additional Information for Book Flight */}
                        <div className="book_data_active" onClick={() => setActiveAccordion("additional-info")}> 
                            <div className={`row-1 ${isAdditionalInfoFilled(additionalInfo) ? 'active-card-val' : ''}`}> 
                                <span className="active-book-card"></span>
                                <div className="active-book-cont final-active-book-cont" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="active-book-left">
                                        <h3>Additional Information</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* For other cases, render Additional Information and Passenger Information in their original place */}
                {!isFlightVoucher && (
                    <>
                        {/* Additional Information for Buy Gift */}
                        {isGiftVoucher && (
                            <div className="book_data_active" onClick={() => setActiveAccordion("additional-info")}> 
                                <div className={`row-1 ${isAdditionalInfoFilled(additionalInfo) ? 'active-card-val' : ''}`}> 
                                    <span className="active-book-card"></span>
                                    <div className="active-book-cont final-active-book-cont" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div className="active-book-left">
                                            <h3>Additional Information</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Passenger Information for other cases */}
                        <div className={`book_data_active`} onClick={() => setActiveAccordion("passenger-info")}> 
                            <div className={`row-1 ${passengerData[0].firstName !== '' ? 'active-card-val' : ''}`}> 
                                <span className="active-book-card"></span>
                                <div className="active-book-cont final-active-book-cont">
                                    <div className="active-book-left">
                                        <h3>Passenger Information</h3>
                                        {
                                            passengerData.length > 0 ?
                                                passengerData?.map((data, index) => {
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
                        </div>
                    </>
                )}

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
                            background: isBookDisabled ? '#eee' : '#2d4263',
                            color: '#fff',
                            fontWeight: 500,
                            borderRadius: '8px',
                            padding: '8px 22px',
                            cursor: isBookDisabled ? 'not-allowed' : 'pointer',
                            opacity: isBookDisabled ? 0.5 : 1
                        }}
                        disabled={isBookDisabled}
                        onClick={() => {
                            if (isBookDisabled) {
                                setShowWarning(true);
                            } else {
                                setShowWarning(false);
                                handleBookData();
                            }
                        }}
                        type="button"
                    >
                        Book
                    </button>
                </div>
                {showWarning && (
                    <div style={{ color: 'red', marginTop: 10 }}>
                        Please fill in all required steps before booking.
                    </div>
                )}
            </div>
        </div>
    )
}

export default RightInfoCard;
