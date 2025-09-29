import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { User } from '../types';
import { toast } from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    role: string;
    first_name: string;
    last_name: string;
    phone?: string;
    store_id?: string;
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to check for existing auth
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // Handle token expiration - redirect to login
  const handleTokenExpiration = () => {
    console.log('Token expired - redirecting to login');
    dispatch({ type: 'AUTH_LOGOUT' });
    toast.error('Your session has expired. Please sign in again.', {
      duration: 4000,
      position: 'top-center',
    });
    navigate('/login', { replace: true });
  };

  // Set up token expiration callback
  useEffect(() => {
    apiService.setTokenExpiredCallback(handleTokenExpiration);
    
    // Cleanup callback on unmount
    return () => {
      apiService.clearTokenExpiredCallback();
    };
  }, [navigate]);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      console.log('Checking auth with token:', token ? 'exists' : 'missing');
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          console.log('Calling getCurrentUser...');
          const user = await apiService.getCurrentUser();
          console.log('getCurrentUser success:', user);
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        } catch (error) {
          console.error('Auth check failed:', error);
          // Clear invalid tokens
          apiService.clearTokens();
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } else {
        console.log('No token found, logging out');
        // No token found, set loading to false
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Prevent multiple simultaneous login attempts
    if (state.isLoading) {
      console.log('Login already in progress, skipping duplicate attempt');
      return;
    }

    try {
      dispatch({ type: 'AUTH_START' });
      const response = await apiService.login(email, password);
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
      toast.success(`Welcome back, ${response.data.user.first_name}`);
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    role: string;
    first_name: string;
    last_name: string;
    phone?: string;
    store_id?: string;
  }) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await apiService.register(userData);
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
      toast.success(`Welcome, ${response.data.user.first_name}`);
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
    toast.success('Logged out');
    navigate('/login', { replace: true });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
