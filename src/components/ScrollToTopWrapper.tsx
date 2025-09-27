import React from 'react';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { ScrollToTopButton } from './ui/ScrollToTopButton';

interface ScrollToTopWrapperProps {
  children: React.ReactNode;
}

export const ScrollToTopWrapper: React.FC<ScrollToTopWrapperProps> = ({ children }) => {
  // Automatically scroll to top when navigating between pages
  useScrollToTop();

  return (
    <>
      {children}
      <ScrollToTopButton />
    </>
  );
};
