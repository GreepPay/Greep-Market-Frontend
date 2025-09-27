import React, { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { TransactionItem } from '../../types';

interface ShoppingCartProps {
  items: TransactionItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  className?: string;
}

// QuantityInput component to handle local state for typing
const QuantityInput: React.FC<{
  value: number;
  onChange: (quantity: number) => void;
  productId: string;
}> = ({ value, onChange, productId }) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isEditing, setIsEditing] = useState(false);

  // Update local state when prop value changes (from external updates)
  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toString());
    }
  }, [value, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Allow typing intermediate values like "0." or "0.6"
    if (newValue === '' || newValue === '.' || newValue.endsWith('.')) {
      return; // Don't update quantity yet
    }
    
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseFloat(inputValue);
    
    if (inputValue === '' || isNaN(numValue) || numValue <= 0) {
      setInputValue('0.01');
      onChange(0.01);
    } else {
      setInputValue(numValue.toString());
      onChange(numValue);
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  return (
    <input
      type="number"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className="w-16 px-2 py-1 text-center font-medium border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      min="0"
      step="0.01"
      placeholder="0.00"
      title="Click to edit quantity manually (useful for scale-weighed items)"
    />
  );
};

export const ShoppingCartComponent: React.FC<ShoppingCartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  className = '',
}) => {
  const total = items.reduce((sum, item) => sum + item.total_price, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  if (items.length === 0) {
    return (
      <Card className={`text-center py-8 shadow-lg border-2 border-gray-100 dark:border-gray-700 max-h-[calc(100vh-200px)] ${className}`}>
        <ShoppingCart className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
        <p className="text-gray-500 dark:text-gray-400">Add some products to get started</p>
      </Card>
    );
  }

  return (
    <Card className={`shadow-lg border-2 border-primary-100 dark:border-primary-900/20 flex flex-col max-h-[calc(100vh-200px)] ${className}`}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Shopping Cart ({items.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearCart}
        >
          Clear All
        </Button>
      </div>

      <div className="space-y-3 mb-6 flex-1 overflow-y-auto min-h-0">
        {items.map((item) => (
          <div
            key={item.product_id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <h4 
                className="font-medium text-gray-900 dark:text-white truncate" 
                title={item.product_name}
              >
                {item.product_name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatPrice(item.unit_price)} each
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.product_id, Math.max(0.01, item.quantity - 1))}
                  disabled={item.quantity <= 0.01}
                  className="!p-1"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <QuantityInput
                  value={item.quantity}
                  onChange={(quantity) => onUpdateQuantity(item.product_id, quantity)}
                  productId={item.product_id}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                  className="!p-1"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-right min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatPrice(item.total_price)}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemoveItem(item.product_id)}
                className="!p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex-shrink-0 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
            {formatPrice(total)}
          </span>
        </div>

        <Button
          onClick={onCheckout}
          className="w-full"
          size="lg"
        >
          Checkout
        </Button>
      </div>
    </Card>
  );
};
