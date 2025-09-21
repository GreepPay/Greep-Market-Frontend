import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState, useCallback } from 'react';
import { AppState, Product, Transaction, InventoryAlert, DashboardMetrics, PriceHistory } from '../types';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

interface AppContextType extends AppState {
  addProduct: (product: Omit<Product, '_id' | 'created_at' | 'updated_at'>, images?: File[]) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  updateProductPrice: (productId: string, newPrice: number, reason?: string) => Promise<void>;
  getProductPriceHistory: (productId: string) => Promise<PriceHistory[]>;
  deleteProduct: (id: string) => Promise<void>;
  deleteAllProducts: () => Promise<{ deletedCount: number }>;
  exportProducts: () => Promise<void>;
  importProducts: (file: File) => Promise<{ imported: number; errors: string[] }>;
  addTransaction: (transaction: any) => Promise<void>;
  updateInventory: (productId: string, quantity: number) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  loadProducts: (page?: number, limit?: number) => Promise<void>;
  loadAllProducts: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadInventoryAlerts: () => Promise<void>;
  loading: boolean;
  productsPagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    limit: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_PRODUCTS_PAGINATION'; payload: { currentPage: number; totalPages: number; totalProducts: number; limit: number } }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: { id: string; updates: Partial<Product> } }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'SET_INVENTORY_ALERTS'; payload: InventoryAlert[] }
  | { type: 'SET_DASHBOARD_METRICS'; payload: DashboardMetrics };

const initialPaginationState = {
  currentPage: 1,
  totalPages: 1,
  totalProducts: 0,
  limit: 20,
};

const initialState: AppState = {
  products: [],
  sales: [],
  inventoryAlerts: [],
  dashboardMetrics: {
    totalSales: 0,
    totalProducts: 0,
    lowStockItems: 0,
    todaySales: 0,
    monthlySales: 0,
    totalTransactions: 0,
    growthRate: 0,
    topProducts: [],
    recentTransactions: [],
    salesByMonth: [],
  },
  isLoading: false,
  error: null,
  productsPagination: initialPaginationState,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_PRODUCTS_PAGINATION':
      return { ...state, productsPagination: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p =>
          p._id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p._id !== action.payload),
      };
    case 'SET_TRANSACTIONS':
      return { ...state, sales: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, sales: [...state.sales, action.payload] };
    case 'SET_INVENTORY_ALERTS':
      return { ...state, inventoryAlerts: action.payload };
    case 'SET_DASHBOARD_METRICS':
      return { ...state, dashboardMetrics: action.payload };
    default:
      return state;
  }
}


