import { useOrgStore } from '@/stores/orgStore';

/**
 * Convenience hook for accessing organization data and currency.
 *
 * Usage:
 *   const { org, currency } = useOrg();
 *   formatCurrency(amount, currency);  // Always use org currency
 */
export function useOrg() {
  const org = useOrgStore((s) => s.org);
  const currency = useOrgStore((s) => s.currency);
  const setOrg = useOrgStore((s) => s.setOrg);
  const clearOrg = useOrgStore((s) => s.clearOrg);

  return { org, currency, setOrg, clearOrg };
}
