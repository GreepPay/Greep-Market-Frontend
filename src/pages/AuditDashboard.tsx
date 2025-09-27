import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Filter,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { AuditLogs } from '../components/ui/AuditLogs';
import { BackButton } from '../components/ui/BackButton';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import toast from 'react-hot-toast';

interface AuditStats {
  totalLogs: number;
  logsByAction: { [key: string]: number };
  logsByResourceType: { [key: string]: number };
  recentActivity: any[];
}

export const AuditDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'logs' | 'analytics'>('overview');

  const loadAuditStats = useCallback(async () => {
    try {
      setLoading(true);
      const statsData = await apiService.getAuditStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load audit stats:', error);
      toast.error('Failed to load audit statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditStats();
  }, [loadAuditStats]);

  const actionIcons: { [key: string]: React.ReactNode } = {
    CREATE: <CheckCircle className="h-5 w-5 text-green-600" />,
    UPDATE: <Activity className="h-5 w-5 text-blue-600" />,
    DELETE: <XCircle className="h-5 w-5 text-red-600" />,
    LOGIN: <CheckCircle className="h-5 w-5 text-green-600" />,
    LOGOUT: <Clock className="h-5 w-5 text-gray-600" />,
    EXPORT: <Download className="h-5 w-5 text-purple-600" />,
    IMPORT: <Activity className="h-5 w-5 text-orange-600" />,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Logs</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalLogs || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.recentActivity ? 
                  new Set(stats.recentActivity.map(activity => activity.user_id)).size : 0
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Actions Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.recentActivity?.filter(activity => {
                  const today = new Date();
                  const activityDate = new Date(activity.created_at);
                  return activityDate.toDateString() === today.toDateString();
                }).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delete Actions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.logsByAction?.DELETE || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Actions Breakdown</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats?.logsByAction && Object.entries(stats.logsByAction).map(([action, count]) => (
              <div key={action} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {actionIcons[action] || <Activity className="h-4 w-4 text-gray-600" />}
                  <span className="text-sm font-medium text-gray-700">{action}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(count / Math.max(...Object.values(stats.logsByAction))) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Types */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Resource Types</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats?.logsByResourceType && Object.entries(stats.logsByResourceType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">{type}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(count / Math.max(...Object.values(stats.logsByResourceType))) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button
              onClick={() => setActiveView('logs')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All Logs
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {stats?.recentActivity?.slice(0, 10).map((activity, index) => (
            <div key={index} className="p-4 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {actionIcons[activity.action] || <Activity className="h-4 w-4 text-gray-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {activity.user_email}
                    </span>
                    <span className="text-sm text-gray-500">
                      {activity.action.toLowerCase()} {activity.resource_name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(activity.created_at)}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {activity.resource_type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Analytics</h3>
        <p className="text-gray-600">Advanced analytics and reporting features coming soon...</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading audit dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <BackButton />
          <Breadcrumb />
        </div>
      </div>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Dashboard</h1>
          <p className="text-gray-600">Monitor system activities and user actions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeView === 'overview'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('logs')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeView === 'logs'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Logs
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeView === 'analytics'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'overview' && renderOverview()}
      {activeView === 'logs' && <AuditLogs />}
      {activeView === 'analytics' && renderAnalytics()}
    </div>
  );
};
