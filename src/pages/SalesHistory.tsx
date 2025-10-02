import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Filter, 
  Download, 
  Package, 
  TrendingUp, 
  DollarSign,
  Grid,
  List,
  X,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Coins
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SmartNavButton } from '../components/ui/SmartNavButton';
import { BackButton } from '../components/ui/BackButton';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { EditTransactionModal } from '../components/ui/EditTransactionModal';
import { PaymentMethodsDisplay } from '../components/ui/PaymentMethodsDisplay';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Transaction, PaymentMethod } from '../types';
import { apiService } from '../services/api';

interface SoldProduct {
  productId: string;
  productName: string;
  category: string;
  tags: string[];
  quantitySold: number;
  unitPrice: number;
  totalRevenue: number;
  saleDate: Date;
  transactionId: string;
  paymentMethods: PaymentMethod[];
  paymentMethod: string; // Legacy field for backward compatibility
  customerId?: string;
}

export const SalesHistory: React.FC = () => {
  const { products, loading } = useApp();
  const { user } = useAuth();
  const [allSales, setAllSales] = useState<Transaction[]>([]); // All transactions for calculations
  const [sales, setSales] = useState<Transaction[]>([]); // Paginated transactions for display
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);

  // Auto-show filters if any filters are active
  useEffect(() => {
    const hasActiveFilters = selectedCategory !== 'all' || 
                           selectedTags.length > 0 || 
                           selectedMonth !== 'all' || 
                           selectedYear !== new Date().getFullYear().toString() ||
                           searchQuery.trim() !== '';
    
    if (hasActiveFilters && !showFilters) {
      setShowFilters(true);
    }
  }, [selectedCategory, selectedTags, selectedMonth, selectedYear, searchQuery, showFilters]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [itemsPerPage] = useState(20); // Display pagination
  const [exportLoading, setExportLoading] = useState(false);
  const [showTransactionIds, setShowTransactionIds] = useState(false);
  const [sortField, setSortField] = useState<keyof SoldProduct>('saleDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Edit/Delete functionality
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

  // Update paginated sales for display
  const updatePaginatedSales = useCallback((transactions: Transaction[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);
    setSales(paginatedTransactions);
  }, [currentPage, itemsPerPage]);

  // Load all sales data from server (without filters)
  const loadAllSales = useCallback(async () => {
    console.log('🚀 Loading sales data...', { 
      store_id: user?.store_id, 
      user_id: user?.id,
      isAuthenticated: !!user 
    });
    
    if (!user?.store_id) {
      console.warn('⚠️ No store_id found for user:', user);
      toast.error('Store ID not found. Please contact support.');
      return;
    }
    
    setIsLoadingSales(true);
    try {
      // Load ALL transactions without any filters
      console.log('🔍 Sales History - Making API call with params:', {
        store_id: user.store_id,
        page: 1,
        limit: 1000
      });
      
      const response = await apiService.getTransactions({
        store_id: user.store_id,
        page: 1,
        limit: 1000, // Large limit to get all transactions
      });
      
      console.log('🔍 Sales History - Raw API Response:', response);
      
      console.log('📊 API Response:', {
        totalTransactions: response.transactions?.length || 0,
        total: response.total,
        transactions: response.transactions?.slice(0, 3) // First 3 transactions for debugging
      });
      
      // Store all transactions for calculations
      setAllSales(response.transactions || []);
      setTotalPages(response.total || 1);
      setTotalSales(response.total || 0);
      
      // Debug: Log all loaded transactions with payment method data
      console.log('🔍 Sales History - Loaded Transactions:', {
        totalTransactions: response.transactions?.length || 0,
        transactions: response.transactions?.map(t => ({
          id: t._id,
          total_amount: t.total_amount,
          payment_methods: t.payment_methods,
          payment_method: t.payment_method,
          created_at: t.created_at
        })) || []
      });
      
    } catch (error) {
      console.error('❌ Failed to load sales:', error);
      toast.error('Failed to load sales data');
    } finally {
      setIsLoadingSales(false);
    }
  }, [user?.store_id]);

  // Apply client-side filtering to the loaded data
  const loadSales = useCallback(async () => {
    // Just trigger a re-render to apply client-side filters
    // The actual filtering is done in the filteredProducts useMemo
  }, []);

  // Load all sales data on initial mount
  useEffect(() => {
    loadAllSales();
  }, [loadAllSales]);


  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Handle edit transaction
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  // Handle save transaction changes
  const handleSaveTransaction = async (transactionId: string, updates: any) => {
    try {
      await apiService.updateTransaction(transactionId, updates);
      
      // Reload sales data to reflect changes
      await loadSales();
      
      toast.success('Transaction updated successfully');
    } catch (error: any) {
      console.error('Failed to update transaction:', error);
      const errorMessage = error.message || 'Failed to update transaction';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Handle delete transaction
  const handleDeleteTransaction = async (transactionId: string) => {
    if (!isAdmin) {
      toast.error('Only admins can delete transactions');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this transaction? This action cannot be undone and will affect inventory levels.'
    );

    if (!confirmed) return;

    try {
      setDeletingTransactionId(transactionId);
      await apiService.deleteTransaction(transactionId);
      
      // Reload sales data to reflect changes
      await loadSales();
      
      toast.success('Transaction deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete transaction:', error);
      const errorMessage = error.message || 'Failed to delete transaction';
      toast.error(errorMessage);
    } finally {
      setDeletingTransactionId(null);
    }
  };

  // Process sales data to extract sold products (use allSales for calculations)
  const soldProducts = useMemo(() => {
    console.log('🔄 Processing sold products...', {
      allSalesLength: allSales?.length || 0,
      productsLength: products?.length || 0,
      allSalesIsArray: Array.isArray(allSales),
      productsIsArray: Array.isArray(products)
    });
    
    if (!allSales || !products || !Array.isArray(allSales) || !Array.isArray(products)) {
      console.log('⚠️ Missing data for sold products calculation');
      return [];
    }

    const soldItems: SoldProduct[] = [];
    
    allSales.forEach((transaction: Transaction) => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item: any) => {
          // Try different possible field names for product ID
          const productId = item.product_id || item.productId || item._id;
          
          const product = products.find(p => p._id === productId);
          
          if (product) {
            // Ensure tags is always an array
            let productTags: string[] = [];
            const rawTags = product.tags;
            
            if (Array.isArray(rawTags)) {
              productTags = rawTags;
            } else if (typeof rawTags === 'string') {
              // If tags is a string, try to parse it as JSON or split by comma
              try {
                const parsed = JSON.parse(rawTags);
                productTags = Array.isArray(parsed) ? parsed : [];
              } catch {
                // If JSON.parse fails, treat it as a comma-separated string
                const tagsString = rawTags as string;
                productTags = tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
              }
            }
            
            // Handle both new (payment_methods array) and legacy (single payment_method) formats
            let paymentMethods: PaymentMethod[] = [];
            let paymentMethod: string = 'cash';
            
            
            if (transaction.payment_methods && transaction.payment_methods.length > 0) {
              // New format: payment_methods array
              paymentMethods = transaction.payment_methods;
              paymentMethod = transaction.payment_methods[0].type;
            } else if (transaction.payment_method) {
              // Legacy format: single payment_method field
              paymentMethod = transaction.payment_method;
              paymentMethods = [{
                type: transaction.payment_method as 'cash' | 'pos_isbank_transfer' | 'naira_transfer' | 'crypto_payment' | 'card',
                amount: transaction.total_amount
              }];
            }
            
            
            soldItems.push({
              productId: product._id,
              productName: product.name,
              category: product.category,
              tags: Array.isArray(productTags) ? productTags : [],
              quantitySold: item.quantity,
              unitPrice: item.unit_price,
              totalRevenue: item.quantity * item.unit_price,
              saleDate: new Date(transaction.created_at),
              transactionId: transaction._id,
              paymentMethods: paymentMethods,
              paymentMethod: paymentMethod,
              customerId: transaction.customer_id
            });
          }
        });
      }
    });

    // Sort by most recent sales first
    const sortedItems = soldItems.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());
    
    console.log('✅ Sold products processed:', {
      totalSoldItems: sortedItems.length,
      sampleItems: sortedItems.slice(0, 2)
    });
    
    return sortedItems;
  }, [allSales, products]);

  // Get unique categories from sold products
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(soldProducts.map(item => item.category)));
    return ['all', ...uniqueCategories.sort()];
  }, [soldProducts]);

  // Get unique tags from sold products
  const availableTags = useMemo(() => {
    const allTags = soldProducts.flatMap(item => item.tags);
    return Array.from(new Set(allTags)).sort();
  }, [soldProducts]);

  // Get available years - use a range of years since we're using API filtering
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    // Generate years from 2020 to current year + 1
    for (let year = 2020; year <= currentYear + 1; year++) {
      years.push(year);
    }
    
    return years.sort((a, b) => b - a); // Most recent first
  }, []);

  // Get months for selected year - use all months since we're using API filtering
  const availableMonths = useMemo(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Return all months since API filtering handles the actual filtering
    return monthNames.map((name, index) => ({ 
      value: index.toString(), 
      label: name 
    }));
  }, []);

  // Apply client-side filtering to sold products
  const filteredProducts = useMemo(() => {
    let filtered = soldProducts;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.productName.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Apply tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item => 
        selectedTags.some(tag => item.tags.includes(tag))
      );
    }

    // Apply month filter
    if (selectedMonth !== 'all') {
      const month = parseInt(selectedMonth);
      filtered = filtered.filter(item => item.saleDate.getMonth() === month);
    }

    // Apply year filter
    if (selectedYear !== 'all') {
      const year = parseInt(selectedYear);
      filtered = filtered.filter(item => item.saleDate.getFullYear() === year);
    }

    // Sort the filtered results
    return filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle date sorting
      if (sortField === 'saleDate') {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      }

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [soldProducts, searchQuery, selectedCategory, selectedTags, selectedMonth, selectedYear, sortField, sortDirection]);

  // Update paginated sales when page changes or filtered products change
  useEffect(() => {
    if (filteredProducts.length > 0) {
      // Convert filtered products back to transactions for pagination
      const filteredTransactions = allSales.filter(transaction => 
        filteredProducts.some(product => product.transactionId === transaction._id)
      );
      updatePaginatedSales(filteredTransactions);
      
      // Update totals based on filtered results
      setTotalSales(filteredProducts.length);
      setTotalPages(Math.ceil(filteredProducts.length / itemsPerPage));
    } else {
      setSales([]);
      setTotalSales(0);
      setTotalPages(1);
    }
  }, [filteredProducts, allSales, updatePaginatedSales, itemsPerPage]);

  // Calculate summary statistics using filtered data
  const summaryStats = useMemo(() => {
    // Get unique transactions from filtered products
    const uniqueTransactionIds = new Set(filteredProducts.map(item => item.transactionId));
    const filteredTransactions = allSales.filter(transaction => uniqueTransactionIds.has(transaction._id));
    
    // Calculate totals from transaction data (not individual products)
    const totalRevenue = filteredTransactions.reduce((sum, transaction) => sum + transaction.total_amount, 0);
    const totalQuantity = filteredProducts.reduce((sum, item) => sum + item.quantitySold, 0);
    const uniqueProducts = new Set(filteredProducts.map(item => item.productId)).size;
    const totalTransactions = filteredTransactions.length;

    // Debug logging to verify calculations
    console.log('SalesHistory Revenue Calculation Debug:', {
      filteredProductsCount: filteredProducts.length,
      filteredTransactionsCount: filteredTransactions.length,
      totalRevenueFromTransactions: totalRevenue,
      totalRevenueFromProducts: filteredProducts.reduce((sum, item) => sum + item.totalRevenue, 0),
      totalQuantity,
      uniqueProducts,
      totalTransactions
    });

    return {
      totalRevenue,
      totalQuantity,
      uniqueProducts,
      totalTransactions,
      filteredTransactions // Include filtered transactions for payment method calculations
    };
  }, [filteredProducts, allSales]);

  // Calculate payment method amounts from filtered transactions
  const paymentMethodAmounts = useMemo(() => {
    const result = summaryStats.filteredTransactions.reduce((acc, transaction) => {
      
      // Handle multiple payment methods
      if (transaction.payment_methods && transaction.payment_methods.length > 0) {
        transaction.payment_methods.forEach(method => {
          // Map payment method types to display keys
          let methodKey: string;
          switch (method.type) {
            case 'pos_isbank_transfer':
            case 'card': // Legacy support for card payments
              methodKey = 'pos';
              break;
            case 'naira_transfer':
              methodKey = 'transfer';
              break;
            case 'crypto_payment':
              methodKey = 'crypto';
              break;
            default:
              methodKey = method.type;
          }
          acc[methodKey] = (acc[methodKey] || 0) + method.amount;
        });
      } else if (transaction.payment_method) {
        // Fallback to legacy single payment method
        const method = transaction.payment_method.toLowerCase();
        let methodKey: string;
        switch (method) {
          case 'pos_isbank_transfer':
          case 'card': // Legacy support for card payments
            methodKey = 'pos';
            break;
          case 'naira_transfer':
            methodKey = 'transfer';
            break;
          case 'crypto_payment':
            methodKey = 'crypto';
            break;
          default:
            methodKey = method;
        }
        acc[methodKey] = (acc[methodKey] || 0) + transaction.total_amount;
      }
      return acc;
    }, {} as Record<string, number>);
    
    console.log('🔍 Sales History Payment Method Debug:', {
      totalTransactions: summaryStats.filteredTransactions.length,
      paymentMethodAmounts: result,
      sampleTransactions: summaryStats.filteredTransactions.slice(0, 3).map(t => ({
        id: t._id,
        total_amount: t.total_amount,
        payment_methods: t.payment_methods,
        payment_method: t.payment_method,
        created_at: t.created_at
      })),
      allTransactions: summaryStats.filteredTransactions.map(t => ({
        id: t._id,
        total_amount: t.total_amount,
        payment_methods: t.payment_methods,
        payment_method: t.payment_method
      }))
    });
    
    return result;
  }, [summaryStats.filteredTransactions]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    loadSales();
  };


  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSort = (field: keyof SoldProduct) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTags([]);
    setSelectedMonth('all');
    setSelectedYear(new Date().getFullYear().toString());
  };

  const refreshData = async () => {
    try {
      await loadSales();
      toast.success('Sales data refreshed');
    } catch (error) {
      console.error('Failed to refresh sales data:', error);
      toast.error('Failed to refresh sales data');
    }
  };

  const exportToCSV = async () => {
    setExportLoading(true);
    try {
      const csvContent = [
        // CSV Header
        ['Product Name', 'Category', 'Tags', 'Quantity Sold', 'Unit Price', 'Total Revenue', 'Sale Date', 'Payment Method'].join(','),
        // CSV Data
        ...filteredProducts.map(item => [
          `"${item.productName}"`,
          `"${item.category}"`,
          `"${item.tags.join('; ')}"`,
          item.quantitySold,
          item.unitPrice.toFixed(2),
          item.totalRevenue.toFixed(2),
          item.saleDate.toLocaleDateString(),
          item.paymentMethod
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sales-history-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Sales history exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export sales history');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <BackButton />
            <Breadcrumb />
          </div>
        </div>

        
        {/* Enhanced Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Summary</h1>
                <p className="text-gray-600 dark:text-gray-400">View and analyze your sold products with detailed insights</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={refreshData}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 ${showFilters ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : ''}`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {showFilters && <X className="h-4 w-4 ml-1" />}
              </Button>
              <Button
                variant="outline"
                onClick={exportToCSV}
                disabled={exportLoading}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>{exportLoading ? 'Exporting...' : 'Export CSV'}</span>
              </Button>
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="!px-3"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="!px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search sold products by name, category, or tags..."
                onSearch={handleSearch}
                enableRealTime={true}
                debounceMs={300}
                showBarcodeButton={false}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowTransactionIds(!showTransactionIds)}
              className="flex items-center space-x-2"
            >
              {showTransactionIds ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showTransactionIds ? 'Hide IDs' : 'Show IDs'}</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Filters */}
        {showFilters && (
          <Card className="p-6 border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/20">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
                </div>
                <Button variant="outline" size="sm" onClick={clearAllFilters} className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20">
                  Clear All Filters
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Package className="h-4 w-4 inline mr-1" />
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    aria-label="Select category"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    aria-label="Select year"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year.toString()}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Month Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    aria-label="Select month"
                  >
                    <option value="all">All Months</option>
                    {availableMonths.map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>

                {/* Tags Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <TrendingUp className="h-4 w-4 inline mr-1" />
                    Tags
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700">
                    {availableTags.length > 0 ? (
                      <div className="space-y-2">
                        {availableTags.map(tag => (
                          <label key={tag} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedTags.includes(tag)}
                              onChange={() => handleTagToggle(tag)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{tag}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No tags available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {(selectedCategory !== 'all' || selectedTags.length > 0 || selectedMonth !== 'all') && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active Filters:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory !== 'all' && (
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-full">
                        Category: {selectedCategory}
                      </span>
                    )}
                    {selectedMonth !== 'all' && (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm rounded-full">
                        Month: {availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth}
                      </span>
                    )}
                    {selectedTags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-sm rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">₺{summaryStats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">From {summaryStats.totalTransactions} transactions</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Items Sold</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{summaryStats.totalQuantity.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Across all categories</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Package className="h-7 w-7 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Unique Products</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{summaryStats.uniqueProducts}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Different items sold</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Transactions</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{summaryStats.totalTransactions}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed sales</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
                <Calendar className="h-7 w-7 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Payment Method Statistics */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            Payment Methods
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cash Payments */}
            <Card className="p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Cash</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₺{(paymentMethodAmounts.cash || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
            </Card>

            {/* POS Payments */}
            <Card className="p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">POS</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₺{(paymentMethodAmounts.pos || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
              </div>
            </Card>

            {/* Transfer Payments */}
            <Card className="p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Transfer</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₺{(paymentMethodAmounts.transfer || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
            </Card>

            {/* Crypto Payments */}
            <Card className="p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Crypto</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₺{(paymentMethodAmounts.crypto || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                  <Coins className="h-5 w-5 text-white" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Enhanced Results Count */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  Showing <span className="text-blue-600 dark:text-blue-400 font-bold">{filteredProducts.length}</span> of <span className="text-gray-900 dark:text-white font-bold">{soldProducts.length}</span> sold items
                </p>
              </div>
            </div>
            {filteredProducts.length > 0 && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Filtered Revenue</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">₺{summaryStats.totalRevenue.toLocaleString()}</p>
                </div>
                {soldProducts.length !== filteredProducts.length && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                    <p className="text-lg font-bold text-gray-600 dark:text-gray-400">₺{sales.reduce((sum, transaction) => sum + transaction.total_amount, 0).toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Products Display */}
        {filteredProducts.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            {viewMode === 'list' ? (
              /* Enhanced Excel-like Table View */
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                    <tr>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 border-r border-gray-200 dark:border-gray-600"
                        onClick={() => handleSort('productName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Product Name</span>
                          {sortField === 'productName' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 border-r border-gray-200 dark:border-gray-600"
                        onClick={() => handleSort('category')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Category</span>
                          {sortField === 'category' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                        Tags
                      </th>
                      <th 
                        className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 border-r border-gray-200 dark:border-gray-600"
                        onClick={() => handleSort('quantitySold')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Quantity</span>
                          {sortField === 'quantitySold' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 border-r border-gray-200 dark:border-gray-600"
                        onClick={() => handleSort('unitPrice')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Unit Price</span>
                          {sortField === 'unitPrice' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 border-r border-gray-200 dark:border-gray-600"
                        onClick={() => handleSort('totalRevenue')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Total Revenue</span>
                          {sortField === 'totalRevenue' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 border-r border-gray-200 dark:border-gray-600"
                        onClick={() => handleSort('saleDate')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Sale Date</span>
                          {sortField === 'saleDate' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 border-r border-gray-200 dark:border-gray-600"
                        onClick={() => handleSort('paymentMethod')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Payment Method</span>
                          {sortField === 'paymentMethod' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </div>
                      </th>
                      {showTransactionIds && (
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Transaction ID
                        </th>
                      )}
                      {isAdmin && (
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800">
                    {filteredProducts.map((item, index) => (
                      <tr 
                        key={`${item.transactionId}-${item.productId}-${index}`} 
                        className={`hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150 border-b border-gray-200 dark:border-gray-700 ${
                          index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                          <div className="max-w-xs truncate" title={item.productName}>
                            {item.productName}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm border-r border-gray-200 dark:border-gray-700">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm border-r border-gray-200 dark:border-gray-700">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {item.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                +{item.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right border-r border-gray-200 dark:border-gray-700">
                          {item.quantitySold}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right border-r border-gray-200 dark:border-gray-700">
                          ₺{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400 text-right border-r border-gray-200 dark:border-gray-700">
                          ₺{item.totalRevenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                          {item.saleDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm border-r border-gray-200 dark:border-gray-700">
                          <PaymentMethodsDisplay 
                            paymentMethods={item.paymentMethods}
                            compact={true}
                            showAmounts={false}
                          />
                        </td>
                        {showTransactionIds && (
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono">
                            #{item.transactionId.slice(-8)}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => {
                                  const transaction = sales.find(t => t._id === item.transactionId);
                                  if (transaction) {
                                    handleEditTransaction(transaction);
                                  }
                                }}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200"
                                title="Edit Transaction"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(item.transactionId)}
                                disabled={deletingTransactionId === item.transactionId}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete Transaction"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-t-2 border-gray-300 dark:border-gray-600">
                    <tr>
                      <td colSpan={showTransactionIds ? (isAdmin ? 10 : 9) : (isAdmin ? 9 : 8)} className="px-4 py-3">
                        <div className="flex justify-between items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                          <div className="flex items-center space-x-6">
                            <span>Total Records: <span className="text-blue-600 dark:text-blue-400">{filteredProducts.length}</span></span>
                            <span>Total Quantity: <span className="text-green-600 dark:text-green-400">{summaryStats.totalQuantity}</span></span>
                          </div>
                          <div className="flex items-center space-x-6">
                            <span>Total Revenue: <span className="text-green-600 dark:text-green-400 font-bold">₺{summaryStats.totalRevenue.toLocaleString()}</span></span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              /* Grid View */
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((item, index) => (
                    <Card key={`${item.transactionId}-${item.productId}-${index}`} className="p-5 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">{item.productName}</h3>
                          {showTransactionIds && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              #{item.transactionId.slice(-6)}
                            </span>
                          )}
                        </div>
                        
                        {/* Category and Tags */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-full font-medium">
                              {item.category}
                            </span>
                          </div>
                          
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {item.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                                  {tag}
                                </span>
                              ))}
                              {item.tags.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                                  +{item.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Sales Details */}
                        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Quantity</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">{item.quantitySold}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Unit Price</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">₺{item.unitPrice.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-green-800 dark:text-green-300">Total Revenue</span>
                              <span className="text-xl font-bold text-green-600 dark:text-green-400">₺{item.totalRevenue.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                            <span>{item.saleDate.toLocaleDateString()}</span>
                            <PaymentMethodsDisplay 
                              paymentMethods={item.paymentMethods}
                              compact={true}
                              showAmounts={false}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <Card className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Sales Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {soldProducts.length === 0 
                  ? "No sales have been recorded yet. Start making sales to see them here."
                  : "No sales match your current filters. Try adjusting your search criteria."
                }
              </p>
              {soldProducts.length === 0 ? (
                <SmartNavButton to="/pos" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Go to POS
                </SmartNavButton>
              ) : (
                <Button onClick={clearAllFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        onSave={handleSaveTransaction}
      />
    </div>
  );
};
