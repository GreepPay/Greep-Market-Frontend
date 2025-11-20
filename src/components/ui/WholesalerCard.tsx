import React, { useState, useEffect } from 'react';
import { 
  Building2, Phone, Mail, MapPin, Edit, Trash2, AlertTriangle, 
  Package, Share2, MessageCircle, ExternalLink, Image as ImageIcon 
} from 'lucide-react';
import { Wholesaler, Product } from '../../types';
import { Button } from './Button';
import { apiService } from '../../services/api';

interface WholesalerCardProps {
  wholesaler: Wholesaler;
  onEdit: (wholesaler: Wholesaler) => void;
  onDelete: (wholesaler: Wholesaler) => void;
  onViewProducts: (wholesaler: Wholesaler) => void;
  onViewLowStock: (wholesaler: Wholesaler) => void;
  onPhoneClick: (wholesaler: Wholesaler) => void;
  onEmailClick: (wholesaler: Wholesaler) => void;
  onShare: (wholesaler: Wholesaler) => void;
  loadWholesalerWithProducts?: (id: string, includeProducts?: boolean) => Promise<Wholesaler>;
}

export const WholesalerCard: React.FC<WholesalerCardProps> = ({
  wholesaler,
  onEdit,
  onDelete,
  onViewProducts,
  onViewLowStock,
  onPhoneClick,
  onEmailClick,
  onShare,
  loadWholesalerWithProducts,
}) => {
  const [productPreview, setProductPreview] = useState<Product[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [totalProductCount, setTotalProductCount] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh when wholesaler data changes
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [wholesaler.updated_at, wholesaler.products?.length]);

  useEffect(() => {
    // Load product preview images - always fetch fresh from API
    const loadPreview = async () => {
      if (!wholesaler._id) return;
      
      try {
        setIsLoadingPreview(true);
        const loadFunction = loadWholesalerWithProducts || apiService.getWholesalerById;
        const wholesalerWithProducts = await loadFunction(wholesaler._id, true);
        
        console.log('WholesalerCard: Fetched products for', wholesaler.name, {
          productCount: wholesalerWithProducts.products?.length || 0,
          products: wholesalerWithProducts.products?.map(p => ({
            name: p.name,
            hasImages: p.images && p.images.length > 0,
            imageUrl: p.images?.[0]?.url
          }))
        });
        
        if (wholesalerWithProducts.products && wholesalerWithProducts.products.length > 0) {
          setTotalProductCount(wholesalerWithProducts.products.length);
          // Show first 4 products regardless of whether they have images
          // Products without images will show placeholders
          const productsPreview = wholesalerWithProducts.products.slice(0, 4);
          setProductPreview(productsPreview);
          console.log('WholesalerCard: Set preview with', productsPreview.length, 'products');
        } else {
          // If no products found from API, check if wholesaler object has products (fallback)
          if (wholesaler.products && wholesaler.products.length > 0) {
            setTotalProductCount(wholesaler.products.length);
            setProductPreview(wholesaler.products.slice(0, 4));
            console.log('WholesalerCard: Using fallback products from props');
          } else {
            setTotalProductCount(0);
            setProductPreview([]);
            console.log('WholesalerCard: No products found');
          }
        }
      } catch (error) {
        console.error('WholesalerCard: Failed to load product preview:', error);
        // On error, try to use products from props if available
        if (wholesaler.products && wholesaler.products.length > 0) {
          setTotalProductCount(wholesaler.products.length);
          setProductPreview(wholesaler.products.slice(0, 4));
        }
      } finally {
        setIsLoadingPreview(false);
      }
    };

    loadPreview();
  }, [wholesaler._id, refreshKey, loadWholesalerWithProducts]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Card Header with Action Buttons */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{wholesaler.name}</h3>
              {!wholesaler.is_active && (
                <span className="text-xs text-red-500 font-medium">Inactive</span>
              )}
            </div>
          </div>
          <div className="flex space-x-1 ml-2">
            <button
              onClick={() => onShare(wholesaler)}
              className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(wholesaler)}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(wholesaler)}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contact Details - Clickable */}
        <div className="space-y-2.5 mb-4">
          {wholesaler.phone && (
            <button
              onClick={() => onPhoneClick(wholesaler)}
              className="w-full flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-all group"
            >
              <Phone className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate">{wholesaler.phone}</span>
              <MessageCircle className="h-3 w-3 ml-auto text-green-600 dark:text-green-400 opacity-70" />
            </button>
          )}
          {wholesaler.email && (
            <button
              onClick={() => onEmailClick(wholesaler)}
              className="w-full flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-all group"
            >
              <Mail className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate flex-1 text-left">{wholesaler.email}</span>
              <ExternalLink className="h-3 w-3 ml-auto opacity-70" />
            </button>
          )}
          {wholesaler.address && (
            <div className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400 p-2">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{wholesaler.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Preview Images - Prominent Display */}
      <div className="px-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-wide">
            <Package className="h-3.5 w-3.5" />
            Products
            {totalProductCount > 0 && (
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 normal-case">
                ({totalProductCount})
              </span>
            )}
          </span>
          {(productPreview.length > 0 || totalProductCount > 0) && (
            <button
              onClick={() => onViewProducts(wholesaler)}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
            >
              View All →
            </button>
          )}
        </div>
        
        {isLoadingPreview ? (
          <div className="grid grid-cols-4 gap-2 h-20">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
              />
            ))}
          </div>
        ) : productPreview.length > 0 ? (
          <div className="relative">
            <div className="grid grid-cols-4 gap-2">
              {productPreview.slice(0, 4).map((product, index) => (
                <div
                  key={product._id || index}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 group cursor-pointer border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:scale-105"
                  onClick={() => onViewProducts(wholesaler)}
                >
                  {product.images && product.images.length > 0 && product.images[0]?.url ? (
                    <>
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                                <svg class="h-6 w-6 text-gray-400 dark:text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p class="text-[9px] font-medium text-gray-600 dark:text-gray-400 text-center px-1 truncate w-full">${product.name}</p>
                              </div>
                            `;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-1 left-1 right-1">
                          <p className="text-[10px] font-medium text-white truncate drop-shadow-lg">
                            {product.name}
                          </p>
                          {product.price !== undefined && (
                            <p className="text-[9px] text-white/90 truncate drop-shadow">
                              ₺{product.price.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 p-1">
                      <ImageIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mb-1 flex-shrink-0" />
                      <p className="text-[9px] font-medium text-gray-600 dark:text-gray-400 text-center px-1 truncate w-full leading-tight">
                        {product.name}
                      </p>
                      {product.price !== undefined && (
                        <p className="text-[8px] text-gray-500 dark:text-gray-500 mt-0.5">
                          ₺{product.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* More products indicator */}
            {totalProductCount > 4 && (
              <div className="absolute -bottom-1 -right-1 bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white dark:border-gray-800 z-10">
                +{totalProductCount - 4} more
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => onViewProducts(wholesaler)}
            className="relative rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300 cursor-pointer group"
          >
            <div className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                <Package className="h-6 w-6 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                No product images yet
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">
                Click to manage products
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Low Stock Alert */}
      {wholesaler.low_stock_count !== undefined && wholesaler.low_stock_count > 0 && (
        <div className="mx-6 mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 animate-pulse" />
              <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                {wholesaler.low_stock_count} {wholesaler.low_stock_count === 1 ? 'product' : 'products'} need restocking
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-6 pb-6 pt-4 mt-auto space-y-2">
        {wholesaler.low_stock_count !== undefined && wholesaler.low_stock_count > 0 && (
          <Button
            onClick={() => onViewLowStock(wholesaler)}
            variant="outline"
            size="sm"
            className="w-full bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            View Low Stock ({wholesaler.low_stock_count})
          </Button>
        )}
        <Button
          onClick={() => onViewProducts(wholesaler)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Package className="h-4 w-4 mr-2" />
          Manage Products
        </Button>
      </div>
    </div>
  );
};

