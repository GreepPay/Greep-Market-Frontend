import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CreditCard, X, Users, DollarSign, TrendingUp, TrendingDown, Receipt as ReceiptIcon, Star, StarOff, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
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
import { notificationService } from '../services/notificationService';
import { TransactionItem, Product } from '../types';
import { usePageRefresh } from '../hooks/usePageRefresh';
import Receipt from '../components/ui/Receipt';
import { apiService } from '../services/api';
import { getTodayRange, normalizeDateToYYYYMMDD } from '../utils/timezoneUtils';

export const POS: React.FC = () => {
  const { products, addTransaction, updateInventory, loadAllProducts, updateProduct } = useApp();
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

  // Today's summary state
  const [todaySummary, setTodaySummary] = useState({
    sales: 0,
    expenses: 0,
    profit: 0,
    transactionCount: 0,
    loading: true
  });
  
  // Quick access products (pinned products)
  const [quickAccessProducts, setQuickAccessProducts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pos_quick_access_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // Load today's summary - uses same timezone utilities as Dashboard for consistency
  const loadTodaySummary = async () => {
    if (!user?.store_id) return;
    
    try {
      // Use the same date range calculation as Dashboard for consistency
      const todayRange = getTodayRange();
      const todayStart = normalizeDateToYYYYMMDD(todayRange.start);
      const todayEnd = normalizeDateToYYYYMMDD(todayRange.end);
      
      // Fetch today's transactions and expenses using normalized dates
      const [transactionsResponse, expensesResponse] = await Promise.all([
        apiService.getTransactions({
          store_id: user.store_id,
          start_date: todayStart,
          end_date: todayEnd,
          limit: 10000
        }).catch(() => ({ transactions: [], total: 0 })),
        apiService.getExpenses({
          store_id: user.store_id,
          start_date: todayStart,
          end_date: todayEnd,
          limit: 1000
        }).catch(() => ({ expenses: [] }))
      ]);
      
      let transactions = transactionsResponse.transactions || [];
      let expenses = expensesResponse.expenses || [];
      
      // Filter transactions by actual created_at date to ensure consistency
      // The API might return transactions from a different day due to timezone differences
      const normalizedToday = normalizeDateToYYYYMMDD(todayRange.start);
      transactions = transactions.filter((t: any) => {
        if (!t.created_at) return false;
        const transactionDate = normalizeDateToYYYYMMDD(new Date(t.created_at));
        return transactionDate === normalizedToday;
      });
      
      // Filter expenses by actual date to ensure consistency
      expenses = expenses.filter((e: any) => {
        if (!e.date) return false;
        const expenseDate = normalizeDateToYYYYMMDD(new Date(e.date));
        return expenseDate === normalizedToday;
      });
      
      const sales = (transactions as any[]).reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);
      const expensesTotal = (expenses as any[]).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      const profit = sales - expensesTotal;
      const transactionCount = transactions.length;
      
      setTodaySummary({
        sales,
        expenses: expensesTotal,
        profit,
        transactionCount,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load today summary:', error);
      setTodaySummary((prev: { sales: number; expenses: number; profit: number; transactionCount: number; loading: boolean }) => ({ ...prev, loading: false }));
    }
  };
  
  // Note: Today's summary is refreshed in processPayment after successful transaction
  
  // Save quick access products to localStorage
  useEffect(() => {
    localStorage.setItem('pos_quick_access_products', JSON.stringify(quickAccessProducts));
  }, [quickAccessProducts]);
  
  // Toggle quick access product
  const toggleQuickAccess = (productId: string) => {
    setQuickAccessProducts((prev: string[]) => {
      if (prev.includes(productId)) {
        return prev.filter((id: string) => id !== productId);
      } else if (prev.length < 6) {
        return [...prev, productId];
      } else {
        toast.error('You can only pin up to 6 products');
        return prev;
      }
    });
  };
  
  // Get quick access products
  const quickAccessProductsList = useMemo(() => {
    if (!products) return [];
    return quickAccessProducts
      .map((id: string) => products.find((p: Product) => p._id === id))
      .filter((p): p is Product => p !== undefined);
  }, [products, quickAccessProducts]);

  // Auto-focus search field when POS component mounts
  useEffect(() => {
    if (isAuthenticated && user && searchInputRef.current) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        try {
          // Safely focus the input, ignoring browser extension errors
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        } catch (error) {
          // Silently ignore focus errors from browser extensions
          // These are typically harmless and don't affect functionality
          // The error is from content_script.js (browser extension), not our code
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize cart from localStorage immediately to prevent empty state from being saved
  const getInitialCartState = (): TransactionItem[] => {
    try {
      const savedItems = localStorage.getItem('pos_cart_items');
      return savedItems ? JSON.parse(savedItems) : [];
    } catch (error) {
      console.error('Failed to load initial cart state:', error);
      return [];
    }
  };
  
  const [cartItems, setCartItems] = useState<TransactionItem[]>(getInitialCartState);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Initialize discount from localStorage immediately
  const getInitialDiscountState = (): string => {
    try {
      return localStorage.getItem('pos_discount') || '';
    } catch (error) {
      console.error('Failed to load initial discount state:', error);
      return '';
    }
  };
  
  const [discount, setDiscount] = useState(getInitialDiscountState);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<any | null>(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [restockContext, setRestockContext] = useState<'addToCart' | 'updateQty' | 'checkout' | null>(null);
  const cartLoadedRef = useRef(false);
  const [receiptTransaction, setReceiptTransaction] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Cart persistence functions
  const CART_STORAGE_KEY = 'pos_cart_items';
  const DISCOUNT_STORAGE_KEY = 'pos_discount';

  const saveCartToStorage = (items: TransactionItem[], discountValue: string) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      localStorage.setItem(DISCOUNT_STORAGE_KEY, discountValue);
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  };

  const loadCartFromStorage = (): { items: TransactionItem[]; discount: string } => {
    try {
      const savedItems = localStorage.getItem(CART_STORAGE_KEY);
      const savedDiscount = localStorage.getItem(DISCOUNT_STORAGE_KEY);
      
      return {
        items: savedItems ? JSON.parse(savedItems) : [],
        discount: savedDiscount || ''
      };
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      return { items: [], discount: '' };
    }
  };

  const clearCartFromStorage = () => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(DISCOUNT_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear cart from localStorage:', error);
    }
  };

  // Mark cart as loaded since we initialized from localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      cartLoadedRef.current = true;
      // Load today's summary on mount
      loadTodaySummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // Save cart to localStorage whenever cartItems or discount changes (but not during initial load)
  useEffect(() => {
    if (isAuthenticated && user && cartLoadedRef.current) {
      saveCartToStorage(cartItems, discount);
    }
  }, [cartItems, discount, isAuthenticated, user]);

  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) {
      return [];
    }
    if (!searchQuery.trim()) {
      return products;
    }
    
    const searchLower = searchQuery.toLowerCase();
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchLower) ||
      product.barcode?.toLowerCase().includes(searchLower)
    );
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
    
    if (product.stock_quantity <= 0) {
      toast.error(`${product.name} has insufficient stock (${product.stock_quantity}). Increase stock and try again.`);
      openRestockModal(product, 'addToCart');
      return;
    }

    const existingItem = cartItems.find(item => item.product_id === product._id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast.error(`Not enough stock for ${product.name}. Available: ${product.stock_quantity}, In cart: ${existingItem.quantity}.`);
        openRestockModal(product, 'addToCart');
        return;
      }
      updateCartItemQuantity(product._id, existingItem.quantity + 1);
    } else {
      const newItem: TransactionItem = {
        _id: '',
        product_id: product._id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
        vat_percentage: product.vat_percentage,
        product_image: product.images && product.images.length > 0 
          ? (product.images.find((img: any) => img.is_primary)?.url || product.images[0].url)
          : undefined,
      };
      setCartItems([...cartItems, newItem]);
      toast.success(`Added ${product.name} to cart`);
    }
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    
    // Prevent quantity from going to 0 - set minimum to 0.01
    if (quantity <= 0) {
      quantity = 0.01;
    }

    if (!products || !Array.isArray(products)) {
      toast.error('Products not loaded');
      return;
    }

    const product = products.find(p => p._id === productId);
    if (product && (product.stock_quantity <= 0 || quantity > product.stock_quantity)) {
      toast.error(`Not enough stock for ${product?.name}. Available: ${product?.stock_quantity ?? 0}.`);
      if (product) openRestockModal(product, 'updateQty');
      return;
    }

    const updatedItems = cartItems.map(item => {
      if (item.product_id === productId) {
        // Preserve VAT percentage when updating quantity
        const product = products?.find(p => p._id === productId);
        return { 
          ...item, 
          quantity, 
          total_price: item.unit_price * quantity,
          vat_percentage: product?.vat_percentage || item.vat_percentage
        };
      }
      return item;
    });
    
    setCartItems(updatedItems);
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscount('');
    clearCartFromStorage();
    cartLoadedRef.current = false; // Reset so cart can be loaded again if needed
  };

  const openRestockModal = (product: any, context: 'addToCart' | 'updateQty' | 'checkout') => {
    setRestockProduct(product);
    setRestockContext(context);
    // Suggest quantity to add so that stock reaches at least 1 or covers cart needs
    let suggested = 1;
    const cartItem = cartItems.find(i => i.product_id === product._id);
    if (cartItem) {
      suggested = Math.max(cartItem.quantity - product.stock_quantity, 1);
    } else if (product.stock_quantity <= 0) {
      suggested = 1 - product.stock_quantity; // e.g., -1 -> 2
    }
    setRestockQuantity(String(suggested));
    setIsRestockModalOpen(true);
  };

  const processRestock = async () => {
    if (!restockProduct) {
      setIsRestockModalOpen(false);
      return;
    }
    const qtyToAdd = parseFloat(restockQuantity);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      toast.error('Enter a valid quantity to add.');
      return;
    }
    try {
      const newQuantity = (restockProduct.stock_quantity || 0) + qtyToAdd;
      await updateProduct(restockProduct._id, { stock_quantity: newQuantity });
      await loadAllProducts();
      
      // Notify about stock restock
      notificationService.notifyStockRestocked(restockProduct.name, qtyToAdd, newQuantity);
      
      toast.success(`Restocked ${restockProduct.name} by ${qtyToAdd}. New stock: ${newQuantity}.`);
    } catch (e) {
      toast.error('Failed to restock product. Please try again.');
    } finally {
      setIsRestockModalOpen(false);
      setRestockProduct(null);
      setRestockQuantity('');
      setRestockContext(null);
    }
  };

  const validateCartStock = (): { ok: true } | { ok: false; product: any; available: number; needed: number } => {
    if (!products || !Array.isArray(products)) return { ok: true };
    for (const item of cartItems) {
      const product = products.find(p => p._id === item.product_id);
      if (!product) continue;
      const available = product.stock_quantity || 0;
      const needed = item.quantity;
      if (available <= 0 || available < needed) {
        return { ok: false, product, available, needed } as const;
      }
    }
    return { ok: true };
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
    // Prevent multiple clicks
    if (isProcessingPayment) return;
    
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    const validation = validateCartStock();
    if (validation.ok === false) {
      const { product, available, needed } = validation;
      toast.error(`Insufficient stock for ${product.name}. Needed: ${needed}, Available: ${available}. Increase stock and try again.`);
      openRestockModal(product, 'checkout');
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const processPayment = async (paymentData: PaymentData) => {
    // Show loading state immediately - before any validation or processing
    setIsProcessingPayment(true);
    
    // Small delay to ensure loader is visible
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      setIsProcessingPayment(false);
      return;
    }

    const validation = validateCartStock();
    if (validation.ok === false) {
      const { product, available, needed } = validation;
      toast.error(`Cannot process payment. ${product.name} has insufficient stock. Needed: ${needed}, Available: ${available}.`);
      setIsProcessingPayment(false);
      openRestockModal(product, 'checkout');
      return;
    }

    // Validate required user data
    if (!user?.id) {
      toast.error('User ID is missing. Please log in again.');
      setIsProcessingPayment(false);
      return;
    }
    
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
        items: cartItems.map(item => {
          const product = products?.find(p => p._id === item.product_id);
          return {
            product_id: item.product_id,
            product_name: product?.name || item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            vat_percentage: product?.vat_percentage, // Include VAT percentage from product
          };
        }),
        discount_amount: parseFloat(discount) || 0,
        payment_method: primaryPaymentMethod.type, // Keep for backward compatibility
        payment_methods: paymentData.payment_methods, // Save ALL payment methods
        order_source: paymentData.order_source,
        rider_id: paymentData.rider_id,
        delivery_fee: paymentData.delivery_fee,
        customer_id: paymentData.customer_id,
        notes: paymentData.notes,
      };

      // Small delay to ensure loader is visible
      await new Promise(resolve => setTimeout(resolve, 300));

      // Track start time for minimum loader display
      const startTime = Date.now();
      const minLoaderTime = 1500; // Minimum 1.5 seconds to show progress

      // Process transaction and inventory updates
      await Promise.all([
        addTransaction(transaction),
        updateGoalProgress(),
        ...cartItems.map(async (item) => {
          if (products && Array.isArray(products)) {
            const product = products.find(p => p._id === item.product_id);
            if (product) {
              await updateInventoryForSale(item.product_id, item.quantity);
            }
          }
        })
      ]);
      
      // Refresh today's summary after successful transaction
      loadTodaySummary();
      
      setReceiptTransaction({
        ...transaction,
        // Patch in subtotal, total_amount if available (may come from cart calculations)
        subtotal: cartTotal,
        total_amount: finalTotal,
        created_at: new Date(), // for display
      });
      
      // Ensure minimum loader display time
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoaderTime - elapsed);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setIsReceiptModalOpen(true);
      setIsProcessingPayment(false);

      setTimeout(() => {
        refreshNotifications();
      }, 2000);

      // Clear cart and close modal (not before showing receipt)
      clearCart();  // optionally consider deferring clear until receipt close
      setIsPaymentModalOpen(false);

      const paymentMethodsText = paymentData.payment_methods.map(pm => 
        `${pm.type.charAt(0).toUpperCase() + pm.type.slice(1)}: ₺${pm.amount.toFixed(2)}`
      ).join(', ');

      // Single success toast with all information
      toast.success(`Sale completed! Total: ₺${finalTotal.toFixed(2)} (${paymentMethodsText})`);
      
    } catch (error) {
      console.error('Payment processing failed:', error);
      // Provide a more meaningful message if backend rejects due to stock
      const message = error instanceof Error ? error.message : 'Failed to process payment. Please try again.';
      
      // Notify about payment failure
      notificationService.notifyPaymentFailed(message);
      
      if (String(message).toLowerCase().includes('stock') || String(message).toLowerCase().includes('inventory')) {
        toast.error('Payment failed due to insufficient stock. Please increase stock for affected products and try again.');
      } else {
        toast.error(message);
      }
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
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Compact Header with Today's Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Title and Stats */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Point of Sale</h1>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {filteredProducts.length} products
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {cartItems.length} in cart
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Today's Summary - Compact Cards */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-1.5 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <div className="text-xs">
                    <div className="text-gray-500 dark:text-gray-400">Sales</div>
                    <div className="font-bold text-green-700 dark:text-green-400">
                      {todaySummary.loading ? '...' : `₺${todaySummary.sales.toLocaleString()}`}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-1.5 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  <div className="text-xs">
                    <div className="text-gray-500 dark:text-gray-400">Expenses</div>
                    <div className="font-bold text-red-700 dark:text-red-400">
                      {todaySummary.loading ? '...' : `₺${todaySummary.expenses.toLocaleString()}`}
                    </div>
                  </div>
                </div>
              </div>
              <div className={`rounded-lg px-3 py-1.5 border ${todaySummary.profit >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center gap-1.5">
                  <DollarSign className={`h-3.5 w-3.5 ${todaySummary.profit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} />
                  <div className="text-xs">
                    <div className="text-gray-500 dark:text-gray-400">Profit</div>
                    <div className={`font-bold ${todaySummary.profit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>
                      {todaySummary.loading ? '...' : `₺${todaySummary.profit.toLocaleString()}`}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-1.5 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-1.5">
                  <ReceiptIcon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <div className="text-xs">
                    <div className="text-gray-500 dark:text-gray-400">Transactions</div>
                    <div className="font-bold text-purple-700 dark:text-purple-400">
                      {todaySummary.loading ? '...' : todaySummary.transactionCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              <SmartNavButton 
                to="/riders"
                variant="outline"
                className="text-xs px-3 py-1.5"
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Riders
              </SmartNavButton>
              <Button 
                onClick={() => setIsScannerOpen(true)}
                variant="outline"
                className="text-xs px-3 py-1.5"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Scan
              </Button>
              <Button 
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className="text-xs px-4 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md"
              >
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                Checkout
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Access Products - Pictorial - Tiny */}
        {quickAccessProductsList.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 p-1.5">
            <div className="flex items-center gap-1 mb-1">
              <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
              <h2 className="text-[10px] font-semibold text-gray-900 dark:text-white">Quick Access</h2>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {quickAccessProductsList.map((product: Product) => {
                const images = product.images || [];
                const primaryImage = images.find((img: any) => img.is_primary) || images[0];
                const imageUrl = primaryImage?.url;
                
                return (
                  <button
                    key={product._id}
                    onClick={() => addToCart(product)}
                    className="group relative flex-1 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all duration-200 overflow-hidden p-1"
                    title={`Add ${product.name} to cart`}
                  >
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleQuickAccess(product._id);
                      }}
                      className="absolute top-0.5 right-0.5 z-10 p-0.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove from quick access"
                    >
                      <StarOff className="h-2 w-2 text-gray-400 hover:text-red-500" />
                    </button>

                    {/* Product Image - 1/4 size */}
                    <div className="flex items-center justify-center mb-1">
                      <div className="relative w-12 h-12 bg-white dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-600">
                            <Package className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Info - Larger text */}
                    <div className="text-center">
                      <h3 className="text-xs font-medium text-gray-900 dark:text-white line-clamp-1 mb-0.5 leading-tight">
                        {product.name}
                      </h3>
                      <div className="text-xs font-bold text-primary-600 dark:text-primary-400">
                        ₺{product.price.toLocaleString()}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search and Products Section - Full width now */}
        <div className="space-y-6">
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

          {/* Products Grid - Extended to show more products */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => {
              const isQuickAccess = quickAccessProducts.includes(product._id);
              return (
                <div key={product._id} className="relative">
                  <ProductCard
                    product={product}
                    onAddToCart={addToCart}
                    showActions={true}
                    showStockAlert={true}
                  />
                  <button
                    onClick={() => toggleQuickAccess(product._id)}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white dark:hover:bg-gray-800 transition-colors"
                    title={isQuickAccess ? "Remove from quick access" : "Add to quick access (max 6)"}
                  >
                    {isQuickAccess ? (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <Star className="h-4 w-4 text-gray-400 hover:text-yellow-500" />
                    )}
                  </button>
                </div>
              );
            })}
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
      </div>

      {/* Shopping Cart Section - Fixed to bottom above navigation (outside max-w-7xl) */}
      <div className="hidden lg:block fixed bottom-24 right-4 w-96 max-w-md max-h-[calc(100vh-7rem)] overflow-y-auto z-40">
        <ShoppingCartComponent
          items={cartItems}
          onUpdateQuantity={updateCartItemQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          onCheckout={handleCheckout}
        />
      </div>
      
      {/* Mobile Shopping Cart - Show at bottom on mobile */}
      <div className="lg:hidden fixed bottom-20 left-0 right-0 z-40 px-4 pb-4">
        <div className="max-h-[60vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <ShoppingCartComponent
            items={cartItems}
            onUpdateQuantity={updateCartItemQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onCheckout={handleCheckout}
          />
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
        message="Processing your payment..."
        onCancel={() => setIsProcessingPayment(false)}
        canCancel={true}
      />

      {/* Restock Modal */}
      <Modal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        title={restockProduct ? `Increase Stock: ${restockProduct.name}` : 'Increase Stock'}
        size="md"
      >
        {restockProduct && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Current stock: <span className="font-semibold">{restockProduct.stock_quantity}</span>
            </div>
            <Input
              label="Quantity to Add"
              type="number"
              value={restockQuantity}
              onChange={(e) => setRestockQuantity(e.target.value)}
              placeholder="Enter quantity"
            />
            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="outline" onClick={() => setIsRestockModalOpen(false)}>Cancel</Button>
              <Button onClick={processRestock}>Update Stock</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Sales Receipt"
        size="md"
      >
        <Receipt
          ref={receiptRef}
          transaction={receiptTransaction}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
