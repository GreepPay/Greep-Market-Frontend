import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCircle, Clock, CreditCard, Package, X } from 'lucide-react';

interface CheckoutLoaderProps {
  isVisible: boolean;
  message?: string;
  onCancel?: () => void;
  canCancel?: boolean;
}

interface ProcessingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  duration: number;
}

export const CheckoutLoader: React.FC<CheckoutLoaderProps> = ({ 
  isVisible, 
  message = "Processing your order...",
  onCancel,
  canCancel = true
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const progressBarRef = useRef<HTMLDivElement>(null);

  const processingSteps: ProcessingStep[] = useMemo(() => [
    {
      id: 'validating',
      label: 'Validating order',
      icon: <CheckCircle className="w-4 h-4" />,
      duration: 800
    },
    {
      id: 'processing',
      label: 'Processing payment',
      icon: <CreditCard className="w-4 h-4" />,
      duration: 1200
    },
    {
      id: 'updating',
      label: 'Updating inventory',
      icon: <Package className="w-4 h-4" />,
      duration: 1000
    },
    {
      id: 'completing',
      label: 'Finalizing order',
      icon: <Clock className="w-4 h-4" />,
      duration: 600
    }
  ], []);

  useEffect(() => {
    if (!isVisible) {
      // Reset state when modal is hidden
      setProgress(0);
      setCurrentStep(0);
      setCompletedSteps(new Set());
      return;
    }

    let progressInterval: NodeJS.Timeout;
    let stepTimeout: NodeJS.Timeout;
    let currentProgress = 0;
    let stepIndex = 0;

    const totalDuration = processingSteps.reduce((sum, step) => sum + step.duration, 0);
    const progressIncrement = 100 / (totalDuration / 100); // Progress per 100ms

    const updateProgress = () => {
      currentProgress += progressIncrement;
      const newProgress = Math.min(currentProgress, 100);
      setProgress(newProgress);

      // Update progress bar width using ref
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${newProgress}%`;
      }

      // Check if we should move to next step
      const stepThreshold = (stepIndex + 1) * (processingSteps[stepIndex].duration / totalDuration) * 100;
      if (currentProgress >= stepThreshold && stepIndex < processingSteps.length - 1) {
        setCompletedSteps(prev => {
          const newSet = new Set(prev);
          newSet.add(stepIndex);
          return newSet;
        });
        stepIndex++;
        setCurrentStep(stepIndex);
      }

      if (currentProgress < 100) {
        progressInterval = setTimeout(updateProgress, 100);
      } else {
        // Complete all steps
        const allStepsSet = new Set<number>();
        processingSteps.forEach((_, index) => allStepsSet.add(index));
        setCompletedSteps(allStepsSet);
        setCurrentStep(processingSteps.length);
      }
    };

    // Start progress animation
    progressInterval = setTimeout(updateProgress, 100);

    return () => {
      if (progressInterval) clearTimeout(progressInterval);
      if (stepTimeout) clearTimeout(stepTimeout);
    };
  }, [isVisible, processingSteps]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pt-0 px-4 pb-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl border border-gray-100 dark:border-gray-700">
        {/* Header with cancel button */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          {canCancel && onCancel && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Cancel processing"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Main content */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Processing Order
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          {message}
        </p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              ref={progressBarRef}
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: '0%' }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">0%</span>
            <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
              {Math.round(progress)}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">100%</span>
          </div>
        </div>

        {/* Processing steps */}
        <div className="space-y-3">
          {processingSteps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;

            return (
              <div 
                key={step.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : isCurrent 
                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' 
                    : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                    ? 'bg-primary-500 text-white animate-pulse' 
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isCompleted 
                      ? 'text-green-700 dark:text-green-300' 
                      : isCurrent 
                      ? 'text-primary-700 dark:text-primary-300' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce mr-1"></div>
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce mr-1" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer message */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Please don't close this window while processing...
          </p>
        </div>
      </div>
    </div>
  );
};
