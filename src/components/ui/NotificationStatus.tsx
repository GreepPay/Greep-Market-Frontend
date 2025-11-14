import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { notificationManager } from '../../utils/notificationUtils';

export const NotificationStatus: React.FC = () => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (notificationManager.isSupported()) {
      setPermissionStatus(notificationManager.getPermissionStatus());
    }
  }, []);

  if (!notificationManager.isSupported()) {
    return null;
  }

  const getStatusColor = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'text-green-600 dark:text-green-400';
      case 'denied':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Notifications enabled';
      case 'denied':
        return 'Notifications blocked';
      default:
        return 'Notifications pending';
    }
  };

  const getIcon = () => {
    return permissionStatus === 'granted' ? Bell : BellOff;
  };

  const Icon = getIcon();

  return (
    <div className="flex items-center space-x-2 text-xs">
      <Icon className={`h-4 w-4 ${getStatusColor()}`} />
      <span className={`${getStatusColor()} font-medium`}>
        {getStatusText()}
      </span>
    </div>
  );
};

