import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { Rider } from '../types';

interface RiderContextType {
  riders: Rider[];
  isLoading: boolean;
  error: string | null;
  addRider: (rider: Omit<Rider, '_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateRider: (id: string, updates: Partial<Rider>) => Promise<void>;
  reconcileRider: (id: string, amount: number) => Promise<void>;
  giveCashToRider: (id: string, amount: number) => Promise<void>;
  loadRiders: () => Promise<void>;
}

const RiderContext = createContext<RiderContextType | undefined>(undefined);

export const RiderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRiders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.request('/riders');
      setRiders((response.data as Rider[]) || []);
    } catch (err) {
      console.error('Failed to load riders:', err);
      setError('Failed to load riders');
      setRiders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addRider = useCallback(async (riderData: Omit<Rider, '_id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await apiService.request('/riders', {
        method: 'POST',
        body: JSON.stringify(riderData),
      });
      
      const newRider = response.data as Rider;
      setRiders(prev => [newRider, ...prev]);
      toast.success('Rider added successfully');
    } catch (err) {
      console.error('Failed to add rider:', err);
      toast.error('Failed to add rider');
      throw err;
    }
  }, []);

  const updateRider = useCallback(async (id: string, updates: Partial<Rider>) => {
    try {
      const response = await apiService.request(`/riders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      const updatedRider = response.data as Rider;
      setRiders(prev => prev.map(rider => 
        rider._id === id ? updatedRider : rider
      ));
      toast.success('Rider updated successfully');
    } catch (err) {
      console.error('Failed to update rider:', err);
      toast.error('Failed to update rider');
      throw err;
    }
  }, []);

  const reconcileRider = useCallback(async (id: string, amount: number) => {
    try {
      await apiService.request(`/riders/${id}/reconcile`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      
      setRiders(prev => prev.map(rider => {
        if (rider._id === id) {
          return {
            ...rider,
            pending_reconciliation: Math.max(0, rider.pending_reconciliation - amount),
            total_reconciled: rider.total_reconciled + amount,
            updated_at: new Date(),
          };
        }
        return rider;
      }));
      
      toast.success(`Reconciled ₺${amount.toFixed(2)} for rider`);
    } catch (err) {
      console.error('Failed to reconcile rider:', err);
      toast.error('Failed to reconcile rider');
      throw err;
    }
  }, []);

  const giveCashToRider = useCallback(async (id: string, amount: number) => {
    try {
      await apiService.request(`/riders/${id}/give-cash`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      
      setRiders(prev => prev.map(rider => {
        if (rider._id === id) {
          return {
            ...rider,
            current_balance: rider.current_balance + amount,
            pending_reconciliation: rider.pending_reconciliation + amount,
            updated_at: new Date(),
          };
        }
        return rider;
      }));
      
      toast.success(`Gave ₺${amount.toFixed(2)} to rider`);
    } catch (err) {
      console.error('Failed to give cash to rider:', err);
      toast.error('Failed to give cash to rider');
      throw err;
    }
  }, []);

  const value: RiderContextType = {
    riders,
    isLoading,
    error,
    addRider,
    updateRider,
    reconcileRider,
    giveCashToRider,
    loadRiders,
  };

  return (
    <RiderContext.Provider value={value}>
      {children}
    </RiderContext.Provider>
  );
};

export const useRiders = (): RiderContextType => {
  const context = useContext(RiderContext);
  if (context === undefined) {
    throw new Error('useRiders must be used within a RiderProvider');
  }
  return context;
};
