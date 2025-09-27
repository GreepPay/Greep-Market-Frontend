import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Loader2, Scan, Package, DollarSign, Tag, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Input } from './Input';
import { Button } from './Button';
import CategorySelect from './CategorySelect';
import { TagsDropdown } from './TagsDropdown';

interface ProductFormData {
  name: string;
  barcode: string;
  price: string;
  category: string;
  unit: string;
  stock_quantity: string;
  min_stock_level: string;
  description: string;
  sku: string;
  tags: string[];
}

interface FieldValidation {
  isValid: boolean;
  message?: string;
  isChecking?: boolean;
}

interface FormValidation {
  name: FieldValidation;
  barcode: FieldValidation;
  price: FieldValidation;
  category: FieldValidation;
  sku: FieldValidation;
  stock_quantity: FieldValidation;
  min_stock_level: FieldValidation;
}

interface EnhancedProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData, images: File[]) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  existingProducts?: any[];
  existingCategories?: string[];
  existingTags?: string[];
}

export const EnhancedProductForm: React.FC<EnhancedProductFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting,
  existingProducts = [],
  existingCategories = [],
  existingTags = []
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    barcode: '',
    price: '',
    category: '',
    unit: 'piece',
    stock_quantity: '',
    min_stock_level: '5',
    description: '',
    sku: '',
    tags: [],
    ...initialData
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [validation, setValidation] = useState<FormValidation>({
    name: { isValid: true },
    barcode: { isValid: true },
    price: { isValid: true },
    category: { isValid: true },
    sku: { isValid: true },
    stock_quantity: { isValid: true },
    min_stock_level: { isValid: true }
  });

  const [isCheckingBarcode, setIsCheckingBarcode] = useState(false);
  const [isCheckingSku, setIsCheckingSku] = useState(false);

  // Real-time validation functions
  const validateName = useCallback((name: string): FieldValidation => {
    if (!name.trim()) {
      return { isValid: false, message: 'Product name is required' };
    }
    if (name.trim().length < 2) {
      return { isValid: false, message: 'Product name must be at least 2 characters' };
    }
    if (name.trim().length > 100) {
      return { isValid: false, message: 'Product name must be less than 100 characters' };
    }
    return { isValid: true };
  }, []);

  const validatePrice = useCallback((price: string): FieldValidation => {
    if (!price.trim()) {
      return { isValid: false, message: 'Price is required' };
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return { isValid: false, message: 'Price must be a positive number' };
    }
    if (numPrice > 999999.99) {
      return { isValid: false, message: 'Price cannot exceed ₺999,999.99' };
    }
    return { isValid: true };
  }, []);

  const validateCategory = useCallback((category: string): FieldValidation => {
    if (!category.trim()) {
      return { isValid: false, message: 'Category is required' };
    }
    return { isValid: true };
  }, []);

  const validateStockQuantity = useCallback((quantity: string): FieldValidation => {
    if (quantity.trim() === '') {
      return { isValid: true }; // Stock quantity is optional
    }
    const numQuantity = parseInt(quantity);
    if (isNaN(numQuantity) || numQuantity < 0) {
      return { isValid: false, message: 'Stock quantity must be a non-negative number' };
    }
    if (numQuantity > 999999) {
      return { isValid: false, message: 'Stock quantity cannot exceed 999,999' };
    }
    return { isValid: true };
  }, []);

  const validateMinStockLevel = useCallback((minLevel: string): FieldValidation => {
    if (!minLevel.trim()) {
      return { isValid: false, message: 'Minimum stock level is required' };
    }
    const numMinLevel = parseInt(minLevel);
    if (isNaN(numMinLevel) || numMinLevel < 0) {
      return { isValid: false, message: 'Minimum stock level must be a non-negative number' };
    }
    if (numMinLevel > 999999) {
      return { isValid: false, message: 'Minimum stock level cannot exceed 999,999' };
    }
    return { isValid: true };
  }, []);

  const validateSku = useCallback((sku: string): FieldValidation => {
    if (sku.trim() === '') {
      return { isValid: true }; // SKU is optional
    }
    if (sku.trim().length < 3) {
      return { isValid: false, message: 'SKU must be at least 3 characters' };
    }
    if (sku.trim().length > 50) {
      return { isValid: false, message: 'SKU must be less than 50 characters' };
    }
    if (!/^[A-Z0-9-_]+$/i.test(sku.trim())) {
      return { isValid: false, message: 'SKU can only contain letters, numbers, hyphens, and underscores' };
    }
    return { isValid: true };
  }, []);

  const validateBarcode = useCallback((barcode: string): FieldValidation => {
    if (barcode.trim() === '') {
      return { isValid: true }; // Barcode is optional
    }
    if (barcode.trim().length < 8) {
      return { isValid: false, message: 'Barcode must be at least 8 characters' };
    }
    if (barcode.trim().length > 20) {
      return { isValid: false, message: 'Barcode must be less than 20 characters' };
    }
    if (!/^[0-9]+$/.test(barcode.trim())) {
      return { isValid: false, message: 'Barcode can only contain numbers' };
    }
    return { isValid: true };
  }, []);

  // Check for duplicate barcode
  const checkBarcodeUniqueness = useCallback(async (barcode: string) => {
    if (!barcode.trim() || !existingProducts.length) return { isValid: true };

    setIsCheckingBarcode(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const isDuplicate = existingProducts.some(product => 
      product.barcode && product.barcode.toLowerCase() === barcode.toLowerCase()
    );
    
    setIsCheckingBarcode(false);
    
    if (isDuplicate) {
      return { 
        isValid: false, 
        message: 'This barcode is already in use by another product' 
      };
    }
    
    return { isValid: true };
  }, [existingProducts]);

  // Check for duplicate SKU
  const checkSkuUniqueness = useCallback(async (sku: string) => {
    if (!sku.trim() || !existingProducts.length) return { isValid: true };

    setIsCheckingSku(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const isDuplicate = existingProducts.some(product => 
      product.sku && product.sku.toLowerCase() === sku.toLowerCase()
    );
    
    setIsCheckingSku(false);
    
    if (isDuplicate) {
      return { 
        isValid: false, 
        message: 'This SKU is already in use by another product' 
      };
    }
    
    return { isValid: true };
  }, [existingProducts]);

  // Real-time validation on field changes
  useEffect(() => {
    const validateField = async (field: keyof FormValidation, value: string) => {
      let fieldValidation: FieldValidation = { isValid: true };

      switch (field) {
        case 'name':
          fieldValidation = validateName(value);
          break;
        case 'price':
          fieldValidation = validatePrice(value);
          break;
        case 'category':
          fieldValidation = validateCategory(value);
          break;
        case 'stock_quantity':
          fieldValidation = validateStockQuantity(value);
          break;
        case 'min_stock_level':
          fieldValidation = validateMinStockLevel(value);
          break;
        case 'sku':
          fieldValidation = validateSku(value);
          if (fieldValidation.isValid && value.trim()) {
            fieldValidation = await checkSkuUniqueness(value);
          }
          break;
        case 'barcode':
          fieldValidation = validateBarcode(value);
          if (fieldValidation.isValid && value.trim()) {
            fieldValidation = await checkBarcodeUniqueness(value);
          }
          break;
      }

      setValidation(prev => ({
        ...prev,
        [field]: fieldValidation
      }));
    };

    // Debounce validation for barcode and SKU to avoid excessive API calls
    const timeoutId = setTimeout(() => {
      if (formData.barcode) validateField('barcode', formData.barcode);
      if (formData.sku) validateField('sku', formData.sku);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData.barcode, formData.sku, validateBarcode, validateSku, checkBarcodeUniqueness, checkSkuUniqueness]);

  // Immediate validation for other fields
  useEffect(() => {
    setValidation(prev => ({
      ...prev,
      name: validateName(formData.name),
      price: validatePrice(formData.price),
      category: validateCategory(formData.category),
      stock_quantity: validateStockQuantity(formData.stock_quantity),
      min_stock_level: validateMinStockLevel(formData.min_stock_level)
    }));
  }, [formData.name, formData.price, formData.category, formData.stock_quantity, formData.min_stock_level, validateName, validatePrice, validateCategory, validateStockQuantity, validateMinStockLevel]);

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file.`);
        return false;
      }
      return true;
    });

    if (selectedImages.length + validFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setSelectedImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validate all required fields
    const requiredFields = ['name', 'price', 'category'];
    const missingFields = requiredFields.filter(field => {
      const value = formData[field as keyof ProductFormData];
      return !value || (typeof value === 'string' && !value.trim());
    });
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Check if any validation failed
    const hasValidationErrors = Object.values(validation).some(field => !field.isValid);
    if (hasValidationErrors) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    // Check if barcode or SKU validation is still in progress
    if (isCheckingBarcode || isCheckingSku) {
      toast.error('Please wait for validation to complete');
      return;
    }

    try {
      await onSubmit(formData, selectedImages);
    } catch (error) {
      console.error('Form submission error:', error);
      // Error handling is done in the parent component
    }
  };

  const isFormValid = Object.values(validation).every(field => field.isValid) && 
                     !isCheckingBarcode && !isCheckingSku &&
                     formData.name.trim() && formData.price.trim() && formData.category.trim();

  const getFieldIcon = (field: keyof FormValidation) => {
    const fieldValidation = validation[field];
    if (fieldValidation.isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (!fieldValidation.isValid) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    const value = formData[field as keyof ProductFormData];
    if (fieldValidation.isValid && value && (typeof value === 'string' ? value.trim() : true)) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
          <Package className="h-5 w-5 mr-2 text-primary-600" />
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Name */}
          <div className="md:col-span-2">
            <div className="relative">
              <Input
                label="Product Name *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
                required
                className={!validation.name.isValid ? 'border-red-500 focus:ring-red-500' : ''}
              />
              <div className="absolute right-3 top-8">
                {getFieldIcon('name')}
              </div>
              {!validation.name.isValid && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {validation.name.message}
                </p>
              )}
            </div>
          </div>

          {/* SKU */}
          <div className="relative">
            <Input
              label="SKU"
              value={formData.sku}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              placeholder="Auto-generated if empty"
              className={!validation.sku.isValid ? 'border-red-500 focus:ring-red-500' : ''}
            />
            <div className="absolute right-3 top-8">
              {getFieldIcon('sku')}
            </div>
            {!validation.sku.isValid && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {validation.sku.message}
              </p>
            )}
          </div>

          {/* Barcode */}
          <div className="relative">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  label="Barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  placeholder="Enter barcode or scan"
                  className={!validation.barcode.isValid ? 'border-red-500 focus:ring-red-500' : ''}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-6 px-3"
                title="Scan barcode"
              >
                <Scan className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute right-12 top-8">
              {getFieldIcon('barcode')}
            </div>
            {!validation.barcode.isValid && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {validation.barcode.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="relative">
            <CategorySelect
              label="Category *"
              value={formData.category}
              onChange={(category: string) => handleInputChange('category', category)}
              existingCategories={existingCategories.filter(cat => cat !== 'all')}
              placeholder="Select or add a category"
              required
            />
            <div className="absolute right-3 top-8">
              {getFieldIcon('category')}
            </div>
            {!validation.category.isValid && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {validation.category.message}
              </p>
            )}
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unit *
            </label>
            <select
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              aria-label="Select unit"
            >
              <option value="piece">Piece</option>
              <option value="kg">Kg</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter product description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-primary-600" />
          Pricing & Inventory
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Price */}
          <div className="relative">
            <Input
              label="Price (₺) *"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="0.00"
              required
              className={!validation.price.isValid ? 'border-red-500 focus:ring-red-500' : ''}
            />
            <div className="absolute right-3 top-8">
              {getFieldIcon('price')}
            </div>
            {!validation.price.isValid && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {validation.price.message}
              </p>
            )}
          </div>

          {/* Stock Quantity */}
          <div className="relative">
            <Input
              label="Stock Quantity"
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
              placeholder="0"
              className={!validation.stock_quantity.isValid ? 'border-red-500 focus:ring-red-500' : ''}
            />
            <div className="absolute right-3 top-8">
              {getFieldIcon('stock_quantity')}
            </div>
            {!validation.stock_quantity.isValid && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {validation.stock_quantity.message}
              </p>
            )}
          </div>

          {/* Minimum Stock Level */}
          <div className="relative">
            <Input
              label="Minimum Stock Level"
              type="number"
              value={formData.min_stock_level}
              onChange={(e) => handleInputChange('min_stock_level', e.target.value)}
              placeholder="5"
              className={!validation.min_stock_level.isValid ? 'border-red-500 focus:ring-red-500' : ''}
            />
            <div className="absolute right-3 top-8">
              {getFieldIcon('min_stock_level')}
            </div>
            {!validation.min_stock_level.isValid && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {validation.min_stock_level.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
          <Tag className="h-5 w-5 mr-2 text-primary-600" />
          Tags
        </h3>
        <TagsDropdown
          label="Tags"
          value={formData.tags}
          onChange={(tags) => handleInputChange('tags', tags as any)}
          existingTags={existingTags}
          placeholder="Add tags..."
          maxTags={10}
        />
      </div>

      {/* Image Upload */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
          <ImageIcon className="h-5 w-5 mr-2 text-primary-600" />
          Product Images
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ImageIcon className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> product images
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or WEBP (MAX. 5 images, 5MB each)</p>
              </div>
              <input
                type="file"
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </div>
          
          {selectedImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          loading={isSubmitting}
          className="min-w-[140px]"
        >
          {isSubmitting ? 'Adding Product...' : 'Add Product'}
        </Button>
      </div>

      {/* Validation Summary */}
      {!isFormValid && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Please fix the following issues:</p>
              <ul className="list-disc list-inside space-y-1">
                {!formData.name.trim() && <li>Product name is required</li>}
                {!formData.price.trim() && <li>Price is required</li>}
                {!formData.category.trim() && <li>Category is required</li>}
                {Object.entries(validation).map(([field, validation]) => 
                  !validation.isValid && (
                    <li key={field}>
                      {field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}: {validation.message}
                    </li>
                  )
                )}
                {(isCheckingBarcode || isCheckingSku) && <li>Please wait for validation to complete</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
