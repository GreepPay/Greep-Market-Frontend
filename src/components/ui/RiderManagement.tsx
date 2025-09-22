import React, { useState, useEffect } from 'react';
import { Plus, Edit, Eye, DollarSign, Package, TrendingUp, Phone, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card } from './Card';
import { Button } from './Button';
import { Modal } from './Modal';
import { Input } from './Input';
import { GlassmorphismIcon } from './GlassmorphismIcon';
import { Rider } from '../../types';

interface RiderManagementProps {
  riders: Rider[];
  onAddRider: (rider: Omit<Rider, '_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateRider: (id: string, updates: Partial<Rider>) => Promise<void>;
  onReconcileRider: (id: string, amount: number) => Promise<void>;
}

export const RiderManagement: React.FC<RiderManagementProps> = ({
  riders,
  onAddRider,
  onUpdateRider,
  onReconcileRider,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [riderForm, setRiderForm] = useState({
    name: '',
    phone: '',
    email: '',
    is_active: true,
  });

  const [reconcileAmount, setReconcileAmount] = useState('');

  const filteredRiders = riders.filter(rider =>
    rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rider.phone.includes(searchQuery)
  );

  const handleAddRider = async () => {
    if (!riderForm.name || !riderForm.phone) {
      toast.error('Name and phone are required');
      return;
    }

    try {
      await onAddRider({
        ...riderForm,
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

    try {
      await onUpdateRider(selectedRider._id, riderForm);
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
      setReconcileAmount('');
      setIsReconcileModalOpen(false);
      setSelectedRider(null);
      toast.success(`Reconciled ₺${amount.toFixed(2)} for ${selectedRider.name}`);
    } catch (error) {
      toast.error('Failed to reconcile rider');
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
                    <span>{rider.phone}</span>
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
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(rider)}
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() => openReconcileModal(rider)}
                  className="flex-1"
                  disabled={rider.pending_reconciliation <= 0}
                >
                  <DollarSign className="h-3 w-3 mr-1" />
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
            onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })}
            placeholder="Enter phone number"
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
            onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })}
            placeholder="Enter phone number"
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
    </div>
  );
};
