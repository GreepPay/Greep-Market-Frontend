import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Download, 
  Filter, 
  Calendar,
  User,
  Activity,
  FileText,
  RefreshCw
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { apiService } from '../../services/api';

interface AuditLog {
  _id: string;
  user_id: string;
  user_email: string;
  user_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  resource_name: string;
  changes?: Array<{
    field: string;
    old_value: any;
    new_value: any;
  }>;
  metadata?: {
    ip_address?: string;
    user_agent?: string;
    store_id?: string;
    additional_info?: any;
  };
  created_at: string;
}

interface AuditLogsProps {
  storeId?: string;
  currentUserRole?: string;
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ storeId, currentUserRole }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    user_id: '',
    resource_type: '',
    action: '',
    start_date: '',
    end_date: '',
  });
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      // Add role filter for managers
      if (currentUserRole === 'manager') {
        queryParams.append('user_role', 'manager,cashier');
      }

      const response = await apiService.request<{
        logs: AuditLog[];
        total: number;
        pages: number;
      }>(`/audit/logs?${queryParams}`);
      
      setLogs(response.data.logs);
      setTotalLogs(response.data.total);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await apiService.rawRequest(`/audit/logs/export?${queryParams}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to export audit logs');
      }

      // Create blob from response data
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      alert('Failed to export audit logs');
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'text-green-600 bg-green-100';
      case 'UPDATE': return 'text-blue-600 bg-blue-100';
      case 'DELETE': return 'text-red-600 bg-red-100';
      case 'LOGIN': return 'text-purple-600 bg-purple-100';
      case 'LOGOUT': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'PRODUCT': return '📦';
      case 'TRANSACTION': return '💳';
      case 'EXPENSE': return '💰';
      case 'USER': return '👤';
      case 'INVENTORY': return '📊';
      case 'GOAL': return '🎯';
      default: return '📄';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading audit logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <FileText className="h-12 w-12 mx-auto mb-4" />
          <p>{error}</p>
          <Button onClick={loadAuditLogs} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track all user activities and system changes
          </p>
          </div>
        <div className="flex gap-2">
          <Button
              onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            onClick={handleExport}
            variant="primary"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User Email
              </label>
              <input
                type="text"
                value={filters.user_id}
                onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                placeholder="Filter by user email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resource Type
              </label>
              <select
                value={filters.resource_type}
                onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                aria-label="Filter by resource type"
              >
                <option value="">All Types</option>
                <option value="PRODUCT">Product</option>
                <option value="TRANSACTION">Transaction</option>
                <option value="EXPENSE">Expense</option>
                <option value="USER">User</option>
                <option value="INVENTORY">Inventory</option>
                <option value="GOAL">Goal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Action
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                aria-label="Filter by action type"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="EXPORT">Export</option>
                <option value="IMPORT">Import</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                aria-label="Filter by start date"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => setFilters({
                page: 1,
                limit: 50,
                user_id: '',
                resource_type: '',
                action: '',
                start_date: '',
                end_date: '',
              })}
              variant="outline"
              size="sm"
            >
              Clear Filters
            </Button>
            <Button onClick={loadAuditLogs} variant="primary" size="sm">
              Apply Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalLogs}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actions Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {logs.filter(log => 
                  new Date(log.created_at).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
            <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(logs.map(log => log.user_email)).size}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Week</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {logs.filter(log => {
                  const logDate = new Date(log.created_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return logDate >= weekAgo;
                }).length}
              </p>
          </div>
        </div>
        </Card>
                </div>
                
      {/* Audit Logs Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </div>
                  </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.user_email}
                  </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {log.user_role}
                    </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">
                        {getResourceIcon(log.resource_type)}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.resource_name}
                </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {log.resource_type}
              </div>
            </div>
          </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.metadata?.ip_address || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      onClick={() => setSelectedLog(log)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((filters.page - 1) * filters.limit) + 1} to{' '}
              {Math.min(filters.page * filters.limit, totalLogs)} of {totalLogs} results
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                Page {filters.page} of {totalPages}
              </span>
              <Button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-50 flex items-center justify-center py-8 px-4">
          <div className="relative border border-gray-200 dark:border-gray-700 w-11/12 md:w-3/4 lg:w-1/2 shadow-2xl rounded-2xl bg-white dark:bg-gray-800 transition-colors duration-300 p-5 max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Audit Log Details
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
              </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Action</label>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedLog.action}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resource Type</label>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedLog.resource_type}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedLog.user_email} ({selectedLog.user_role})</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resource</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedLog.resource_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Timestamp</label>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedLog.created_at)}</p>
                </div>
                
                {selectedLog.metadata && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">IP Address</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedLog.metadata.ip_address || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Store ID</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedLog.metadata.store_id || '-'}</p>
                    </div>
                  </div>
                )}
                
                {selectedLog.changes && selectedLog.changes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Detailed Changes</label>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      {selectedLog.changes.map((change, index) => (
                        <div key={index} className="mb-4 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <div className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                            {change.field}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                              <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Previous Value:</div>
                              <div className="text-sm text-red-600 dark:text-red-400 break-all">
                                {typeof change.old_value === 'object' 
                                  ? JSON.stringify(change.old_value, null, 2)
                                  : String(change.old_value || 'null')
                                }
                              </div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                              <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">New Value:</div>
                              <div className="text-sm text-green-600 dark:text-green-400 break-all">
                                {typeof change.new_value === 'object' 
                                  ? JSON.stringify(change.new_value, null, 2)
                                  : String(change.new_value || 'null')
                                }
                              </div>
                          </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Transaction Details from additional_info */}
                {selectedLog.resource_type === 'TRANSACTION' && selectedLog.metadata?.additional_info && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Detailed Transaction Information</label>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-sm text-blue-800 dark:text-blue-300">
                        {selectedLog.action === 'CREATE' && (
                          <div>
                            <div className="font-medium mb-3 text-lg">🛒 New Transaction Created</div>
                            
                            {/* Transaction Summary */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                                <div className="font-medium text-green-600 dark:text-green-400">Total Amount</div>
                                <div className="text-lg font-bold">${selectedLog.metadata.additional_info.total_amount?.toFixed(2) || '0.00'}</div>
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                                <div className="font-medium text-blue-600 dark:text-blue-400">Payment Method</div>
                                <div className="text-lg font-bold capitalize">{selectedLog.metadata.additional_info.payment_method || 'N/A'}</div>
                              </div>
                            </div>

                            {/* Items Purchased */}
                            {selectedLog.metadata.additional_info.items && selectedLog.metadata.additional_info.items.length > 0 && (
                              <div className="mb-4">
                                <div className="font-medium mb-2">📦 Items Purchased ({selectedLog.metadata.additional_info.item_count} items):</div>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded border max-h-48 overflow-y-auto">
                                  <div className="space-y-2">
                                    {selectedLog.metadata.additional_info.items.map((item: any, index: number) => (
                                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                        <div className="flex-1">
                                          <div className="font-medium text-sm">{item.product_name}</div>
                                          <div className="text-xs text-gray-600 dark:text-gray-400">
                                            Product ID: {item.product_id}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="font-medium">Qty: {item.quantity}</div>
                                          <div className="text-xs text-gray-600 dark:text-gray-400">
                                            ${item.unit_price?.toFixed(2)} each
                                          </div>
                                          <div className="font-bold text-green-600 dark:text-green-400">
                                            ${item.total_price?.toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Transaction Details */}
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                                <div className="font-medium">Subtotal</div>
                                <div>${selectedLog.metadata.additional_info.subtotal?.toFixed(2) || '0.00'}</div>
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                                <div className="font-medium">Discount</div>
                                <div>${selectedLog.metadata.additional_info.discount_amount?.toFixed(2) || '0.00'}</div>
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                                <div className="font-medium">Status</div>
                                <div className="capitalize">{selectedLog.metadata.additional_info.status || 'N/A'}</div>
                              </div>
                            </div>

                            {/* Additional Info */}
                            {(selectedLog.metadata.additional_info.cashier_id || selectedLog.metadata.additional_info.customer_id || selectedLog.metadata.additional_info.notes) && (
                              <div className="mt-4 text-xs">
                                {selectedLog.metadata.additional_info.cashier_id && (
                                  <div className="mb-1">
                                    <span className="font-medium">Cashier ID:</span> {selectedLog.metadata.additional_info.cashier_id}
                                  </div>
                                )}
                                {selectedLog.metadata.additional_info.customer_id && (
                                  <div className="mb-1">
                                    <span className="font-medium">Customer ID:</span> {selectedLog.metadata.additional_info.customer_id}
                                  </div>
                                )}
                                {selectedLog.metadata.additional_info.notes && (
                                  <div className="mb-1">
                                    <span className="font-medium">Notes:</span> {selectedLog.metadata.additional_info.notes}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {selectedLog.action === 'UPDATE' && (
                          <div>
                            <div className="font-medium mb-3 text-lg">🔄 Transaction Updated</div>
                            
                            {/* Update Summary */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                                <div className="font-medium text-blue-600 dark:text-blue-400">Total Amount</div>
                                <div className="text-lg font-bold">${selectedLog.metadata.additional_info.total_amount?.toFixed(2) || '0.00'}</div>
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                                <div className="font-medium text-green-600 dark:text-green-400">Payment Status</div>
                                <div className="text-lg font-bold capitalize">{selectedLog.metadata.additional_info.payment_status || 'N/A'}</div>
                              </div>
                            </div>

                            {/* Items Summary */}
                            {selectedLog.metadata.additional_info.items_summary && selectedLog.metadata.additional_info.items_summary.length > 0 && (
                              <div className="mb-4">
                                <div className="font-medium mb-2">📦 Items in Transaction ({selectedLog.metadata.additional_info.item_count} items):</div>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded border max-h-32 overflow-y-auto">
                                  <div className="space-y-1">
                                    {selectedLog.metadata.additional_info.items_summary.map((item: any, index: number) => (
                                      <div key={index} className="flex justify-between items-center p-1 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                                        <span>{item.product_name}</span>
                                        <span>Qty: {item.quantity} - ${item.total_price?.toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Update Details */}
                            <div className="text-xs">
                              {selectedLog.metadata.additional_info.completed_by && (
                                <div className="mb-1">
                                  <span className="font-medium">Completed by:</span> {selectedLog.metadata.additional_info.completed_by}
                                </div>
                              )}
                              {selectedLog.metadata.additional_info.completion_reason && (
                                <div className="mb-1">
                                  <span className="font-medium">Reason:</span> {selectedLog.metadata.additional_info.completion_reason}
                                </div>
                              )}
                              {selectedLog.metadata.additional_info.cancellation_reason && (
                                <div className="mb-1">
                                  <span className="font-medium">Cancellation Reason:</span> {selectedLog.metadata.additional_info.cancellation_reason}
                                </div>
                              )}
                              {selectedLog.metadata.additional_info.refund_status && (
                                <div className="mb-1">
                                  <span className="font-medium">Refund Status:</span> {selectedLog.metadata.additional_info.refund_status}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Legacy Transaction Details (fallback) */}
                {selectedLog.resource_type === 'TRANSACTION' && selectedLog.changes && selectedLog.changes.length > 0 && !selectedLog.metadata?.additional_info && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transaction Details</label>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-sm text-green-800 dark:text-green-300">
                        {selectedLog.action === 'CREATE' && (
                          <div>
                            <div className="font-medium mb-2">New Transaction Created</div>
                            <div className="space-y-1 text-xs">
                              {selectedLog.changes.map((change, index) => {
                                if (change.field === 'items' && Array.isArray(change.new_value)) {
                                  return (
                                    <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border">
                                      <div className="font-medium mb-1">Items Purchased:</div>
                                      <ul className="list-disc list-inside space-y-1">
                                        {change.new_value.map((item: any, itemIndex: number) => (
                                          <li key={itemIndex}>
                                            {item.product_name} - Qty: {item.quantity} - ₺{item.unit_price} each
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  );
                                }
                                if (change.field === 'total_amount') {
                                  return (
                                    <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border">
                                      <div className="font-medium">Total Amount: ₺{change.new_value}</div>
                                    </div>
                                  );
                                }
                                if (change.field === 'payment_method') {
                                  return (
                                    <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border">
                                      <div className="font-medium">Payment Method: {change.new_value}</div>
                                    </div>
                                  );
                                }
                                if (change.field === 'order_source') {
                                  return (
                                    <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border">
                                      <div className="font-medium">Order Source: {change.new_value}</div>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </div>
                        )}
                        {selectedLog.action === 'UPDATE' && (
                          <div>
                            <div className="font-medium mb-2">Transaction Updated</div>
                            <div className="space-y-1 text-xs">
                              {selectedLog.changes.map((change, index) => (
                                <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border">
                                  <div className="font-medium">{change.field}:</div>
                                  <div className="text-red-600 dark:text-red-400">From: {JSON.stringify(change.old_value)}</div>
                                  <div className="text-green-600 dark:text-green-400">To: {JSON.stringify(change.new_value)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Action Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Action Summary</label>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                      {selectedLog.action === 'CREATE' && (
                        <div>
                          <div className="font-medium mb-1">Created New {selectedLog.resource_type}</div>
                          <div>• Resource ID: <span className="font-mono text-xs">{selectedLog.resource_id}</span></div>
                          <div>• Resource Name: {selectedLog.resource_name}</div>
                          {selectedLog.changes && selectedLog.changes.length > 0 && (
                            <div className="mt-2">
                              <div className="font-medium">Initial Values:</div>
                              <ul className="list-disc list-inside text-xs mt-1">
                                {selectedLog.changes.map((change, index) => (
                                  <li key={index}>
                                    <span className="font-medium">{change.field}:</span> {JSON.stringify(change.new_value)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      {selectedLog.action === 'UPDATE' && (
                        <div>
                          <div className="font-medium mb-1">Updated {selectedLog.resource_type}</div>
                          <div>• Resource ID: <span className="font-mono text-xs">{selectedLog.resource_id}</span></div>
                          <div>• Resource Name: {selectedLog.resource_name}</div>
                          {selectedLog.changes && selectedLog.changes.length > 0 && (
                            <div className="mt-2">
                              <div className="font-medium">Fields Modified: {selectedLog.changes.length}</div>
                              <ul className="list-disc list-inside text-xs mt-1">
                                {selectedLog.changes.map((change, index) => (
                                  <li key={index}>
                                    <span className="font-medium">{change.field}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      {selectedLog.action === 'DELETE' && (
                        <div>
                          <div className="font-medium mb-1">Deleted {selectedLog.resource_type}</div>
                          <div>• Resource ID: <span className="font-mono text-xs">{selectedLog.resource_id}</span></div>
                          <div>• Resource Name: {selectedLog.resource_name}</div>
                        </div>
                      )}
                      {selectedLog.action === 'LOGIN' && (
                        <div>
                          <div className="font-medium mb-1">User Login</div>
                          <div>• User: {selectedLog.user_email}</div>
                          <div>• Role: {selectedLog.user_role}</div>
                        </div>
                      )}
                      {selectedLog.action === 'LOGOUT' && (
                        <div>
                          <div className="font-medium mb-1">User Logout</div>
                          <div>• User: {selectedLog.user_email}</div>
                          <div>• Role: {selectedLog.user_role}</div>
                        </div>
                      )}
                      {!['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'].includes(selectedLog.action) && (
                        <div>
                          <div className="font-medium mb-1">{selectedLog.action} Action</div>
                          <div>• Resource: {selectedLog.resource_name}</div>
                          <div>• Type: {selectedLog.resource_type}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};