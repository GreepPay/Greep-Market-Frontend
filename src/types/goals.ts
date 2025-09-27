export interface SalesGoal {
  _id?: string;
  store_id: string;
  goal_type: 'daily' | 'monthly';
  target_amount: number;
  goal_name?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  period_start?: string; // ISO 8601 date string
  period_end?: string; // ISO 8601 date string
  currency?: string; // e.g., 'TRY'
  user_id?: string; // User who created the goal
}

export interface GoalProgress {
  goal: SalesGoal;
  current_amount: number;
  progress_percentage: number;
  is_achieved: boolean;
  days_remaining?: number; // For monthly goals
  hours_remaining?: number; // For daily goals
}

export interface GoalCelebration {
  goalType: 'daily' | 'monthly';
  goalAmount: number;
  actualAmount: number;
  goalName?: string;
  achieved_at: string;
}

