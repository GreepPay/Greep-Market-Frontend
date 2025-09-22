import React from 'react';
import { Package, AlertTriangle, CheckSquare, Square, DollarSign, History, Edit3, Trash2, Plus } from 'lucide-react';
import { Button } from './Button';
import { Product } from '../../types';

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
}) => {
  const isLowStock = product.stock_quantity <= product.min_stock_level;
  const isOutOfStock = product.stock_quantity === 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  return (
    <div className={`group relative bg-white rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 ${
      isSelected 
        ? 'ring-2 ring-primary-500/50 shadow-primary-200/50' 
        : 'hover:shadow-gray-200/50'
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
      <div className="relative h-48 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 overflow-hidden">
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
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Package className="h-16 w-16 text-gray-400" />
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
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors duration-200">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-semibold shadow-sm">
              {product.category}
            </span>
            <span className="text-xs text-gray-500 font-medium">{product.unit}</span>
          </div>
        </div>
        
        {/* Price & Stock */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            {formatPrice(product.price)}
          </span>
          <div className="text-right">
            <div className="text-xs text-gray-500 font-medium mb-1">Stock</div>
            <span className={`text-sm font-bold px-2 py-1 rounded-full ${
              isOutOfStock 
                ? 'bg-red-100 text-red-700' 
                : isLowStock 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'bg-green-100 text-green-700'
            }`}>
              {product.stock_quantity}
            </span>
          </div>
        </div>
        
        {/* Barcode */}
        {product.barcode && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Barcode</span>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded-md text-gray-700">
                {product.barcode}
              </span>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        {showActions && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex gap-2">
              {onAddToCart && (
                <button
                  onClick={() => onAddToCart(product)}
                  disabled={isOutOfStock}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isOutOfStock
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                  className="px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-105"
                  aria-label="Edit product"
                  title="Edit product"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(product)}
                  className="px-3 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200 hover:scale-105"
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
          <div className="pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              {onPriceUpdate && (
                <button
                  onClick={() => onPriceUpdate(product)}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-sm font-medium hover:scale-105"
                >
                  <DollarSign className="h-4 w-4" />
                  Price
                </button>
              )}
              {onPriceHistory && (
                <button
                  onClick={() => onPriceHistory(product)}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm font-medium hover:scale-105"
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
