import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook that automatically scrolls to the top of the page
 * when the route changes (when navigating between pages)
 */
export const useScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top when location changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [location.pathname]);
};

/**
 * Hook that scrolls to top immediately (without smooth behavior)
 * Useful for immediate navigation or when smooth scrolling isn't desired
 */
export const useScrollToTopImmediate = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top immediately when location changes
    window.scrollTo(0, 0);
  }, [location.pathname]);
};
