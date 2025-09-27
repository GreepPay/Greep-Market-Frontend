import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, X, Tag } from 'lucide-react';
import { cleanTagsInput } from '../../utils/tagUtils';

interface TagsDropdownProps {
  value: string[];
  onChange: (tags: string[]) => void;
  existingTags: string[];
  placeholder?: string;
  label?: string;
  maxTags?: number;
  className?: string;
}

// Predefined colors for tags with dark mode support
const tagColors = [
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
  'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-700',
  'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-700',
  'bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-300 border-lime-200 dark:border-lime-700',
];

const getTagColor = (tag: string, index: number) => {
  return tagColors[index % tagColors.length];
};

const TagsDropdown: React.FC<TagsDropdownProps> = ({
  value = [],
  onChange,
  existingTags = [],
  placeholder = "Add tags...",
  label = "Tags",
  maxTags = 10,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clean and normalize the value prop to ensure it's always an array of strings
  const cleanValue = cleanTagsInput(value);

  // Filter tags based on search term
  const filteredTags = existingTags.filter(tag =>
    tag.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !cleanValue.includes(tag)
  );

  // Check if search term matches a new tag
  const isNewTag = searchTerm && !existingTags.includes(searchTerm) && !cleanValue.includes(searchTerm);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setInputValue('');
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

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !cleanValue.includes(trimmedTag) && cleanValue.length < maxTags) {
      onChange([...cleanValue, trimmedTag]);
      setSearchTerm('');
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(cleanValue.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTerm.trim()) {
        handleAddTag(searchTerm);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      setInputValue('');
    } else if (e.key === 'Backspace' && !searchTerm && cleanValue.length > 0) {
      handleRemoveTag(cleanValue[cleanValue.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setInputValue(inputValue);
    setSearchTerm(inputValue);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleTagClick = (tag: string) => {
    handleAddTag(tag);
  };

  const handleAddNewTag = () => {
    if (searchTerm.trim()) {
      handleAddTag(searchTerm);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div
          className={`min-h-[42px] w-full px-3 py-2 border rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${
            isOpen ? 'border-primary-300 dark:border-primary-500' : 'hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onClick={() => inputRef.current?.focus()}
        >
          {/* Selected Tags */}
          <div className="flex flex-wrap gap-1 mb-1">
            {cleanValue.map((tag, index) => (
              <span
                key={tag}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTagColor(tag, index)}`}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTag(tag);
                  }}
                  className="ml-1 hover:bg-black hover:bg-opacity-10 dark:hover:bg-white dark:hover:bg-opacity-20 rounded-full p-0.5 transition-colors duration-150"
                  aria-label={`Remove ${tag} tag`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={cleanValue.length === 0 ? placeholder : "Add more tags..."}
            className="w-full border-none outline-none text-sm bg-transparent placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white"
            disabled={cleanValue.length >= maxTags}
          />

          {/* Dropdown Arrow */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <ChevronDown className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
            {/* Tags List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredTags.length > 0 ? (
                <div className="py-1">
                  {filteredTags.map((tag, index) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700 transition-colors duration-150 text-gray-700 dark:text-gray-300"
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getTagColor(tag, index)}`}>
                          <Tag className="h-3 w-3 inline mr-1" />
                          {tag}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {existingTags.length === 0 ? 'No existing tags' : 'No matching tags'}
                </div>
              )}

              {/* Add New Tag Option */}
              {isNewTag && (
                <div className="border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleAddNewTag}
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

            {/* Quick Add Tags */}
            {!searchTerm && (
              <div className="border-t border-gray-100 dark:border-gray-700 p-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick add popular tags:</div>
                <div className="flex flex-wrap gap-1">
                  {['popular', 'featured', 'new', 'turkey', 'sale', 'bestseller', 'organic', 'premium', 'limited'].map((quickTag) => {
                    if (cleanValue.includes(quickTag)) return null;
                    return (
                      <button
                        key={quickTag}
                        type="button"
                        onClick={() => handleTagClick(quickTag)}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors duration-150"
                      >
                        + {quickTag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Max Tags Warning */}
            {cleanValue.length >= maxTags && (
              <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2">
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  Maximum {maxTags} tags allowed
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {cleanValue.length > 0 && (
          <span>
            {cleanValue.length} of {maxTags} tags selected
          </span>
        )}
        {cleanValue.length === 0 && (
          <span>Press Enter to add tags, or click on existing tags to select them</span>
        )}
      </div>
    </div>
  );
};

export { TagsDropdown };
