export interface PriceHistory {
  _id: string;
  product_id: string;
  old_price: number;
  new_price: number;
  changed_by: string;
  change_reason?: string;
  changed_at: Date;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  cost_price?: number;
  category: string;
  sku: string;
  barcode?: string;
  stock_quantity: number;
  min_stock_level: number;
  unit: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  images: {
    url: string;
    public_id: string;
    is_primary: boolean;
    thumbnail_url?: string;
  }[];
  tags: string[];
  is_active: boolean;
  is_featured: boolean;
  created_by: string;
  store_id: string;
  created_at: Date;
  updated_at: Date;
  price_history?: PriceHistory[];
}

export interface PaymentMethod {
  type: 'cash' | 'card' | 'transfer' | 'crypto';
  amount: number;
}

export interface Rider {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  is_active: boolean;
  current_balance: number; // Amount of money the rider currently has
  total_delivered: number; // Total amount of deliveries made
  total_reconciled: number; // Total amount reconciled
  pending_reconciliation: number; // Amount pending reconciliation
  store_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface RiderCashTransaction {
  _id: string;
  rider_id: string;
  rider_name: string;
  type: 'give_cash' | 'reconcile' | 'delivery_payment';
  amount: number;
  description?: string;
  given_by: string; // User who gave the cash
  given_by_name: string;
  store_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  _id: string;
  store_id: string;
  customer_id?: string;
  items: TransactionItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_methods: PaymentMethod[]; // Multiple payment methods
  payment_method?: 'cash' | 'card' | 'transfer' | 'crypto'; // Legacy single payment method (for backward compatibility)
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  status: 'pending' | 'completed' | 'cancelled' | 'voided';
  order_source: 'in_store' | 'online' ;
  rider_id?: string; // Optional rider for delivery orders
  delivery_fee?: number;
  cashier_id: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionItem {
  _id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount?: number;
}

export interface InventoryAlert {
  _id: string;
  product_id: string;
  product_name: string;
  current_quantity: number;
  min_stock_level: number;
  alert_type: 'low_stock' | 'out_of_stock';
  store_id: string;
  created_at: Date;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'cashier' | 'manager' | 'owner';
  store_id?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    message: string;
    code: string;
  };
  timestamp: string;
  path: string;
}

export interface DashboardMetrics {
  totalSales: number;
  totalProducts: number;
  lowStockItems: number;
  todaySales: number;
  monthlySales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  growthRate: number;
  totalExpenses: number;
  monthlyExpenses: number;
  netProfit: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
  recentTransactions: Array<{
    id: string;
    totalAmount: number;
    paymentMethod: string;
    createdAt: Date;
  }>;
  salesByMonth: Array<{
    month: string;
    sales: number;
    transactions: number;
  }>;
}

export interface SalesReport {
  period: string;
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
}

export interface AppState {
  products: Product[];
  sales: Transaction[];
  inventoryAlerts: InventoryAlert[];
  dashboardMetrics: DashboardMetrics;
  isLoading: boolean;
  error: string | null;
  productsPagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    limit: number;
  };
}