export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const [isLoadingData, setIsLoadingData] = useState(false);

  const loadInitialData = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingData) {
      console.log('Data is already loading, skipping duplicate call');
      return;
    }

    try {
      setIsLoadingData(true);
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Load data sequentially to avoid overwhelming the server
      await loadProducts();
      await loadTransactions();
      await loadInventoryAlerts();
      await refreshDashboard();
    } catch (error) {
      console.error('Failed to load initial data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      setIsLoadingData(false);
    }
  };

  // Load data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadInitialData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const loadProducts = useCallback(async (page: number = 1, limit: number = 20) => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping products load');
      return;
    }
    try {
      const response = await apiService.getProducts({
        store_id: user?.store_id,
        page,
        limit
      });
      console.log('Products loaded successfully:', response);
      dispatch({ type: 'SET_PRODUCTS', payload: response.products });
      dispatch({ 
        type: 'SET_PRODUCTS_PAGINATION', 
        payload: {
          currentPage: response.page,
          totalPages: response.pages,
          totalProducts: response.total,
          limit: response.limit
        }
      });
    } catch (error) {
      console.error('Failed to load products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products';
      toast.error(errorMessage);
    }
  }, [isAuthenticated, user]);

  const loadAllProducts = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping all products load');
      return;
    }
    try {
      // Load all products by setting a very high limit
      const response = await apiService.getProducts({
        store_id: user?.store_id,
        page: 1,
        limit: 1000 // Set high limit to get all products
      });
      console.log('=== LOAD ALL PRODUCTS DEBUG ===');
      console.log('API Response:', response);
      console.log('Products count:', response.products.length);
      console.log('Total from API:', response.total);
      console.log('Store ID:', user?.store_id);
      console.log('Request params:', { store_id: user?.store_id, page: 1, limit: 1000 });
      console.log('================================');
      dispatch({ type: 'SET_PRODUCTS', payload: response.products });
      dispatch({ 
        type: 'SET_PRODUCTS_PAGINATION', 
        payload: {
          currentPage: 1,
          totalPages: 1,
          totalProducts: response.products.length,
          limit: response.products.length
        }
      });
    } catch (error) {
      console.error('Failed to load all products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load all products';
      toast.error(errorMessage);
    }
  }, [isAuthenticated, user]);

  const loadTransactions = async () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping transactions load');
      return;
    }
    try {
      const response = await apiService.getTransactions({ 
        store_id: user?.store_id,
        limit: 50 
      });
      dispatch({ type: 'SET_TRANSACTIONS', payload: response.transactions });
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  const loadInventoryAlerts = async () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping inventory alerts load');
      return;
    }
    try {
      const alerts = await apiService.getLowStockItems(user?.store_id);
      dispatch({ type: 'SET_INVENTORY_ALERTS', payload: alerts });
    } catch (error) {
      console.error('Failed to load inventory alerts:', error);
      toast.error('Failed to load inventory alerts');
    }
  };

  const addProduct = async (productData: Omit<Product, '_id' | 'created_at' | 'updated_at'>, images?: File[]) => {
    try {
      const newProduct = await apiService.createProduct({
        ...productData,
        store_id: user?.store_id || '',
        created_by: user?.id || '',
      }, images);
      dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
      toast.success('Product added successfully');
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error('Failed to add product');
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const updatedProduct = await apiService.updateProduct(id, updates);
      dispatch({ type: 'UPDATE_PRODUCT', payload: { id, updates: updatedProduct } });
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error('Failed to update product');
      throw error;
    }
  };

  const updateProductPrice = async (productId: string, newPrice: number, reason?: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const result = await apiService.updateProductPrice(productId, {
        new_price: newPrice,
        change_reason: reason,
        changed_by: user.id,
      });
      
      // Update the product in the state
      dispatch({ type: 'UPDATE_PRODUCT', payload: { id: productId, updates: result.product } });
      
      toast.success('Price updated successfully');
    } catch (error) {
      console.error('Failed to update product price:', error);
      toast.error('Failed to update product price');
      throw error;
    }
  };

  const getProductPriceHistory = async (productId: string): Promise<PriceHistory[]> => {
    try {
      return await apiService.getProductPriceHistory(productId);
    } catch (error) {
      console.error('Failed to get product price history:', error);
      toast.error('Failed to load price history');
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await apiService.deleteProduct(id);
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
      // Don't show success toast here as it will be shown in the component
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      
      // Re-throw with more specific error message
      const errorMessage = error?.message || 'Failed to delete product';
      throw new Error(errorMessage);
    }
  };

  const deleteAllProducts = async (): Promise<{ deletedCount: number }> => {
    if (!user?.store_id) {
      throw new Error('Store ID is required');
    }
    
    try {
      console.log('Starting delete all products for store:', user.store_id);
      const result = await apiService.deleteAllProducts(user.store_id);
      console.log('Delete all products result:', result);
      
      // Clear all products from state
      dispatch({ type: 'SET_PRODUCTS', payload: [] });
      dispatch({ 
        type: 'SET_PRODUCTS_PAGINATION', 
        payload: {
          currentPage: 1,
          totalPages: 1,
          totalProducts: 0,
          limit: 20
        }
      });
      
      toast.success(`Successfully deleted ${result.deletedCount} products`);
      return result;
    } catch (error) {
      console.error('Failed to delete all products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete all products';
      toast.error(errorMessage);
      throw error;
    }
  };

  const exportProducts = async (): Promise<void> => {
    if (!user?.store_id) {
      throw new Error('Store ID is required');
    }
    
    try {
      console.log('Starting export products for store:', user.store_id);
      const blob = await apiService.exportProducts(user.store_id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Products exported successfully!');
    } catch (error) {
      console.error('Failed to export products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export products';
      toast.error(errorMessage);
      throw error;
    }
  };

  const importProducts = async (file: File): Promise<{ imported: number; errors: string[] }> => {
    if (!user?.store_id) {
      throw new Error('Store ID is required');
    }
    
    try {
      console.log('Starting import products for store:', user.store_id);
      const result = await apiService.importProducts(user.store_id, file);
      console.log('Import products result:', result);
      
      // Refresh products list
      await loadProducts(1, 20);
      
      if (result.imported > 0) {
        toast.success(`Successfully imported ${result.imported} products!`);
      }
      
      if (result.errors.length > 0) {
        toast.error(`Import completed with ${result.errors.length} errors. Check console for details.`);
        console.error('Import errors:', result.errors);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to import products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import products';
      toast.error(errorMessage);
      throw error;
    }
  };

  const addTransaction = async (transactionData: any) => {
    try {
      // Only add store_id and cashier_id if they're not already provided
      const transactionPayload = {
        ...transactionData,
        store_id: transactionData.store_id || user?.store_id || '',
        cashier_id: transactionData.cashier_id || user?.id || '',
      };
      
      console.log('Sending transaction to API:', transactionPayload);
      const newTransaction = await apiService.createTransaction(transactionPayload);
      dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
      toast.success('Transaction completed successfully');
    } catch (error) {
      console.error('Failed to create transaction:', error);
      toast.error('Failed to create transaction');
      throw error;
    }
  };

  const updateInventory = async (productId: string, quantity: number) => {
    try {
      await apiService.adjustInventory(productId, {
        adjustment_type: 'set',
        quantity,
        reason: 'Manual adjustment',
      });
      await loadProducts(); // Reload products to get updated quantities
      toast.success('Inventory updated successfully');
    } catch (error) {
      console.error('Failed to update inventory:', error);
      toast.error('Failed to update inventory');
      throw error;
    }
  };

  const refreshDashboard = async () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping dashboard refresh');
      return;
    }
    
    try {
      const metrics = await apiService.getDashboardAnalytics(user?.store_id);
      dispatch({ type: 'SET_DASHBOARD_METRICS', payload: metrics });
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
      toast.error('Failed to refresh dashboard');
    }
  };

  const value: AppContextType = {
    ...state,
    // Ensure arrays are always defined
    sales: state.sales || [],
    inventoryAlerts: state.inventoryAlerts || [],
    products: state.products || [],
    addProduct,
    updateProduct,
    updateProductPrice,
    getProductPriceHistory,
    deleteProduct,
    deleteAllProducts,
    exportProducts,
    importProducts,
    addTransaction,
    updateInventory,
    refreshDashboard,
    loadProducts,
    loadAllProducts,
    loadTransactions,
    loadInventoryAlerts,
    loading: state.isLoading,
    productsPagination: state.productsPagination || initialPaginationState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}


