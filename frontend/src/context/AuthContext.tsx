import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { loginRequest, ApiError } from '../utils/apiClient';
import { mapBackendUserToFrontend } from '../utils/roleMapping';

interface AuthContextType {
  currentUser: User | null;
  authToken: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'railway_auth_user';
const TOKEN_STORAGE_KEY = 'railway_auth_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as User;
      }
    } catch (e) {
      console.error('Failed to parse stored auth user:', e);
    }
    return null;
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      } catch (e) {
        console.error('Failed to save auth user to localStorage:', e);
      }
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    if (authToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [authToken]);

  /**
   * Tries the real backend first (email + password -> JWT). If the backend
   * is unreachable (not running, CORS issue, offline) or rejects the
   * credentials, falls back to the local DEMO_USERS list so the demo never
   * gets blocked by backend availability. Real backend accounts and demo
   * accounts can both be used from the same login form.
   */
  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    const trimmed = usernameOrEmail.trim();

    // Try the real backend first. The backend authenticates by email; if
    // what was typed doesn't look like a demo username that also happens
    // to match a real account, this simply fails fast and falls through.
    try {
      const result = await loginRequest(trimmed, password);
      const user = mapBackendUserToFrontend(result.user);
      setCurrentUser(user);
      setAuthToken(result.access_token);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status !== 0) {
        // Backend reached but rejected credentials (401) - fall through to
        // demo check below rather than failing outright, in case this is
        // one of the local demo accounts rather than a real backend user.
      }
      // Network error (status 0) or 401 both fall through to demo login.
    }

    const matched = DEMO_USERS.find(
      u => u.username.toLowerCase() === trimmed.toLowerCase() && u.password === password
    );

    if (matched) {
      const user: User = {
        id: matched.id,
        name: matched.name,
        department: matched.department,
        role: matched.role,
        username: matched.username
      };
      setCurrentUser(user);
      setAuthToken(null); // demo session - no real backend JWT
      return true;
    }

    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authToken,
        login,
        logout,
        isAuthenticated: !!currentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
