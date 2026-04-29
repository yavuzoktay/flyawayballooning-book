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

const ManualBookingContactStep = ({
    details,
    onChange,
    isMobile = false,
    title = "Hotel / Staff Details",
    description = "Complete these required details before continuing with the booking flow.",
    fields = [
        {
            name: "accommodationName",
            label: "Hotel / Accommodation Name",
            type: "text",
            placeholder: "Enter hotel or accommodation name",
            required: true
        },
        {
            name: "email",
            label: "Email Address",
            type: "email",
            placeholder: "Enter contact email",
            required: true
        },
        {
            name: "staffName",
            label: "Staff Name",
            type: "text",
            placeholder: "Enter staff member name",
            required: true
        }
    ]
}) => {
    const visibleFields = Array.isArray(fields) && fields.length > 0 ? fields : [];
    const isComplete = visibleFields.every((field) => {
        const value = (details?.[field.name] || "").trim();
        if (!field.required && !value) return true;
        if (!value) return false;
        if (field.type === "email") return emailPattern.test(value);
        return true;
    });

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
                        {title}
                    </h3>
                    {description ? (
                        <p style={{ margin: "6px 0 0", color: "#5f6f86", fontSize: "14px", lineHeight: 1.5 }}>
                            {description}
                        </p>
                    ) : null}
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
                    gridTemplateColumns: isMobile
                        ? "1fr"
                        : `repeat(${Math.min(visibleFields.length || 1, 3)}, minmax(0, 1fr))`,
                    gap: "14px"
                }}
            >
                {visibleFields.map((field) => {
                    const value = details?.[field.name] || "";
                    const emailInvalid =
                        field.type === "email" &&
                        value &&
                        !emailPattern.test(value.trim());
                    const isSelectField = field.type === "select" || Array.isArray(field.options);
                    const options = Array.isArray(field.options) ? field.options : [];
                    const normalizedOptions = options.map((option) => {
                        if (option && typeof option === "object") {
                            return {
                                value: option.value ?? option.label ?? "",
                                label: option.label ?? option.value ?? ""
                            };
                        }

                        return {
                            value: option,
                            label: option
                        };
                    });

                    return (
                        <label key={field.name} style={labelStyle}>
                            {field.label}
                            {field.required ? " *" : ""}
                            {isSelectField ? (
                                <select
                                    value={value}
                                    onChange={handleFieldChange(field.name)}
                                    style={{
                                        ...fieldStyle,
                                        color: value ? "#111827" : "#8a94a6",
                                        cursor: "pointer"
                                    }}
                                >
                                    <option value="" disabled>
                                        {field.placeholder || "Please select"}
                                    </option>
                                    {normalizedOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type || "text"}
                                    value={value}
                                    onChange={handleFieldChange(field.name)}
                                    placeholder={field.placeholder || ""}
                                    style={{
                                        ...fieldStyle,
                                        borderColor: emailInvalid ? "#fda4af" : fieldStyle.border
                                    }}
                                />
                            )}
                            {emailInvalid && (
                                <span style={{ color: "#be123c", fontSize: "12px", fontWeight: 500 }}>
                                    Enter a valid email address.
                                </span>
                            )}
                        </label>
                    );
                })}
            </div>
        </section>
    );
};

export default ManualBookingContactStep;
