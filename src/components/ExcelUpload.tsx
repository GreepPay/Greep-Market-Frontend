import React, { useState, useCallback } from 'react';
import { FileSpreadsheet, X, Download, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Product } from '../types';

interface ExcelUploadProps {
  onProductsParsed: (products: Partial<Product>[]) => void;
  onClose: () => void;
}

interface ColumnMapping {
  [key: string]: string;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ onProductsParsed, onClose }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [rawData, setRawData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});

  // Default column mapping based on common Excel headers
  const defaultMapping: ColumnMapping = {
    'name': 'name',
    'description': 'description',
    'sku': 'sku',
    'barcode': 'barcode',
    'category': 'category',
    'price': 'price',
    'cost_price': 'cost_price',
    'stock_quantity': 'stock_quantity',
    'min_stock_level': 'min_stock_level',
    'unit': 'unit',
    'tags': 'tags'
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error('Excel file must have at least a header row and one data row');
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      setHeaders(headers);
      setRawData(rows);
      setShowColumnMapping(true);

      // Auto-map columns based on headers
      const autoMapping: ColumnMapping = {};
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase().trim();
        Object.keys(defaultMapping).forEach(key => {
          if (lowerHeader.includes(key) || key.includes(lowerHeader)) {
            autoMapping[header] = key;
          }
        });
      });
      setColumnMapping(autoMapping);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process Excel file');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    );

    if (excelFile) {
      processFile(excelFile);
    } else {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
    }
  }, [processFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleColumnMappingChange = (excelHeader: string, productField: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [excelHeader]: productField
    }));
  };

  const processProducts = () => {
    try {
      const products: Partial<Product>[] = rawData.map((row, index) => {
        const product: Partial<Product> = {};
        
        headers.forEach((header, colIndex) => {
          const field = columnMapping[header];
          const value = row[colIndex];
          
          if (field && value !== undefined && value !== null && value !== '') {
            switch (field) {
              case 'price':
                product.price = parseFloat(value) || 0;
                break;
              case 'cost_price':
                product.cost_price = parseFloat(value) || 0;
                break;
              case 'stock_quantity':
                product.stock_quantity = parseFloat(value) || 0;
                break;
              case 'min_stock_level':
                product.min_stock_level = parseFloat(value) || 0;
                break;
              case 'tags':
                product.tags = typeof value === 'string' ? value.split(',').map(tag => tag.trim()) : [];
                break;
              case 'name':
                product.name = String(value);
                break;
              case 'description':
                product.description = String(value);
                break;
              case 'sku':
                product.sku = String(value);
                break;
              case 'barcode':
                product.barcode = String(value);
                break;
              case 'category':
                product.category = String(value);
                break;
              case 'unit':
                product.unit = String(value);
                break;
            }
          }
        });

        return product;
      }).filter(product => product.name); // Only include products with names

      onProductsParsed(products);
      onClose();
    } catch (err) {
      setError('Failed to process products data');
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['name', 'description', 'sku', 'barcode', 'category', 'price', 'cost_price', 'stock_quantity', 'min_stock_level', 'unit', 'tags'],
      ['Sample Product', 'Product description', 'SKU001', '1234567890123', 'Electronics', '99.99', '50.00', '100', '10', 'Piece', 'electronics,popular']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'product_template.xlsx');
  };

  if (showColumnMapping) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center py-8 px-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Map Excel Columns</h2>
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
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Map your Excel columns to product fields. Leave unmapped if not needed.
              </p>
            </div>

            <div className="space-y-4">
              {headers.map((header, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Excel Column: <span className="font-mono bg-white px-2 py-1 rounded border">{header}</span>
                    </label>
                  </div>
                  <div className="flex-1">
                    <select
                      value={columnMapping[header] || ''}
                      onChange={(e) => handleColumnMappingChange(header, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      aria-label={`Map ${header} to product field`}
                    >
                      <option value="">-- Select Product Field --</option>
                      <option value="name">Product Name</option>
                      <option value="description">Description</option>
                      <option value="sku">SKU</option>
                      <option value="barcode">Barcode</option>
                      <option value="category">Category</option>
                      <option value="price">Price</option>
                      <option value="cost_price">Cost Price</option>
                      <option value="stock_quantity">Stock Quantity</option>
                      <option value="min_stock_level">Min Stock Level</option>
                      <option value="unit">Unit</option>
                      <option value="tags">Tags (comma-separated)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {rawData.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Preview (First 3 rows)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {headers.map((header, index) => (
                          <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawData.slice(0, 3).map((row: any[], rowIndex: number) => (
                        <tr key={rowIndex} className="border-b">
                          {row.map((cell: any, cellIndex: number) => (
                            <td key={cellIndex} className="px-3 py-2 text-sm text-gray-900">
                              {cell}
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

          <div className="flex items-center justify-between p-6 border-t bg-gray-50 flex-shrink-0">
            <button
              onClick={() => setShowColumnMapping(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Back
            </button>
            <button
              onClick={processProducts}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Import {rawData.length} Products</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center py-8 px-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Import Products from Excel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="Close"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div className="mb-4">
            <button
              onClick={downloadTemplate}
              className="w-full mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Excel Template</span>
            </button>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="text-gray-600">Processing Excel file...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <FileSpreadsheet className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-900">Drop your Excel file here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer"
                >
                  Choose File
                </label>
              </div>
            )}
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <p>Supported formats: .xlsx, .xls</p>
            <p>Download the template above for the correct format</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelUpload;
