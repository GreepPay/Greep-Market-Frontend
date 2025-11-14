import React, { useState, useMemo } from 'react';
import { DollarSign, Package, AlertTriangle, TrendingUp, Eye, RefreshCw } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Rider } from '../../types';

interface CashTrackingProps {
  riders: Rider[];
  onReconcileRider: (id: string, amount: number) => Promise<void>;
  onRefresh: () => void;
  isLoading: boolean;
}

export const CashTracking: React.FC<CashTrackingProps> = ({
  riders,
  onReconcileRider,
  onRefresh,
  isLoading,
}) => {
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [reconcileAmount, setReconcileAmount] = useState('');

  // Calculate cash tracking metrics
  const cashMetrics = useMemo(() => {
    const activeRiders = riders.filter(rider => rider.is_active);
    const totalCashOutstanding = activeRiders.reduce((sum, rider) => sum + rider.pending_reconciliation, 0);
    const totalCashReconciled = riders.reduce((sum, rider) => sum + rider.total_reconciled, 0);
    const ridersWithCash = activeRiders.filter(rider => rider.pending_reconciliation > 0);
    const highValueRiders = activeRiders.filter(rider => rider.pending_reconciliation > 1000);

    return {
      totalCashOutstanding,
      totalCashReconciled,
      ridersWithCash: ridersWithCash.length,
      totalActiveRiders: activeRiders.length,
      highValueRiders: highValueRiders.length,
    };
  }, [riders]);

  // Sort riders by pending reconciliation (highest first)
  const sortedRiders = useMemo(() => {
    return [...riders]
      .filter(rider => rider.is_active)
      .sort((a, b) => b.pending_reconciliation - a.pending_reconciliation);
  }, [riders]);

  const handleReconcile = async () => {
    if (!selectedRider || !reconcileAmount) return;

    const amount = parseFloat(reconcileAmount);
    if (amount <= 0 || amount > selectedRider.pending_reconciliation) {
      return;
    }

    try {
      await onReconcileRider(selectedRider._id, amount);
      setReconcileAmount('');
      setSelectedRider(null);
    } catch (error) {
      console.error('Failed to reconcile rider:', error);
    }
  };

  const getCashStatusColor = (amount: number) => {
    if (amount === 0) return 'text-gray-500';
    if (amount < 500) return 'text-green-600';
    if (amount < 1000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCashStatusBg = (amount: number) => {
    if (amount === 0) return 'bg-gray-100';
    if (amount < 500) return 'bg-green-100';
    if (amount < 1000) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cash Tracking</h2>
          <p className="text-gray-600 dark:text-gray-400">Monitor which riders have your store's cash</p>
        </div>
        <Button 
          onClick={onRefresh} 
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Cash Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Cash Outstanding */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cash Outstanding</p>
              <p className="text-2xl font-bold text-red-600">₺{cashMetrics.totalCashOutstanding.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        {/* Riders With Cash */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Riders With Cash</p>
              <p className="text-2xl font-bold text-orange-600">{cashMetrics.ridersWithCash}</p>
              <p className="text-xs text-gray-500">of {cashMetrics.totalActiveRiders} active</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>

        {/* High Value Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Value (&gt;₺1,000)</p>
              <p className="text-2xl font-bold text-red-600">{cashMetrics.highValueRiders}</p>
              <p className="text-xs text-gray-500">riders</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        {/* Total Reconciled */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reconciled</p>
              <p className="text-2xl font-bold text-green-600">₺{cashMetrics.totalCashReconciled.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Riders Cash List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Riders With Your Cash</h3>
          <div className="text-sm text-gray-500">
            {sortedRiders.length} active riders
          </div>
        </div>

        {sortedRiders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No active riders found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add riders to start tracking cash</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedRiders.map((rider) => (
              <div
                key={rider._id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  rider.pending_reconciliation > 0
                    ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800'
                    : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-400/20 rounded-xl flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{rider.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{rider.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    {/* Cash Amount */}
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getCashStatusColor(rider.pending_reconciliation)}`}>
                        ₺{rider.pending_reconciliation.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>

                    {/* Status Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getCashStatusBg(rider.pending_reconciliation)} ${getCashStatusColor(rider.pending_reconciliation)}`}>
                      {rider.pending_reconciliation === 0 ? 'No Cash' : 
                       rider.pending_reconciliation < 500 ? 'Low Amount' :
                       rider.pending_reconciliation < 1000 ? 'Medium Amount' : 'High Amount'}
                    </div>

                    {/* Action Button */}
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRider(rider);
                        setReconcileAmount(rider.pending_reconciliation.toString());
                      }}
                      disabled={rider.pending_reconciliation <= 0}
                      className="flex items-center space-x-1"
                    >
                      <DollarSign className="h-3 w-3" />
                      <span>Reconcile</span>
                    </Button>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Total Delivered: ₺{rider.total_delivered.toFixed(2)}</span>
                    <span>Total Reconciled: ₺{rider.total_reconciled.toFixed(2)}</span>
                    <span>Current Balance: ₺{rider.current_balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Reconciliation Modal */}
      {selectedRider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pt-0 px-4 pb-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reconcile Cash - {selectedRider.name}
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Reconciliation</p>
                <p className="text-xl font-bold text-orange-600">₺{selectedRider.pending_reconciliation.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount to Reconcile
                </label>
                <input
                  type="number"
                  value={reconcileAmount}
                  onChange={(e) => setReconcileAmount(e.target.value)}
                  max={selectedRider.pending_reconciliation}
                  title="Enter amount to reconcile"
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRider(null);
                    setReconcileAmount('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReconcile}
                  disabled={!reconcileAmount || parseFloat(reconcileAmount) <= 0 || parseFloat(reconcileAmount) > selectedRider.pending_reconciliation}
                  className="flex-1"
                >
                  Reconcile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
