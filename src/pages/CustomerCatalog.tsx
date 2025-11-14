import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Phone, MapPin, Clock, CheckCircle, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CategoryFilterSidebar } from '../components/ui/CategoryFilterSidebar';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useApp } from '../context/AppContext';
import { api } from '../config/environment';
import { toast } from 'react-hot-toast';
import { formatStockQuantity } from '../utils/formatUtils';

interface Product {
  _id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category: string;
  barcode?: string;
  tags: string[];
  unit: string;
  images: {
    url: string;
    public_id: string;
  }[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CustomerOrder {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: CartItem[];
  paymentMethod: 'cash' | 'isbank' | 'naira' | 'pos';
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: string;
  notes?: string;
}

export const CustomerCatalog: React.FC = () => {
  const { products } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [order, setOrder] = useState<CustomerOrder>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    items: [],
    paymentMethod: 'cash',
    deliveryMethod: 'pickup',
    deliveryAddress: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Load categories from products
  useEffect(() => {
    if (products) {
      const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
      setCategories(uniqueCategories);
      setIsLoadingProducts(false);
    }
  }, [products]);

  // Filter products based on search and categories
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (product.barcode && product.barcode.includes(searchQuery)) ||
                           product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategories.length === 0 || 
                             selectedCategories.includes(product.category);
      
      return matchesSearch && matchesCategory && product.stock_quantity > 0;
    });
  }, [products, searchQuery, selectedCategories]);

  // Add to cart
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product._id === product._id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        setCart(cart.map(item => 
          item.product._id === product._id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
        toast.success(`Added ${product.name} to cart`);
      } else {
        toast.error('Not enough stock available');
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
      toast.success(`Added ${product.name} to cart`);
    }
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product._id !== productId));
    toast.success('Item removed from cart');
  };

  // Update cart quantity
  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const cartItem = cart.find(item => item.product._id === productId);
    if (cartItem && quantity <= cartItem.product.stock_quantity) {
      setCart(cart.map(item => 
        item.product._id === productId 
          ? { ...item, quantity }
          : item
      ));
    } else {
      toast.error('Not enough stock available');
    }
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = order.deliveryMethod === 'delivery' ? 25 : 0;
  const total = subtotal + deliveryFee;

  // Open order modal
  const openOrderModal = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setOrder(prev => ({ ...prev, items: cart }));
    setIsOrderModalOpen(true);
  };

  // Submit order
  const submitOrder = async () => {
    // Validate customer name
    if (!order.customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    
    if (order.customerName.trim().length < 2 || order.customerName.trim().length > 100) {
      toast.error('Customer name must be between 2 and 100 characters');
      return;
    }

    // Validate phone number (more flexible)
    if (!order.customerPhone.trim()) {
      toast.error('Please enter phone number');
      return;
    }
    
    // Basic phone validation - just check it's not empty and has some digits
    const phoneDigits = order.customerPhone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (order.deliveryMethod === 'delivery' && !order.deliveryAddress?.trim()) {
      toast.error('Please provide delivery address');
      return;
    }

    setIsSubmitting(true);
    setOrderError(null);

    try {
      // Generate order number
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const orderNumber = `ORD-${dateStr}-${randomNum}`;

      const orderData = {
        orderNumber: orderNumber,
        order_number: orderNumber,
        customer_name: order.customerName.trim(),
        customer_phone: order.customerPhone.trim(),
        customer_email: order.customerEmail?.trim() || undefined,
        store_id: 'default-store', // Default store ID
        items: order.items.map(item => ({
          product_id: item.product._id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.product.price * item.quantity
        })),
        payment_method: order.paymentMethod === 'cash' ? 'cash_on_delivery' : 
                       order.paymentMethod === 'isbank' ? 'isbank_transfer' :
                       order.paymentMethod === 'naira' ? 'naira_transfer' :
                       order.paymentMethod === 'pos' ? 'pos_payment' : 'cash_on_delivery',
        delivery_method: order.deliveryMethod === 'pickup' ? 'self_pickup' : 'delivery',
        delivery_address: order.deliveryAddress?.trim() || undefined,
        notes: order.notes?.trim() || undefined,
        subtotal,
        delivery_fee: deliveryFee,
        total
      };

      const response = await fetch(`${api.baseUrl}/public/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        let errorData;
        try {
          const responseText = await response.text();
          
          if (responseText) {
            errorData = JSON.parse(responseText);
          } else {
            errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((error: any) => {
            switch (error.path) {
              case 'customer_name':
                return 'Please enter a valid customer name (2-100 characters)';
              case 'customer_phone':
                return 'Please enter a valid phone number';
              case 'store_id':
                return 'Store information is missing';
              case 'items[0].product_id':
                return 'Please select at least one product';
              case 'payment_method':
                return 'Please select a valid payment method';
              case 'delivery_method':
                return 'Please select a valid delivery method';
              default:
                return error.msg || 'Validation error';
            }
          });
          throw new Error(errorMessages.join('. '));
        }
        
        throw new Error(errorData.message || 'Failed to create order');
      }

      let result;
      let responseText;
      try {
        responseText = await response.text();
        
        if (responseText) {
          result = JSON.parse(responseText);
        } else {
          throw new Error('Empty response from server');
        }
      } catch (parseError) {
        console.error('Failed to parse success response:', parseError);
        console.error('Raw response text:', responseText);
        throw new Error('Invalid response from server');
      }
      
      // Get order information
      const orderInfo = result.order || result; // Handle both response structures
      
      // Show success message
      toast.success(
        <div className="text-center">
          <p className="font-semibold mb-2">Order placed successfully!</p>
          <p className="text-sm mb-3">Order #{orderInfo.orderNumber || orderInfo.order_number}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your order has been sent to our team and will be processed shortly.
          </p>
        </div>,
        { duration: 5000 }
      );

      // Reset form and cart
      setCart([]);
      setOrder({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        items: [],
        paymentMethod: 'cash',
        deliveryMethod: 'pickup',
        deliveryAddress: '',
        notes: ''
      });
      setIsOrderModalOpen(false);

    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order. Please try again.';
      setOrderError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img src="/icons/GreepMarket-Green_BG-White.svg" alt="Greep Market" className="h-12 w-12 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Greep Market
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Phone className="h-4 w-4 mr-1" />
                <span>+234 806 456 0393</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 mr-1" />
                <span>Efsane Sk, Gönyeli 1010, Lefosia, North Cyprus</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <CategoryFilterSidebar
              categories={categories || []}
              selectedCategories={selectedCategories}
              onCategoryToggle={(category) => {
                setSelectedCategories(prev => 
                  prev.includes(category) 
                    ? prev.filter(c => c !== category)
                    : [...prev, category]
                );
              }}
              onClearAll={() => setSelectedCategories([])}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, barcodes, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Products Grid */}
            {isLoadingProducts ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {filteredProducts.map((product) => (
                <div key={product._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0].url} 
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-gray-400 text-4xl">📦</div>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {product.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {product.category} • {product.unit}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-primary-600">
                      ₺{product.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Stock: {formatStockQuantity(product.stock_quantity)}
                    </span>
                  </div>
                  
                  <Button
                    onClick={() => addToCart(product)}
                    className="w-full"
                    disabled={product.stock_quantity === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
                ))}
              </div>
            )}

            {!isLoadingProducts && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search or category filters
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 text-primary-600 mr-2" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total: ₺{total.toFixed(2)}
              </div>
            </div>
            <Button onClick={openOrderModal} className="bg-primary-600 hover:bg-primary-700">
              Place Order
            </Button>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center pt-0 px-4 pb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Place Your Order
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="!p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Order Items</h3>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.product._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ₺{item.product.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQuantity(item.product._id, item.quantity - 1)}
                          className="!p-1"
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQuantity(item.product._id, item.quantity + 1)}
                          className="!p-1"
                        >
                          +
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromCart(item.product._id)}
                          className="!p-1 text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Information */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={order.customerName}
                      onChange={(e) => setOrder(prev => ({ ...prev, customerName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={order.customerPhone}
                      onChange={(e) => setOrder(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+234 806 456 0393"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={order.customerEmail}
                      onChange={(e) => setOrder(prev => ({ ...prev, customerEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Payment & Delivery */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Payment & Delivery</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={order.paymentMethod}
                      onChange={(e) => setOrder(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      aria-label="Payment Method"
                    >
                      <option value="cash">Cash on Delivery</option>
                      <option value="isbank">Isbank Transfer</option>
                      <option value="naira">Naira Transfer</option>
                      <option value="pos">POS Payment</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="delivery-method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Delivery Method
                    </label>
                      <select
                        id="delivery-method"
                        value={order.deliveryMethod}
                        onChange={(e) => setOrder(prev => ({ ...prev, deliveryMethod: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        aria-label="Delivery Method"
                      >
                      <option value="pickup">Self Pickup</option>
                      <option value="delivery">Delivery (+₺25)</option>
                    </select>
                  </div>
                </div>
                
                {order.deliveryMethod === 'delivery' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Delivery Address *
                    </label>
                    <textarea
                      value={order.deliveryAddress}
                      onChange={(e) => setOrder(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter your full delivery address"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={order.notes}
                  onChange={(e) => setOrder(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={2}
                  placeholder="Any special instructions or notes"
                />
              </div>

              {/* Error Display */}
              {orderError && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <X className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Order Error
                      </h3>
                      <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                        {orderError}
                      </div>
                    </div>
                    <button
                      onClick={() => setOrderError(null)}
                      className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                      title="Close error message"
                      aria-label="Close error message"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₺{subtotal.toFixed(2)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>₺{deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t border-gray-300 dark:border-gray-600 pt-2">
                    <span>Total:</span>
                    <span>₺{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={submitOrder}
                disabled={isSubmitting}
                className="w-full bg-primary-600 hover:bg-primary-700"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Place Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
