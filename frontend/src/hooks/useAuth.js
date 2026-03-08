import { useAuthStore } from '@/stores/authStore';

/**
 * Convenience hook for auth state.
 * All values are derived reactively from the Zustand store.
 * Components re-render automatically when token or user changes.
 *
 * Usage:
 *   const { user, isAuthenticated, hasRole } = useAuth();
 */
export function useAuth() {
  const token    = useAuthStore((s) => s.token);
  const user     = useAuthStore((s) => s.user);
  const login    = useAuthStore((s) => s.login);
  const logout   = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  const hasRole  = useAuthStore((s) => s.hasRole);

  return {
    isAuthenticated: !!token,
    token,
    user,
    login,
    logout,
    updateUser,
    hasRole,
    // Convenience boolean helpers derived from user.role
    isOwner: user?.role === 'owner',
    isAdmin: user?.role === 'admin' || user?.role === 'owner',
    isStaff: ['staff', 'admin', 'owner'].includes(user?.role),
  };
}
