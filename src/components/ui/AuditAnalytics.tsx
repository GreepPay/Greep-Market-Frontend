import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity,
  Shield,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { apiService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface AuditAnalyticsProps {
  storeId?: string;
}

interface AuditStats {
  total_actions: number;
  actions_by_type: Record<string, number>;
  actions_by_resource: Record<string, number>;
  actions_by_user: Record<string, number>;
  most_active_users: Array<{ email: string; count: number }>;
  recent_activity: Array<{
    _id: string;
    user_email: string;
    action: string;
    resource_type: string;
    created_at: string;
  }>;
}

export const AuditAnalytics: React.FC<AuditAnalyticsProps> = ({ storeId }) => {
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
    }
  });

  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = new Date();
      const endDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const response = await apiService.request<AuditStats>(`/audit/stats?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading audit analytics:', error);
      setError('Failed to load audit analytics');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return '#10B981';
      case 'UPDATE': return '#3B82F6';
      case 'DELETE': return '#EF4444';
      case 'LOGIN': return '#8B5CF6';
      case 'LOGOUT': return '#6B7280';
      case 'EXPORT': return '#F59E0B';
      case 'IMPORT': return '#06B6D4';
      default: return '#6B7280';
    }
  };

  const getResourceColor = (resource: string) => {
    switch (resource) {
      case 'PRODUCT': return '#10B981';
      case 'TRANSACTION': return '#3B82F6';
      case 'EXPENSE': return '#EF4444';
      case 'USER': return '#8B5CF6';
      case 'INVENTORY': return '#F59E0B';
      case 'GOAL': return '#06B6D4';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-4" />
          <p>{error}</p>
          <Button onClick={loadAnalytics} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-4" />
          <p>No analytics data available</p>
        </div>
      </Card>
    );
  }

  // Prepare chart data
  const actionData = Object.entries(stats.actions_by_type).map(([action, count]) => ({
    action,
    count,
    color: getActionColor(action)
  }));

  const resourceData = Object.entries(stats.actions_by_resource).map(([resource, count]) => ({
    resource,
    count,
    color: getResourceColor(resource)
  }));

  const userData = stats.most_active_users.slice(0, 10).map(user => ({
    user: user.email.split('@')[0], // Show username only
    count: user.count
  }));

  // Debug logging for user data
  console.log('🔍 Most Active Users Debug:', {
    mostActiveUsers: stats.most_active_users,
    userData: userData,
    hasData: userData.length > 0,
    totalCount: userData.reduce((sum, user) => sum + user.count, 0)
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced analytics and reporting for audit logs
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            title="Select time range"
            aria-label="Select time range"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <Button onClick={loadAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Actions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_actions}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Object.keys(stats.actions_by_user).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Security Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats.actions_by_type.LOGIN || 0) + (stats.actions_by_type.LOGOUT || 0)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Actions/Day</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(stats.total_actions / (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365))}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions by Type */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={actionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ action, percent }) => `${action} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {actionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                {...getTooltipStyles()}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Actions by Resource */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions by Resource</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resourceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="resource" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                {...getTooltipStyles()}
              />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Most Active Users */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Active Users</h3>
        {userData.length === 0 || userData.every(user => user.count === 0) ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
            <Users className="h-16 w-16 mb-4 opacity-50" />
            <h4 className="text-lg font-medium mb-2">No User Activity Data</h4>
            <p className="text-sm text-center max-w-sm">
              No user activity has been recorded for the selected time period. 
              User activity will appear here once users start performing actions in the system.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                type="number" 
                stroke="#9CA3AF" 
                domain={[0, 'dataMax']}
                tickFormatter={(value) => value.toString()}
              />
              <YAxis dataKey="user" type="category" width={80} stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  color: '#1f2937'
                }}
                formatter={(value: any, name: string) => [value, 'Actions']}
                labelFormatter={(label) => `User: ${label}`}
              />
              <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {stats.recent_activity.slice(0, 10).map((activity) => (
                <tr key={activity._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {activity.user_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: getActionColor(activity.action) }}
                    >
                      {activity.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {activity.resource_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(activity.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Security Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">Login Events</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-400">
                  {stats.actions_by_type.LOGIN || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Data Changes</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-400">
                  {(stats.actions_by_type.CREATE || 0) + (stats.actions_by_type.UPDATE || 0) + (stats.actions_by_type.DELETE || 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Export/Import</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-400">
                  {(stats.actions_by_type.EXPORT || 0) + (stats.actions_by_type.IMPORT || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
