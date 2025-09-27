import React, { ComponentType, useEffect } from 'react';
import { useRefresh } from '../context/RefreshContext';

interface WithAutoRefreshOptions {
  refreshInterval?: number; // Auto-refresh interval in ms
  refreshOnMount?: boolean;
  refreshOnFocus?: boolean;
  refreshOnVisibilityChange?: boolean;
  silent?: boolean;
}

export function withAutoRefresh<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAutoRefreshOptions = {}
) {
  const {
    refreshInterval,
    refreshOnMount = false,
    refreshOnFocus = false,
    refreshOnVisibilityChange = false,
    silent = true
  } = options;

  return function WithAutoRefreshComponent(props: P) {
    const { refreshAll } = useRefresh();

    // Auto-refresh on mount
    useEffect(() => {
      if (refreshOnMount) {
        refreshAll();
      }
    }, [refreshOnMount, refreshAll]);

    // Auto-refresh on window focus
    useEffect(() => {
      if (!refreshOnFocus) return;

      const handleFocus = () => {
        refreshAll();
      };

      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }, [refreshOnFocus, refreshAll]);

    // Auto-refresh on visibility change
    useEffect(() => {
      if (!refreshOnVisibilityChange) return;

      const handleVisibilityChange = () => {
        if (!document.hidden) {
          refreshAll();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [refreshOnVisibilityChange, refreshAll]);

    // Periodic auto-refresh
    useEffect(() => {
      if (!refreshInterval) return;

      const interval = setInterval(() => {
        refreshAll();
      }, refreshInterval);

      return () => clearInterval(interval);
    }, [refreshInterval, refreshAll]);

    return <WrappedComponent {...props} />;
  };
}

