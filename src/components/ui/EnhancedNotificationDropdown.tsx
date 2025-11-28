import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Trophy, 
  Target, 
  Calendar, 
  Star,
  RefreshCw,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { ScrollArea } from './scroll-area';
import { Badge } from './badge';
import { cn } from '../../lib/utils';
import { Notification } from './NotificationDropdown';

interface EnhancedNotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onToggleExpand: (id: string) => void;
  onRefresh: () => void;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export const EnhancedNotificationDropdown: React.FC<EnhancedNotificationDropdownProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onToggleExpand,
  onRefresh,
  isOpen,
  onClose,
  isLoading = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.read);
  }, [notifications, filter]);

  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {};
    const now = new Date();
    
    filteredNotifications.forEach(notification => {
      const diff = now.getTime() - notification.timestamp.getTime();
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      let groupKey: string;
      if (hours < 1) groupKey = 'Just now';
      else if (hours < 24) groupKey = 'Today';
      else if (days === 1) groupKey = 'Yesterday';
      else if (days < 7) groupKey = 'This week';
      else if (days < 30) groupKey = 'This month';
      else groupKey = 'Older';
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(notification);
    });
    
    return groups;
  }, [filteredNotifications]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'success':
        return CheckCircle;
      case 'error':
        return AlertTriangle;
      case 'MILESTONE':
        return Trophy;
      case 'DAILY_SUMMARY':
        return Calendar;
      case 'ACHIEVEMENT':
        return Star;
      case 'GOAL_REMINDER':
        return Target;
      case 'info':
      default:
        return Bell;
    }
  };

  const getNotificationVariant = (type: Notification['type'], priority?: string) => {
    if (priority === 'URGENT') return 'destructive';
    if (type === 'error') return 'destructive';
    if (type === 'success') return 'default';
    return 'default';
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return 'text-orange-600 dark:text-orange-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'MILESTONE':
        return 'text-purple-600 dark:text-purple-400';
      case 'DAILY_SUMMARY':
        return 'text-blue-600 dark:text-blue-400';
      case 'ACHIEVEMENT':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'GOAL_REMINDER':
        return 'text-emerald-600 dark:text-emerald-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-[420px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[60] overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold border-2 border-white dark:border-gray-800">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {unreadCount} unread • {notifications.length} total
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Refresh notifications"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-md transition-all duration-200 flex items-center justify-center",
            filter === 'all'
              ? "bg-primary-500 text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-1.5",
            filter === 'unread'
              ? "bg-primary-500 text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className={cn(
              "text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold",
              filter === 'unread' 
                ? "bg-white/20 text-white" 
                : "bg-red-500 text-white"
            )}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('read')}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-md transition-all duration-200 flex items-center justify-center",
            filter === 'read'
              ? "bg-primary-500 text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          Read
        </button>
      </div>

      {/* Actions Bar */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          {unreadCount > 0 ? (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all read</span>
            </button>
          ) : (
            <div></div>
          )}
          <button
            onClick={onClearAll}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear all</span>
          </button>
        </div>
      )}

      {/* Notifications List */}
      <ScrollArea className="h-[500px]">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {filter === 'unread' ? 'No unread notifications' : 
               filter === 'read' ? 'No read notifications' : 
               'No notifications yet'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {filter === 'all' ? "You'll see important updates here" : "Try changing the filter"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {Object.entries(groupedNotifications).map(([groupName, groupNotifications]) => (
              <div key={groupName} className="mb-4">
                <div className="px-2 py-1 mb-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {groupName}
                  </span>
                </div>
                {groupNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const iconColor = getNotificationColor(notification.type);
                  
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "mb-3 cursor-pointer transition-all duration-200 rounded-lg border p-3 hover:shadow-md",
                        !notification.read 
                          ? "border-l-4 border-l-primary-500 bg-primary-50/50 dark:bg-primary-900/20 border-r border-t border-b border-gray-200 dark:border-gray-700" 
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                        notification.priority === 'URGENT' && "ring-2 ring-red-400/50 bg-red-50/30 dark:bg-red-900/10",
                        notification.priority === 'HIGH' && "ring-1 ring-orange-400/50 bg-orange-50/20 dark:bg-orange-900/10"
                      )}
                      onClick={() => {
                        if (!notification.read) {
                          onMarkAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "flex-shrink-0 mt-0.5 p-1.5 rounded-lg",
                          iconColor.includes('green') && "bg-green-100 dark:bg-green-900/30",
                          iconColor.includes('blue') && "bg-blue-100 dark:bg-blue-900/30",
                          iconColor.includes('purple') && "bg-purple-100 dark:bg-purple-900/30",
                          iconColor.includes('yellow') && "bg-yellow-100 dark:bg-yellow-900/30",
                          iconColor.includes('orange') && "bg-orange-100 dark:bg-orange-900/30",
                          iconColor.includes('red') && "bg-red-100 dark:bg-red-900/30",
                          !iconColor.includes('green') && !iconColor.includes('blue') && !iconColor.includes('purple') && !iconColor.includes('yellow') && !iconColor.includes('orange') && !iconColor.includes('red') && "bg-gray-100 dark:bg-gray-700"
                        )}>
                          <Icon className={cn("h-4 w-4", iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={cn(
                              "text-sm font-semibold leading-tight",
                              !notification.read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                            )}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {notification.priority && (
                                <Badge 
                                  variant={notification.priority === 'URGENT' ? 'destructive' : 'secondary'}
                                  className="text-[10px] px-2 py-0.5 font-semibold uppercase"
                                >
                                  {notification.priority.toLowerCase()}
                                </Badge>
                              )}
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                          </div>
                          <p className={cn(
                            "text-xs leading-relaxed text-gray-600 dark:text-gray-400 mb-2",
                            notification.expanded ? "" : "line-clamp-2"
                          )}>
                            {notification.message}
                          </p>
                          {notification.message.length > 100 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpand(notification.id);
                              }}
                              className="mb-2 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                            >
                              {notification.expanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            {notification.action && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  notification.action?.onClick();
                                }}
                                className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                              >
                                {notification.action.label} →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </span>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              <span className="font-medium">Refresh</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

