import React from 'react';
import { CreditCard, Banknote, Smartphone, Coins } from 'lucide-react';
import { PaymentMethod } from '../../types';

interface PaymentMethodsDisplayProps {
  paymentMethods: PaymentMethod[];
  className?: string;
  showAmounts?: boolean;
  compact?: boolean;
}

export const PaymentMethodsDisplay: React.FC<PaymentMethodsDisplayProps> = ({
  paymentMethods,
  className = '',
  showAmounts = false,
  compact = false
}) => {
  // Handle empty or invalid payment methods
  if (!paymentMethods || paymentMethods.length === 0) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 ${className}`}>
        No Payment
      </span>
    );
  }

  const paymentTypeConfig = {
    cash: { 
      label: 'Cash', 
      icon: Banknote, 
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-800 dark:text-green-300'
    },
    pos_isbank_transfer: { 
      label: 'POS/Isbank Transfer', 
      icon: CreditCard, 
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-800 dark:text-blue-300'
    },
    naira_transfer: { 
      label: 'Naira Transfer', 
      icon: Smartphone, 
      color: 'purple',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-800 dark:text-purple-300'
    },
    crypto_payment: { 
      label: 'Crypto Payment', 
      icon: Coins, 
      color: 'orange',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-800 dark:text-orange-300'
    },
    // Legacy support for backward compatibility
    card: { 
      label: 'POS', 
      icon: CreditCard, 
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-800 dark:text-blue-300'
    },
    transfer: { 
      label: 'Transfer', 
      icon: Smartphone, 
      color: 'purple',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-800 dark:text-purple-300'
    },
    crypto: { 
      label: 'Crypto Payment', 
      icon: Coins, 
      color: 'orange',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-800 dark:text-orange-300'
    }
  };

  if (compact) {
    // Show as a single badge with count
    if (paymentMethods.length === 1) {
      const method = paymentMethods[0];
      const config = paymentTypeConfig[method.type] || {
        label: method.type.charAt(0).toUpperCase() + method.type.slice(1).replace(/_/g, ' '),
        icon: Banknote,
        color: 'gray',
        bgColor: 'bg-gray-100 dark:bg-gray-900/30',
        textColor: 'text-gray-800 dark:text-gray-300'
      };
      const IconComponent = config.icon;
      
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}>
          <IconComponent className="h-3 w-3 mr-1" />
          {config.label}
          {showAmounts && ` (₺${method.amount.toLocaleString()})`}
        </span>
      );
    } else {
      // Show count of payment methods
      const totalAmount = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 ${className}`}>
          {paymentMethods.length} Methods
          {showAmounts && ` (₺${totalAmount.toLocaleString()})`}
        </span>
      );
    }
  }

  // Show all payment methods as separate badges
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {paymentMethods.map((method, index) => {
        const config = paymentTypeConfig[method.type] || {
          label: method.type.charAt(0).toUpperCase() + method.type.slice(1).replace(/_/g, ' '),
          icon: Banknote,
          color: 'gray',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          textColor: 'text-gray-800 dark:text-gray-300'
        };
        const IconComponent = config.icon;
        
        return (
          <span
            key={index}
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
            title={`${config.label}: ₺${method.amount.toLocaleString()}`}
          >
            <IconComponent className="h-3 w-3 mr-1" />
            {config.label}
            {showAmounts && ` ₺${method.amount.toLocaleString()}`}
          </span>
        );
      })}
    </div>
  );
};
