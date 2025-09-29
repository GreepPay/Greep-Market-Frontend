import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download,
  DollarSign,
  ShoppingCart,
  Package,
  Trophy,
  Shield,
  History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { formatStockQuantity } from '../utils/formatUtils';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PerformanceDashboard } from '../components/ui/PerformanceDashboard';
import { ReportPeriodFilter } from '../components/ui/ReportPeriodFilter';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../services/api';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export const Reports: React.FC = () => {
  const { products, dashboardMetrics, sales, loading } = useApp();
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  // Tooltip styles based on theme
  const getTooltipStyles = () => ({
    contentStyle: {
      backgroundColor: isDark ? '#1F2937' : '#ffffff',
      border: isDark ? '1px solid #4B5563' : '1px solid #e5e7eb',
      borderRadius: '8px',
      color: isDark ? '#F9FAFB' : '#374151',
      fontSize: '14px',
      fontWeight: '500',
      padding: '8px 12px',
      boxShadow: isDark 
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    },
    labelStyle: {
      color: isDark ? '#F9FAFB' : '#374151',
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '4px'
    },
    itemStyle: {
      color: isDark ? '#F9FAFB' : '#374151'
    }
  });

  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this_month');
  const [periodStartDate, setPeriodStartDate] = useState<Date | undefined>();
  const [periodEndDate, setPeriodEndDate] = useState<Date | undefined>();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<'sales' | 'inventory' | 'products' | 'performance'>('performance');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (user?.store_id) {
        setIsLoading(true);
        try {
          // Use explicit date ranges to avoid timezone confusion (same as Dashboard)
          const analyticsParams: any = { store_id: user.store_id };
          
          if (periodStartDate && periodEndDate) {
            // Custom date range - use explicit UTC dates
            const startDate = new Date(periodStartDate);
            const endDate = new Date(periodEndDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            
            analyticsParams.startDate = startDate.toISOString();
            analyticsParams.endDate = endDate.toISOString();
          } else {
            // Calculate explicit date ranges based on period selection
            const now = new Date();
            let startDate: Date;
            let endDate: Date;
            
            switch (selectedPeriod) {
              case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                break;
              case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                break;
              case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                break;
              case '1y':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                break;
              default:
                // Default to 30 days
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            }
            
            analyticsParams.startDate = startDate.toISOString();
            analyticsParams.endDate = endDate.toISOString();
          }

          // Load dashboard analytics data with explicit date ranges
          const dashboardAnalytics = await apiService.getDashboardAnalytics(analyticsParams);
          
          // Load additional analytics for reports
          const [productPerformance, inventoryAnalytics] = await Promise.all([
            apiService.getProductPerformance(user.store_id, selectedPeriod, periodStartDate, periodEndDate),
            apiService.getInventoryAnalytics(user.store_id)
          ]);
          
          setAnalyticsData({ 
            dashboardAnalytics, 
            productPerformance, 
            inventoryAnalytics 
          });
        } catch (error) {
          console.error('Failed to load analytics:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadAnalytics();
  }, [user?.store_id, selectedPeriod, periodStartDate, periodEndDate]);

  const handlePeriodChange = (period: string, startDate?: Date, endDate?: Date) => {
    setSelectedPeriod(period);
    setPeriodStartDate(startDate);
    setPeriodEndDate(endDate);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  const handleExportReport = async () => {
    if (!analyticsData) {
      toast.error('No data available to export');
      return;
    }

    setIsExporting(true);
    try {
      const dashboardData = analyticsData?.dashboardAnalytics;
      const productData = analyticsData?.productPerformance;
      const inventoryData = analyticsData?.inventoryAnalytics;
      
      // Debug: Log the actual data structure
      console.log('🔍 Export Debug - Analytics Data:', {
        dashboardData: dashboardData,
        todaySales: dashboardData?.todaySales,
        monthlySales: dashboardData?.monthlySales,
        selectedPeriod: selectedPeriod,
        periodStartDate: periodStartDate,
        periodEndDate: periodEndDate,
        topProducts: dashboardData?.topProducts,
        recentTransactions: dashboardData?.recentTransactions,
        productData: productData,
        inventoryData: inventoryData
      });
      
      // Generate comprehensive report data
      const reportData = [];
      
      // Add report metadata
      const reportDate = new Date().toLocaleDateString('tr-TR');
      const periodText = selectedPeriod === 'custom' 
        ? `${periodStartDate?.toLocaleDateString('tr-TR')} - ${periodEndDate?.toLocaleDateString('tr-TR')}`
        : selectedPeriod;
      
      reportData.push(['Greep Market - Business Report']);
      reportData.push(['Generated on:', reportDate]);
      reportData.push(['Report Period:', periodText]);
      reportData.push(['Report Type:', selectedReport]);
      reportData.push(['Note:', `Today's sales and monthly sales may appear similar if using same date range filter`]);
      reportData.push(['']); // Empty row
      
      // Add dashboard metrics
      if (dashboardData) {
        reportData.push(['DASHBOARD METRICS']);
        reportData.push(['Metric', 'Value']);
        reportData.push(['Total Sales', `₺${dashboardData.totalSales?.toFixed(2) || '0.00'}`]);
        reportData.push(['Total Transactions', dashboardData.totalTransactions?.toString() || '0']);
        reportData.push(['Total Products', dashboardData.totalProducts?.toString() || '0']);
        reportData.push(['Low Stock Items', dashboardData.lowStockItems?.toString() || '0']);
        reportData.push(['Today Sales', `₺${dashboardData.todaySales?.toFixed(2) || '0.00'}`]);
        reportData.push(['Monthly Sales', `₺${dashboardData.monthlySales?.toFixed(2) || '0.00'}`]);
        reportData.push(['Average Transaction Value', `₺${dashboardData.averageTransactionValue?.toFixed(2) || '0.00'}`]);
        reportData.push(['Growth Rate', `${dashboardData.growthRate?.toFixed(2) || '0.00'}%`]);
        reportData.push(['Sales vs Yesterday', `${dashboardData.salesVsYesterday > 0 ? '+' : ''}${dashboardData.salesVsYesterday?.toFixed(2) || '0.00'}%`]);
        reportData.push(['Expenses vs Yesterday', `${dashboardData.expensesVsYesterday > 0 ? '+' : ''}${dashboardData.expensesVsYesterday?.toFixed(2) || '0.00'}%`]);
        reportData.push(['Profit vs Yesterday', `${dashboardData.profitVsYesterday > 0 ? '+' : ''}${dashboardData.profitVsYesterday?.toFixed(2) || '0.00'}%`]);
        reportData.push(['Transactions vs Yesterday', `${dashboardData.transactionsVsYesterday > 0 ? '+' : ''}${dashboardData.transactionsVsYesterday?.toFixed(2) || '0.00'}%`]);
        reportData.push(['Total Expenses', `₺${dashboardData.totalExpenses?.toFixed(2) || '0.00'}`]);
        reportData.push(['Monthly Expenses', `₺${dashboardData.monthlyExpenses?.toFixed(2) || '0.00'}`]);
        reportData.push(['Net Profit', `₺${dashboardData.netProfit?.toFixed(2) || '0.00'}`]);
        reportData.push(['']); // Empty row
      }
      
      // Add sales data by month
      if (dashboardData?.salesByMonth && dashboardData.salesByMonth.length > 0) {
        reportData.push(['SALES BY MONTH']);
        reportData.push(['Month', 'Sales (₺)', 'Transactions']);
        dashboardData.salesByMonth.forEach((item: any) => {
          reportData.push([
            item.month || item.date || 'N/A',
            item.sales?.toFixed(2) || '0.00',
            item.transactions?.toString() || '0'
          ]);
        });
        reportData.push(['']); // Empty row
      }
      
      // Add top products
      if (dashboardData?.topProducts && dashboardData.topProducts.length > 0) {
        reportData.push(['TOP PRODUCTS']);
        reportData.push(['Product Name', 'Quantity Sold', 'Revenue (₺)']);
        dashboardData.topProducts.forEach((product: any) => {
          reportData.push([
            product.productName || 'Unknown Product',
            product.quantitySold?.toString() || '0',
            product.revenue?.toFixed(2) || '0.00'
          ]);
        });
        reportData.push(['']); // Empty row
      }
      
      // Add recent transactions
      if (dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0) {
        reportData.push(['RECENT TRANSACTIONS']);
        reportData.push(['Date', 'Amount (₺)', 'Payment Method']);
        dashboardData.recentTransactions.forEach((transaction: any) => {
          reportData.push([
            new Date(transaction.createdAt).toLocaleDateString('tr-TR'),
            transaction.totalAmount?.toFixed(2) || '0.00',
            transaction.paymentMethod || 'Cash'
          ]);
        });
        reportData.push(['']); // Empty row
      }
      
      // Add product performance data if available
      if (productData) {
        // Handle different possible data structures
        const products = productData.topSellingProducts || productData.products || productData;
        
        if (Array.isArray(products) && products.length > 0) {
          reportData.push(['PRODUCT PERFORMANCE']);
          reportData.push(['Product Name', 'Category', 'Stock', 'Sold', 'Revenue (₺)']);
          products.forEach((product: any) => {
            // Better category handling with debugging
            const category = product.category || product.categoryName || 'No Category';
            console.log('Product category debug:', {
              productName: product.productName || product.name,
              category: product.category,
              categoryName: product.categoryName,
              finalCategory: category
            });
            
            reportData.push([
              product.productName || product.name || 'Unknown Product',
              category,
              product.stock?.toString() || product.stockQuantity?.toString() || '0',
              product.quantitySold || product.sold?.toString() || '0',
              product.revenue?.toFixed(2) || '0.00'
            ]);
          });
          reportData.push(['']); // Empty row
        }
      }
      
      // Add inventory analytics if available
      if (inventoryData) {
        reportData.push(['INVENTORY ANALYTICS']);
        reportData.push(['Metric', 'Value']);
        if (inventoryData.lowStockProducts) {
          reportData.push(['Low Stock Products', inventoryData.lowStockProducts.toString()]);
        }
        if (inventoryData.totalInventoryValue) {
          reportData.push(['Total Inventory Value', `₺${inventoryData.totalInventoryValue.toFixed(2)}`]);
        }
        if (inventoryData.fastMovingProducts) {
          reportData.push(['Fast Moving Products', inventoryData.fastMovingProducts.toString()]);
        }
        if (inventoryData.slowMovingProducts) {
          reportData.push(['Slow Moving Products', inventoryData.slowMovingProducts.toString()]);
        }
      }
      
      // Convert to CSV
      const csvContent = reportData.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const cellStr = String(cell || '');
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ).join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const filename = `greep-market-report-${selectedReport}-${periodText.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Use dashboard analytics data first, then fallback to calculated metrics
  const dashboardData = analyticsData?.dashboardAnalytics;

  // Generate sales data from dashboard analytics or actual transactions
  const generateSalesData = () => {
    // Use dashboard analytics data if available
    if (dashboardData?.salesByMonth && dashboardData.salesByMonth.length > 0) {
      return dashboardData.salesByMonth.map((item: any) => ({
        date: item.month || item.date,
        sales: item.sales || 0,
        transactions: item.transactions || 0
      }));
    }
    
    if (!sales || sales.length === 0) {
      // Return empty data when no real data exists
      return [];
    }
    
    const now = new Date();
    const data = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySales = sales.filter(sale => {
        const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
        return saleDate === dateStr;
      });
      
      const totalSales = daySales.reduce((sum, sale) => sum + sale.total_amount, 0);
      const transactionCount = daySales.length;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: totalSales,
        transactions: transactionCount
      });
    }
    
    return data;
  };

  const salesData = generateSalesData();

  // Generate payment method data from actual transactions (using AMOUNTS, not counts)
  const generatePaymentMethodData = () => {
    if (!sales || sales.length === 0) {
      // Generate sample payment method data
      return [
        { name: 'Cash', value: 45, percentage: '45.0', color: '#22c55e' },
        { name: 'POS', value: 35, percentage: '35.0', color: '#3b82f6' },
        { name: 'Transfer', value: 15, percentage: '15.0', color: '#8b5cf6' },
        { name: 'Crypto', value: 5, percentage: '5.0', color: '#f59e0b' }
      ];
    }
    
    const paymentMethods: { [key: string]: number } = {};
    let totalAmount = 0;
    
    sales.forEach(sale => {
      // Handle both new (payment_methods array) and legacy (single payment_method) formats
      if (sale.payment_methods && sale.payment_methods.length > 0) {
        // New format: payment_methods array
        sale.payment_methods.forEach(method => {
          let methodKey: string;
          switch (method.type) {
            case 'pos_isbank_transfer':
            case 'card': // Legacy support for card payments
              methodKey = 'pos';
              break;
            case 'naira_transfer':
              methodKey = 'transfer';
              break;
            case 'crypto_payment':
              methodKey = 'crypto';
              break;
            default:
              methodKey = method.type;
          }
          paymentMethods[methodKey] = (paymentMethods[methodKey] || 0) + method.amount;
          totalAmount += method.amount;
        });
      } else if (sale.payment_method) {
        // Legacy format: single payment_method field
        const method = sale.payment_method.toLowerCase();
        let methodKey: string;
        switch (method) {
          case 'pos_isbank_transfer':
          case 'card': // Legacy support for card payments
            methodKey = 'pos';
            break;
          case 'naira_transfer':
            methodKey = 'transfer';
            break;
          case 'crypto_payment':
            methodKey = 'crypto';
            break;
          default:
            methodKey = method;
        }
        paymentMethods[methodKey] = (paymentMethods[methodKey] || 0) + sale.total_amount;
        totalAmount += sale.total_amount;
      }
    });
    
    return Object.entries(paymentMethods).map(([method, amount]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: amount,
      percentage: totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : '0.0',
      color: getPaymentMethodColor(method)
    }));
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: { [key: string]: string } = {
      'cash': '#22c55e',      // Green
      'pos': '#3b82f6',       // Blue (for pos_isbank_transfer and card)
      'transfer': '#8b5cf6',  // Purple (for naira_transfer)
      'crypto': '#f59e0b',    // Orange (for crypto_payment)
      // Legacy support
      'pos_isbank_transfer': '#3b82f6',      // Blue  
      'naira_transfer': '#8b5cf6',  // Purple
      'crypto_payment': '#f59e0b',       // Orange
      'card': '#3b82f6',      // Blue (legacy)
      'unknown': '#6b7280'    // Gray
    };
    return colors[method] || '#6b7280';
  };

  const paymentMethodData = generatePaymentMethodData();

  const topProductsData = analyticsData?.productPerformance?.topSellingProducts?.map((product: any) => ({
    name: product.productName.length > 15 
      ? product.productName.substring(0, 15) + '...' 
      : product.productName,
    revenue: product.revenue,
    quantity: product.quantitySold,
  })) || [];

  const inventoryStatusData = [
    { name: 'In Stock', value: (products || []).filter(p => p.stock_quantity > p.min_stock_level).length, color: '#22c55e' },
    { name: 'Low Stock', value: (products || []).filter(p => p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0).length, color: '#f59e0b' },
    { name: 'Out of Stock', value: (products || []).filter(p => p.stock_quantity === 0).length, color: '#ef4444' },
  ];

  // Calculate metrics from real data with fallback to sales data
  const calculateMetricsFromSales = () => {
    if (!sales || sales.length === 0) {
      return {
        totalSales: 0,
        totalTransactions: 0,
        averageTransactionValue: 0,
        growthRate: 0
      };
    }

    const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalTransactions = sales.length;
    const averageTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    // Calculate growth rate (month-over-month and day-over-day)
    const now = new Date();
    
    // Today's sales
    const today = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate.toDateString() === now.toDateString();
    });
    
    // Yesterday's sales
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate.toDateString() === yesterday.toDateString();
    });
    
    // This month's sales
    const thisMonth = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    });
    
    // Last month's sales
    const lastMonth = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      const lastMonthDate = new Date(now);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      return saleDate.getMonth() === lastMonthDate.getMonth() && saleDate.getFullYear() === lastMonthDate.getFullYear();
    });
    
    const todaySales = today.reduce((sum, sale) => sum + sale.total_amount, 0);
    const yesterdaySalesAmount = yesterdaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const thisMonthSales = thisMonth.reduce((sum, sale) => sum + sale.total_amount, 0);
    const lastMonthSales = lastMonth.reduce((sum, sale) => sum + sale.total_amount, 0);
    
    const growthRate = lastMonthSales > 0 ? ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100 : (thisMonthSales > 0 ? 100 : 0);
    const todayGrowthRate = yesterdaySalesAmount > 0 ? ((todaySales - yesterdaySalesAmount) / yesterdaySalesAmount) * 100 : (todaySales > 0 ? 100 : 0);
    
    return {
      totalSales,
      totalTransactions,
      averageTransactionValue,
      growthRate,
      todayGrowthRate,
      todaySales,
      yesterdaySalesAmount,
      thisMonthSales,
      lastMonthSales
    };
  };

  const calculatedMetrics = calculateMetricsFromSales();
  
  const totalSales = dashboardData?.totalSales || dashboardMetrics?.totalSales || calculatedMetrics.totalSales;
  const totalTransactions = dashboardData?.totalTransactions || dashboardMetrics?.totalTransactions || calculatedMetrics.totalTransactions;
  const averageTransactionValue = dashboardData?.averageTransactionValue || 
    (dashboardMetrics?.totalTransactions > 0 
      ? (dashboardMetrics?.totalSales || 0) / (dashboardMetrics?.totalTransactions || 1)
      : calculatedMetrics.averageTransactionValue);
  const growthRate = dashboardData?.growthRate || dashboardMetrics?.growthRate || calculatedMetrics.growthRate;

  const reportTabs = [
    { id: 'performance', label: 'Performance Dashboard', icon: Trophy },
    { id: 'sales', label: 'Sales Report', icon: DollarSign },
    { id: 'inventory', label: 'Inventory Report', icon: Package },
    { id: 'products', label: 'Product Performance', icon: BarChart3 },
  ];


  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 opacity-50"></div>
            <div className="relative p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Analyze your business performance</p>
                </div>
              </div>
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" className="mr-4" />
                <span className="text-gray-500 dark:text-gray-400 text-lg">Loading reports data...</span>
              </div>
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
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 opacity-50"></div>
          <div className="relative p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Analyze your business performance with detailed insights</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{formatPrice(totalSales)} total sales</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{totalTransactions} transactions</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>{products.length} products</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => navigate('/audit')}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Audit
                </Button>
                <Button 
                  onClick={() => navigate('/sales-history')}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <History className="h-4 w-4 mr-2" />
                  Sales Summary
                </Button>
                <Button 
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleExportReport}
                  disabled={isExporting || !analyticsData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export Report'}
                </Button>
              </div>
            </div>
          </div>
        </div>



        {/* Enhanced Report Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Report Types</h2>
            <div className="flex flex-wrap gap-3">
              {reportTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedReport(tab.id as any)}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      selectedReport === tab.id
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-sm'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Enhanced Period Filter */}
        <ReportPeriodFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
        />

      {/* Performance Dashboard */}
      {selectedReport === 'performance' && (
        <PerformanceDashboard 
          storeId={user?.store_id || ''} 
          analyticsData={analyticsData}
          isLoading={isLoading}
        />
      )}

      {/* Sales Report */}
      {selectedReport === 'sales' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Sales</h3>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatPrice(totalSales)}</p>
            </Card>

            <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Transactions</h3>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{totalTransactions}</p>
            </Card>

            <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Avg. Transaction</h3>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatPrice(averageTransactionValue)}</p>
            </Card>

            <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Growth Rate</h3>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%</p>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales Trend</h3>
              <div className="h-64">
                {salesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`} stroke="#9CA3AF" />
                      <Tooltip 
                        formatter={(value: number) => [formatPrice(value), 'Sales']}
                        {...getTooltipStyles()}
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
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    No sales data available
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Methods</h3>
              <div className="h-64">
                {paymentMethodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => {
                          const percentage = props.payload?.percentage || '0.0';
                          const paymentMethod = props.payload?.name || 'Unknown';
                          return [`${percentage}%`, paymentMethod];
                        }}
                        {...getTooltipStyles()}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    No payment method data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

        {/* Inventory Report */}
        {selectedReport === 'inventory' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inventory Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inventoryStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {inventoryStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => {
                          const status = props.payload?.name || 'Unknown';
                          return [`${value} products`, status];
                        }}
                        {...getTooltipStyles()}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stock Value by Category</h3>
                <div className="h-64">
                  {(() => {
                    // Calculate real category data from products
                    const categoryData = (products || []).reduce((acc: any, product) => {
                      const category = product.category || 'Other';
                      if (!acc[category]) {
                        acc[category] = { category, value: 0, count: 0 };
                      }
                      acc[category].value += product.price * product.stock_quantity;
                      acc[category].count += 1;
                      return acc;
                    }, {});
                    
                    const categoryArray = Object.values(categoryData);
                    
                    return categoryArray.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryArray}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="category" stroke="#9CA3AF" />
                          <YAxis tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`} stroke="#9CA3AF" />
                          <Tooltip 
                            formatter={(value: number) => [formatPrice(value), 'Value']}
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #4B5563', 
                              borderRadius: '8px',
                              color: '#FFFFFF',
                              fontSize: '14px',
                              fontWeight: '500',
                              padding: '8px 12px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                            labelStyle={{ 
                              color: '#FFFFFF',
                              fontSize: '14px',
                              fontWeight: '600',
                              marginBottom: '4px'
                            }}
                            itemStyle={{ color: '#FFFFFF' }}
                          />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        No category data available
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Product Performance Report */}
        {selectedReport === 'products' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing Products</h3>
              <div className="h-64">
                {topProductsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProductsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`} stroke="#9CA3AF" />
                      <Tooltip 
                        formatter={(value: number) => [formatPrice(value), 'Revenue']}
                        {...getTooltipStyles()}
                      />
                      <Bar dataKey="revenue" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    No product performance data available
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Categories</h3>
                <div className="space-y-3">
                  {(() => {
                    // Use API category breakdown data if available, otherwise fallback to local calculation
                    const categoryData = analyticsData?.productPerformance?.categoryBreakdown || 
                      (products || []).reduce((acc: any, product) => {
                        const category = product.category || 'Other';
                        if (!acc[category]) {
                          acc[category] = { category, count: 0, totalValue: 0 };
                        }
                        acc[category].count += 1;
                        acc[category].totalValue += product.price * product.stock_quantity;
                        return acc;
                      }, {});
                    
                    const categoryArray = Array.isArray(categoryData) ? categoryData : Object.values(categoryData);
                    
                    return categoryArray.length > 0 ? (
                      categoryArray.map((cat: any) => (
                        <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="font-medium text-gray-900 dark:text-white">{cat.category}</span>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {cat.count} products
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatPrice(cat.totalValue || cat.value)} value
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No category data available
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Low Stock Products</h3>
                <div className="space-y-3">
                  {(products || []).filter(p => p.stock_quantity <= p.min_stock_level).slice(0, 5).map(product => (
                    <div key={product._id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {formatStockQuantity(product.stock_quantity)} remaining (min: {product.min_stock_level})
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-medium rounded-full">
                        {product.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
