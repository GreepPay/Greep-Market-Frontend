import React, { useState, useEffect } from 'react';
import { User as UserIcon, Save, Eye, EyeOff, Key, Shield, Building2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { toast } from 'react-hot-toast';
import { apiService } from '../../services/api';
import { User } from '../../types';
import axios from 'axios';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUserUpdated: (updatedUser: User) => void;
}

interface UserEditFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'cashier' | 'manager' | 'owner';
  store_id: string;
  is_active: boolean;
  new_password: string;
  confirm_password: string;
}

interface Store {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}) => {
  const [formData, setFormData] = useState<UserEditFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'cashier',
    store_id: '',
    is_active: true,
    new_password: '',
    confirm_password: '',
  });

  const [stores, setStores] = useState<Store[]>([]);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Load stores when modal opens
  useEffect(() => {
    if (isOpen) {
      loadStores();
    }
  }, [isOpen]);

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'cashier',
        store_id: user.store_id || '',
        is_active: user.is_active !== undefined ? user.is_active : true,
        new_password: '',
        confirm_password: '',
      });
    }
  }, [user]);

  // ✅ FIXED: Ensure we store an array, not an object
  const loadStores = async () => {
    try {
      console.log('🔄 Loading stores for assignment...');
      const response: any = await apiService.getStoresForAssignment();
      console.log('✅ Stores API raw response:', response);

      // Handle both formats safely
      const storeArray: Store[] = Array.isArray(response)
        ? response
        : Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      console.log('📊 Stores loaded:', storeArray.length);
      setStores(storeArray);
      console.log('🎯 Stores state set:', storeArray);
    } catch (error) {
      console.error('❌ Failed to load stores:', error);
      toast.error('Failed to load stores for assignment');
    }
  };

  const handleInputChange = (field: keyof UserEditFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || undefined,
        role: formData.role,
        store_id: formData.store_id || undefined,
        is_active: formData.is_active,
      };

      const updatedUser = await apiService.updateUser(user.id, updateData);
      onUserUpdated(updatedUser);
      toast.success('User updated');
      onClose();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await apiService.updateUserPassword(user.id, formData.new_password);
      toast.success('Password updated');

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        new_password: '',
        confirm_password: '',
      }));

      onClose();
    } catch (error) {
      console.error('Failed to update password:', error);
      toast.error('Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'User Information', icon: UserIcon },
    { id: 'password', label: 'Reset Password', icon: Key },
  ];

  const roleOptions = [
    { value: 'cashier', label: 'Cashier', description: 'Can process sales and view inventory' },
    { value: 'manager', label: 'Manager', description: 'Can manage products, view reports, and manage cashiers' },
    { value: 'admin', label: 'Admin', description: 'Full access to all features except user management' },
    { value: 'owner', label: 'Owner', description: 'Complete system access including user management' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit User: ${user?.first_name} ${user?.last_name}`}
      size="lg"
    >
      {/* ✅ No changes needed below this line */}
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'profile' | 'password')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
          {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Enter first name"
                required
              />
              <Input
                label="Last Name *"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Enter last name"
                required
              />
            </div>

            <Input
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter phone number"
            />

            {/* Store Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="h-4 w-4 inline mr-1" />
                Store Assignment
              </label>
              {/* Debug info */}
              <div className="text-xs text-gray-400 mb-1">
                Debug: {stores.length} stores loaded
              </div>
              <select
                value={formData.store_id}
                onChange={(e) => handleInputChange('store_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label="Select store assignment"
              >
                <option value="">No Store Assigned</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.address}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.store_id 
                  ? 'User is assigned to a specific store' 
                  : 'User has no store assignment (store_id: null)'}
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Role *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roleOptions.map((role) => (
                  <div
                    key={role.value}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      formData.role === role.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('role', role.value)}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={() => handleInputChange('role', role.value)}
                        className="h-4 w-4 text-primary-600"
                        aria-label={`Select ${role.label} role`}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{role.label}</div>
                        <div className="text-sm text-gray-500">{role.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Account Status</h4>
                <p className="text-sm text-gray-500">
                  {formData.is_active ? 'User can log in and access the system' : 'User account is disabled'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="sr-only peer"
                  aria-label="Toggle user account status"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* User Info Display */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-gray-900">Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">User ID:</span>
                  <span className="ml-2 text-gray-900 font-mono text-xs">{user.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">Member since:</span>
                  <span className="ml-2 text-gray-900">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Last login:</span>
                  <span className="ml-2 text-gray-900">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Last updated:</span>
                  <span className="ml-2 text-gray-900">
                    {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                loading={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        )}

        {/* Reset Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Key className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Reset User Password
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>This will reset the password for <strong>{user.first_name} {user.last_name}</strong>. They will need to use this new password to log in.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <Input
                label="New Password *"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.new_password}
                onChange={(e) => handleInputChange('new_password', e.target.value)}
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                title={showNewPassword ? "Hide password" : "Show password"}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm New Password *"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                title={showConfirmPassword ? "Hide password" : "Show password"}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Password Requirements
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>At least 8 characters long</li>
                      <li>Contains uppercase and lowercase letters</li>
                      <li>Contains at least one number</li>
                      <li>Contains at least one special character</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                loading={isLoading}
              >
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};