import axios from "axios";
import React from "react";
import { loadStripe } from '@stripe/stripe-js';

import config from '../../../config';
const API_BASE_URL = config.API_BASE_URL;

const stripePromise = loadStripe(config.STRIPE_PUBLIC_KEY);

const RightInfoCard = ({ activitySelect, chooseLocation, chooseFlightType, chooseAddOn, passengerData, additionalInfo, recipientDetails, selectedDate, selectedTime, activeAccordion, setActiveAccordion, isFlightVoucher, isRedeemVoucher, isGiftVoucher, voucherCode, resetBooking, preference, validateBuyGiftFields, selectedVoucherType, voucherStatus, voucherData }) => {

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
    const voucherTypePrice = selectedVoucherType?.totalPrice || 0;
    const addOnPrice = chooseAddOn.reduce((total, addOn) => {
        return total + (addOn.price !== "TBC" ? parseFloat(addOn.price) : 0); // Ignore "TBC" prices
    }, 0); // Opsiyonel - boş array ise 0 döner
    
    // Weather Refundable price is now calculated separately from passengerData
    const weatherRefundPrice = passengerData && passengerData.some(p => p.weatherRefund) ? 47.50 : 0;
    
    // Calculate total price based on activity type and selections
    let totalPrice = 0;
    
    if (activitySelect === 'Book Flight') {
        // For Book Flight, only include voucher type price and add-ons
        totalPrice = parseFloat(voucherTypePrice) + parseFloat(addOnPrice) + weatherRefundPrice;
    } else if (activitySelect === 'Flight Voucher' || activitySelect === 'Buy Gift') {
        // For Flight Voucher and Buy Gift, only show total when voucher type is selected
        if (selectedVoucherType) {
            totalPrice = parseFloat(voucherTypePrice) + parseFloat(addOnPrice) + weatherRefundPrice;
        }
    } else {
        // For other activity types (like Redeem Voucher), include all components
        totalPrice = parseFloat(flightTypePrice) + parseFloat(voucherTypePrice) + parseFloat(addOnPrice) + weatherRefundPrice;
    }

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
    // - Buy Gift: require chooseFlightType, passengerData (at least one with firstName), additionalInfo, recipientDetails
    // - Book Flight: require all fields including complete passenger information
    // Note: chooseAddOn (Add To Booking) is now optional for all activity types
    const hasPassenger = Array.isArray(passengerData) && passengerData.some(p => p.firstName && p.firstName.trim() !== '');
    
    // Enhanced passenger validation for Book Flight
    const isPassengerInfoComplete = Array.isArray(passengerData) && passengerData.every(passenger => {
        return passenger.firstName && passenger.firstName.trim() !== '' &&
               passenger.lastName && passenger.lastName.trim() !== '' &&
               passenger.weight && passenger.weight.trim() !== '' &&
               passenger.phone && passenger.phone.trim() !== '' &&
               passenger.email && passenger.email.trim() !== '';
    });
    
    // Special validation for Buy Gift (no weight required)
    const isBuyGiftPassengerComplete = Array.isArray(passengerData) && passengerData.every(passenger => {
        return passenger.firstName && passenger.firstName.trim() !== '' &&
               passenger.lastName && passenger.lastName.trim() !== '' &&
               passenger.phone && passenger.phone.trim() !== '' &&
               passenger.email && passenger.email.trim() !== '';
    });
    
    const isBookDisabled = isRedeemVoucher
        ? !(
            activitySelect &&
            chooseLocation &&
            chooseFlightType &&
            selectedDate &&
            selectedTime &&
            isPassengerInfoComplete &&
            isNonEmptyObject(additionalInfo)
            // chooseAddOn artık opsiyonel - isNonEmptyArray(chooseAddOn) kaldırıldı
        )
        : isFlightVoucher
        ? !(
            chooseFlightType &&
            isPassengerInfoComplete &&
            isNonEmptyObject(additionalInfo)
            // chooseAddOn artık opsiyonel - isNonEmptyArray(chooseAddOn) kaldırıldı
        )
        : isGiftVoucher
        ? !(
            chooseFlightType &&
            selectedVoucherType &&
            // chooseAddOn artık opsiyonel - isNonEmptyArray(chooseAddOn) kaldırıldı
            isBuyGiftPassengerComplete &&
            isNonEmptyObject(additionalInfo) &&
            isNonEmptyObject(recipientDetails)
        )
        : !(
            activitySelect &&
            chooseLocation &&
            chooseFlightType &&
            selectedVoucherType &&
            // chooseAddOn artık opsiyonel - isNonEmptyArray(chooseAddOn) kaldırıldı
            isPassengerInfoComplete &&
            isNonEmptyObject(additionalInfo) &&
            isNonEmptyObject(recipientDetails) &&
            selectedDate &&
            selectedTime
        );

    // Debug logging for Buy Gift
    if (isGiftVoucher) {
        console.log('Buy Gift Debug:', {
            chooseFlightType: !!chooseFlightType,
            selectedVoucherType: !!selectedVoucherType,
            chooseAddOn: isNonEmptyArray(chooseAddOn), // Opsiyonel - sadece bilgi amaçlı
            isPassengerInfoComplete,
            additionalInfo: isNonEmptyObject(additionalInfo),
            recipientDetails: isNonEmptyObject(recipientDetails),
            isBookDisabled
        });
        
        // Detailed debugging
        console.log('Buy Gift Detailed Debug:', {
            chooseFlightType: chooseFlightType,
            selectedVoucherType: selectedVoucherType,
            chooseAddOn: chooseAddOn, // Opsiyonel - sadece bilgi amaçlı
            passengerData: passengerData,
            additionalInfo: additionalInfo,
            recipientDetails: recipientDetails,
            isPassengerInfoComplete: isPassengerInfoComplete
        });
        
        // Check each condition separately
        console.log('Buy Gift Conditions Check:', {
            condition1: !!chooseFlightType,
            condition2: !!selectedVoucherType,
            condition3: 'chooseAddOn is now optional', // Opsiyonel olduğu belirtildi
            condition4: isPassengerInfoComplete,
            condition5: isNonEmptyObject(additionalInfo),
            condition6: isNonEmptyObject(recipientDetails)
        });
    }

    const [showWarning, setShowWarning] = React.useState(false);

    // Send Data To Backend
    const handleBookData = async () => {
        console.log("Book button clicked");
        console.log("API_BASE_URL:", API_BASE_URL);
        
        // Validate Buy Gift and Flight Voucher fields if needed
        if ((isGiftVoucher || isFlightVoucher) && validateBuyGiftFields) {
            const isValid = validateBuyGiftFields();
            if (!isValid) {
                return; // Validation failed, don't proceed
            }
        }
        if (isFlightVoucher || isGiftVoucher) {
            // VOUCHER DATA PREPARATION (Flight Voucher ve Gift Voucher için Stripe ödeme)
            const voucherData = {
                name: (recipientDetails?.name?.trim() || ((passengerData?.[0]?.firstName || '') + ' ' + (passengerData?.[0]?.lastName || '')).trim()),
                weight: passengerData?.[0]?.weight || "",
                flight_type: chooseFlightType?.type || "",
                voucher_type: isFlightVoucher ? "Flight Voucher" : "Gift Voucher",
                email: (recipientDetails?.email || passengerData?.[0]?.email || "").trim(),
                phone: (recipientDetails?.phone || passengerData?.[0]?.phone || "").trim(),
                mobile: (recipientDetails?.phone || passengerData?.[0]?.phone || "").trim(),
                redeemed: "No",
                paid: totalPrice,
                offer_code: "",
                voucher_ref: voucherCode || "",
                recipient_name: recipientDetails?.name || "",
                recipient_email: recipientDetails?.email || "",
                recipient_phone: recipientDetails?.phone || "",
                recipient_gift_date: recipientDetails?.date || "",
                preferred_location: preference && preference.location ? Object.keys(preference.location).filter(k => preference.location[k]).join(', ') : null,
                preferred_time: preference && preference.time ? Object.keys(preference.time).filter(k => preference.time[k]).join(', ') : null,
                preferred_day: preference && preference.day ? Object.keys(preference.day).filter(k => preference.day[k]).join(', ') : null
            };
            
            try {
                // Stripe Checkout Session başlat - VOUCHER için
                const sessionRes = await axios.post(`${API_BASE_URL}/api/create-checkout-session`, {
                    totalPrice,
                    currency: 'GBP',
                    voucherData,
                    type: 'voucher'
                });
                if (!sessionRes.data.success) {
                    alert('Ödeme başlatılamadı: ' + (sessionRes.data.message || 'Bilinmeyen hata'));
                    return;
                }
                const stripe = await stripePromise;
                const { error } = await stripe.redirectToCheckout({ sessionId: sessionRes.data.sessionId });
                if (error) {
                    alert('Stripe yönlendirme hatası: ' + error.message);
                }
                // Başarılı ödeme sonrası createVoucher webhook ile tetiklenecek
            } catch (error) {
                console.error('Stripe Checkout başlatılırken hata:', error);
                alert('Ödeme başlatılırken hata oluştu. Lütfen tekrar deneyin.');
            }
            return;
        }
        
        // REDEEM VOUCHER FLOW (Stripe ödeme olmadan direkt createVoucher)
        if (isRedeemVoucher) {
            // Voucher data preparation for Redeem Voucher
            const voucherData = {
                name: (passengerData?.[0]?.firstName || '') + ' ' + (passengerData?.[0]?.lastName || ''),
                weight: passengerData?.[0]?.weight || "",
                flight_type: chooseFlightType?.type || "",
                voucher_type: "Redeem Voucher",
                email: passengerData?.[0]?.email || "",
                phone: passengerData?.[0]?.phone || "",
                mobile: passengerData?.[0]?.phone || "",
                redeemed: "Yes", // Redeem Voucher için redeemed = "Yes"
                paid: 0, // Redeem Voucher için ödeme yok
                offer_code: voucherCode || "",
                voucher_ref: voucherCode || "",
                recipient_name: "",
                recipient_email: "",
                recipient_phone: "",
                recipient_gift_date: "",
                preferred_location: preference && preference.location ? Object.keys(preference.location).filter(k => preference.location[k]).join(', ') : null,
                preferred_time: preference && preference.time ? Object.keys(preference.time).filter(k => preference.time[k]).join(', ') : null,
                preferred_day: preference && preference.day ? Object.keys(preference.day).filter(k => preference.day[k]).join(', ') : null
            };
            
            try {
                // Direkt createVoucher endpoint'ini çağır
                const response = await axios.post(`${API_BASE_URL}/api/createVoucher`, voucherData);
                
                if (response.data.success) {
                    alert(`Voucher başarıyla kullanıldı! Voucher ID: ${response.data.voucherId}`);
                    // Başarılı işlem sonrası form'u temizle
                    resetBooking();
                } else {
                    alert('Voucher kullanılırken hata oluştu: ' + (response.data.error || 'Bilinmeyen hata'));
                }
            } catch (error) {
                console.error('Voucher kullanılırken hata:', error);
                alert('Voucher kullanılırken hata oluştu. Lütfen tekrar deneyin.');
            }
            return;
        }
        // BOOK FLIGHT FLOW (Stripe ile ödeme)
        let bookingDateStr = selectedDate;
        if (selectedDate instanceof Date && selectedTime) {
            const [h, m, s] = selectedTime.split(":");
            const localDate = new Date(selectedDate);
            localDate.setHours(Number(h));
            localDate.setMinutes(Number(m));
            localDate.setSeconds(Number(s) || 0);
            bookingDateStr = `${localDate.getFullYear()}-${String(localDate.getMonth()+1).padStart(2,'0')}-${String(localDate.getDate()).padStart(2,'0')} ${String(localDate.getHours()).padStart(2,'0')}:${String(localDate.getMinutes()).padStart(2,'0')}:${String(localDate.getSeconds()).padStart(2,'0')}`;
        } else if (selectedDate instanceof Date) {
            bookingDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
        }
        const bookingData = {
            activitySelect,
            chooseLocation,
            chooseFlightType,
            chooseAddOn: Array.isArray(chooseAddOn) ? chooseAddOn : [], // Opsiyonel - boş array olabilir
            passengerData,
            additionalInfo,
            recipientDetails,
            selectedDate: bookingDateStr,
            selectedTime: selectedTime || null,
            totalPrice,
            voucher_code: voucherCode,
            flight_attempts: chooseFlightType?.flight_attempts || 0,
            preferred_location: preference && preference.location ? Object.keys(preference.location).filter(k => preference.location[k]).join(', ') : null,
            preferred_time: preference && preference.time ? Object.keys(preference.time).filter(k => preference.time[k]).join(', ') : null,
            preferred_day: preference && preference.day ? Object.keys(preference.day).filter(k => preference.day[k]).join(', ') : null
        };
        try {
            // Stripe Checkout Session başlat
            // localStorage.setItem('pendingBookingData', JSON.stringify(bookingData)); // ARTIK GEREK YOK
            const sessionRes = await axios.post(`${API_BASE_URL}/api/create-checkout-session`, {
                totalPrice,
                currency: 'GBP',
                bookingData,
                type: 'booking'
            });
            
            console.log('Backend response:', sessionRes.data);
            
            // Response kontrolü
            if (!sessionRes.data || !sessionRes.data.success) {
                const errorMessage = sessionRes.data?.message || 'Bilinmeyen hata';
                console.error('Backend error:', errorMessage);
                alert('Ödeme başlatılamadı: ' + errorMessage);
                return;
            }
            
            if (!sessionRes.data.sessionId) {
                console.error('Session ID not found in response');
                alert('Ödeme başlatılamadı: Session ID bulunamadı');
                return;
            }
            const stripe = await stripePromise;
            console.log('Redirecting to Stripe with sessionId:', sessionRes.data.sessionId);
            
            try {
                // Stripe'ın yeni versiyonunda farklı yaklaşım
                const result = await stripe.redirectToCheckout({ 
                    sessionId: sessionRes.data.sessionId 
                });
                
                if (result.error) {
                    console.error('Stripe redirect error:', result.error);
                    alert('Stripe yönlendirme hatası: ' + result.error.message);
                } else {
                    console.log('Stripe redirect successful');
                }
            } catch (stripeError) {
                console.error('Stripe redirect failed:', stripeError);
                alert('Stripe yönlendirme başarısız: ' + stripeError.message);
            }
            // Başarılı ödeme sonrası createBooking çağrısı success_url ile tetiklenecek (webhook veya frontend ile)
        } catch (error) {
            console.error('Stripe Checkout başlatılırken hata:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                response: error.response?.data
            });
            alert('Ödeme başlatılırken hata oluştu. Lütfen tekrar deneyin.');
        }
    }

    const isBookFlight = activitySelect === "Book Flight";

    // Update the sectionSpacing to a slightly larger value for more visual balance (e.g., 24px)
    const sectionSpacing = { marginBottom: '24px' };

    return (
        <div className="book_active">
            <div className="book_data_active">
                {/* En üstte Flight Type/What would you like to do? */}
                <div className="book_data_active">
                    <div className={`row-1 ${(() => {
                        // For Redeem Voucher, only show green tick if voucher is valid
                        if (activitySelect === 'Redeem Voucher') {
                            return voucherStatus === 'valid' ? 'active-card-val' : '';
                        }
                        // For other activity types, show green tick if selected
                        return activitySelect ? 'active-card-val' : '';
                    })()}`}>
                        <span className="active-book-card"></span>
                        <div className="active-book-cont">
                            <h3>Flight Type</h3>
                            <p>
                                {activitySelect ? (
                                    activitySelect === 'Redeem Voucher' && voucherCode && voucherStatus === 'valid' ? 
                                    `${activitySelect} - ${voucherCode}` : 
                                    activitySelect === 'Redeem Voucher' && voucherCode && voucherStatus === 'invalid' ?
                                    `${activitySelect} - Invalid Code` :
                                    activitySelect
                                ) : 'Not Selected'}
                            </p>
                        </div>
                    </div>
                </div>
                {activitySelect === 'Book Flight' && (
                    <>
                        <div className="book_data_active" onClick={() => setActiveAccordion("location")}> <div className={`row-1 ${chooseLocation ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont"><h3>Location</h3><p>{chooseLocation ? chooseLocation : "Not Selected"}</p></div></div></div>
                        <div className="book_data_active" onClick={() => setActiveAccordion("experience")}> <div className={`row-1 ${chooseFlightType.passengerCount ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont"><h3>Experience</h3><p>{chooseFlightType.passengerCount ? chooseFlightType?.type : "Not Selected"}</p></div></div></div>
                        {chooseLocation !== "Bristol Fiesta" && chooseFlightType?.type !== "Private Charter" && (
                            <div className="book_data_active" onClick={() => setActiveAccordion("voucher-type")}> <div className={`row-1 ${selectedVoucherType ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Voucher Type</h3><p>{selectedVoucherType ? `${selectedVoucherType.title} (${selectedVoucherType.quantity} passenger${selectedVoucherType.quantity > 1 ? 's' : ''})` : "Not Selected"}</p></div><div className="active-book-right"><p>{selectedVoucherType ? "£" + selectedVoucherType.totalPrice : ""}</p></div></div></div></div>
                        )}
                        <div className="book_data_active" onClick={() => setActiveAccordion("live-availability")}> <div className={`row-1 ${selectedDate && selectedTime ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Live Availability</h3><p>{selectedDate && selectedTime ? formatDate(selectedDate) : "Not Selected"}</p></div></div></div></div>
                        <div className="book_data_active" onClick={() => setActiveAccordion("passenger-info")}> <div className={`row-1 ${passengerData && passengerData.length > 0 && passengerData[0].firstName !== '' ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Passenger Information</h3>{(passengerData && passengerData.length > 0 && passengerData.some(p => p.firstName && p.firstName.trim() !== '')) ? passengerData.map((data, index) => (data.firstName ? <div key={index}><p>{"Passenger " + `${index + 1}` + ": " + data.firstName + " " + data.lastName + " " + data.weight + "kg"}</p>{data.weatherRefund && <p style={{marginTop: '8px !important', color: '#666'}}>£47.50 Refundable</p>}</div> : null)) : <p>Not Provided</p>}</div></div></div></div>
                        <div className="book_data_active" onClick={() => setActiveAccordion("additional-info")}> <div className={`row-1 ${isAdditionalInfoFilled(additionalInfo) ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div className="active-book-left"><h3>Additional Information</h3>{isAdditionalInfoFilled(additionalInfo) ? null : <p>Not Provided</p>}</div></div></div></div>
                        {/* Preferences only for non-Book Flight and non-Redeem Voucher */}
                        {activitySelect !== 'Book Flight' && activitySelect !== 'Redeem Voucher' && (
                            <div className="book_data_active" onClick={() => setActiveAccordion("select-preferences")}> <div className={`row-1 ${(activeAccordion === 'select-preferences' || activeAccordion === 'preference') ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div className="active-book-left"><h3>Preferences</h3>{(preference && ((preference.location && Object.values(preference.location).some(Boolean)) || (preference.time && Object.values(preference.time).some(Boolean)) || (preference.day && Object.values(preference.day).some(Boolean)))) ? null : <p>Not Provided</p>}</div></div></div></div>
                        )}
                        <div className="book_data_active" onClick={() => setActiveAccordion("add-on")}> <div className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Add To Booking</h3>{chooseAddOn?.length > 0 ? chooseAddOn?.map((data, index) => (<div className="active-book-cont final-active-book-cont" key={index}><div className="active-book-left" ><p>{data.name}</p></div><div className="active-book-right"><p>£{(data.name == 'Weather Refundable' || data.name == 'Weather Refundable ') ? ' 47.50' : data.price}</p></div></div>)) : <p style={{paddingTop: "10px"}}>Not Selected</p>}</div></div></div></div>
                    </>
                )}
                {activitySelect === 'Redeem Voucher' && (
                    <>
                        <div className="book_data_active" onClick={() => setActiveAccordion("location")}> <div className={`row-1 ${chooseLocation ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="book-cont"><h3>Location</h3><p>{chooseLocation ? chooseLocation : "Not Selected"}</p></div></div></div>
                        <div className="book_data_active" onClick={() => setActiveAccordion("live-availability")}> <div className={`row-1 ${selectedDate && selectedTime ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="book-cont final-active-book-cont"><div className="active-book-left"><h3>Live Availability</h3><p>{selectedDate && selectedTime ? formatDate(selectedDate) : "Not Selected"}</p></div></div></div></div>
                        <div className="book_data_active" onClick={() => setActiveAccordion("passenger-info")}> <div className={`row-1 ${passengerData && passengerData.length > 0 && passengerData[0].firstName !== '' ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="book-cont final-active-book-cont"><div className="active-book-left"><h3>Passenger Information</h3>{(passengerData && passengerData.length > 0 && passengerData.some(p => p.firstName && p.firstName.trim() !== '')) ? passengerData.map((data, index) => (data.firstName ? <div key={index}><p>{"Passenger " + `${index + 1}` + ": " + data.firstName + " " + data.lastName + " " + data.weight + "kg"}</p>{data.weatherRefund && <p style={{marginTop: '8px !important', color: '#666'}}>£47.50 Refundable</p>}</div> : null)) : <p>Not Provided</p>}</div></div></div></div>
                        <div className="book_data_active" onClick={() => setActiveAccordion("additional-info")}> <div className={`row-1 ${isAdditionalInfoFilled(additionalInfo) ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="book-cont final-active-book-cont" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div className="active-book-left"><h3>Additional Information</h3>{isAdditionalInfoFilled(additionalInfo) ? null : <p>Not Provided</p>}</div></div></div></div>
                        {/* Preferences REMOVED for Redeem Voucher */}
                        <div className="book_data_active" onClick={() => setActiveAccordion("add-on")}> <div className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="book-cont final-active-book-cont"><div className="active-book-left"><h3>Add To Booking</h3>{chooseAddOn?.length > 0 ? chooseAddOn?.map((data, index) => (<div className="book-cont final-active-book-cont" key={index}><div className="book-left" ><p>{data.name}</p></div><div className="book-right"><p>£{(data.name == 'Weather Refundable' || data.name == 'Weather Refundable ') ? ' 47.50' : data.price}</p></div></div>)) : <p style={{paddingTop: "10px"}}>Not Selected</p>}</div></div></div></div>
                    </>
                )}
                {activitySelect === 'Buy Gift' && (
                    <>
                        <div className="book_data_active" onClick={() => setActiveAccordion("experience")}> <div className={`row-1 ${chooseFlightType.passengerCount ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont"><h3>Experience</h3><p>{chooseFlightType.passengerCount ? chooseFlightType?.type : "Not Selected"}</p></div></div></div>
                        {chooseLocation !== "Bristol Fiesta" && (
                            <div className="book_data_active" onClick={() => setActiveAccordion("voucher-type")}> <div className={`row-1 ${selectedVoucherType ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Voucher Type</h3><p>{selectedVoucherType ? `${selectedVoucherType.title} (${selectedVoucherType.quantity} passenger${selectedVoucherType.quantity > 1 ? 's' : ''})` : "Not Selected"}</p></div><div className="active-book-right"><p>{selectedVoucherType ? "£" + selectedVoucherType.totalPrice : ""}</p></div></div></div></div>
                        )}
                        <div className="book_data_active" onClick={() => setActiveAccordion("recipient-details")}> <div className={`row-1 ${recipientDetails?.name ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont"><h3>Recipient Details</h3><p>{recipientDetails?.name ? recipientDetails.name : "Not Provided"}</p></div></div></div>
                        <div className="book_data_active" onClick={() => setActiveAccordion("passenger-info")}> <div className={`row-1 ${passengerData && passengerData.length > 0 && passengerData[0].firstName !== '' ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Purchaser Information</h3>{(passengerData && passengerData.length > 0 && passengerData.some(p => p.firstName && p.firstName.trim() !== '')) ? passengerData.map((data, index) => (data.firstName ? <div key={index}><p>{data.firstName + " " + data.lastName}</p>{data.weatherRefund && <p style={{marginTop: '8px !important', color: '#666'}}>£47.50 Refundable</p>}</div> : null)) : <p>Not Provided</p>}</div></div></div></div>
                        <div className="book_data_active" onClick={() => setActiveAccordion("add-on")}> <div className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Add To Booking</h3>{chooseAddOn?.length > 0 ? chooseAddOn?.map((data, index) => (<div className="active-book-cont final-active-book-cont" key={index}><div className="active-book-left" ><p>{data.name}</p></div><div className="active-book-right"><p>£{(data.name == 'Weather Refundable' || data.name == 'Weather Refundable ') ? ' 47.50' : data.price}</p></div></div>)) : <p style={{paddingTop: "10px"}}>Not Selected</p>}</div></div></div></div>
                    </>
                )}
                {activitySelect === 'Flight Voucher' && (
                    <>
                        <div className="book_data_active" onClick={() => setActiveAccordion("experience")}> <div className={`row-1 ${chooseFlightType.passengerCount ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont"><h3>Experience</h3><p>{chooseFlightType.passengerCount ? chooseFlightType?.type : "Not Selected"}</p></div></div></div>
                        {chooseLocation !== "Bristol Fiesta" && (
                            <div className="book_data_active" onClick={() => setActiveAccordion("voucher-type")}> <div className={`row-1 ${selectedVoucherType ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Voucher Type</h3><p>{selectedVoucherType ? `${selectedVoucherType.title} (${selectedVoucherType.quantity} passenger${selectedVoucherType.quantity > 1 ? 's' : ''})` : "Not Selected"}</p></div><div className="active-book-right"><p>{selectedVoucherType ? "£" + selectedVoucherType.totalPrice : ""}</p></div></div></div></div>
                        )}
                        <div className="book_data_active" onClick={() => setActiveAccordion("passenger-info")}> <div className={`row-1 ${passengerData && passengerData.length > 0 && passengerData[0].firstName !== '' ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Passenger Information</h3>{(passengerData && passengerData.length > 0 && passengerData.some(p => p.firstName && p.firstName.trim() !== '')) ? passengerData.map((data, index) => (data.firstName ? <div key={index}><p>{"Passenger " + `${index + 1}` + ": " + data.firstName + " " + data.lastName + " " + data.weight + "kg"}</p>{data.weatherRefund && <p style={{marginTop: '8px !important', color: '#666'}}>£47.50 Refundable</p>}</div> : null)) : <p>Not Provided</p>}</div></div></div></div>
                        <div className="book_data_active" onClick={() => setActiveAccordion("additional-info")}> <div className={`row-1 ${isAdditionalInfoFilled(additionalInfo) ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div className="active-book-left"><h3>Additional Information</h3>{isAdditionalInfoFilled(additionalInfo) ? null : <p>Not Provided</p>}</div></div></div></div>
                        {/* Preferences removed for Flight Voucher */}
                        <div className="book_data_active" onClick={() => setActiveAccordion("add-on")}> <div className={`row-1 ${chooseAddOn && chooseAddOn.length > 0 ? 'active-card-val' : ''}`}> <span className="active-book-card"></span><div className="active-book-cont final-active-book-cont"><div className="active-book-left"><h3>Add To Booking</h3>{chooseAddOn?.length > 0 ? chooseAddOn?.map((data, index) => (<div className="active-book-cont final-active-book-cont" key={index}><div className="active-book-left" ><p>{data.name}</p></div><div className="active-book-right"><p>£{(data.name == 'Weather Refundable' || data.name == 'Weather Refundable ') ? ' 47.50' : data.price}</p></div></div>)) : <p style={{paddingTop: "10px"}}>Not Selected</p>}</div></div></div></div>
                    </>
                )}
                <div className="bottom_main">
                    <h3>Total</h3>
                    <p style={{ fontWeight: 500, fontSize: '1.2rem' }}>
                        {totalPrice > 0 ? `£${totalPrice.toFixed(2)}` : ""}
                    </p>
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
                    <div style={{ color: 'red', marginTop: 10, fontSize: '14px', textAlign: 'center' }}>
                        {activitySelect === 'Book Flight' && (
                            <>
                                Please complete all required fields:<br/>
                                • Flight Location and Experience<br/>
                                • Voucher Type<br/>
                                • Live Availability (Date & Time)<br/>
                                • Passenger Information (All fields required)<br/>
                                • Additional Information<br/>
                                • Add to Booking
                            </>
                        )}
                        {activitySelect === 'Redeem Voucher' && (
                            <>
                                Please complete all required fields:<br/>
                                • Flight Location and Experience<br/>
                                • Live Availability (Date & Time)<br/>
                                • Passenger Information (All fields required)<br/>
                                • Additional Information<br/>
                                • Add to Booking
                            </>
                        )}
                        {activitySelect === 'Flight Voucher' && (
                            <>
                                Please complete all required fields:<br/>
                                • Experience<br/>
                                • Passenger Information (All fields required)<br/>
                                • Additional Information<br/>
                                • Add to Booking
                            </>
                        )}
                        {activitySelect === 'Buy Gift' && (
                            <>
                                Please complete all required fields:<br/>
                                • Experience<br/>
                                • Voucher Type<br/>
                                • Recipient Details<br/>
                                • Purchaser Information (All fields required)<br/>
                                • Add to Booking
                            </>
                        )}
                        {activitySelect !== 'Book Flight' && activitySelect !== 'Redeem Voucher' && activitySelect !== 'Flight Voucher' && activitySelect !== 'Buy Gift' && (
                            'Please fill in all required steps before booking.'
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default RightInfoCard;
