import React, { forwardRef } from 'react';
import { PaymentMethod } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ReceiptProps {
  transaction: any; // Could use Transaction for strict typing
  onClose?: () => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price);

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ transaction, onClose }, ref) => {
  const { isDark } = useTheme();
  
  if (!transaction) return null;

  return (
    <div ref={ref} className={`receipt-popup bg-white dark:bg-gray-800 p-6 rounded shadow-md max-w-md mx-auto text-gray-900 dark:text-white`}>
      <h2 className="text-lg font-bold mb-2 text-center text-gray-900 dark:text-white">Greep Market</h2>
      <div className="mb-2 text-xs text-center text-gray-600 dark:text-gray-400">Sales Receipt</div>
      <div className="mb-4 text-sm text-gray-700 dark:text-gray-300">
        <div><b className="text-gray-900 dark:text-white">Cashier:</b> <span className="text-gray-700 dark:text-gray-300">{transaction.cashier_id}</span></div>
        <div><b className="text-gray-900 dark:text-white">Store:</b> <span className="text-gray-700 dark:text-gray-300">{transaction.store_id}</span></div>
        <div><b className="text-gray-900 dark:text-white">Date:</b> <span className="text-gray-700 dark:text-gray-300">{new Date(transaction.created_at).toLocaleString('tr-TR')}</span></div>
        {transaction.customer_id && <div><b className="text-gray-900 dark:text-white">Customer:</b> <span className="text-gray-700 dark:text-gray-300">{transaction.customer_id}</span></div>}
        {transaction.payment_methods && transaction.payment_methods.length > 0 && (
          <div><b className="text-gray-900 dark:text-white">Payment Method(s):</b> <span className="text-gray-700 dark:text-gray-300">{transaction.payment_methods.map((pm: PaymentMethod) => pm.type).join(', ')}</span></div>
        )}
      </div>

      <div className="border-t border-b border-gray-300 dark:border-gray-600 py-2 mb-2 text-xs">
        <div className="font-semibold text-gray-900 dark:text-white">Products</div>
        <table className="w-full text-xs mt-1">
          <thead>
            <tr className="text-left text-gray-700 dark:text-gray-300">
              <th className="text-gray-900 dark:text-white">Qty</th>
              <th className="text-gray-900 dark:text-white">Item</th>
              <th className="text-right text-gray-900 dark:text-white">Unit</th>
              <th className="text-right text-gray-900 dark:text-white">Total</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items?.map((item: any, i: number) => (
              <tr key={i} className="text-gray-700 dark:text-gray-300">
                <td>{item.quantity}</td>
                <td>{item.product_name || item.product_id}</td>
                <td className="text-right">{formatPrice(item.unit_price)}</td>
                <td className="text-right">{formatPrice(item.unit_price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mb-2 flex justify-between text-sm text-gray-700 dark:text-gray-300">
        <span>Subtotal:</span> <span className="text-gray-900 dark:text-white font-medium">{formatPrice(transaction.subtotal || 0)}</span>
      </div>
      {transaction.discount_amount ? (
        <div className="mb-2 flex justify-between text-sm text-gray-700 dark:text-gray-300">
          <span>Discount:</span> <span className="text-red-600 dark:text-red-400 font-medium">-{formatPrice(transaction.discount_amount)}</span>
        </div>
      ) : null}
      {transaction.delivery_fee ? (
        <div className="mb-2 flex justify-between text-sm text-gray-700 dark:text-gray-300">
          <span>Shipping:</span> <span className="text-gray-900 dark:text-white font-medium">{formatPrice(transaction.delivery_fee)}</span>
        </div>
      ) : null}
      <div className="mb-2 flex justify-between text-base font-bold border-t border-gray-300 dark:border-gray-600 pt-2 text-gray-900 dark:text-white">
        <span>Total:</span> <span>{formatPrice(transaction.total_amount || 0)}</span>
      </div>
      {transaction.notes && <div className="text-xs mt-2 text-gray-600 dark:text-gray-400 italic">Note: {transaction.notes}</div>}
      <div className="mt-4 flex justify-center gap-3">
        <button
          className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white py-1 px-3 text-xs rounded transition-colors"
          onClick={() => {
            window.print();
          }}
        >
          Print
        </button>
        {onClose && (
          <button className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 px-3 py-1 text-xs rounded transition-colors" onClick={onClose}>Close</button>
        )}
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;
