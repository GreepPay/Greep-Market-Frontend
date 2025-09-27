import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import { SalesGoal, GoalProgress, GoalCelebration } from '../types/goals';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';
import { notificationManager } from '../utils/notificationUtils';

interface GoalState {
  dailyGoal: SalesGoal | null;
  monthlyGoal: SalesGoal | null;
  dailyProgress: GoalProgress | null;
  monthlyProgress: GoalProgress | null;
  loading: boolean;
  error: string | null;
  lastCelebration: GoalCelebration | null;
  celebratedToday: boolean;
  celebratedThisMonth: boolean;
}

interface GoalContextType extends GoalState {
  setDailyGoal: (goal: SalesGoal) => void;
  setMonthlyGoal: (goal: SalesGoal) => void;
  updateGoalProgress: (dashboardMetrics?: any, monthlyMetrics?: any) => Promise<void>;
  checkGoalAchievements: () => Promise<void>;
  clearLastCelebration: () => void;
  loadGoals: () => Promise<void>;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

type GoalAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DAILY_GOAL'; payload: SalesGoal | null }
  | { type: 'SET_MONTHLY_GOAL'; payload: SalesGoal | null }
  | { type: 'SET_DAILY_PROGRESS'; payload: GoalProgress | null }
  | { type: 'SET_MONTHLY_PROGRESS'; payload: GoalProgress | null }
  | { type: 'SET_LAST_CELEBRATION'; payload: GoalCelebration | null }
  | { type: 'CLEAR_LAST_CELEBRATION' }
  | { type: 'SET_CELEBRATED_TODAY'; payload: boolean }
  | { type: 'SET_CELEBRATED_THIS_MONTH'; payload: boolean };

const initialState: GoalState = {
  dailyGoal: null,
  monthlyGoal: null,
  dailyProgress: null,
  monthlyProgress: null,
  loading: false,
  error: null,
  lastCelebration: null,
  celebratedToday: false,
  celebratedThisMonth: false,
};

function goalReducer(state: GoalState, action: GoalAction): GoalState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_DAILY_GOAL':
      return { ...state, dailyGoal: action.payload };
    case 'SET_MONTHLY_GOAL':
      return { ...state, monthlyGoal: action.payload };
    case 'SET_DAILY_PROGRESS':
      return { ...state, dailyProgress: action.payload };
    case 'SET_MONTHLY_PROGRESS':
      return { ...state, monthlyProgress: action.payload };
    case 'SET_LAST_CELEBRATION':
      return { ...state, lastCelebration: action.payload };
    case 'CLEAR_LAST_CELEBRATION':
      return { ...state, lastCelebration: null };
    case 'SET_CELEBRATED_TODAY':
      return { ...state, celebratedToday: action.payload };
    case 'SET_CELEBRATED_THIS_MONTH':
      return { ...state, celebratedThisMonth: action.payload };
    default:
      return state;
  }
}

