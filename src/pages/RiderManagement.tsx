import React, { useEffect } from 'react';
import { RiderManagement } from '../components/ui/RiderManagement';
import { useRiders } from '../context/RiderContext';

export const RiderManagementPage: React.FC = () => {
  const { riders, addRider, updateRider, reconcileRider, giveCashToRider, loadRiders, isLoading } = useRiders();

  useEffect(() => {
    loadRiders();
  }, [loadRiders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 pb-24">
      <div className="max-w-7xl mx-auto">
        <RiderManagement
          riders={riders}
          onAddRider={addRider}
          onUpdateRider={updateRider}
          onReconcileRider={reconcileRider}
          onGiveCashToRider={giveCashToRider}
        />
      </div>
    </div>
  );
};
