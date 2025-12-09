import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSeasonInfo, Season, SeasonInfo } from '../utils/seasonUtils';

interface SeasonContextType {
  seasonInfo: SeasonInfo;
  season: Season;
  refreshSeason: () => void;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

export const SeasonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo>(() => getSeasonInfo());

  const refreshSeason = () => {
    setSeasonInfo(getSeasonInfo());
  };

  // Update season daily at midnight
  useEffect(() => {
    const updateSeason = () => {
      setSeasonInfo(getSeasonInfo());
    };

    // Update immediately
    updateSeason();

    // Calculate milliseconds until next midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    // Set timeout for next midnight
    const timeoutId = setTimeout(() => {
      updateSeason();
      // Then update every 24 hours
      const intervalId = setInterval(updateSeason, 24 * 60 * 60 * 1000);
      return () => clearInterval(intervalId);
    }, msUntilMidnight);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const value: SeasonContextType = {
    seasonInfo,
    season: seasonInfo.season,
    refreshSeason,
  };

  return (
    <SeasonContext.Provider value={value}>
      {children}
    </SeasonContext.Provider>
  );
};

export const useSeason = (): SeasonContextType => {
  const context = useContext(SeasonContext);
  if (context === undefined) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
};

