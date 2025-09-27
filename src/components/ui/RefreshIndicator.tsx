import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useRefresh } from '../../context/RefreshContext';

interface RefreshIndicatorProps {
  className?: string;
  showText?: boolean;
}

export const RefreshIndicator: React.FC<RefreshIndicatorProps> = ({
  className = '',
  showText = false
}) => {
  const { isRefreshing } = useRefresh();

  if (!isRefreshing) return null;

  return (
    <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
      <RefreshCw className="h-4 w-4 animate-spin" />
      {showText && <span>Refreshing...</span>}
    </div>
  );
};

