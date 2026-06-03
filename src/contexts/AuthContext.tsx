import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { AuthState, User } from '../types';

interface LoginCredentials { username: string; password: string; }

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

const initialState: AuthState = { user: null, token: null, isLoading: true };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':   return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS': return { ...state, user: action.payload.user, token: action.payload.token, isLoading: false };
    case 'LOGIN_FAILURE': return { ...initialState, isLoading: false };
    case 'LOGOUT':        return { ...initialState, isLoading: false };
    case 'UPDATE_USER':   return { ...state, user: action.payload };
    default:              return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('yoga_token');
    const userStr = localStorage.getItem('yoga_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      } catch { dispatch({ type: 'LOGOUT' }); }
    } else { dispatch({ type: 'LOGOUT' }); }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.message || 'Login failed'); }
      const data = await response.json();
      localStorage.setItem('yoga_token', data.token);
      localStorage.setItem('yoga_user', JSON.stringify(data.user));
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.token } });
    } catch (error) { dispatch({ type: 'LOGIN_FAILURE' }); throw error; }
  };

  const logout = () => {
    localStorage.removeItem('yoga_token');
    localStorage.removeItem('yoga_user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (user: User) => {
    localStorage.setItem('yoga_user', JSON.stringify(user));
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  return <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
