import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  Package, 
  Truck,
  MessageSquare,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  RefreshCw,
  X
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CustomerOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  paymentMethod: string;
  deliveryMethod: string;
  deliveryAddress?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed';
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  whatsappSent: boolean;
}

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-600 bg-yellow-100',
    icon: Clock,
    nextStatus: 'confirmed'
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-blue-600 bg-blue-100',
    icon: CheckCircle,
    nextStatus: 'preparing'
  },
  preparing: {
    label: 'Preparing',
    color: 'text-orange-600 bg-orange-100',
    icon: Package,
    nextStatus: 'ready'
  },
  ready: {
    label: 'Ready',
    color: 'text-green-600 bg-green-100',
    icon: CheckCircle,
    nextStatus: 'completed'
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600 bg-green-100',
    icon: CheckCircle,
    nextStatus: null
  }
};

export const AdminCustomerOrders: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Check if user has admin access
  const hasAccess = currentUser && ['admin', 'owner', 'manager'].includes(currentUser.role);

  // Load orders and stats
  const loadOrders = async () => {
    try {
      console.log('🔍 Loading customer orders from API...');
      const response = await apiService.request('/admin/customer-orders', {
        method: 'GET',
      });
      
      console.log('🔍 API Response:', response);
      
      if (!response.success) throw new Error('Failed to load orders');
      
      const data = response.data as { orders: CustomerOrder[]; stats: OrderStats };
      console.log('🔍 Parsed Data:', data);
      
      setOrders(data.orders || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error loading orders:', error);
      console.log('🔍 Setting empty orders array due to error');
      
      // Set empty data instead of leaving undefined
      setOrders([]);
      setStats(null);
      
      // Add some sample data for testing the UI
      console.log('🔍 Adding sample data for testing...');
      const sampleOrders: CustomerOrder[] = [
        {
          _id: 'sample1',
          orderNumber: 'ORD-001',
          customerName: 'John Doe',
          customerPhone: '+90 555 123 4567',
          customerEmail: 'john@example.com',
          items: [
            {
              productId: 'prod1',
              productName: 'Sample Product 1',
              quantity: 2,
              unitPrice: 25.50,
              totalPrice: 51.00
            }
          ],
          paymentMethod: 'cash',
          deliveryMethod: 'pickup',
          deliveryAddress: undefined,
          notes: 'Sample order for testing',
          status: 'confirmed',
          subtotal: 51.00,
          deliveryFee: 0,
          total: 51.00,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          whatsappSent: false
        },
        {
          _id: 'sample2',
          orderNumber: 'ORD-002',
          customerName: 'Jane Smith',
          customerPhone: '+90 555 987 6543',
          customerEmail: 'jane@example.com',
          items: [
            {
              productId: 'prod2',
              productName: 'Sample Product 2',
              quantity: 1,
              unitPrice: 75.00,
              totalPrice: 75.00
            }
          ],
          paymentMethod: 'card',
          deliveryMethod: 'delivery',
          deliveryAddress: '123 Sample Street, Sample City',
          notes: undefined,
          status: 'pending',
          subtotal: 75.00,
          deliveryFee: 10.00,
          total: 85.00,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          whatsappSent: false
        }
      ];
      
      const sampleStats: OrderStats = {
        totalOrders: 2,
        totalRevenue: 136.00,
        averageOrderValue: 68.00,
        pendingOrders: 1,
        completedOrders: 0
      };
      
      setOrders(sampleOrders);
      setStats(sampleStats);
      
      toast.error('Failed to load orders - showing sample data. API endpoint may not exist');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      loadOrders();
    } else {
      setIsLoading(false);
    }
  }, [hasAccess]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = (order.orderNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                           (order.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                           (order.customerPhone || '').includes(searchQuery);
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      const matchesDate = (() => {
        if (dateFilter === 'all') return true;
        
        if (!order.createdAt) return false;
        
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            return orderDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      })();
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchQuery, statusFilter, dateFilter]);

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await apiService.request(`/admin/customer-orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.success) throw new Error('Failed to update order status');

      toast.success('Order status updated successfully');
      loadOrders(); // Reload orders
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  // Convert order to transaction
  const convertToTransaction = async (orderId: string) => {
    try {
      const response = await apiService.request(`/admin/customer-orders/${orderId}/convert-to-transaction`, {
        method: 'POST',
      });

      if (!response.success) throw new Error('Failed to convert order to transaction');

      toast.success('Order converted to transaction successfully');
      loadOrders(); // Reload orders
    } catch (error) {
      console.error('Error converting order:', error);
      toast.error('Failed to convert order to transaction');
    }
  };

  // Generate WhatsApp message
  const generateWhatsAppMessage = (order: CustomerOrder) => {
    // Add safety checks for order and items
    if (!order || !order.items || !Array.isArray(order.items)) {
      return `🛒 *New Order Placed*\n\n👤 *Customer:* ${order?.customerName || 'N/A'}\n📞 *Phone:* ${order?.customerPhone || 'N/A'}\n\n⚠️ *Items data unavailable*`;
    }
    
    const itemsText = order.items.map(item => 
      `• ${item.productName || 'N/A'} x${item.quantity || 0} - ₺${(item.totalPrice || 0).toFixed(2)}`
    ).join('\n');

    return `🛒 *New Order Placed*

👤 *Customer:* ${order.customerName || 'N/A'}
📞 *Phone:* ${order.customerPhone || 'N/A'}
${order.customerEmail ? `📧 *Email:* ${order.customerEmail}` : ''}

📦 *Items:*
${itemsText}

💰 *Subtotal:* ₺${(order.subtotal || 0).toFixed(2)}
${(order.deliveryFee || 0) > 0 ? `🚚 *Delivery Fee:* ₺${(order.deliveryFee || 0).toFixed(2)}` : ''}
💰 *Total:* ₺${(order.total || 0).toFixed(2)}

💳 *Payment:* ${(order.paymentMethod || '').toUpperCase()}
${order.deliveryMethod === 'delivery' ? `🚚 *Delivery Address:* ${order.deliveryAddress || 'N/A'}` : '🏪 *Pickup:* Self-pickup'}
${order.notes ? `📝 *Notes:* ${order.notes}` : ''}

Please confirm this order and let me know when it's ready!

Thank you! 🙏`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;
    return <Icon className="h-4 w-4" />;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config?.color || 'text-gray-600 bg-gray-100';
  };

  // Check if user has admin access
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Customer Orders
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage customer orders and track their status
            </p>
          </div>
          <Button onClick={loadOrders} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">₺{stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Order Value</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">₺{stats.averageOrderValue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Orders</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.pendingOrders}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders, customers, or phone numbers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                aria-label="Filter by date"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.orderNumber || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {(order.paymentMethod || '').toUpperCase()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.customerName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {order.customerPhone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ₺{(order.total || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{statusConfig[order.status as keyof typeof statusConfig]?.label}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {statusConfig[order.status as keyof typeof statusConfig]?.nextStatus && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateOrderStatus(order._id, statusConfig[order.status as keyof typeof statusConfig]?.nextStatus!)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {order.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => convertToTransaction(order._id)}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No orders found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Order Details - {selectedOrder.orderNumber}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Customer Name
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedOrder.customerName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedOrder.customerPhone || 'N/A'}</p>
                  </div>
                  {selectedOrder.customerEmail && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedOrder.customerEmail}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Payment Method
                    </label>
                    <p className="text-gray-900 dark:text-white capitalize">{selectedOrder.paymentMethod || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Delivery Method
                    </label>
                    <p className="text-gray-900 dark:text-white capitalize">
                      {selectedOrder.deliveryMethod === 'delivery' ? 'Delivery' : 'Self Pickup'}
                    </p>
                  </div>
                  {selectedOrder.deliveryAddress && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Delivery Address
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedOrder.deliveryAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Order Items</h3>
                <div className="space-y-3">
                  {(selectedOrder.items || []).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {item.productName || 'N/A'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Quantity: {item.quantity || 0} × ₺{(item.unitPrice || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ₺{(item.totalPrice || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₺{(selectedOrder.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {(selectedOrder.deliveryFee || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>₺{(selectedOrder.deliveryFee || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t border-gray-300 dark:border-gray-600 pt-2">
                    <span>Total:</span>
                    <span>₺{(selectedOrder.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {statusConfig[selectedOrder.status as keyof typeof statusConfig]?.nextStatus && (
                    <Button
                      onClick={() => {
                        updateOrderStatus(selectedOrder._id, statusConfig[selectedOrder.status as keyof typeof statusConfig]?.nextStatus!);
                        setIsDetailModalOpen(false);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as {statusConfig[statusConfig[selectedOrder.status as keyof typeof statusConfig]?.nextStatus as keyof typeof statusConfig]?.label}
                    </Button>
                  )}
                  {selectedOrder.status === 'completed' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        convertToTransaction(selectedOrder._id);
                        setIsDetailModalOpen(false);
                      }}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Convert to Transaction
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={`https://wa.me/2348064560393?text=${encodeURIComponent(generateWhatsAppMessage(selectedOrder || {}))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
