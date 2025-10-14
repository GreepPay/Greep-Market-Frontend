import React, { useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { RiderManagement } from '../components/ui/RiderManagement';
import { FloatingActionButton } from '../components/ui/FloatingActionButton';
import { useRiders } from '../context/RiderContext';
import { BackButton } from '../components/ui/BackButton';
import { Breadcrumb } from '../components/ui/Breadcrumb';

export const RiderManagementPage: React.FC = () => {
  const { riders, addRider, updateRider, reconcileRider, giveCashToRider, loadRiders, isLoading } = useRiders();

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
        
        <RiderManagement
          riders={riders}
          onAddRider={addRider}
          onUpdateRider={updateRider}
          onReconcileRider={reconcileRider}
          onGiveCashToRider={giveCashToRider}
        />

        {/* Floating Action Button */}
        <FloatingActionButton
          onClick={() => {
            // Trigger the add rider action from the RiderManagement component
            // This will open the add rider modal
            const event = new CustomEvent('addRider');
            window.dispatchEvent(event);
          }}
          icon={UserPlus}
          label="Add New Rider"
          color="orange"
          size="lg"
          position="bottom-right"
        />
      </div>
    </div>
  );
};
