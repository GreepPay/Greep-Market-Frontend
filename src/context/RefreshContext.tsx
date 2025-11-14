import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useApp } from './AppContext';
import { useAuth } from './AuthContext';

interface RefreshContextType {
  isRefreshing: boolean;
  refreshData: (options?: RefreshOptions) => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshDashboardData: () => Promise<void>;
  refreshInventory: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

interface RefreshOptions {
  silent?: boolean; // If true, doesn't show loading states
  includeProducts?: boolean;
  includeTransactions?: boolean;
  includeDashboard?: boolean;
  includeInventory?: boolean;
  delay?: number; // Delay before refresh in ms
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { 
    loadProducts, 
    loadAllProducts, 
    loadTransactions, 
    refreshDashboard, 
    loadInventoryAlerts 
  } = useApp();
  const { user, isAuthenticated } = useAuth();

  const refreshProducts = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Refresh both paginated and all products
      await Promise.all([
        loadProducts(),
        loadAllProducts()
      ]);
    } catch (error) {
      console.error('Failed to refresh products:', error);
    }
  }, [isAuthenticated, user, loadProducts, loadAllProducts]);

  const refreshTransactions = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      await loadTransactions();
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
    }
  }, [isAuthenticated, user, loadTransactions]);

  const refreshDashboardData = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      await refreshDashboard();
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  }, [isAuthenticated, user, refreshDashboard]);

  const refreshInventory = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      await loadInventoryAlerts();
    } catch (error) {
      console.error('Failed to refresh inventory:', error);
    }
  }, [isAuthenticated, user, loadInventoryAlerts]);

  const refreshAll = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      await Promise.all([
        refreshProducts(),
        refreshTransactions(),
        refreshDashboardData(),
        refreshInventory()
      ]);
    } catch (error) {
      console.error('Failed to refresh all data:', error);
    }
  }, [isAuthenticated, user, refreshProducts, refreshTransactions, refreshDashboardData, refreshInventory]);

  const refreshData = useCallback(async (options: RefreshOptions = {}) => {
    const {
      silent = true,
      includeProducts = true,
      includeTransactions = true,
      includeDashboard = true,
      includeInventory = true,
      delay = 0
    } = options;

    // Early return if not authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Prevent concurrent refreshes
    if (isRefreshing) {
      return;
    }

    // Add delay if specified
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (!silent) {
      setIsRefreshing(true);
    }

    try {
      const refreshPromises: Promise<void>[] = [];

      if (includeProducts) {
        refreshPromises.push(refreshProducts());
      }
      if (includeTransactions) {
        refreshPromises.push(refreshTransactions());
      }
      if (includeDashboard) {
        refreshPromises.push(refreshDashboardData());
      }
      if (includeInventory) {
        refreshPromises.push(refreshInventory());
      }

      await Promise.all(refreshPromises);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      if (!silent) {
        setIsRefreshing(false);
      }
    }
  }, [
    isAuthenticated, 
    user, 
    isRefreshing,
    refreshProducts, 
    refreshTransactions, 
    refreshDashboardData, 
    refreshInventory
  ]);

  const value: RefreshContextType = {
    isRefreshing,
    refreshData,
    refreshProducts,
    refreshTransactions,
    refreshDashboardData,
    refreshInventory,
    refreshAll,
  };

  return (
    <RefreshContext.Provider value={value}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
}
