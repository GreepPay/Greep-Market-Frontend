import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CreditCard, X, Users, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { ProductCard } from '../components/ui/ProductCard';
import { ShoppingCartComponent } from '../components/ui/ShoppingCart';
import { BarcodeScanner } from '../components/ui/BarcodeScanner';
import { EnhancedPaymentModal, PaymentData } from '../components/ui/EnhancedPaymentModal';
import { SmartNavButton } from '../components/ui/SmartNavButton';
import { CheckoutLoader } from '../components/ui/CheckoutLoader';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useRiders } from '../context/RiderContext';
import { useGoals } from '../context/GoalContext';
import { useNotifications } from '../context/NotificationContext';
import { TransactionItem } from '../types';
import { usePageRefresh } from '../hooks/usePageRefresh';

export const POS: React.FC = () => {
  const { products, addTransaction, updateInventory, loadAllProducts } = useApp();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { riders, loadRiders } = useRiders();
  const { updateGoalProgress } = useGoals();
  const { refreshNotifications } = useNotifications();
  
  
  // Enable automatic refresh for POS (conservative settings)
  usePageRefresh({
    refreshOnMount: true,
    refreshOnFocus: false, // Disabled to prevent excessive refreshing
    refreshInterval: 30000, // Refresh every 30 seconds (increased from 15)
    refreshOnVisibilityChange: false, // Disabled to prevent excessive refreshing
    silent: true
  });

  // Load all products and riders when POS component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      loadAllProducts();
      loadRiders();
    }
  }, [isAuthenticated, user, loadAllProducts, loadRiders]);

  // Auto-focus search field when POS component mounts
  useEffect(() => {
    if (isAuthenticated && user && searchInputRef.current) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<TransactionItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [discount, setDiscount] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) {
      console.log('POS - No products or products not array:', products);
      return [];
    }
    console.log('POS - Total products available:', products.length);
    if (!searchQuery.trim()) {
      console.log('POS - Returning all products:', products.length);
      return products;
    }
    
    const searchLower = searchQuery.toLowerCase();
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchLower) ||
      product.barcode?.toLowerCase().includes(searchLower)
    );
    console.log('POS - Filtered products:', filtered.length);
    return filtered;
  }, [products, searchQuery]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.total_price, 0);
  }, [cartItems]);

  const finalTotal = useMemo(() => {
    const discountAmount = parseFloat(discount) || 0;
    return Math.max(0, cartTotal - discountAmount);
  }, [cartTotal, discount]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleBarcodeScan = (barcode: string) => {
    if (!products || !Array.isArray(products)) {
      toast.error('Products not loaded');
      return;
    }
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
      toast.success(`Added ${product.name} to cart`);
    } else {
      toast.error('Product not found');
    }
  };

  const addToCart = (product: any) => {
    console.log('Adding product to cart:', product);
    
    if (product.stock_quantity === 0) {
      toast.error('Product is out of stock');
      return;
    }

    const existingItem = cartItems.find(item => item.product_id === product._id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast.error('Not enough stock available');
        return;
      }
      console.log('Updating existing item quantity');
      updateCartItemQuantity(product._id, existingItem.quantity + 1);
    } else {
      const newItem: TransactionItem = {
        _id: '',
        product_id: product._id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
      };
      console.log('Adding new item to cart:', newItem);
      setCartItems([...cartItems, newItem]);
      toast.success(`Added ${product.name} to cart`);
    }
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    console.log('Updating cart item quantity:', productId, quantity);
    
    // Prevent quantity from going to 0 - set minimum to 0.01
    if (quantity <= 0) {
      quantity = 0.01;
    }

    if (!products || !Array.isArray(products)) {
      toast.error('Products not loaded');
      return;
    }

    const product = products.find(p => p._id === productId);
    if (product && quantity > product.stock_quantity) {
      toast.error('Not enough stock available');
      return;
    }

    const updatedItems = cartItems.map(item => 
      item.product_id === productId 
        ? { ...item, quantity, total_price: item.unit_price * quantity }
        : item
    );
    
    console.log('Updated cart items:', updatedItems);
    setCartItems(updatedItems);
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscount('');
  };

  const updateInventoryForSale = async (productId: string, quantitySold: number) => {
    try {
      // Get the current product to calculate new stock
      const product = products?.find(p => p._id === productId);
      if (product) {
        const newStock = product.stock_quantity - quantitySold;
        await updateInventory(productId, newStock);
      }
    } catch (error) {
      console.error('Failed to update inventory:', error);
      // Don't show toast here - the main error will be handled by processPayment
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const processPayment = async (paymentData: PaymentData) => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Validate required user data
    if (!user?.id) {
      toast.error('User ID is missing. Please log in again.');
      return;
    }
    
    // Show loading state
    setIsProcessingPayment(true);
    
    // Use default store if user doesn't have a store_id assigned
    const storeId = user?.store_id || 'default-store';

    try {
      // Create enhanced transaction record with all required fields
      // Extract primary payment method (the one with the highest amount) for backward compatibility
      const primaryPaymentMethod = paymentData.payment_methods.reduce((prev, current) => 
        (current.amount > prev.amount) ? current : prev
      );

      const transaction = {
        store_id: storeId,
        cashier_id: user.id,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        discount_amount: parseFloat(discount) || 0,
        payment_method: primaryPaymentMethod.type, // Keep for backward compatibility
        payment_methods: paymentData.payment_methods, // Save ALL payment methods
        order_source: paymentData.order_source,
        rider_id: paymentData.rider_id,
        delivery_fee: paymentData.delivery_fee,
        customer_id: paymentData.customer_id,
        notes: paymentData.notes,
      };

      console.log('🔍 Creating enhanced transaction with payment methods:', {
        transaction,
        paymentMethods: paymentData.payment_methods,
        totalPaymentMethods: paymentData.payment_methods.length,
        primaryPaymentMethod: primaryPaymentMethod
      });
      
      // Process transaction and inventory updates
      await Promise.all([
        addTransaction(transaction),
        updateGoalProgress(),
        // Update inventory for all sold items
        ...cartItems.map(async (item) => {
          if (products && Array.isArray(products)) {
            const product = products.find(p => p._id === item.product_id);
            if (product) {
              await updateInventoryForSale(item.product_id, item.quantity);
            }
          }
        })
      ]);

      // Trigger notification refresh to get new milestone notifications
      setTimeout(() => {
        refreshNotifications();
      }, 2000); // Wait 2 seconds for backend to process

      // Clear cart and close modal
      clearCart();
      setIsPaymentModalOpen(false);
      setDiscount('');

      const paymentMethodsText = paymentData.payment_methods.map(pm => 
        `${pm.type.charAt(0).toUpperCase() + pm.type.slice(1)}: ₺${pm.amount.toFixed(2)}`
      ).join(', ');

      // Single success toast with all information
      toast.success(`Sale completed! Total: ₺${finalTotal.toFixed(2)} (${paymentMethodsText})`);
      
    } catch (error) {
      console.error('Payment processing failed:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      // Hide loading state
      setIsProcessingPayment(false);
    }
  };


  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Loading POS System</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Please wait while we verify your authentication...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Authentication Required</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">You need to be logged in to access the POS system.</p>
              <Button 
                onClick={() => window.location.href = '/login'}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Modern Header */}
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 opacity-50"></div>
          <div className="relative p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
      <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sales</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Process customer transactions quickly and efficiently</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{filteredProducts.length} products available</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{cartItems.length} items in cart</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <SmartNavButton 
                  to="/riders"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Riders
                </SmartNavButton>
                <SmartNavButton 
                  to="/cash-tracking"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Cash Tracking
                </SmartNavButton>
                <Button 
                  onClick={() => setIsScannerOpen(true)}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Scan Barcode
                </Button>
                <Button 
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  className="w-full sm:w-auto bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Checkout
                </Button>
              </div>
            </div>
          </div>
      </div>

        {/* Search and Products Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Search Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Products</h2>
                  <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                  </span>
                </div>
            <SearchBar
              placeholder="Search products or scan barcode..."
              onSearch={handleSearch}
              onBarcodeScan={() => setIsScannerOpen(true)}
              enableRealTime={true}
              debounceMs={200}
              showBarcodeButton={true}
              ref={searchInputRef}
            />
              </div>
            </div>

          {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={addToCart}
                    showActions={true}
                showStockAlert={true}
              />
            ))}
          </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <X className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">No products found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                    Try adjusting your search terms or scan a barcode to find products.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      variant="outline"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </Button>
                    <Button 
                      onClick={() => setIsScannerOpen(true)}
                      className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      Scan Barcode
                    </Button>
                  </div>
                </div>
              </div>
          )}
        </div>

          {/* Shopping Cart Section - Sticky */}
        <div className="lg:col-span-1">
            <div className="sticky top-20 bottom-20">
          <ShoppingCartComponent
            items={cartItems}
            onUpdateQuantity={updateCartItemQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onCheckout={handleCheckout}
          />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Payment Modal */}
      <EnhancedPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onProcessPayment={processPayment}
        cartItems={cartItems}
        subtotal={cartTotal}
        taxAmount={0} // TODO: Calculate tax
        discountAmount={parseFloat(discount) || 0}
        totalAmount={finalTotal}
        riders={riders}
      />

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
        onError={(error) => toast.error(`Scanner error: ${error}`)}
      />
      
      <CheckoutLoader 
        isVisible={isProcessingPayment}
        message="Processing your order..."
        onCancel={() => setIsProcessingPayment(false)}
        canCancel={true}
      />
    </div>
  );
};