export function GoalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(goalReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Load goals from API or set defaults
  const loadGoals = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // 1) Fetch existing active goals for this store
      let existingGoals: SalesGoal[] = [];
      try {
        existingGoals = await (apiService as any).getGoals({ store_id: user.store_id, is_active: true });
      } catch (err) {
        console.warn('Failed to fetch existing goals, will attempt to create defaults if needed:', err);
        existingGoals = [];
      }

      // 2) Find daily and monthly goals if they already exist and are still valid
      const now = new Date();
      
      console.log('Goal validation debug:', {
        currentTime: now.toISOString(),
        existingGoalsCount: existingGoals.length,
        existingGoals: existingGoals.map(g => ({
          type: g.goal_type,
          period_start: g.period_start,
          period_end: g.period_end,
          target_amount: g.target_amount
        }))
      });
      
      let dailyGoal = existingGoals.find(g => {
        if (g.goal_type !== 'daily') return false;
        // Check if the goal is still valid for today
        if (g.period_start && g.period_end) {
          const startDate = new Date(g.period_start);
          const endDate = new Date(g.period_end);
          const isValid = now >= startDate && now <= endDate;
          console.log('Daily goal validation:', {
            goalId: g._id,
            period_start: g.period_start,
            period_end: g.period_end,
            currentTime: now.toISOString(),
            isValid
          });
          return isValid;
        }
        return true; // If no period dates, assume it's valid
      }) || null;
      
      let monthlyGoal = existingGoals.find(g => {
        if (g.goal_type !== 'monthly') return false;
        // Check if the goal is still valid for this month
        if (g.period_start && g.period_end) {
          const startDate = new Date(g.period_start);
          const endDate = new Date(g.period_end);
          const isValid = now >= startDate && now <= endDate;
          console.log('Monthly goal validation:', {
            goalId: g._id,
            period_start: g.period_start,
            period_end: g.period_end,
            currentTime: now.toISOString(),
            isValid
          });
          return isValid;
        }
        return true; // If no period dates, assume it's valid
      }) || null;

      // 3) If missing, create sensible defaults ONCE and persist them
      if (!dailyGoal) {
        console.log('No valid daily goal found, creating new one for today');
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        
        const newDailyGoal: Omit<SalesGoal, '_id'> = {
          store_id: user.store_id || 'default-store',
          goal_type: 'daily',
          target_amount: 5000,
          goal_name: 'Daily Sales Target',
          is_active: true,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          period_start: startOfDay.toISOString(),
          period_end: endOfDay.toISOString(),
        } as any;
        try {
          dailyGoal = await (apiService as any).createGoal(newDailyGoal);
          console.log('Created new daily goal:', dailyGoal);
        } catch (err) {
          console.error('Failed to create default daily goal:', err);
        }
      } else {
        console.log('Using existing daily goal:', dailyGoal);
      }

      if (!monthlyGoal) {
        console.log('No valid monthly goal found, creating new one for this month');
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const newMonthlyGoal: Omit<SalesGoal, '_id'> = {
          store_id: user.store_id || 'default-store',
          goal_type: 'monthly',
          target_amount: 150000,
          goal_name: 'Monthly Sales Target',
          is_active: true,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          period_start: startOfMonth.toISOString(),
          period_end: endOfMonth.toISOString(),
        } as any;
        try {
          monthlyGoal = await (apiService as any).createGoal(newMonthlyGoal);
          console.log('Created new monthly goal:', monthlyGoal);
        } catch (err) {
          console.error('Failed to create default monthly goal:', err);
        }
      } else {
        console.log('Using existing monthly goal:', monthlyGoal);
      }

      // 4) Update context state with persistent goals
      console.log('Setting goals in context:', {
        dailyGoal: dailyGoal ? {
          id: dailyGoal._id,
          target_amount: dailyGoal.target_amount,
          period_start: dailyGoal.period_start,
          period_end: dailyGoal.period_end
        } : null,
        monthlyGoal: monthlyGoal ? {
          id: monthlyGoal._id,
          target_amount: monthlyGoal.target_amount,
          period_start: monthlyGoal.period_start,
          period_end: monthlyGoal.period_end
        } : null
      });
      
      dispatch({ type: 'SET_DAILY_GOAL', payload: dailyGoal as any });
      dispatch({ type: 'SET_MONTHLY_GOAL', payload: monthlyGoal as any });

      // 5) Progress will be updated by a separate effect when goals are present
    } catch (error) {
      console.error('Failed to load goals:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load goals' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isAuthenticated, user]);

  // Recompute progress whenever goals are available/changed
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (state.dailyGoal && state.monthlyGoal) {
      updateGoalProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, state.dailyGoal, state.monthlyGoal]);

  // Reset daily goals and achievements for a new day
  const resetDailyGoalsForNewDay = useCallback(() => {
    const now = new Date();
    const today = now.toDateString();
    const lastDailyCelebration = localStorage.getItem('lastDailyCelebration');
    
    // If it's a new day, reset daily achievements and progress
    if (lastDailyCelebration && lastDailyCelebration !== today) {
      console.log('New day detected, resetting daily goal achievements and progress');
      
      // Clear any existing daily celebration for the new day
      dispatch({ type: 'CLEAR_LAST_CELEBRATION' });
      
      // Reset daily progress to 0 for the new day
      if (state.dailyGoal) {
        const resetDailyProgress: GoalProgress = {
          goal: state.dailyGoal,
          current_amount: 0,
          progress_percentage: 0,
          is_achieved: false,
          hours_remaining: 24
        };
        dispatch({ type: 'SET_DAILY_PROGRESS', payload: resetDailyProgress });
      }
      
      // Clear the localStorage entry for the new day
      localStorage.removeItem('lastDailyCelebration');
    }
  }, [state.dailyGoal]);

  // Update goal progress by using dashboard metrics data (optional parameters to avoid API calls)
  const updateGoalProgress = useCallback(async (dashboardMetrics?: any, monthlyMetrics?: any) => {
    if (!isAuthenticated || !user || !state.dailyGoal || !state.monthlyGoal) return;

    try {
      // First, check if we need to reset daily goals for a new day
      resetDailyGoalsForNewDay();
      
      const today = new Date();
      let dailyAmount = 0;
      let monthlyAmount = 0;

      // Always make separate API calls for daily and monthly data to ensure accuracy
      // The provided metrics from dashboard might be for different date ranges
      console.log('Goal Progress: Making separate API calls for daily and monthly data');
      
      // Calculate explicit date ranges using local timezone to avoid timezone issues
      const year = today.getFullYear();
      const month = today.getMonth();
      const date = today.getDate();
      
      // Create date strings in YYYY-MM-DD format to avoid timezone conversion issues
      const startOfDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}T00:00:00`;
      const endOfDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}T23:59:59`;
      
      const startOfMonthStr = `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00`;
      const endOfMonthStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}T23:59:59`;

      // Get dashboard metrics data using dateRange parameter (uses our fixed backend logic)
      const dailyMetrics = await apiService.getDashboardAnalytics({
        store_id: user.store_id,
        dateRange: 'today' // Use our fixed dateRange logic
      });

      // Get monthly data using dateRange parameter
      const monthlyMetricsData = await apiService.getDashboardAnalytics({
        store_id: user.store_id,
        dateRange: 'this_month' // Use our fixed dateRange logic
      });

      dailyAmount = dailyMetrics.totalSales || 0;
      monthlyAmount = monthlyMetricsData.totalSales || 0;
      
      console.log('Goal Progress Debug:', {
        todayDate: today.toDateString(),
        startOfDayStr,
        endOfDayStr,
        startOfMonthStr,
        endOfMonthStr,
        dailyAmount,
        monthlyAmount,
        dailyGoalTarget: state.dailyGoal.target_amount,
        monthlyGoalTarget: state.monthlyGoal.target_amount
      });
      
      const now = new Date();
      
      // Safety check to prevent division by zero
      const dailyTargetAmount = state.dailyGoal?.target_amount || 0;
      const monthlyTargetAmount = state.monthlyGoal?.target_amount || 0;
      
      console.log('Goal progress calculation:', {
        dailyAmount,
        dailyTargetAmount,
        monthlyAmount,
        monthlyTargetAmount,
        dailyGoalExists: !!state.dailyGoal,
        monthlyGoalExists: !!state.monthlyGoal
      });
      
      const dailyProgress: GoalProgress = {
        goal: state.dailyGoal!,
        current_amount: dailyAmount,
        progress_percentage: dailyTargetAmount > 0 ? Math.min((dailyAmount / dailyTargetAmount) * 100, 999) : 0,
        is_achieved: dailyTargetAmount > 0 ? dailyAmount >= dailyTargetAmount : false,
        hours_remaining: Math.max(0, 24 - now.getHours())
      };

      const monthlyProgress: GoalProgress = {
        goal: state.monthlyGoal!,
        current_amount: monthlyAmount,
        progress_percentage: monthlyTargetAmount > 0 ? Math.min((monthlyAmount / monthlyTargetAmount) * 100, 999) : 0,
        is_achieved: monthlyTargetAmount > 0 ? monthlyAmount >= monthlyTargetAmount : false,
        days_remaining: Math.max(0, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate())
      };

      dispatch({ type: 'SET_DAILY_PROGRESS', payload: dailyProgress });
      dispatch({ type: 'SET_MONTHLY_PROGRESS', payload: monthlyProgress });

    } catch (error) {
      console.error('Failed to update goal progress:', error);
    }
  }, [isAuthenticated, user, state.dailyGoal, state.monthlyGoal, resetDailyGoalsForNewDay]);

  // Check for goal achievements and trigger celebrations
  const checkGoalAchievements = useCallback(async () => {
    if (!state.dailyProgress || !state.monthlyProgress) return;

    const now = new Date();
    const today = now.toDateString();
    const thisMonth = `${now.getFullYear()}-${now.getMonth()}`;
    
    // Get stored celebration dates from localStorage
    const lastDailyCelebration = localStorage.getItem('lastDailyCelebration');
    const lastMonthlyCelebration = localStorage.getItem('lastMonthlyCelebration');
    
    // Check if we need to reset daily achievements for a new day
    if (lastDailyCelebration && lastDailyCelebration !== today) {
      console.log('New day detected, resetting daily goal achievements');
      // Clear any existing daily celebration for the new day
      dispatch({ type: 'CLEAR_LAST_CELEBRATION' });
    }
    
    // Check daily goal achievement
    if (state.dailyProgress.is_achieved && 
        lastDailyCelebration !== today) {
      
      const celebration: GoalCelebration = {
        goalType: 'daily',
        goalAmount: state.dailyGoal!.target_amount,
        actualAmount: state.dailyProgress.current_amount,
        goalName: state.dailyGoal!.goal_name,
        achieved_at: now.toISOString()
      };
      
      // Store in localStorage to prevent showing again today
      localStorage.setItem('lastDailyCelebration', today);
      dispatch({ type: 'SET_LAST_CELEBRATION', payload: celebration });
      
      // Show browser notification with sound
      await notificationManager.showNotification({
        title: '🎉 Daily Goal Achieved!',
        body: `Congratulations! You've reached your daily sales target of ₺${state.dailyGoal!.target_amount.toLocaleString()}. Current sales: ₺${state.dailyProgress.current_amount.toLocaleString()}`,
        sound: true,
        requireInteraction: false,
        tag: 'daily-goal-achievement'
      });
    }

    // Check monthly goal achievement
    if (state.monthlyProgress.is_achieved && 
        lastMonthlyCelebration !== thisMonth) {
      
      const celebration: GoalCelebration = {
        goalType: 'monthly',
        goalAmount: state.monthlyGoal!.target_amount,
        actualAmount: state.monthlyProgress.current_amount,
        goalName: state.monthlyGoal!.goal_name,
        achieved_at: now.toISOString()
      };
      
      // Store in localStorage to prevent showing again this month
      localStorage.setItem('lastMonthlyCelebration', thisMonth);
      dispatch({ type: 'SET_LAST_CELEBRATION', payload: celebration });
      
      // Show browser notification with sound
      await notificationManager.showNotification({
        title: '🏆 Monthly Goal Achieved!',
        body: `Outstanding! You've reached your monthly sales target of ₺${state.monthlyGoal!.target_amount.toLocaleString()}. Current sales: ₺${state.monthlyProgress.current_amount.toLocaleString()}`,
        sound: true,
        requireInteraction: false,
        tag: 'monthly-goal-achievement'
      });
    }
  }, [state.dailyProgress, state.monthlyProgress, state.dailyGoal, state.monthlyGoal]);

  // Clear last celebration (called when modal is closed)
  const clearLastCelebration = useCallback(() => {
    dispatch({ type: 'CLEAR_LAST_CELEBRATION' });
  }, []);

  // Set daily goal
  const setDailyGoal = useCallback((goal: SalesGoal) => {
    dispatch({ type: 'SET_DAILY_GOAL', payload: goal });
  }, []);

  // Set monthly goal
  const setMonthlyGoal = useCallback((goal: SalesGoal) => {
    dispatch({ type: 'SET_MONTHLY_GOAL', payload: goal });
  }, []);

  // Load goals on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadGoals();
    }
  }, [isAuthenticated, user, loadGoals]);

  // Update progress every 10 minutes (further reduced frequency since Dashboard now updates goals)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(() => {
      updateGoalProgress(); // This will make API calls as fallback
    }, 600000); // 10 minutes - Dashboard should handle most updates

    return () => clearInterval(interval);
  }, [isAuthenticated, user, updateGoalProgress]);

  // Check achievements after progress updates
  // Check for daily resets when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      resetDailyGoalsForNewDay();
    }
  }, [isAuthenticated, user, resetDailyGoalsForNewDay]);

  // Check for goal achievements when progress changes
  useEffect(() => {
    if (state.dailyProgress && state.monthlyProgress) {
      checkGoalAchievements();
    }
  }, [state.dailyProgress, state.monthlyProgress, checkGoalAchievements]);

  const value: GoalContextType = {
    ...state,
    setDailyGoal,
    setMonthlyGoal,
    updateGoalProgress,
    checkGoalAchievements,
    clearLastCelebration,
    loadGoals,
  };

  return (
    <GoalContext.Provider value={value}>
      {children}
    </GoalContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
}
