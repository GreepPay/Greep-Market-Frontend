import React from 'react';
import { useSeason } from '../../../context/SeasonContext';
import { WinterAnimation } from './WinterAnimation';
import { SpringAnimation } from './SpringAnimation';
import { SummerAnimation } from './SummerAnimation';
import { AutumnAnimation } from './AutumnAnimation';

interface SeasonalAnimationWrapperProps {
  intensity?: 'low' | 'medium' | 'high';
  enabled?: boolean;
}

export const SeasonalAnimationWrapper: React.FC<SeasonalAnimationWrapperProps> = ({
  intensity = 'medium',
  enabled = true,
}) => {
  const { seasonInfo } = useSeason();

  if (!enabled) {
    return null;
  }

  const isChristmas = seasonInfo.season === 'winter' && seasonInfo.isHoliday && 
                      (seasonInfo.holidayName === 'Christmas' || 
                       seasonInfo.holidayName === 'Christmas Season' ||
                       seasonInfo.holidayName === 'New Year' ||
                       seasonInfo.holidayName === 'Epiphany');

  switch (seasonInfo.season) {
    case 'winter':
      return <WinterAnimation intensity={intensity} isChristmas={isChristmas} />;
    
    case 'spring':
      return <SpringAnimation intensity={intensity} />;
    
    case 'summer':
      return <SummerAnimation intensity={intensity} />;
    
    case 'autumn':
      return <AutumnAnimation intensity={intensity} />;
    
    default:
      return null;
  }
};

