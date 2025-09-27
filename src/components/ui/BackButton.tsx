import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '../../context/NavigationContext';
import { Button } from './Button';

interface BackButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showHomeButton?: boolean;
  className?: string;
  fallbackPath?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  variant = 'outline',
  size = 'md',
  showHomeButton = false,
  className = '',
  fallbackPath = '/dashboard'
}) => {
  const { canGoBack, goBack } = useNavigation();
  const navigate = useNavigate();

  const handleBack = () => {
    if (canGoBack) {
      goBack();
    } else {
      navigate(fallbackPath);
    }
  };

  const handleHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant={variant}
        size={size}
        onClick={handleBack}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </Button>
      
      {showHomeButton && (
        <Button
          variant="outline"
          size={size}
          onClick={handleHome}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          <span>Home</span>
        </Button>
      )}
    </div>
  );
};

