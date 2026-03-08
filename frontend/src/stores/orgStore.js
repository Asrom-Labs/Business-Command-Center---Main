import { create } from 'zustand';

/**
 * Organization store.
 * Holds the current organization's data including its currency.
 * Currency is used by formatCurrency() throughout the app.
 */
export const useOrgStore = create((set) => ({
  org: null,
  currency: 'USD', // Default, overwritten after org is loaded

  setOrg: (org) => set({ org, currency: org?.currency || 'USD' }),
  clearOrg: () => set({ org: null, currency: 'USD' }),
}));
