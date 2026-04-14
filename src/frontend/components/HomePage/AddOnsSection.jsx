import React, { useState, useEffect, useRef } from "react";
import Accordion from "../Common/Accordion";
import AddOn1 from "../../../assets/images/addOn1.png";
import config from "../../../config";

const AddOnsSection = ({
  isGiftVoucher,
  isRedeemVoucher,
  isFlightVoucher,
  chooseAddOn,
  setChooseAddOn,
  activeAccordion,
  setActiveAccordion,
  chooseLocation,
  chooseFlightType,
  activitySelect,
  flightType,
  isDisabled = false,
  onSectionCompletion,
}) => {
  const [addToBookingItems, setAddToBookingItems] = useState([]);
  const [addToBookingLoading, setAddToBookingLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 576);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Fetch add to booking items from API
  useEffect(() => {
    const fetchAddToBookingItems = async () => {
      try {
        setAddToBookingLoading(true);

        // Add cache busting parameter to prevent browser caching
        const timestamp = Date.now();
        const response = await fetch(
          `${config.API_BASE_URL}/api/add-to-booking-items?t=${timestamp}`,
          {
            method: "GET",
          },
        );

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            // Add additional cache busting to image URLs (normalize URL first to fix multiple ? issues)
            const normalizeImageUrl = (url) => {
              if (!url) return null;
              try {
                // Remove existing query parameters to prevent ?t=...?t=... issues
                const urlObj = new URL(
                  url.startsWith("http")
                    ? url
                    : `${config.API_BASE_URL}${url.startsWith("/") ? url : "/" + url}`,
                );
                // Add cache busting parameter
                urlObj.searchParams.set("cb", timestamp);
                return urlObj.toString();
              } catch (e) {
                // Fallback: simple string manipulation if URL parsing fails
                const baseUrl = url.split("?")[0];
                return `${baseUrl}?cb=${timestamp}`;
              }
            };

            const itemsWithCacheBusting = data.data.map((item) => ({
              ...item,
              image_url: normalizeImageUrl(item.image_url),
            }));

            // Debug: Log experience_types for each item

            data.data.forEach((item, index) => {});

            itemsWithCacheBusting.forEach((item, index) => {});

            setAddToBookingItems(itemsWithCacheBusting);
          } else {
            console.error("API returned success: false:", data);
          }
        } else {
          console.error("API request failed with status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching add to booking items:", error);
      } finally {
        setAddToBookingLoading(false);
      }
    };

    fetchAddToBookingItems();
  }, [activitySelect, chooseLocation, flightType]); // Refetch when journey type, location, or flight type changes

  // Get filtered API items based on journey type, location, and experience type
  const getFilteredItems = () => {
    // Determine current journey type based on user selections
    let currentJourneyType = "Book Flight"; // Default

    if (activitySelect === "Flight Voucher") {
      currentJourneyType = "Flight Voucher";
    } else if (activitySelect === "Redeem Voucher") {
      currentJourneyType = "Redeem Voucher";
    } else if (activitySelect === "Buy Gift") {
      currentJourneyType = "Buy Gift";
    }

    // Filter API items by journey type, location, and experience type
    const apiItems = addToBookingItems
      .filter((item) => {
        // Check if item is active
        if (!item.is_active) {
          return false;
        }

        // Check journey types
        let journeyTypeMatch = false;
        if (item.journey_types) {
          try {
            let journeyTypes = [];
            if (Array.isArray(item.journey_types)) {
              journeyTypes = item.journey_types;
            } else if (typeof item.journey_types === "string") {
              try {
                journeyTypes = JSON.parse(item.journey_types);
              } catch (parseError) {
                // If JSON parsing fails, try to split by comma
                if (item.journey_types.includes(",")) {
                  journeyTypes = item.journey_types
                    .split(",")
                    .map((type) => type.trim());
                } else {
                  journeyTypes = [item.journey_types.trim()];
                }
              }
            }

            // Ensure journeyTypes is always an array
            if (!Array.isArray(journeyTypes)) {
              journeyTypes = [journeyTypes];
            }

            journeyTypeMatch = journeyTypes.includes(currentJourneyType);
          } catch (error) {
            console.warn(
              `❌ Error parsing journey_types for item "${item.title}":`,
              error,
            );
            return false;
          }
        } else {
          return false;
        }

        // If journey type doesn't match, don't show the item
        if (!journeyTypeMatch) {
          return false;
        }

        // Check locations
        let locationMatch = false;
        if (item.locations && chooseLocation) {
          try {
            let locations = [];
            if (Array.isArray(item.locations)) {
              locations = item.locations;
            } else if (typeof item.locations === "string") {
              try {
                locations = JSON.parse(item.locations);
              } catch (parseError) {
                // If JSON parsing fails, try to split by comma
                if (item.locations.includes(",")) {
                  locations = item.locations
                    .split(",")
                    .map((loc) => loc.trim());
                } else {
                  locations = [item.locations.trim()];
                }
              }
            }

            // Ensure locations is always an array
            if (!Array.isArray(locations)) {
              locations = [locations];
            }

            locationMatch = locations.includes(chooseLocation);
          } catch (error) {
            console.warn(
              `❌ Error parsing locations for item "${item.title}":`,
              error,
            );
            locationMatch = false;
          }
        } else if (!item.locations) {
          // If no locations specified, assume it applies to all locations
          locationMatch = true;
        } else if (!chooseLocation) {
          // If no location is selected, show all items
          locationMatch = true;
        }

        // Check experience types
        let experienceTypeMatch = false;
        if (item.experience_types && flightType) {
          try {
            let experienceTypes = [];
            if (Array.isArray(item.experience_types)) {
              experienceTypes = item.experience_types;
            } else if (typeof item.experience_types === "string") {
              try {
                experienceTypes = JSON.parse(item.experience_types);
              } catch (parseError) {
                // If JSON parsing fails, try to split by comma
                if (item.experience_types.includes(",")) {
                  experienceTypes = item.experience_types
                    .split(",")
                    .map((exp) => exp.trim());
                } else {
                  experienceTypes = [item.experience_types.trim()];
                }
              }
            }

            // Ensure experienceTypes is always an array
            if (!Array.isArray(experienceTypes)) {
              experienceTypes = [experienceTypes];
            }

            // Map flight type to experience type
            let mappedFlightType = "";
            if (flightType && typeof flightType === "string") {
              if (flightType.toLowerCase().includes("shared")) {
                mappedFlightType = "Shared Flight";
              } else if (flightType.toLowerCase().includes("private")) {
                mappedFlightType = "Private Charter";
              }
            }

            // If we have a mapped flight type, check if it's in the experience types
            if (mappedFlightType) {
              experienceTypeMatch = experienceTypes.includes(mappedFlightType);
            } else {
              // If no flight type is selected or can't be mapped, show all items
              experienceTypeMatch = true;
            }
          } catch (error) {
            console.warn(
              `❌ Error parsing experience_types for item "${item.title}":`,
              error,
            );
            experienceTypeMatch = false;
          }
        } else if (!item.experience_types) {
          // If no experience types specified, assume it applies to all experience types
          experienceTypeMatch = true;
        } else if (!flightType) {
          // If no flight type is selected, show all items
          experienceTypeMatch = true;
        }

        // All three conditions must be met
        const finalMatch =
          journeyTypeMatch && locationMatch && experienceTypeMatch;

        if (finalMatch) {
        } else {
        }

        return finalMatch;
      })
      .map((item) => ({
        name: item.title,
        price: item.price.toString(),
        image: item.image_url
          ? item.image_url.startsWith("http")
            ? item.image_url
            : `${config.API_BASE_URL}${item.image_url}`
          : AddOn1,
        description: item.description,
        category: item.category,
        isPhysicalItem: item.is_physical_item,
        priceUnit: item.price_unit,
      }));

    return apiItems;
  };

  const filteredItems = getFilteredItems();

  // Handle checkbox toggle when div is clicked
  function handleAddOnChange(name, price) {
    setChooseAddOn((prev) => {
      prev = Array.isArray(prev) ? prev : []; // Ensure prev is always an array
      const exists = prev.some((addOn) => addOn.name === name);
      const newChooseAddOn = exists
        ? prev.filter((addOn) => addOn.name !== name)
        : [...prev, { name, price }];

      return newChooseAddOn;
    });
  }

  // Auto-trigger section completion when at least one add-on is selected
  const completionFiredRef = useRef(false);
  useEffect(() => {
    if (!onSectionCompletion) return;

    // Check if at least one add-on is selected
    const hasAddOns = Array.isArray(chooseAddOn) && chooseAddOn.length > 0;

    if (hasAddOns && !completionFiredRef.current) {
      completionFiredRef.current = true;

      onSectionCompletion("add-on");
    }
    if (!hasAddOns) {
      completionFiredRef.current = false;
    }
  }, [chooseAddOn, onSectionCompletion]);

  // Debug section visibility logic

  // Always render the section so users can open it and see there are no items

  return (
    <div style={{ marginBottom: isMobile ? "140px" : "100px" }}>
      <Accordion
        title="Add To Booking"
        id="add-on"
        activeAccordion={activeAccordion}
        setActiveAccordion={setActiveAccordion}
        isDisabled={isDisabled}
      >
        <div
          className="tab_box add-on-card scroll-box vouch"
          style={{ paddingBottom: isMobile ? "140px" : "100px" }}
        >
          {addToBookingLoading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p>Loading add to booking items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "20px", color: "#666" }}
            >
              <p>
                No items available for the selected journey type, location, and
                flight type.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected =
                Array.isArray(chooseAddOn) &&
                chooseAddOn.some((addOn) => addOn.name === item.name);
              return (
                <div
                  className={`loc_data ${isSelected ? "active-add-on-wrap" : ""}`}
                  key={index}
                  onClick={() => handleAddOnChange(item.name, item.price)}
                  style={{
                    display: isMobile ? "grid" : "flex",
                    gridTemplateColumns: isMobile ? "72px 1fr" : undefined,
                    gridTemplateRows: isMobile ? "auto auto" : undefined,
                    columnGap: isMobile ? "12px" : undefined,
                    flexDirection: isMobile ? undefined : "row",
                    padding: isMobile ? "16px 14px" : "15px",
                    gap: isMobile ? undefined : "20px",
                    alignItems: isMobile ? "start" : "center",
                    overflow: "visible",
                    position: "relative",
                  }}
                >
                  {isMobile ? (
                    <>
                      {/* Image */}
                      <div
                        style={{
                          gridColumn: "1 / 2",
                          gridRow: "1",
                          width: 72,
                          height: 72,
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: "72px",
                            height: "72px",
                            objectFit: "cover",
                            borderRadius: "12px",
                            border: "2px solid #e5e7eb",
                          }}
                          loading="lazy"
                          onError={(e) => {
                            // Hide image on error (blocked, 404, etc.) to prevent loading delays
                            e.target.style.display = "none";
                          }}
                          onLoad={(e) => {
                            // Clear any timeout on successful load
                            if (e.target.dataset.timeoutId) {
                              clearTimeout(
                                parseInt(e.target.dataset.timeoutId),
                              );
                              delete e.target.dataset.timeoutId;
                            }
                          }}
                          onLoadStart={(e) => {
                            // Set timeout to hide image if it takes too long (5 seconds)
                            const timeoutId = setTimeout(() => {
                              e.target.style.display = "none";
                            }, 5000);
                            e.target.dataset.timeoutId = timeoutId.toString();
                          }}
                        />
                      </div>
                      {/* Title + Price (mobile only) */}
                      <div
                        className="vouch-text"
                        style={{
                          gridColumn: "2 / 3",
                          gridRow: "1",
                          minWidth: 0,
                        }}
                      >
                        <div
                          className="vouch-header"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                            width: "100%",
                          }}
                        >
                          <p
                            className="vouch-title"
                            style={{
                              margin: 0,
                              fontWeight: 700,
                              color: "#1f2937",
                              fontSize: "15px",
                              lineHeight: "1.3",
                              flex: 1,
                              minWidth: 0,
                              whiteSpace: "normal",
                            }}
                          >
                            {item.name}
                          </p>
                          <p
                            className="vouch-price"
                            style={{
                              margin: 0,
                              whiteSpace: "nowrap",
                              fontWeight: 800,
                              color: "#059669",
                              fontSize: "16px",
                              flexShrink: 0,
                            }}
                          >
                            £{item.price}
                          </p>
                        </div>
                      </div>
                      {/* Description full width under header (mobile only) */}
                      {item.description && (
                        <div
                          className="vouch-desc-wrap"
                          style={{ gridColumn: "1 / -1", gridRow: "2" }}
                        >
                          <p
                            className="vouch-desc"
                            style={{
                              fontSize: "14px",
                              color: "#374151",
                              margin: 0,
                              lineHeight: "1.5",
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                            }}
                          >
                            {item.description}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: "120px",
                            height: "120px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                            flexShrink: 0,
                          }}
                          loading="lazy"
                          onError={(e) => {
                            // Hide image on error (blocked, 404, etc.) to prevent loading delays
                            e.target.style.display = "none";
                          }}
                          onLoad={(e) => {
                            // Clear any timeout on successful load
                            if (e.target.dataset.timeoutId) {
                              clearTimeout(
                                parseInt(e.target.dataset.timeoutId),
                              );
                              delete e.target.dataset.timeoutId;
                            }
                          }}
                          onLoadStart={(e) => {
                            // Set timeout to hide image if it takes too long (5 seconds)
                            const timeoutId = setTimeout(() => {
                              e.target.style.display = "none";
                            }, 5000);
                            e.target.dataset.timeoutId = timeoutId.toString();
                          }}
                        />
                      </div>
                      <div
                        className="vouch-text"
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "0",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          className="vouch-header"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "15px",
                            marginBottom: "8px",
                            width: "100%",
                          }}
                        >
                          <p
                            className="vouch-title"
                            style={{
                              margin: 0,
                              fontWeight: 700,
                              color: "#333",
                              fontSize: "14px",
                              lineHeight: "1.4",
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {item.name}
                          </p>
                          <p
                            className="vouch-price"
                            style={{
                              margin: 0,
                              whiteSpace: "nowrap",
                              fontWeight: 500,
                              color: "#222",
                              fontSize: "14px",
                              flexShrink: 0,
                            }}
                          >
                            £{item.price}
                          </p>
                        </div>
                        {item.description && (
                          <div>
                            <p
                              className="vouch-desc"
                              style={{
                                fontSize: "12px",
                                color: "#666",
                                margin: 0,
                                lineHeight: "1.3",
                              }}
                            >
                              {item.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <span
                    className={`add-on-input ${isSelected ? "active-add-on" : ""}`}
                    style={{
                      position: "absolute",
                      right: isMobile ? "12px" : "15px",
                      top: isMobile ? "12px" : "15px",
                      width: isMobile ? "24px" : "20px",
                      height: isMobile ? "24px" : "20px",
                      border: `2px solid ${isSelected ? "#74da78" : "gray"}`,
                      borderRadius: "50%",
                      background: isSelected ? "#74da78" : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isSelected && (
                      <span
                        style={{
                          color: "white",
                          fontSize: isMobile ? "14px" : "12px",
                          fontWeight: "bold",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </Accordion>
    </div>
  );
};

export default AddOnsSection;
