import { QueryClient } from '@tanstack/react-query';

/**
 * Global TanStack Query client.
 * Controls caching, retry behavior, and stale times app-wide.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cache is kept for 10 minutes after component unmounts
      gcTime: 1000 * 60 * 10,
      // Do not retry on auth/permission/not-found errors
      retry: (failureCount, error) => {
        const status = error?.status ?? error?.response?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
      // Do not refetch just because the user switched browser tabs
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
