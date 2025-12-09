import React, { useState } from 'react';
import { AlertCircle, TrendingUp, TrendingDown, X, DollarSign, Percent, Package } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import toast from 'react-hot-toast';

export interface PriceSuggestion {
  hasPriceChange: boolean;
  product: {
    id: string;
    name: string;
    sku?: string;
  };
  currentCostPrice: number;
  newCostPrice: number;
  currentSellingPrice: number;
  suggestedSellingPrice: number;
  markupPercentage: number;
  priceChangePercentage: number;
  message: string;
}

interface PriceSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: PriceSuggestion | null;
  onUpdatePrice: (updateSellingPrice: boolean) => Promise<void>;
  expenseId?: string;
}

export const PriceSuggestionModal: React.FC<PriceSuggestionModalProps> = ({
  isOpen,
  onClose,
  suggestion,
  onUpdatePrice,
  expenseId
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSellingPrice, setUpdateSellingPrice] = useState(true);

  if (!suggestion || !suggestion.hasPriceChange) {
    return null;
  }

  // Calculate price change percentage properly to handle NaN cases
  const calculatePriceChangePercentage = () => {
    if (suggestion.currentCostPrice === 0) {
      // If current price is 0, any new price is effectively infinite increase
      // Return a large positive number to indicate new price
      return suggestion.newCostPrice > 0 ? 100 : 0;
    }
    const change = suggestion.newCostPrice - suggestion.currentCostPrice;
    const percentChange = (change / suggestion.currentCostPrice) * 100;
    // Handle NaN or invalid values
    if (isNaN(percentChange) || !isFinite(percentChange)) {
      return 0;
    }
    return percentChange;
  };

  const priceChangePercentage = calculatePriceChangePercentage();
  const isPriceIncrease = priceChangePercentage > 0;
  const priceChangeColor = isPriceIncrease ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
  const priceChangeIcon = isPriceIncrease ? TrendingUp : TrendingDown;

  const handleUpdate = async () => {
    if (!expenseId) {
      toast.error('Expense ID is required');
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdatePrice(updateSellingPrice);
      toast.success(
        updateSellingPrice
          ? 'Product cost and selling price updated successfully'
          : 'Product cost price updated successfully'
      );
      onClose();
    } catch (error: any) {
      console.error('Failed to update product price:', error);
      toast.error(error.message || 'Failed to update product price');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Price Change Detected"
      size="lg"
    >
      <div className="space-y-6">
        {/* Alert Banner */}
        <div className={`rounded-lg p-4 border-2 ${
          isPriceIncrease
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        }`}>
          <div className="flex items-start space-x-3">
            <AlertCircle className={`h-5 w-5 mt-0.5 ${priceChangeColor}`} />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {suggestion.message}
              </p>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Package className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {suggestion.product.name}
              </h3>
              {suggestion.product.sku && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  SKU: {suggestion.product.sku}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Price Comparison */}
        <div className="space-y-4">
          {/* Cost Price Change */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cost Price
                </span>
              </div>
              <span className={`text-sm font-semibold ${priceChangeColor} flex items-center space-x-1`}>
                {suggestion.currentCostPrice === 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    <span>New</span>
                  </>
                ) : isPriceIncrease ? (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    <span>+{Math.abs(priceChangePercentage).toFixed(2)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4" />
                    <span>-{Math.abs(priceChangePercentage).toFixed(2)}%</span>
                  </>
                )}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₺{suggestion.currentCostPrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">New</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₺{suggestion.newCostPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Selling Price Suggestion */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selling Price
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Percent className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {suggestion.markupPercentage}% markup
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₺{suggestion.currentSellingPrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Suggested</p>
                <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                  ₺{suggestion.suggestedSellingPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Update Options */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={updateSellingPrice}
              onChange={(e) => setUpdateSellingPrice(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Also update selling price
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Update selling price to ₺{suggestion.suggestedSellingPrice.toFixed(2)} based on {suggestion.markupPercentage}% markup
              </p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isUpdating}
          >
            Skip
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isUpdating || !expenseId}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
          >
            {isUpdating ? 'Updating...' : 'Update Price'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

