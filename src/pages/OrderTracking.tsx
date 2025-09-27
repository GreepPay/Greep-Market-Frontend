import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, Package, Truck, Phone, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/environment';
import { toast } from 'react-hot-toast';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
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

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-600 bg-yellow-100',
    icon: Clock,
    description: 'Your order has been received and is being reviewed'
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-blue-600 bg-blue-100',
    icon: CheckCircle,
    description: 'Your order has been confirmed and is being prepared'
  },
  preparing: {
    label: 'Preparing',
    color: 'text-orange-600 bg-orange-100',
    icon: Package,
    description: 'Your order is being prepared'
  },
  ready: {
    label: 'Ready',
    color: 'text-green-600 bg-green-100',
    icon: CheckCircle,
    description: 'Your order is ready for pickup/delivery'
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600 bg-green-100',
    icon: CheckCircle,
    description: 'Your order has been completed'
  }
};

export const OrderTracking: React.FC = () => {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const searchOrder = async () => {
    if (!orderNumber.trim()) {
      toast.error('Please enter an order number');
      return;
    }

    setIsLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await fetch(`${api.baseUrl}/public/orders/${orderNumber.trim()}/status`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error('Failed to fetch order status');
      }

      let data;
      try {
        const responseText = await response.text();
        if (responseText) {
          data = JSON.parse(responseText);
        } else {
          throw new Error('Empty response from server');
        }
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from server');
      }
      setOrder(data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch order status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchOrder();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;
    return <Icon className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config?.color || 'text-gray-600 bg-gray-100';
  };

  const getStatusDescription = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config?.description || 'Unknown status';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/catalog')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Catalog
              </Button>
              <img src="/icons/GreepMarket-Green_BG-White.svg" alt="Greep Market" className="h-10 w-10 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Track Your Order
              </h1>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Phone className="h-4 w-4 mr-1" />
              <span>+234 806 456 0393</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Enter Your Order Number
          </h2>
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., ORD-20240101-001"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <Button
              onClick={searchOrder}
              disabled={isLoading}
              className="px-6"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Track Order
                </>
              )}
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Order Status
                </h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  <div className="flex items-center">
                    {getStatusIcon(order.status)}
                    <span className="ml-2">{statusConfig[order.status as keyof typeof statusConfig]?.label}</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {getStatusDescription(order.status)}
              </p>
            </div>

            {/* Order Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Order Number
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono">{order.orderNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Order Date
                  </label>
                  <p className="text-gray-900 dark:text-white">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer Name
                  </label>
                  <p className="text-gray-900 dark:text-white">{order.customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <p className="text-gray-900 dark:text-white">{order.customerPhone}</p>
                </div>
                {order.customerEmail && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 dark:text-white">{order.customerEmail}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Method
                  </label>
                  <p className="text-gray-900 dark:text-white capitalize">{order.paymentMethod}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Delivery Method
                  </label>
                  <p className="text-gray-900 dark:text-white capitalize">
                    {order.deliveryMethod === 'delivery' ? 'Delivery' : 'Self Pickup'}
                  </p>
                </div>
                {order.deliveryAddress && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Delivery Address
                    </label>
                    <p className="text-gray-900 dark:text-white">{order.deliveryAddress}</p>
                  </div>
                )}
                {order.notes && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <p className="text-gray-900 dark:text-white">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Items
              </h2>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {item.productName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Quantity: {item.quantity} × ₺{item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ₺{item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-gray-900 dark:text-white">₺{order.subtotal.toFixed(2)}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Delivery Fee:</span>
                    <span className="text-gray-900 dark:text-white">₺{order.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t border-gray-300 dark:border-gray-600 pt-2">
                  <span>Total:</span>
                  <span>₺{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Need Help?
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm mb-4">
                If you have any questions about your order, please contact us:
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center text-blue-800 dark:text-blue-200">
                  <Phone className="h-4 w-4 mr-1" />
                  <span>+234 806 456 0393</span>
                </div>
                <div className="flex items-center text-blue-800 dark:text-blue-200">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>Efsane Sk, Gönyeli 1010, Lefosia, North Cyprus</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Order State */}
        {!order && !isLoading && !error && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Track Your Order
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your order number above to check the status of your order
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
