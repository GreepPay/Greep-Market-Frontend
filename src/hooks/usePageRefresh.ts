import { useEffect, useRef } from 'react';
import { useRefresh } from '../context/RefreshContext';
import { useAuth } from '../context/AuthContext';

interface UsePageRefreshOptions {
  refreshOnMount?: boolean;
  refreshOnFocus?: boolean;
  refreshInterval?: number; // Auto-refresh interval in ms
  refreshOnVisibilityChange?: boolean;
  refreshFunction?: () => Promise<void>; // Custom refresh function
  silent?: boolean;
}

export function usePageRefresh(options: UsePageRefreshOptions = {}) {
  const {
    refreshOnMount = false, // Changed default to false to prevent excessive refreshing
    refreshOnFocus = false, // Changed default to false
    refreshInterval,
    refreshOnVisibilityChange = false, // Changed default to false
    refreshFunction,
    silent = true
  } = options;

  const { refreshAll } = useRefresh();
  const { isAuthenticated } = useAuth();
  const lastRefreshRef = useRef<number>(0);
  const refreshCooldown = 5000; // 5 second cooldown between refreshes

  const throttledRefresh = async () => {
    const now = Date.now();
    if (now - lastRefreshRef.current < refreshCooldown) {
      return;
    }
    lastRefreshRef.current = now;
    
    if (refreshFunction) {
      await refreshFunction();
    } else {
      refreshAll();
    }
  };

  // Refresh on mount (only if authenticated)
  useEffect(() => {
    if (refreshOnMount && isAuthenticated) {
      throttledRefresh();
    }
  }, [refreshOnMount, isAuthenticated]);

  // Refresh on window focus (throttled)
  useEffect(() => {
    if (!refreshOnFocus || !isAuthenticated) return;

    const handleFocus = () => {
      throttledRefresh();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshOnFocus, isAuthenticated]);

  // Refresh on visibility change (throttled)
  useEffect(() => {
    if (!refreshOnVisibilityChange || !isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        throttledRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshOnVisibilityChange, isAuthenticated]);

  // Periodic auto-refresh (only if authenticated and interval is set)
  useEffect(() => {
    if (!refreshInterval || !isAuthenticated) return;

    const interval = setInterval(() => {
      throttledRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, isAuthenticated]);
}

