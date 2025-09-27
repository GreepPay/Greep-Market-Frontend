import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { notificationManager } from '../../utils/notificationUtils';

interface NotificationPermissionBannerProps {
  onDismiss?: () => void;
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
  onDismiss
}) => {
  const [showBanner, setShowBanner] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check if notifications are supported and permission status
    if (notificationManager.isSupported()) {
      const permission = notificationManager.getPermissionStatus();
      if (permission === 'default') {
        setShowBanner(true);
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await notificationManager.requestPermission();
      if (granted) {
        setShowBanner(false);
        onDismiss?.();
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    onDismiss?.();
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Enable Goal Achievement Notifications
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Get notified with sound when you reach your daily or monthly sales goals
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <Bell className="h-4 w-4" />
            <span>{isRequesting ? 'Requesting...' : 'Enable'}</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};


