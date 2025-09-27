import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  User, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Package,
  X,
  Download
} from 'lucide-react';
import { RiderCashTransaction } from '../../types';
import { Card } from './Card';
import { Button } from './Button';
import { Modal } from './Modal';
import { Input } from './Input';

interface RiderCashHistoryProps {
  riderId: string;
  riderName: string;
  isOpen: boolean;
  onClose: () => void;
  transactions: RiderCashTransaction[];
  onLoadTransactions: (riderId: string) => Promise<void>;
}

export const RiderCashHistory: React.FC<RiderCashHistoryProps> = ({
  riderId,
  riderName,
  isOpen,
  onClose,
  transactions,
  onLoadTransactions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && riderId) {
      loadTransactions();
    }
  }, [isOpen, riderId]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      await onLoadTransactions(riderId);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.given_by_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || transaction.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'give_cash':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'reconcile':
        return <ArrowDownLeft className="h-4 w-4 text-blue-600" />;
      case 'delivery_payment':
        return <Package className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'give_cash':
        return 'Cash Given';
      case 'reconcile':
        return 'Reconciled';
      case 'delivery_payment':
        return 'Delivery Payment';
      default:
        return 'Transaction';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'give_cash':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'reconcile':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'delivery_payment':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalGiven = transactions
    .filter(t => t.type === 'give_cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReconciled = transactions
    .filter(t => t.type === 'reconcile')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cash History - ${riderName}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Given</p>
                <p className="text-2xl font-bold text-green-600">₺{totalGiven.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reconciled</p>
                <p className="text-2xl font-bold text-blue-600">₺{totalReconciled.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <ArrowDownLeft className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              aria-label="Filter transactions by type"
            >
              <option value="all">All Types</option>
              <option value="give_cash">Cash Given</option>
              <option value="reconcile">Reconciled</option>
              <option value="delivery_payment">Delivery Payment</option>
            </select>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-500">Loading transactions...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <Card key={transaction._id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTransactionTypeColor(transaction.type)}`}>
                          {getTransactionTypeLabel(transaction.type)}
                        </span>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          ₺{transaction.amount.toFixed(2)}
                        </span>
                      </div>
                      {transaction.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {transaction.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>By {transaction.given_by_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(transaction.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Close</span>
          </Button>
          <Button
            onClick={loadTransactions}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
