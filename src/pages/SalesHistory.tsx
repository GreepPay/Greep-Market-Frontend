import React, { useState, useMemo } from 'react';
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
  EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';

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
  paymentMethod: string;
  customerId?: string;
}

export const SalesHistory: React.FC = () => {
  const { sales, products, loading, loadTransactions } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showTransactionIds, setShowTransactionIds] = useState(false);

  // Process sales data to extract sold products
  const soldProducts = useMemo(() => {
    if (!sales || !products || !Array.isArray(sales) || !Array.isArray(products)) {
      return [];
    }

    const soldItems: SoldProduct[] = [];
    
    sales.forEach((transaction: Transaction) => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item: any) => {
          const product = products.find(p => p._id === item.product_id);
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
              paymentMethod: transaction.payment_method,
              customerId: transaction.customer_id
            });
          }
        });
      }
    });

    // Sort by most recent sales first
    return soldItems.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());
  }, [sales, products]);

  // Get unique categories from sold products
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(soldProducts.map(item => item.category)));
    return ['all', ...uniqueCategories.sort()];
  }, [soldProducts]);

  // Get unique tags from sold products
  const availableTags = useMemo(() => {
    const allTags = soldProducts.flatMap(item => item.tags);
    
    // Debug logging
    if (soldProducts.length > 0) {
      console.log('=== SALES HISTORY TAGS DEBUG ===');
      console.log('Total sold products:', soldProducts.length);
      console.log('Sample sold product:', soldProducts[0]);
      console.log('All tags from sold products:', allTags);
      console.log('Available tags:', Array.from(new Set(allTags)));
      console.log('================================');
    }
    
    return Array.from(new Set(allTags)).sort();
  }, [soldProducts]);

  // Get available years from sales data
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(
      soldProducts.map(item => item.saleDate.getFullYear())
    ));
    return years.sort((a, b) => b - a); // Most recent first
  }, [soldProducts]);

  // Get months for selected year
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(
      soldProducts
        .filter(item => item.saleDate.getFullYear().toString() === selectedYear)
        .map(item => item.saleDate.getMonth())
    ));
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return months
      .sort((a, b) => a - b)
      .map(month => ({ value: month.toString(), label: monthNames[month] }));
  }, [soldProducts, selectedYear]);

  // Filter sold products based on search and filters
  const filteredProducts = useMemo(() => {
    return soldProducts.filter(item => {
      // Search filter
      const matchesSearch = !searchQuery || 
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      // Tags filter
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => item.tags.includes(tag));

      // Month filter
      const matchesMonth = selectedMonth === 'all' || 
        item.saleDate.getMonth().toString() === selectedMonth;

      // Year filter
      const matchesYear = item.saleDate.getFullYear().toString() === selectedYear;

      return matchesSearch && matchesCategory && matchesTags && matchesMonth && matchesYear;
    });
  }, [soldProducts, searchQuery, selectedCategory, selectedTags, selectedMonth, selectedYear]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalRevenue = filteredProducts.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalQuantity = filteredProducts.reduce((sum, item) => sum + item.quantitySold, 0);
    const uniqueProducts = new Set(filteredProducts.map(item => item.productId)).size;
    const totalTransactions = new Set(filteredProducts.map(item => item.transactionId)).size;

    return {
      totalRevenue,
      totalQuantity,
      uniqueProducts,
      totalTransactions
    };
  }, [filteredProducts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
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
      await loadTransactions();
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sales Summary</h1>
                <p className="text-gray-600">View and analyze your sold products with detailed insights</p>
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
                className={`flex items-center space-x-2 ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
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
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
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

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₺{summaryStats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">From {summaryStats.totalTransactions} transactions</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Items Sold</p>
                <p className="text-3xl font-bold text-gray-900">{summaryStats.totalQuantity.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Across all categories</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Package className="h-7 w-7 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Unique Products</p>
                <p className="text-3xl font-bold text-gray-900">{summaryStats.uniqueProducts}</p>
                <p className="text-xs text-gray-500 mt-1">Different items sold</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Transactions</p>
                <p className="text-3xl font-bold text-gray-900">{summaryStats.totalTransactions}</p>
                <p className="text-xs text-gray-500 mt-1">Completed sales</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
                <Calendar className="h-7 w-7 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Filters */}
        {showFilters && (
          <Card className="p-6 border border-blue-200 bg-blue-50/30">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
                </div>
                <Button variant="outline" size="sm" onClick={clearAllFilters} className="text-red-600 border-red-200 hover:bg-red-50">
                  Clear All Filters
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Package className="h-4 w-4 inline mr-1" />
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  <label className="block text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setSelectedMonth('all');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    aria-label="Select year"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year.toString()}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Month Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  <label className="block text-sm font-medium text-gray-700">
                    <TrendingUp className="h-4 w-4 inline mr-1" />
                    Tags
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-white">
                    {availableTags.length > 0 ? (
                      <div className="space-y-2">
                        {availableTags.map(tag => (
                          <label key={tag} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedTags.includes(tag)}
                              onChange={() => handleTagToggle(tag)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 font-medium">{tag}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No tags available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {(selectedCategory !== 'all' || selectedTags.length > 0 || selectedMonth !== 'all') && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Active Filters:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory !== 'all' && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        Category: {selectedCategory}
                      </span>
                    )}
                    {selectedMonth !== 'all' && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        Month: {availableMonths.find(m => m.value === selectedMonth)?.label}
                      </span>
                    )}
                    {selectedTags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Enhanced Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
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

        {/* Enhanced Results Count */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-gray-400" />
                <p className="text-gray-700 font-medium">
                  Showing <span className="text-blue-600 font-bold">{filteredProducts.length}</span> of <span className="text-gray-900 font-bold">{soldProducts.length}</span> sold items
                </p>
              </div>
            </div>
            {filteredProducts.length > 0 && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Filtered Revenue</p>
                  <p className="text-lg font-bold text-green-600">₺{summaryStats.totalRevenue.toLocaleString()}</p>
                </div>
                {soldProducts.length !== filteredProducts.length && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-lg font-bold text-gray-600">₺{soldProducts.reduce((sum, item) => sum + item.totalRevenue, 0).toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Products Display */}
        {filteredProducts.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {viewMode === 'list' ? (
              /* Table View for List Mode */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      {showTransactionIds && (
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((item, index) => (
                      <tr key={`${item.transactionId}-${item.productId}-${index}`} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                                +{item.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {item.quantitySold}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          ₺{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                          ₺{item.totalRevenue.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.saleDate.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                            item.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                            item.paymentMethod === 'pos' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {item.paymentMethod}
                          </span>
                        </td>
                        {showTransactionIds && (
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                            #{item.transactionId.slice(-8)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Grid View */
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((item, index) => (
                    <Card key={`${item.transactionId}-${item.productId}-${index}`} className="p-5 hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900 text-lg leading-tight">{item.productName}</h3>
                          {showTransactionIds && (
                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                              #{item.transactionId.slice(-6)}
                            </span>
                          )}
                        </div>
                        
                        {/* Category and Tags */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                              {item.category}
                            </span>
                          </div>
                          
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {item.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                  {tag}
                                </span>
                              ))}
                              {item.tags.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                                  +{item.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Sales Details */}
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Quantity</p>
                              <p className="text-lg font-semibold text-gray-900">{item.quantitySold}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Unit Price</p>
                              <p className="text-lg font-semibold text-gray-900">₺{item.unitPrice.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-green-800">Total Revenue</span>
                              <span className="text-xl font-bold text-green-600">₺{item.totalRevenue.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{item.saleDate.toLocaleDateString()}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                              item.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                              item.paymentMethod === 'pos' ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {item.paymentMethod}
                            </span>
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
          <Card className="p-12 text-center bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sales Found</h3>
              <p className="text-gray-600 mb-6">
                {soldProducts.length === 0 
                  ? "No sales have been recorded yet. Start making sales to see them here."
                  : "No sales match your current filters. Try adjusting your search criteria."
                }
              </p>
              {soldProducts.length === 0 ? (
                <Button onClick={() => window.location.href = '/pos'} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Go to POS
                </Button>
              ) : (
                <Button onClick={clearAllFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
