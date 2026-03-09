export const MAIN_SITE_URL = 'https://flyawayballooning.com/';

const LOCAL_STORAGE_KEYS_TO_CLEAR = ['fab_user_session_id'];
const SESSION_STORAGE_KEYS_TO_CLEAR = ['fab_ga_tracked', 'fab_user_session_id'];
const LOCAL_STORAGE_PREFIXES_TO_CLEAR = ['fab_payment_processed_'];

function clearPrefixedKeys(storage, prefixes) {
  for (let i = storage.length - 1; i >= 0; i -= 1) {
    const key = storage.key(i);
    if (!key) continue;
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      storage.removeItem(key);
    }
  }
}

export function clearBookingClientStorage() {
  if (typeof window === 'undefined') return;

  try {
    LOCAL_STORAGE_KEYS_TO_CLEAR.forEach((key) => localStorage.removeItem(key));
    SESSION_STORAGE_KEYS_TO_CLEAR.forEach((key) => sessionStorage.removeItem(key));
    clearPrefixedKeys(localStorage, LOCAL_STORAGE_PREFIXES_TO_CLEAR);
  } catch (error) {
    console.warn('Failed to clear booking client storage:', error);
  }
}

export function navigateToMainSite({ clearBookingStorage = false } = {}) {
  if (typeof window === 'undefined') return;

  if (clearBookingStorage) {
    clearBookingClientStorage();
  }

  window.location.assign(MAIN_SITE_URL);
}
