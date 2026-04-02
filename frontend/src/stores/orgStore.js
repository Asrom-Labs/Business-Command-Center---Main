import { create } from 'zustand';

/**
 * Organization store.
 * Holds the current organization's data including its currency.
 * Persisted to localStorage so currency survives page refresh.
 */

const ORG_KEY = 'bcc_org';

function loadOrgFromStorage() {
  try {
    const raw = localStorage.getItem(ORG_KEY);
    if (!raw) return { org: null, currency: 'USD' };
    const org = JSON.parse(raw);
    return { org, currency: org?.currency || 'USD' };
  } catch {
    return { org: null, currency: 'USD' };
  }
}

export const useOrgStore = create((set) => ({
  ...loadOrgFromStorage(),

  setOrg: (org) => {
    try { localStorage.setItem(ORG_KEY, JSON.stringify(org)); } catch { /* ignore */ }
    set({ org, currency: org?.currency || 'USD' });
  },
  clearOrg: () => {
    try { localStorage.removeItem(ORG_KEY); } catch { /* ignore */ }
    set({ org: null, currency: 'USD' });
  },
}));
