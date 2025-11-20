import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Receipt,
  Building2
} from 'lucide-react';

const navigationItems = [
  { 
    path: '/dashboard', 
    icon: Home, 
    label: 'Dashboard', 
    activeColor: 'text-orange-500 dark:text-orange-400',
    activeBg: 'bg-orange-100 dark:bg-orange-900/30',
    inactiveColor: 'text-gray-500 dark:text-gray-400'
  },
  { 
    path: '/products', 
    icon: Package, 
    label: 'Products',
    activeColor: 'text-blue-500 dark:text-blue-400',
    activeBg: 'bg-blue-100 dark:bg-blue-900/30',
    inactiveColor: 'text-gray-500 dark:text-gray-400'
  },
  { 
    path: '/pos', 
    icon: ShoppingCart, 
    label: 'Sales',
    activeColor: 'text-green-500 dark:text-green-400',
    activeBg: 'bg-green-100 dark:bg-green-900/30',
    inactiveColor: 'text-gray-500 dark:text-gray-400'
  },
  { 
    path: '/wholesalers', 
    icon: Building2, 
    label: 'Wholesalers',
    activeColor: 'text-indigo-500 dark:text-indigo-400',
    activeBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    inactiveColor: 'text-gray-500 dark:text-gray-400'
  },
  { 
    path: '/expenses', 
    icon: Receipt, 
    label: 'Expenses',
    activeColor: 'text-pink-500 dark:text-pink-400',
    activeBg: 'bg-pink-100 dark:bg-pink-900/30',
    inactiveColor: 'text-gray-500 dark:text-gray-400'
  },
  { 
    path: '/reports', 
    icon: BarChart3, 
    label: 'Reports',
    activeColor: 'text-purple-500 dark:text-purple-400',
    activeBg: 'bg-purple-100 dark:bg-purple-900/30',
    inactiveColor: 'text-gray-500 dark:text-gray-400'
  },
];

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 z-40 shadow-lg">
      <div className="flex justify-around items-center py-2 px-2 max-w-md mx-auto">
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
                py-2.5 px-3 rounded-xl
                transition-all duration-300 ease-out
                min-w-0 flex-1 mx-0.5
                relative group
                hover:bg-gray-50 dark:hover:bg-gray-800/50
                active:scale-95
              `}
            >
              {/* Icon container - only highlighted when active */}
              <div className={`
                p-2.5 rounded-xl mb-1.5 transition-all duration-300
                ${isActive 
                  ? `${item.activeBg} shadow-md scale-110` 
                  : 'bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-gray-800'
                }
              `}>
                <Icon className={`
                  h-6 w-6 transition-all duration-300
                  ${isActive 
                    ? `${item.activeColor} scale-110` 
                    : `${item.inactiveColor} group-hover:scale-105`
                  }
                `} 
                strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              
              {/* Label */}
              <span className={`
                text-[10px] font-semibold transition-all duration-300
                ${isActive 
                  ? `${item.activeColor} font-bold` 
                  : `${item.inactiveColor} group-hover:text-gray-600 dark:group-hover:text-gray-300`
                }
              `}>
                {item.label}
              </span>
              
              {/* Active indicator dot */}
              {isActive && (
                <div className={`
                  absolute -top-0.5 left-1/2 transform -translate-x-1/2
                  w-1.5 h-1.5 rounded-full
                  ${item.path === '/dashboard' ? 'bg-orange-500 dark:bg-orange-400' :
                    item.path === '/products' ? 'bg-blue-500 dark:bg-blue-400' :
                    item.path === '/pos' ? 'bg-green-500 dark:bg-green-400' :
                    item.path === '/wholesalers' ? 'bg-indigo-500 dark:bg-indigo-400' :
                    item.path === '/expenses' ? 'bg-pink-500 dark:bg-pink-400' :
                    'bg-purple-500 dark:bg-purple-400'}
                  animate-pulse
                `} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
