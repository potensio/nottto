"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiClient } from "./api-client";
import { mockUser } from "./mock-data";

// Set to true to use mock data instead of real API
const USE_MOCK_DATA = true;

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (USE_MOCK_DATA) {
        // Simulate network delay then auto-login with mock user
        await new Promise((r) => setTimeout(r, 500));
        setUser(mockUser);
        setIsLoading(false);
        return;
      }

      if (!apiClient.isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await apiClient.getMe();
        setUser(data.user);
      } catch {
        // Token invalid, clear it
        apiClient.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    if (USE_MOCK_DATA) {
      await new Promise((r) => setTimeout(r, 500));
      setUser(mockUser);
      return;
    }
    const data = await apiClient.login(email, password);
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    if (USE_MOCK_DATA) {
      await new Promise((r) => setTimeout(r, 500));
      setUser({ ...mockUser, name, email });
      return;
    }
    const data = await apiClient.register(email, password, name);
    setUser(data.user);
  };

  const logout = () => {
    setUser(null);
    if (!USE_MOCK_DATA) {
      apiClient.logout();
    } else {
      window.location.href = "/auth";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
