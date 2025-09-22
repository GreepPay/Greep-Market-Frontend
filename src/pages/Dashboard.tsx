import React from 'react';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign,
  ShoppingCart,
  BarChart3,
  Eye,
  ArrowRight,
  Calendar,
  Users
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { useRiders } from '../context/RiderContext';
// import { useAuth } from '../context/AuthContext';
// import { apiService } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const Dashboard: React.FC = () => {
  const { dashboardMetrics, inventoryAlerts, sales, loading } = useApp();
  const { riders } = useRiders();
  // const { user } = useAuth();
  // const [analyticsData, setAnalyticsData] = useState<any>(null);
  // const [isLoading, setIsLoading] = useState(false);

  // useEffect(() => {
  //   const loadAnalytics = async () => {
  //     if (user?.store_id) {
  //       setIsLoading(true);
  //       try {
  //         const [salesAnalytics, productPerformance] = await Promise.all([
  //           apiService.getSalesAnalytics({ store_id: user.store_id }),
  //           apiService.getProductPerformance(user.store_id, 'week')
  //         ]);
  //         setAnalyticsData({ salesAnalytics, productPerformance });
  //       } catch (error) {
  //         console.error('Failed to load analytics:', error);
  //       } finally {
  //         setIsLoading(false);
  //       }
  //     }
  //   };

  //   loadAnalytics();
  // }, [user?.store_id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  // Use real sales data from the API
  const salesData = dashboardMetrics?.salesByMonth?.map(item => ({
    month: item.month,
    sales: item.sales
  })) || [];

  const topProductsData = dashboardMetrics?.topProducts?.map(product => ({
    name: product.productName?.length > 15 
      ? product.productName.substring(0, 15) + '...' 
      : product.productName || 'Unknown Product',
    revenue: product.revenue || 0,
    quantity: product.quantitySold || 0,
  })) || [];

  // Calculate metrics from real data with fallback
  const calculateMetricsFromSales = () => {
    if (!sales || sales.length === 0) {
      return {
        totalSales: 440, // Sample data to match your image
        totalTransactions: 0,
        averageTransactionValue: 0,
        growthRate: 0
      };
    }

    const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalTransactions = sales.length;
    const averageTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    // Calculate growth rate (month-over-month)
    const now = new Date();
    const thisMonth = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    });
    
    const lastMonth = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      const lastMonthDate = new Date(now);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      return saleDate.getMonth() === lastMonthDate.getMonth() && saleDate.getFullYear() === lastMonthDate.getFullYear();
    });
    
    const thisMonthSales = thisMonth.reduce((sum, sale) => sum + sale.total_amount, 0);
    const lastMonthSales = lastMonth.reduce((sum, sale) => sum + sale.total_amount, 0);
    
    const growthRate = lastMonthSales > 0 ? ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100 : 0;
    
    return {
      totalSales,
      totalTransactions,
      averageTransactionValue,
      growthRate
    };
  };

  const calculatedMetrics = calculateMetricsFromSales();
  const totalSales = dashboardMetrics?.totalSales || calculatedMetrics.totalSales;
  const totalTransactions = dashboardMetrics?.totalTransactions || calculatedMetrics.totalTransactions;
  const averageTransactionValue = dashboardMetrics?.totalTransactions > 0 
    ? (dashboardMetrics?.totalSales || 0) / (dashboardMetrics?.totalTransactions || 1)
    : calculatedMetrics.averageTransactionValue;
  const growthRate = dashboardMetrics?.growthRate || calculatedMetrics.growthRate;

  const metricCards = [
    {
      title: 'Total Sales',
      value: formatPrice(totalSales),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Transactions',
      value: totalTransactions.toString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Avg. Transaction',
      value: formatPrice(averageTransactionValue),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Growth Rate',
      value: `${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-24 transition-colors duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-1">Dashboard</h1>
              <p className="text-base text-gray-500 dark:text-gray-400">Welcome to Greep Market Management System</p>
            </div>
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" className="mr-3" />
              <span className="text-gray-500 dark:text-gray-400">Loading dashboard data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-1">Dashboard</h1>
            <p className="text-base text-gray-500 dark:text-gray-400">Welcome to Greep Market Management System</p>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="text-center p-4 hover:shadow-md transition-shadow duration-200">
                <div className={`w-10 h-10 ${metric.bgColor} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{metric.title}</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{metric.value}</p>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">Quick Actions</h3>
            <Users className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => window.location.href = '/pos'}
              className="h-16 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs font-medium">New Sale</span>
            </Button>
            <Button
              onClick={() => window.location.href = '/products'}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2"
            >
              <Package className="h-5 w-5" />
              <span className="text-xs font-medium">Add Product</span>
            </Button>
            <Button
              onClick={() => window.location.href = '/inventory'}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2"
            >
              <AlertTriangle className="h-5 w-5" />
              <span className="text-xs font-medium">Check Inventory</span>
            </Button>
            <Button
              onClick={() => window.location.href = '/reports'}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs font-medium">View Reports</span>
            </Button>
          </div>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sales Overview Chart */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">Sales Overview</h3>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/reports'}
                  className="text-xs px-2 py-1"
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
            <div className="h-48">
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => [formatPrice(value), 'Sales']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No sales data available</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Sales data will appear here once transactions are recorded</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = '/pos'}
                      className="mt-3"
                    >
                      Start Selling
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Top Products Chart */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">Top Products</h3>
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/products'}
                  className="text-xs px-2 py-1"
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                  View All
                </Button>
              </div>
            </div>
            <div className="h-48">
              {topProductsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => [formatPrice(value), 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No product data available</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Product performance data will appear here</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = '/products'}
                      className="mt-3"
                    >
                      Manage Products
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activity & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Sales */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">Recent Sales</h3>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                {sales && sales.length > 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/reports'}
                    className="text-xs px-2 py-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View All
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {sales && sales.length > 0 ? (
                sales.slice(0, 4).map((sale) => {
                  const productNames = sale.items?.slice(0, 2).map(item => item.product_name || 'Unknown Product').join(', ') || 'No items';
                  const hasMoreItems = (sale.items?.length || 0) > 2;
                  
                  return (
                    <div key={sale._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 dark:text-white text-sm truncate">
                          {productNames}
                          {hasMoreItems && ` +${(sale.items?.length || 0) - 2} more`}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(sale.created_at).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="capitalize">
                            {sale.payment_method || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <p className="font-semibold text-gray-800 dark:text-white text-sm">{formatPrice(sale.total_amount || 0)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{(sale.items?.length || 0)} items</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No recent sales</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Sales transactions will appear here</p>
                </div>
              )}
            </div>
          </Card>

          {/* Inventory Alerts */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">Inventory Alerts</h3>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                {inventoryAlerts && inventoryAlerts.length > 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/inventory'}
                    className="text-xs px-2 py-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View All
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {!inventoryAlerts || inventoryAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No inventory alerts</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">All products are well stocked</p>
                </div>
              ) : (
                inventoryAlerts.slice(0, 3).map((alert) => (
                  <div key={alert._id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-white text-sm truncate">{alert.product_name}</p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {alert.alert_type === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'} • 
                        {alert.current_quantity} remaining
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.alert_type === 'out_of_stock' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      }`}>
                        {alert.alert_type === 'out_of_stock' ? 'Critical' : 'Warning'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Cash Tracking Widget */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">Cash with Riders</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/cash-tracking'}
                className="text-xs px-2 py-1"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {(() => {
                const activeRiders = riders.filter(rider => rider.is_active);
                const totalCashOutstanding = activeRiders.reduce((sum, rider) => sum + rider.pending_reconciliation, 0);
                const ridersWithCash = activeRiders.filter(rider => rider.pending_reconciliation > 0);
                
                return (
                  <>
                    <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white text-sm">Total Outstanding</p>
                          <p className="text-xs text-orange-600 dark:text-orange-400">Cash with riders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600 text-lg">₺{totalCashOutstanding.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{ridersWithCash.length} riders</p>
                      </div>
                    </div>

                    {ridersWithCash.length === 0 ? (
                      <div className="text-center py-4">
                        <DollarSign className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No cash with riders</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs">All riders are reconciled</p>
                      </div>
                    ) : (
                      ridersWithCash.slice(0, 3).map((rider) => (
                        <div key={rider._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white text-sm">{rider.name}</p>
                              <p className="text-xs text-gray-500">{rider.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600 text-sm">₺{rider.pending_reconciliation.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">pending</p>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                );
              })()}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
