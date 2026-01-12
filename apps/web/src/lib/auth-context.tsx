"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiClient } from "./api-client";

interface User {
  id: string;
  name: string | null;
  email: string;
  profilePicture: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requestMagicLink: (email: string) => Promise<{ email: string }>;
  verifyMagicLink: (token: string) => Promise<{ isNewUser: boolean }>;
  updateUser: (data: {
    name?: string;
    profilePicture?: string | null;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
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

  const requestMagicLink = async (email: string) => {
    const result = await apiClient.requestMagicLink(email);
    return { email: result.email };
  };

  const verifyMagicLink = async (token: string) => {
    const result = await apiClient.verifyMagicLink(token);
    setUser(result.user);
    return { isNewUser: result.isNewUser };
  };

  const updateUser = async (data: {
    name?: string;
    profilePicture?: string | null;
  }) => {
    const result = await apiClient.updateMe(data);
    setUser(result.user);
  };

  const logout = () => {
    setUser(null);
    apiClient.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        requestMagicLink,
        verifyMagicLink,
        updateUser,
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
