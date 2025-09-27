import React from 'react';
import { Package, AlertTriangle, CheckSquare, Square, DollarSign, History, Edit3, Trash2, Plus, Tag } from 'lucide-react';
import { Product } from '../../types';
import { formatTagsForDisplay } from '../../utils/tagUtils';

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onPriceUpdate?: (product: Product) => void;
  onPriceHistory?: (product: Product) => void;
  showActions?: boolean;
  showStockAlert?: boolean;
  isSelected?: boolean;
  onSelect?: (productId: string) => void;
  showSelection?: boolean;
  showPriceActions?: boolean;
  searchTerm?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onAddToCart,
  onPriceUpdate,
  onPriceHistory,
  showActions = true,
  showStockAlert = true,
  isSelected = false,
  onSelect,
  showSelection = false,
  showPriceActions = false,
  searchTerm = '',
}) => {
  const isLowStock = product.stock_quantity <= product.min_stock_level;
  const isOutOfStock = product.stock_quantity === 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term || !text) return text;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800/50 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className={`group relative bg-white dark:bg-gray-800 rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 ${
      isSelected 
        ? 'ring-2 ring-primary-500/50 shadow-primary-200/50' 
        : 'hover:shadow-gray-200/50 dark:hover:shadow-gray-700/50'
    }`}>
      {/* Selection Checkbox */}
      {showSelection && (
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={() => onSelect?.(product._id)}
            className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
              isSelected 
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                : 'bg-white/70 text-gray-400 hover:bg-white/90 hover:text-gray-600'
            }`}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
      
      {/* Stock Alert Badge */}
      {showStockAlert && (isLowStock || isOutOfStock) && (
        <div className={`absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md ${
          isOutOfStock 
            ? 'bg-red-500/90 text-white shadow-red-500/30' 
            : 'bg-amber-500/90 text-white shadow-amber-500/30'
        }`}>
          <AlertTriangle className="inline h-3 w-3 mr-1" />
          {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
        </div>
      )}
      
      {/* Product Image with Overlay */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <>
            <img
              src={product.images.find(img => img.is_primary)?.url || product.images[0].url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-500">
            <Package className="h-16 w-16 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        
        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
            {onAddToCart && !isOutOfStock && (
              <button
                onClick={() => onAddToCart(product)}
                className="bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full font-medium shadow-lg hover:bg-white hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Quick Add
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
            {highlightSearchTerm(product.name, searchTerm)}
          </h3>
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-semibold shadow-sm">
              {product.category}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{product.unit}</span>
          </div>
        </div>
        
        {/* Price & Stock */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-400 dark:to-primary-500 bg-clip-text text-transparent">
            {formatPrice(product.price)}
          </span>
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Stock</div>
            <span className={`text-sm font-bold px-2 py-1 rounded-full ${
              isOutOfStock 
                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                : isLowStock 
                  ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' 
                  : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            }`}>
              {product.stock_quantity}
            </span>
          </div>
        </div>
        
        {/* Barcode */}
        {product.barcode && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Barcode</span>
              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-gray-700 dark:text-gray-300">
                {product.barcode}
              </span>
            </div>
          </div>
        )}
        
        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tags</span>
              <div className="flex flex-wrap gap-1 max-w-[60%]">
                {product.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
                {product.tags.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                    +{product.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        {showActions && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex gap-2">
              {onAddToCart && (
                <button
                  onClick={() => onAddToCart(product)}
                  disabled={isOutOfStock}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isOutOfStock
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/30 transform hover:scale-105'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Add to Cart
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(product)}
                  className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 hover:scale-105"
                  aria-label="Edit product"
                  title="Edit product"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(product)}
                  className="px-3 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105"
                  aria-label="Delete product"
                  title="Delete product"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Price Action Buttons */}
        {showPriceActions && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              {onPriceUpdate && (
                <button
                  onClick={() => onPriceUpdate(product)}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 text-sm font-medium hover:scale-105"
                >
                  <DollarSign className="h-4 w-4" />
                  Price
                </button>
              )}
              {onPriceHistory && (
                <button
                  onClick={() => onPriceHistory(product)}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 text-sm font-medium hover:scale-105"
                >
                  <History className="h-4 w-4" />
                  History
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
