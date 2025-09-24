import React, { useState, useEffect } from 'react';
import { CreditCard, Banknote, Smartphone, Plus, X, Package, ShoppingBag } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Modal } from './Modal';
import { GlassmorphismIcon } from './GlassmorphismIcon';
import { PaymentMethod, Rider, TransactionItem } from '../../types';

interface EnhancedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessPayment: (paymentData: PaymentData) => Promise<void>;
  cartItems: TransactionItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  riders?: Rider[];
}

export interface PaymentData {
  payment_methods: PaymentMethod[];
  order_source: 'in_store' | 'online';
  rider_id?: string;
  delivery_fee?: number;
  customer_id?: string;
  notes?: string;
}

export const EnhancedPaymentModal: React.FC<EnhancedPaymentModalProps> = ({
  isOpen,
  onClose,
  onProcessPayment,
  cartItems,
  subtotal,
  taxAmount,
  discountAmount,
  totalAmount,
  riders = [],
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [orderSource, setOrderSource] = useState<'in_store' | 'online'>('in_store');
  const [selectedRider, setSelectedRider] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [remainingAmount, setRemainingAmount] = useState(totalAmount);

  const orderSources = [
    { id: 'in_store', label: 'In-Store', icon: ShoppingBag, color: 'green' },
    { id: 'online', label: 'Online', icon: Package, color: 'blue' },
  ];

  const paymentTypes = [
    { id: 'cash', label: 'Cash', icon: Banknote, color: 'green' },
    { id: 'card', label: 'Card/POS', icon: CreditCard, color: 'blue' },
    { id: 'transfer', label: 'Transfer', icon: Smartphone, color: 'purple' },
  ];

  // Calculate remaining amount based on current payments
  useEffect(() => {
    const totalPaid = getTotalPaid();
    setRemainingAmount(totalAmount - totalPaid);
  }, [totalAmount, paymentMethods]);

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
        // automatically adjust it to the remaining amount
        if (newAmount > remaining) {
          newMethods[index] = { ...newMethods[index], amount: remaining };
        }
      }
    } else {
      newMethods[index] = { ...newMethods[index], [field]: value };
    }
    
    setPaymentMethods(newMethods);
  };

  const getTotalPaid = () => {
    return paymentMethods.reduce((sum, method) => sum + (method.amount || 0), 0);
  };

  const isPaymentComplete = () => {
    const totalPaid = getTotalPaid();
    return totalPaid >= totalAmount && paymentMethods.length > 0;
  };

  const canProcessPayment = () => {
    return isPaymentComplete();
  };

  const getPaymentButtonText = () => {
    if (!paymentMethods.length) return 'Add Payment Method';
    if (isPaymentComplete()) {
      if (remainingAmount < 0) {
        return `Process Payment (Overpaid: ₺${Math.abs(remainingAmount).toFixed(2)})`;
      }
      return 'Process Payment';
    }
    return `Pay ₺${remainingAmount.toFixed(2)} More`;
  };

  const handleProcessPayment = async () => {
    if (!canProcessPayment()) return;

    const paymentData: PaymentData = {
      payment_methods: paymentMethods,
      order_source: orderSource,
      customer_id: customerId || undefined,
      notes: notes || undefined,
    };

    try {
      await onProcessPayment(paymentData);
      // Reset form
      setPaymentMethods([]);
      setOrderSource('in_store');
      setCustomerId('');
      setNotes('');
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const resetForm = () => {
    setPaymentMethods([]);
    setOrderSource('in_store');
    setCustomerId('');
    setNotes('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetForm}
      title="Enhanced Payment"
      size="lg"
    >
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Items ({cartItems.length}):</span>
              <span className="font-semibold text-gray-900 dark:text-white">₺{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Discount:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">-₺{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tax:</span>
              <span className="font-semibold text-gray-900 dark:text-white">₺{taxAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                <span className="font-bold text-lg text-gray-900 dark:text-white">₺{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Order Source
          </label>
          <div className="grid grid-cols-2 gap-3">
            {orderSources.map((source) => {
              const Icon = source.icon;
              return (
                <button
                  key={source.id}
                  onClick={() => setOrderSource(source.id as any)}
                  className={`p-3 border-2 rounded-lg text-center transition-all duration-200 ${
                    orderSource === source.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <GlassmorphismIcon
                    icon={Icon}
                    size="sm"
                    variant={source.color as any}
                    className="mx-auto mb-2"
                  />
                  <span className="text-sm font-medium">{source.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Methods
            </label>
            <div className="flex items-center space-x-2">
              {paymentMethods.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const evenAmount = totalAmount / paymentMethods.length;
                    const newMethods = paymentMethods.map(method => ({
                      ...method,
                      amount: evenAmount
                    }));
                    setPaymentMethods(newMethods);
                  }}
                  className="text-xs px-2 py-1"
                  title="Split total evenly across all payment methods"
                >
                  Split Evenly
                </Button>
              )}
              {paymentMethods.length < 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPaymentMethod}
                  className="flex items-center space-x-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Payment</span>
                </Button>
              )}
            </div>
          </div>

          {paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">No payment methods added yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Click "Add Payment" to add a payment method</p>
              <Button
                onClick={addPaymentMethod}
                className="mt-4"
                size="sm"
              >
                Add Payment Method (₺{totalAmount.toFixed(2)})
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method, index) => {
                const paymentType = paymentTypes.find(pt => pt.id === method.type);
                const Icon = paymentType?.icon || Banknote;
                
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <GlassmorphismIcon
                      icon={Icon}
                      size="sm"
                      variant={paymentType?.color as any}
                    />
                    
                    <select
                      value={method.type}
                      onChange={(e) => updatePaymentMethod(index, 'type', e.target.value)}
                      title="Select payment method type"
                      aria-label="Payment method type"
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {paymentTypes.map((pt) => (
                        <option key={pt.id} value={pt.id}>{pt.label}</option>
                      ))}
                    </select>
                    
                    <div className="flex-1 flex items-center space-x-2">
                      <Input
                        type="number"
                        value={method.amount}
                        onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="Amount"
                        className="flex-1"
                        min="0"
                        max={totalAmount}
                        step="0.01"
                      />
                      {remainingAmount > 0 && index === paymentMethods.length - 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updatePaymentMethod(index, 'amount', remainingAmount)}
                          className="text-xs px-2 py-1"
                          title="Fill remaining amount"
                        >
                          Fill
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePaymentMethod(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Payment Summary */}
          {paymentMethods.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Paid:</span>
                <span className={`font-semibold ${isPaymentComplete() ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  ₺{getTotalPaid().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                <span className={`font-semibold ${remainingAmount <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ₺{remainingAmount.toFixed(2)}
                </span>
              </div>
              {remainingAmount < 0 && (
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-gray-600 dark:text-gray-400">Overpaid:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    ₺{Math.abs(remainingAmount).toFixed(2)}
                  </span>
                </div>
              )}
              {isPaymentComplete() && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-medium">
                    <span className="mr-1">✓</span>
                    Payment Complete
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer ID */}
        <Input
          label="Customer ID (Optional)"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          placeholder="Enter customer ID"
        />

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this transaction..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={resetForm}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleProcessPayment}
            disabled={!canProcessPayment()}
            className="flex-1"
          >
            {getPaymentButtonText()}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
