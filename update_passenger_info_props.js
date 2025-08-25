// Script to update PassengerInfo components in Index.jsx
// Add selectedVoucherType={selectedVoucherType} to all PassengerInfo components

// Find these lines in Index.jsx and add the prop:

// Line ~750 (First PassengerInfo - Book Flight section):
// Add after title prop:
selectedVoucherType={selectedVoucherType}

// Line ~825 (Second PassengerInfo - Redeem Voucher section):
// Add after title prop:
selectedVoucherType={selectedVoucherType}

// Line ~890 (Third PassengerInfo - Buy Gift section):
// Add after title prop:
selectedVoucherType={selectedVoucherType}

// The updated PassengerInfo calls should look like:
/*
<PassengerInfo
    isGiftVoucher={isGiftVoucher}
    isFlightVoucher={isFlightVoucher}
    passengerData={passengerData}
    setPassengerData={setPassengerData}
    activeAccordion={activeAccordion}
    setActiveAccordion={handleSetActiveAccordion}
    chooseFlightType={chooseFlightType}
    addPassenger={addPassenger}
    setAddPassenger={setAddPassenger}
    chooseLocation={chooseLocation}
    activitySelect={activitySelect}
    title={activitySelect === 'Buy Gift' ? 'Purchaser Information' : 'Passenger Information'}
    selectedVoucherType={selectedVoucherType}  // <- Add this line
/>
*/ 