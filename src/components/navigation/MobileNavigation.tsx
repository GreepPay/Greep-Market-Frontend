import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Receipt
} from 'lucide-react';

const navigationItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard', color: 'orange' as const },
  { path: '/pos', icon: ShoppingCart, label: 'Sales', isSpecial: true, color: 'green' as const },
  { path: '/products', icon: Package, label: 'Products', color: 'blue' as const },
  { path: '/expenses', icon: Receipt, label: 'Expenses', color: 'pink' as const },
  { path: '/reports', icon: BarChart3, label: 'Reports', color: 'purple' as const },
];

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-40 shadow-2xl">
      <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
        {navigationItems.map((item) => {
          // Enhanced active state detection
          const isActive = location.pathname === item.path || 
                          (item.path === '/pos' && (location.pathname === '/' || location.pathname === '/pos')) ||
                          (item.path === '/dashboard' && location.pathname === '/') ||
                          location.pathname.startsWith(item.path + '/');
          
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                flex flex-col items-center justify-center
                py-3 px-4 rounded-2xl
                transition-all duration-200 ease-in-out
                min-w-0 flex-1 mx-1
                relative group
                ${isActive 
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
            >
              {/* Icon container */}
              <div className={`
                p-2 rounded-xl mb-1 transition-all duration-200
                ${isActive 
                  ? 'bg-white/20 shadow-sm' 
                  : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                }
              `}>
                <Icon className={`h-5 w-5 transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                }`} />
              </div>
              
              {/* Label */}
              <span className={`
                text-xs font-medium transition-all duration-200
                ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-300'}
              `}>
                {item.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
