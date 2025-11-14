import React, { useEffect, useState } from 'react';
import { Toaster, toast as hotToast } from 'react-hot-toast';
import { ModernToast } from './ModernToast';
import { ModernNotificationOptions } from '../../utils/modernNotificationSystem';

interface ToastNotification {
  id: string;
  type: ModernNotificationOptions['type'];
  title: string;
  message?: string;
  duration?: number;
  sound?: boolean;
  priority?: ModernNotificationOptions['priority'];
  action?: ModernNotificationOptions['action'];
  icon?: React.ReactNode;
  image?: string;
  position?: ModernNotificationOptions['position'];
}

export const ModernToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  useEffect(() => {
    // Listen for modern notification events
    const handleNotification = (event: CustomEvent) => {
      const { id, ...options } = event.detail;
      setNotifications(prev => [...prev, { id, ...options }]);
    };

    const handleDismiss = (event: CustomEvent) => {
      const { id } = event.detail;
      setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleDismissAll = () => {
      setNotifications([]);
    };

    window.addEventListener('modern-notification', handleNotification as EventListener);
    window.addEventListener('modern-notification-dismiss', handleDismiss as EventListener);
    window.addEventListener('modern-notification-dismiss-all', handleDismissAll);

    return () => {
      window.removeEventListener('modern-notification', handleNotification as EventListener);
      window.removeEventListener('modern-notification-dismiss', handleDismiss as EventListener);
      window.removeEventListener('modern-notification-dismiss-all', handleDismissAll);
    };
  }, []);

  // Enhanced react-hot-toast with modern styling
  useEffect(() => {
    // Override default toast styles with dark mode support
    const style = document.createElement('style');
    style.textContent = `
      .modern-toast-override {
        background: transparent !important;
        box-shadow: none !important;
        padding: 0 !important;
        border: none !important;
      }
      
      /* Enhanced toast styling for dark mode */
      [data-theme="dark"] .react-hot-toast,
      .dark .react-hot-toast {
        background: rgba(31, 41, 55, 0.95) !important;
        backdrop-filter: blur(12px) !important;
        border: 1px solid rgba(75, 85, 99, 0.5) !important;
        color: #f3f4f6 !important;
      }
      
      [data-theme="dark"] .react-hot-toast-success,
      .dark .react-hot-toast-success {
        background: rgba(16, 185, 129, 0.2) !important;
        border-color: rgba(16, 185, 129, 0.4) !important;
        color: #d1fae5 !important;
      }
      
      [data-theme="dark"] .react-hot-toast-error,
      .dark .react-hot-toast-error {
        background: rgba(239, 68, 68, 0.2) !important;
        border-color: rgba(239, 68, 68, 0.4) !important;
        color: #fee2e2 !important;
      }
      
      [data-theme="dark"] .react-hot-toast-loading,
      .dark .react-hot-toast-loading {
        background: rgba(59, 130, 246, 0.2) !important;
        border-color: rgba(59, 130, 246, 0.4) !important;
        color: #dbeafe !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const handleClose = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      {children}
      
      {/* Modern Toast Container */}
      <div className="fixed z-[9999] pointer-events-none" style={{ top: '20px', right: '20px' }}>
        <div className="flex flex-col items-end gap-3">
          {notifications.map(notification => (
            <div key={notification.id} className="pointer-events-auto">
              <ModernToast
                notification={notification}
                onClose={() => handleClose(notification.id)}
                position={notification.position || 'top-right'}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced react-hot-toast with custom styling for dark mode */}
      <Toaster
        position="top-right"
        containerClassName="modern-toast-override"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
            border: 'none',
          },
          className: 'modern-toast-override',
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              background: 'rgba(16, 185, 129, 0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#065f46',
            },
            className: 'dark:bg-emerald-500/20 dark:border-emerald-400/40 dark:text-emerald-200',
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            duration: 6000,
            style: {
              background: 'rgba(239, 68, 68, 0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#991b1b',
            },
            className: 'dark:bg-red-500/20 dark:border-red-400/40 dark:text-red-200',
          },
          loading: {
            style: {
              background: 'rgba(59, 130, 246, 0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#1e3a8a',
            },
            className: 'dark:bg-blue-500/20 dark:border-blue-400/40 dark:text-blue-200',
          },
        }}
      />
    </>
  );
};

// Enhanced toast functions that use modern notifications
export const modernToast = {
  success: (title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    const { notify } = require('../../utils/modernNotificationSystem');
    return notify.success(title, message, options);
  },
  error: (title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    const { notify } = require('../../utils/modernNotificationSystem');
    return notify.error(title, message, options);
  },
  warning: (title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    const { notify } = require('../../utils/modernNotificationSystem');
    return notify.warning(title, message, options);
  },
  info: (title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    const { notify } = require('../../utils/modernNotificationSystem');
    return notify.info(title, message, options);
  },
  achievement: (title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    const { notify } = require('../../utils/modernNotificationSystem');
    return notify.achievement(title, message, options);
  },
  milestone: (title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    const { notify } = require('../../utils/modernNotificationSystem');
    return notify.milestone(title, message, options);
  },
  urgent: (title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    const { notify } = require('../../utils/modernNotificationSystem');
    return notify.urgent(title, message, options);
  },
  // Fallback to react-hot-toast for compatibility
  promise: hotToast.promise,
  loading: hotToast.loading,
  custom: hotToast.custom,
};

// Make it available globally for easy access
if (typeof window !== 'undefined') {
  (window as any).modernToast = modernToast;
}

