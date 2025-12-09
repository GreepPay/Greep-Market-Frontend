import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';
import { app } from '../config/environment';

interface Store {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  timezone: string;
  tax_rate: number;
  low_stock_threshold: number;
  owner_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface StoreContextType {
  currentStore: Store | null;
  stores: Store[];
  isLoading: boolean;
  error: string | null;
  switchStore: (storeId: string) => void;
  refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadStores = async () => {
    if (!user) return;
    
    // Don't load stores if user is not authenticated (e.g., on login page)
    if (!apiService.isAuthenticated()) {
      return;
    }

    // Cancel previous request if it's still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to load all stores the user has access to
      try {
        const storesResponse = await apiService.getStoresForAssignment();
        const storesList = storesResponse.data || [];
        
        if (storesList.length > 0) {
          // Convert the stores to our Store format
          // Use Promise.allSettled to handle individual failures gracefully
          const storePromises = storesList.map(async (storeData) => {
            try {
              // Get full store settings for each store
              const storeSettings = await apiService.getStoreSettings(storeData.id);
              return {
                _id: storeData.id,
                name: storeSettings.name || storeData.name,
                address: storeSettings.address || storeData.address,
                phone: storeSettings.phone || '',
                email: storeSettings.email || '',
                currency: storeSettings.currency || 'TRY',
                timezone: storeSettings.timezone || 'Europe/Istanbul',
                tax_rate: storeSettings.tax_rate || 18,
                low_stock_threshold: storeSettings.low_stock_threshold || 10,
                owner_id: user.id,
                is_active: storeData.is_active !== false,
                created_at: new Date(),
                updated_at: new Date(),
              };
            } catch (err: any) {
              // If we can't get full settings (including AbortError), use basic data
              // Don't log AbortErrors as they're expected
              if (err?.name !== 'AbortError') {
                console.warn(`Failed to load full settings for store ${storeData.id}:`, err);
              }
              return {
                _id: storeData.id,
                name: storeData.name,
                address: storeData.address,
                phone: '',
                email: '',
                currency: 'TRY',
                timezone: 'Europe/Istanbul',
                tax_rate: 18,
                low_stock_threshold: 10,
                owner_id: user.id,
                is_active: storeData.is_active !== false,
                created_at: new Date(),
                updated_at: new Date(),
              };
            }
          });
          
          const formattedStores: Store[] = (await Promise.all(storePromises)).filter(Boolean) as Store[];
          
          setStores(formattedStores);
          
          // Set current store - check localStorage first, then user's store_id, then first store
          const savedStoreId = localStorage.getItem('current_store_id');
          const storeToUse = savedStoreId 
            ? formattedStores.find(s => s._id === savedStoreId)
            : formattedStores.find(s => s._id === user.store_id) || formattedStores[0];
          
          if (storeToUse) {
            setCurrentStore(storeToUse);
            localStorage.setItem('current_store_id', storeToUse._id);
          }
        } else {
          // Fallback: Load user's single store if no stores list available
          if (user.store_id) {
            try {
              const storeSettings = await apiService.getStoreSettings(user.store_id);
              const realStore: Store = {
                _id: user.store_id,
                name: storeSettings.name,
                address: storeSettings.address,
                phone: storeSettings.phone,
                email: storeSettings.email,
                currency: storeSettings.currency,
                timezone: storeSettings.timezone,
                tax_rate: storeSettings.tax_rate,
                low_stock_threshold: storeSettings.low_stock_threshold,
                owner_id: user.id,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
              };
              setStores([realStore]);
              setCurrentStore(realStore);
            } catch (apiError) {
              // Fallback to default store if API fails
              const fallbackStore: Store = {
                _id: user.store_id,
                name: app.name,
                address: 'Store Address - Update in Settings',
                phone: 'Phone - Update in Settings',
                email: 'Email - Update in Settings',
                currency: 'TRY',
                timezone: 'Europe/Istanbul',
                tax_rate: 18,
                low_stock_threshold: 10,
                owner_id: user.id,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
              };
              setStores([fallbackStore]);
              setCurrentStore(fallbackStore);
            }
          }
        }
      } catch (apiError) {
        // Don't log AbortErrors as they're expected when requests are cancelled
        if (apiError && (apiError as any)?.name !== 'AbortError' && !(apiError as any)?.message?.includes('cancelled')) {
          console.error('Failed to load stores list:', apiError);
        }
        // Fallback to single store loading
        if (user.store_id) {
          try {
            const storeSettings = await apiService.getStoreSettings(user.store_id);
            const realStore: Store = {
              _id: user.store_id,
              name: storeSettings.name,
              address: storeSettings.address,
              phone: storeSettings.phone,
              email: storeSettings.email,
              currency: storeSettings.currency,
              timezone: storeSettings.timezone,
              tax_rate: storeSettings.tax_rate,
              low_stock_threshold: storeSettings.low_stock_threshold,
              owner_id: user.id,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
            };
            setStores([realStore]);
            setCurrentStore(realStore);
          } catch (err) {
            setError('Failed to load store information');
          }
        }
      }
    } catch (error: any) {
      // Don't log AbortErrors as they're expected when requests are cancelled
      if (error?.name !== 'AbortError' && !error?.message?.includes('cancelled')) {
        console.error('Failed to load stores:', error);
        setError('Failed to load store information');
      }
      // Don't set error state for AbortErrors
      if (error?.name === 'AbortError' || error?.message?.includes('cancelled')) {
        setError(null);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const switchStore = (storeId: string) => {
    const store = stores.find(s => s._id === storeId);
    if (store) {
      setCurrentStore(store);
      localStorage.setItem('current_store_id', storeId);
      // Reload the page to update all data with the new store context
      // This ensures all components refresh with the new store_id
      window.location.reload();
    }
  };

  const refreshStores = React.useCallback(async () => {
    await loadStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only recreate if user changes

  useEffect(() => {
    // Don't load stores if we're on the login page
    const isLoginPage = window.location.pathname === '/login';
    if (user && !isLoginPage) {
      loadStores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Cleanup: Cancel any pending requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const value: StoreContextType = {
    currentStore,
    stores,
    isLoading,
    error,
    switchStore,
    refreshStores,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
