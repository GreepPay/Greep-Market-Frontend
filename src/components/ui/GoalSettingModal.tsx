import React, { useState, useEffect } from 'react';
import { Trophy, Target, X } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { useGoals } from '../../context/GoalContext';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { toast } from 'react-hot-toast';

interface GoalSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoalSettingModal: React.FC<GoalSettingModalProps> = ({
  isOpen,
  onClose
}) => {
  const { dailyGoal, monthlyGoal, setDailyGoal, setMonthlyGoal, loadGoals } = useGoals();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    dailyGoal: '',
    monthlyGoal: ''
  });

  useEffect(() => {
    if (isOpen) {
      // Load current goals when modal opens
      setFormData({
        dailyGoal: dailyGoal?.target_amount?.toString() || '5000',
        monthlyGoal: monthlyGoal?.target_amount?.toString() || '150000'
      });
    }
  }, [isOpen, dailyGoal, monthlyGoal]);

  const handleSaveGoals = async () => {
    if (!user?.store_id) {
      toast.error('Store information is missing. Please log in again.');
      return;
    }

    const dailyAmount = parseFloat(formData.dailyGoal);
    const monthlyAmount = parseFloat(formData.monthlyGoal);

    if (isNaN(dailyAmount) || dailyAmount <= 0) {
      toast.error('Please enter a valid daily goal amount');
      return;
    }

    if (isNaN(monthlyAmount) || monthlyAmount <= 0) {
      toast.error('Please enter a valid monthly goal amount');
      return;
    }

    if (monthlyAmount < dailyAmount * 20) {
      toast.error('Monthly goal should be at least 20 times the daily goal');
      return;
    }

    setIsLoading(true);
    try {
      // Create or update daily goal
      const dailyGoalData = {
        store_id: user.store_id,
        goal_type: 'daily' as const,
        target_amount: dailyAmount,
        goal_name: 'Daily Sales Target',
        is_active: true,
        created_by: user.id
      };

      // Create or update monthly goal
      const monthlyGoalData = {
        store_id: user.store_id,
        goal_type: 'monthly' as const,
        target_amount: monthlyAmount,
        goal_name: 'Monthly Sales Target',
        is_active: true,
        created_by: user.id
      };

      // For now, we'll just update the local state since we don't have API endpoints
      // In a real implementation, you would call API endpoints here
      setDailyGoal({
        _id: dailyGoal?._id || 'daily-goal',
        ...dailyGoalData,
        created_at: dailyGoal?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      setMonthlyGoal({
        _id: monthlyGoal?._id || 'monthly-goal',
        ...monthlyGoalData,
        created_at: monthlyGoal?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      toast.success('Goals saved successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to save goals:', error);
      toast.error('Failed to save goals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Your Goals"
      size="md"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Motivate yourself with achievable targets
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set realistic but challenging goals to track your progress
          </p>
        </div>

        {/* Daily Goal */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Daily Sales Goal
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
              ₺
            </span>
            <Input
              type="number"
              value={formData.dailyGoal}
              onChange={(e) => setFormData(prev => ({ ...prev, dailyGoal: e.target.value }))}
              placeholder="5000"
              className="pl-8"
              min="0"
              step="100"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Target sales amount for each day
          </p>
        </div>

        {/* Monthly Goal */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Monthly Sales Goal
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
              ₺
            </span>
            <Input
              type="number"
              value={formData.monthlyGoal}
              onChange={(e) => setFormData(prev => ({ ...prev, monthlyGoal: e.target.value }))}
              placeholder="150000"
              className="pl-8"
              min="0"
              step="1000"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Target sales amount for each month
          </p>
        </div>

        {/* Pro Tip */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Pro Tip
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Set realistic but challenging goals. Aim for 10-20% growth over your current performance.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveGoals}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Goals'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};