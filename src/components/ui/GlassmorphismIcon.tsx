import React from 'react';
import { LucideIcon } from 'lucide-react';

interface GlassmorphismIconProps {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'active' | 'special' | 'subtle' | 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'red';
  className?: string;
  onClick?: () => void;
}

export const GlassmorphismIcon: React.FC<GlassmorphismIconProps> = ({
  icon: Icon,
  size = 'md',
  variant = 'default',
  className = '',
  onClick,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };

  const containerSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3',
  };

  const variantClasses = {
    default: 'bg-white/8 backdrop-blur-md border border-white/15 text-gray-600 dark:text-gray-400 shadow-sm shadow-black/3',
    active: 'bg-primary-500/8 backdrop-blur-md border border-primary-400/20 text-primary-600 dark:text-primary-400 shadow-sm shadow-primary-500/10',
    special: 'bg-gradient-to-br from-green-500/8 to-emerald-500/8 backdrop-blur-md border border-green-400/20 text-green-600 dark:text-green-400 shadow-sm shadow-green-500/10',
    subtle: 'bg-gray-100/10 backdrop-blur-sm border border-gray-200/20 text-gray-500 dark:text-gray-500 shadow-sm shadow-gray-500/5',
    purple: 'bg-gradient-to-br from-purple-500/8 to-violet-500/8 backdrop-blur-md border border-purple-400/20 text-purple-500 dark:text-purple-400 shadow-sm shadow-purple-500/10',
    blue: 'bg-gradient-to-br from-blue-500/8 to-cyan-500/8 backdrop-blur-md border border-blue-400/20 text-blue-500 dark:text-blue-400 shadow-sm shadow-blue-500/10',
    green: 'bg-gradient-to-br from-green-500/8 to-teal-500/8 backdrop-blur-md border border-green-400/20 text-green-500 dark:text-green-400 shadow-sm shadow-green-500/10',
    orange: 'bg-gradient-to-br from-orange-500/8 to-amber-500/8 backdrop-blur-md border border-orange-400/20 text-orange-500 dark:text-orange-400 shadow-sm shadow-orange-500/10',
    pink: 'bg-gradient-to-br from-pink-500/8 to-rose-500/8 backdrop-blur-md border border-pink-400/20 text-pink-500 dark:text-pink-400 shadow-sm shadow-pink-500/10',
    red: 'bg-gradient-to-br from-red-500/8 to-pink-500/8 backdrop-blur-md border border-red-400/20 text-red-500 dark:text-red-400 shadow-sm shadow-red-500/10',
  };

  const baseClasses = `
    inline-flex items-center justify-center
    rounded-2xl
    transition-all duration-300 ease-in-out
    hover:scale-105 hover:shadow-md hover:shadow-black/5
    active:scale-98
    ${containerSizes[size]}
    ${variantClasses[variant]}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim();

  return (
    <div className={baseClasses} onClick={onClick}>
      <Icon className={`${sizeClasses[size]} transition-transform duration-200 drop-shadow-sm`} />
    </div>
  );
};

// Helper function for color classes
const getColorClasses = (color: string, isActive: boolean) => {
  const baseClasses = 'backdrop-blur-md shadow-sm hover:shadow-md';
  const activeModifier = isActive ? 'shadow-md' : 'shadow-sm';
  
  switch (color) {
    case 'purple':
      return `bg-gradient-to-br from-purple-500/8 to-violet-500/8 border border-purple-400/20 shadow-purple-500/10 hover:shadow-purple-500/15 ${baseClasses} ${activeModifier}`;
    case 'blue':
      return `bg-gradient-to-br from-blue-500/8 to-cyan-500/8 border border-blue-400/20 shadow-blue-500/10 hover:shadow-blue-500/15 ${baseClasses} ${activeModifier}`;
    case 'green':
      return `bg-gradient-to-br from-green-500/8 to-teal-500/8 border border-green-400/20 shadow-green-500/10 hover:shadow-green-500/15 ${baseClasses} ${activeModifier}`;
    case 'orange':
      return `bg-gradient-to-br from-orange-500/8 to-amber-500/8 border border-orange-400/20 shadow-orange-500/10 hover:shadow-orange-500/15 ${baseClasses} ${activeModifier}`;
    case 'pink':
      return `bg-gradient-to-br from-pink-500/8 to-rose-500/8 border border-pink-400/20 shadow-pink-500/10 hover:shadow-pink-500/15 ${baseClasses} ${activeModifier}`;
    case 'red':
      return `bg-gradient-to-br from-red-500/8 to-pink-500/8 border border-red-400/20 shadow-red-500/10 hover:shadow-red-500/15 ${baseClasses} ${activeModifier}`;
    default:
      return isActive 
        ? 'bg-primary-500/8 border border-primary-400/20 shadow-primary-500/10 hover:shadow-primary-500/15 backdrop-blur-md shadow-sm hover:shadow-md'
        : 'bg-white/8 border border-white/15 shadow-black/3 hover:bg-white/12 hover:shadow-md hover:shadow-black/5 backdrop-blur-md shadow-sm';
  }
};

// Helper function for icon container classes
const getIconContainerClasses = (color: string, isActive: boolean) => {
  switch (color) {
    case 'purple':
      return `bg-purple-500/10 backdrop-blur-sm border border-purple-400/20`;
    case 'blue':
      return `bg-blue-500/10 backdrop-blur-sm border border-blue-400/20`;
    case 'green':
      return `bg-green-500/10 backdrop-blur-sm border border-green-400/20`;
    case 'orange':
      return `bg-orange-500/10 backdrop-blur-sm border border-orange-400/20`;
    case 'pink':
      return `bg-pink-500/10 backdrop-blur-sm border border-pink-400/20`;
    case 'red':
      return `bg-red-500/10 backdrop-blur-sm border border-red-400/20`;
    default:
      return isActive 
        ? 'bg-primary-500/10 backdrop-blur-sm border border-primary-400/20'
        : 'bg-white/8 backdrop-blur-sm border border-white/15';
  }
};

// Helper function for icon color classes
const getIconColorClasses = (color: string, isActive: boolean) => {
  switch (color) {
    case 'purple':
      return 'text-purple-500 dark:text-purple-400';
    case 'blue':
      return 'text-blue-500 dark:text-blue-400';
    case 'green':
      return 'text-green-500 dark:text-green-400';
    case 'orange':
      return 'text-orange-500 dark:text-orange-400';
    case 'pink':
      return 'text-pink-500 dark:text-pink-400';
    case 'red':
      return 'text-red-500 dark:text-red-400';
    default:
      return isActive 
        ? 'text-primary-500 dark:text-primary-400'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300';
  }
};

// Helper function for text color classes
const getTextColorClasses = (color: string, isActive: boolean) => {
  switch (color) {
    case 'purple':
      return isActive ? 'text-purple-600 dark:text-purple-300' : 'text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300';
    case 'blue':
      return isActive ? 'text-blue-600 dark:text-blue-300' : 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300';
    case 'green':
      return isActive ? 'text-green-600 dark:text-green-300' : 'text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300';
    case 'orange':
      return isActive ? 'text-orange-600 dark:text-orange-300' : 'text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300';
    case 'pink':
      return isActive ? 'text-pink-600 dark:text-pink-300' : 'text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300';
    case 'red':
      return isActive ? 'text-red-600 dark:text-red-300' : 'text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300';
    default:
      return isActive 
        ? 'text-primary-600 dark:text-primary-300'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300';
  }
};

// Specialized glassmorphism icon variants
export const GlassmorphismButton: React.FC<{
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  isSpecial?: boolean;
  color?: 'default' | 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'red';
  onClick: () => void;
  className?: string;
}> = ({ icon: Icon, label, isActive, isSpecial, color = 'default', onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        py-3 px-4 rounded-2xl
        transition-all duration-300 ease-in-out
        hover:scale-102 active:scale-98
        min-w-0 flex-1 mx-1
        relative overflow-hidden
        ${isSpecial 
          ? 'bg-gradient-to-br from-green-500/8 to-emerald-500/8 backdrop-blur-md border border-green-400/20 shadow-sm shadow-green-500/10 hover:shadow-md hover:shadow-green-500/15' 
          : isActive 
            ? getColorClasses(color, true)
            : getColorClasses(color, false)
        }
        ${isActive ? 'ring-2 ring-primary-400/30 ring-offset-2 ring-offset-white/50' : ''}
        ${className}
      `.trim()}
    >
      <div className={`p-2 rounded-xl mb-2 transition-all duration-200 ${
        isSpecial 
          ? 'bg-green-500/10 backdrop-blur-sm border border-green-400/20' 
          : getIconContainerClasses(color, isActive || false)
      } ${isActive ? 'bg-primary-500/20 shadow-lg shadow-primary-500/20' : ''}`}>
        <Icon className={`h-5 w-5 transition-colors duration-200 drop-shadow-sm ${
          isSpecial 
            ? 'text-green-600 dark:text-green-400' 
            : getIconColorClasses(color, isActive || false)
        } ${isActive ? 'scale-110' : ''}`} />
      </div>
      <span className={`text-xs leading-tight transition-colors duration-200 ${
        isSpecial 
          ? 'text-green-600 dark:text-green-300 font-semibold' 
          : getTextColorClasses(color, isActive || false)
      } ${isActive ? 'font-bold' : 'font-semibold'}`}>
        {label}
      </span>
    </button>
  );
};
