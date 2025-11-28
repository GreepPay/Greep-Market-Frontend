import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon: Icon,
  label,
  color = 'green',
  size = 'lg',
  position = 'bottom-right',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14', 
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7'
  };

  const colorClasses = {
    green: 'bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 dark:from-primary-600 dark:to-primary-700 dark:hover:from-primary-700 dark:hover:to-primary-800 shadow-primary-500/30 dark:shadow-primary-600/40',
    blue: 'bg-gradient-to-br from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 dark:from-secondary-600 dark:to-secondary-700 dark:hover:from-secondary-700 dark:hover:to-secondary-800 shadow-secondary-500/30 dark:shadow-secondary-600/40',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:from-purple-600 dark:to-purple-700 dark:hover:from-purple-700 dark:hover:to-purple-800 shadow-purple-500/30 dark:shadow-purple-600/40',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-orange-600 dark:to-orange-700 dark:hover:from-orange-700 dark:hover:to-orange-800 shadow-orange-500/30 dark:shadow-orange-600/40',
    red: 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800 shadow-red-500/30 dark:shadow-red-600/40',
    emerald: 'bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 dark:from-primary-600 dark:to-primary-700 dark:hover:from-primary-700 dark:hover:to-primary-800 shadow-primary-500/30 dark:shadow-primary-600/40'
  };

  const positionClasses = {
    'bottom-right': 'bottom-36 right-6', // Main FAB position - above scroll button (144px from bottom)
    'bottom-left': 'bottom-24 left-6',   // Increased from bottom-6 to bottom-24 to clear navbar
    'bottom-center': 'bottom-24 left-1/2 transform -translate-x-1/2' // Increased from bottom-6 to bottom-24 to clear navbar
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={onClick}
        className={`
          fixed ${positionClasses[position]} ${sizeClasses[size]}
          ${colorClasses[color]}
          rounded-full shadow-xl hover:shadow-2xl dark:shadow-lg dark:hover:shadow-xl
          flex items-center justify-center
          text-white font-semibold
          transition-all duration-300 ease-in-out
          hover:scale-110 active:scale-95
          z-50
          group
          border border-white/10 dark:border-white/5
          ${className}
        `}
        aria-label={label}
        title={label}
      >
        <Icon className={`${iconSizes[size]} transition-transform duration-200 group-hover:scale-110`} />
        
        {/* Ripple effect */}
        <span className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 transition-opacity duration-150"></span>
      </button>

      {/* Tooltip */}
      <div className={`
        fixed ${positionClasses[position]} ${sizeClasses[size]}
        pointer-events-none
        z-40
        transition-all duration-300 ease-in-out
        opacity-0 group-hover:opacity-100
        transform translate-y-2 group-hover:translate-y-0
      `}>
        <div className={`
          absolute bottom-full mb-2
          bg-gray-900 dark:bg-gray-800
          text-white dark:text-gray-100 text-sm font-medium
          px-3 py-2 rounded-lg
          whitespace-nowrap
          shadow-lg dark:shadow-xl
          border border-gray-700 dark:border-gray-600
          ${position === 'bottom-center' ? 'left-1/2 transform -translate-x-1/2' : 
            position === 'bottom-left' ? 'right-0' : 'left-0'}
        `}>
          {label}
          {/* Arrow */}
          <div className={`
            absolute top-full
            border-4 border-transparent
            ${position === 'bottom-center' ? 'left-1/2 transform -translate-x-1/2 border-t-gray-900 dark:border-t-gray-800' : 
              position === 'bottom-left' ? 'right-4 border-t-gray-900 dark:border-t-gray-800' : 
              'left-4 border-t-gray-900 dark:border-t-gray-800'}
          `}></div>
        </div>
      </div>
    </>
  );
};
