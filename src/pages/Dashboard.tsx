import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Package, 
  AlertTriangle, 
  DollarSign,
  ShoppingCart,
  BarChart3,
  Eye,
  ArrowRight,
  Calendar,
  TrendingDown,
  Activity,
  Filter,
  X,
  Trophy,
  TrendingUp,
  Target
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useGoals } from '../context/GoalContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationPermissionBanner } from '../components/ui/NotificationPermissionBanner';
import { NotificationStatus } from '../components/ui/NotificationStatus';
import { GoalSettingModal } from '../components/ui/GoalSettingModal';
import { apiService } from '../services/api';
import { app } from '../config/environment';
// import { usePageRefresh } from '../hooks/usePageRefresh'; // Temporarily disabled
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

export const Dashboard: React.FC = () => {
  const { inventoryAlerts, loading, dashboardMetrics, refreshDashboard } = useApp();
  const { user } = useAuth();
  const { dailyProgress, monthlyProgress, updateGoalProgress } = useGoals();
  const { isDark } = useTheme();
  
  // Tooltip styles based on theme
  const getTooltipStyles = () => ({
    contentStyle: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      border: isDark ? 'none' : '1px solid #e5e7eb',
      borderRadius: '12px',
      color: isDark ? '#f9fafb' : '#374151',
      fontSize: '14px',
      fontWeight: '500',
      padding: '12px 16px',
      boxShadow: isDark 
        ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
        : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    },
    labelStyle: {
      color: isDark ? '#f9fafb' : '#374151',
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '4px'
    },
    itemStyle: {
      color: isDark ? '#f9fafb' : '#374151'
    }
  });

  // totalExpenses now comes from dashboard metrics - no separate state needed
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [fullTransactions, setFullTransactions] = useState<any[]>([]); // Full transaction data for payment methods
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [localDashboardMetrics, setLocalDashboardMetrics] = useState<any>(null);
  const [isGoalSettingModalOpen, setIsGoalSettingModalOpen] = useState(false);
  const isRefreshingRef = useRef(false);
  const lastRefreshRef = useRef<number>(0);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<'today' | 'this_month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Refresh dashboard data when component mounts to get latest payment method data
  useEffect(() => {
    if (user?.store_id) {
      console.log('🔄 Dashboard - Refreshing dashboard data on mount');
      refreshDashboard();
    }
  }, [user?.store_id, refreshDashboard]);

  // For initial load with 'today' filter, completely ignore dashboardMetrics to prevent flashing
  // Temporarily disable this to fix the empty KPI issue
  // const shouldIgnoreDashboardMetrics = false; // isInitialLoad && dateRange === 'today';

  // Enable automatic refresh for dashboard with smart intervals based on filter (currently disabled)
  // const refreshInterval = useMemo(() => {
  //   // More frequent refresh for "Today" filter since sales happen in real-time
  //   if (dateRange === 'today') {
  //     return 120000; // 2 minutes for today's data (increased to prevent excessive calls)
  //   }
  //   // Less frequent for monthly/custom data
  //   return 300000; // 5 minutes for other filters (increased to prevent excessive calls)
  // }, [dateRange]);



  // Fetch full transaction data for payment methods chart
  const fetchFullTransactionsForPaymentMethods = useCallback(async (filterParams: any) => {
    try {
      console.log('🔍 Fetching full transactions for payment methods...', {
        store_id: user?.store_id,
        filterParams
      });
      
      const response = await apiService.getTransactions({
        store_id: user?.store_id,
        page: 1,
        limit: 1000, // Get all transactions
        status: 'all',
        start_date: filterParams.startDate,
        end_date: filterParams.endDate,
      });
      
      console.log('🔍 Full Transactions API Response:', {
        success: true,
        transactionCount: response.transactions.length,
        total: response.total,
        sampleTransaction: response.transactions[0]
      });
      
      setFullTransactions(response.transactions);
      console.log('🔍 Full Transactions for Payment Methods:', {
        count: response.transactions.length,
        sampleTransaction: response.transactions[0],
        hasPaymentMethods: response.transactions[0]?.payment_methods,
        hasPaymentMethod: response.transactions[0]?.payment_method
      });
    } catch (error) {
      console.error('❌ Failed to fetch full transactions for payment methods:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }, [user?.store_id]);

  // Initial load will be handled after unifiedRefresh is defined

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  // Format date for chart display (user-friendly format)
  const formatChartDate = (dateString: string) => {
    try {
      // Handle different date formats from API
      let date: Date;

      if (dateString.includes('T') || dateString.includes(' ')) {
        // Handle ISO format or datetime format
        date = new Date(dateString);
      } else if (dateString.includes('-')) {
        // Handle YYYY-MM-DD format
        date = new Date(dateString + 'T00:00:00');
      } else {
        // Fallback
        date = new Date(dateString);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original if invalid
      }

      // Format as "Sep 26", "Sep 21", etc.
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const month = monthNames[date.getMonth()];
      const day = date.getDate();

      return `${month} ${day}`;
    } catch (error) {
      console.error('Error formatting chart date:', error);
      return dateString; // Return original if error
    }
  };

  // Filter sales data locally from AppContext instead of making separate API calls
  // Sales data now comes from unified dashboard analytics API - no separate filtering needed

  // Unified refresh function that loads all dashboard data at once
  const unifiedRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      console.log('🔄 Unified refresh skipped - already refreshing');
      return;
    }

    // Throttle API calls to prevent spam (minimum 5 seconds between calls)
    const now = Date.now();
    if (now - lastRefreshRef.current < 5000) {
      console.log('🔄 Unified refresh throttled - too frequent');
      return;
    }

    isRefreshingRef.current = true;
    lastRefreshRef.current = now;
    console.log('🔄 Unified refresh triggered');

    try {
      // Calculate filter parameters based on current date range
      const now = new Date();
      let filterParams: any = {};
      // Expense dates no longer needed - handled by dashboard metrics API
      
      switch (dateRange) {
        case 'today':
          // Use local timezone to ensure correct "today" calculation
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

          // Send explicit ISO timestamps to avoid timezone confusion
          filterParams = {
            dateRange: 'today',
            startDate: today.toISOString(), // Full ISO timestamp for start of day
            endDate: todayEnd.toISOString() // Full ISO timestamp for end of day
          };
          break;
        case 'this_month':
          // Use local timezone for month boundaries
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

          // Send explicit ISO timestamps to avoid timezone confusion
          filterParams = {
            dateRange: 'this_month',
            startDate: monthStart.toISOString(), // Full ISO timestamp for start of month
            endDate: monthEnd.toISOString() // Full ISO timestamp for end of month
          };
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            // Ensure proper date formatting for custom range
            const startDate = new Date(customStartDate);
            const endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            
            filterParams = {
              dateRange: 'custom',
              startDate: startDate.toISOString(), // Full ISO timestamp for start of custom range
              endDate: endDate.toISOString() // Full ISO timestamp for end of custom range
            };
          } else {
            return; // Don't refresh if custom dates are not set
          }
          break;
        default:
          filterParams = { dateRange: '30d' };
      }

      // Single API call to get all dashboard data
      try {
        console.log('🔍 Dashboard API Call Debug:', {
          dateRange,
          filterParams,
          customStartDate,
          customEndDate,
          todayDate: new Date().toISOString().split('T')[0],
          apiUrl: `/analytics/dashboard?store_id=${user?.store_id}&dateRange=${filterParams.dateRange}&startDate=${filterParams.startDate}&endDate=${filterParams.endDate}`
        });

        const metrics = await apiService.getDashboardAnalytics({
          store_id: user?.store_id,
          status: 'all', // Explicitly request all transaction statuses
          ...filterParams
        });

        // Check if expenses are missing and fetch them separately if needed
        let finalMetrics = { ...metrics };
        if (metrics && (metrics.totalExpenses === undefined || metrics.totalExpenses === null || metrics.totalExpenses === 0)) {
          console.log('🔍 Expenses missing from dashboard metrics, fetching separately...');
          try {
            const expensesResponse = await apiService.getExpenses({
              store_id: user?.store_id,
              start_date: filterParams.startDate,
              end_date: filterParams.endDate,
              limit: 1000 // Get all expenses for the period
            });
            
            const totalExpenses = expensesResponse.expenses.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0);
            finalMetrics = {
              ...metrics,
              totalExpenses: totalExpenses,
              monthlyExpenses: totalExpenses
            };
            
            console.log('🔍 Expenses fetched separately:', {
              expenseCount: expensesResponse.expenses.length,
              totalExpenses,
              sampleExpenses: expensesResponse.expenses.slice(0, 3)
            });
          } catch (expenseError) {
            console.error('❌ Failed to fetch expenses separately:', expenseError);
          }
        }

        setLocalDashboardMetrics(finalMetrics);
        console.log('🔍 Dashboard Metrics Debug (Unified):', {
          totalExpenses: finalMetrics?.totalExpenses,
          monthlyExpenses: finalMetrics?.monthlyExpenses,
          netProfit: finalMetrics?.netProfit,
          totalSales: finalMetrics?.totalSales,
          totalTransactions: finalMetrics?.totalTransactions,
          todaySales: finalMetrics?.todaySales,
          monthlySales: finalMetrics?.monthlySales,
          dateRange,
          filterParams,
          recentTransactions: metrics?.recentTransactions?.length || 0,
          recentTransactionsData: metrics?.recentTransactions?.slice(0, 2), // Log first 2 transactions
          salesByMonth: metrics?.salesByMonth?.length || 0,
          topProducts: metrics?.topProducts?.length || 0,
          apiUrl: `/analytics/dashboard?store_id=${user?.store_id}&startDate=${filterParams.startDate}&endDate=${filterParams.endDate}`,
          // Additional debugging for payment method data
          fullMetricsStructure: {
            hasRecentTransactions: !!metrics?.recentTransactions,
            recentTransactionsType: typeof metrics?.recentTransactions,
            recentTransactionsIsArray: Array.isArray(metrics?.recentTransactions),
            firstTransactionStructure: metrics?.recentTransactions?.[0] ? Object.keys(metrics.recentTransactions[0]) : 'No transactions'
          },
          // Specific debugging for expenses
          expenseDebug: {
            totalExpenses: metrics?.totalExpenses,
            monthlyExpenses: metrics?.monthlyExpenses,
            expensesVsYesterday: metrics?.expensesVsYesterday,
            hasExpenseData: metrics?.totalExpenses !== undefined && metrics?.totalExpenses !== null,
            expenseType: typeof metrics?.totalExpenses,
            customStartDate,
            customEndDate
          }
        });

        // Update goal progress with the loaded metrics
        if (finalMetrics) {
          updateGoalProgress(finalMetrics, finalMetrics);
        }

        // Fetch full transaction data for payment methods chart
        console.log('🔍 About to fetch full transactions with params:', filterParams);
        await fetchFullTransactionsForPaymentMethods(filterParams);

        // Dashboard metrics are now managed locally - no need to update AppContext

      } catch (error) {
        console.error('❌ Failed to load dashboard metrics:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          dateRange,
          filterParams,
          customStartDate,
          customEndDate
        });
      }

      // Mark initial load as complete
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }

    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [dateRange, customStartDate, customEndDate, user?.store_id, isInitialLoad, updateGoalProgress, fetchFullTransactionsForPaymentMethods]);

  // Initial load is handled by usePageRefresh with refreshOnMount: true

  // Use unified refresh for all refresh operations
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Temporarily disable auto-refresh to debug the issue
  // TODO: Re-enable after confirming manual refresh works correctly
  // usePageRefresh({
  //   refreshOnMount: false, // Disabled since we have manual initial load
  //   refreshOnFocus: false, // Disabled to prevent excessive calls on focus
  //   refreshInterval: refreshInterval, // 2 minutes for today, 5 minutes for others
  //   refreshOnVisibilityChange: false, // Disabled to prevent excessive calls on visibility change
  //   refreshFunction: unifiedRefresh, // Use our unified refresh function
  //   silent: true
  // });

  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Filter changes are now handled by unified refresh

  // Initial load on mount
  useEffect(() => {
    unifiedRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Filter changes trigger unified refresh with debounce
  // Remove unifiedRefresh from dependencies to prevent infinite loop
  useEffect(() => {
    // Skip initial load to prevent duplicate calls
    if (isInitialLoad) return;
    
    const timeoutId = setTimeout(() => {
      unifiedRefresh();
    }, 1000); // Increased to 1 second debounce to prevent API spam

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, customStartDate, customEndDate]); // Removed unifiedRefresh from dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Use local dashboard metrics when available, otherwise use smart metrics
  const currentDashboardMetrics = localDashboardMetrics || dashboardMetrics;
  
  // Debug: Log dashboard metrics to see payment method data
  console.log('🔍 Dashboard - Current Metrics:', {
    hasLocalMetrics: !!localDashboardMetrics,
    hasDashboardMetrics: !!dashboardMetrics,
    paymentMethods: currentDashboardMetrics?.paymentMethods,
    totalSales: currentDashboardMetrics?.totalSales,
    metricsKeys: currentDashboardMetrics ? Object.keys(currentDashboardMetrics) : []
  });

  // Use filtered sales data for charts when filters are applied, otherwise use API data
  const salesData = useMemo(() => {
    // If filters are applied (not default 'this_month'), use filtered sales
    if (dateRange !== 'this_month' || customStartDate || customEndDate) {
      if (!filteredSales || filteredSales.length === 0) {
        // If filtered sales is empty, try to use currentDashboardMetrics data as fallback
        if (currentDashboardMetrics?.salesByMonth && currentDashboardMetrics.salesByMonth.length > 0) {
          return currentDashboardMetrics.salesByMonth.map((item: any) => ({
            day: formatChartDate(item.month), // Format date for better UX
            sales: item.sales
          }));
        }
        return [];
      }

      // Group filtered sales by day
      const dailySales = filteredSales.reduce((acc, sale) => {
        const saleDate = new Date(sale.created_at);
        const dayKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}`;
        
        if (!acc[dayKey]) {
          acc[dayKey] = { day: formatChartDate(dayKey), sales: 0 }; // Format date for better UX
        }
        acc[dayKey].sales += sale.total_amount;
        
        return acc;
      }, {} as Record<string, { day: string; sales: number }>);

      return Object.values(dailySales).sort((a: any, b: any) => {
        // Sort by original date string, not formatted string
        const aDate = Object.keys(dailySales).find(key => dailySales[key] === a);
        const bDate = Object.keys(dailySales).find(key => dailySales[key] === b);
        return (aDate || '').localeCompare(bDate || '');
      });
    }
    
    // Use API data when no filters are applied
    if (currentDashboardMetrics?.salesByMonth && currentDashboardMetrics.salesByMonth.length > 0) {
      return currentDashboardMetrics.salesByMonth.map((item: any) => ({
        day: formatChartDate(item.month), // Format date for better UX
    sales: item.sales
      }));
    }
    
    return [];
  }, [currentDashboardMetrics?.salesByMonth, filteredSales, dateRange, customStartDate, customEndDate]);

  // Use filtered sales data for top products when filters are applied, otherwise use API data
  const topProductsData = useMemo(() => {
    // If filters are applied (not default 'this_month'), use filtered sales
    if (dateRange !== 'this_month' || customStartDate || customEndDate) {
      if (!filteredSales || filteredSales.length === 0) {
        // If filtered sales is empty, try to use currentDashboardMetrics data as fallback
        if (currentDashboardMetrics?.topProducts && currentDashboardMetrics.topProducts.length > 0) {
          return currentDashboardMetrics.topProducts.map((product: any) => ({
            name: product.productName?.length > 8
              ? product.productName.substring(0, 8) + '...'
              : product.productName,
            fullName: product.productName,
            revenue: product.revenue,
            quantity: product.quantitySold,
          }));
        }
        return [];
      }
      
      // Aggregate product sales from filtered transactions
      const productSales = filteredSales.reduce((acc, sale) => {
        sale.items?.forEach((item: any) => {
          const productId = item.product_id;
          if (!acc[productId]) {
            acc[productId] = {
              productId,
              productName: item.product_name,
              revenue: 0,
              quantitySold: 0
            };
          }
          acc[productId].revenue += item.total_price;
          acc[productId].quantitySold += item.quantity;
        });
        return acc;
      }, {} as Record<string, { productId: string; productName: string; revenue: number; quantitySold: number }>);
      
      // Convert to array and sort by revenue
      return Object.values(productSales)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10) // Top 10 products
        .map((product: any) => ({
          name: product.productName?.length > 8
            ? product.productName.substring(0, 8) + '...'
      : product.productName || 'Unknown Product',
          fullName: product.productName || 'Unknown Product',
          revenue: product.revenue,
          quantity: product.quantitySold,
        }));
    }
    
    // Use API data when no filters are applied
    if (currentDashboardMetrics?.topProducts && currentDashboardMetrics.topProducts.length > 0) {
      return currentDashboardMetrics.topProducts.map((product: any) => ({
        name: product.productName?.length > 8
          ? product.productName.substring(0, 8) + '...'
          : product.productName,
        fullName: product.productName,
        revenue: product.revenue,
        quantity: product.quantitySold,
      }));
    }
    
    return [];
  }, [currentDashboardMetrics?.topProducts, filteredSales, dateRange, customStartDate, customEndDate]);

  // Generate payment method data from dashboard metrics or actual transactions (using AMOUNTS, not counts)
  const paymentMethodData = useMemo(() => {
    // Use dashboard metrics payment data if available (filtered by current period)
    if (currentDashboardMetrics?.paymentMethods) {
      const paymentMethods = currentDashboardMetrics.paymentMethods;
      const totalAmount = Object.values(paymentMethods).reduce((sum: number, amount: any) => sum + (amount || 0), 0);
      
      return Object.entries(paymentMethods).map(([method, amount]: [string, any]) => ({
        name: method.charAt(0).toUpperCase() + method.slice(1),
        value: amount || 0,
        percentage: totalAmount > 0 ? ((amount || 0) / totalAmount * 100).toFixed(1) : '0.0',
        color: getPaymentMethodColor(method)
      }));
    }

    // Use full transactions for payment methods (they have complete payment data)
    const sales = fullTransactions.length > 0 ? fullTransactions : (filteredSales.length > 0 ? filteredSales : (currentDashboardMetrics?.recentTransactions || []));
    
    console.log('🔍 Payment Method Data Debug:', {
      fullTransactionsLength: fullTransactions.length,
      filteredSalesLength: filteredSales.length,
      recentTransactionsLength: currentDashboardMetrics?.recentTransactions?.length || 0,
      salesLength: sales.length,
      dataSource: fullTransactions.length > 0 ? 'fullTransactions' : (filteredSales.length > 0 ? 'filteredSales' : 'recentTransactions'),
      sampleTransactions: sales.slice(0, 3).map((s: any) => ({
        id: s._id,
        total_amount: s.total_amount,
        payment_methods: s.payment_methods,
        payment_method: s.payment_method,
        created_at: s.created_at
      })),
      salesData: sales.slice(0, 2), // Log first 2 transactions for debugging
      transactionStatuses: sales.map((s: any) => s.status || s.payment_status).filter(Boolean), // Log transaction statuses
      uniqueStatuses: Array.from(new Set(sales.map((s: any) => s.status || s.payment_status).filter(Boolean))),
      // Additional debugging for payment method structure
      paymentMethodFields: sales.map((s: any) => ({
        hasPaymentMethods: !!s.payment_methods,
        hasPaymentMethod: !!s.payment_method,
        paymentMethods: s.payment_methods,
        paymentMethod: s.payment_method,
        totalAmount: s.totalAmount,
        total_amount: s.total_amount
      })).slice(0, 2)
    });
    
    if (!sales || sales.length === 0) {
      console.log('⚠️ No sales data available, returning empty data');
      // Return empty data instead of mock data
      return [];
    }
    
    // Check if we have payment method data in the transactions
    const hasPaymentData = sales.some((sale: any) => 
      (sale.payment_methods && sale.payment_methods.length > 0) || sale.payment_method
    );
    
    if (!hasPaymentData) {
      console.log('⚠️ No payment method data found in transactions - returning empty data');
      // Return empty data instead of estimating - we want real payment method data
      return [];
    }
    
    const paymentMethods: { [key: string]: number } = {};
    let totalAmount = 0;
    
    sales.forEach((sale: any) => {
      console.log('Processing sale for payment methods:', {
        saleId: sale._id,
        totalAmount: sale.total_amount,
        hasPaymentMethods: !!(sale.payment_methods && sale.payment_methods.length > 0),
        hasPaymentMethod: !!sale.payment_method,
        paymentMethods: sale.payment_methods,
        paymentMethod: sale.payment_method
      });
      
      // Handle both new (payment_methods array) and legacy (single payment_method) formats
      if (sale.payment_methods && sale.payment_methods.length > 0) {
        // New format: payment_methods array
        sale.payment_methods.forEach((method: any) => {
          console.log('Processing payment method:', method);
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
          console.log(`Adding ${method.amount} to ${methodKey}`);
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
        // Use totalAmount for dashboard metrics format, total_amount for full transaction format
        const amount = sale.totalAmount || sale.total_amount || 0;
        paymentMethods[methodKey] = (paymentMethods[methodKey] || 0) + amount;
        totalAmount += amount;
      }
    });
    
    const result = Object.entries(paymentMethods).map(([method, amount]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: amount,
      percentage: totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : '0.0',
      color: getPaymentMethodColor(method)
    }));
    
    console.log('🔍 Final Payment Method Calculation:', {
      paymentMethods,
      totalAmount,
      result,
      salesProcessed: sales.length
    });
    
    return result;
  }, [currentDashboardMetrics?.paymentMethods, fullTransactions, filteredSales, currentDashboardMetrics?.recentTransactions]);

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

  // Smart filtering system that affects all dashboard content
  const getSmartFilteringData = () => {
    const now = new Date();
    let currentPeriodStart: Date;
    let currentPeriodEnd: Date;
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;
    let comparisonLabel: string;
    let periodLabel: string;
    
    // Determine current period based on filter
    switch (dateRange) {
      case 'today':
        // Today vs Yesterday
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        currentPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        previousPeriodStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        previousPeriodEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
        comparisonLabel = 'vs yesterday';
        periodLabel = 'Today';
        break;
        
      case 'this_month':
        // This month vs Last month
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousPeriodStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        previousPeriodEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59);
        comparisonLabel = 'vs last month';
        periodLabel = 'This Month';
        break;
        
      case 'custom':
        // Custom range vs same length period before
        if (!customStartDate || !customEndDate) {
               return null;
        }
        currentPeriodStart = new Date(customStartDate);
        currentPeriodEnd = new Date(customEndDate);
        const periodLength = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
        previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1);
        previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodLength);
        comparisonLabel = 'vs previous period';
        periodLabel = `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`;
        break;
        
      default:
        return null;
    }
    
      return {
      currentPeriodStart,
      currentPeriodEnd,
      previousPeriodStart,
      previousPeriodEnd,
      comparisonLabel,
      periodLabel
    };
  };

  // Calculate comprehensive metrics from filtered sales data
  const calculateSmartMetrics = () => {
    const filterData = getSmartFilteringData();
    if (!filterData) {
      return {
        totalSales: 0,
        totalTransactions: 0,
        averageTransactionValue: 0,
        growthRate: 0,
        comparisonLabel: 'vs last month',
        periodLabel: 'This Month'
      };
    }

    const { previousPeriodStart, previousPeriodEnd, comparisonLabel, periodLabel } = filterData;
    
    // Get current period data (from filtered sales)
    const currentPeriodSales = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const currentPeriodTransactions = filteredSales.length;
    const currentPeriodAvgTransaction = currentPeriodTransactions > 0 ? currentPeriodSales / currentPeriodTransactions : 0;
    
    // Get previous period data (simplified - use current metrics for now)
    // TODO: Implement proper previous period calculation when needed
    const previousPeriodSales = 0; // Simplified for now
    const previousPeriodTransactions = 0; // Simplified for now
    
    const previousPeriodAvgTransaction = previousPeriodTransactions > 0 ? previousPeriodSales / previousPeriodTransactions : 0;
    
    // Calculate growth rates
    const salesGrowthRate = previousPeriodSales > 0 ? ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100 : (currentPeriodSales > 0 ? 100 : 0);
    const transactionGrowthRate = previousPeriodTransactions > 0 ? ((currentPeriodTransactions - previousPeriodTransactions) / previousPeriodTransactions) * 100 : (currentPeriodTransactions > 0 ? 100 : 0);
    const avgTransactionGrowthRate = previousPeriodAvgTransaction > 0 ? ((currentPeriodAvgTransaction - previousPeriodAvgTransaction) / previousPeriodAvgTransaction) * 100 : (currentPeriodAvgTransaction > 0 ? 100 : 0);
    
    return {
      totalSales: currentPeriodSales,
      totalTransactions: currentPeriodTransactions,
      averageTransactionValue: currentPeriodAvgTransaction,
      growthRate: salesGrowthRate,
      transactionGrowthRate,
      avgTransactionGrowthRate,
      comparisonLabel,
      periodLabel,
      previousPeriodSales,
      previousPeriodTransactions,
      previousPeriodAvgTransaction
    };
  };

  // Use unified API data directly - no need for smart metrics calculation
  const totalSales = currentDashboardMetrics?.totalSales ?? 0;
  const totalTransactions = currentDashboardMetrics?.totalTransactions ?? 0;
  const averageTransactionValue = currentDashboardMetrics?.averageTransactionValue ?? 0;
  const growthRate = currentDashboardMetrics?.growthRate ?? 0;
  
  // New individual vs yesterday metrics
  const salesVsYesterday = currentDashboardMetrics?.salesVsYesterday ?? 0;
  const expensesVsYesterday = currentDashboardMetrics?.expensesVsYesterday ?? 0;
  const rawProfitVsYesterday = currentDashboardMetrics?.profitVsYesterday ?? 0;
  const transactionsVsYesterday = currentDashboardMetrics?.transactionsVsYesterday ?? 0;
  
  // Fix profit percentage calculation for negative base values
  const profitVsYesterday = useMemo(() => {
    const currentProfit = currentDashboardMetrics?.netProfit ?? 0;
    
    // If current profit is positive and raw percentage is very negative (< -100),
    // this means we went from negative to positive profit - which is always good!
    if (currentProfit > 0 && rawProfitVsYesterday < -100) {
      // Show this as a positive improvement instead of negative
      // Use a more intuitive calculation: show the absolute improvement
      return Math.abs(rawProfitVsYesterday);
    }
    
    return rawProfitVsYesterday;
  }, [rawProfitVsYesterday, currentDashboardMetrics?.netProfit]);
  // Get comparison label and period label based on current filter
  let comparisonLabel = 'vs last month';
  let periodLabel = 'This Month';
  
  // Set labels based on current date range
    switch (dateRange) {
      case 'today':
        comparisonLabel = 'vs yesterday';
        periodLabel = 'Today';
        break;
    case 'this_month':
      comparisonLabel = 'vs last month';
      periodLabel = 'This Month';
      break;
      case 'custom':
        comparisonLabel = 'vs previous period';
      periodLabel = 'Custom Period';
        break;
      default:
        comparisonLabel = 'vs last month';
        periodLabel = 'This Month';
  }

  // Use expense data from dashboard metrics (single source of truth)
  const totalExpensesFromMetrics = currentDashboardMetrics?.totalExpenses || 0;
  const monthlyExpensesFromMetrics = currentDashboardMetrics?.monthlyExpenses || 0;
  const netProfitFromMetrics = currentDashboardMetrics?.netProfit || 0;

  // Use net profit from metrics (calculated by backend)
  const netProfit = netProfitFromMetrics;
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 Dashboard Data Sources Debug:', {
      dateRange,
      currentDashboardMetrics: {
        totalSales: currentDashboardMetrics?.totalSales,
        totalTransactions: currentDashboardMetrics?.totalTransactions,
        averageTransactionValue: currentDashboardMetrics?.averageTransactionValue,
        totalExpenses: currentDashboardMetrics?.totalExpenses,
        netProfit: currentDashboardMetrics?.netProfit
      },
      finalValues: {
        totalSales,
        totalTransactions,
        averageTransactionValue,
        totalExpenses: totalExpensesFromMetrics,
        netProfit: netProfitFromMetrics
      }
    });
  }, [dashboardMetrics, totalSales, totalTransactions, averageTransactionValue, growthRate, salesVsYesterday, expensesVsYesterday, profitVsYesterday, transactionsVsYesterday, netProfit, totalExpensesFromMetrics, monthlyExpensesFromMetrics, netProfitFromMetrics, comparisonLabel, periodLabel, dateRange, customStartDate, customEndDate, currentDashboardMetrics]);

  const metricCards = [
    {
      title: 'Total Sales',
      value: formatPrice(totalSales),
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-gradient-to-br from-emerald-100 to-teal-100',
      iconColor: 'text-emerald-600',
      change: `${salesVsYesterday > 0 ? '+' : ''}${salesVsYesterday.toFixed(1)}% ${comparisonLabel}`,
      changeColor: salesVsYesterday >= 0 ? 'text-emerald-600' : 'text-red-600',
    },
    {
      title: 'Total Expenses',
      value: formatPrice(totalExpensesFromMetrics),
      icon: TrendingDown,
      gradient: 'from-red-500 to-pink-600',
      iconBg: 'bg-gradient-to-br from-red-100 to-pink-100',
      iconColor: 'text-red-600',
      change: `${expensesVsYesterday > 0 ? '+' : ''}${expensesVsYesterday.toFixed(1)}% ${comparisonLabel}`,
      changeColor: expensesVsYesterday <= 0 ? 'text-emerald-600' : 'text-red-600', // Lower expenses = good (green)
    },
    {
      title: 'Net Profit',
      value: formatPrice(netProfit),
      icon: Activity,
      gradient: netProfit >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600',
      iconBg: netProfit >= 0 ? 'bg-gradient-to-br from-green-100 to-emerald-100' : 'bg-gradient-to-br from-red-100 to-rose-100',
      iconColor: netProfit >= 0 ? 'text-green-600' : 'text-red-600',
      change: `${profitVsYesterday > 0 ? '+' : ''}${profitVsYesterday.toFixed(1)}% ${comparisonLabel}`,
      changeColor: profitVsYesterday >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      title: 'Transactions',
      value: totalTransactions.toString(),
      icon: ShoppingCart,
      gradient: 'from-green-500 to-green-700',
      iconBg: 'bg-gradient-to-br from-green-100 to-green-200',
      iconColor: 'text-green-600',
      change: `${transactionsVsYesterday > 0 ? '+' : ''}${transactionsVsYesterday.toFixed(1)}% ${comparisonLabel}`,
      changeColor: transactionsVsYesterday >= 0 ? 'text-green-600' : 'text-red-600',
    },
  ];

  if (loading || isInitialLoad) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4 pb-24 transition-colors duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
            <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Welcome to {app.name} Management System</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-green-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-white via-white to-green-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 transition-all duration-300 hover:shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-700/5 dark:from-green-400/5 dark:to-green-500/5"></div>
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl mb-4 shadow-lg">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
              Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Welcome to {app.name} Management System
            </p>
            <div className="mt-4 flex justify-center items-center space-x-4">
              <NotificationStatus />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔄 Manual dashboard refresh triggered');
                  refreshDashboard();
                }}
                className="flex items-center space-x-2"
              >
                <Activity className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGoalSettingModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <Target className="h-4 w-4" />
                <span>Set Goals</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard Filters</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Filter your dashboard data</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
              </Button>

            </div>
          </div>

          {showFilters && (
            <div className="space-y-4">
              {/* Quick Date Range Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Quick Select
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDateRange('today')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${dateRange === 'today'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setDateRange('this_month')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${dateRange === 'this_month'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setDateRange('custom')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${dateRange === 'custom'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Custom Range
                  </button>
                </div>
              </div>

              {/* Custom Date Range */}
              {dateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-label="Select start date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-label="Select end date"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Filters Summary */}
          <div className="mt-4 flex flex-wrap items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filter:</span>
              {dateRange !== 'this_month' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {dateRange === 'today' ? 'Today' : 
                   dateRange === 'custom' ? 
                     (customStartDate && customEndDate ? 
                       `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}` : 
                       'Custom Range') : 
                   'This Month'}
                  <button
                    onClick={() => setDateRange('this_month')}
                    className="ml-1 hover:text-blue-600"
                    title="Reset to This Month"
                    aria-label="Reset to This Month"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentDashboardMetrics ? (
                `Showing ${currentDashboardMetrics.totalTransactions || 0} ${dateRange === 'today' ? 'today\'s' : dateRange === 'this_month' ? 'this month\'s' : 'filtered'} transactions`
              ) : (
                `Showing 0 total transactions`
              )}
            </div>
          </div>
        </div>

        {/* Notification Permission Banner */}
        <NotificationPermissionBanner />

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-white dark:hover:bg-gray-800"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-gray-700/50"></div>
                <div className="relative">
                  <div className={`w-14 h-14 ${metric.iconBg} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-7 w-7 ${metric.iconColor}`} />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                    {metric.title}
                  </h3>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {metric.value}
                  </p>
                  <div className="flex items-center space-x-1">
                    <span className={`text-xs font-medium ${metric.changeColor}`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Goal Progress Cards */}
        {(dailyProgress || monthlyProgress) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Goal Progress */}
            {dailyProgress && (
              <div className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-white dark:hover:bg-gray-800">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: '#009DE3' }}>
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
              <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Daily Goal</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {dailyProgress.goal.goal_name || 'Daily Sales Target'}
                        </p>
              </div>
              </div>
                    {dailyProgress.is_achieved && (
                      <div className="flex items-center space-x-1 px-2 py-1 rounded-full" style={{ backgroundColor: '#17A068', color: 'white' }}>
                        <Trophy className="h-3 w-3" />
                        <span className="text-xs font-semibold">ACHIEVED!</span>
            </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {Math.round(dailyProgress.progress_percentage)}%
                      </span>
                </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${dailyProgress.is_achieved
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                        style={{ width: `${Math.min(dailyProgress.progress_percentage, 100)}%` }}
                      ></div>
                  </div>
                </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        ₺{dailyProgress.goal.target_amount.toLocaleString()}
                      </p>
                  </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        ₺{dailyProgress.current_amount.toLocaleString()}
                      </p>
                </div>
                  </div>

                  {dailyProgress.hours_remaining !== undefined && dailyProgress.hours_remaining > 0 && (
                    <div className="mt-2 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {dailyProgress.hours_remaining} hours remaining today
                      </p>
                </div>
                  )}
            </div>
          </div>
            )}

            {/* Monthly Goal Progress */}
            {monthlyProgress && (
              <div className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-white dark:hover:bg-gray-800">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: '#8E3BE0' }}>
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Monthly Goal</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {monthlyProgress.goal.goal_name || 'Monthly Sales Target'}
                        </p>
                      </div>
                    </div>
                    {monthlyProgress.is_achieved && (
                      <div className="flex items-center space-x-1 px-2 py-1 rounded-full" style={{ backgroundColor: '#17A068', color: 'white' }}>
                        <Trophy className="h-3 w-3" />
                        <span className="text-xs font-semibold">ACHIEVED!</span>
                      </div>
                    )}
        </div>

                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {Math.round(monthlyProgress.progress_percentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${monthlyProgress.is_achieved
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500'
                          }`}
                        style={{ width: `${Math.min(monthlyProgress.progress_percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        ₺{monthlyProgress.goal.target_amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        ₺{monthlyProgress.current_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {monthlyProgress.days_remaining !== undefined && monthlyProgress.days_remaining > 0 && (
                    <div className="mt-2 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {monthlyProgress.days_remaining} days remaining this month
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Charts Section */}
        <div className="space-y-8">
          {/* Sales Overview Chart - Full Width */}
          <div className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 transition-all duration-300 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-teal-600/5 dark:from-emerald-400/5 dark:to-teal-400/5"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Sales Overview</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Daily sales performance</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="h-80">
                {salesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis 
                        dataKey="day"
                        stroke="#6b7280" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#6b7280" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatPrice(value), 'Sales']}
                        labelFormatter={(label) => `Day: ${label}`}
                        {...getTooltipStyles()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="url(#salesGradient)" 
                        strokeWidth={4}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 3, fill: '#ffffff' }}
                      />
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">No sales data available</p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Sales data will appear here once transactions are recorded</p>
                      <button
                        onClick={() => window.location.href = '/pos'}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      >
                        Start Selling
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => window.location.href = '/reports'}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  View Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          </div>

          {/* Second Row: Top Products and Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Products Chart */}
          <div className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 transition-all duration-300 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-700/5 dark:from-green-400/5 dark:to-green-500/5"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Top Products</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Best performing products</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="h-96">
                {topProductsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProductsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6b7280" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        angle={0}
                        textAnchor="middle"
                        height={60}
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        stroke="#6b7280" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          formatPrice(value), 
                          'Revenue'
                        ]}
                        labelFormatter={(label: string, payload: any) => {
                          const data = payload?.[0]?.payload;
                          return data?.fullName || label;
                        }}
                        {...getTooltipStyles()}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="url(#barGradient)" 
                        radius={[8, 8, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Package className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">No product data available</p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Product performance data will appear here</p>
                      <button
                        onClick={() => window.location.href = '/products'}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      >
                        Manage Products
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => window.location.href = '/products'}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          </div>

          {/* Payment Methods Chart */}
          <div className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 transition-all duration-300 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 dark:from-purple-400/5 dark:to-pink-400/5"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payment Methods</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Revenue distribution by type</p>
                    </div>
                  </div>
                </div>
              </div>
               <div className="h-[28rem]">
                 {paymentMethodData.length > 0 ? (
                   <div className="flex flex-col h-full">
                     {/* Chart Section */}
                     <div className="flex-1 flex items-center justify-center p-6">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                             data={paymentMethodData}
                             cx="50%"
                             cy="50%"
                             innerRadius={45}
                             outerRadius={70}
                             paddingAngle={2}
                             dataKey="value"
                             stroke="none"
                           >
                             {paymentMethodData.map((entry, index) => (
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
                         </PieChart>
                       </ResponsiveContainer>
                     </div>
                     
                     {/* Legend Section */}
                     <div className="mt-4 space-y-3">
                       {paymentMethodData.map((method, index) => (
                         <div key={index} className="flex items-center justify-between group">
                           <div className="flex items-center space-x-3">
                             <div 
                               className="w-3 h-3 rounded-full shadow-sm" 
                               style={{ backgroundColor: method.color }}
                             ></div>
                             <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                               {method.name}
                             </span>
                           </div>
                           <div className="text-right">
                             <div className="text-sm font-bold text-gray-900 dark:text-white">
                               {formatPrice(method.value)}
                             </div>
                             <div className="text-xs text-gray-500 dark:text-gray-400">
                               {method.percentage}%
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <DollarSign className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Payment Data</h4>
                      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                        Payment method breakdown will appear here once you have transaction data
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Recent Activity & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Sales */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">Recent Sales</h3>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                {currentDashboardMetrics?.recentTransactions && currentDashboardMetrics.recentTransactions.length > 5 && (
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
              {(filteredSales && filteredSales.length > 0) || (currentDashboardMetrics?.recentTransactions && currentDashboardMetrics.recentTransactions.length > 0) ? (
                (filteredSales && filteredSales.length > 0 ? filteredSales : (currentDashboardMetrics?.recentTransactions || []))?.slice(0, 4).map((sale: any, index: number) => {
                  // Always prefer filteredSales data as it contains complete transaction details with product names
                  const isApiData = !filteredSales || filteredSales.length === 0;

                  // Extract product names from both API data and filtered sales
                  let productNames = 'No items';
                  let hasMoreItems = false;

                  if (isApiData) {
                    // For API data (when filteredSales is not available), we need to get product names from the transaction items
                    // The API should include items with product names
                    if (sale.items && sale.items.length > 0) {
                      productNames = sale.items.slice(0, 2).map((item: any) => item.product_name || item.productName || 'Unknown Product').join(', ');
                      hasMoreItems = sale.items.length > 2;
                    } else {
                      // Fallback: if no items in API data, show transaction ID or generic name
                      productNames = `Transaction #${sale.id?.slice(-6) || 'Unknown'}`;
                    }
                  } else {
                    // For filtered sales data (preferred - contains complete transaction details)
                    if (sale.items && sale.items.length > 0) {
                      productNames = sale.items.slice(0, 2).map((item: any) => item.product_name || item.productName || 'Unknown Product').join(', ');
                      hasMoreItems = sale.items.length > 2;
                    } else {
                      // Fallback: if no items in filtered sales, show transaction ID
                      productNames = `Transaction #${sale._id?.slice(-6) || sale.id?.slice(-6) || 'Unknown'}`;
                    }
                  }
                  const saleDate = isApiData ? sale.createdAt : sale.created_at;
                  const paymentMethod = isApiData ? sale.paymentMethod : sale.payment_method;
                  const totalAmount = isApiData ? sale.totalAmount : sale.total_amount;
                  const itemCount = isApiData ? 1 : (sale.items?.length || 0);
                  
                  return (
                    <div key={`sale-${index}-${isApiData ? sale.id : sale._id}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 dark:text-white text-sm truncate">
                          {productNames}
                          {hasMoreItems && ` +${(sale.items?.length || 0) - 2} more`}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(saleDate).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="capitalize">
                            {paymentMethod || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <p className="font-semibold text-gray-800 dark:text-white text-sm">{formatPrice(totalAmount || 0)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{itemCount} items</p>
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.alert_type === 'out_of_stock'
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

        </div>

        {/* Quick Actions - Compact Version */}
        <div className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50 p-4 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
      </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.location.href = '/pos'}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-lg text-white text-xs font-medium transition-all duration-300 hover:scale-105"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>New Sale</span>
              </button>
              <button
                onClick={() => window.location.href = '/products'}
                className="flex items-center space-x-2 px-3 py-2 bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-xs font-medium transition-all duration-300 hover:scale-105"
              >
                <Package className="h-4 w-4" />
                <span>Add Product</span>
              </button>
              <button
                onClick={() => window.location.href = '/inventory'}
                className="flex items-center space-x-2 px-3 py-2 bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-xs font-medium transition-all duration-300 hover:scale-105"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Inventory</span>
              </button>
              <button
                onClick={() => window.location.href = '/reports'}
                className="flex items-center space-x-2 px-3 py-2 bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-xs font-medium transition-all duration-300 hover:scale-105"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Reports</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Setting Modal */}
      <GoalSettingModal
        isOpen={isGoalSettingModalOpen}
        onClose={() => setIsGoalSettingModalOpen(false)}
      />
    </div>
  );
};
