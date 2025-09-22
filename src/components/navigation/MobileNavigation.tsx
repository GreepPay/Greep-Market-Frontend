import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  AlertTriangle,
  Receipt,
  Shield,
  DollarSign
} from 'lucide-react';
import { GlassmorphismButton } from '../ui/GlassmorphismIcon';

const navigationItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard', color: 'orange' as const },
  { path: '/products', icon: Package, label: 'Products', color: 'blue' as const },
  { path: '/pos', icon: ShoppingCart, label: 'POS', isSpecial: true, color: 'green' as const },
  { path: '/inventory', icon: AlertTriangle, label: 'Inventory', color: 'red' as const },
  { path: '/cash-tracking', icon: DollarSign, label: 'Cash', color: 'green' as const },
  { path: '/expenses', icon: Receipt, label: 'Expenses', color: 'pink' as const },
  { path: '/reports', icon: BarChart3, label: 'Reports', color: 'purple' as const },
  { path: '/audit', icon: Shield, label: 'Audit', color: 'blue' as const },
];

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-white/20 dark:border-gray-700/50 z-40 shadow-lg transition-colors duration-300">
      <div className="flex justify-around items-center py-3 px-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path === '/pos' && location.pathname === '/');
          
          return (
            <GlassmorphismButton
              key={item.path}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              isSpecial={item.isSpecial}
              color={item.color}
              onClick={() => navigate(item.path)}
            />
          );
        })}
      </div>
    </div>
  );
};
