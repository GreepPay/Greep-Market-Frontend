import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface BackendSupportNoticeProps {
  feature: string;
  isVisible: boolean;
}

export const BackendSupportNotice: React.FC<BackendSupportNoticeProps> = ({
  feature,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
        <div className="text-sm text-yellow-800 dark:text-yellow-200">
          <p className="font-medium">Backend Support Required</p>
          <p>
            The {feature} functionality is ready in the frontend but requires backend API endpoints to be implemented. 
            Please contact your system administrator to enable this feature.
          </p>
        </div>
      </div>
    </div>
  );
};

