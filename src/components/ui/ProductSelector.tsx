import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, X, Check, Plus } from 'lucide-react';
import { Product } from '../../types';

interface ProductSelectorProps {
  products: Product[];
  selectedProduct: Product | null;
  onSelectProduct: (product: Product | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  allowCustom?: boolean; // Allow entering custom product name if not in list
  onCustomProductName?: (name: string) => void;
  className?: string;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  products,
  selectedProduct,
  onSelectProduct,
  placeholder = 'Search for a product...',
  label = 'Product',
  required = false,
  allowCustom = true,
  onCustomProductName,
  className = '',
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [customProductName, setCustomProductName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update custom product name when selected product changes
  useEffect(() => {
    if (selectedProduct) {
      setCustomProductName('');
      setSearchQuery(selectedProduct.name);
    } else if (customProductName) {
      setSearchQuery(customProductName);
    }
  }, [selectedProduct, customProductName]);

  const handleSelectProduct = (product: Product) => {
    onSelectProduct(product);
    setSearchQuery(product.name);
    setIsOpen(false);
    setCustomProductName('');
  };

  const handleClearSelection = () => {
    onSelectProduct(null);
    setSearchQuery('');
    setCustomProductName('');
    inputRef.current?.focus();
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setIsOpen(true);
    
    // If allowCustom and user is typing, update custom product name
    if (allowCustom && value && !filteredProducts.some(p => p.name.toLowerCase() === value.toLowerCase())) {
      setCustomProductName(value);
      if (onCustomProductName) {
        onCustomProductName(value);
      }
    } else {
      setCustomProductName('');
      if (onCustomProductName) {
        onCustomProductName('');
      }
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleUseCustomProduct = () => {
    if (customProductName.trim()) {
      // Create a temporary product object for custom product
      const customProduct: Product = {
        _id: `custom-${Date.now()}`,
        name: customProductName.trim(),
        description: '',
        price: 0,
        category: '',
        sku: '',
        unit: 'pieces',
        stock_quantity: 0,
        min_stock_level: 0,
        images: [],
        tags: [],
        is_active: true,
        is_featured: false,
        created_by: '',
        store_id: '',
        created_at: new Date(),
        updated_at: new Date(),
      };
      onSelectProduct(customProduct);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className={`w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              selectedProduct ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : ''
            }`}
            required={required}
          />
          {selectedProduct && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-80 overflow-auto">
            {filteredProducts.length > 0 ? (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                  Select Product ({filteredProducts.length})
                </div>
                {filteredProducts.map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    onClick={() => handleSelectProduct(product)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                      selectedProduct?._id === product._id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images.find(img => img.is_primary)?.url || product.images[0].url}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {product.category && <span>{product.category}</span>}
                          {product.category && product.unit && <span> • </span>}
                          {product.unit && <span>{product.unit}</span>}
                          {product.stock_quantity !== undefined && (
                            <>
                              <span> • </span>
                              <span className={product.stock_quantity <= product.min_stock_level ? 'text-red-600 dark:text-red-400' : ''}>
                                Stock: {product.stock_quantity}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedProduct?._id === product._id && (
                      <Check className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </>
            ) : searchQuery ? (
              <div className="px-4 py-6 text-center">
                <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  No products found matching "{searchQuery}"
                </p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/products', { state: { searchQuery } });
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add "{searchQuery}" as New Product
                  </button>
                  {allowCustom && (
                    <button
                      type="button"
                      onClick={handleUseCustomProduct}
                      className="w-full text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium py-2"
                    >
                      Or use as custom product name
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Start typing to search for products...
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Product Info */}
      {selectedProduct && selectedProduct._id && !selectedProduct._id.startsWith('custom-') && (
        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-green-800 dark:text-green-300">Linked to product:</span>
              <span className="text-green-700 dark:text-green-400 ml-2">{selectedProduct.name}</span>
            </div>
            <div className="text-green-600 dark:text-green-400">
              Stock will be updated automatically
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

