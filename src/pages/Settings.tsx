import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Database, 
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Monitor,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../services/api';
import { User } from '../types';
import { UserProfileModal } from '../components/ui/UserProfileModal';
import { UserEditModal } from '../components/ui/UserEditModal';
import { AuditLogs } from '../components/ui/AuditLogs';
import toast from 'react-hot-toast';

interface NewUser {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'cashier';
}

interface StoreSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  timezone: string;
  tax_rate: number;
  low_stock_threshold: number;
}

export const Settings: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { refreshStores } = useStore();
  const { theme, setTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'cashier'
  });
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState<User | null>(null);
  const [storeSettingsLoading, setStoreSettingsLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    // Only load users if user has permission (admin, owner, manager)
    if (!currentUser || !['admin', 'owner', 'manager'].includes(currentUser.role)) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.getUsers();
      let allUsers = response?.users || [];
      
      // Filter users based on current user's role
      if (currentUser?.role === 'manager') {
        // Managers can only see other managers and cashiers
        allUsers = allUsers.filter(user => 
          user.role === 'manager' || user.role === 'cashier'
        );
      }
      // Admins and owners can see all users (no filtering)
      
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
      setUsers([]); // Ensure users is always an array
    } finally {
      setLoading(false);
    }
  }, [currentUser?.role]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createUser(newUser);
      toast.success('User created');
      setShowAddUser(false);
      setNewUser({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'cashier'
      });
      loadUsers();
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  const handleEditUser = (user: User) => {
    setShowEditUserModal(user);
  };

  const handleUserUpdated = (updatedUser: User) => {
    // Update the user in the local state
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      )
    );
    setShowEditUserModal(null);
  };

  const loadStoreSettings = useCallback(async () => {
    // Check if user is authenticated
    if (!currentUser) {
      console.log('No user found, skipping store settings load');
      return;
    }

    // Use fallback store_id if user doesn't have one
    const storeId = currentUser?.store_id || 'default-store';
    console.log('Loading store settings for storeId:', storeId, 'user:', currentUser.email);
    
    try {
      setStoreSettingsLoading(true);
      const settings = await apiService.getStoreSettings(storeId);
      setStoreSettings(settings);
      console.log('Store settings loaded successfully:', settings);
    } catch (error) {
      console.error('Failed to load store settings:', error);
      setStoreSettings(null);
      toast.error('Failed to load store settings. Please check your authentication.');
    } finally {
      setStoreSettingsLoading(false);
    }
  }, [currentUser]);

  // Load users and store settings on component mount
  useEffect(() => {
      loadUsers();
    loadStoreSettings();
  }, [loadUsers, loadStoreSettings]);

  const saveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSettings) return;

    // Check if user is authenticated
    if (!currentUser) {
      toast.error('Please log in to save store settings');
      return;
    }

    // Use fallback store_id if user doesn't have one
    const storeId = currentUser?.store_id || 'default-store';
    console.log('Saving store settings for storeId:', storeId, 'user:', currentUser.email);

    try {
      setStoreSettingsLoading(true);
      const updatedSettings = await apiService.updateStoreSettings(storeId, storeSettings);
      setStoreSettings(updatedSettings);
      // Refresh store context to update the header
      await refreshStores();
      toast.success('Store settings saved');
    } catch (error) {
      console.error('Failed to save store settings:', error);
      toast.error('Failed to save store settings. Please check your authentication.');
    } finally {
      setStoreSettingsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiService.deleteUser(userId);
      toast.success('User deleted');
      setShowDeleteConfirm(null);
      loadUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await apiService.toggleUserStatus(userId);
      toast.success(`User ${isActive ? 'activated' : 'deactivated'}`);
      loadUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  // Define tabs based on user role
  const getAvailableTabs = () => {
    const allTabs = [
      { id: 'profile', label: 'My Profile', icon: Users, roles: ['admin', 'owner', 'manager', 'cashier'] },
      { id: 'users', label: 'User Management', icon: Users, roles: ['admin', 'owner', 'manager'] },
      { id: 'customer-orders', label: 'Customer Orders', icon: ShoppingBag, roles: ['admin', 'owner', 'manager'] },
      { id: 'store', label: 'Store Settings', icon: Database, roles: ['admin', 'owner'] },
      { id: 'theme', label: 'Theme & Appearance', icon: Sun, roles: ['admin', 'owner', 'manager', 'cashier'] },
      { id: 'audit', label: 'Audit Logs', icon: Shield, roles: ['admin', 'owner', 'manager'] }
    ];

    if (!currentUser) return [];
    
    return allTabs.filter(tab => tab.roles.includes(currentUser.role));
  };

  const tabs = getAvailableTabs();

  const handleProfileUpdated = (updatedUser: User) => {
    // Update the current user in the auth context
    // This will be handled by the AuthContext when we implement it
    console.log('Profile updated:', updatedUser);
  };

  const renderMyProfile = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Profile</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage your personal information and account settings</p>
        </div>
        <button
          onClick={() => setShowProfileModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <Edit className="h-4 w-4" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Current User Info Display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Users className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentUser?.first_name && currentUser?.last_name 
                ? `${currentUser.first_name} ${currentUser.last_name}`
                : currentUser?.email || 'User'
              }
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{currentUser?.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                currentUser?.role === 'admin' ? 'bg-red-100 text-red-800' :
                currentUser?.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                currentUser?.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                'bg-green-100 text-green-800'
              }`}>
                {currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'User'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                currentUser?.is_active !== false
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {currentUser?.is_active !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Contact Information</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{currentUser?.email || 'Not available'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{currentUser?.phone || 'Not provided'}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Account Information</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Member since:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'Account created recently'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Last login:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {currentUser?.last_login ? new Date(currentUser.last_login).toLocaleDateString() : 'First login'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currentUser?.role === 'manager' 
              ? 'Manage managers and cashiers' 
              : 'Manage admins, managers, and cashiers'
            }
          </p>
        </div>
        {currentUser?.role !== 'cashier' && (
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : !users || users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                (users || []).map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleUserStatus(user.id, !user.is_active)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                        title={`Toggle user status for ${user.first_name} ${user.last_name}`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-primary-600 hover:text-primary-900"
                        title={`Edit user ${user.first_name} ${user.last_name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {user.id !== currentUser?.id && 
                       // Managers can only delete cashiers, admins/owners can delete anyone
                       (currentUser?.role === 'admin' || currentUser?.role === 'owner' || 
                        (currentUser?.role === 'manager' && user.role === 'cashier')) && (
                        <button
                          onClick={() => setShowDeleteConfirm(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title={`Delete user ${user.first_name} ${user.last_name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCustomerOrders = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Orders</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage customer orders from the public catalog
        </p>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100">Customer Order Management</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Access the full customer order management interface
            </p>
          </div>
          <button
            onClick={() => window.open('/admin/customer-orders', '_blank')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open Customer Orders
          </button>
        </div>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Logs</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {currentUser?.role === 'manager' 
            ? 'Track activities of managers and cashiers' 
            : 'Track all user activities and system changes'
          }
        </p>
      </div>
      <AuditLogs currentUserRole={currentUser?.role} />
    </div>
  );

  const renderThemeSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Theme & Appearance</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Customize the appearance of your application</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Theme Preference
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                theme === 'light'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <Sun className={`h-6 w-6 ${theme === 'light' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${theme === 'light' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  Light
                </span>
              </div>
            </button>
            
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                theme === 'dark'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <Moon className={`h-6 w-6 ${theme === 'dark' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  Dark
                </span>
              </div>
            </button>
            
            <button
              onClick={() => setTheme('auto')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                theme === 'auto'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <Monitor className={`h-6 w-6 ${theme === 'auto' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${theme === 'auto' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  Auto
                </span>
              </div>
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Current Theme: {isDark ? 'Dark Mode' : 'Light Mode'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {theme === 'auto' ? 'Following system preference' : `Manually set to ${theme} mode`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStoreSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Store Settings</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Configure your store information and preferences</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
        {storeSettingsLoading && (!storeSettings || !storeSettings.name) ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading store settings...</span>
          </div>
        ) : !storeSettings ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">Failed to load store settings</p>
              <button
                onClick={loadStoreSettings}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={saveStoreSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Store Name</label>
              <input
                type="text"
                value={storeSettings?.name || ''}
                onChange={(e) => setStoreSettings(prev => prev ? {...prev, name: e.target.value} : null)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                title="Enter your store name"
                placeholder="Enter store name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
              <input
                type="tel"
                value={storeSettings?.phone || ''}
                onChange={(e) => setStoreSettings(prev => prev ? {...prev, phone: e.target.value} : null)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                title="Enter your store phone number"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
            <textarea
              value={storeSettings?.address || ''}
              onChange={(e) => setStoreSettings(prev => prev ? {...prev, address: e.target.value} : null)}
              rows={3}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
              title="Enter your store address"
              placeholder="Enter store address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                value={storeSettings?.email || ''}
                onChange={(e) => setStoreSettings(prev => prev ? {...prev, email: e.target.value} : null)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                title="Enter your store email address"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
              <select
                value={storeSettings?.currency || ''}
                onChange={(e) => setStoreSettings(prev => prev ? {...prev, currency: e.target.value} : null)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                title="Select your store currency"
              >
                <option value="">Select Currency</option>
                <option value="TRY">Turkish Lira (₺)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tax Rate (%)</label>
              <input
                type="number"
                value={storeSettings?.tax_rate || ''}
                onChange={(e) => setStoreSettings(prev => prev ? {...prev, tax_rate: Number(e.target.value)} : null)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                title="Enter tax rate percentage"
                placeholder=""
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Low Stock Threshold</label>
              <input
                type="number"
                value={storeSettings?.low_stock_threshold || ''}
                onChange={(e) => setStoreSettings(prev => prev ? {...prev, low_stock_threshold: Number(e.target.value)} : null)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                title="Enter low stock threshold number"
                placeholder=""
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={storeSettingsLoading}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {storeSettingsLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{storeSettingsLoading ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );





  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderMyProfile();
      case 'users':
        return renderUserManagement();
      case 'customer-orders':
        return renderCustomerOrders();
      case 'store':
        return renderStoreSettings();
      case 'theme':
        return renderThemeSettings();
      case 'audit':
        return renderAuditLogs();
      default:
        return renderMyProfile();
    }
  };

  return (
    <>
      <div className="p-4 space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your application settings and preferences</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg border border-white/20 dark:border-gray-700/50 transition-all duration-300">
          <div className="border-b border-white/20 dark:border-gray-700/50">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'border-primary-500/60 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300/50 dark:hover:border-gray-600/50'
                    }`}
                  >
                    <div className={`p-1 rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-500/20 backdrop-blur-sm border border-primary-400/30'
                        : 'bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20'
                    }`}>
                    <Icon className="h-4 w-4" />
                    </div>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-b-lg">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                  title="Enter user email address"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 pr-10"
                    title="Enter user password"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                  <input
                    type="text"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                    required
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                    title="Enter user first name"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                  <input
                    type="text"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                    required
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                    title="Enter user last name"
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                  title="Select user role"
                >
                  {currentUser?.role === 'manager' ? (
                    // Managers can only create cashiers
                    <option value="cashier">Cashier</option>
                  ) : (
                    // Admins and owners can create all roles
                    <>
                      <option value="cashier">Cashier</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </>
                  )}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Delete User</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {currentUser && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={currentUser}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      {/* User Edit Modal */}
      {showEditUserModal && (
        <UserEditModal
          isOpen={!!showEditUserModal}
          onClose={() => setShowEditUserModal(null)}
          user={showEditUserModal}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </>
  );
};
