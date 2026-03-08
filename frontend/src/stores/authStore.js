import { create } from 'zustand';

/**
 * BCC Authentication Store
 *
 * Persists the JWT token and user profile to localStorage.
 * localStorage keys:
 *   'bcc_token' — the JWT string
 *   'bcc_user'  — JSON-stringified user object
 *
 * isAuthenticated is DERIVED from !!token in consuming components.
 * Components read from this store reactively — localStorage is only
 * used for persistence across page refreshes, not for reactive reads.
 */

const TOKEN_KEY = 'bcc_token';
const USER_KEY  = 'bcc_user';

/** Safely read and parse the user from localStorage. */
function loadFromStorage() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw   = localStorage.getItem(USER_KEY);
    const user  = raw ? JSON.parse(raw) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export const useAuthStore = create((set, get) => ({
  ...loadFromStorage(),

  /**
   * Called after successful login.
   * token: JWT string (top-level field in the API response)
   * user:  { id, name, email, role, organization_id } (response.data.user)
   */
  login: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },

  /**
   * Clears all auth state and localStorage.
   * Triggers redirect to /login via the auth guard in AppLayout.
   */
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },

  /** Update stored user profile (e.g. after name change). */
  updateUser: (updates) => {
    const updated = { ...get().user, ...updates };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    set({ user: updated });
  },

  /** Returns true if the user has at least the required role level. */
  hasRole: (requiredRole) => {
    const ROLE_HIERARCHY = { readonly: 0, staff: 1, admin: 2, owner: 3 };
    const userRole = get().user?.role;
    return (ROLE_HIERARCHY[userRole] ?? -1) >= (ROLE_HIERARCHY[requiredRole] ?? 999);
  },
}));
