import React, { useEffect, useState } from 'react';
import { Trophy, X } from 'lucide-react';

interface GoalCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalType: 'daily' | 'monthly';
  goalAmount: number;
  actualAmount: number;
  goalName?: string;
}

export const GoalCelebrationModal: React.FC<GoalCelebrationModalProps> = ({
  isOpen,
  onClose,
  goalType,
  goalAmount,
  actualAmount,
  goalName
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      
      // Auto-close after 20 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 20000);

      return () => {
        clearTimeout(timer);
      };
    } else {
      setShowConfetti(false);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const getCelebrationMessage = () => {
    if (goalType === 'daily') {
      return {
        title: "Daily Goal Achieved!",
        message: "Congratulations! You've reached your daily sales target."
      };
    } else {
      return {
        title: "Monthly Goal Achieved!",
        message: "Outstanding! You've reached your monthly sales target."
      };
    }
  };

  const celebration = getCelebrationMessage();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center pt-0 px-4 pb-4 z-50">
        {/* Simple Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 rounded-full animate-bounce ${
                  ['bg-yellow-400', 'bg-pink-400', 'bg-blue-400', 'bg-green-400'][i % 4]
                }`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Clean Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-300 scale-100 opacity-100">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
            aria-label="Close celebration modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Trophy Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Trophy className="h-10 w-10 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {celebration.title}
            </h2>
            
            {/* Message */}
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {celebration.message}
            </p>

            {/* Achievement Stats */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Target</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(goalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Achieved</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(actualAmount)}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Math.round((actualAmount / goalAmount) * 100)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Achievement</p>
              </div>
            </div>

            {/* Auto-close notice */}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This notification will close automatically in 20 seconds
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
