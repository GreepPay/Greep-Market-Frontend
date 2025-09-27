import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AlertTriangle, Package, TrendingDown, TrendingUp, Filter, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { BackButton } from '../components/ui/BackButton';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

export const Inventory: React.FC = () => {
  const { inventoryAlerts, updateProduct, refreshDashboard } = useApp();
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'normal'>('all');
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load products from server with filtering
  const loadProducts = useCallback(async () => {
    if (!user?.store_id) return;
    
    setIsLoadingProducts(true);
    try {
      const response = await apiService.getProducts({
        store_id: user.store_id,
        search: searchQuery,
        // Note: API doesn't support stock level filtering yet
        // This would need to be implemented on the backend
      });
      
      setProducts(response.products);
      setTotalPages(1); // No pagination - all products on one page
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [user?.store_id, currentPage, searchQuery]);

  // Load products when filters change
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesFilter = true;
      if (selectedFilter === 'low_stock') {
        matchesFilter = product.stock_quantity <= product.min_stock_level && product.stock_quantity > 0;
      } else if (selectedFilter === 'out_of_stock') {
        matchesFilter = product.stock_quantity === 0;
      } else if (selectedFilter === 'normal') {
        matchesFilter = product.stock_quantity > product.min_stock_level;
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [products, searchQuery, selectedFilter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleRefresh = () => {
    loadProducts();
  };

  const handleRestock = (product: any) => {
    setSelectedProduct(product);
    setRestockQuantity('');
    setIsRestockModalOpen(true);
  };

  const processRestock = () => {
    if (!selectedProduct || !restockQuantity || parseFloat(restockQuantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const newQuantity = selectedProduct.stock_quantity + parseFloat(restockQuantity);
    updateProduct(selectedProduct._id, { 
      stock_quantity: newQuantity,
    });

    setIsRestockModalOpen(false);
    setSelectedProduct(null);
    setRestockQuantity('');
    toast.success(`Restocked ${selectedProduct.name} with ${restockQuantity} units`);
  };

  const getStockStatus = (product: any) => {
    if (product.stock_quantity === 0) {
      return { status: 'out_of_stock', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/20', label: 'Out of Stock' };
    } else if (product.stock_quantity <= product.min_stock_level) {
      return { status: 'low_stock', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20', label: 'Low Stock' };
    } else {
      return { status: 'normal', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/20', label: 'In Stock' };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  const filterOptions = [
    { value: 'all', label: 'All Products', count: (products || []).length },
    { value: 'low_stock', label: 'Low Stock', count: (products || []).filter(p => p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0).length },
    { value: 'out_of_stock', label: 'Out of Stock', count: (products || []).filter(p => p.stock_quantity === 0).length },
    { value: 'normal', label: 'Normal Stock', count: (products || []).filter(p => p.stock_quantity > p.min_stock_level).length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <BackButton />
            <Breadcrumb />
          </div>
        </div>
        {/* Modern Header */}
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 opacity-50"></div>
          <div className="relative p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
                    <p className="text-gray-600 dark:text-gray-400">Monitor stock levels and manage inventory efficiently</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{products.length} total products</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{(products || []).filter(p => p.stock_quantity > p.min_stock_level).length} in stock</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>{(products || []).filter(p => p.stock_quantity === 0).length} out of stock</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => refreshDashboard()}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Products</h3>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">{products.length}</p>
          </Card>

          <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">In Stock</h3>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {(products || []).filter(p => p.stock_quantity > p.min_stock_level).length}
            </p>
          </Card>

          <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Low Stock</h3>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {(products || []).filter(p => p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0).length}
            </p>
          </Card>

          <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Out of Stock</h3>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {(products || []).filter(p => p.stock_quantity === 0).length}
            </p>
          </Card>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <SearchBar
                placeholder="Search products by name, barcode, or SKU..."
                onSearch={handleSearch}
                showBarcodeButton={false}
              />
            </div>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-3">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSelectedFilter(option.value as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    selectedFilter === option.value
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-sm'
                  }`}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Alerts */}
        {inventoryAlerts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Inventory Alerts</h3>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div className="space-y-3">
              {inventoryAlerts.map(alert => (
                <div key={alert._id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{alert.product_name}</p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {alert.alert_type === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'} • 
                      {alert.current_quantity} remaining (min: {alert.min_stock_level})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      alert.alert_type === 'out_of_stock' 
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    }`}>
                      {alert.alert_type === 'out_of_stock' ? 'Critical' : 'Warning'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products List */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-4">
            {filteredProducts.map(product => {
              const stockStatus = getStockStatus(product);
              return (
                <div key={product._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {product.category} • SKU: {product.sku}
                        </p>
                        {product.barcode && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                            Barcode: {product.barcode}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current Stock</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {product.stock_quantity} {product.unit}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Min: {product.min_stock_level} {product.unit}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                        <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                          {formatPrice(product.price)}
                        </p>
                      </div>

                      <div className="text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${stockStatus.bgColor} ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleRestock(product)}
                        className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                      >
                        Restock
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Filter className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No products found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                {searchQuery || selectedFilter !== 'all' 
                  ? 'Try adjusting your search terms or filter criteria to find products.'
                  : 'No products in inventory. Add some products to get started.'
                }
              </p>
              {(searchQuery || selectedFilter !== 'all') && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Restock Modal */}
        <Modal
          isOpen={isRestockModalOpen}
          onClose={() => setIsRestockModalOpen(false)}
          title="Restock Product"
          size="md"
        >
          {selectedProduct && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Product Details</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <strong>Name:</strong> {selectedProduct.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <strong>Current Stock:</strong> {selectedProduct.stock_quantity} {selectedProduct.unit}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Minimum Stock:</strong> {selectedProduct.min_stock_level} {selectedProduct.unit}
                </p>
              </div>

              <Input
                label="Quantity to Add"
                type="number"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                placeholder="Enter quantity"
                helperText="Enter the number of units to add to current stock"
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsRestockModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={processRestock}>
                  Restock Product
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};
