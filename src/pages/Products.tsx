import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Filter, Grid, List, Package, Upload, Trash2, CheckSquare, Square, Download, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { ProductCard } from '../components/ui/ProductCard';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import ExcelImportModal from '../components/ExcelImportModal';
import { PriceUpdateModal } from '../components/ui/PriceUpdateModal';
import { PriceHistoryModal } from '../components/ui/PriceHistoryModal';
import CategorySelect from '../components/ui/CategorySelect';
import { TagsDropdown } from '../components/ui/TagsDropdown';
import { useApp } from '../context/AppContext';
import { Product, PriceHistory } from '../types';

export const Products: React.FC = () => {
  const { products, addProduct, updateProduct, updateProductPrice, getProductPriceHistory, deleteProduct, exportProducts, importProducts, loading, loadProducts, productsPagination } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    barcode: '',
    price: '',
    category: '',
    unit: 'piece',
    stock_quantity: '',
    min_stock_level: '5',
    description: '',
    sku: '',
    tags: [] as string[],
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [editingImages, setEditingImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isPriceUpdateModalOpen, setIsPriceUpdateModalOpen] = useState(false);
  const [isPriceHistoryModalOpen, setIsPriceHistoryModalOpen] = useState(false);
  const [priceUpdateProduct, setPriceUpdateProduct] = useState<Product | null>(null);
  const [priceHistoryProduct, setPriceHistoryProduct] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);

  const categories = useMemo(() => {
    if (!Array.isArray(products)) return ['all'];
    const uniqueCategories = Array.from(new Set(products.map(p => p.category)));
    return ['all', ...uniqueCategories];
  }, [products]);

  const existingTags = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const allTags = products.flatMap(p => p.tags || []);
    return Array.from(new Set(allTags));
  }, [products]);

  // Load products on initial mount
  useEffect(() => {
    loadProducts(1, 20, searchQuery, selectedCategory);
  }, [loadProducts, searchQuery, selectedCategory]); // Load initial page on mount

  // Load products when search query or category changes
  useEffect(() => {
    loadProducts(1, 20, searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory, loadProducts]);

  // Use products directly since filtering is now done server-side
  const filteredProducts = products || [];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reset to page 1 when searching
    loadProducts(1, 20, query, selectedCategory);
  };

  const handlePageChange = (newPage: number) => {
    loadProducts(newPage, 20, searchQuery, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Reset to page 1 when changing category
    loadProducts(1, 20, searchQuery, category);
  };


  const handleExcelImportSuccess = () => {
    // Refresh products list after successful import
    // The AppContext will automatically refresh the products
    toast.success('Products imported successfully!');
  };

  const handlePriceUpdate = (product: Product) => {
    setPriceUpdateProduct(product);
    setIsPriceUpdateModalOpen(true);
  };

  const handlePriceHistory = async (product: Product) => {
    setPriceHistoryProduct(product);
    setIsPriceHistoryModalOpen(true);
    
    try {
      const history = await getProductPriceHistory(product._id);
      setPriceHistory(history);
    } catch (error) {
      console.error('Failed to load price history:', error);
    }
  };

  const handlePriceUpdateSubmit = async (productId: string, newPrice: number, reason?: string) => {
    await updateProductPrice(productId, newPrice, reason);
    setPriceUpdateProduct(null);
    setIsPriceUpdateModalOpen(false);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.error('No products selected');
      return;
    }

    setIsBulkDeleting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const productId of selectedProducts) {
        try {
          await deleteProduct(productId);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Failed to delete product ${productId}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} products`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to delete ${errorCount} products`);
      }

      setSelectedProducts([]);
      setIsBulkDeleteModalOpen(false);
    } catch (error) {
      toast.error('Failed to delete products');
    } finally {
      setIsBulkDeleting(false);
    }
  };


  const handleExportProducts = async () => {
    try {
      await exportProducts();
    } catch (error) {
      console.error('Export products error:', error);
      // Error message is already shown by the exportProducts function
    }
  };

  const handleImportProducts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      toast.error('Please select a valid JSON file');
      return;
    }

    try {
      const result = await importProducts(file);
      console.log('Import completed:', result);
    } catch (error) {
      console.error('Import products error:', error);
      // Error message is already shown by the importProducts function
    } finally {
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      toast.error('Please fill in all required fields (Name, Price, Category)');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate SKU if not provided
      const sku = newProduct.sku || `SKU-${newProduct.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`;

      await addProduct({
        name: newProduct.name,
        description: newProduct.description || '',
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        sku: sku,
        barcode: newProduct.barcode || undefined,
        stock_quantity: parseInt(newProduct.stock_quantity) || 0,
        min_stock_level: parseInt(newProduct.min_stock_level) || 5,
        unit: newProduct.unit,
        weight: undefined,
        dimensions: undefined,
        images: [], // Will be populated by the API after image upload
        tags: newProduct.tags,
        is_active: true,
        is_featured: false,
        created_by: '',
        store_id: '',
      }, selectedImages); // Pass the selected images

      // Reset form
      setNewProduct({
        name: '',
        barcode: '',
        price: '',
        category: '',
        unit: 'piece',
        stock_quantity: '',
        min_stock_level: '5',
        description: '',
        sku: '',
        tags: [],
      });
      setSelectedImages([]);
      setIsAddModalOpen(false);
      // Success message is already shown by the addProduct function
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error('Failed to add product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      barcode: product.barcode || '',
      price: product.price.toString(),
      category: product.category,
      unit: product.unit,
      stock_quantity: product.stock_quantity.toString(),
      min_stock_level: product.min_stock_level.toString(),
      description: product.description || '',
      sku: product.sku,
      tags: product.tags,
    });
    setEditingImages([]); // Reset editing images
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !newProduct.name || !newProduct.price) {
      toast.error('Please fill in all required fields (Name, Price)');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProduct(editingProduct._id, {
        name: newProduct.name,
        description: newProduct.description || '',
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        sku: newProduct.sku,
        barcode: newProduct.barcode || undefined,
        stock_quantity: parseInt(newProduct.stock_quantity) || 0,
        min_stock_level: parseInt(newProduct.min_stock_level) || 5,
        unit: newProduct.unit,
        tags: newProduct.tags,
      }, editingImages.length > 0 ? editingImages : undefined);

      setIsEditModalOpen(false);
      setEditingProduct(null);
      setEditingImages([]);
      toast.success('Product updated successfully!');
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error('Failed to update product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProduct || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteProduct(deletingProduct._id);
      toast.success('Product deleted successfully!');
      setIsDeleteModalOpen(false);
      setDeletingProduct(null);
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      
      // Handle specific error cases
      if (error?.message?.includes('Product not found')) {
        toast.error('Product not found. It may have already been deleted.');
      } else if (error?.message?.includes('Unauthorized')) {
        toast.error('You are not authorized to delete this product.');
      } else if (error?.message?.includes('Network')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Failed to delete product. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteProduct = () => {
    setIsDeleteModalOpen(false);
    setDeletingProduct(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedImages(prev => [...prev, ...fileArray].slice(0, 5)); // Max 5 images
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setEditingImages(prev => [...prev, ...fileArray].slice(0, 5)); // Max 5 images
    }
  };

  const removeEditImage = (index: number) => {
    setEditingImages(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      barcode: '',
      price: '',
      category: '',
      unit: 'piece',
      stock_quantity: '',
      min_stock_level: '5',
      description: '',
      sku: '',
      tags: [],
    });
    setSelectedImages([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 pb-24">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-blue-50 opacity-50"></div>
            <div className="relative p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Product Catalog</h1>
                  <p className="text-sm text-gray-600">Manage and organize your inventory</p>
                </div>
              </div>
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" className="mr-4" />
                <span className="text-gray-500 text-lg">Loading products...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Modern Header */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-blue-50 opacity-50"></div>
          <div className="relative p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Product Catalog</h1>
                    <p className="text-sm text-gray-600">Manage and organize your inventory</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{filteredProducts.length} products</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{categories.length - 1} categories</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-row gap-3 items-center">
                {/* Secondary Actions */}
                <div className="flex gap-2">
                <Button 
                    onClick={() => navigate('/inventory')}
                  variant="outline"
                    size="md"
                  className="flex-shrink-0"
                >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Inventory
                </Button>
                <Button 
                    onClick={() => setIsExcelImportOpen(true)}
                  variant="outline"
                    size="md"
                  className="flex-shrink-0"
                >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Excel
                </Button>
                <Button 
                    onClick={handleExportProducts}
                  variant="outline"
                    size="md"
                  className="flex-shrink-0"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </Button>
                  <label className="flex-shrink-0">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportProducts}
                      className="hidden"
                    />
                    <div className="font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-gray-500 px-4 py-2 text-base cursor-pointer flex items-center justify-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Import
                    </div>
                  </label>
                </div>
                
                {/* Divider */}
                <div className="w-px h-10 bg-gray-300 mx-2 flex-shrink-0"></div>
                
                {/* Primary Actions */}
                <div className="flex gap-2">
                  {selectedProducts.length > 0 && (
                    <Button 
                      onClick={() => setIsBulkDeleteModalOpen(true)}
                      variant="danger"
                      size="md"
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete ({selectedProducts.length})
                    </Button>
                  )}
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                    variant="primary"
                    size="md"
                    className="flex-shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <SearchBar
                placeholder="Search products by name, barcode, or SKU..."
                onSearch={handleSearch}
                enableRealTime={true}
                debounceMs={300}
                showBarcodeButton={false}
              />
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Filter by Category
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm appearance-none cursor-pointer"
                    title="Select category"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="flex items-end">
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-white text-primary-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                    <span className="text-sm font-medium">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-white text-primary-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="h-4 w-4" />
                    <span className="text-sm font-medium">List</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {searchQuery || selectedCategory !== 'all' ? 'Search Results' : 'All Products'}
                </h2>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  {filteredProducts.length} of {productsPagination.totalProducts} {filteredProducts.length === 1 ? 'product' : 'products'}
                </span>
                {filteredProducts.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center space-x-2 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    {selectedProducts.length === filteredProducts.length ? (
                      <CheckSquare className="h-4 w-4 text-primary-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                    <span>
                      {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
                    </span>
                  </button>
                )}
              </div>
              {(searchQuery || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    loadProducts(1, 20, '', 'all');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                >
                  <span>Clear filters</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Products Grid */}
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {filteredProducts.map(product => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  onPriceUpdate={handlePriceUpdate}
                  onPriceHistory={handlePriceHistory}
                  showActions={true}
                  showPriceActions={true}
                  showStockAlert={true}
                  isSelected={selectedProducts.includes(product._id)}
                  onSelect={handleSelectProduct}
                  showSelection={true}
                />
              ))}
            </div>

            {/* Pagination */}
            {productsPagination.totalPages > 1 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(Math.max(1, productsPagination.currentPage - 1))}
                      disabled={productsPagination.currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(Math.min(productsPagination.totalPages, productsPagination.currentPage + 1))}
                      disabled={productsPagination.currentPage === productsPagination.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing page <span className="font-medium">{productsPagination.currentPage}</span> of{' '}
                        <span className="font-medium">{productsPagination.totalPages}</span>
                        {' '}({productsPagination.totalProducts} total products)
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(Math.max(1, productsPagination.currentPage - 1))}
                          disabled={productsPagination.currentPage === 1}
                          className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handlePageChange(Math.min(productsPagination.totalPages, productsPagination.currentPage + 1))}
                          disabled={productsPagination.currentPage === productsPagination.totalPages}
                          className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Filter className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {searchQuery || selectedCategory !== 'all' ? 'No products found' : 'No products yet'}
              </h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search terms or filter criteria to find what you\'re looking for.'
                  : 'Start building your product catalog by adding your first product to get started.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {(searchQuery || selectedCategory !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      loadProducts(1, 20, '', 'all');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="Add New Product"
        size="xl"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Product Name *"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <Input
                label="SKU"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                placeholder="Auto-generated if empty"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode
                </label>
                <div className="flex space-x-2">
                  <Input
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    placeholder="Enter barcode or scan"
                    className="flex-1"
                  />
                </div>
              </div>
              <CategorySelect
                label="Category *"
                value={newProduct.category}
                onChange={(category: string) => setNewProduct({ ...newProduct, category })}
                existingCategories={categories.filter(cat => cat !== 'all')}
                placeholder="Select or add a category"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  aria-label="Select unit"
                >
                  <option value="piece">Piece</option>
                  <option value="kg">Kg</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="Enter product description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Pricing & Inventory
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Price (₺) *"
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                placeholder="0.00"
                required
              />
              <Input
                label="Stock Quantity"
                type="number"
                value={newProduct.stock_quantity}
                onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                placeholder="0"
              />
              <Input
                label="Minimum Stock Level"
                type="number"
                value={newProduct.min_stock_level}
                onChange={(e) => setNewProduct({ ...newProduct, min_stock_level: e.target.value })}
                placeholder="5"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Tags
            </h3>
            <TagsDropdown
              label="Tags"
              value={newProduct.tags}
              onChange={(tags) => setNewProduct({ ...newProduct, tags })}
              existingTags={existingTags}
              placeholder="Add tags..."
              maxTags={10}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Product Images
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> product images
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or WEBP (MAX. 5 images)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              
              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddProduct}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Adding Product...' : 'Add Product'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
          setEditingImages([]);
        }}
        title="Edit Product"
        size="xl"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Product Name *"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <Input
                label="SKU"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                placeholder="Product SKU"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode
                </label>
                <div className="flex space-x-2">
                  <Input
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    placeholder="Enter barcode or scan"
                    className="flex-1"
                  />
                </div>
              </div>
              <CategorySelect
                label="Category *"
                value={newProduct.category}
                onChange={(category: string) => setNewProduct({ ...newProduct, category })}
                existingCategories={categories.filter(cat => cat !== 'all')}
                placeholder="Select or add a category"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  aria-label="Select unit"
                >
                  <option value="piece">Piece</option>
                  <option value="kg">Kg</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="Enter product description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Pricing & Inventory
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Price (₺) *"
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                placeholder="0.00"
                required
              />
              <Input
                label="Stock Quantity"
                type="number"
                value={newProduct.stock_quantity}
                onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                placeholder="0"
              />
              <Input
                label="Minimum Stock Level"
                type="number"
                value={newProduct.min_stock_level}
                onChange={(e) => setNewProduct({ ...newProduct, min_stock_level: e.target.value })}
                placeholder="5"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Tags
            </h3>
            <TagsDropdown
              label="Tags"
              value={newProduct.tags}
              onChange={(tags) => setNewProduct({ ...newProduct, tags })}
              existingTags={existingTags}
              placeholder="Add tags..."
              maxTags={10}
            />
          </div>

          {/* Current Images */}
          {editingProduct?.images && editingProduct.images.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Current Images
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {editingProduct.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`Current ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Current Image
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Update Images
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> new product images
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or WEBP (MAX. 5 images)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleEditImageUpload}
                  />
                </label>
              </div>
              
              {editingImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {editingImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`New Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeEditImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-xs text-center py-1 rounded-b-lg">
                        New
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingProduct(null);
                setEditingImages([]);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProduct}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Updating Product...' : 'Update Product'}
            </Button>
          </div>
        </div>
      </Modal>


            {/* Delete Confirmation Modal */}
            <Modal
              isOpen={isDeleteModalOpen}
              onClose={cancelDeleteProduct}
              title=""
              size="md"
            >
              <div className="text-center py-6">
                {/* Warning Icon */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>

                {/* Modal Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Delete Product
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">"{deletingProduct?.name}"</span>? 
                  This action cannot be undone and will permanently remove the product from your catalog.
                </p>

                {/* Product Preview */}
                {deletingProduct && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{deletingProduct.name}</p>
                        <p className="text-sm text-gray-500">{deletingProduct.category} • {deletingProduct.unit}</p>
                        <p className="text-sm font-semibold text-primary-600">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                          }).format(deletingProduct.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={cancelDeleteProduct}
                    disabled={isDeleting}
                    className="w-full sm:w-auto px-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={confirmDeleteProduct}
                    disabled={isDeleting}
                    loading={isDeleting}
                    className="w-full sm:w-auto px-8 bg-red-500 hover:bg-red-600"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Product'}
                  </Button>
                </div>
              </div>
            </Modal>

            {/* Smart Excel Import Modal */}
            <ExcelImportModal
              isOpen={isExcelImportOpen}
              onClose={() => setIsExcelImportOpen(false)}
              onSuccess={handleExcelImportSuccess}
            />

            {/* Bulk Delete Confirmation Modal */}
            <Modal
              isOpen={isBulkDeleteModalOpen}
              onClose={() => setIsBulkDeleteModalOpen(false)}
              title=""
              size="md"
            >
              <div className="text-center py-6">
                {/* Warning Icon */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>

                {/* Modal Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Delete {selectedProducts.length} Products
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">{selectedProducts.length} products</span>? 
                  This action cannot be undone and will permanently remove all selected products from your catalog.
                </p>

                {/* Action Buttons */}
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    onClick={() => setIsBulkDeleteModalOpen(false)}
                    variant="outline"
                    className="px-6 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isBulkDeleting ? 'Deleting...' : `Delete ${selectedProducts.length} Products`}
                  </Button>
                </div>
              </div>
            </Modal>

            {/* Price Update Modal */}
            <PriceUpdateModal
              isOpen={isPriceUpdateModalOpen}
                onClose={() => {
                setIsPriceUpdateModalOpen(false);
                setPriceUpdateProduct(null);
              }}
              product={priceUpdateProduct}
              onPriceUpdate={handlePriceUpdateSubmit}
            />

            {/* Price History Modal */}
            <PriceHistoryModal
              isOpen={isPriceHistoryModalOpen}
              onClose={() => {
                setIsPriceHistoryModalOpen(false);
                setPriceHistoryProduct(null);
                setPriceHistory([]);
              }}
              productName={priceHistoryProduct?.name || ''}
              priceHistory={priceHistory}
            />

          </div>
        </div>
      );
    };
