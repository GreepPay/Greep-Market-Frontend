import { 
  Product, 
  Transaction, 
  User, 
  AuthResponse, 
  ApiResponse,
  InventoryAlert,
  DashboardMetrics,
  PriceHistory 
} from '../types';
import { api } from '../config/environment';

const API_BASE_URL = api.baseUrl;

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onTokenExpired: (() => void) | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  // Set callback for token expiration
  setTokenExpiredCallback(callback: () => void) {
    this.onTokenExpired = callback;
  }

  // Clear token expiration callback
  clearTokenExpiredCallback() {
    this.onTokenExpired = null;
  }

  // Development utility: Force token expiration for testing
  forceTokenExpiration() {
    console.log('Forcing token expiration for testing...');
    this.clearTokens();
  }

  // Clear all tokens
  public clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Trigger token expiration callback if set
    if (this.onTokenExpired) {
      this.onTokenExpired();
    }
  }

  // Clear all tokens without triggering the callback (to prevent infinite loops)
  public clearTokensSilently(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Note: We don't call the callback here to prevent infinite loops
  }

  // Check if tokens are valid
  private isTokenValid(token: string | null): boolean {
    if (!token) return false;
    try {
      // Basic JWT validation - check if it's not expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const isValid = payload.exp > now;
      
      if (!isValid) {
        console.log('Token is expired, clearing tokens');
        this.clearTokensSilently();
      }
      
      return isValid;
    } catch (error) {
      console.log('Token validation failed:', error);
      // Clear tokens if they're malformed or invalid
      this.clearTokensSilently();
      return false;
    }
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return !!(this.accessToken && this.isTokenValid(this.accessToken));
  }

  // Public method for making raw requests (for file downloads, etc.)
  public async rawRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
        ...options.headers,
      },
      ...options,
    };

    return fetch(url, config);
  }

  // Public method for making authenticated requests
  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.privateRequest<T>(endpoint, options);
  }

  private async privateRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log(`Making API request to: ${url}`);
    
    // Validate access token before making request
    if (this.accessToken && !this.isTokenValid(this.accessToken)) {
      console.log('Access token is invalid, clearing tokens');
      this.clearTokensSilently();
      throw new Error('Authentication token is invalid or expired');
    }
    
    const config: RequestInit = {
      headers: {
        // Only set Content-Type for JSON, not for FormData
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check if response has content before trying to parse JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          // If JSON parsing fails, create a generic error response
          data = {
            success: false,
            error: {
              message: response.statusText || 'Unknown error occurred',
              statusCode: response.status
            }
          };
        }
      } else {
        // If not JSON, create a generic error response
        data = {
          success: false,
          error: {
            message: response.statusText || 'Unknown error occurred',
            statusCode: response.status
          }
        };
      }

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Received 401 Unauthorized - handling token expiration');
          if (this.refreshToken && this.isTokenValid(this.refreshToken)) {
            // Try to refresh token
            console.log('Attempting to refresh token...');
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
              console.log('Token refreshed successfully, retrying request');
              // Retry the original request
              config.headers = {
                ...config.headers,
                Authorization: `Bearer ${this.accessToken}`,
              };
              const retryResponse = await fetch(url, config);
              return await retryResponse.json();
            }
          }
          // If refresh fails or no refresh token, clear all tokens and trigger logout
          console.log('Token refresh failed or no refresh token - clearing tokens and redirecting to login');
          this.clearTokens();
        }
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Request timed out after 10 seconds');
          throw new Error('Request timed out. Please check your connection and try again.');
        } else if (error.message.includes('Failed to fetch')) {
          console.error('Network error - server might be down');
          throw new Error('Unable to connect to server. Please check if the backend is running.');
        } else if (error.message.includes('Authentication token is invalid or expired')) {
          console.error('Token validation failed before request');
          // Token expiration callback will be triggered by clearTokens()
          throw error;
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          console.error('Unauthorized access - clearing tokens and redirecting');
          this.clearTokensSilently();
          throw new Error('Authentication failed. Please sign in again.');
        }
      }
      
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.clearTokens();
    return false;
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }


  // Authentication
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.privateRequest<AuthResponse['data']>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response as AuthResponse;
  }

  async register(userData: {
    email: string;
    password: string;
    role: string;
    first_name: string;
    last_name: string;
    phone?: string;
    store_id?: string;
  }): Promise<AuthResponse> {
    const response = await this.privateRequest<AuthResponse['data']>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response as AuthResponse;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.privateRequest<{ success: boolean; data: { user: User } }>('/auth/me');
    return (response as any).data.user;
  }

  async logout() {
    this.clearTokens();
  }

  // Products
  async getProducts(params?: {
    store_id?: string;
    search?: string;
    category?: string;
    stock_level?: 'low_stock' | 'out_of_stock' | 'normal' | 'all';
    tags?: string[];
  }): Promise<{ products: Product[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.store_id) queryParams.append('store_id', params.store_id);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.stock_level && params.stock_level !== 'all') queryParams.append('stock_level', params.stock_level);
    if (params?.tags && params.tags.length > 0) queryParams.append('tags', params.tags.join(','));

    const response = await this.privateRequest<{ success: boolean; data: { products: Product[]; total: number } }>(`/products?${queryParams}`) as any;
    
    
    // Handle response structure
    let data;
    if (response.data?.products) {
      // Structure: { success: true, data: { products: [...], total: 897 } }
      data = response.data;
    } else if (response.products) {
      // Structure: { products: [...], total: 897 } directly
      data = response;
    } else {
      throw new Error('Invalid API response structure - no products data found');
    }
    
    return {
      products: data.products || [],
      total: data.total || 0
    };
  }

  async getProduct(id: string): Promise<Product> {
    const response = await this.privateRequest<Product>(`/products/${id}`);
    return response.data;
  }

  async getProductByBarcode(barcode: string): Promise<Product> {
    const response = await this.privateRequest<Product>(`/products/barcode/${barcode}`);
    return response.data;
  }

  async createProduct(productData: Partial<Product>, images?: File[]): Promise<Product> {
    // If there are images, use FormData, otherwise use JSON
    if (images && images.length > 0) {
      const formData = new FormData();
      
      // Add each product field individually to FormData
      Object.keys(productData).forEach(key => {
        const value = productData[key as keyof Product];
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      // Add each image file
      images.forEach((image) => {
        formData.append(`images`, image);
      });
      
      const response = await this.privateRequest<Product>('/products', {
        method: 'POST',
        body: formData,
      });
      return response.data;
    } else {
      // No images, use regular JSON request
      const response = await this.privateRequest<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      return response.data;
    }
  }

  async updateProduct(id: string, updates: Partial<Product>, images?: File[], replaceImages: boolean = true): Promise<Product> {
    // If there are images, use FormData, otherwise use JSON
    if (images && images.length > 0) {
      console.log('Using FormData for image update', { replaceImages });
      const formData = new FormData();
      
      // Add all the product updates as form data
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'tags' && Array.isArray(value)) {
            // Handle tags array
            formData.append('tags', JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      
      // Add flag to indicate image replacement behavior
      formData.append('replace_images', replaceImages.toString());
      
      // Add images
      images.forEach((image, index) => {
        formData.append('images', image);
      });
      
      const response = await this.rawRequest(`/products/${id}`, {
        method: 'PUT',
        body: formData,
      });
      
      return await response.json();
    } else {
      // No images, use regular JSON request
      const response = await this.privateRequest<Product>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return response.data;
    }
  }

  // Method to delete all images from a product
  async deleteProductImages(productId: string): Promise<Product> {
    const response = await this.privateRequest<Product>(`/products/${productId}/images`, {
      method: 'DELETE',
    });
    return response.data;
  }

  async updateProductPrice(id: string, data: {
    new_price: number;
    change_reason?: string;
    changed_by: string;
  }): Promise<{ product: Product; priceHistory: PriceHistory[] }> {
    console.log('Updating product price:', { id, data });
    
    // Use the standard product update endpoint
    const response = await this.privateRequest<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        price: data.new_price
      }),
    });
    
    // For now, return the updated product and an empty price history array
    // The backend would need to implement proper price history tracking
    return {
      product: response.data,
      priceHistory: []
    };
  }

  async getProductPriceHistory(productId: string): Promise<PriceHistory[]> {
    try {
      const response = await this.privateRequest<PriceHistory[]>(`/products/${productId}/price-history`);
      return response.data;
    } catch (error) {
      console.warn('Price history endpoint not available, returning empty array');
      // Return empty array if the endpoint doesn't exist yet
      return [];
    }
  }

  async deleteProduct(id: string): Promise<void> {
    await this.privateRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteAllProducts(storeId: string): Promise<{ deletedCount: number }> {
    const response = await this.privateRequest<{ success: boolean; data: { deletedCount: number } }>(`/products/bulk/all?store_id=${storeId}`, {
      method: 'DELETE',
    });
    
    console.log('Delete all products response:', response);
    
    // Handle the nested response structure
    const data = response.data?.data || response.data;
    
    if (!data || typeof data.deletedCount === 'undefined') {
      console.error('Invalid delete all products response:', response);
      throw new Error('Invalid response from delete all products API');
    }
    
    return { deletedCount: data.deletedCount };
  }

  // Export products to JSON file
  async exportProducts(storeId: string): Promise<Blob> {
    console.log('Exporting products for store:', storeId);
    
    const response = await fetch(`${API_BASE_URL}/products/export?store_id=${storeId}`, {
      method: 'GET',
      headers: {
        ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return await response.blob();
  }

  // Import products from JSON file
  async importProducts(storeId: string, file: File): Promise<{ imported: number; errors: string[] }> {
    console.log('Importing products for store:', storeId);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('store_id', storeId);

    const response = await this.privateRequest<{ success: boolean; data: { imported: number; errors: string[] } }>('/products/import', {
      method: 'POST',
      body: formData,
    });

    console.log('Import response:', response);
    
    // Handle the nested response structure
    const data = response.data?.data || response.data;
    
    if (!data) {
      console.error('Invalid import response:', response);
      throw new Error('Invalid response from import API');
    }
    
    return { imported: data.imported, errors: data.errors || [] };
  }

  // Inventory
  async getInventory(params?: {
    store_id?: string;
    page?: number;
    limit?: number;
  }): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    if (params?.store_id) queryParams.append('store_id', params.store_id);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await this.privateRequest<Product[]>(`/inventory?${queryParams}`);
    return response.data;
  }

  async getLowStockItems(store_id?: string): Promise<InventoryAlert[]> {
    const queryParams = new URLSearchParams();
    if (store_id) queryParams.append('store_id', store_id);

    const response = await this.privateRequest<InventoryAlert[]>(`/inventory/low-stock?${queryParams}`);
    return response.data;
  }

  async adjustInventory(
    productId: string,
    data: {
      adjustment_type: 'add' | 'subtract' | 'set';
      quantity: number;
      reason: string;
      notes?: string;
    }
  ): Promise<void> {
    await this.privateRequest(`/inventory/${productId}/adjust`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Transactions
  async getTransactions(params?: {
    store_id?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    page?: number;
    limit?: number;
    category?: string;
    tags?: string[];
    search?: string;
  }): Promise<{ transactions: Transaction[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams();
    if (params?.store_id) queryParams.append('store_id', params.store_id);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.tags && params.tags.length > 0) queryParams.append('tags', params.tags.join(','));
    if (params?.search) queryParams.append('search', params.search);
    
    // Add cache-busting parameter to ensure fresh data when filters change
    queryParams.append('_t', Date.now().toString());

    const response = await this.privateRequest<Transaction[]>(`/transactions?${queryParams}`);
    return {
      transactions: response.data,
      total: response.data.length,
      page: params?.page || 1,
      limit: params?.limit || 20,
    };
  }

  async createTransaction(transactionData: {
    store_id: string;
    customer_id?: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      discount_amount?: number;
    }>;
    discount_amount?: number;
    payment_method: 'cash' | 'pos_isbank_transfer' | 'naira_transfer' | 'crypto_payment' | 'card';
    notes?: string;
    cashier_id: string;
  }): Promise<Transaction> {
    const response = await this.privateRequest<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
    return response.data;
  }

  async completeTransaction(transactionId: string): Promise<Transaction> {
    const response = await this.privateRequest<Transaction>(`/transactions/${transactionId}/complete`, {
      method: 'POST',
    });
    return response.data;
  }

  async updateTransaction(transactionId: string, updates: {
    items?: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
    }>;
    payment_method?: string;
    payment_methods?: Array<{
      type: 'cash' | 'pos_isbank_transfer' | 'naira_transfer' | 'crypto_payment' | 'card';
      amount: number;
    }>;
    customer_id?: string;
    notes?: string;
  }): Promise<Transaction> {
    try {
      // Convert payment_methods array to single payment_method for backend compatibility
      const backendUpdates = { ...updates };
      if (updates.payment_methods && updates.payment_methods.length > 0) {
        backendUpdates.payment_method = updates.payment_methods[0].type;
        delete backendUpdates.payment_methods;
      }
      
      const response = await this.privateRequest<Transaction>(`/transactions/${transactionId}`, {
        method: 'PUT',
        body: JSON.stringify(backendUpdates),
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Update transaction error:', error);
      if (error.message?.includes('Access denied') || error.message?.includes('Cannot manage')) {
        throw new Error('Transaction update not supported by backend yet. Please contact your administrator.');
      }
      throw error;
    }
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    try {
      await this.privateRequest(`/transactions/${transactionId}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      console.error('Delete transaction error:', error);
      if (error.message?.includes('Access denied') || error.message?.includes('Cannot manage')) {
        throw new Error('Transaction deletion not supported by backend yet. Please contact your administrator.');
      }
      throw error;
    }
  }

  // Analytics
  async getDashboardAnalytics(params?: {
    store_id?: string;
    dateRange?: string;
    paymentMethod?: string;
    orderSource?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<DashboardMetrics> {
    const queryParams = new URLSearchParams();
    if (params?.store_id) queryParams.append('store_id', params.store_id);
    if (params?.dateRange) queryParams.append('dateRange', params.dateRange);
    if (params?.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);
    if (params?.orderSource) queryParams.append('orderSource', params.orderSource);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    // Add cache-busting parameter to ensure fresh data when filters change
    queryParams.append('_t', Date.now().toString());
    
    const url = `/analytics/dashboard?${queryParams}`;
    console.log('🔍 API getDashboardAnalytics call:', {
      params,
      queryParams: queryParams.toString(),
      url
    });
    
    const response = await this.privateRequest<{ success: boolean; data: DashboardMetrics }>(url);
    
    console.log('🔍 API getDashboardAnalytics response:', {
      success: response.success,
      dataKeys: (response as any).data ? Object.keys((response as any).data) : 'No data',
      totalExpenses: (response as any).data?.totalExpenses,
      monthlyExpenses: (response as any).data?.monthlyExpenses
    });
    
    return (response as any).data;
  }

  async getSalesAnalytics(params?: {
    store_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.store_id) queryParams.append('store_id', params.store_id);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const response = await this.privateRequest(`/analytics/sales?${queryParams}`);
    return response.data;
  }

  async getProductPerformance(store_id?: string, period?: string, startDate?: Date, endDate?: Date): Promise<any> {
    const queryParams = new URLSearchParams();
    if (store_id) queryParams.append('store_id', store_id);
    if (period) queryParams.append('period', period);
    if (startDate) queryParams.append('start_date', startDate.toISOString().split('T')[0]);
    if (endDate) queryParams.append('end_date', endDate.toISOString().split('T')[0]);

    const response = await this.privateRequest(`/analytics/products?${queryParams}`);
    return response.data;
  }

  async getInventoryAnalytics(store_id?: string): Promise<any> {
    const queryParams = new URLSearchParams();
    if (store_id) queryParams.append('store_id', store_id);

    const response = await this.privateRequest(`/analytics/inventory?${queryParams}`);
    return response.data;
  }

  // User Management Methods
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    store_id?: string;
  }): Promise<{ users: User[]; total: number; page: number; pages: number }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.store_id) queryParams.append('store_id', params.store_id);

    const response = await this.privateRequest<{ success: boolean; data: { users: User[]; total: number; page: number; pages: number } }>(`/users?${queryParams}`);
    return (response as any).data;
  }

  async getUserById(userId: string): Promise<User> {
    const response = await this.privateRequest<{ success: boolean; data: User }>(`/users/${userId}`);
    return (response as any).data;
  }

  async createUser(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'cashier' | 'manager' | 'owner';
    phone?: string;
    store_id?: string;
  }): Promise<User> {
    const response = await this.privateRequest<{ success: boolean; data: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return (response as any).data;
  }

  async updateUser(userId: string, userData: {
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: 'admin' | 'cashier' | 'manager' | 'owner';
    phone?: string;
    is_active?: boolean;
    store_id?: string;
  }): Promise<User> {
    const response = await this.privateRequest<{ success: boolean; data: User }>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return (response as any).data;
  }

  // Update current user's own profile (for self-editing)
  async updateProfile(userData: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  }): Promise<User> {
    const response = await this.privateRequest<{ success: boolean; data: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return (response as any).data;
  }

  async updateUserPassword(userId: string, password: string): Promise<void> {
    await this.privateRequest(`/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.privateRequest(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async toggleUserStatus(userId: string): Promise<User> {
    const response = await this.privateRequest<{ success: boolean; data: User }>(`/users/${userId}/toggle-status`, {
      method: 'PATCH',
    });
    return (response as any).data;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const response = await this.privateRequest<{ success: boolean; data: User[] }>(`/users/role/${role}`);
    return (response as any).data;
  }

  // Expense Management Methods
  async getExpenses(params?: {
    page?: number;
    limit?: number;
    store_id?: string;
    category?: string;
    payment_method?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
  }): Promise<{ expenses: any[]; total: number; page: number; pages: number }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.store_id) queryParams.append('store_id', params.store_id);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.payment_method) queryParams.append('payment_method', params.payment_method);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.search) queryParams.append('search', params.search);

    const response = await this.privateRequest<{ success: boolean; data: any[]; pagination: any }>(`/expenses?${queryParams}`);
    return {
      expenses: (response as any).data || [],
      total: (response as any).pagination?.total || 0,
      page: (response as any).pagination?.page || 1,
      pages: (response as any).pagination?.pages || 1,
    };
  }

  async getExpenseById(expenseId: string): Promise<any> {
    const response = await this.privateRequest<{ success: boolean; data: any }>(`/expenses/${expenseId}`);
    return (response as any).data;
  }

  async createExpense(expenseData: {
    store_id: string;
    date: string;
    product_name: string;
    unit: string;
    quantity: number;
    amount: number;
    currency?: string;
    payment_method: string;
    category?: string;
    description?: string;
    receipt_number?: string;
    vendor_name?: string;
  }): Promise<any> {
    const response = await this.privateRequest<{ success: boolean; data: any }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
    return (response as any).data;
  }

  async updateExpense(expenseId: string, expenseData: {
    date?: string;
    product_name?: string;
    unit?: string;
    quantity?: number;
    amount?: number;
    currency?: string;
    payment_method?: string;
    category?: string;
    description?: string;
    receipt_number?: string;
    vendor_name?: string;
  }): Promise<any> {
    const response = await this.privateRequest<{ success: boolean; data: any }>(`/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
    return (response as any).data;
  }

  async deleteExpense(expenseId: string): Promise<void> {
    await this.privateRequest(`/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  async getExpenseStats(params?: {
    store_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.store_id) queryParams.append('store_id', params.store_id);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const response = await this.privateRequest<{ success: boolean; data: any }>(`/expenses/stats?${queryParams}`);
    return (response as any).data;
  }

  async getMonthlyExpenseSummary(year: number, storeId?: string): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (storeId) queryParams.append('store_id', storeId);

    const response = await this.privateRequest<{ success: boolean; data: any[] }>(`/expenses/monthly/${year}?${queryParams}`);
    return (response as any).data || [];
  }

  // Goal Management Methods (Legacy - kept for compatibility)
  async getGoalsWithProgress(): Promise<any[]> {
    const response = await this.privateRequest<{ success: boolean; data: any[] }>('/goals/progress');
    return (response as any).data || [];
  }

  async getGoalAnalytics(): Promise<any> {
    const response = await this.privateRequest<{ success: boolean; data: any }>('/goals/analytics');
    return (response as any).data || {};
  }

  // Goals API methods
  async getGoals(params?: {
    goal_type?: 'daily' | 'monthly' | 'weekly' | 'yearly';
    is_active?: boolean;
    store_id?: string;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.goal_type) queryParams.append('goal_type', params.goal_type);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.store_id) queryParams.append('store_id', params.store_id);

    const response = await this.privateRequest<{ success: boolean; data: any[] }>(`/goals?${queryParams}`);
    return (response as any).data || [];
  }

  async createGoal(goalData: {
    goal_type: 'daily' | 'monthly' | 'weekly' | 'yearly';
    target_amount: number;
    currency?: string;
    period_start: string;
    period_end: string;
    store_id?: string;
  }): Promise<any> {
    const response = await this.privateRequest<{ success: boolean; data: any }>('/goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(goalData),
    });
    return (response as any).data;
  }

  async updateGoal(goalId: string, updateData: {
    target_amount?: number;
    currency?: string;
    period_start?: string;
    period_end?: string;
    is_active?: boolean;
  }): Promise<any> {
    const response = await this.privateRequest<{ success: boolean; data: any }>(`/goals/${goalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    return (response as any).data;
  }

  async deleteGoal(goalId: string): Promise<boolean> {
    const response = await this.privateRequest<{ success: boolean }>(`/goals/${goalId}`, {
      method: 'DELETE',
    });
    return response.success;
  }

  async getGoalProgress(goalId: string): Promise<any> {
    const response = await this.privateRequest<{ success: boolean; data: any }>(`/goals/${goalId}/progress`);
    return (response as any).data;
  }

  // Store Settings API Methods
  async getStoreSettings(storeId?: string): Promise<{
    name: string;
    address: string;
    phone: string;
    email: string;
    currency: string;
    timezone: string;
    tax_rate: number;
    low_stock_threshold: number;
  }> {
    const queryParams = new URLSearchParams();
    if (storeId) queryParams.append('store_id', storeId);

    const response = await this.privateRequest<{ success: boolean; data: any }>(`/stores/settings?${queryParams}`);
    return (response as any).data;
  }

  // Audit Logs API Methods
  async getAuditLogs(queryParams?: string): Promise<{
    logs: any[];
    total: number;
    page: number;
    pages: number;
    limit: number;
  }> {
    const response = await this.privateRequest<{ success: boolean; data: any }>(`/audit/logs${queryParams ? `?${queryParams}` : ''}`);
    return (response as any).data;
  }

  async getResourceAuditTrail(resourceType: string, resourceId: string): Promise<any[]> {
    const response = await this.privateRequest<{ success: boolean; data: any[] }>(`/audit/resource/${resourceType}/${resourceId}`);
    return (response as any).data;
  }

  async getUserActivity(userId?: string): Promise<any[]> {
    const endpoint = userId ? `/audit/user/${userId}` : '/audit/my-activity';
    const response = await this.privateRequest<{ success: boolean; data: any[] }>(endpoint);
    return (response as any).data;
  }

  async getAuditStats(): Promise<{
    totalLogs: number;
    logsByAction: { [key: string]: number };
    logsByResourceType: { [key: string]: number };
    recentActivity: any[];
  }> {
    const response = await this.privateRequest<{ success: boolean; data: any }>('/audit/stats');
    return (response as any).data;
  }

  async updateStoreSettings(storeId: string, settings: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    currency?: string;
    timezone?: string;
    tax_rate?: number;
    low_stock_threshold?: number;
  }): Promise<{
    name: string;
    address: string;
    phone: string;
    email: string;
    currency: string;
    timezone: string;
    tax_rate: number;
    low_stock_threshold: number;
  }> {
    const response = await this.privateRequest<{ success: boolean; data: any }>(`/stores/${storeId}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    return (response as any).data;
  }

  // Notification API methods
  async getNotifications(params?: {
    limit?: number;
    offset?: number;
    priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
    type?: 'MILESTONE' | 'DAILY_SUMMARY' | 'ACHIEVEMENT' | 'GOAL_REMINDER';
    read?: boolean;
  }): Promise<{
    notifications: Array<{
      _id: string;
      user_id: string;
      store_id: string;
      type: 'MILESTONE' | 'DAILY_SUMMARY' | 'ACHIEVEMENT' | 'GOAL_REMINDER';
      priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
      title: string;
      message: string;
      data?: any;
      read: boolean;
      created_at: string;
      expires_at?: string;
    }>;
    total: number;
    unread_count: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.read !== undefined) queryParams.append('read', params.read.toString());

    const response = await this.privateRequest<{ success: boolean; data: any }>(`/notifications?${queryParams.toString()}`);
    return (response as any).data;
  }

  async getUnreadNotificationCount(): Promise<{ unread_count: number }> {
    const response = await this.privateRequest<{ success: boolean; data: any }>('/notifications/unread-count');
    return (response as any).data;
  }

  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    console.log('Marking notification as read:', notificationId);
    const response = await this.privateRequest<{ success: boolean }>(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
    console.log('Mark as read API response:', response);
    return response;
  }

  async markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    console.log('Marking all notifications as read');
    const response = await this.privateRequest<{ success: boolean }>('/notifications/read-all', {
      method: 'PUT'
    });
    console.log('Mark all as read API response:', response);
    return response;
  }

  // Test endpoints for development
  async testMilestoneNotification(): Promise<{ success: boolean; message: string }> {
    const response = await this.privateRequest<{ success: boolean; message: string }>('/notifications/test-milestone', {
      method: 'POST'
    });
    return {
      success: response.success || false,
      message: response.message || 'Test notification sent'
    };
  }

  async testDailySummaryNotification(): Promise<{ success: boolean; message: string }> {
    const response = await this.privateRequest<{ success: boolean; message: string }>('/notifications/test-daily-summary', {
      method: 'POST'
    });
    return {
      success: response.success || false,
      message: response.message || 'Test notification sent'
    };
  }

  // Settings API methods
  async getNotificationSettings(): Promise<{
    lowStockAlerts: boolean;
    dailySalesReport: boolean;
    newUserRegistrations: boolean;
    browserNotifications: boolean;
    soundNotifications: boolean;
  }> {
    const response = await this.privateRequest<{ success: boolean; data: any }>('/settings/notifications');
    return (response as any).data;
  }

  async updateNotificationSettings(settings: {
    lowStockAlerts?: boolean;
    dailySalesReport?: boolean;
    newUserRegistrations?: boolean;
    browserNotifications?: boolean;
    soundNotifications?: boolean;
  }): Promise<{
    lowStockAlerts: boolean;
    dailySalesReport: boolean;
    newUserRegistrations: boolean;
    browserNotifications: boolean;
    soundNotifications: boolean;
  }> {
    const response = await this.privateRequest<{ success: boolean; data: any }>('/settings/notifications', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    return (response as any).data;
  }

  async getSecuritySettings(): Promise<{
    minPasswordLength: boolean;
    requireSpecialChars: boolean;
    passwordExpiration: boolean;
    autoLogout: boolean;
    rememberLogin: boolean;
  }> {
    const response = await this.privateRequest<{ success: boolean; data: any }>('/settings/security');
    return (response as any).data;
  }

  async updateSecuritySettings(settings: {
    minPasswordLength?: boolean;
    requireSpecialChars?: boolean;
    passwordExpiration?: boolean;
    autoLogout?: boolean;
    rememberLogin?: boolean;
  }): Promise<{
    minPasswordLength: boolean;
    requireSpecialChars: boolean;
    passwordExpiration: boolean;
    autoLogout: boolean;
    rememberLogin: boolean;
  }> {
    const response = await this.privateRequest<{ success: boolean; data: any }>('/settings/security', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    return (response as any).data;
  }
}

export const apiService = new ApiService();
