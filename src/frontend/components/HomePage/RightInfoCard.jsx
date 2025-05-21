import axios from "axios";
import React from "react";

const RightInfoCard = ({ activitySelect, chooseLocation, chooseFlightType, chooseAddOn, passengerData, additionalInfo, recipientDetails, selectedDate, activeAccordion, setActiveAccordion, isFlightVoucher, isRedeemVoucher, isGiftVoucher, voucherCode }) => {

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
    const totalPrice = parseInt(flightTypePrice) + parseInt(addOnPrice);


    // Send Data To Cart
    function handleBookData() {
        if (activitySelect && chooseLocation && chooseFlightType && chooseAddOn && passengerData && additionalInfo && recipientDetails && selectedDate) {
            document.getElementById("cartForm").submit();
            setTimeout(() => {
                window.location.href = "https://mani-testing-store.myshopify.com/checkout";
            }, 1000);
        } else {
            alert("Please fill all fields!");
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
                            <p>{selectedDate ? formatDate(selectedDate) : "Not Selected"}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`book_data_active ${isFlightVoucher || isRedeemVoucher || isGiftVoucher ? 'disable-acc' : ''}`} onClick={() => setActiveAccordion("add-on")}>
                <div className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? 'active-card-val' : ''}`}>
                    <span className="active-book-card"></span>
                    <div className="final_add-on-wrap">
                        <h3>Add To Booking</h3>
                        {
                            chooseAddOn?.length > 0 ?
                                (
                                    chooseAddOn?.map((data, index) => {
                                        return (
                                            <div className="active-book-cont final-active-book-cont" key={index}>
                                                <div className="active-book-left" >
                                                    <p>{data.name}</p>
                                                </div>
                                                <div className="active-book-right">
                                                    <p>£{data.name == 'Weather Refundable' ? flightTypePrice * 0.1 : data.price}</p>
                                                </div>
                                            </div>
                                        )
                                    })

                                )
                                :
                                <p style={{paddingTop: "10px"}}>None Selected</p>
                        }
                    </div>
                </div>
            </div>

            <div className={`book_data_active ${isFlightVoucher || isGiftVoucher ? 'disable-acc' : ''}`} onClick={() => setActiveAccordion("passenger-info")}>
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
            </div>

            <div className="bottom_main">
                <h3>Total</h3>
                <p style={{ fontWeight: 600, fontSize: '1.2rem' }}>£{totalPrice > 0 ? totalPrice : "0"}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0px', marginBottom: '0px' }}>
                <div
                    className={`booking_btn final_booking-button${!(activitySelect && chooseLocation && chooseFlightType && chooseAddOn && passengerData && additionalInfo && recipientDetails && selectedDate) ? ' disabled' : ''}`}
                    onClick={
                        activitySelect && chooseLocation && chooseFlightType && chooseAddOn && passengerData && additionalInfo && recipientDetails && selectedDate
                            ? handleBookData
                            : undefined
                    }
                >
                    Book
                </div>
            </div>
            <form id="cartForm" action="https://mani-testing-store.myshopify.com/cart/add" method="POST">
                <input type="hidden" name="id" value="44455341195461" />
                <input type="hidden" name="quantity" value="1" />
                <input type="hidden" name="properties[_activitySelect]" value={activitySelect} />
                <input type="hidden" name="properties[_chooseLocation]" value={chooseLocation} />
                <input type="hidden" name="properties[_chooseFlightType]" value={JSON.stringify(chooseFlightType)} />
                <input type="hidden" name="properties[_chooseAddOn]" value={JSON.stringify(chooseAddOn)} />
                <input type="hidden" name="properties[_passengerData]" value={JSON.stringify(passengerData)} />
                <input type="hidden" name="properties[_additionalInfo]" value={JSON.stringify(additionalInfo)} />
                <input type="hidden" name="properties[_recipientDetails]" value={JSON.stringify(recipientDetails)} />
                <input type="hidden" name="properties[_selectedDate]" value={selectedDate} />
                {isRedeemVoucher && voucherCode && (
                    <input type="hidden" name="properties[_voucherCode]" value={voucherCode} />
                )}
            </form>
        </div>
    )
}

export default RightInfoCard;