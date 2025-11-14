import { apiService } from '../services/api';

/**
 * Utility functions for handling authentication and token management
 */

export interface AuthCheckResult {
  isValid: boolean;
  shouldRedirect: boolean;
  error?: string;
}

/**
 * Performs a comprehensive authentication check when the app starts
 * This function handles token validation, network errors, and other edge cases
 */
export const performAuthCheck = async (): Promise<AuthCheckResult> => {
  try {
    const token = localStorage.getItem('access_token');
    
    // No token found
    if (!token) {
      return {
        isValid: false,
        shouldRedirect: true,
        error: 'No authentication token found'
      };
    }

    // Check if token is valid locally first
      if (!apiService.isAuthenticated()) {
        // Clear any invalid tokens
        apiService.clearTokensSilently();
        return {
          isValid: false,
          shouldRedirect: true,
          error: 'Authentication token is invalid or expired'
        };
      }

    // Try to validate token with server
    try {
      await apiService.getCurrentUser();
      return {
        isValid: true,
        shouldRedirect: false
      };
    } catch (error: any) {
      console.error('Server token validation failed:', error);
      
      // Check if it's an authentication error
      const isAuthError = error.message?.toLowerCase().includes('token') ||
                        error.message?.toLowerCase().includes('unauthorized') ||
                        error.message?.toLowerCase().includes('authentication') ||
                        error.message?.toLowerCase().includes('401');
      
      if (isAuthError) {
        apiService.clearTokensSilently();
        return {
          isValid: false,
          shouldRedirect: true,
          error: 'Authentication failed - please sign in again'
        };
      }
      
      // For network errors, we might want to allow the user to stay logged in
      // but show a warning about connectivity issues
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        return {
          isValid: true,
          shouldRedirect: false,
          error: 'Network connectivity issues detected'
        };
      }
      
      // For other errors, clear tokens to be safe
      apiService.clearTokensSilently();
      return {
        isValid: false,
        shouldRedirect: true,
        error: 'Authentication validation failed'
      };
    }
  } catch (error: any) {
    console.error('Unexpected error during auth check:', error);
    // Clear tokens on any unexpected error
    apiService.clearTokensSilently();
    return {
      isValid: false,
      shouldRedirect: true,
      error: 'Unexpected authentication error'
    };
  }
};

/**
 * Clears all authentication data and redirects to login
 */
export const clearAuthAndRedirect = (): void => {
  
  // Clear all tokens WITHOUT triggering the callback to prevent infinite loop
  apiService.clearTokensSilently();
  
  // Clear any other auth-related data
  localStorage.removeItem('user');
  localStorage.removeItem('store_id');
  
  // Redirect to login
  setTimeout(() => {
    window.location.href = '/login';
  }, 100);
};

/**
 * Checks if the current token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true; // If we can't parse it, consider it expired
  }
};

/**
 * Gets token expiration time in milliseconds
 */
export const getTokenExpirationTime = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Error parsing token expiration:', error);
    return null;
  }
};
