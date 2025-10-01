import React, { useEffect, useState } from 'react';
import { Check, X, Filter, Tag } from 'lucide-react';

interface CategoryFilterSidebarProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  onClearAll: () => void;
  className?: string;
}

export const CategoryFilterSidebar: React.FC<CategoryFilterSidebarProps> = ({
  categories,
  selectedCategories,
  onCategoryToggle,
  onClearAll,
  className = '',
}) => {
  const hasSelections = selectedCategories.length > 0;
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if dark mode is enabled
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>
        {`
          .category-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .category-scrollbar::-webkit-scrollbar-track {
            background: ${isDarkMode ? '#1f2937' : '#f3f4f6'};
            border-radius: 3px;
          }
          .category-scrollbar::-webkit-scrollbar-thumb {
            background: ${isDarkMode ? '#4b5563' : '#d1d5db'};
            border-radius: 3px;
          }
          .category-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${isDarkMode ? '#6b7280' : '#9ca3af'};
          }
        `}
      </style>
      <div className={`bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm h-full flex flex-col ${className}`}>
      {/* Header with Icon */}
      <div className="relative p-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
              <Filter className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Categories
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Filter products
              </p>
            </div>
          </div>
          {hasSelections && (
            <button
              onClick={onClearAll}
              className="group relative p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
              title="Clear all filters"
            >
              <X className="h-3.5 w-3.5 text-gray-500 group-hover:text-red-500 transition-colors duration-200" />
            </button>
          )}
        </div>
      </div>

      {/* Category List - Flexible and Scrollable */}
      <div 
        className="px-5 pb-4 flex-1 overflow-y-auto category-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: isDarkMode ? '#4b5563 #1f2937' : '#d1d5db #f3f4f6'
        }}
      >
        <div className="space-y-1.5">
          {categories.map((category, index) => {
            const isSelected = selectedCategories.includes(category);
            const isAllCategory = category === 'all';
            const categoryColors = [
              'from-blue-500 to-blue-600',
              'from-green-500 to-green-600', 
              'from-purple-500 to-purple-600',
              'from-orange-500 to-orange-600',
              'from-pink-500 to-pink-600',
              'from-indigo-500 to-indigo-600',
              'from-teal-500 to-teal-600',
              'from-red-500 to-red-600'
            ];
            const colorClass = categoryColors[index % categoryColors.length];
            
            return (
              <label
                key={category}
                className={`group relative flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                  isSelected 
                    ? 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 border border-primary-200 dark:border-primary-700 shadow-md' 
                    : 'hover:bg-white/80 dark:hover:bg-gray-700/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm'
                }`}
              >
                {/* Custom Checkbox with Animation */}
                <div className="relative">
                  <div className={`w-5 h-5 rounded-md border-2 transition-all duration-300 ${
                    isSelected
                      ? `bg-gradient-to-br ${colorClass} border-transparent shadow-lg`
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-primary-400'
                  }`}>
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white animate-in zoom-in-50 duration-200" />
                      </div>
                    )}
                  </div>
                  {/* Ripple effect */}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-md bg-gradient-to-br from-primary-400 to-primary-600 opacity-20 animate-pulse"></div>
                  )}
                </div>
                
                {/* Category Icon */}
                <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300 ${
                  isSelected 
                    ? `bg-gradient-to-br ${colorClass} shadow-md` 
                    : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/20'
                }`}>
                  <Tag className={`h-3 w-3 transition-colors duration-300 ${
                    isSelected 
                      ? 'text-white' 
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600'
                  }`} />
                </div>
                
                {/* Category Text */}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    isSelected 
                      ? 'text-primary-800 dark:text-primary-200' 
                      : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                  }`}>
                    {isAllCategory ? 'All Categories' : category}
                  </span>
                </div>
                
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 animate-pulse"></div>
                )}
                
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onCategoryToggle(category)}
                  className="sr-only"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* Selection Summary with Animation - Fixed at bottom */}
      {hasSelections && (
        <div className="px-5 pb-5 flex-shrink-0">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200/50 dark:border-primary-700/50">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-blue-500/5 animate-pulse"></div>
            <div className="relative p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary-500 to-blue-500 animate-pulse"></div>
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                  {selectedCategories.length === 1 && selectedCategories[0] === 'all' 
                    ? 'Showing all categories'
                    : `${selectedCategories.length} categor${selectedCategories.length === 1 ? 'y' : 'ies'} selected`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};
