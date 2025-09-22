import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  const loadStores = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try to load real store settings from API
      // This connects to the store settings form in Settings page
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
          console.warn('Failed to load store settings from API, using fallback:', apiError);
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
    } catch (error) {
      console.error('Failed to load stores:', error);
      setError('Failed to load store information');
    } finally {
      setIsLoading(false);
    }
  };

  const switchStore = (storeId: string) => {
    const store = stores.find(s => s._id === storeId);
    if (store) {
      setCurrentStore(store);
      // In a real app, you would update the user's current store context
      localStorage.setItem('current_store_id', storeId);
    }
  };


  const refreshStores = async () => {
    await loadStores();
  };

  useEffect(() => {
    if (user) {
      loadStores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
