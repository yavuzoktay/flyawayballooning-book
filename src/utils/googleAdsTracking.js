/**
 * Google Ads Full-Funnel Conversion Tracking
 * 
 * Implements micro-conversions and purchase tracking per the Full-Funnel Conversion Tracking Brief.
 * All events are deduplicated (fired once per session step) and passed to Google Ads via gtag.
 * 
 * Primary conversions (GA_Purchase_Completed) are handled server-side via Stripe webhook.
 * Micro-conversions are client-side only - for funnel visibility and smart bidding signals.
 */

const SESSION_STORAGE_KEY = 'fab_ga_tracked';
const GOOGLE_ADS_ID = 'AW-17848519089';

// Conversion labels for gtag('event', 'conversion', { send_to: 'AW-XXX/Label' })
// Get from Google Ads: Goals > Conversions > [action] > See event snippet
const CONVERSION_LABELS = {
  GA_Flight_Purchase_Shared: 'FREdCK2p-PAbEOeUzd8B', // e.g. 'AbCdEfGhIjK123456'
  GA_Flight_Purchase_Private: 'CTrmCIKV7PAbEOeUzd8B',
  GA_Voucher_Purchase_Shared: 'nnRxCImN7fAbEOeUzd8B',
  GA_Voucher_Purchase_Private: 'v6dECIai7PAbEOeUzd8B'
};
const GCLID_STORAGE_KEY = 'fab_gclid';
const GCLID_EXPIRY_DAYS = 30;

/**
 * Get tracked events for this session (for deduplication)
 */
function getTrackedEvents() {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Mark event as tracked (deduplication - fire once per session step)
 */
function markEventTracked(eventKey) {
  try {
    const tracked = getTrackedEvents();
    tracked[eventKey] = true;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(tracked));
  } catch (e) {
    console.warn('[GA] Failed to mark event tracked:', e);
  }
}

/**
 * Check if event was already fired this session
 */
function wasEventTracked(eventKey) {
  return !!getTrackedEvents()[eventKey];
}

/**
 * Capture gclid, wbraid, gbraid from URL and store for Stripe checkout
 */
export function captureGoogleAdsIds() {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const gclid = params.get('gclid');
    const wbraid = params.get('wbraid');
    const gbraid = params.get('gbraid');
    if (gclid || wbraid || gbraid) {
      const payload = {
        gclid: gclid || null,
        wbraid: wbraid || null,
        gbraid: gbraid || null,
        capturedAt: Date.now()
      };
      localStorage.setItem(GCLID_STORAGE_KEY, JSON.stringify(payload));
      return payload;
    }
  } catch (e) {
    console.warn('[GA] Failed to capture Google Ads IDs:', e);
  }
  return null;
}

/**
 * Get stored Google Ads IDs for Stripe checkout (userSessionData)
 */
export function getGoogleAdsIdsForCheckout() {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(GCLID_STORAGE_KEY);
    if (!stored) return {};
    const payload = JSON.parse(stored);
    const age = Date.now() - (payload.capturedAt || 0);
    const maxAge = GCLID_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (age > maxAge) {
      localStorage.removeItem(GCLID_STORAGE_KEY);
      return {};
    }
    return {
      gclid: payload.gclid || null,
      wbraid: payload.wbraid || null,
      gbraid: payload.gbraid || null
    };
  } catch {
    return {};
  }
}

/**
 * Fire event via gtag (Google Ads / GA4)
 */
function fireGtagEvent(eventName, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', eventName, {
      ...params,
      event_category: 'conversion'
    });
  } catch (e) {
    console.warn('[GA] Failed to fire gtag event:', e);
  }
}

/**
 * Stage 1: GA_Funnel_Start
 * Triggered when user selects: Book a flight date | Buy a gift voucher | Buy a flight voucher
 * @param {string} funnelType - 'booking' | 'gift' | 'voucher'
 */
export function trackFunnelStart(funnelType) {
  const key = `GA_Funnel_Start_${funnelType}`;
  if (wasEventTracked(key)) return;
  fireGtagEvent('GA_Funnel_Start', { funnel_type: funnelType });
  markEventTracked(key);
}

/**
 * Stage 2: GA_Location_Selected
 * Triggered when user selects: Bath | Somerset | Devon
 * @param {string} location - Bath | Somerset | Devon
 */
export function trackLocationSelected(location) {
  const key = `GA_Location_Selected_${location}`;
  if (wasEventTracked(key)) return;
  fireGtagEvent('GA_Location_Selected', { location });
  markEventTracked(key);
}

/**
 * Stage 3: GA_Experience_Selected
 * Triggered when user selects: Shared flight | Private flight
 * @param {string} experienceType - 'shared' | 'private'
 */
export function trackExperienceSelected(experienceType) {
  const key = `GA_Experience_Selected_${experienceType}`;
  if (wasEventTracked(key)) return;
  fireGtagEvent('GA_Experience_Selected', { experience_type: experienceType });
  markEventTracked(key);
}

