import React from 'react';
import { Bell, X, AlertTriangle, Package, ShoppingCart, TrendingUp, CheckCircle, Trophy, Target, Calendar, Star } from 'lucide-react';
import { GlassmorphismIcon } from './GlassmorphismIcon';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'MILESTONE' | 'DAILY_SUMMARY' | 'ACHIEVEMENT' | 'GOAL_REMINDER';
  priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
  expanded?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onToggleExpand: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onToggleExpand,
  isOpen,
  onClose,
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

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
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return 'orange';
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'MILESTONE':
        return 'purple';
      case 'DAILY_SUMMARY':
        return 'blue';
      case 'ACHIEVEMENT':
        return 'yellow';
      case 'GOAL_REMINDER':
        return 'green';
      default:
        return 'blue';
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
    <div className="absolute right-0 mt-2 w-96 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl border border-white/20 dark:border-gray-700/50 z-50 transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-gray-700/50">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500/80 backdrop-blur-sm text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border border-red-400/30 shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {unreadCount > 0 && (
            <button
              onClick={() => {
                onMarkAllAsRead();
              }}
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 px-2 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            title="Close notifications"
            aria-label="Close notifications"
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs mt-1">You'll see important updates here</p>
          </div>
        ) : (
          <div className="p-2">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const color = getNotificationColor(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg mb-2 transition-all duration-200 cursor-pointer hover:bg-white/20 dark:hover:bg-gray-700/50 ${
                    !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-400' : ''
                  } ${
                    notification.priority === 'URGENT' ? 'ring-2 ring-red-400/50 bg-red-50/30 dark:bg-red-900/10' :
                    notification.priority === 'HIGH' ? 'ring-1 ring-orange-400/50 bg-orange-50/20 dark:bg-orange-900/10' : ''
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      onMarkAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <GlassmorphismIcon
                        icon={Icon}
                        size="sm"
                        variant={color as any}
                        className="mt-0.5"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            !notification.read 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </p>
                          <p className={`text-xs text-gray-600 dark:text-gray-400 mt-1 ${
                            notification.expanded ? '' : 'line-clamp-2'
                          }`}>
                            {notification.message}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleExpand(notification.id);
                            }}
                            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mt-1 font-medium"
                          >
                            {notification.expanded ? 'Show less' : 'Show more'}
                          </button>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                      {notification.action && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            notification.action?.onClick();
                          }}
                          className="mt-2 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                        >
                          {notification.action.label} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-white/20 dark:border-gray-700/50 p-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onClearAll}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-200"
            >
              Clear all
            </button>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
