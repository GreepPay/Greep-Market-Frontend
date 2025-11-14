import React, { useState, useEffect } from 'react';
import { Minus, Plus, ShoppingCart, DollarSign, Hash, X } from 'lucide-react';
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
      className="w-full px-3 py-2 text-center font-medium border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      min="0"
      step="0.01"
      placeholder="0.00"
      title="Click to edit quantity manually (useful for scale-weighed items)"
    />
  );
};

// PriceInput component to handle total price input and auto-calculate quantity
const PriceInput: React.FC<{
  value: number;
  unitPrice: number;
  onChange: (quantity: number) => void;
  productId: string;
  formatPrice: (price: number) => string;
}> = ({ value, unitPrice, onChange, productId, formatPrice }) => {
  // Helper to format price for display (Turkish format: 123,45)
  const formatPriceForInput = (price: number) => {
    return price.toFixed(2).replace('.', ',');
  };

  const [inputValue, setInputValue] = useState(formatPriceForInput(value * unitPrice));
  const [isEditing, setIsEditing] = useState(false);

  // Update local state when prop value changes (from external updates)
  useEffect(() => {
    if (!isEditing) {
      const totalPrice = value * unitPrice;
      setInputValue(formatPriceForInput(totalPrice));
    }
  }, [value, unitPrice, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^\d.,]/g, '');
    setInputValue(newValue);
    
    // Allow typing intermediate values
    if (newValue === '' || newValue === ',' || newValue.endsWith(',')) {
      return; // Don't update yet
    }
    
    // Parse the price value (handle both comma and dot as decimal separator)
    const normalizedValue = newValue.replace(',', '.');
    const numValue = parseFloat(normalizedValue);
    
    if (!isNaN(numValue) && numValue >= 0 && unitPrice > 0) {
      // Calculate quantity from price
      const calculatedQuantity = numValue / unitPrice;
      if (calculatedQuantity > 0) {
        onChange(calculatedQuantity);
      }
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const normalizedValue = inputValue.replace(',', '.');
    const numValue = parseFloat(normalizedValue);
    
    if (inputValue === '' || isNaN(numValue) || numValue <= 0 || unitPrice <= 0) {
      const totalPrice = value * unitPrice;
      setInputValue(formatPriceForInput(totalPrice));
    } else {
      const calculatedQuantity = numValue / unitPrice;
      if (calculatedQuantity > 0) {
        onChange(calculatedQuantity);
        setInputValue(formatPriceForInput(numValue));
      } else {
        const totalPrice = value * unitPrice;
        setInputValue(formatPriceForInput(totalPrice));
      }
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
    // Show numeric value when focusing (remove any formatting)
    const totalPrice = value * unitPrice;
    setInputValue(formatPriceForInput(totalPrice));
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className="w-full px-3 py-2 text-center font-medium border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      placeholder="0,00"
      title="Enter total price - quantity will be calculated automatically"
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
  // Track input mode for each item (quantity or price)
  const [inputModes, setInputModes] = useState<{ [productId: string]: 'quantity' | 'price' }>({});
  
  const total = items.reduce((sum, item) => sum + item.total_price, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  const toggleInputMode = (productId: string) => {
    setInputModes(prev => ({
      ...prev,
      [productId]: prev[productId] === 'price' ? 'quantity' : 'price'
    }));
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
        {items.map((item) => {
          const isPriceMode = inputModes[item.product_id] === 'price';
          
          return (
            <div
              key={item.product_id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3"
            >
              {/* Top Row: Product Info and Remove */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-14 h-14 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h4 
                      className="font-semibold text-gray-900 dark:text-white truncate text-base" 
                      title={item.product_name}
                    >
                      {item.product_name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatPrice(item.unit_price)} per unit
                    </p>
                  </div>
                </div>

                {/* Remove Button - Top Right */}
                <button
                  onClick={() => onRemoveItem(item.product_id)}
                  className="flex-shrink-0 p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Remove item"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Middle Row: Quantity/Price Controls */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  {/* Input Mode Toggle - Subtle button */}
                  <button
                    onClick={() => toggleInputMode(item.product_id)}
                    className="flex-shrink-0 p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                    title={isPriceMode ? "Switch to quantity input" : "Switch to price input (auto-calculates quantity)"}
                  >
                    {isPriceMode ? (
                      <Hash className="h-4 w-4" />
                    ) : (
                      <DollarSign className="h-4 w-4" />
                    )}
                  </button>

                  {isPriceMode ? (
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Total Price
                      </label>
                      <PriceInput
                        value={item.quantity}
                        unitPrice={item.unit_price}
                        onChange={(quantity) => onUpdateQuantity(item.product_id, quantity)}
                        productId={item.product_id}
                        formatPrice={formatPrice}
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Quantity
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onUpdateQuantity(item.product_id, Math.max(0.01, item.quantity - 1))}
                          disabled={item.quantity <= 0.01}
                          className="flex-shrink-0 p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="flex-1">
                          <QuantityInput
                            value={item.quantity}
                            onChange={(quantity) => onUpdateQuantity(item.product_id, quantity)}
                            productId={item.product_id}
                          />
                        </div>
                        <button
                          onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                          className="flex-shrink-0 p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Total Price */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-600 dark:text-gray-400">Item Total:</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatPrice(item.total_price)}
                </span>
              </div>
            </div>
          );
        })}
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
