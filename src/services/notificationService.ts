/**
 * Notification Service
 * Centralized service for creating notifications for all platform events
 */

import { Notification } from '../components/ui/NotificationDropdown';

export interface NotificationData {
  type: Notification['type'];
  priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  data?: any;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class NotificationService {
  private addNotificationCallback: ((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void) | null = null;

  /**
   * Register the notification context's addNotification function
   */
  registerAddNotification(callback: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void) {
    this.addNotificationCallback = callback;
  }

  /**
   * Add a notification
   */
  private addNotification(data: NotificationData) {
    if (!this.addNotificationCallback) {
      console.warn('Notification service not registered. Call registerAddNotification first.');
      return;
    }

    this.addNotificationCallback({
      type: data.type,
      priority: data.priority || 'MEDIUM',
      title: data.title,
      message: data.message,
      data: data.data,
      action: data.action,
    });
  }

  // ========== SALES & TRANSACTIONS ==========
  
  notifySaleCompleted(amount: number, transactionId: string, itemCount: number, paymentMethod: string) {
    this.addNotification({
      type: 'success',
      priority: 'MEDIUM',
      title: 'Sale Completed',
      message: `Successfully processed sale of ₺${amount.toFixed(2)} for ${itemCount} item${itemCount !== 1 ? 's' : ''} via ${paymentMethod}. Transaction ID: ${transactionId.slice(-6)}`,
      data: { transactionId, amount, itemCount, paymentMethod },
    });
  }

  notifyLowStock(productName: string, currentStock: number, minStock: number) {
    this.addNotification({
      type: 'warning',
      priority: currentStock === 0 ? 'URGENT' : 'HIGH',
      title: currentStock === 0 ? 'Out of Stock' : 'Low Stock Alert',
      message: `${productName} is ${currentStock === 0 ? 'out of stock' : `running low (${currentStock} remaining, minimum: ${minStock})`}. Please restock soon.`,
      data: { productName, currentStock, minStock },
      action: {
        label: 'View Product',
        onClick: () => window.location.href = '/products',
      },
    });
  }

  notifyStockRestocked(productName: string, quantityAdded: number, newStock: number) {
    this.addNotification({
      type: 'success',
      priority: 'LOW',
      title: 'Stock Restocked',
      message: `Added ${quantityAdded} units to ${productName}. New stock level: ${newStock}`,
      data: { productName, quantityAdded, newStock },
    });
  }

  // ========== EXPENSES ==========

  notifyExpenseAdded(amount: number, productName: string, category: string) {
    this.addNotification({
      type: 'info',
      priority: 'MEDIUM',
      title: 'Expense Recorded',
      message: `Expense of ₺${amount.toFixed(2)} added for ${productName} (${category})`,
      data: { amount, productName, category },
      action: {
        label: 'View Expenses',
        onClick: () => window.location.href = '/expenses',
      },
    });
  }

  notifyExpenseUpdated(amount: number, productName: string) {
    this.addNotification({
      type: 'info',
      priority: 'LOW',
      title: 'Expense Updated',
      message: `Updated expense for ${productName} to ₺${amount.toFixed(2)}`,
      data: { amount, productName },
    });
  }

  notifyExpenseDeleted(productName: string, amount: number) {
    this.addNotification({
      type: 'info',
      priority: 'LOW',
      title: 'Expense Deleted',
      message: `Deleted expense of ₺${amount.toFixed(2)} for ${productName}`,
      data: { productName, amount },
    });
  }

  // ========== PRODUCTS ==========

  notifyProductCreated(productName: string, price: number, stock: number) {
    this.addNotification({
      type: 'success',
      priority: 'MEDIUM',
      title: 'Product Added',
      message: `Added new product: ${productName} (₺${price.toFixed(2)}, Stock: ${stock})`,
      data: { productName, price, stock },
      action: {
        label: 'View Product',
        onClick: () => window.location.href = '/products',
      },
    });
  }

  notifyProductUpdated(productName: string, changes: string[]) {
    this.addNotification({
      type: 'info',
      priority: 'LOW',
      title: 'Product Updated',
      message: `Updated ${productName}: ${changes.join(', ')}`,
      data: { productName, changes },
    });
  }

  notifyProductDeleted(productName: string) {
    this.addNotification({
      type: 'warning',
      priority: 'MEDIUM',
      title: 'Product Deleted',
      message: `Product "${productName}" has been deleted from inventory`,
      data: { productName },
    });
  }

  notifyPriceChanged(productName: string, oldPrice: number, newPrice: number) {
    const change = newPrice - oldPrice;
    const changePercent = ((change / oldPrice) * 100).toFixed(1);
    
    this.addNotification({
      type: 'info',
      priority: 'MEDIUM',
      title: 'Price Updated',
      message: `${productName} price changed from ₺${oldPrice.toFixed(2)} to ₺${newPrice.toFixed(2)} (${change >= 0 ? '+' : ''}${changePercent}%)`,
      data: { productName, oldPrice, newPrice, change },
    });
  }

  // ========== GOALS & ACHIEVEMENTS ==========

  notifyDailyGoalAchieved(targetAmount: number, actualAmount: number, goalName: string) {
    this.addNotification({
      type: 'ACHIEVEMENT',
      priority: 'HIGH',
      title: '🎉 Daily Goal Achieved!',
      message: `Congratulations! You've reached your daily sales target of ₺${targetAmount.toLocaleString()}. Current sales: ₺${actualAmount.toLocaleString()}`,
      data: { targetAmount, actualAmount, goalName, goalType: 'daily' },
      action: {
        label: 'View Dashboard',
        onClick: () => window.location.href = '/dashboard',
      },
    });
  }

  notifyMonthlyGoalAchieved(targetAmount: number, actualAmount: number, goalName: string) {
    this.addNotification({
      type: 'ACHIEVEMENT',
      priority: 'HIGH',
      title: '🏆 Monthly Goal Achieved!',
      message: `Outstanding! You've reached your monthly sales target of ₺${targetAmount.toLocaleString()}. Current sales: ₺${actualAmount.toLocaleString()}`,
      data: { targetAmount, actualAmount, goalName, goalType: 'monthly' },
      action: {
        label: 'View Dashboard',
        onClick: () => window.location.href = '/dashboard',
      },
    });
  }

  notifyGoalProgress(goalType: 'daily' | 'monthly', progress: number, target: number, current: number) {
    const percentage = Math.round((current / target) * 100);
    
    if (percentage >= 100) return; // Don't notify if already achieved
    
    this.addNotification({
      type: 'GOAL_REMINDER',
      priority: percentage >= 80 ? 'HIGH' : 'MEDIUM',
      title: `${goalType === 'daily' ? 'Daily' : 'Monthly'} Goal Progress`,
      message: `You're at ${percentage}% of your ${goalType} goal (₺${current.toLocaleString()} / ₺${target.toLocaleString()})`,
      data: { goalType, progress, target, current, percentage },
      action: {
        label: 'View Progress',
        onClick: () => window.location.href = '/dashboard',
      },
    });
  }

  // ========== INVENTORY ==========

  notifyInventoryAlert(productName: string, alertType: 'out_of_stock' | 'low_stock', currentStock: number, minStock: number) {
    this.addNotification({
      type: alertType === 'out_of_stock' ? 'error' : 'warning',
      priority: alertType === 'out_of_stock' ? 'URGENT' : 'HIGH',
      title: alertType === 'out_of_stock' ? 'Out of Stock' : 'Low Stock Warning',
      message: `${productName} is ${alertType === 'out_of_stock' ? 'completely out of stock' : `running low (${currentStock} units, minimum: ${minStock})`}. Immediate restocking recommended.`,
      data: { productName, alertType, currentStock, minStock },
      action: {
        label: 'Manage Inventory',
        onClick: () => window.location.href = '/products',
      },
    });
  }

  // ========== DAILY SUMMARIES ==========

  notifyDailySummary(sales: number, expenses: number, profit: number, transactions: number) {
    this.addNotification({
      type: 'DAILY_SUMMARY',
      priority: 'MEDIUM',
      title: 'Daily Summary',
      message: `Today's performance: ${transactions} transactions, ₺${sales.toFixed(2)} sales, ₺${expenses.toFixed(2)} expenses, ₺${profit.toFixed(2)} profit`,
      data: { sales, expenses, profit, transactions, date: new Date().toISOString().split('T')[0] },
      action: {
        label: 'View Dashboard',
        onClick: () => window.location.href = '/dashboard',
      },
    });
  }

  // ========== PAYMENT PROCESSING ==========

  notifyPaymentProcessed(amount: number, paymentMethods: string[], transactionId: string) {
    this.addNotification({
      type: 'success',
      priority: 'MEDIUM',
      title: 'Payment Processed',
      message: `Payment of ₺${amount.toFixed(2)} processed successfully via ${paymentMethods.join(', ')}. Transaction: ${transactionId.slice(-6)}`,
      data: { amount, paymentMethods, transactionId },
    });
  }

  notifyPaymentFailed(reason: string) {
    this.addNotification({
      type: 'error',
      priority: 'HIGH',
      title: 'Payment Failed',
      message: `Payment processing failed: ${reason}. Please try again or contact support.`,
      data: { reason },
    });
  }

  // ========== SYSTEM & ERRORS ==========

  notifyError(title: string, message: string, data?: any) {
    this.addNotification({
      type: 'error',
      priority: 'HIGH',
      title,
      message,
      data,
    });
  }

  notifyInfo(title: string, message: string, data?: any) {
    this.addNotification({
      type: 'info',
      priority: 'MEDIUM',
      title,
      message,
      data,
    });
  }

  notifySuccess(title: string, message: string, data?: any) {
    this.addNotification({
      type: 'success',
      priority: 'MEDIUM',
      title,
      message,
      data,
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

