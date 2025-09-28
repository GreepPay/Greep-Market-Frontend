/**
 * Format stock quantity to show whole numbers without decimals, 
 * but limit decimal quantities to 2 decimal places
 */
export const formatStockQuantity = (quantity: number): string => {
  // If it's a whole number, show without decimals
  if (quantity % 1 === 0) {
    return quantity.toString();
  }
  // If it has decimals, limit to 2 decimal places
  return quantity.toFixed(2);
};

/**
 * Format currency amounts (always show 2 decimal places)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
};
