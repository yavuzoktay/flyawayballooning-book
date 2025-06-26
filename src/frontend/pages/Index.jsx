import React, { useState, useEffect } from "react";
import LOGO from '../../assets/images/FAB_Logo_DarkBlue.png';
import { Container } from "@mui/material";
import ChooseActivityCard from "../components/HomePage/ChooseActivityCard";
import RightInfoCard from "../components/HomePage/RightInfoCard";
import LocationSection from "../components/HomePage/LocationSection";
import ExperienceSection from "../components/HomePage/ExperienceSection";
import LiveAvailabilitySection from "../components/HomePage/LiveAvailabilitySection";
import AddOnsSection from "../components/HomePage/AddOnsSection";
import PassengerInfo from "../components/HomePage/PassengerInfo";
import EnterPreferences from "../components/HomePage/EnterPreferences";
import EnterRecipientDetails from "../components/HomePage/EnterRecipientDetails";
import AdditionalInfo from "../components/HomePage/AdditionalInfo";
import BookingHeader from "../components/Common/BookingHeader";
import Accordion from "../components/Common/Accordion";
import axios from "axios";
import "../components/HomePage/RedeemVoucher.css";
import { BsInfoCircle } from "react-icons/bs";

const Index = () => {
    const [activeAccordion, setActiveAccordion] = useState("activity"); // Start with activity section open
    const [activitySelect, setActivitySelect] = useState(null);
    const [chooseLocation, setChooseLocation] = useState(null);
    const [chooseFlightType, setChooseFlightType] = useState({ type: "", passengerCount: "", price: "" });
    const [addPassenger, setAddPassenger] = useState([1, 2]);
    const [chooseAddOn, setChooseAddOn] = useState([]);
    const [passengerData, setPassengerData] = useState([{ firstName: '', lastName: '', weight: '', weatherRefund: false }]);
    const [weatherRefund, setWeatherRefund] = useState(false);
    const [preference, setPreference] = useState({ location: {}, time: {}, day: {} });
    const [recipientDetails, setRecipientDetails] = useState({ name: "", email: "", phone: "", date: "" });
    const [additionalInfo, setAdditionalInfo] = useState({ notes: "", hearAboutUs: "", reason: "", prefer: {} });
    const [selectedDate, setSelectedDate] = useState(null);
    const [activityId, setActivityId] = useState(null);
    const [selectedActivity, setSelectedActivity]= useState([]);
    const [availableSeats, setAvailableSeats] = useState([]);
    const [voucherCode, setVoucherCode] = useState("");
    const [voucherStatus, setVoucherStatus] = useState(null); // "valid", "invalid", or null
    
    const isFlightVoucher = activitySelect === "Flight Voucher";
    const isRedeemVoucher = activitySelect === "Redeem Voucher";
    const isGiftVoucher = activitySelect === "Buy Gift";
    const isBookFlight = activitySelect === "Book Flight";
    console.log('chooseFlightType', chooseFlightType);

    // Lokasyon ve tarih seçilip seçilmediğini kontrol et
    const showBookingHeader = chooseLocation && selectedDate;

    // Diğer section'lar için özel bir setActiveAccordion fonksiyonu
    // activitySelect null ise section'ların açılmasını engeller
    const handleSetActiveAccordion = (sectionId) => {
        if (activitySelect === null) {
            return; // Eğer aktivite seçilmediyse, hiçbir şey yapma
        }
        setActiveAccordion(sectionId); // Aktivite seçildiyse normal davran
    };

    // Handle voucher code submission
    const handleVoucherSubmit = (code) => {
        setVoucherCode(code);
        // You would typically validate the voucher code with an API call
        // For now, let's just set it as valid
        setVoucherStatus("valid");
        setActivitySelect("Redeem Voucher");
        
        // Don't automatically move to the location section
        // setTimeout(() => {
        //     setActiveAccordion("location");
        // }, 500);
        
        // Here you would make an API call to validate the voucher
        // Example:
        /*
        axios.post("/api/validate-voucher", { voucherCode: code })
            .then(response => {
                if (response.data.success) {
                    setVoucherStatus("valid");
                    setActivitySelect("Redeem Voucher");
                    setActiveAccordion("location");
                } else {
                    setVoucherStatus("invalid");
                }
            })
            .catch(error => {
                console.error("Error validating voucher:", error);
                setVoucherStatus("invalid");
            });
        */
    };

    useEffect(() => {
        if (activitySelect === "Book Flight" || activitySelect === "Redeem Voucher") {
            setActiveAccordion("location");
        } else if (activitySelect === "Flight Voucher" || activitySelect === "Buy Gift") {
            setActiveAccordion("experience");
        }
    }, [activitySelect]);

    // Reset all booking selections
    const resetBooking = () => {
        setActiveAccordion("activity");
        setActivitySelect(null);
        setChooseLocation(null);
        setChooseFlightType({ type: "", passengerCount: "", price: "" });
        setAddPassenger([1, 2]);
        setChooseAddOn([]);
        setPassengerData([{ firstName: '', lastName: '', weight: '', weatherRefund: false }]);
        setWeatherRefund(false);
        setPreference({ location: {}, time: {}, day: {} });
        setRecipientDetails({ name: "", email: "", phone: "", date: "" });
        setAdditionalInfo({ notes: "", hearAboutUs: "", reason: "", prefer: {} });
        setSelectedDate(null);
        setActivityId(null);
        setSelectedActivity([]);
        setAvailableSeats([]);
        setVoucherCode("");
        setVoucherStatus(null);
    };

    return (
        <div className="final-booking-wrap">
            <div className="header-bg">
                <div className="header-layout">
                    <Container>
                        <div className="header-flex-row" style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="logo" style={{ marginRight: '32px' }}>
                                <a href="/" onClick={e => { e.preventDefault(); window.location.reload(); }} style={{ display: 'inline-block' }}>
                                    <img src={LOGO} alt="Fly Away Ballooning Logo" />
                                </a>
                            </div>
                            {showBookingHeader && (
                                <BookingHeader location={chooseLocation} selectedDate={selectedDate} />
                            )}
                        </div>
                    </Container>
                </div>
            </div>
            <Container>
                <div className="main-content">
                    <div className="header-top">
                        
                    </div>
                    <div className="main_booking">
                        <div className="booking_data">
                            <div className="accodien">
                                {/* What would you like to do? Accordion */}
                                <div style={{ marginBottom: '30px' }}>
                                    <h3 style={{ fontSize: '22px', textAlign: 'center', marginBottom: '20px' }}>What would you like to do?</h3>
                                    <ChooseActivityCard 
                                        activitySelect={activitySelect} 
                                        setActivitySelect={setActivitySelect} 
                                        onVoucherSubmit={handleVoucherSubmit}
                                        voucherStatus={voucherStatus}
                                    />
                                </div>
                                {/* Diğer section'lar - deaktif görünecek şekilde stil */}
                                <div style={{ opacity: activitySelect === null ? '0.5' : '1', pointerEvents: activitySelect === null ? 'none' : 'auto' }}>
                                    {!(activitySelect === "Flight Voucher" || activitySelect === "Buy Gift") && (
                                        <LocationSection 
                                            isGiftVoucher={isGiftVoucher} 
                                            isFlightVoucher={isFlightVoucher} 
                                            chooseLocation={chooseLocation} 
                                            setChooseLocation={setChooseLocation} 
                                            activeAccordion={activeAccordion} 
                                            setActiveAccordion={handleSetActiveAccordion} 
                                            setActivityId={setActivityId} 
                                            setSelectedActivity={setSelectedActivity}
                                        />
                                    )}
                                    {!(activitySelect === "Redeem Voucher") && (
                                        <ExperienceSection 
                                            isRedeemVoucher={isRedeemVoucher} 
                                            setChooseFlightType={setChooseFlightType} 
                                            addPassenger={addPassenger} 
                                            setAddPassenger={setAddPassenger} 
                                            activeAccordion={activeAccordion} 
                                            setActiveAccordion={handleSetActiveAccordion} 
                                            activityId={activityId} 
                                            setAvailableSeats={setAvailableSeats}
                                            voucherCode={voucherCode}
                                            chooseLocation={chooseLocation}
                                            isFlightVoucher={isFlightVoucher}
                                            isBookFlight={isBookFlight}
                                            isGiftVoucher={isGiftVoucher}
                                        />
                                    )}
                                    {!(activitySelect === "Flight Voucher" || activitySelect === "Redeem Voucher" || activitySelect === "Buy Gift") && (
                                        <LiveAvailabilitySection 
                                            isGiftVoucher={isGiftVoucher} 
                                            isFlightVoucher={isFlightVoucher} 
                                            selectedDate={selectedDate} 
                                            setSelectedDate={setSelectedDate} 
                                            activeAccordion={activeAccordion} 
                                            setActiveAccordion={handleSetActiveAccordion} 
                                            selectedActivity={selectedActivity} 
                                            availableSeats={availableSeats} 
                                            chooseLocation={chooseLocation}
                                        />
                                    )}
                                    {!(activitySelect === "Flight Voucher") && (
                                        <AddOnsSection 
                                            isGiftVoucher={isGiftVoucher} 
                                            isRedeemVoucher={isRedeemVoucher} 
                                            isFlightVoucher={isFlightVoucher} 
                                            chooseAddOn={chooseAddOn} 
                                            setChooseAddOn={setChooseAddOn} 
                                            activeAccordion={activeAccordion} 
                                            setActiveAccordion={handleSetActiveAccordion} 
                                            chooseLocation={chooseLocation} 
                                            chooseFlightType={chooseFlightType} 
                                            activitySelect={activitySelect}
                                        />
                                    )}
                                    {!(activitySelect === "Flight Voucher" || activitySelect === "Buy Gift") && (
                                        <PassengerInfo 
                                            isGiftVoucher={isGiftVoucher} 
                                            isFlightVoucher={isFlightVoucher} 
                                            addPassenger={addPassenger} 
                                            passengerData={passengerData} 
                                            setPassengerData={setPassengerData} 
                                            weatherRefund={weatherRefund} 
                                            setWeatherRefund={setWeatherRefund} 
                                            activeAccordion={activeAccordion} 
                                            setActiveAccordion={handleSetActiveAccordion} 
                                            chooseFlightType={chooseFlightType}
                                            activitySelect={activitySelect}
                                        />
                                    )}
                                    {(activitySelect === "Buy Gift" || activitySelect === "Flight Voucher" || activitySelect === "Book Flight") && (
                                        <AdditionalInfo 
                                            isGiftVoucher={isGiftVoucher} 
                                            isRedeemVoucher={isRedeemVoucher} 
                                            isFlightVoucher={isFlightVoucher} 
                                            isBookFlight={isBookFlight}
                                            additionalInfo={additionalInfo} 
                                            setAdditionalInfo={setAdditionalInfo} 
                                            activeAccordion={activeAccordion} 
                                            setActiveAccordion={handleSetActiveAccordion}
                                            flightType={chooseFlightType.type}
                                        />
                                    )}
                                    {(activitySelect === "Book Flight" || activitySelect === "Flight Voucher" || activitySelect === "Redeem Voucher") && (
                                        <EnterPreferences 
                                            isGiftVoucher={isGiftVoucher} 
                                            isRedeemVoucher={isRedeemVoucher} 
                                            preference={preference} 
                                            setPreference={setPreference} 
                                            activeAccordion={activeAccordion} 
                                            setActiveAccordion={handleSetActiveAccordion}
                                        />
                                    )}
                                    {!(activitySelect === "Book Flight" || activitySelect === "Flight Voucher" || activitySelect === "Redeem Voucher") && (
                                        <EnterRecipientDetails 
                                            isBookFlight={isBookFlight}
                                            isRedeemVoucher={isRedeemVoucher} 
                                            isFlightVoucher={isFlightVoucher} 
                                            recipientDetails={recipientDetails} 
                                            setRecipientDetails={setRecipientDetails} 
                                            activeAccordion={activeAccordion} 
                                            setActiveAccordion={handleSetActiveAccordion}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="booking_info">
                            <RightInfoCard
                                activitySelect={activitySelect}
                                chooseLocation={chooseLocation}
                                chooseFlightType={chooseFlightType}
                                chooseAddOn={chooseAddOn}
                                passengerData={passengerData}
                                additionalInfo={additionalInfo}
                                recipientDetails={recipientDetails}
                                selectedDate={selectedDate}
                                activeAccordion={activeAccordion}
                                setActiveAccordion={setActiveAccordion}
                                isFlightVoucher={isFlightVoucher}
                                isRedeemVoucher={isRedeemVoucher}
                                isGiftVoucher={isGiftVoucher}
                                voucherCode={voucherCode}
                                resetBooking={resetBooking}
                            />
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    )
}

export default Index;
