import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertTriangle, Plus, CreditCard, Banknote, Smartphone, Coins } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Modal } from './Modal';
import { toast } from 'react-hot-toast';
import { Transaction as TransactionType, PaymentMethod } from '../../types';

interface TransactionItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionType | null;
  onSave: (transactionId: string, updates: {
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
    }>;
    payment_methods: PaymentMethod[];
    customer_id?: string;
    notes?: string;
  }) => Promise<void>;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSave
}) => {
  const [editedItems, setEditedItems] = useState<TransactionItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [remainingAmount, setRemainingAmount] = useState(0);

  const paymentTypes = [
    { id: 'cash', label: 'Cash', icon: Banknote, color: 'green' },
    { id: 'pos_isbank_transfer', label: 'POS/Isbank Transfer', icon: CreditCard, color: 'blue' },
    { id: 'naira_transfer', label: 'Naira Transfer', icon: Smartphone, color: 'purple' },
    { id: 'crypto_payment', label: 'Crypto Payment', icon: Coins, color: 'orange' },
  ];

  // Initialize form data when transaction changes
  useEffect(() => {
    if (transaction) {
      setEditedItems([...transaction.items]);
      
      // Handle both new (payment_methods array) and legacy (single payment_method) formats
      if (transaction.payment_methods && transaction.payment_methods.length > 0) {
        setPaymentMethods([...transaction.payment_methods]);
      } else if (transaction.payment_method) {
        // Convert legacy single payment method to array format
        setPaymentMethods([{
          type: transaction.payment_method as 'cash' | 'pos_isbank_transfer' | 'naira_transfer' | 'crypto_payment' | 'card',
          amount: transaction.total_amount
        }]);
      } else {
        setPaymentMethods([]);
      }
      
      setCustomerId(transaction.customer_id || '');
      setNotes(transaction.notes || '');
    }
  }, [transaction]);

  // Calculate total amount from edited items
  const totalAmount = editedItems.reduce((sum, item) => sum + item.total_price, 0);

  const getTotalPaid = useCallback(() => {
    return paymentMethods.reduce((sum, method) => sum + (method.amount || 0), 0);
  }, [paymentMethods]);

  // Calculate remaining amount based on current payments
  useEffect(() => {
    const totalPaid = getTotalPaid();
    setRemainingAmount(totalAmount - totalPaid);
  }, [getTotalPaid, totalAmount]);

  const addPaymentMethod = () => {
    if (paymentMethods.length >= 3) return;
    
    const currentTotalPaid = getTotalPaid();
    const remaining = totalAmount - currentTotalPaid;
    
    // If this is the first payment method, set it to the full amount
    // If there are existing payments, set it to the remaining amount
    const newAmount = paymentMethods.length === 0 ? totalAmount : remaining;
    
    setPaymentMethods([...paymentMethods, { type: 'cash', amount: newAmount }]);
  };

  const removePaymentMethod = (index: number) => {
    const newMethods = paymentMethods.filter((_, i) => i !== index);
    setPaymentMethods(newMethods);
  };

  const updatePaymentMethod = (index: number, field: keyof PaymentMethod, value: any) => {
    const newMethods = [...paymentMethods];
    
    if (field === 'amount') {
      const newAmount = parseFloat(value) || 0;
      newMethods[index] = { ...newMethods[index], [field]: newAmount };
      
      // Smart adjustment: if this is the last payment method and it's being edited,
      // automatically adjust it to cover the remaining amount
      if (index === newMethods.length - 1 && newMethods.length > 1) {
        const otherPaymentsTotal = newMethods
          .filter((_, i) => i !== index)
          .reduce((sum, method) => sum + (method.amount || 0), 0);
        const remaining = totalAmount - otherPaymentsTotal;
        
        // If the user is trying to set an amount that would exceed the total,
        // cap it at the remaining amount
        if (newAmount > remaining) {
          newMethods[index] = { ...newMethods[index], amount: remaining };
        }
      }
    } else {
      newMethods[index] = { ...newMethods[index], [field]: value };
    }
    
    setPaymentMethods(newMethods);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    if (quantity < 0) return;
    
    const updatedItems = [...editedItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
      total_price: quantity * updatedItems[index].unit_price
    };
    setEditedItems(updatedItems);
  };

  const handleUnitPriceChange = (index: number, unitPrice: number) => {
    if (unitPrice < 0) return;
    
    const updatedItems = [...editedItems];
    updatedItems[index] = {
      ...updatedItems[index],
      unit_price: unitPrice,
      total_price: unitPrice * updatedItems[index].quantity
    };
    setEditedItems(updatedItems);
  };

  const handleSave = async () => {
    if (!transaction) return;

    // Validate payment methods
    const totalPaid = getTotalPaid();
    if (totalPaid !== totalAmount) {
      toast.error(`Payment total (₺${totalPaid.toLocaleString()}) must equal transaction total (₺${totalAmount.toLocaleString()})`);
      return;
    }

    if (paymentMethods.length === 0) {
      toast.error('At least one payment method is required');
      return;
    }

    try {
      setIsSaving(true);
      
      const updates = {
        items: editedItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        payment_methods: paymentMethods,
        customer_id: customerId || undefined,
        notes: notes || undefined
      };

      await onSave(transaction._id, updates);
      // Don't show toast here - let the parent component handle it
      onClose();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      toast.error('Failed to update transaction');
    } finally {
      setIsSaving(false);
    }
  };

  if (!transaction) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Edit Transaction
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Transaction Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Items
            </h3>
            <div className="space-y-4">
              {editedItems.map((item, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {item.product_name}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Total: ₺{item.total_price.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Unit Price (₺)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleUnitPriceChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Payment Methods
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPaymentMethod}
                disabled={paymentMethods.length >= 3}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Payment</span>
              </Button>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((method, index) => {
                const paymentType = paymentTypes.find(type => type.id === method.type);
                const IconComponent = paymentType?.icon || Banknote;
                
                return (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          paymentType?.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
                          paymentType?.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
                          paymentType?.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :
                          'bg-orange-100 dark:bg-orange-900/20'
                        }`}>
                          <IconComponent className={`h-4 w-4 ${
                            paymentType?.color === 'green' ? 'text-green-600 dark:text-green-400' :
                            paymentType?.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                            paymentType?.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                            'text-orange-600 dark:text-orange-400'
                          }`} />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {paymentType?.label || 'Payment Method'}
                        </span>
                      </div>
                      {paymentMethods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePaymentMethod(index)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Remove payment method"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Payment Type
                        </label>
                        <select
                          value={method.type}
                          onChange={(e) => updatePaymentMethod(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          aria-label="Payment Type"
                          title="Payment Type"
                        >
                          {paymentTypes.map(type => (
                            <option key={type.id} value={type.id}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Amount (₺)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={method.amount}
                          onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Summary */}
            {paymentMethods.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-blue-700 dark:text-blue-300">
                    Total Paid: ₺{getTotalPaid().toLocaleString()}
                  </span>
                  <span className={`font-medium ${
                    remainingAmount === 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {remainingAmount === 0 ? 'Fully Paid' : `Remaining: ₺${remainingAmount.toLocaleString()}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Customer ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Customer ID (Optional)
            </label>
            <Input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Enter customer ID"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Total Amount */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Total Amount:
              </span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                ₺{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">Important:</p>
                <p>Editing transaction quantities will automatically update inventory levels. Make sure the changes are correct before saving.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
