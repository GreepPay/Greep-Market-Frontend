import React, { useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Sparkles,
  Zap,
  Bell,
  Trophy,
  Target
} from 'lucide-react';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'milestone';
  title: string;
  message?: string;
  duration?: number;
  sound?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  image?: string;
}

interface ModernToastProps {
  notification: ToastNotification;
  onClose: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const getIcon = (type: ToastNotification['type']) => {
  switch (type) {
    case 'success':
      return CheckCircle2;
    case 'error':
      return XCircle;
    case 'warning':
      return AlertTriangle;
    case 'achievement':
      return Trophy;
    case 'milestone':
      return Target;
    default:
      return Info;
  }
};

const getColorClasses = (type: ToastNotification['type'], priority?: string) => {
  const baseColors = {
    success: {
      bg: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 dark:from-emerald-500/30 dark:to-teal-500/30',
      border: 'border-emerald-400/50 dark:border-emerald-400/70',
      icon: 'text-emerald-500 dark:text-emerald-400',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)] dark:shadow-[0_0_25px_rgba(16,185,129,0.4)]',
      accent: 'bg-emerald-500/10 dark:bg-emerald-500/20'
    },
    error: {
      bg: 'bg-gradient-to-br from-red-500/20 to-rose-500/20 dark:from-red-500/30 dark:to-rose-500/30',
      border: 'border-red-400/50 dark:border-red-400/70',
      icon: 'text-red-500 dark:text-red-400',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)] dark:shadow-[0_0_25px_rgba(239,68,68,0.4)]',
      accent: 'bg-red-500/10 dark:bg-red-500/20'
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 dark:from-amber-500/30 dark:to-orange-500/30',
      border: 'border-amber-400/50 dark:border-amber-400/70',
      icon: 'text-amber-500 dark:text-amber-400',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)] dark:shadow-[0_0_25px_rgba(245,158,11,0.4)]',
      accent: 'bg-amber-500/10 dark:bg-amber-500/20'
    },
    achievement: {
      bg: 'bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-rose-500/20 dark:from-purple-500/30 dark:via-pink-500/30 dark:to-rose-500/30',
      border: 'border-purple-400/50 dark:border-purple-400/70',
      icon: 'text-purple-500 dark:text-purple-400',
      glow: 'shadow-[0_0_25px_rgba(168,85,247,0.4)] dark:shadow-[0_0_30px_rgba(168,85,247,0.5)]',
      accent: 'bg-purple-500/10 dark:bg-purple-500/20'
    },
    milestone: {
      bg: 'bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20 dark:from-blue-500/30 dark:via-cyan-500/30 dark:to-teal-500/30',
      border: 'border-blue-400/50 dark:border-blue-400/70',
      icon: 'text-blue-500 dark:text-blue-400',
      glow: 'shadow-[0_0_25px_rgba(59,130,246,0.4)] dark:shadow-[0_0_30px_rgba(59,130,246,0.5)]',
      accent: 'bg-blue-500/10 dark:bg-blue-500/20'
    },
    info: {
      bg: 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-500/30 dark:to-indigo-500/30',
      border: 'border-blue-400/50 dark:border-blue-400/70',
      icon: 'text-blue-500 dark:text-blue-400',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)] dark:shadow-[0_0_25px_rgba(59,130,246,0.4)]',
      accent: 'bg-blue-500/10 dark:bg-blue-500/20'
    }
  };

  const colors = baseColors[type];
  
  if (priority === 'urgent') {
    return {
      ...colors,
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.6)] dark:shadow-[0_0_40px_rgba(239,68,68,0.7)] animate-pulse',
      border: 'border-red-500 dark:border-red-400',
    };
  }
  
  return colors;
};

export const ModernToast: React.FC<ModernToastProps> = ({
  notification,
  onClose,
  position = 'top-right'
}) => {
  const toastRef = useRef<HTMLDivElement>(null);
  const Icon = getIcon(notification.type);
  const colors = getColorClasses(notification.type, notification.priority);
  const isUrgent = notification.priority === 'urgent';

  useEffect(() => {
    // Entrance animation
    if (toastRef.current) {
      toastRef.current.style.animation = 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    }

    // Haptic feedback for urgent notifications
    if (isUrgent && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    // Auto-close
    if (notification.duration !== 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, isUrgent]);

  const handleClose = () => {
    if (toastRef.current) {
      toastRef.current.style.animation = 'slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      onClose();
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .shimmer {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
      <div
        ref={toastRef}
        className={`
          relative min-w-[320px] max-w-[420px] 
          ${colors.bg} ${colors.border} ${colors.glow}
          backdrop-blur-xl border rounded-2xl p-4
          mb-3 transition-all duration-300
          ${isUrgent ? 'ring-2 ring-red-500/50 dark:ring-red-400/60' : ''}
          bg-white/90 dark:bg-gray-800/95
          border-gray-200/50 dark:border-gray-700/70
        `}
        role="alert"
      >
        {/* Shimmer effect for achievements */}
        {(notification.type === 'achievement' || notification.type === 'milestone') && (
          <div className="absolute inset-0 rounded-2xl shimmer pointer-events-none" />
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors z-10 group"
          aria-label="Close notification"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          {/* Icon with animated background */}
          <div className={`
            relative flex-shrink-0
            ${colors.accent}
            rounded-xl p-2.5
            ${notification.type === 'achievement' || notification.type === 'milestone' 
              ? 'animate-bounce' 
              : ''
            }
          `}>
            {notification.icon || (
              <Icon className={`h-5 w-5 ${colors.icon}`} />
            )}
            {(notification.type === 'achievement' || notification.type === 'milestone') && (
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 animate-pulse" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`
                font-semibold text-sm leading-tight
                text-gray-900 dark:text-white
                ${isUrgent ? 'font-bold' : ''}
              `}>
                {notification.title}
              </h4>
              {notification.priority === 'urgent' && (
                <Zap className="h-4 w-4 text-red-500 animate-pulse flex-shrink-0" />
              )}
            </div>
            
            {notification.message && (
              <p className="text-xs text-gray-700 dark:text-gray-200 mt-1.5 leading-relaxed">
                {notification.message}
              </p>
            )}

            {/* Action button */}
            {notification.action && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  notification.action?.onClick();
                  handleClose();
                }}
                className={`
                  mt-3 px-3 py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-200
                  ${colors.icon.replace('text-', 'bg-').replace('-500', '-500/20')} 
                  ${colors.icon.replace('text-', 'hover:bg-').replace('-500', '-500/30')}
                  ${colors.icon.replace('text-', 'text-')}
                  backdrop-blur-sm
                `}
              >
                {notification.action.label}
              </button>
            )}

            {/* Progress bar for auto-dismiss */}
            {notification.duration !== 0 && (
              <div className="mt-2 h-0.5 bg-white/10 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.icon.replace('text-', 'bg-')} rounded-full`}
                  style={{
                    animation: `shrink ${notification.duration || 5000}ms linear forwards`
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    </>
  );
};

