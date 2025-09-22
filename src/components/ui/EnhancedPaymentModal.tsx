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

  useEffect(() => {
    setRemainingAmount(totalAmount);
  }, [totalAmount, paymentMethods]);

  const addPaymentMethod = () => {
    if (paymentMethods.length >= 3) return;
    
    setPaymentMethods([...paymentMethods, { type: 'cash', amount: 0 }]);
  };

  const removePaymentMethod = (index: number) => {
    const newMethods = paymentMethods.filter((_, i) => i !== index);
    setPaymentMethods(newMethods);
  };

  const updatePaymentMethod = (index: number, field: keyof PaymentMethod, value: any) => {
    const newMethods = [...paymentMethods];
    newMethods[index] = { ...newMethods[index], [field]: value };
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
              <span className="font-semibold">₺{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Discount:</span>
              <span className="font-semibold text-green-600">-₺{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tax:</span>
              <span className="font-semibold">₺{taxAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                <span className="font-bold text-lg">₺{totalAmount.toFixed(2)}</span>
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
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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

          {paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No payment methods added yet</p>
              <p className="text-sm">Click "Add Payment" to add a payment method</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method, index) => {
                const paymentType = paymentTypes.find(pt => pt.id === method.type);
                const Icon = paymentType?.icon || Banknote;
                
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
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
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {paymentTypes.map((pt) => (
                        <option key={pt.id} value={pt.id}>{pt.label}</option>
                      ))}
                    </select>
                    
                    <Input
                      type="number"
                      value={method.amount}
                      onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder="Amount"
                      className="flex-1"
                    />
                    
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
                <span className={`font-semibold ${isPaymentComplete() ? 'text-green-600' : 'text-orange-600'}`}>
                  ₺{getTotalPaid().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                <span className={`font-semibold ${remainingAmount <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₺{remainingAmount.toFixed(2)}
                </span>
              </div>
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
            {isPaymentComplete() ? 'Process Payment' : `Pay ₺${remainingAmount.toFixed(2)} More`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
