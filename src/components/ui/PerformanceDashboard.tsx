import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Trophy,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { GoalSettingModal } from './GoalSettingModal';
import { apiService } from '../../services/api';
import { useGoals } from '../../context/GoalContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface PerformanceData {
  daily: {
    today: number;
    yesterday: number;
    thisWeek: number;
    lastWeek: number;
  };
  monthly: {
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
    lastYear: number;
  };
  trends: {
    dailyData: Array<{ date: string; sales: number; transactions: number }>;
    monthlyData: Array<{ month: string; sales: number; transactions: number }>;
  };
  goals: {
    daily: number;
    monthly: number;
    achieved: boolean;
    streak: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    achieved: boolean;
    icon: string;
  }>;
}

interface PerformanceDashboardProps {
  storeId: string;
  analyticsData?: any; // Optional analytics data from parent component
  isLoading?: boolean; // Optional loading state from parent
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  storeId,
  analyticsData: providedAnalyticsData,
  isLoading: parentIsLoading = false
}) => {
  const { isDark } = useTheme();
  
  // Tooltip styles based on theme
  const getTooltipStyles = () => ({
    contentStyle: {
      backgroundColor: isDark ? '#1F2937' : '#ffffff',
      border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
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
      color: isDark ? '#F9FAFB' : '#374151'
    }
  });

  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Use goal progress data from GoalContext instead of calculating our own
  const { dailyProgress, monthlyProgress } = useGoals();

  const loadPerformanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      let dashboardMetrics, salesAnalytics, goals;

      // Use provided analytics data if available, otherwise load from API
      if (providedAnalyticsData) {
        dashboardMetrics = providedAnalyticsData.dashboardAnalytics;
        salesAnalytics = providedAnalyticsData.salesAnalytics || null;
        
        // For Reports page, we need to get today's data separately since provided data might be 30-day range
        // Make a separate API call for today's data to ensure accurate "Today's Sales" display
        const todayData = await apiService.getDashboardAnalytics({
          store_id: storeId,
          dateRange: 'today'
        }).catch(err => {
          return null;
        });
        
        // Override today's sales with the correct today data
        if (todayData && todayData.todaySales !== undefined) {
          dashboardMetrics = {
            ...dashboardMetrics,
            todaySales: todayData.todaySales,
            totalTransactions: todayData.totalTransactions || dashboardMetrics?.totalTransactions
          };
        }
        
        goals = await apiService.isAuthenticated() ?
          apiService.getGoals({ store_id: storeId, is_active: true }).catch(err => {
            return [];
          }) : Promise.resolve([]);
      } else {
        // Load real data from existing API methods and goals
        const [dashboardData, salesData, goalsData] = await Promise.all([
          apiService.getDashboardAnalytics({ store_id: storeId }).catch(err => {
            return null;
          }),
          apiService.getSalesAnalytics({ store_id: storeId }).catch(err => {
            return null;
          }),
          apiService.isAuthenticated() ? apiService.getGoals({ store_id: storeId, is_active: true }).catch(err => {
            return [];
          }) : Promise.resolve([])
        ]);

        dashboardMetrics = dashboardData;
        salesAnalytics = salesData;
        goals = goalsData;
      }

      // Process goals data
      const goalsArray = Array.isArray(goals) ? goals : [];
      const dailyGoal = goalsArray.find((g: any) => g.goal_type === 'daily');
      const monthlyGoal = goalsArray.find((g: any) => g.goal_type === 'monthly');
      
      // Set default goals in localStorage if not available
      if (!dailyGoal && !localStorage.getItem('local_daily_goal')) {
        localStorage.setItem('local_daily_goal', '5000'); // ₺5,000 for 25% progress with ₺1,264
      }
      if (!monthlyGoal && !localStorage.getItem('local_monthly_goal')) {
        localStorage.setItem('local_monthly_goal', '140000'); // ₺140,000 for 6% progress with ₺8,301
      }

      // Debug logging with detailed information

      // Log specific field values to debug
      if (dashboardMetrics) {
      }

      // Use goal progress from GoalContext instead of calculating our own
      // The GoalContext has the correct daily/monthly data with proper date ranges
      const goalContextDailyProgress = dailyProgress?.progress_percentage || 0;
      const goalContextMonthlyProgress = monthlyProgress?.progress_percentage || 0;

      // Check if we have any meaningful data
      const hasData = (dashboardMetrics?.todaySales && dashboardMetrics.todaySales > 0) ||
        (dashboardMetrics?.monthlySales && dashboardMetrics.monthlySales > 0) ||
        (dashboardMetrics?.totalSales && dashboardMetrics.totalSales > 0) ||
        (dailyGoal?.target_amount > 0) ||
        (monthlyGoal?.target_amount > 0) ||
        (localStorage.getItem('local_daily_goal')) ||
        (localStorage.getItem('local_monthly_goal')) ||
        (salesAnalytics && Object.keys(salesAnalytics).length > 0);

      if (!hasData) {
        // Set empty performance data when no real data exists
        const emptyData: PerformanceData = {
          daily: {
            today: 0,
            yesterday: 0,
            thisWeek: 0,
            lastWeek: 0
          },
          monthly: {
            thisMonth: 0,
            lastMonth: 0,
            thisYear: 0,
            lastYear: 0
          },
          trends: {
            dailyData: [],
            monthlyData: []
          },
        goals: {
          daily: dailyProgress?.goal?.target_amount || dailyGoal?.target_amount || parseInt(localStorage.getItem('local_daily_goal') || '5000'),
          monthly: monthlyProgress?.goal?.target_amount || monthlyGoal?.target_amount || parseInt(localStorage.getItem('local_monthly_goal') || '140000'),
          achieved: false,
          streak: 0
        },
          achievements: []
        };
        setPerformanceData(emptyData);
        return;
      }

      // Create performance data from real API data only
      // Use GoalContext data for today's amount to ensure accuracy
      const todayAmount = dailyProgress?.current_amount || dashboardMetrics?.todaySales || 0;
      
      const performanceData: PerformanceData = {
        daily: {
          today: todayAmount,
          yesterday: 0, // TODO: Calculate from previous day data
          thisWeek: dashboardMetrics?.totalSales || 0, // Using total sales as this week for now
          lastWeek: 0 // TODO: Calculate from previous week data
        },
        monthly: {
          thisMonth: monthlyProgress?.current_amount || dashboardMetrics?.monthlySales || 0,
          lastMonth: 0, // TODO: Calculate from previous month data
          thisYear: dashboardMetrics?.totalSales || 0,
          lastYear: 0 // TODO: Calculate from previous year data
        },
        trends: {
          dailyData: dashboardMetrics?.salesByMonth?.slice(0, 7).map((item: any, index: number) => ({
            date: item.month || `Day ${index + 1}`,
            sales: item.sales || 0,
            transactions: item.transactions || 0
          })) || [],
          monthlyData: dashboardMetrics?.salesByMonth || []
        },
        goals: {
          daily: dailyProgress?.goal?.target_amount || dailyGoal?.target_amount || parseInt(localStorage.getItem('local_daily_goal') || '5000'),
          monthly: monthlyProgress?.goal?.target_amount || monthlyGoal?.target_amount || parseInt(localStorage.getItem('local_monthly_goal') || '140000'),
          achieved: goalContextDailyProgress >= 100 || goalContextMonthlyProgress >= 100,
          streak: 0 // TODO: Calculate from goal history
        },
        achievements: [
          ...(goalContextDailyProgress >= 100 ? [{
            id: 'daily-achieved',
            title: 'Daily Goal Achieved',
            description: 'Congratulations! You reached your daily sales goal.',
            achieved: true,
            icon: '🎯'
          }] : []),
          ...(goalContextMonthlyProgress >= 100 ? [{
            id: 'monthly-achieved',
            title: 'Monthly Goal Achieved',
            description: 'Outstanding! You exceeded your monthly target.',
            achieved: true,
            icon: '🏆'
          }] : []),
          ...(dashboardMetrics?.totalTransactions && dashboardMetrics.totalTransactions > 0 ? [{
            id: 'first-sale',
            title: 'First Sale',
            description: 'Great start! You made your first sale.',
            achieved: true,
            icon: '🎉'
          }] : [])
        ]
      };

      setPerformanceData(performanceData);
    } catch (error) {
      console.error('Failed to load performance data:', error);
      // Set empty data when API fails
      setPerformanceData(null);
    } finally {
      setIsLoading(false);
    }
  }, [storeId, dailyProgress?.current_amount, dailyProgress?.progress_percentage, monthlyProgress?.current_amount, monthlyProgress?.progress_percentage, providedAnalyticsData]);

  useEffect(() => {
    if (providedAnalyticsData) {
      // Use provided data immediately
      loadPerformanceData();
    } else {
      // Load data from API
      loadPerformanceData();
    }
  }, [loadPerformanceData, providedAnalyticsData]);

  // Add a method to manually refresh data
  const refreshData = useCallback(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Performance Data Available</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start making sales or set up goals to see your performance metrics and track your progress.
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              onClick={refreshData}
              variant="outline"
            >
              Refresh Data
            </Button>
            <Button
              onClick={() => setIsGoalModalOpen(true)}
              variant="primary"
            >
              Set Goals
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { daily, monthly, trends, goals, achievements } = performanceData;
  const dailyGrowth = calculateGrowth(daily.today, daily.yesterday);
  const monthlyGrowth = calculateGrowth(monthly.thisMonth, monthly.lastMonth);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className={`flex items-center space-x-1 ${getGrowthColor(dailyGrowth)}`}>
              {getGrowthIcon(dailyGrowth)}
              <span className="text-sm font-medium">{dailyGrowth > 0 ? '+' : ''}{dailyGrowth.toFixed(1)}%</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Today's Sales</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₺{daily.today.toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs ₺{daily.yesterday.toLocaleString()} yesterday</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className={`flex items-center space-x-1 ${getGrowthColor(monthlyGrowth)}`}>
              {getGrowthIcon(monthlyGrowth)}
              <span className="text-sm font-medium">{monthlyGrowth > 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}%</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">This Month</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₺{monthly.thisMonth.toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs ₺{monthly.lastMonth.toLocaleString()} last month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex items-center space-x-1">
              <span className={`text-sm font-medium ${daily.today >= goals.daily ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {goals.daily > 0 ? Math.round((daily.today / goals.daily) * 100) : 0}%
              </span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Daily Goal</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₺{goals.daily.toLocaleString()}</p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${daily.today >= goals.daily ? 'bg-green-500 dark:bg-green-400' : 'bg-orange-500 dark:bg-orange-400'
                }`}
              style={{ width: `${goals.daily > 0 ? Math.min((daily.today / goals.daily) * 100, 100) : 0}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {goals.daily > 0 ? Math.round((daily.today / goals.daily) * 100) : 0}% complete
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
              <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex items-center space-x-1">
              <span className={`text-sm font-medium ${monthly.thisMonth >= goals.monthly ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {goals.monthly > 0 ? Math.round((monthly.thisMonth / goals.monthly) * 100) : 0}%
              </span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Monthly Goal</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₺{goals.monthly.toLocaleString()}</p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${monthly.thisMonth >= goals.monthly ? 'bg-green-500 dark:bg-green-400' : 'bg-orange-500 dark:bg-orange-400'
                }`}
              style={{ width: `${goals.monthly > 0 ? Math.min((monthly.thisMonth / goals.monthly) * 100, 100) : 0}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {goals.monthly > 0 ? Math.round((monthly.thisMonth / goals.monthly) * 100) : 0}% complete
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sales Performance Trend
          </h3>
          {trends.monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  formatter={(value: number) => [`₺${value.toLocaleString()}`, 'Sales']}
                  {...getTooltipStyles()}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p>No sales data available</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Achievements</h3>
          {achievements.length > 0 ? (
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${achievement.achieved
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                    }`}
                >
                  <div className={`text-2xl ${achievement.achieved ? '' : 'grayscale opacity-50'}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${achievement.achieved ? 'text-green-900 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {achievement.title}
                    </h4>
                    <p className={`text-sm ${achievement.achieved ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.achieved && (
                    <div className="text-green-600 dark:text-green-400">
                      <Trophy className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">🏆</div>
                <p>No achievements available yet</p>
                <p className="text-sm mt-1">Complete goals to unlock achievements</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Motivational Message */}
      <Card className="p-6 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-800">
        <div className="text-center">
          <div className="text-4xl mb-2">🚀</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {dailyGrowth > 0 ? "You're on fire! 🔥" : daily.today > 0 ? "Keep pushing forward! 💪" : "Ready to start your journey! 🌟"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {dailyGrowth > 0
              ? `Great job! You're ${dailyGrowth.toFixed(1)}% ahead of yesterday. Keep up the momentum!`
              : daily.today > 0
                ? `Every day is a new opportunity to grow. Your consistency will pay off!`
                : `Start making sales to track your performance and unlock achievements!`
            }
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsGoalModalOpen(true)}
            >
              Set Goals
            </Button>
            <Button
              size="sm"
              onClick={refreshData}
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Goal Setting Modal */}
      <GoalSettingModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
      />
    </div>
  );
};

