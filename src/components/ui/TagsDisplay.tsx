import React from 'react';
import { Tag } from 'lucide-react';
import { formatTagsForUI } from '../../utils/tagUtils';

interface TagsDisplayProps {
  tags: string[] | string | any;
  className?: string;
  showLabel?: boolean;
  label?: string;
  maxDisplay?: number;
  showCount?: boolean;
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
];

const getTagColor = (index: number) => {
  return tagColors[index % tagColors.length];
};

export const TagsDisplay: React.FC<TagsDisplayProps> = ({
  tags,
  className = '',
  showLabel = true,
  label = 'Tags',
  maxDisplay = 5,
  showCount = false,
}) => {
  const formattedTags = formatTagsForUI(tags);
  
  if (!formattedTags || formattedTags.length === 0) {
    return (
      <div className={className}>
        {showLabel && (
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </div>
        )}
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          No tags
        </div>
      </div>
    );
  }

  const displayTags = formattedTags.slice(0, maxDisplay);
  const remainingCount = formattedTags.length - maxDisplay;

  return (
    <div className={className}>
      {showLabel && (
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {showCount && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              ({formattedTags.length})
            </span>
          )}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag, index) => (
          <span
            key={tag.id}
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTagColor(index)}`}
          >
            <Tag className="h-3 w-3 mr-1" />
            {tag.text}
          </span>
        ))}
        
        {remainingCount > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
            +{remainingCount} more
          </span>
        )}
      </div>
    </div>
  );
};
