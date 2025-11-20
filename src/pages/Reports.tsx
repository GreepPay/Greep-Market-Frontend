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
  History,
  AlertTriangle,
  TrendingDown,
  Clock,
  RefreshCw,
  Box,
  Layers,
  Activity,
  Zap,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { formatStockQuantity } from '../utils/formatUtils';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PerformanceDashboard } from '../components/ui/PerformanceDashboard';
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
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');
  const [periodStartDate, setPeriodStartDate] = useState<Date | undefined>();
  const [periodEndDate, setPeriodEndDate] = useState<Date | undefined>();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<'sales' | 'inventory' | 'products' | 'performance'>('performance');
  const [isExporting, setIsExporting] = useState(false);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  // Standardized date range calculation
  const getDateRange = (period: string, startDate?: Date, endDate?: Date) => {
    const now = new Date();
    let calculatedStartDate: Date;
    let calculatedEndDate: Date;

    if (startDate && endDate) {
      // Custom date range
      calculatedStartDate = new Date(startDate);
      calculatedEndDate = new Date(endDate);
      calculatedEndDate.setHours(23, 59, 59, 999);
    } else {
      // Calculate based on period
      switch (period) {
        case '7d':
          calculatedStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          calculatedEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case '30d':
          calculatedStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          calculatedEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case '90d':
          calculatedStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          calculatedEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case '1y':
          calculatedStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          calculatedEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case 'this_month':
          calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          calculatedEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        default:
          // Handle month/year periods (YYYY-MM or year-YYYY format)
          if (/^\d{4}-\d{2}$/.test(period)) {
            const [year, month] = period.split('-');
            calculatedStartDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            calculatedEndDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
          } else if (/^year-\d{4}$/.test(period)) {
            const year = parseInt(period.split('-')[1]);
            calculatedStartDate = new Date(year, 0, 1);
            calculatedEndDate = new Date(year, 11, 31, 23, 59, 59, 999);
          } else {
            // Default to 30 days
            calculatedStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            calculatedEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          }
      }
    }

    return {
      startDate: calculatedStartDate.toISOString(),
      endDate: calculatedEndDate.toISOString(),
      startDateObj: calculatedStartDate,
      endDateObj: calculatedEndDate
    };
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user?.store_id) return;
      
      setIsLoading(true);
      try {
        // Get standardized date range
        const dateRange = getDateRange(selectedPeriod, periodStartDate, periodEndDate);
        
        // Create standardized payload with proper date format
        const analyticsParams = {
          store_id: user.store_id,
          startDate: dateRange.startDate.split('T')[0], // Convert ISO to date string
          endDate: dateRange.endDate.split('T')[0], // Convert ISO to date string
          period: selectedPeriod
        };

        // Load all analytics data with standardized parameters
        const [dashboardAnalytics, productPerformance, inventoryAnalytics, transactionsResponse] = await Promise.all([
          apiService.getDashboardAnalytics(analyticsParams).catch(err => {
            console.error('Failed to load dashboard analytics:', err);
            return null;
          }),
          apiService.getProductPerformance(user.store_id, selectedPeriod, dateRange.startDateObj, dateRange.endDateObj).catch(err => {
            console.error('Failed to load product performance:', err);
            return null;
          }),
          apiService.getInventoryAnalytics(user.store_id).catch(err => {
            console.error('Failed to load inventory analytics:', err);
            return null;
          }),
          apiService.getTransactions({
            store_id: user.store_id,
            start_date: dateRange.startDate.split('T')[0],
            end_date: dateRange.endDate.split('T')[0],
            limit: 10000, // Get all transactions for the period
            status: 'all'
          }).catch(err => {
            console.error('Failed to load transactions:', err);
            return { transactions: [] };
          })
        ]);

        console.log('Analytics Data Loaded:', {
          dashboardAnalytics: dashboardAnalytics ? '✓' : '✗',
          productPerformance: productPerformance ? '✓' : '✗',
          inventoryAnalytics: inventoryAnalytics ? '✓' : '✗',
          transactions: transactionsResponse?.transactions?.length || 0
        });

        setAllTransactions(transactionsResponse?.transactions || []);
        setAnalyticsData({ 
          dashboardAnalytics, 
          productPerformance, 
          inventoryAnalytics 
        });

        // Debug logging for order source data
      } catch (error) {
        console.error('❌ Failed to load analytics:', error);
        toast.error('Failed to load report data. Please try again.');
      } finally {
        setIsLoading(false);
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
            // Better category handling
            const category = product.category || product.categoryName || 'No Category';
            
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
        transactions: item.transactions || 0,
        onlineSales: item.onlineSales || 0,
        inStoreSales: item.inStoreSales || 0
      }));
    }

    if (!sales || sales.length === 0) {
      // Return empty data when no real data exists
      return [];
    }
    
    const now = new Date();
    const data = [];
    
    // Limit to 20 data points for better chart visibility
    const daysToShow = 20;
    const step = Math.ceil(30 / daysToShow); // Sample every Nth day from last 30 days
    const includedDays = new Set<string>(); // Track which days we've included
    
    // Always include today (day 0)
    const todayDate = new Date(now);
    const todayStr = todayDate.toISOString().split('T')[0];
    includedDays.add(todayStr);
    
    // Sample days going back, ensuring we include today
    for (let i = 29; i >= 0; i -= step) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!includedDays.has(dateStr)) {
        includedDays.add(dateStr);
      }
    }
    
    // Process all included days
    const sortedDays = Array.from(includedDays).sort();
    for (const dateStr of sortedDays) {
      const date = new Date(dateStr + 'T00:00:00');
      
      const daySales = sales.filter(sale => {
        const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
        return saleDate === dateStr;
      });
      
      const totalSales = daySales.reduce((sum, sale) => sum + sale.total_amount, 0);
      const transactionCount = daySales.length;
      
      // Calculate online vs in-store sales for this day
      const onlineSales = daySales
        .filter(sale => sale.order_source === 'online')
        .reduce((sum, sale) => sum + sale.total_amount, 0);
      
      const inStoreSales = daySales
        .filter(sale => (sale.order_source as any) === 'in_store' || (sale.order_source as any) === 'in-store' || !sale.order_source)
        .reduce((sum, sale) => sum + sale.total_amount, 0);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: totalSales,
        transactions: transactionCount,
        onlineSales: onlineSales,
        inStoreSales: inStoreSales
      });
    }
    
    return data;
  };

  const salesData = generateSalesData() || [];
  
  // Debug: Log sales data for Order Source Trends

  // Generate payment method data from actual analytics data (filtered by selected period)
  const generatePaymentMethodData = () => {
    // Use analytics data first (filtered by period), then fallback to sales data
    if (analyticsData?.dashboardAnalytics?.paymentMethods) {
      const paymentMethods = analyticsData.dashboardAnalytics.paymentMethods;
      const totalAmount = Object.values(paymentMethods).reduce((sum: number, amount: any) => sum + (amount || 0), 0);
      
      return Object.entries(paymentMethods).map(([method, amount]: [string, any]) => ({
        name: method.charAt(0).toUpperCase() + method.slice(1),
        value: amount || 0,
        percentage: totalAmount > 0 ? ((amount || 0) / totalAmount * 100).toFixed(1) : '0.0',
        color: getPaymentMethodColor(method)
      }));
    }
    
    if (!sales || sales.length === 0) {
      // Return empty data instead of mock data
      return [];
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
    
    const result = Object.entries(paymentMethods).map(([method, amount]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: amount,
      percentage: totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : '0.0',
      color: getPaymentMethodColor(method)
    }));

    return result;
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

  const paymentMethodData = generatePaymentMethodData() || [];

  // Generate order source data (online vs in-store)
  const generateOrderSourceData = () => {
    // First try to get order source data from analytics API
    if (analyticsData?.dashboardAnalytics?.orderSources) {
      const orderSources = analyticsData.dashboardAnalytics.orderSources;
      const totalAmount = Object.values(orderSources).reduce((sum: number, amount: any) => sum + (amount || 0), 0);
      
      return Object.entries(orderSources).map(([source, amount]: [string, any]) => ({
        name: source === 'online' ? 'Online' : 'In-Store',
        value: amount || 0,
        percentage: totalAmount > 0 ? (((amount || 0) / totalAmount) * 100).toFixed(1) : '0.0',
        color: source === 'online' ? '#3b82f6' : '#22c55e' // Blue for online, Green for in-store
      }));
    }
    
    // Fallback to processing sales data if analytics data is not available
    if (!sales || sales.length === 0) {
      return [];
    }
    
    const orderSources: { [key: string]: number } = {
      'online': 0,
      'in_store': 0
    };
    let totalAmount = 0;

    sales.forEach(sale => {
      const src = sale.order_source as any;
      const normalized = src === 'in-store' ? 'in_store' : (src || 'in_store');
      orderSources[normalized] = (orderSources[normalized] || 0) + sale.total_amount;
      totalAmount += sale.total_amount;
    });
    
    const result = Object.entries(orderSources).map(([source, amount]) => ({
      name: source === 'online' ? 'Online' : 'In-Store',
      value: amount,
      percentage: totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : '0.0',
      color: source === 'online' ? '#3b82f6' : '#22c55e' // Blue for online, Green for in-store
    }));

    return result;
  };

  const orderSourceData = generateOrderSourceData() || [];

  const topProductsData = (analyticsData?.productPerformance?.topSellingProducts || []).map((product: any) => ({
    name: (product.productName || '').length > 15 
      ? (product.productName || '').substring(0, 15) + '...' 
      : (product.productName || ''),
    revenue: product.revenue || 0,
    quantity: product.quantitySold || 0,
  }));

  const inventoryStatusData = [
    { name: 'In Stock', value: (products || []).filter(p => (p?.stock_quantity || 0) > (p?.min_stock_level || 0)).length, color: '#22c55e' },
    { name: 'Low Stock', value: (products || []).filter(p => (p?.stock_quantity || 0) <= (p?.min_stock_level || 0) && (p?.stock_quantity || 0) > 0).length, color: '#f59e0b' },
    { name: 'Out of Stock', value: (products || []).filter(p => (p?.stock_quantity || 0) === 0).length, color: '#ef4444' },
  ];

  // Comprehensive Inventory Calculations
  const calculateInventoryMetrics = () => {
    const allProducts = products || [];
    
    // Total inventory value
    const totalInventoryValue = allProducts.reduce((sum, p) => {
      return sum + ((p.price || 0) * (p.stock_quantity || 0));
    }, 0);

    // Average stock quantity
    const avgStockQuantity = allProducts.length > 0
      ? allProducts.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) / allProducts.length
      : 0;

    // Total products count
    const totalProducts = allProducts.length;

    // Stock status breakdown
    const inStockCount = allProducts.filter(p => (p.stock_quantity || 0) > (p.min_stock_level || 0)).length;
    const lowStockCount = allProducts.filter(p => (p.stock_quantity || 0) <= (p.min_stock_level || 0) && (p.stock_quantity || 0) > 0).length;
    const outOfStockCount = allProducts.filter(p => (p.stock_quantity || 0) === 0).length;

    // Low stock products with urgency
    const lowStockProducts = allProducts
      .filter(p => {
        const stock = p.stock_quantity || 0;
        const min = p.min_stock_level || 0;
        return stock <= min && stock > 0;
      })
      .map(p => {
        const stock = p.stock_quantity || 0;
        const min = p.min_stock_level || 0;
        const percentage = min > 0 ? (stock / min) * 100 : 0;
        const urgency = stock === 0 ? 'critical' : percentage < 25 ? 'high' : percentage < 50 ? 'medium' : 'low';
        const reorderQty = Math.max(min * 2 - stock, min);
        return {
          ...p,
          urgency,
          percentage,
          reorderQty,
          stockValue: (p.price || 0) * stock,
          reorderValue: (p.price || 0) * reorderQty
        };
      })
      .sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 99) - (urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 99);
      });

    // Out of stock products
    const outOfStockProducts = allProducts
      .filter(p => (p.stock_quantity || 0) === 0)
      .map(p => ({
        ...p,
        reorderQty: p.min_stock_level || 10,
        reorderValue: (p.price || 0) * (p.min_stock_level || 10)
      }))
      .sort((a, b) => (b.price || 0) - (a.price || 0)); // Sort by price (most valuable first)

    // Category breakdown with detailed metrics
    const categoryBreakdown = allProducts.reduce((acc: any, product) => {
      const category = product.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = {
          category,
          productCount: 0,
          totalValue: 0,
          totalQuantity: 0,
          avgPrice: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          inStockCount: 0
        };
      }
      acc[category].productCount += 1;
      const stockValue = (product.price || 0) * (product.stock_quantity || 0);
      acc[category].totalValue += stockValue;
      acc[category].totalQuantity += (product.stock_quantity || 0);
      
      const stock = product.stock_quantity || 0;
      const min = product.min_stock_level || 0;
      if (stock === 0) {
        acc[category].outOfStockCount += 1;
      } else if (stock <= min) {
        acc[category].lowStockCount += 1;
      } else {
        acc[category].inStockCount += 1;
      }
      return acc;
    }, {});

    Object.keys(categoryBreakdown).forEach(category => {
      const cat = categoryBreakdown[category];
      cat.avgPrice = cat.productCount > 0 ? cat.totalValue / cat.totalQuantity : 0;
    });

    // Calculate fast-moving vs slow-moving (based on recent sales if available)
    const productSales = analyticsData?.dashboardAnalytics?.topProducts || [];
    const productSalesMap = new Map<string | number, number>(productSales.map((p: any) => [
      p.productId || p.product_name || '', 
      Number(p.quantitySold) || 0
    ]));
    
    const fastMovingProducts = allProducts
      .filter(p => {
        const sales = Number(productSalesMap.get(p._id as string)) || Number(productSalesMap.get(p.name as string)) || 0;
        return sales > 0;
      })
      .map(p => {
        const salesCount = Number(productSalesMap.get(p._id as string)) || Number(productSalesMap.get(p.name as string)) || 0;
        const stockQty = Number(p.stock_quantity) || 0;
        return {
          ...p,
          salesCount: salesCount,
          stockValue: (Number(p.price) || 0) * stockQty,
          turnoverRate: stockQty > 0 
            ? (salesCount / stockQty) * 100
            : 0
        };
      })
      .sort((a, b) => Number(b.salesCount) - Number(a.salesCount))
      .slice(0, 10);

    const slowMovingProducts = allProducts
      .filter(p => {
        const sales = Number(productSalesMap.get(p._id as string)) || Number(productSalesMap.get(p.name as string)) || 0;
        return sales === 0 && (p.stock_quantity || 0) > 0;
      })
      .map(p => ({
        ...p,
        stockValue: (p.price || 0) * (p.stock_quantity || 0),
        daysSinceUpdate: p.updated_at 
          ? Math.floor((new Date().getTime() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24))
          : 0
      }))
      .sort((a, b) => b.stockValue - a.stockValue)
      .slice(0, 10);

    // Reorder recommendations
    const reorderRecommendations = [
      ...lowStockProducts.map(p => ({
        product: p,
        type: 'low_stock' as const,
        priority: p.urgency === 'critical' ? 1 : p.urgency === 'high' ? 2 : 3,
        quantity: p.reorderQty,
        estimatedValue: p.reorderValue
      })),
      ...outOfStockProducts.map(p => ({
        product: p,
        type: 'out_of_stock' as const,
        priority: 0,
        quantity: p.reorderQty,
        estimatedValue: p.reorderValue
      }))
    ].sort((a, b) => a.priority - b.priority);

    const totalReorderValue = reorderRecommendations.reduce((sum, r) => sum + r.estimatedValue, 0);

    // Inventory aging (oldest stock first)
    const agingInventory = allProducts
      .filter(p => (p.stock_quantity || 0) > 0)
      .map(p => {
        const lastUpdate = p.updated_at ? new Date(p.updated_at) : new Date(p.created_at || Date.now());
        const daysSinceUpdate = Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...p,
          daysSinceUpdate,
          stockValue: (p.price || 0) * (p.stock_quantity || 0),
          ageCategory: daysSinceUpdate > 90 ? 'old' : daysSinceUpdate > 30 ? 'medium' : 'new'
        };
      })
      .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate)
      .slice(0, 20);

    // Stock value distribution
    const valueDistribution = allProducts.reduce((acc: any, p) => {
      const value = (p.price || 0) * (p.stock_quantity || 0);
      if (value === 0) acc.zero++;
      else if (value < 100) acc.low++;
      else if (value < 1000) acc.medium++;
      else if (value < 5000) acc.high++;
      else acc.veryHigh++;
      return acc;
    }, { zero: 0, low: 0, medium: 0, high: 0, veryHigh: 0 });

    return {
      totalInventoryValue,
      avgStockQuantity,
      totalProducts,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      lowStockProducts,
      outOfStockProducts,
      categoryBreakdown: Object.values(categoryBreakdown),
      fastMovingProducts,
      slowMovingProducts,
      reorderRecommendations,
      totalReorderValue,
      agingInventory,
      valueDistribution
    };
  };

  const inventoryMetrics = calculateInventoryMetrics();

  // Comprehensive Sales Analytics Calculations
  const calculateSalesMetrics = () => {
    // Use transactions from API first, then fallback to context sales
    const allSales = allTransactions.length > 0 ? allTransactions : (sales || []);
    const dashboardData = analyticsData?.dashboardAnalytics;
    const now = new Date();
    
    // Filter sales by selected period
    const dateRange = getDateRange(selectedPeriod, periodStartDate, periodEndDate);
    const filteredSales = allSales.filter(sale => {
      const saleDate = new Date(sale.created_at || sale.createdAt || sale.date);
      return saleDate >= dateRange.startDateObj && saleDate <= dateRange.endDateObj;
    });
    
    console.log('Calculating Sales Metrics:', {
      transactionsFromAPI: allTransactions.length,
      transactionsFromContext: sales?.length || 0,
      totalUsed: allSales.length,
      filteredByPeriod: filteredSales.length,
      period: selectedPeriod,
      dashboardDataAvailable: !!dashboardData
    });

    // Use filtered sales for all calculations
    const salesToUse = filteredSales.length > 0 ? filteredSales : allSales;
    
    // Time-based breakdowns
    const today = salesToUse.filter(sale => {
      const saleDate = new Date(sale.created_at || sale.createdAt || sale.date);
      return saleDate.toDateString() === now.toDateString();
    });

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySales = salesToUse.filter(sale => {
      const saleDate = new Date(sale.created_at || sale.createdAt || sale.date);
      return saleDate.toDateString() === yesterday.toDateString();
    });

    const thisWeek = salesToUse.filter(sale => {
      const saleDate = new Date(sale.created_at || sale.createdAt || sale.date);
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return saleDate >= weekStart;
    });

    const lastWeek = salesToUse.filter(sale => {
      const saleDate = new Date(sale.created_at || sale.createdAt || sale.date);
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
      lastWeekStart.setHours(0, 0, 0, 0);
      const lastWeekEnd = new Date(now);
      lastWeekEnd.setDate(now.getDate() - now.getDay());
      lastWeekEnd.setHours(0, 0, 0, 0);
      return saleDate >= lastWeekStart && saleDate < lastWeekEnd;
    });

    const thisMonth = salesToUse.filter(sale => {
      const saleDate = new Date(sale.created_at || sale.createdAt || sale.date);
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    });

    const lastMonth = salesToUse.filter(sale => {
      const saleDate = new Date(sale.created_at || sale.createdAt || sale.date);
      const lastMonthDate = new Date(now);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      return saleDate.getMonth() === lastMonthDate.getMonth() && saleDate.getFullYear() === lastMonthDate.getFullYear();
    });

    // Sales amounts
    const todayAmount = today.reduce((sum, sale) => sum + (sale.total_amount || sale.totalAmount || sale.amount || 0), 0);
    const yesterdayAmount = yesterdaySales.reduce((sum, sale) => sum + (sale.total_amount || sale.totalAmount || sale.amount || 0), 0);
    const thisWeekAmount = thisWeek.reduce((sum, sale) => sum + (sale.total_amount || sale.totalAmount || sale.amount || 0), 0);
    const lastWeekAmount = lastWeek.reduce((sum, sale) => sum + (sale.total_amount || sale.totalAmount || sale.amount || 0), 0);
    const thisMonthAmount = thisMonth.reduce((sum, sale) => sum + (sale.total_amount || sale.totalAmount || sale.amount || 0), 0);
    const lastMonthAmount = lastMonth.reduce((sum, sale) => sum + (sale.total_amount || sale.totalAmount || sale.amount || 0), 0);

    // Growth rates
    const todayGrowth = yesterdayAmount > 0 ? ((todayAmount - yesterdayAmount) / yesterdayAmount) * 100 : (todayAmount > 0 ? 100 : 0);
    const weekGrowth = lastWeekAmount > 0 ? ((thisWeekAmount - lastWeekAmount) / lastWeekAmount) * 100 : (thisWeekAmount > 0 ? 100 : 0);
    const monthGrowth = lastMonthAmount > 0 ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100 : (thisMonthAmount > 0 ? 100 : 0);

    // Sales by day of week (using filtered sales)
    const salesByDayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => {
      const daySales = salesToUse.filter(sale => {
        const saleDate = new Date(sale.created_at || sale.createdAt || sale.date);
        return saleDate.getDay() === index;
      });
      return {
        day,
        sales: daySales.reduce((sum, sale) => sum + (sale.total_amount || sale.totalAmount || sale.amount || 0), 0),
        transactions: daySales.length
      };
    });

    // Sales by hour (using filtered sales)
    const salesByHour = Array.from({ length: 24 }, (_, hour) => {
      const hourSales = salesToUse.filter(sale => {
        const saleDate = new Date(sale.created_at || sale.createdAt || sale.date);
        return saleDate.getHours() === hour;
      });
      return {
        hour,
        sales: hourSales.reduce((sum, sale) => sum + (sale.total_amount || sale.totalAmount || sale.amount || 0), 0),
        transactions: hourSales.length
      };
    });

    // Top selling products from sales (using filtered sales)
    const productSalesMap = new Map<string, { revenue: number; quantity: number; transactions: number }>();
    salesToUse.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const productId = item.product_id || item.product_name || 'Unknown';
          const existing = productSalesMap.get(productId) || { revenue: 0, quantity: 0, transactions: 0 };
          productSalesMap.set(productId, {
            revenue: existing.revenue + (item.price || 0) * (item.quantity || 0),
            quantity: existing.quantity + (item.quantity || 0),
            transactions: existing.transactions + 1
          });
        });
      }
    });

    const topSellingProducts = Array.from(productSalesMap.entries())
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        quantity: data.quantity,
        transactions: data.transactions,
        avgPrice: data.quantity > 0 ? data.revenue / data.quantity : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    // Sales by category (using filtered sales)
    const categorySalesMap = new Map<string, { revenue: number; quantity: number; transactions: number }>();
    salesToUse.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const category = item.category || item.product_category || 'Uncategorized';
          const existing = categorySalesMap.get(category) || { revenue: 0, quantity: 0, transactions: 0 };
          categorySalesMap.set(category, {
            revenue: existing.revenue + (item.price || 0) * (item.quantity || 0),
            quantity: existing.quantity + (item.quantity || 0),
            transactions: existing.transactions + 1
          });
        });
      }
    });

    const salesByCategory = Array.from(categorySalesMap.entries())
      .map(([category, data]) => ({
        category,
        revenue: data.revenue,
        quantity: data.quantity,
        transactions: data.transactions
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Average transaction value over time
    const avgTransactionToday = today.length > 0 ? todayAmount / today.length : 0;
    const avgTransactionThisWeek = thisWeek.length > 0 ? thisWeekAmount / thisWeek.length : 0;
    const avgTransactionThisMonth = thisMonth.length > 0 ? thisMonthAmount / thisMonth.length : 0;

    // Peak sales time
    const peakHour = salesByHour.reduce((max, hour) => hour.sales > max.sales ? hour : max, salesByHour[0]);
    const peakDay = salesByDayOfWeek.reduce((max, day) => day.sales > max.sales ? day : max, salesByDayOfWeek[0]);

    // Use API data if available, otherwise use calculated values
    const finalMetrics = {
      today: {
        amount: dashboardData?.todaySales || todayAmount,
        transactions: dashboardData?.todayTransactions || today.length,
        growth: todayGrowth,
        avgTransaction: dashboardData?.todayAvgTransaction || avgTransactionToday
      },
      yesterday: {
        amount: yesterdayAmount,
        transactions: yesterdaySales.length
      },
      thisWeek: {
        amount: thisWeekAmount,
        transactions: thisWeek.length,
        growth: weekGrowth,
        avgTransaction: avgTransactionThisWeek
      },
      lastWeek: {
        amount: lastWeekAmount,
        transactions: lastWeek.length
      },
      thisMonth: {
        amount: dashboardData?.monthlySales || thisMonthAmount,
        transactions: dashboardData?.monthlyTransactions || thisMonth.length,
        growth: monthGrowth,
        avgTransaction: dashboardData?.monthlyAvgTransaction || avgTransactionThisMonth
      },
      lastMonth: {
        amount: lastMonthAmount,
        transactions: lastMonth.length
      },
      salesByDayOfWeek,
      salesByHour,
      topSellingProducts: dashboardData?.topProducts?.map((p: any) => ({
        name: p.productName || p.product_name || 'Unknown',
        revenue: p.revenue || 0,
        quantity: p.quantitySold || p.quantity || 0,
        transactions: p.transactions || 1,
        avgPrice: p.avgPrice || (p.revenue && p.quantitySold ? p.revenue / p.quantitySold : 0)
      })) || topSellingProducts,
      salesByCategory: salesByCategory.length > 0 ? salesByCategory : (dashboardData?.salesByCategory || []),
      peakHour,
      peakDay
    };

    return finalMetrics;
  };

  const salesMetrics = calculateSalesMetrics();

  // Comprehensive Product Performance Calculations
  const calculateProductPerformanceMetrics = () => {
    const allProducts = products || [];
    // Use transactions from API first, then fallback to context sales
    const allSales = allTransactions.length > 0 ? allTransactions : (sales || []);
    const productPerfData = analyticsData?.productPerformance;
    
    console.log('Calculating Product Performance:', {
      products: allProducts.length,
      transactionsFromAPI: allTransactions.length,
      transactionsFromContext: sales?.length || 0,
      apiDataAvailable: !!productPerfData
    });

    // Product sales mapping
    const productSalesMap = new Map<string, { 
      revenue: number; 
      quantity: number; 
      transactions: number;
      lastSaleDate?: Date;
      firstSaleDate?: Date;
    }>();

    allSales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        const saleDate = new Date(sale.created_at || sale.createdAt || sale.date);
        sale.items.forEach((item: any) => {
          const productId = item.product_id || item.product_name || 'Unknown';
          const existing = productSalesMap.get(productId) || { 
            revenue: 0, 
            quantity: 0, 
            transactions: 0 
          };
          
          productSalesMap.set(productId, {
            revenue: existing.revenue + (item.price || 0) * (item.quantity || 0),
            quantity: existing.quantity + (item.quantity || 0),
            transactions: existing.transactions + 1,
            lastSaleDate: existing.lastSaleDate && existing.lastSaleDate > saleDate 
              ? existing.lastSaleDate 
              : saleDate,
            firstSaleDate: !existing.firstSaleDate || existing.firstSaleDate > saleDate 
              ? saleDate 
              : existing.firstSaleDate
          });
        });
      }
    });

    // Combine product data with sales data
    const productPerformance = allProducts.map(product => {
      const salesData = productSalesMap.get(product._id) || productSalesMap.get(product.name) || {
        revenue: 0,
        quantity: 0,
        transactions: 0
      };

      const stockValue = (product.price || 0) * (product.stock_quantity || 0);
      const costValue = (product.cost_price || product.price || 0) * (product.stock_quantity || 0);
      const profitMargin = salesData.revenue > 0 
        ? ((salesData.revenue - (salesData.quantity * (product.cost_price || product.price || 0))) / salesData.revenue) * 100
        : 0;

      const daysSinceLastSale = salesData.lastSaleDate 
        ? Math.floor((new Date().getTime() - salesData.lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const turnoverRate = (product.stock_quantity || 0) > 0 
        ? (salesData.quantity / (product.stock_quantity || 0)) * 100
        : 0;

      return {
        ...product,
        salesData,
        stockValue,
        costValue,
        profitMargin,
        daysSinceLastSale,
        turnoverRate,
        avgPricePerSale: salesData.quantity > 0 ? salesData.revenue / salesData.quantity : (product.price || 0),
        revenuePerUnitStock: (product.stock_quantity || 0) > 0 ? salesData.revenue / (product.stock_quantity || 0) : 0
      };
    });

    // Best performers
    const bestPerformers = [...productPerformance]
      .filter(p => p.salesData.revenue > 0)
      .sort((a, b) => b.salesData.revenue - a.salesData.revenue)
      .slice(0, 20);

    // Worst performers (have stock but no sales)
    const worstPerformers = [...productPerformance]
      .filter(p => p.salesData.revenue === 0 && (p.stock_quantity || 0) > 0)
      .sort((a, b) => b.stockValue - a.stockValue)
      .slice(0, 20);

    // Most profitable (by margin)
    const mostProfitable = [...productPerformance]
      .filter(p => p.salesData.revenue > 0 && p.profitMargin > 0)
      .sort((a, b) => b.profitMargin - a.profitMargin)
      .slice(0, 20);

    // Fastest moving (by turnover rate)
    const fastestMoving = [...productPerformance]
      .filter(p => p.turnoverRate > 0)
      .sort((a, b) => b.turnoverRate - a.turnoverRate)
      .slice(0, 20);

    // Category performance
    const categoryPerformance = allProducts.reduce((acc: any, product) => {
      const category = product.category || 'Uncategorized';
      const salesData = productSalesMap.get(product._id) || productSalesMap.get(product.name) || {
        revenue: 0,
        quantity: 0,
        transactions: 0
      };

      if (!acc[category]) {
        acc[category] = {
          category,
          productCount: 0,
          totalRevenue: 0,
          totalQuantity: 0,
          totalTransactions: 0,
          totalStockValue: 0,
          products: []
        };
      }

      acc[category].productCount += 1;
      acc[category].totalRevenue += salesData.revenue;
      acc[category].totalQuantity += salesData.quantity;
      acc[category].totalTransactions += salesData.transactions;
      acc[category].totalStockValue += (product.price || 0) * (product.stock_quantity || 0);
      acc[category].products.push(product);

      return acc;
    }, {});

    const categoryPerformanceArray = Object.values(categoryPerformance).map((cat: any) => ({
      ...cat,
      avgRevenuePerProduct: cat.productCount > 0 ? cat.totalRevenue / cat.productCount : 0,
      avgQuantityPerProduct: cat.productCount > 0 ? cat.totalQuantity / cat.productCount : 0
    })).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    // Merge with API data if available
    const apiBestPerformers = productPerfData?.topSellingProducts || productPerfData?.products || [];
    const finalBestPerformers = apiBestPerformers.length > 0 
      ? apiBestPerformers.map((p: any) => {
          const product = allProducts.find((prod: any) => 
            prod._id === p.productId || 
            prod.name === p.productName || 
            prod.name === p.product_name ||
            prod._id === p._id
          ) || { name: p.productName || p.product_name || p.name || 'Unknown', category: p.category || 'Uncategorized' };
          
          const revenue = p.revenue || 0;
          const quantitySold = p.quantitySold || p.quantity || 0;
          const stockQty = (product as any).stock_quantity || 0;
          
          return {
            ...product,
            salesData: {
              revenue: revenue,
              quantity: quantitySold,
              transactions: p.transactions || 1,
              lastSaleDate: p.lastSaleDate ? new Date(p.lastSaleDate) : undefined,
              firstSaleDate: p.firstSaleDate ? new Date(p.firstSaleDate) : undefined
            },
            stockValue: ((product as any).price || 0) * stockQty,
            turnoverRate: stockQty > 0 
              ? (quantitySold / stockQty) * 100
              : 0,
            profitMargin: revenue > 0 && (product as any).cost_price
              ? ((revenue - (quantitySold * ((product as any).cost_price || (product as any).price || 0))) / revenue) * 100
              : 0,
            avgPricePerSale: quantitySold > 0 ? revenue / quantitySold : ((product as any).price || 0),
            revenuePerUnitStock: stockQty > 0 ? revenue / stockQty : 0
          };
        }).slice(0, 20)
      : bestPerformers;

    return {
      productPerformance,
      bestPerformers: finalBestPerformers,
      worstPerformers,
      mostProfitable,
      fastestMoving,
      categoryPerformance: productPerfData?.categoryBreakdown || categoryPerformanceArray
    };
  };

  const productPerformanceMetrics = calculateProductPerformanceMetrics();

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

  // KPIs should be driven by the active filter on this page.
  // Prefer filtered analytics returned by this page's API call; only if absent, fall back to local calculation.
  // Use salesMetrics first (which uses API transactions), then dashboard analytics, then calculated
  const totalSales = salesMetrics?.thisMonth?.amount || dashboardData?.totalSales || dashboardData?.monthlySales || calculatedMetrics.totalSales || 0;
  const totalTransactions = salesMetrics?.thisMonth?.transactions || dashboardData?.totalTransactions || dashboardData?.monthlyTransactions || calculatedMetrics.totalTransactions || 0;
  const averageTransactionValue = dashboardData?.averageTransactionValue || salesMetrics?.thisMonth?.avgTransaction || (
    totalTransactions > 0 ? totalSales / totalTransactions : calculatedMetrics.averageTransactionValue || 0
  );
  const growthRate = salesMetrics?.thisMonth?.growth || dashboardData?.growthRate || calculatedMetrics.growthRate || 0;

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
          {/* Key Metrics - Today, Week, Month */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Today Sales</h3>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatPrice(salesMetrics.today.amount)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {salesMetrics.today.growth > 0 ? '+' : ''}{salesMetrics.today.growth.toFixed(1)}% vs yesterday
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{salesMetrics.today.transactions} transactions</p>
            </Card>

            <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">This Week</h3>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatPrice(salesMetrics.thisWeek.amount)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {salesMetrics.thisWeek.growth > 0 ? '+' : ''}{salesMetrics.thisWeek.growth.toFixed(1)}% vs last week
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{salesMetrics.thisWeek.transactions} transactions</p>
            </Card>

            <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">This Month</h3>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatPrice(salesMetrics.thisMonth.amount)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {salesMetrics.thisMonth.growth > 0 ? '+' : ''}{salesMetrics.thisMonth.growth.toFixed(1)}% vs last month
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{salesMetrics.thisMonth.transactions} transactions</p>
            </Card>

            <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Avg Transaction</h3>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatPrice(averageTransactionValue)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Today: {formatPrice(salesMetrics.today.avgTransaction)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total: {totalTransactions} transactions</p>
            </Card>
          </div>

          {/* Additional Sales Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Card className="text-center p-3 hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Yesterday</h3>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatPrice(salesMetrics.yesterday.amount)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{salesMetrics.yesterday.transactions} txns</p>
            </Card>
            <Card className="text-center p-3 hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Last Week</h3>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatPrice(salesMetrics.lastWeek.amount)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{salesMetrics.lastWeek.transactions} txns</p>
            </Card>
            <Card className="text-center p-3 hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Last Month</h3>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatPrice(salesMetrics.lastMonth.amount)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{salesMetrics.lastMonth.transactions} txns</p>
            </Card>
            <Card className="text-center p-3 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-1" />
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Peak Hour</h3>
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{salesMetrics.peakHour?.hour || 0}:00</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatPrice(salesMetrics.peakHour?.sales || 0)}</p>
            </Card>
            <Card className="text-center p-3 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-center mb-1">
                <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-1" />
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Peak Day</h3>
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{salesMetrics.peakDay?.day || 'N/A'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatPrice(salesMetrics.peakDay?.sales || 0)}</p>
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

            {/* Order Source Analytics */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Source Breakdown</h3>
              <div className="h-64">
                {orderSourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderSourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {orderSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          formatPrice(value), 
                          `${props.payload.name} (${props.payload.percentage}%)`
                        ]}
                        {...getTooltipStyles()}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm font-medium mb-2">No Order Source Data</p>
                    <p className="text-xs text-center max-w-xs">
                      Start making sales with order source tracking to see online vs in-store breakdown
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Source Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card className="p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Online Sales</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatPrice(orderSourceData.find(item => item.name === 'Online')?.value || 0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {orderSourceData.find(item => item.name === 'Online')?.percentage || '0.0'}% of total
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">In-Store Sales</h3>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatPrice(orderSourceData.find(item => item.name === 'In-Store')?.value || 0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {orderSourceData.find(item => item.name === 'In-Store')?.percentage || '0.0'}% of total
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>
          </div>

          {/* Sales by Day of Week */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales by Day of Week</h3>
            <div className="h-64">
              {salesMetrics.salesByDayOfWeek && salesMetrics.salesByDayOfWeek.some((day: any) => day.sales > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesMetrics.salesByDayOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                    <XAxis 
                      dataKey="day" 
                      stroke={isDark ? "#9CA3AF" : "#6b7280"}
                      tick={{ fill: isDark ? "#9CA3AF" : "#6b7280", fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`} 
                      stroke={isDark ? "#9CA3AF" : "#6b7280"}
                      tick={{ fill: isDark ? "#9CA3AF" : "#6b7280", fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        formatPrice(value), 
                        `${props.payload.day}: ${props.payload.transactions} transactions`
                      ]}
                      {...getTooltipStyles()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <BarChart3 className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">No sales data available for this period</p>
                  <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Try selecting a different time period</p>
                </div>
              )}
            </div>
          </div> */}

          {/* Sales by Hour */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales by Hour of Day</h3>
            <div className="h-64">
              {salesMetrics.salesByHour && salesMetrics.salesByHour.some((hour: any) => hour.sales > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesMetrics.salesByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                    <XAxis 
                      dataKey="hour" 
                      stroke={isDark ? "#9CA3AF" : "#6b7280"}
                      tick={{ fill: isDark ? "#9CA3AF" : "#6b7280", fontSize: 12 }}
                      label={{ value: 'Hour', position: 'insideBottom', offset: -5, fill: isDark ? "#9CA3AF" : "#6b7280" }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`} 
                      stroke={isDark ? "#9CA3AF" : "#6b7280"}
                      tick={{ fill: isDark ? "#9CA3AF" : "#6b7280", fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        formatPrice(value), 
                        `${props.payload.hour}:00 - ${props.payload.transactions} transactions`
                      ]}
                      {...getTooltipStyles()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ fill: "#22c55e", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <Clock className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">No sales data available for this period</p>
                  <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Try selecting a different time period</p>
                </div>
              )}
            </div>
          </div> */}

          {/* Top Selling Products */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Selling Products</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Product</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Revenue</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity Sold</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Transactions</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {salesMetrics.topSellingProducts.slice(0, 20).map((product: any, index: number) => (
                    <tr
                      key={product.name || index}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{product.name}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                        {formatPrice(product.revenue)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                        {product.quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                        {product.transactions}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                        {formatPrice(product.avgPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sales by Category */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales by Category</h3>
            {salesMetrics.salesByCategory && salesMetrics.salesByCategory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Transactions</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesMetrics.salesByCategory.map((cat: any, index: number) => {
                      const percentage = totalSales > 0 ? (cat.revenue / totalSales) * 100 : 0;
                      return (
                        <tr
                          key={cat.category || index}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{cat.category}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                            {formatPrice(cat.revenue)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                            {cat.quantity.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                            {cat.transactions}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                            {percentage.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <Package className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">No category data available for this period</p>
                <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Try selecting a different time period</p>
              </div>
            )}
          </div> */}
        </>
      )}

        {/* Inventory Report */}
        {selectedReport === 'inventory' && (
          <>
            {/* Key Inventory Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Inventory Value</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {formatPrice(inventoryMetrics.totalInventoryValue)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {inventoryMetrics.totalProducts} products
                </p>
              </Card>

              <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">In Stock</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {inventoryMetrics.inStockCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {inventoryMetrics.totalProducts > 0 
                    ? ((inventoryMetrics.inStockCount / inventoryMetrics.totalProducts) * 100).toFixed(1)
                    : 0}% of total
                </p>
              </Card>

              <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Low Stock</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {inventoryMetrics.lowStockCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Needs attention
                </p>
              </Card>

              <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Out of Stock</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {inventoryMetrics.outOfStockCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Urgent restocking needed
                </p>
              </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Box className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Avg Stock Qty</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {inventoryMetrics.avgStockQuantity.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Per product
                </p>
              </Card>

              <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reorder Value</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {formatPrice(inventoryMetrics.totalReorderValue)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {inventoryMetrics.reorderRecommendations.length} items
                </p>
              </Card>

              <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fast Moving</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {inventoryMetrics.fastMovingProducts.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  High turnover items
                </p>
              </Card>

              <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Slow Moving</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {inventoryMetrics.slowMovingProducts.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Low/no sales
                </p>
              </Card>
            </div>

            {/* Charts Row */}
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
                          const percentage = inventoryMetrics.totalProducts > 0
                            ? ((value / inventoryMetrics.totalProducts) * 100).toFixed(1)
                            : '0';
                          return [`${value} products (${percentage}%)`, status];
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
                  {inventoryMetrics.categoryBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inventoryMetrics.categoryBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="category" 
                          stroke="#9CA3AF"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`} stroke="#9CA3AF" />
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => {
                            const cat = props.payload;
                            return [
                              `${formatPrice(value)} (${cat.productCount} products)`,
                              'Total Value'
                            ];
                          }}
                          {...getTooltipStyles()}
                        />
                        <Bar dataKey="totalValue" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      No category data available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Category Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Products</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Total Qty</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Stock Value</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">In Stock</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Low Stock</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Out of Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryMetrics.categoryBreakdown
                      .sort((a: any, b: any) => b.totalValue - a.totalValue)
                      .map((cat: any, index: number) => (
                        <tr 
                          key={cat.category || index}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{cat.category}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">{cat.productCount}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                            {cat.totalQuantity.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                            {formatPrice(cat.totalValue)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              {cat.inStockCount}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                              {cat.lowStockCount}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                              {cat.outOfStockCount}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reorder Recommendations */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reorder Recommendations</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Total: {formatPrice(inventoryMetrics.totalReorderValue)}
                </span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {inventoryMetrics.reorderRecommendations.slice(0, 20).map((rec, index) => {
                  const isUrgent = rec.type === 'out_of_stock' || rec.priority === 1;
                  return (
                    <div
                      key={rec.product._id || index}
                      className={`p-4 rounded-lg border transition-all ${
                        isUrgent
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {rec.product.name || 'Unknown Product'}
                            </h4>
                            {isUrgent && (
                              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-medium rounded-full">
                                URGENT
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Current Stock:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {rec.product.stock_quantity || 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Min Level:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {rec.product.min_stock_level || 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Reorder Qty:</span>
                              <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">
                                {rec.quantity}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Reorder Value:</span>
                              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                {formatPrice(rec.estimatedValue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {inventoryMetrics.reorderRecommendations.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No reorder recommendations. All products are well stocked!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Fast Moving vs Slow Moving */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fast Moving Products</h3>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {inventoryMetrics.fastMovingProducts.map((product: any, index: number) => (
                    <div
                      key={product._id || index}
                      className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                          {Number(product.salesCount) || 0} sold
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Stock:</span>
                          <span className="ml-1 font-medium">{product.stock_quantity || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Value:</span>
                          <span className="ml-1 font-medium">{formatPrice(Number(product.stockValue) || 0)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Turnover:</span>
                          <span className="ml-1 font-medium">{(Number(product.turnoverRate) || 0).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {inventoryMetrics.fastMovingProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                      No fast moving products data available
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Slow Moving Products</h3>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {inventoryMetrics.slowMovingProducts.map((product, index) => (
                    <div
                      key={product._id || index}
                      className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                          No sales
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Stock Value:</span>
                          <span className="ml-1 font-medium">{formatPrice(product.stockValue)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Days Since Update:</span>
                          <span className="ml-1 font-medium">{product.daysSinceUpdate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {inventoryMetrics.slowMovingProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                      No slow moving products found. Great inventory management!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inventory Aging */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory Aging (Oldest Stock)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Product</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Stock Qty</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Stock Value</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Days Since Update</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Age Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryMetrics.agingInventory.map((product, index) => (
                      <tr
                        key={product._id || index}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{product.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">{product.category || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">{product.stock_quantity || 0}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                          {formatPrice(product.stockValue)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`text-sm font-medium ${
                            product.daysSinceUpdate > 90 
                              ? 'text-red-600 dark:text-red-400' 
                              : product.daysSinceUpdate > 30 
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {product.daysSinceUpdate} days
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            product.ageCategory === 'old'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                              : product.ageCategory === 'medium'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          }`}>
                            {product.ageCategory === 'old' ? 'Old' : product.ageCategory === 'medium' ? 'Medium' : 'New'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Product Performance Report */}
        {selectedReport === 'products' && (
          <>
            {/* Key Product Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Best Performers</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {productPerformanceMetrics.bestPerformers.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Top revenue products</p>
              </Card>

              <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Worst Performers</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {productPerformanceMetrics.worstPerformers.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No sales, have stock</p>
              </Card>

              <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Most Profitable</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {productPerformanceMetrics.mostProfitable.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Highest margins</p>
              </Card>

              <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fastest Moving</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {productPerformanceMetrics.fastestMoving.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">High turnover rate</p>
              </Card>
            </div>

            {/* Top Performing Products Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing Products (Revenue)</h3>
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

            {/* Best Performers Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Best Performing Products</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Product</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity Sold</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Stock</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Turnover Rate</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Profit Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productPerformanceMetrics.bestPerformers.slice(0, 20).map((product: any, index: number) => (
                      <tr
                        key={product._id || index}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{product.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{product.category || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                          {formatPrice(product.salesData.revenue)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                          {product.salesData.quantity.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                          {product.stock_quantity || 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`text-sm font-medium ${
                            product.turnoverRate > 50 ? 'text-green-600 dark:text-green-400' :
                            product.turnoverRate > 20 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {product.turnoverRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`text-sm font-medium ${
                            product.profitMargin > 30 ? 'text-green-600 dark:text-green-400' :
                            product.profitMargin > 15 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {product.profitMargin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Most Profitable Products */}
            {/* <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Profitable Products (By Margin)</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Product</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Profit Margin</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Avg Price/Sale</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productPerformanceMetrics.mostProfitable.slice(0, 15).map((product: any, index: number) => (
                      <tr
                        key={product._id || index}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{product.name}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                          {formatPrice(product.salesData.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`text-sm font-semibold ${
                            product.profitMargin > 30 ? 'text-green-600 dark:text-green-400' :
                            product.profitMargin > 15 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {product.profitMargin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                          {formatPrice(product.avgPricePerSale)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                          {product.salesData.transactions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div> */}

            {/* Worst Performers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Worst Performers (No Sales, Has Stock)</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Product</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Stock Value</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Stock Qty</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productPerformanceMetrics.worstPerformers.slice(0, 15).map((product: any, index: number) => (
                      <tr
                        key={product._id || index}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{product.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{product.category || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-red-600 dark:text-red-400 text-right">
                          {formatPrice(product.stockValue)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                          {product.stock_quantity || 0}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                          {formatPrice(product.price || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Performance */}
            {/* <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Products</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Total Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity Sold</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Avg Revenue/Product</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Stock Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productPerformanceMetrics.categoryPerformance.map((cat: any, index: number) => (
                      <tr
                        key={cat.category || index}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{cat.category}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">{cat.productCount}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                          {formatPrice(cat.totalRevenue)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                          {cat.totalQuantity.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                          {formatPrice(cat.avgRevenuePerProduct)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                          {formatPrice(cat.totalStockValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div> */}
          </>
        )}

      </div>
    </div>
  );
};
