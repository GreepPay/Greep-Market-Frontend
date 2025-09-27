import React, { useState, useEffect } from 'react';
import { Plus, Edit, Eye, DollarSign, Package, TrendingUp, Phone, Mail, History } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card } from './Card';
import { Button } from './Button';
import { Modal } from './Modal';
import { Input } from './Input';
import { GlassmorphismIcon } from './GlassmorphismIcon';
import { Rider, RiderCashTransaction } from '../../types';
import { sanitizePhoneNumber, isValidPhoneNumber, formatPhoneNumber } from '../../utils/phoneUtils';
import { RiderCashHistory } from './RiderCashHistory';

interface RiderManagementProps {
  riders: Rider[];
  onAddRider: (rider: Omit<Rider, '_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateRider: (id: string, updates: Partial<Rider>) => Promise<void>;
  onReconcileRider: (id: string, amount: number) => Promise<void>;
  onGiveCashToRider: (id: string, amount: number) => Promise<void>;
  onLoadCashTransactions?: (riderId: string) => Promise<RiderCashTransaction[]>;
}

export const RiderManagement: React.FC<RiderManagementProps> = ({
  riders,
  onAddRider,
  onUpdateRider,
  onReconcileRider,
  onGiveCashToRider,
  onLoadCashTransactions,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [isGiveCashModalOpen, setIsGiveCashModalOpen] = useState(false);
  const [isCashHistoryModalOpen, setIsCashHistoryModalOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cashTransactions, setCashTransactions] = useState<RiderCashTransaction[]>([]);

  // Form states
  const [riderForm, setRiderForm] = useState({
    name: '',
    phone: '',
    email: '',
    is_active: true,
  });

  const [reconcileAmount, setReconcileAmount] = useState('');
  const [giveCashAmount, setGiveCashAmount] = useState('');

  const filteredRiders = riders.filter(rider =>
    rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rider.phone.includes(searchQuery)
  );

  const handleAddRider = async () => {
    if (!riderForm.name || !riderForm.phone) {
      toast.error('Name and phone are required');
      return;
    }

    // Sanitize the phone number to remove invisible Unicode characters
    const sanitizedPhone = sanitizePhoneNumber(riderForm.phone);
    
    // Validate the sanitized phone number
    if (!isValidPhoneNumber(sanitizedPhone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    try {
      await onAddRider({
        ...riderForm,
        phone: sanitizedPhone, // Use the sanitized phone number
        current_balance: 0,
        total_delivered: 0,
        total_reconciled: 0,
        pending_reconciliation: 0,
        store_id: 'default-store', // This should come from context
      });
      
      setRiderForm({ name: '', phone: '', email: '', is_active: true });
      setIsAddModalOpen(false);
      toast.success('Rider added successfully');
    } catch (error) {
      toast.error('Failed to add rider');
    }
  };

  const handleEditRider = async () => {
    if (!selectedRider) return;

    // Sanitize the phone number to remove invisible Unicode characters
    const sanitizedPhone = sanitizePhoneNumber(riderForm.phone);
    
    // Validate the sanitized phone number
    if (!isValidPhoneNumber(sanitizedPhone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    try {
      await onUpdateRider(selectedRider._id, {
        ...riderForm,
        phone: sanitizedPhone, // Use the sanitized phone number
      });
      setIsEditModalOpen(false);
      setSelectedRider(null);
      toast.success('Rider updated successfully');
    } catch (error) {
      toast.error('Failed to update rider');
    }
  };

  const handleReconcile = async () => {
    if (!selectedRider || !reconcileAmount) return;

    const amount = parseFloat(reconcileAmount);
    if (amount <= 0) {
      toast.error('Reconciliation amount must be positive');
      return;
    }

    try {
      await onReconcileRider(selectedRider._id, amount);
      
      // Create a cash transaction record for history tracking
      const newTransaction: RiderCashTransaction = {
        _id: `temp_${Date.now()}`, // Temporary ID, will be replaced by backend
        rider_id: selectedRider._id,
        rider_name: selectedRider.name,
        type: 'reconcile',
        amount: amount,
        description: `Reconciled ₺${amount.toFixed(2)} for ${selectedRider.name}`,
        given_by: 'current_user', // This should come from auth context
        given_by_name: 'Current User', // This should come from auth context
        store_id: 'default-store', // This should come from context
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      // Add to local transactions for immediate UI update
      setCashTransactions(prev => [newTransaction, ...prev]);
      
      setReconcileAmount('');
      setIsReconcileModalOpen(false);
      setSelectedRider(null);
      toast.success(`Reconciled ₺${amount.toFixed(2)} for ${selectedRider.name}`);
    } catch (error) {
      toast.error('Failed to reconcile rider');
    }
  };

  const handleGiveCash = async () => {
    if (!selectedRider || !giveCashAmount) return;

    const amount = parseFloat(giveCashAmount);
    if (amount <= 0) {
      toast.error('Cash amount must be positive');
      return;
    }

    try {
      await onGiveCashToRider(selectedRider._id, amount);
      
      // Create a cash transaction record for history tracking
      const newTransaction: RiderCashTransaction = {
        _id: `temp_${Date.now()}`, // Temporary ID, will be replaced by backend
        rider_id: selectedRider._id,
        rider_name: selectedRider.name,
        type: 'give_cash',
        amount: amount,
        description: `Cash given to ${selectedRider.name}`,
        given_by: 'current_user', // This should come from auth context
        given_by_name: 'Current User', // This should come from auth context
        store_id: 'default-store', // This should come from context
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      // Add to local transactions for immediate UI update
      setCashTransactions(prev => [newTransaction, ...prev]);
      
      setGiveCashAmount('');
      setIsGiveCashModalOpen(false);
      setSelectedRider(null);
      toast.success(`Gave ₺${amount.toFixed(2)} to ${selectedRider.name}`);
    } catch (error) {
      toast.error('Failed to give cash to rider');
    }
  };

  const openEditModal = (rider: Rider) => {
    setSelectedRider(rider);
    setRiderForm({
      name: rider.name,
      phone: rider.phone,
      email: rider.email || '',
      is_active: rider.is_active,
    });
    setIsEditModalOpen(true);
  };

  const openReconcileModal = (rider: Rider) => {
    setSelectedRider(rider);
    setReconcileAmount(rider.pending_reconciliation.toString());
    setIsReconcileModalOpen(true);
  };

  const openGiveCashModal = (rider: Rider) => {
    setSelectedRider(rider);
    setGiveCashAmount('');
    setIsGiveCashModalOpen(true);
  };

  const openCashHistoryModal = (rider: Rider) => {
    setSelectedRider(rider);
    setIsCashHistoryModalOpen(true);
  };

  const loadCashTransactions = async (riderId: string): Promise<void> => {
    if (onLoadCashTransactions) {
      try {
        const transactions = await onLoadCashTransactions(riderId);
        setCashTransactions(transactions);
      } catch (error) {
        console.error('Failed to load cash transactions:', error);
        toast.error('Failed to load cash transactions');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rider Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage delivery riders and their finances</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Rider</span>
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search riders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Riders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRiders.map((rider) => (
          <Card key={rider._id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-400/20 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{rider.name}</h3>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Phone className="h-3 w-3" />
                    <span>{formatPhoneNumber(rider.phone)}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-1">
                <GlassmorphismIcon
                  icon={Edit}
                  size="sm"
                  variant="default"
                  onClick={() => openEditModal(rider)}
                  className="cursor-pointer"
                />
                <GlassmorphismIcon
                  icon={DollarSign}
                  size="sm"
                  variant="green"
                  onClick={() => openReconcileModal(rider)}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                rider.is_active 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {rider.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Financial Info */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Balance</span>
                <span className="font-semibold text-green-600">₺{rider.current_balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending Reconciliation</span>
                <span className="font-semibold text-orange-600">₺{rider.pending_reconciliation.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Delivered</span>
                <span className="font-semibold text-blue-600">₺{rider.total_delivered.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(rider)}
                  className="flex items-center justify-center"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCashHistoryModal(rider)}
                  className="flex items-center justify-center"
                >
                  <History className="h-3 w-3 mr-1" />
                  History
                </Button>
                <Button
                  size="sm"
                  onClick={() => openGiveCashModal(rider)}
                  disabled={!rider.is_active}
                  className="flex items-center justify-center"
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  Give Cash
                </Button>
                <Button
                  size="sm"
                  onClick={() => openReconcileModal(rider)}
                  disabled={rider.pending_reconciliation <= 0}
                  className="flex items-center justify-center"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Reconcile
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Rider Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Rider"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={riderForm.name}
            onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })}
            placeholder="Enter rider name"
          />
          <Input
            label="Phone"
            value={riderForm.phone}
            onChange={(e) => {
              const sanitized = sanitizePhoneNumber(e.target.value);
              setRiderForm({ ...riderForm, phone: sanitized });
            }}
            placeholder="Enter phone number (e.g., +90 533 868 87 09)"
          />
          <Input
            label="Email (Optional)"
            value={riderForm.email}
            onChange={(e) => setRiderForm({ ...riderForm, email: e.target.value })}
            placeholder="Enter email address"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={riderForm.is_active}
              onChange={(e) => setRiderForm({ ...riderForm, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
              Active rider
            </label>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleAddRider} className="flex-1">
              Add Rider
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Rider Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Rider"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={riderForm.name}
            onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })}
            placeholder="Enter rider name"
          />
          <Input
            label="Phone"
            value={riderForm.phone}
            onChange={(e) => {
              const sanitized = sanitizePhoneNumber(e.target.value);
              setRiderForm({ ...riderForm, phone: sanitized });
            }}
            placeholder="Enter phone number (e.g., +90 533 868 87 09)"
          />
          <Input
            label="Email (Optional)"
            value={riderForm.email}
            onChange={(e) => setRiderForm({ ...riderForm, email: e.target.value })}
            placeholder="Enter email address"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit_is_active"
              checked={riderForm.is_active}
              onChange={(e) => setRiderForm({ ...riderForm, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="edit_is_active" className="text-sm text-gray-700 dark:text-gray-300">
              Active rider
            </label>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleEditRider} className="flex-1">
              Update Rider
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reconcile Modal */}
      <Modal
        isOpen={isReconcileModalOpen}
        onClose={() => setIsReconcileModalOpen(false)}
        title={`Reconcile ${selectedRider?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Current Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Current Balance:</span>
                <span className="font-semibold">₺{selectedRider?.current_balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pending Reconciliation:</span>
                <span className="font-semibold text-orange-600">₺{selectedRider?.pending_reconciliation.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <Input
            label="Reconciliation Amount"
            type="number"
            value={reconcileAmount}
            onChange={(e) => setReconcileAmount(e.target.value)}
            placeholder="Enter amount to reconcile"
          />
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will reduce the rider's pending reconciliation by the specified amount.
          </p>
          
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsReconcileModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleReconcile} className="flex-1">
              Reconcile
            </Button>
          </div>
        </div>
      </Modal>

      {/* Give Cash Modal */}
      {isGiveCashModalOpen && selectedRider && (
        <Modal
          isOpen={isGiveCashModalOpen}
          onClose={() => {
            setIsGiveCashModalOpen(false);
            setSelectedRider(null);
            setGiveCashAmount('');
          }}
          title={`Give Cash to ${selectedRider.name}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Current Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-600 dark:text-blue-400">Current Balance:</span>
                  <span className="font-semibold">₺{selectedRider.current_balance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 dark:text-blue-400">Pending Reconciliation:</span>
                  <span className="font-semibold text-orange-600">₺{selectedRider.pending_reconciliation.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <Input
              label="Amount to Give"
              type="number"
              value={giveCashAmount}
              onChange={(e) => setGiveCashAmount(e.target.value)}
              placeholder="Enter amount to give"
              title="Enter amount to give to rider"
            />
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This will increase the rider's current balance and pending reconciliation by the specified amount.
            </p>
            
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsGiveCashModalOpen(false);
                  setSelectedRider(null);
                  setGiveCashAmount('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGiveCash}
                disabled={!giveCashAmount || parseFloat(giveCashAmount) <= 0}
                className="flex-1"
              >
                Give Cash
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cash History Modal */}
      {isCashHistoryModalOpen && selectedRider && (
        <RiderCashHistory
          riderId={selectedRider._id}
          riderName={selectedRider.name}
          isOpen={isCashHistoryModalOpen}
          onClose={() => {
            setIsCashHistoryModalOpen(false);
            setSelectedRider(null);
          }}
          transactions={cashTransactions}
          onLoadTransactions={loadCashTransactions}
        />
      )}
    </div>
  );
};
