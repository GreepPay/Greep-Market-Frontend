import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '../../context/NavigationContext';

interface BreadcrumbProps {
  className?: string;
  showHome?: boolean;
  maxItems?: number;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  className = '',
  showHome = true,
  maxItems = 3
}) => {
  const { getBreadcrumbs, currentPath } = useNavigation();
  const navigate = useNavigate();
  
  const breadcrumbs = getBreadcrumbs();
  const displayBreadcrumbs = breadcrumbs.slice(-maxItems);

  const handleBreadcrumbClick = (path: string) => {
    navigate(path);
  };

  const handleHomeClick = () => {
    navigate('/dashboard');
  };

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs if there's only one item
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      {showHome && (
        <>
          <button
            onClick={handleHomeClick}
            className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            title="Go to Dashboard"
            aria-label="Go to Dashboard"
          >
            <Home className="h-4 w-4" />
          </button>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </>
      )}
      
      {displayBreadcrumbs.map((item, index) => {
        const isLast = index === displayBreadcrumbs.length - 1;
        const isCurrent = item.path === currentPath;
        
        return (
          <React.Fragment key={item.path}>
            <button
              onClick={() => handleBreadcrumbClick(item.path)}
              className={`transition-colors duration-200 ${
                isCurrent
                  ? 'text-gray-900 dark:text-white font-medium'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              disabled={isCurrent}
            >
              {item.title}
            </button>
            {!isLast && <ChevronRight className="h-4 w-4 text-gray-400" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
