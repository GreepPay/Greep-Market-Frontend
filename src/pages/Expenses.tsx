import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Package,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { NumberInput } from '../components/ui/NumberInput';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

interface Expense {
  _id: string;
  store_id: string;
  date: string;
  month_year: string;
  product_name: string;
  unit: string;
  quantity: number;
  amount: number;
  currency: string;
  payment_method: string;
  category: string;
  description?: string;
  receipt_number?: string;
  vendor_name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ExpenseStats {
  totalExpenses: number;
  totalAmount: number;
  expensesByCategory: Array<{
    category: string;
    count: number;
    amount: number;
  }>;
  expensesByPaymentMethod: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  expensesByMonth: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
  topExpenseItems: Array<{
    product_name: string;
    total_amount: number;
    count: number;
  }>;
}

interface NewExpense {
  store_id: string;
  date: string;
  product_name: string;
  unit: string;
  quantity: number;
  amount: number;
  currency: string;
  payment_method: string;
  category: string;
  description?: string;
}

export const Expenses: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState<Expense | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newExpense, setNewExpense] = useState<NewExpense>({
    store_id: user?.store_id || '',
    date: new Date().toISOString().split('T')[0],
    product_name: '',
    unit: 'pieces',
    quantity: 1,
    amount: 0,
    currency: 'TRY',
    payment_method: 'cash',
    category: 'other',
    description: ''
  });

  const units = [
    { value: 'pieces', label: 'Pieces', color: 'bg-green-100 text-green-800' },
    { value: 'kgs', label: 'KGs', color: 'bg-red-100 text-red-800' },
    { value: 'liters', label: 'Liters', color: 'bg-blue-100 text-blue-800' },
    { value: 'boxes', label: 'Boxes', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'packets', label: 'Packets', color: 'bg-purple-100 text-purple-800' },
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Cash Payment', color: 'bg-green-100 text-green-800' },
    { value: 'isbank', label: 'Isbank Payment', color: 'bg-red-100 text-red-800' },
    { value: 'naira', label: 'Naira Payment', color: 'bg-blue-100 text-blue-800' },
    { value: 'card', label: 'Card Payment', color: 'bg-purple-100 text-purple-800' },
    { value: 'transfer', label: 'Transfer', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
  ];

  const categories = [
    { value: 'food', label: 'Food' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other', label: 'Other' }
  ];

  const currencies = [
    { value: 'TRY', label: '₺ (Turkish Lira)' },
    { value: 'USD', label: '$ (US Dollar)' },
    { value: 'NGN', label: '₦ (Nigerian Naira)' },
    { value: 'EUR', label: '€ (Euro)' }
  ];

  const dateRangeOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_year', label: 'This Year' }
  ];

  useEffect(() => {
    loadExpenses();
    loadStats();
  }, [currentPage, searchTerm, filterCategory, filterPaymentMethod, filterDateRange]);

  const getDateRange = (range: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return {
          start_date: today.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0]
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          start_date: yesterday.toISOString().split('T')[0],
          end_date: yesterday.toISOString().split('T')[0]
        };
      case 'this_week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return {
          start_date: startOfWeek.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0]
        };
      case 'this_month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start_date: startOfMonth.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0]
        };
      case 'this_year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return {
          start_date: startOfYear.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0]
        };
      default:
        return {
          start_date: undefined,
          end_date: undefined
        };
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange(filterDateRange);
      const result = await apiService.getExpenses({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        category: filterCategory,
        payment_method: filterPaymentMethod,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        store_id: user?.store_id
      });
      setExpenses(result.expenses);
      setTotalPages(result.pages);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await apiService.getExpenseStats({
        store_id: user?.store_id
      });
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load expense stats:', error);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createExpense(newExpense);
      toast.success('Expense added successfully');
      setShowAddExpense(false);
      setNewExpense({
        store_id: user?.store_id || '',
        date: new Date().toISOString().split('T')[0],
        product_name: '',
        unit: 'pieces',
        quantity: 1,
        amount: 0,
        currency: 'TRY',
        payment_method: 'cash',
        category: 'other',
        description: ''
      });
      loadExpenses();
      loadStats();
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  const handleEditExpense = async (updatedExpense: Expense) => {
    try {
      await apiService.updateExpense(updatedExpense._id, updatedExpense);
      toast.success('Expense updated successfully');
      setShowEditExpense(null);
      loadExpenses();
      loadStats();
    } catch (error) {
      toast.error('Failed to update expense');
    }
  };

  const handleEditExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showEditExpense) {
      await handleEditExpense(showEditExpense);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await apiService.deleteExpense(expenseId);
      toast.success('Expense deleted successfully');
      setShowDeleteConfirm(null);
      loadExpenses();
      loadStats();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols = { TRY: '₺', USD: '$', NGN: '₦', EUR: '€' };
    return `${symbols[currency as keyof typeof symbols] || currency} ${amount.toLocaleString()}`;
  };

  const getUnitColor = (unit: string) => {
    return units.find(u => u.value === unit)?.color || 'bg-gray-100 text-gray-800';
  };

  const getPaymentMethodColor = (method: string) => {
    return paymentMethods.find(p => p.value === method)?.color || 'bg-gray-100 text-gray-800';
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 opacity-50"></div>
            <div className="relative p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Expense Management</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Track and manage your business expenses</p>
                </div>
              </div>
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <span className="ml-4 text-gray-500 dark:text-gray-400 text-lg">Loading expenses...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Modern Header */}
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 opacity-50"></div>
          <div className="relative p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Expense Management</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Track and manage your business expenses efficiently</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{stats?.totalExpenses || 0} total expenses</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>₺{stats?.totalAmount?.toLocaleString() || 0} total amount</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>{stats?.expensesByCategory?.length || 0} categories</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Expense</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 text-center hover:shadow-md transition-shadow duration-200">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Expenses</h3>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{stats.totalExpenses}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 text-center hover:shadow-md transition-shadow duration-200">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Amount</h3>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">₺{stats.totalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 text-center hover:shadow-md transition-shadow duration-200">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Package className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Categories</h3>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{stats.expensesByCategory.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 text-center hover:shadow-md transition-shadow duration-200">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Payment Methods</h3>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{stats.expensesByPaymentMethod.length}</p>
            </div>
          </div>
        )}

        {/* Enhanced Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
              <input
                type="text"
                placeholder="Search expenses by product name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label="Filter by date range"
              >
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label="Filter by payment method"
              >
                <option value="">All Payment Methods</option>
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          {expenses.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {expenses.map((expense) => (
                <div key={expense._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{expense.product_name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(expense.date).toLocaleDateString()} • {expense.quantity} {expense.unit}
                        </p>
                        {expense.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{expense.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(expense.amount, expense.currency)}
                        </p>
                      </div>

                      <div className="text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPaymentMethodColor(expense.payment_method)}`}>
                          {paymentMethods.find(p => p.value === expense.payment_method)?.label || expense.payment_method}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowEditExpense(expense)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                          title="Edit expense"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(expense._id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                          title="Delete expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <DollarSign className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">No expenses found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                {searchTerm || filterCategory || filterPaymentMethod || filterDateRange
                  ? 'Try adjusting your search terms or filter criteria to find expenses.'
                  : 'No expenses recorded yet. Add your first expense to get started.'
                }
              </p>
              {(searchTerm || filterCategory || filterPaymentMethod || filterDateRange) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('');
                    setFilterPaymentMethod('');
                    setFilterDateRange('');
                  }}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Modal */}
        <Modal
          isOpen={showAddExpense}
          onClose={() => setShowAddExpense(false)}
          title="Add New Expense"
          size="lg"
          headerIcon={<Receipt className="h-6 w-6 text-white" />}
          headerColor="success"
          closeOnOverlayClick={true}
        >
                
                <form onSubmit={handleAddExpense} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
                      <input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                        aria-label="Select date"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Name *</label>
                      <input
                        type="text"
                        value={newExpense.product_name}
                        onChange={(e) => setNewExpense({ ...newExpense, product_name: e.target.value })}
                        placeholder="Enter product or service name"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <NumberInput
                          label="Quantity *"
                          value={newExpense.quantity}
                          onChange={(value) => setNewExpense({ ...newExpense, quantity: typeof value === 'number' ? value : parseFloat(value) || 0 })}
                          placeholder="Enter quantity"
                          min={0}
                          step={0.01}
                          precision={2}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit *</label>
                        <select
                          value={newExpense.unit}
                          onChange={(e) => setNewExpense({ ...newExpense, unit: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          aria-label="Select unit"
                        >
                          {units.map(unit => (
                            <option key={unit.value} value={unit.value}>{unit.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <NumberInput
                          label="Amount *"
                          value={newExpense.amount}
                          onChange={(value) => setNewExpense({ ...newExpense, amount: typeof value === 'number' ? value : parseFloat(value) || 0 })}
                          placeholder="0.00"
                          min={0}
                          step={0.01}
                          precision={2}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency *</label>
                        <select
                          value={newExpense.currency}
                          onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          aria-label="Select currency"
                        >
                          {currencies.map(currency => (
                            <option key={currency.value} value={currency.value}>{currency.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method *</label>
                        <select
                          value={newExpense.payment_method}
                          onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          aria-label="Select payment method"
                        >
                          {paymentMethods.map(method => (
                            <option key={method.value} value={method.value}>{method.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                        <select
                          value={newExpense.category}
                          onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          aria-label="Select category"
                        >
                          {categories.map(category => (
                            <option key={category.value} value={category.value}>{category.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <textarea
                        value={newExpense.description || ''}
                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                        rows={3}
                        placeholder="Optional description or notes"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowAddExpense(false)}
                      className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl shadow-lg transition-all duration-200 font-medium"
                    >
                      Add Expense
                    </button>
                  </div>
                </form>
        </Modal>

        {/* Edit Expense Modal */}
        <Modal
          isOpen={!!showEditExpense}
          onClose={() => setShowEditExpense(null)}
          title="Edit Expense"
          size="lg"
          headerIcon={<Edit className="h-6 w-6 text-white" />}
          headerColor="info"
          closeOnOverlayClick={true}
        >
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (showEditExpense) {
                    handleEditExpense(showEditExpense);
                  }
                }} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
                      <input
                        type="date"
                        value={showEditExpense?.date || ''}
                        onChange={(e) => showEditExpense && setShowEditExpense({ ...showEditExpense, date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                        aria-label="Select date"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Name *</label>
                      <input
                        type="text"
                        value={showEditExpense?.product_name || ''}
                        onChange={(e) => showEditExpense && setShowEditExpense({ ...showEditExpense, product_name: e.target.value })}
                        placeholder="Enter product or service name"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <NumberInput
                          label="Quantity *"
                          value={showEditExpense?.quantity || 0}
                          onChange={(value) => showEditExpense && setShowEditExpense({ ...showEditExpense, quantity: typeof value === 'number' ? value : parseFloat(String(value)) || 0 })}
                          placeholder="Enter quantity"
                          min={0}
                          step={0.01}
                          precision={2}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit *</label>
                        <select
                          value={showEditExpense?.unit || ''}
                          onChange={(e) => showEditExpense && setShowEditExpense({ ...showEditExpense, unit: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          aria-label="Select unit"
                        >
                          {units.map(unit => (
                            <option key={unit.value} value={unit.value}>{unit.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <NumberInput
                          label="Amount *"
                          value={showEditExpense?.amount || 0}
                          onChange={(value) => showEditExpense && setShowEditExpense({ ...showEditExpense, amount: typeof value === 'number' ? value : parseFloat(String(value)) || 0 })}
                          placeholder="0.00"
                          min={0}
                          step={0.01}
                          precision={2}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency *</label>
                        <select
                          value={showEditExpense?.currency || ''}
                          onChange={(e) => showEditExpense && setShowEditExpense({ ...showEditExpense, currency: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          aria-label="Select currency"
                        >
                          {currencies.map(currency => (
                            <option key={currency.value} value={currency.value}>{currency.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method *</label>
                        <select
                          value={showEditExpense?.payment_method || ''}
                          onChange={(e) => showEditExpense && setShowEditExpense({ ...showEditExpense, payment_method: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          aria-label="Select payment method"
                        >
                          {paymentMethods.map(method => (
                            <option key={method.value} value={method.value}>{method.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                        <select
                          value={showEditExpense?.category || ''}
                          onChange={(e) => showEditExpense && setShowEditExpense({ ...showEditExpense, category: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          aria-label="Select category"
                        >
                          {categories.map(category => (
                            <option key={category.value} value={category.value}>{category.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <textarea
                        value={showEditExpense?.description || ''}
                        onChange={(e) => showEditExpense && setShowEditExpense({ ...showEditExpense, description: e.target.value })}
                        rows={3}
                        placeholder="Optional description or notes"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowEditExpense(null)}
                      className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl shadow-lg transition-all duration-200 font-medium"
                    >
                      Update Expense
                    </button>
                  </div>
                </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          title="Delete Expense"
          size="md"
          headerIcon={<AlertCircle className="h-6 w-6 text-white" />}
          headerColor="error"
          closeOnOverlayClick={true}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to delete this expense? This action cannot be undone and will permanently remove the expense from your records.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => showDeleteConfirm && handleDeleteExpense(showDeleteConfirm)}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg transition-all duration-200 font-medium"
              >
                Delete Expense
              </button>
            </div>
          </div>
        </Modal>
        </div>
      </div>
    </>
  );
};
