import React from 'react';
import { useGoals } from '../../context/GoalContext';
import { GoalCelebrationModal } from './GoalCelebrationModal';

export const GoalCelebrationManager: React.FC = () => {
  const { lastCelebration, clearLastCelebration } = useGoals();

  if (!lastCelebration) {
    return null;
  }

  return (
    <GoalCelebrationModal
      isOpen={true}
      onClose={clearLastCelebration}
      goalType={lastCelebration.goalType}
      goalAmount={lastCelebration.goalAmount}
      actualAmount={lastCelebration.actualAmount}
      goalName={lastCelebration.goalName}
    />
  );
};


