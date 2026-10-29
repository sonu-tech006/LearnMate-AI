import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types.ts';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../services/api.ts';
import { useToast } from './ToastContext.tsx';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const LOGGED_OUT_KEY = 'learnmate_user_logged_out';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const refreshUser = async () => {
    const curToken = getStoredToken();
    const explicitlyLoggedOut = localStorage.getItem(LOGGED_OUT_KEY) === 'true';

    // If there is an existing valid token, verify with /api/auth/me
    if (curToken) {
      try {
        const data = await api.getMe();
        setUser(data.user);
        setIsLoading(false);
        return;
      } catch (err) {
        removeStoredToken();
        setToken(null);
        setUser(null);
      }
    }

    // If first visit and not explicitly logged out, auto-login as demo student Alex Johnson
    if (!explicitlyLoggedOut) {
      try {
        const data = await api.login({
          email: 'alex.learner@example.com',
          password: 'Learner2026!',
        });
        setStoredToken(data.token);
        setToken(data.token);
        setUser(data.user);
      } catch (err) {
        console.warn('Auto-login as demo student skipped:', err);
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.login({ email, password });
      localStorage.removeItem(LOGGED_OUT_KEY);
      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      showToast(msg, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async () => {
    setIsLoading(true);
    try {
      const data = await api.login({
        email: 'alex.learner@example.com',
        password: 'Learner2026!',
      });
      localStorage.removeItem(LOGGED_OUT_KEY);
      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
      showToast('Signed in as Alex Johnson (Demo Account)', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo login failed';
      showToast(msg, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.signup({ name, email, password });
      localStorage.removeItem(LOGGED_OUT_KEY);
      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
      showToast(`Account created! Welcome to LearnMate AI, ${data.user.name}.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      showToast(msg, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.setItem(LOGGED_OUT_KEY, 'true');
    removeStoredToken();
    setToken(null);
    setUser(null);
    showToast('You have been logged out safely.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginAsDemo,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