/**
 * Stage 4: GA_Product_Selected
 * Triggered when a specific product is chosen
 * @param {string} productType - e.g. 'Anyday', 'Flexible weekday', 'Weekday morning', 'Private charter', 'Proposal flight'
 * @param {string|number} pricePoint - e.g. '220', '200', '180'
 */
export function trackProductSelected(productType, pricePoint) {
  const key = `GA_Product_Selected_${productType}_${pricePoint}`;
  if (wasEventTracked(key)) return;
  fireGtagEvent('GA_Product_Selected', {
    product_type: productType,
    price_point: String(pricePoint)
  });
  markEventTracked(key);
}

/**
 * Stage 5: GA_Date_Selected (BOOK FLIGHT DATE FLOW ONLY)
 * Triggered when a live flight date is selected from availability
 * @param {string} date - YYYY-MM-DD
 * @param {string} location
 * @param {string} experienceType - 'shared' | 'private'
 */
export function trackDateSelected(date, location, experienceType) {
  const key = `GA_Date_Selected_${date}_${location}_${experienceType}`;
  if (wasEventTracked(key)) return;
  fireGtagEvent('GA_Date_Selected', {
    date,
    location,
    experience_type: experienceType
  });
  markEventTracked(key);
}

/**
 * Stage 6: GA_Checkout_Started
 * Triggered when user begins entering passenger/purchaser information
 * Do NOT wait for form completion - trigger on form interaction start
 * @param {string} flowType - 'passenger' | 'purchaser' (gift flow)
 */
export function trackCheckoutStarted(flowType = 'passenger') {
  const key = `GA_Checkout_Started_${flowType}`;
  if (wasEventTracked(key)) return;
  fireGtagEvent('GA_Checkout_Started', { flow_type: flowType });
  markEventTracked(key);
}

/**
 * Map funnel_type + experience_type to Google Ads conversion action name
 */
function getConversionActionName(funnelType, experienceType) {
  const isFlight = funnelType === 'booking';
  const isVoucher = funnelType === 'voucher' || funnelType === 'gift';
  const isShared = experienceType === 'shared';
  const isPrivate = experienceType === 'private';
  if (isFlight && isShared) return 'GA_Flight_Purchase_Shared';
  if (isFlight && isPrivate) return 'GA_Flight_Purchase_Private';
  if (isVoucher && isShared) return 'GA_Voucher_Purchase_Shared';
  if (isVoucher && isPrivate) return 'GA_Voucher_Purchase_Private';
  return 'GA_Flight_Purchase_Shared'; // fallback
}

/**
 * GA_Purchase_Completed - Client-side (success page)
 * Primary conversion - also sent server-side via Stripe webhook
 * Fires gtag('event', 'conversion', { send_to: '...' }) so Tag Assistant can detect it
 * @param {Object} params
 */
export function trackPurchaseCompleted(params) {
  const { transaction_id, value, currency, funnel_type, experience_type, product_type } = params;
  const key = `GA_Purchase_Completed_${transaction_id}`;
  if (wasEventTracked(key)) return;

  const funnel = funnel_type || 'booking';
  const experience = experience_type || 'shared';
  const actionName = getConversionActionName(funnel, experience);
  const label = CONVERSION_LABELS[actionName];

  // 1. Fire gtag conversion event (required for Tag Assistant / Google Ads detection)
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && label) {
    try {
      window.gtag('event', 'conversion', {
        send_to: `${GOOGLE_ADS_ID}/${label}`,
        transaction_id: transaction_id || '',
        value: Number(value) || 0,
        currency: (currency || 'GBP').toUpperCase()
      });
    } catch (e) {
      console.warn('[GA] Failed to fire gtag conversion:', e);
    }
  }

  // 2. Fire GA_Purchase_Completed custom event (for GA4 import / analytics)
  fireGtagEvent('GA_Purchase_Completed', {
    transaction_id,
    value: Number(value),
    currency: currency || 'GBP',
    funnel_type: funnel,
    experience_type: experience,
    product_type: product_type || ''
  });
  markEventTracked(key);
}

/**
 * Map activitySelect to funnel_type for GA_Funnel_Start
 */
export function activityToFunnelType(activitySelect) {
  if (activitySelect === 'Book Flight') return 'booking';
  if (activitySelect === 'Buy Gift') return 'gift';
  if (activitySelect === 'Flight Voucher') return 'voucher';
  return null;
}

/**
 * Map chooseFlightType to experience_type
 */
export function flightTypeToExperienceType(chooseFlightType) {
  const type = chooseFlightType?.type || '';
  if (type.toLowerCase().includes('shared')) return 'shared';
  if (type.toLowerCase().includes('private')) return 'private';
  return 'shared';
}
