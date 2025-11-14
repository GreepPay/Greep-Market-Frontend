import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { Notification } from '../components/ui/NotificationDropdown';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
  toggleExpand: (id: string) => void;
  unreadCount: number;
  loadNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [notification, ...prev]);

    // Auto-remove success notifications after 5 seconds
    if (notificationData.type === 'success') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, expanded: !notification.expanded }
          : notification
      )
    );
  }, []);

  // Load notifications from backend
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    setIsLoading(true);
    try {
      const response = await apiService.getNotifications({ limit: 50 });
      const backendNotifications: Notification[] = response.notifications.map((notif: any) => ({
        id: notif._id,
        type: notif.type,
        priority: notif.priority,
        title: notif.title,
        message: notif.message,
        timestamp: new Date(notif.created_at),
        read: notif.read || notif.is_read || false, // Handle both 'read' and 'is_read' fields
        data: notif.data,
      }));
      
      setNotifications(backendNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Refresh notifications (for real-time updates)
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const response = await apiService.getNotifications({ limit: 50 });
      
      const backendNotifications: Notification[] = response.notifications.map((notif: any) => ({
        id: notif._id,
        type: notif.type,
        priority: notif.priority,
        title: notif.title,
        message: notif.message,
        timestamp: new Date(notif.created_at),
        read: notif.read || notif.is_read || false, // Handle both 'read' and 'is_read' fields
        data: notif.data,
      }));
      
      setNotifications(backendNotifications);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  }, [isAuthenticated, user]);

  // Enhanced mark as read with backend sync
  const markAsRead = useCallback(async (id: string) => {
    // Optimistically update UI
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );

    // Sync with backend
    try {
      const response = await apiService.markNotificationAsRead(id);
      
      // Refresh notifications to ensure UI is in sync with backend
      await refreshNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: false }
            : notification
        )
      );
    }
  }, [refreshNotifications]);

  // Enhanced mark all as read with backend sync
  const markAllAsRead = useCallback(async () => {
    // Optimistically update UI
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );

    // Sync with backend
    try {
      const response = await apiService.markAllNotificationsAsRead();
      
      // Refresh notifications to ensure UI is in sync with backend
      await refreshNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: false }))
      );
    }
  }, [refreshNotifications]);

  // Start polling for new notifications
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      refreshNotifications();
    }, 30000); // Poll every 30 seconds
  }, [refreshNotifications]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Load notifications on mount and start polling
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
      startPolling();
    } else {
      stopPolling();
      setNotifications([]);
    }

    return () => {
      stopPolling();
    };
  }, [isAuthenticated, user, loadNotifications, startPolling, stopPolling]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    toggleExpand,
    unreadCount,
    loadNotifications,
    refreshNotifications,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
