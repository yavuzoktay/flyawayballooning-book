import React from "react";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d6dfeb",
    background: "#fff",
    fontSize: "14px",
    boxSizing: "border-box"
};

const labelStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#4b5c75"
};

const ManualBookingContactStep = ({ details, onChange, isMobile = false }) => {
    const accommodationName = details?.accommodationName || "";
    const email = details?.email || "";
    const staffName = details?.staffName || "";
    const emailValid = emailPattern.test(email.trim());
    const isComplete = accommodationName.trim() && staffName.trim() && emailValid;

    const handleFieldChange = (field) => (event) => {
        if (!onChange) return;
        onChange((prev) => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    return (
        <section
            style={{
                marginBottom: isMobile ? "18px" : "26px",
                padding: isMobile ? "18px 16px" : "22px 24px",
                borderRadius: "18px",
                border: isComplete ? "1px solid #86efac" : "1px solid #d8e4f2",
                background: isComplete ? "#f0fdf4" : "#f8fbff",
                boxShadow: "0 10px 24px rgba(26, 66, 122, 0.08)"
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: isMobile ? "flex-start" : "center",
                    gap: "12px",
                    marginBottom: "16px",
                    flexDirection: isMobile ? "column" : "row"
                }}
            >
                <div>
                    <h3 style={{ margin: 0, fontSize: isMobile ? "20px" : "22px", color: "#16345c" }}>
                        Hotel / Staff Details
                    </h3>
                    <p style={{ margin: "6px 0 0", color: "#5f6f86", fontSize: "14px", lineHeight: 1.5 }}>
                        Complete these required details before continuing with the booking flow.
                    </p>
                </div>
                <div
                    style={{
                        alignSelf: isMobile ? "stretch" : "flex-start",
                        padding: "8px 12px",
                        borderRadius: "999px",
                        background: isComplete ? "#dcfce7" : "#e8eef8",
                        color: isComplete ? "#166534" : "#33547d",
                        fontSize: "12px",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase"
                    }}
                >
                    {isComplete ? "Completed" : "Required"}
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
                    gap: "14px"
                }}
            >
                <label style={labelStyle}>
                    Hotel / Accommodation Name *
                    <input
                        type="text"
                        value={accommodationName}
                        onChange={handleFieldChange("accommodationName")}
                        placeholder="Enter hotel or accommodation name"
                        style={fieldStyle}
                    />
                </label>

                <label style={labelStyle}>
                    Email Address *
                    <input
                        type="email"
                        value={email}
                        onChange={handleFieldChange("email")}
                        placeholder="Enter contact email"
                        style={{
                            ...fieldStyle,
                            borderColor: email && !emailValid ? "#fda4af" : fieldStyle.border
                        }}
                    />
                    {email && !emailValid && (
                        <span style={{ color: "#be123c", fontSize: "12px", fontWeight: 500 }}>
                            Enter a valid email address.
                        </span>
                    )}
                </label>

                <label style={labelStyle}>
                    Staff Name *
                    <input
                        type="text"
                        value={staffName}
                        onChange={handleFieldChange("staffName")}
                        placeholder="Enter staff member name"
                        style={fieldStyle}
                    />
                </label>
            </div>
        </section>
    );
};

export default ManualBookingContactStep;
