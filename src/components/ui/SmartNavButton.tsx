import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '../../context/NavigationContext';
import { Button } from './Button';

interface SmartNavButtonProps {
  to: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  preserveHistory?: boolean; // If true, uses navigate() instead of replace
}

export const SmartNavButton: React.FC<SmartNavButtonProps> = ({
  to,
  children,
  variant = 'outline',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  preserveHistory = true
}) => {
  const navigate = useNavigate();
  const { addToHistory } = useNavigation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    
    if (preserveHistory) {
      // Use regular navigate to preserve history
      navigate(to);
    } else {
      // Use replace to not add to history (for modal-like behavior)
      navigate(to, { replace: true });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
};

