import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  showHeader?: boolean;
  headerIcon?: React.ReactNode;
  headerColor?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  showHeader = true,
  headerIcon,
  headerColor = 'primary',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
  };

  const headerColorClasses = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600',
    success: 'bg-gradient-to-r from-green-500 to-green-600',
    warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    error: 'bg-gradient-to-r from-red-500 to-red-600',
    info: 'bg-gradient-to-r from-blue-500 to-blue-600',
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
      style={{ margin: 0, padding: 0 }}
    >
      {/* Modal container - centered both horizontally and vertically */}
      <div className="flex min-h-screen items-center justify-center py-8 px-4">
        <div 
          ref={modalRef}
          className={`relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all duration-300 scale-100 my-auto max-h-[90vh] flex flex-col`}
          onClick={handleModalClick}
        >
          {/* Header */}
          {showHeader && title && (
            <div className={`${headerColorClasses[headerColor]} px-6 py-4 flex-shrink-0`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {headerIcon && (
                    <div className="flex-shrink-0">
                      {headerIcon}
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-white">{title}</h3>
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                    title="Close modal"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Content - scrollable if needed */}
          <div className="p-6 overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
