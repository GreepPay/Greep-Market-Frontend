import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { Notification } from '../components/ui/NotificationDropdown';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';

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
  const clearedNotificationIdsRef = useRef<Set<string>>(new Set()); // Track cleared notification IDs to prevent them from reappearing
  
  // Load cleared notification IDs from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      try {
        const storedClearedIds = localStorage.getItem(`cleared_notifications_${user.id}`);
        if (storedClearedIds) {
          const idsArray = JSON.parse(storedClearedIds);
          clearedNotificationIdsRef.current = new Set(idsArray);
        }
      } catch (error) {
        console.error('Failed to load cleared notification IDs from localStorage:', error);
      }
    }
  }, [user?.id]);
  
  // Save cleared notification IDs to localStorage
  const saveClearedIdsToStorage = useCallback(() => {
    if (user?.id) {
      try {
        const idsArray = Array.from(clearedNotificationIdsRef.current);
        localStorage.setItem(`cleared_notifications_${user.id}`, JSON.stringify(idsArray));
        // Limit stored IDs to prevent localStorage from growing too large (keep last 1000)
        if (idsArray.length > 1000) {
          const recentIds = idsArray.slice(-1000);
          clearedNotificationIdsRef.current = new Set(recentIds);
          localStorage.setItem(`cleared_notifications_${user.id}`, JSON.stringify(recentIds));
        }
      } catch (error) {
        console.error('Failed to save cleared notification IDs to localStorage:', error);
      }
    }
  }, [user?.id]);

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
    // Mark all current notifications as cleared and remove them from UI
    setNotifications(prev => {
      // Store all notification IDs before clearing to prevent them from reappearing
      prev.forEach(notif => {
        clearedNotificationIdsRef.current.add(notif.id);
      });
      // Save to localStorage for persistence across page refreshes
      saveClearedIdsToStorage();
      return [];
    });
  }, [saveClearedIdsToStorage]);

  const removeNotification = useCallback((id: string) => {
    // Mark this notification as cleared
    clearedNotificationIdsRef.current.add(id);
    saveClearedIdsToStorage();
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, [saveClearedIdsToStorage]);

  const toggleExpand = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, expanded: !notification.expanded }
          : notification
      )
    );
  }, []);

  // Load notifications from backend with better error handling and data validation
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    setIsLoading(true);
    try {
      const response = await apiService.getNotifications({ limit: 50 });
      
      // Validate response structure
      if (!response || !response.notifications || !Array.isArray(response.notifications)) {
        console.warn('Invalid notifications response structure:', response);
        setNotifications([]);
        return;
      }
      
      // Map and validate each notification
      const backendNotifications: Notification[] = response.notifications
        .filter((notif: any) => {
          // Filter out invalid notifications
          if (!notif || !notif._id) return false;
          // Filter out cleared notifications
          if (clearedNotificationIdsRef.current.has(notif._id)) return false;
          return true;
        })
        .map((notif: any) => {
          // Ensure timestamp is valid
          let timestamp: Date;
          try {
            timestamp = notif.created_at ? new Date(notif.created_at) : new Date();
            if (isNaN(timestamp.getTime())) {
              timestamp = new Date();
            }
          } catch {
            timestamp = new Date();
          }
          
          // Check for read status in multiple possible field names with comprehensive logging
          const isRead = notif.read === true || 
                        notif.is_read === true || 
                        notif.read_status === true ||
                        notif.marked_as_read === true ||
                        (typeof notif.read === 'string' && notif.read.toLowerCase() === 'true') ||
                        false;
          
          // Debug logging for read status detection (can be removed later)
          if (process.env.NODE_ENV === 'development' && notif._id) {
            console.log(`[Notification ${notif._id}] Read status check:`, {
              read: notif.read,
              is_read: notif.is_read,
              read_status: notif.read_status,
              marked_as_read: notif.marked_as_read,
              finalIsRead: isRead
            });
          }
          
          return {
            id: notif._id || Date.now().toString(),
            type: notif.type || 'info',
            priority: notif.priority || 'MEDIUM',
            title: notif.title || 'Notification',
            message: notif.message || '',
            timestamp,
            read: isRead,
            data: notif.data || {},
          };
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by newest first
      
      // Filter out cleared notifications - they should never reappear
      // This allows new notifications to come through while preventing cleared ones from showing
      setNotifications(backendNotifications);
    } catch (error: any) {
      // Don't log or show errors for missing tokens when not authenticated - this is expected
      if (error?.message?.includes('token is missing') || 
          error?.message?.includes('Authentication token is missing') ||
          error?.isLoginPageError) {
        // Silently ignore - this is expected when not logged in
        return;
      }
      console.error('Failed to load notifications:', error);
      // Don't clear existing notifications on error, just log it
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Refresh notifications (for real-time updates) with better data validation
  const refreshNotifications = useCallback(async (preserveOptimisticReads: boolean = false) => {
    if (!isAuthenticated || !user) return;
    
    try {
      const response = await apiService.getNotifications({ limit: 50 });
      
      // Validate response structure
      if (!response || !response.notifications || !Array.isArray(response.notifications)) {
        console.warn('Invalid notifications response during refresh:', response);
        return; // Don't update if response is invalid
      }
      
      // If preserving optimistic reads, get current read states before updating
      const currentReadStates = preserveOptimisticReads 
        ? new Map(notifications.map(n => [n.id, n.read]))
        : null;
      
      // Map and validate each notification
      const backendNotifications: Notification[] = response.notifications
        .filter((notif: any) => {
          // Filter out invalid notifications
          if (!notif || !notif._id) return false;
          // Filter out cleared notifications
          if (clearedNotificationIdsRef.current.has(notif._id)) return false;
          return true;
        })
        .map((notif: any) => {
          // Ensure timestamp is valid
          let timestamp: Date;
          try {
            timestamp = notif.created_at ? new Date(notif.created_at) : new Date();
            if (isNaN(timestamp.getTime())) {
              timestamp = new Date();
            }
          } catch {
            timestamp = new Date();
          }
          
          // Check for read status in multiple possible field names
          let isRead = notif.read === true || 
                        notif.is_read === true || 
                        notif.read_status === true ||
                        notif.marked_as_read === true ||
                        (typeof notif.read === 'string' && notif.read.toLowerCase() === 'true') ||
                        false;
          
          // If preserving optimistic reads and this notification was marked as read in UI but backend says unread,
          // preserve the optimistic read state (backend might not have updated yet)
          if (preserveOptimisticReads && currentReadStates) {
            const optimisticRead = currentReadStates.get(notif._id);
            if (optimisticRead === true && !isRead) {
              // Keep the optimistic read state - backend might not have persisted yet
              isRead = true;
            }
          }
          
          return {
            id: notif._id || Date.now().toString(),
            type: notif.type || 'info',
            priority: notif.priority || 'MEDIUM',
            title: notif.title || 'Notification',
            message: notif.message || '',
            timestamp,
            read: isRead,
            data: notif.data || {},
          };
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by newest first
      
      // Always filter out cleared notifications - they're already filtered in the map above
      // This allows new notifications to come through while preventing cleared ones from reappearing
      setNotifications(backendNotifications);
    } catch (error: any) {
      // Don't log or show errors for missing tokens when not authenticated - this is expected
      if (error?.message?.includes('token is missing') || 
          error?.message?.includes('Authentication token is missing') ||
          error?.isLoginPageError) {
        // Silently ignore - this is expected when not logged in
        return;
      }
      console.error('Failed to refresh notifications:', error);
      // Don't clear notifications on error - keep existing ones
    }
  }, [isAuthenticated, user, notifications]);

  // Enhanced mark as read with backend sync
  const markAsRead = useCallback(async (id: string) => {
    // Optimistically update UI immediately
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );

    // Sync with backend in the background (fire and forget)
    // Don't refresh immediately - let the normal polling handle sync
    // This prevents overwriting optimistic updates with stale backend data
    apiService.markNotificationAsRead(id)
      .then(response => {
        if (process.env.NODE_ENV === 'development') {
          if (response && response.success) {
            console.log(`[Notifications] Successfully marked notification ${id} as read on backend`);
          } else {
            console.warn(`[Notifications] Backend did not confirm success for notification ${id}:`, response);
          }
        }
      })
      .catch(error => {
        console.error(`[Notifications] Failed to mark notification ${id} as read on backend:`, error);
        // Don't revert - keep optimistic update. The next polling cycle will sync with backend.
        // If backend persists the read status, it will show as read on next refresh.
        // If backend doesn't persist, user can mark as read again.
      });
  }, []);

  // Enhanced mark all as read with backend sync
  const markAllAsRead = useCallback(async () => {
    // Optimistically update UI immediately - mark all as read
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );

    // Sync with backend in the background (fire and forget)
    // Don't refresh immediately - let the normal polling handle sync
    apiService.markAllNotificationsAsRead()
      .then(response => {
        if (process.env.NODE_ENV === 'development') {
          if (response && response.success) {
            console.log('[Notifications] Successfully marked all notifications as read on backend');
          } else {
            console.warn('[Notifications] Backend did not confirm success for marking all as read:', response);
          }
        }
      })
      .catch(error => {
        console.error('[Notifications] Failed to mark all notifications as read on backend:', error);
        // Don't revert - keep optimistic update. The next polling cycle will sync with backend.
      });
  }, []);

  // Start polling for new notifications
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      refreshNotifications();
    }, 15000); // Poll every 15 seconds for better real-time updates
  }, [refreshNotifications]);
  
  // Store startPolling ref so clearAll can access it
  const startPollingRef = useRef(startPolling);
  useEffect(() => {
    startPollingRef.current = startPolling;
  }, [startPolling]);

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

  // Register notification service on mount
  useEffect(() => {
    notificationService.registerAddNotification(addNotification);
  }, [addNotification]);

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
