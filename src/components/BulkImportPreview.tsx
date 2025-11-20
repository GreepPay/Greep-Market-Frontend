import React, { useState } from 'react';
import { X, Save, AlertCircle, CheckCircle, Image, Trash2, Plus } from 'lucide-react';
import { Product } from '../types';
import toast from 'react-hot-toast';

interface BulkImportPreviewProps {
  products: Partial<Product>[];
  onSave: (products: Partial<Product>[]) => Promise<void>;
  onClose: () => void;
}

interface EditableProduct extends Partial<Product> {
  id: string;
  isNew: boolean;
  errors: string[];
}

const BulkImportPreview: React.FC<BulkImportPreviewProps> = ({ products, onSave, onClose }) => {
  const [editableProducts, setEditableProducts] = useState<EditableProduct[]>(() =>
    products.map((product, index) => ({
      ...product,
      id: `temp-${index}`,
      isNew: true,
      errors: []
    }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImageFiles, setSelectedImageFiles] = useState<{ [key: string]: File }>({});

  const validateProduct = (product: EditableProduct): string[] => {
    const errors: string[] = [];
    
    if (!product.name || product.name.trim() === '') {
      errors.push('Product name is required');
    }
    
    if (!product.price || product.price <= 0) {
      errors.push('Valid price is required');
    }
    
    if (!product.category || product.category.trim() === '') {
      errors.push('Category is required');
    }
    
    if (product.stock_quantity !== undefined && product.stock_quantity < 0) {
      errors.push('Stock quantity cannot be negative');
    }
    
    if (product.min_stock_level !== undefined && product.min_stock_level < 0) {
      errors.push('Min stock level cannot be negative');
    }

    return errors;
  };

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setEditableProducts(prev => 
      prev.map(product => {
        if (product.id === id) {
          const updated = { ...product, [field]: value } as EditableProduct;
          updated.errors = validateProduct(updated);
          return updated;
        }
        return product;
      })
    );
  };

  const removeProduct = (id: string) => {
    setEditableProducts(prev => prev.filter(product => product.id !== id));
  };

  const addNewProduct = () => {
    const newProduct: EditableProduct = {
      id: `temp-${Date.now()}`,
      name: '',
      description: '',
      sku: '',
      barcode: '',
      category: '',
      price: 0,
      cost_price: 0,
      stock_quantity: 0,
      min_stock_level: 0,
      unit: 'Piece',
      tags: [],
      isNew: true,
      errors: []
    };
    setEditableProducts(prev => [...prev, newProduct]);
  };

  const handleImageUpload = (productId: string, file: File) => {
    setSelectedImageFiles(prev => ({
      ...prev,
      [productId]: file
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Validate all products
      const validProducts = editableProducts.filter(product => {
        const errors = validateProduct(product);
        return errors.length === 0;
      });

      if (validProducts.length === 0) {
        toast.error('No valid products to import');
        return;
      }

      // Convert to the format expected by the API
      const productsToSave = validProducts.map(product => {
        const { id, isNew, errors, ...productData } = product;
        return productData;
      });

      await onSave(productsToSave);
      toast.success(`Successfully imported ${validProducts.length} products`);
      onClose();
    } catch (error) {
      toast.error('Failed to import products');
      console.error('Import error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const validProductsCount = editableProducts.filter(p => p.errors.length === 0).length;
  const totalProducts = editableProducts.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center py-8 px-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Review & Edit Products</h2>
            <p className="text-sm text-gray-600 mt-1">
              {validProductsCount} of {totalProducts} products ready to import
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="Close"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            {editableProducts.map((product, index) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">
                    Product #{index + 1} {product.name || 'Unnamed Product'}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {product.errors.length === 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove product"
                      aria-label={`Remove product ${product.name || 'Unnamed Product'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {product.errors.length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700">Validation Errors:</span>
                    </div>
                    <ul className="text-sm text-red-600 space-y-1">
                      {product.errors.map((error, errorIndex) => (
                        <li key={errorIndex}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Basic Information */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Basic Information</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={product.name || ''}
                        onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter product name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={product.description || ''}
                        onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows={2}
                        placeholder="Enter product description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <input
                        type="text"
                        value={product.category || ''}
                        onChange={(e) => updateProduct(product.id, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter category"
                      />
                    </div>
                  </div>

                  {/* Pricing & Inventory */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Pricing & Inventory</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={product.price || ''}
                        onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={product.cost_price || ''}
                        onChange={(e) => updateProduct(product.id, 'cost_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={product.stock_quantity || ''}
                        onChange={(e) => updateProduct(product.id, 'stock_quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Stock Level
                      </label>
                      <input
                        type="number"
                        value={product.min_stock_level || ''}
                        onChange={(e) => updateProduct(product.id, 'min_stock_level', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Additional Information</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={product.sku || ''}
                        onChange={(e) => updateProduct(product.id, 'sku', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter SKU"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Barcode
                      </label>
                      <input
                        type="text"
                        value={product.barcode || ''}
                        onChange={(e) => updateProduct(product.id, 'barcode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter barcode"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <select
                        value={product.unit || 'Piece'}
                        onChange={(e) => updateProduct(product.id, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="Select unit"
                      >
                        <option value="Piece">Piece</option>
                        <option value="Kg">Kg</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                      </label>
                      <input
                        type="text"
                        value={Array.isArray(product.tags) ? product.tags.join(', ') : ''}
                        onChange={(e) => updateProduct(product.id, 'tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="tag1, tag2, tag3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Image
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(product.id, file);
                          }}
                          className="hidden"
                          id={`image-${product.id}`}
                        />
                        <label
                          htmlFor={`image-${product.id}`}
                          className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          <Image className="h-4 w-4" />
                          <span className="text-sm">
                            {selectedImageFiles[product.id] ? 'Change Image' : 'Add Image'}
                          </span>
                        </label>
                        {selectedImageFiles[product.id] && (
                          <span className="text-sm text-green-600">
                            {selectedImageFiles[product.id].name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={addNewProduct}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {validProductsCount} of {totalProducts} products ready to import
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || validProductsCount === 0}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Import {validProductsCount} Products</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportPreview;
