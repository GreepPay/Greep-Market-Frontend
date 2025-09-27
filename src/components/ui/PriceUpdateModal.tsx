import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Product } from '../../types';

interface PriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onPriceUpdate: (productId: string, newPrice: number, reason?: string) => Promise<void>;
}

export const PriceUpdateModal: React.FC<PriceUpdateModalProps> = ({
  isOpen,
  onClose,
  product,
  onPriceUpdate,
}) => {
  const [newPrice, setNewPrice] = useState('');
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  React.useEffect(() => {
    if (product && isOpen) {
      setNewPrice(product.price.toString());
      setReason('');
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (price === product.price) {
      toast.error('New price must be different from current price');
      return;
    }

    setIsUpdating(true);
    try {
      await onPriceUpdate(product._id, price, reason.trim() || undefined);
      toast.success('Price updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update price:', error);
      toast.error('Failed to update price');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setNewPrice('');
    setReason('');
    onClose();
  };

  if (!product) return null;

  const currentPrice = product.price;
  const newPriceNum = parseFloat(newPrice);
  const priceChange = newPriceNum - currentPrice;
  const priceChangePercent = currentPrice > 0 ? ((priceChange / currentPrice) * 100) : 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Update Price</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Change product pricing</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Close modal"
            aria-label="Close price update modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">{product.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">SKU: {product.sku}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Price:</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                ${currentPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Price
            </label>
            <Input
              id="newPrice"
              type="number"
              step="0.01"
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Enter new price"
              className="w-full"
              required
            />
          </div>

          {newPrice && !isNaN(newPriceNum) && newPriceNum !== currentPrice && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                {priceChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500 dark:text-red-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500 dark:text-green-400" />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Price Change</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {priceChange > 0 ? 'Increase' : 'Decrease'}:
                </span>
                <span className={`font-semibold ${
                  priceChange > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {priceChange > 0 ? '+' : ''}${Math.abs(priceChange).toFixed(2)} 
                  ({priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Change (Optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Supplier cost increase, market adjustment, promotional pricing..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
            />
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Important:</p>
                <p>This will update the product price for future sales. Previous transactions will retain their original pricing.</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isUpdating || !newPrice || parseFloat(newPrice) === currentPrice}
            >
              {isUpdating ? 'Updating...' : 'Update Price'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
