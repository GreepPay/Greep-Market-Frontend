import { useCallback } from 'react';
import { useRefresh } from '../context/RefreshContext';

interface ActionWithRefreshOptions {
  silent?: boolean;
  delay?: number;
  refreshProducts?: boolean;
  refreshTransactions?: boolean;
  refreshDashboard?: boolean;
  refreshInventory?: boolean;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useActionWithRefresh() {
  const { refreshData } = useRefresh();

  const executeWithRefresh = useCallback(
    async <T>(
      action: () => Promise<T>,
      options: ActionWithRefreshOptions = {}
    ): Promise<T | undefined> => {
      const {
        silent = true,
        delay = 500, // Default 500ms delay
        refreshProducts = true,
        refreshTransactions = true,
        refreshDashboard = true,
        refreshInventory = true,
        onSuccess,
        onError
      } = options;

      try {
        // Execute the action
        const result = await action();
        
        // Refresh data after successful action
        await refreshData({
          silent,
          delay,
          includeProducts: refreshProducts,
          includeTransactions: refreshTransactions,
          includeDashboard: refreshDashboard,
          includeInventory: refreshInventory
        });

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }

        return result;
      } catch (error) {
        console.error('Action failed:', error);
        
        // Call error callback
        if (onError) {
          onError(error);
        }
        
        throw error;
      }
    },
    [refreshData]
  );

  return { executeWithRefresh };
}

