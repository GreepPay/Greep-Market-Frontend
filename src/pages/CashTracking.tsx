import React, { useEffect } from 'react';
import { CashTracking } from '../components/ui/CashTracking';
import { useRiders } from '../context/RiderContext';
import { BackButton } from '../components/ui/BackButton';
import { Breadcrumb } from '../components/ui/Breadcrumb';

export const CashTrackingPage: React.FC = () => {
  const { riders, reconcileRider, loadRiders, isLoading } = useRiders();

  useEffect(() => {
    loadRiders();
  }, [loadRiders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Back Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <BackButton />
            <Breadcrumb />
          </div>
        </div>
        
        <CashTracking
          riders={riders}
          onReconcileRider={reconcileRider}
          onRefresh={loadRiders}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
