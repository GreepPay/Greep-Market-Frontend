import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationHistoryItem {
  path: string;
  title: string;
  timestamp: number;
}

interface NavigationContextType {
  history: NavigationHistoryItem[];
  currentPath: string;
  canGoBack: boolean;
  goBack: () => void;
  addToHistory: (path: string, title: string) => void;
  getBreadcrumbs: () => NavigationHistoryItem[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<NavigationHistoryItem[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Page titles mapping
  const pageTitles: { [key: string]: string } = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/pos': 'Sales (POS)',
    '/products': 'Products',
    '/inventory': 'Inventory',
    '/sales-history': 'Sales History',
    '/reports': 'Reports',
    '/expenses': 'Expenses',
    '/riders': 'Rider Management',
    '/cash-tracking': 'Cash Tracking',
    '/settings': 'Settings',
    '/login': 'Login',
    '/audit': 'Audit Logs',
    '/audit-dashboard': 'Audit Dashboard',
  };

  const addToHistory = (path: string, title: string) => {
    setHistory(prev => {
      // Remove duplicates and keep only the last 10 items
      const filtered = prev.filter(item => item.path !== path);
      const newItem: NavigationHistoryItem = {
        path,
        title,
        timestamp: Date.now()
      };
      return [...filtered, newItem].slice(-10);
    });
  };

  const goBack = () => {
    if (history.length > 1) {
      const previousItem = history[history.length - 2];
      navigate(previousItem.path);
    } else {
      // Fallback to browser back
      navigate(-1);
    }
  };

  const getBreadcrumbs = () => {
    // Return the last 3 items as breadcrumbs
    return history.slice(-3);
  };

  // Update history when location changes
  useEffect(() => {
    const title = pageTitles[location.pathname] || 'Unknown Page';
    addToHistory(location.pathname, title);
  }, [location.pathname]);

  const value: NavigationContextType = {
    history,
    currentPath: location.pathname,
    canGoBack: history.length > 1,
    goBack,
    addToHistory,
    getBreadcrumbs,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

