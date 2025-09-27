import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Tag } from 'lucide-react';

interface CategorySelectProps {
  value: string;
  onChange: (category: string) => void;
  existingCategories: string[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

// Predefined colors for categories with dark mode support
const categoryColors = [
  'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
  'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700',
  'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-700',
  'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
  'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
  'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700',
  'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700',
  'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-700',
  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-700',
];

const getCategoryColor = (category: string, index: number) => {
  return categoryColors[index % categoryColors.length];
};

const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  existingCategories,
  placeholder = "Select or add a category",
  label = "Category",
  required = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter categories based on search term
  const filteredCategories = existingCategories.filter(category =>
    category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if search term matches a new category
  const isNewCategory = searchTerm && !existingCategories.includes(searchTerm);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelectCategory = (category: string) => {
    onChange(category);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleAddNewCategory = () => {
    if (searchTerm.trim()) {
      handleSelectCategory(searchTerm.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isNewCategory) {
        handleAddNewCategory();
      } else if (filteredCategories.length === 1) {
        handleSelectCategory(filteredCategories[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const selectedCategoryIndex = existingCategories.indexOf(value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
          value 
            ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500' 
            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        aria-label="Select category"
      >
        <div className="flex items-center justify-between">
          {value ? (
            <div className="flex items-center space-x-2">
              <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(value, selectedCategoryIndex)}`}>
                <Tag className="h-3 w-3 inline mr-1" />
                {value}
              </div>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or type new category..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Categories List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCategories.length > 0 ? (
              <div className="py-1">
                {filteredCategories.map((category, index) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleSelectCategory(category)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700 transition-colors duration-150 ${
                      value === category ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(category, index)}`}>
                        <Tag className="h-3 w-3 inline mr-1" />
                        {category}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No categories found
              </div>
            )}

            {/* Add New Category Option */}
            {isNewCategory && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleAddNewCategory}
                  className="w-full px-3 py-2 text-left hover:bg-green-50 dark:hover:bg-green-900/20 focus:outline-none focus:bg-green-50 dark:focus:bg-green-900/20 transition-colors duration-150 text-green-700 dark:text-green-400"
                >
                  <div className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">Add "{searchTerm}"</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Quick Add Categories */}
          {!searchTerm && (
            <div className="border-t border-gray-100 dark:border-gray-700 p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick add popular categories:</div>
              <div className="flex flex-wrap gap-1">
                {['Food & Beverages', 'Electronics', 'Clothing', 'Home & Garden', 'Health & Beauty', 'Sports & Outdoors'].map((quickCategory) => {
                  if (existingCategories.includes(quickCategory)) return null;
                  return (
                    <button
                      key={quickCategory}
                      type="button"
                      onClick={() => handleSelectCategory(quickCategory)}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors duration-150"
                    >
                      + {quickCategory}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySelect;



