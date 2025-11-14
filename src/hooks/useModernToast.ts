// Hook for easy access to modern notification system
import { useCallback } from 'react';
import { modernToast } from '../components/ui/ModernToastProvider';
import { ModernNotificationOptions } from '../utils/modernNotificationSystem';

export const useModernToast = () => {
  const showSuccess = useCallback((title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    return modernToast.success(title, message, options);
  }, []);

  const showError = useCallback((title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    return modernToast.error(title, message, options);
  }, []);

  const showWarning = useCallback((title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    return modernToast.warning(title, message, options);
  }, []);

  const showInfo = useCallback((title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    return modernToast.info(title, message, options);
  }, []);

  const showAchievement = useCallback((title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    return modernToast.achievement(title, message, options);
  }, []);

  const showMilestone = useCallback((title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    return modernToast.milestone(title, message, options);
  }, []);

  const showUrgent = useCallback((title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    return modernToast.urgent(title, message, options);
  }, []);

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    achievement: showAchievement,
    milestone: showMilestone,
    urgent: showUrgent,
  };
};

