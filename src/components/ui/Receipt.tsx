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
    <>
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 0.5cm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
          }
          
          /* Hide all modals, overlays, and fixed elements */
          body > div:not(:has(.receipt-print-content)),
          [class*="fixed"],
          [class*="inset"],
          [class*="modal"],
          [class*="overlay"],
          [class*="backdrop"],
          [class*="z-50"],
          [class*="z-40"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
          
          /* Show modal container if it has receipt */
          body > div:has(.receipt-print-content) {
            position: static !important;
            display: block !important;
            visibility: visible !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          
          /* Show only receipt content */
          .receipt-print-content {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            left: auto !important;
            top: auto !important;
            right: auto !important;
            bottom: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0.5cm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            overflow: visible !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            transform: none !important;
            opacity: 1 !important;
            z-index: auto !important;
          }
          
          .receipt-print-content * {
            visibility: visible !important;
            color: black !important;
            background: transparent !important;
          }
          
          .receipt-print-content h2 {
            font-size: 18px !important;
            margin-bottom: 0.3cm !important;
            margin-top: 0 !important;
            color: black !important;
            display: block !important;
            font-weight: bold !important;
          }
          
          .receipt-print-content table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 11px !important;
            margin-top: 0.3cm !important;
            margin-bottom: 0.3cm !important;
            page-break-inside: avoid !important;
            display: table !important;
            border: 1px solid #000 !important;
          }
          
          .receipt-print-content thead {
            display: table-header-group !important;
          }
          
          .receipt-print-content tbody {
            display: table-row-group !important;
          }
          
          .receipt-print-content tr {
            display: table-row !important;
            page-break-inside: avoid !important;
          }
          
          .receipt-print-content th,
          .receipt-print-content td {
            padding: 0.2cm 0.3cm !important;
            font-size: 10px !important;
            display: table-cell !important;
            color: black !important;
            background: white !important;
            border: 1px solid #ddd !important;
          }
          
          .receipt-print-content th {
            font-weight: bold !important;
            background: #f5f5f5 !important;
          }
          
          .receipt-print-content div {
            display: block !important;
            color: black !important;
            background: transparent !important;
          }
          
          .receipt-print-content span {
            display: inline !important;
            color: black !important;
            background: transparent !important;
          }
          
          .receipt-print-content .flex {
            display: flex !important;
          }
          
          .receipt-print-content .justify-between {
            justify-content: space-between !important;
          }
          
          .receipt-print-content .border-t {
            border-top: 1px solid #000 !important;
          }
          
          .receipt-print-content .border-b {
            border-bottom: 1px solid #000 !important;
          }
          
          .receipt-no-print {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>
      <div ref={ref} className={`receipt-print-content receipt-popup bg-white dark:bg-gray-800 p-6 rounded shadow-md max-w-md mx-auto text-gray-900 dark:text-white`}>
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
            {transaction.items?.map((item: any, i: number) => {
              const itemTotal = item.unit_price * item.quantity;
              // Try to get VAT from transaction item first, fallback to 0 if not available
              let vatPercentage = item.vat_percentage;
              // If vat_percentage is undefined, null, or 0, check if it should be 0
              if (vatPercentage === undefined || vatPercentage === null) {
                vatPercentage = 0;
              }
              const vatAmount = vatPercentage > 0 ? (itemTotal * vatPercentage) / 100 : 0;
              
              return (
                <React.Fragment key={i}>
                  <tr className="text-gray-700 dark:text-gray-300">
                    <td>{item.quantity}</td>
                    <td>
                      <div className="font-medium">{item.product_name || item.product_id}</div>
                      {vatPercentage > 0 && (
                        <div className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-0.5">
                          VAT {vatPercentage}%
                        </div>
                      )}
                    </td>
                    <td className="text-right">{formatPrice(item.unit_price)}</td>
                    <td className="text-right font-semibold">{formatPrice(itemTotal)}</td>
                  </tr>
                  {vatPercentage > 0 && (
                    <tr className="text-primary-700 dark:text-primary-400 text-xs font-medium bg-primary-50 dark:bg-primary-900/20">
                      <td colSpan={3} className="text-right pr-2 pl-4">
                        VAT ({vatPercentage}%):
                      </td>
                      <td className="text-right font-semibold">{formatPrice(vatAmount)}</td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {(() => {
        // Calculate total VAT from all items (for display only, not added to total)
        const totalVAT = transaction.items?.reduce((sum: number, item: any) => {
          const itemTotal = item.unit_price * item.quantity;
          const vatPercentage = item.vat_percentage || 0;
          return sum + (vatPercentage > 0 ? (itemTotal * vatPercentage) / 100 : 0);
        }, 0) || 0;

        return (
          <>
            <div className="mb-2 flex justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>Subtotal:</span> <span className="text-gray-900 dark:text-white font-medium">{formatPrice(transaction.subtotal || 0)}</span>
            </div>
            {totalVAT > 0 && (
              <div className="mb-2 flex justify-between text-sm text-gray-500 dark:text-gray-400 italic">
                <span>Total VAT (for reference):</span> <span>{formatPrice(totalVAT)}</span>
              </div>
            )}
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
          </>
        );
      })()}
      <div className="mb-2 flex justify-between text-base font-bold border-t border-gray-300 dark:border-gray-600 pt-2 text-gray-900 dark:text-white">
        <span>Total:</span> <span>{formatPrice(transaction.total_amount || 0)}</span>
      </div>
      {transaction.notes && <div className="text-xs mt-2 text-gray-600 dark:text-gray-400 italic">Note: {transaction.notes}</div>}
      <div className="receipt-no-print mt-4 flex justify-center gap-3">
        <button
          className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white py-1 px-3 text-xs rounded transition-colors"
          onClick={() => {
            // Clone receipt content to body for printing
            const receiptContent = document.querySelector('.receipt-print-content');
            if (receiptContent) {
              const printWindow = window.open('', '_blank');
              if (printWindow) {
                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>Receipt - ${transaction._id || 'Sale'}</title>
                      <style>
                        @page {
                          size: auto;
                          margin: 0.5cm;
                        }
                        body {
                          font-family: Arial, sans-serif;
                          font-size: 12px;
                          margin: 0;
                          padding: 0.5cm;
                          color: black;
                          background: white;
                        }
                        h2 {
                          font-size: 18px;
                          font-weight: bold;
                          text-align: center;
                          margin-bottom: 0.3cm;
                        }
                        table {
                          width: 100%;
                          border-collapse: collapse;
                          margin: 0.3cm 0;
                          font-size: 11px;
                        }
                        th, td {
                          padding: 0.2cm 0.3cm;
                          border: 1px solid #ddd;
                          text-align: left;
                        }
                        th {
                          background: #f5f5f5;
                          font-weight: bold;
                        }
                        .text-right {
                          text-align: right;
                        }
                        .text-center {
                          text-align: center;
                        }
                        .border-t {
                          border-top: 1px solid #000;
                          padding-top: 0.2cm;
                          margin-top: 0.2cm;
                        }
                        .font-bold {
                          font-weight: bold;
                        }
                        .flex {
                          display: flex;
                        }
                        .justify-between {
                          justify-content: space-between;
                        }
                      </style>
                    </head>
                    <body>
                      ${receiptContent.innerHTML}
                    </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.onload = () => {
                  printWindow.print();
                  printWindow.close();
                };
              } else {
                // Fallback to regular print
                window.print();
              }
            } else {
              window.print();
            }
          }}
        >
          Print
        </button>
        {onClose && (
          <button className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 px-3 py-1 text-xs rounded transition-colors" onClick={onClose}>Close</button>
        )}
      </div>
      </div>
    </>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;
