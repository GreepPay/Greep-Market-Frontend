import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ScrollToTopButtonProps {
  className?: string;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show button when scrolled down more than 100px
      const shouldShow = currentScrollY > 100;
      setIsVisible(shouldShow);

      // Determine scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }

      setLastScrollY(currentScrollY);
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [lastScrollY]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  const handleClick = () => {
    if (scrollDirection === 'up') {
      scrollToTop();
    } else {
      scrollToBottom();
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed right-4 bottom-20 z-[9999] transition-all duration-300 ${className}`}>
      <button
        onClick={handleClick}
        className={`
          group relative
          w-12 h-12 rounded-full
          bg-gradient-to-br from-green-500 to-green-700
          hover:from-green-600 hover:to-green-800
          dark:from-green-600 dark:to-green-800
          dark:hover:from-green-700 dark:hover:to-green-900
          shadow-lg hover:shadow-xl
          transition-all duration-300 ease-in-out
          transform hover:scale-105 active:scale-95
          border-2 border-white/20 dark:border-gray-700/30
          backdrop-blur-sm
          ${isVisible ? 'animate-in slide-in-from-right-2 fade-in' : 'animate-out slide-out-to-right-2 fade-out'}
        `}
        aria-label={scrollDirection === 'up' ? 'Scroll to top' : 'Scroll to bottom'}
      >
        {/* Subtle animated background pulse */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500 to-green-700 opacity-20 animate-pulse" />
        
        {/* Icon container */}
        <div className="relative flex items-center justify-center w-full h-full">
          {scrollDirection === 'up' ? (
            <ChevronUp 
              className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-105" 
            />
          ) : (
            <ChevronDown 
              className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-105" 
            />
          )}
        </div>

        {/* Tooltip */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-green-600 dark:bg-green-700 text-white text-sm px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
            {scrollDirection === 'up' ? 'Scroll to top' : 'Scroll to bottom'}
            <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-l-green-600 dark:border-l-green-700 border-t-4 border-t-transparent border-b-4 border-b-transparent" />
          </div>
        </div>
      </button>

      {/* Progress indicator */}
      {/* <div className="mt-2 w-1 h-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="w-full bg-gradient-to-t from-blue-500 to-purple-600 transition-all duration-300 ease-out"
          style={{
            height: `${Math.min(100, (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100)}%`
          }}
        />
      </div> */}
    </div>
  );
};
