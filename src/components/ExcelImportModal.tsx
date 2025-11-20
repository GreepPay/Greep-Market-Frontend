import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { ExcelParserService, ExcelParseResult } from '../services/excelParser';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MappingState {
  [excelColumnIndex: number]: string; // Maps to product field key
}

const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [mappings, setMappings] = useState<MappingState>({});
  const [showPreview, setShowPreview] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productFields = ExcelParserService.getProductFields();

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Please select a valid Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    setFile(selectedFile);
    setStep('mapping');
    setErrors([]);

    try {
      const result = await ExcelParserService.parseExcelFile(selectedFile);
      setParseResult(result);

      // Auto-apply suggested mappings
      const autoMappings: MappingState = {};
      result.suggestedMappings.forEach(mapping => {
        if (mapping.confidence > 0.6) { // High confidence auto-mapping
          autoMappings[mapping.excelColumnIndex] = mapping.productField;
        }
      });
      setMappings(autoMappings);

      toast.success(`File parsed successfully! Found ${result.totalRows} products to import.`);
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast.error('Failed to parse Excel file. Please check the file format.');
      setStep('upload');
    }
  };

  const handleMappingChange = (excelColumnIndex: number, productField: string) => {
    setMappings(prev => ({
      ...prev,
      [excelColumnIndex]: productField
    }));
  };

  const removeMapping = (excelColumnIndex: number) => {
    setMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[excelColumnIndex];
      return newMappings;
    });
  };

  const validateMappings = (): boolean => {
    const requiredFields = productFields.filter(field => field.required);
    const mappedFields = Object.values(mappings);
    
    for (const requiredField of requiredFields) {
      if (!mappedFields.includes(requiredField.key)) {
        toast.error(`Required field "${requiredField.label}" is not mapped`);
        return false;
      }
    }
    
    return true;
  };

  const handlePreview = () => {
    if (!validateMappings()) return;
    setStep('preview');
  };

  const handleImport = async () => {
    if (!parseResult || !validateMappings()) {
      console.error('Import failed: parseResult is undefined or mappings are invalid');
      return;
    }

    setStep('importing');
    setImportProgress(0);
    setImportedCount(0);
    setTotalProducts(0);
    setErrors([]);

    try {
      const products = [];
      const dataRows = parseResult.data?.slice(parseResult.headerRowIndex + 1) || [];
      
      // Set total products count for progress tracking
      setTotalProducts(dataRows.length);
      
      if (dataRows.length === 0) {
        toast.error('No data rows found to import');
        setStep('preview');
        return;
      }
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const product: any = {};

        // Map each column to product field
        Object.entries(mappings).forEach(([excelColumnIndex, productField]) => {
          const columnIndex = parseInt(excelColumnIndex);
          const rawValue = row[columnIndex];
          
          // Debug: Log the raw value and field mapping
          
            // Process all values, including empty ones for required fields
            if (rawValue !== undefined && rawValue !== null) {
              const field = productFields.find(f => f.key === productField);
              if (field) {
                let transformedValue;
                
                // Apply transformation based on field type
                if (field.dataType === 'number') {
                  const num = parseFloat(String(rawValue).replace(/[^\d.-]/g, ''));
                  transformedValue = isNaN(num) ? 0 : num;
                } else if (field.dataType === 'boolean') {
                  const str = String(rawValue).toLowerCase();
                  transformedValue = str === 'true' || str === 'yes' || str === '1' || str === 'active';
                } else {
                  // For text fields, handle scientific notation and other formats
                  let stringValue = String(rawValue).trim();
                  
                  // Handle scientific notation (e.g., 6.00617E+12)
                  if (stringValue.includes('E+') || stringValue.includes('e+')) {
                    const num = parseFloat(stringValue);
                    if (!isNaN(num)) {
                      // Convert to string without scientific notation
                      stringValue = num.toFixed(0);
                    }
                  }
                  
                  transformedValue = stringValue;
                }
                
                // Set the value (allow empty strings for text fields)
                product[productField] = transformedValue;
              }
            }
        });

         // Ensure ALL required fields have values (even if empty for later editing)
         product.name = product.name || `Product ${i + 1}`;
         product.price = product.price || 0;
         product.stock_quantity = product.stock_quantity || 0;
         product.category = product.category || 'Uncategorized';
         product.unit = product.unit || 'Piece';
         // Generate unique SKU with row index to ensure uniqueness
         const skuPrefix = product.name ? product.name.substring(0, 3).toUpperCase() : 'PRD';
         product.sku = product.sku || `SKU-${skuPrefix}-${String(i + 1).padStart(4, '0')}`;
         product.description = product.description || ''; // Ensure description is always a string
         product.barcode = product.barcode || '';
         
         // Add required backend fields - ensure they are never undefined/null
         product.store_id = user?.store_id || 'default-store';
         product.created_by = user?.id || 'default-user';
         product.is_active = true;
         product.is_featured = false;
         
         // Handle tags - convert string to array if needed
         if (typeof product.tags === 'string') {
           product.tags = product.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
         } else {
           product.tags = product.tags || [];
         }
         
         product.images = [];
         product.min_stock_level = product.min_stock_level || 5; // Default to 5 if not provided

        // Final validation - ensure all required fields are present and not undefined/null
        const requiredFields = ['name', 'price', 'category', 'sku', 'stock_quantity', 'store_id', 'created_by'];
        const missingFields = requiredFields.filter(field => 
          product[field] === undefined || product[field] === null
        );
        
        if (missingFields.length > 0) {
          // Set defaults for any still missing fields
          missingFields.forEach(field => {
            switch (field) {
              case 'name':
                product.name = `Product ${i + 1}`;
                break;
              case 'price':
                product.price = 0;
                break;
              case 'category':
                product.category = 'Uncategorized';
                break;
               case 'sku':
                 const skuPrefix = product.name ? product.name.substring(0, 3).toUpperCase() : 'PRD';
                 product.sku = `SKU-${skuPrefix}-${String(i + 1).padStart(4, '0')}`;
                 break;
              case 'stock_quantity':
                product.stock_quantity = 0;
                break;
              case 'store_id':
                product.store_id = user?.store_id || 'default-store';
                break;
              case 'created_by':
                product.created_by = user?.id || 'default-user';
                break;
            }
          });
        }

        products.push(product);
      }

      // Import products in batches
      const batchSize = 10;
      let successCount = 0;
      const importErrors: string[] = [];

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const batchStartIndex = i;
        
        try {
          await Promise.all(
            batch.map(async (product, batchIndex) => {
              try {
                // Debug: Log the product data being sent
                await apiService.createProduct(product);
                successCount++;
                setImportedCount(successCount);
                
                // Update progress based on actual import progress
                const importProgress = Math.round((successCount / products.length) * 100);
                setImportProgress(importProgress);
              } catch (error: any) {
                console.error(`Failed to import product ${batchStartIndex + batchIndex + 1}:`, error);
                importErrors.push(`Row ${batchStartIndex + batchIndex + 1}: ${error.message || 'Import failed'}`);
                
                // Update progress even for failed imports
                const importProgress = Math.round(((batchStartIndex + batchIndex + 1) / products.length) * 100);
                setImportProgress(importProgress);
              }
            })
          );
        } catch (error) {
          importErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: Import failed`);
        }
      }

      setErrors(importErrors);

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} products!`);
        onSuccess();
        onClose();
      } else {
        toast.error('No products were imported. Please check your data and mappings.');
      }

    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import products');
      setStep('preview');
    }
  };

  const resetModal = () => {
    setStep('upload');
    setFile(null);
    setParseResult(null);
    setMappings({});
    setShowPreview(false);
    setImportProgress(0);
    setImportedCount(0);
    setTotalProducts(0);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center py-8 px-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Import Products from Excel</h2>
            <p className="text-gray-600 mt-1">
              {step === 'upload' && 'Upload your Excel file to get started'}
              {step === 'mapping' && 'Map Excel columns to product fields'}
              {step === 'preview' && 'Review your data before importing'}
              {step === 'importing' && 'Importing products...'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {['upload', 'mapping', 'preview', 'importing'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName 
                    ? 'bg-primary-500 text-white' 
                    : ['upload', 'mapping', 'preview'].indexOf(step) > index
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {['upload', 'mapping', 'preview'].indexOf(step) > index ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step === stepName ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {stepName.charAt(0).toUpperCase() + stepName.slice(1)}
                </span>
                {index < 3 && (
                  <div className={`w-8 h-0.5 ml-4 ${
                    ['upload', 'mapping', 'preview'].indexOf(step) > index 
                      ? 'bg-green-500' 
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'upload' && (
            <div className="text-center">
              <div className="w-24 h-24 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Upload className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Excel File</h3>
              <p className="text-gray-600 mb-6">
                Select an Excel file (.xlsx, .xls) or CSV file containing your product data.
                The system will automatically detect headers and suggest column mappings.
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-medium transition-colors duration-200"
              >
                Choose File
              </button>
              
              {file && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Selected: <span className="font-medium">{file.name}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'mapping' && parseResult && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Map Excel Columns</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                  >
                    {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
                  </button>
                </div>
              </div>

              <p className="text-gray-600">
                Map your Excel columns to product fields. Required fields are marked with *. 
                The system has automatically suggested mappings based on column headers.
              </p>

              {/* Column Mappings */}
              <div className="space-y-4">
                {(parseResult?.columns || []).map((column) => {
                  const currentMapping = mappings[column.index];
                  const field = productFields.find(f => f.key === currentMapping);
                  
                  return (
                    <div key={column.index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">Column {column.index + 1}:</span>
                          <span className="text-gray-700">"{column.header}"</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            column.dataType === 'number' ? 'bg-blue-100 text-blue-700' :
                            column.dataType === 'date' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {column.dataType}
                          </span>
                        </div>
                        {column.sampleValues.length > 0 && (
                          <p className="text-sm text-gray-500">
                            Sample: {column.sampleValues.slice(0, 3).join(', ')}
                            {column.sampleValues.length > 3 && '...'}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <select
                          value={currentMapping || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleMappingChange(column.index, e.target.value);
                            } else {
                              removeMapping(column.index);
                            }
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[200px]"
                          aria-label={`Map column ${column.index + 1} to product field`}
                        >
                          <option value="">-- Select Product Field --</option>
                          {productFields.map(field => (
                            <option key={field.key} value={field.key}>
                              {field.label} {field.required && '*'}
                            </option>
                          ))}
                        </select>
                        
                        {currentMapping && (
                  <button
                    onClick={() => removeMapping(column.index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Remove mapping"
                    aria-label="Remove mapping for column"
                  >
                    <X className="h-4 w-4" />
                  </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Data Preview */}
              {showPreview && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Data Preview (First 5 rows)</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          {(parseResult?.columns || []).map((column) => (
                            <th key={column.index} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                              {column.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(parseResult?.data?.slice(parseResult.headerRowIndex + 1, parseResult.headerRowIndex + 6) || []).map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {(parseResult?.columns || []).map((column) => (
                              <td key={column.index} className="px-4 py-2 text-sm text-gray-900 border-b border-gray-100">
                                {row[column.index] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && parseResult && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">Import Preview</h3>
              <p className="text-gray-600">
                Review the mapped data before importing. {parseResult?.totalRows || 0} products will be imported.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Import Summary</span>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Total rows to import: {parseResult?.totalRows || 0}</li>
                  <li>• Mapped columns: {Object.keys(mappings).length}</li>
                  <li>• Required fields mapped: {productFields.filter(f => f.required && Object.values(mappings).includes(f.key)).length}/{productFields.filter(f => f.required).length}</li>
                </ul>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.entries(mappings).map(([excelIndex, productField]) => {
                        const field = productFields.find(f => f.key === productField);
                        const column = parseResult.columns.find(c => c.index === parseInt(excelIndex));
                        return (
                          <th key={excelIndex} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                            <div>
                              <div className="font-medium">{field?.label}</div>
                              <div className="text-xs text-gray-500">from "{column?.header}"</div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {(parseResult?.data?.slice(parseResult.headerRowIndex + 1, parseResult.headerRowIndex + 6) || []).map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {Object.entries(mappings).map(([excelIndex, productField]) => (
                          <td key={excelIndex} className="px-4 py-2 text-sm text-gray-900 border-b border-gray-100">
                            {row[parseInt(excelIndex)] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto">
                <RefreshCw className="h-12 w-12 text-primary-600 animate-spin" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Importing Products</h3>
                <p className="text-gray-600 mb-4">
                  Please wait while we import your products...
                </p>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-primary-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                    role="progressbar"
                    aria-valuenow={importProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Import progress: ${importProgress}%`}
                  />
                </div>
                
                <p className="text-sm text-gray-600">
                  {importedCount} of {totalProducts || parseResult?.totalRows || 0} products imported ({importProgress}%)
                </p>
              </div>

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-900">Import Errors</span>
                  </div>
                  <ul className="text-sm text-red-800 space-y-1 max-h-32 overflow-y-auto">
                    {errors.slice(0, 10).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {errors.length > 10 && (
                      <li className="text-red-600">... and {errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center space-x-4">
            {step === 'mapping' && (
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Back
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={() => setStep('mapping')}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Back
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            
            {step === 'mapping' && (
              <button
                onClick={handlePreview}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
              >
                Preview Import
              </button>
            )}
            
            {step === 'preview' && (
              <button
                onClick={handleImport}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200"
              >
                Import {parseResult?.totalRows || 0} Products
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelImportModal;
