"use client";

import { createContext, useContext, ReactNode, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

const AUTH_QUERY_KEY = ["auth", "me"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Use TanStack Query for auth state
  const { data, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        const result = await apiClient.getMe();
        return result.user;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const user = data ?? null;

  const requestMagicLink = useCallback(async (email: string) => {
    const result = await apiClient.requestMagicLink(email);
    return { email: result.email };
  }, []);

  const verifyMutation = useMutation({
    mutationFn: (token: string) => apiClient.verifyMagicLink(token),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
    },
  });

  const verifyMagicLink = useCallback(
    async (token: string) => {
      const result = await verifyMutation.mutateAsync(token);
      return { isNewUser: result.isNewUser };
    },
    [verifyMutation]
  );

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; profilePicture?: string | null }) =>
      apiClient.updateMe(data),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
    },
  });

  const updateUser = useCallback(
    async (data: { name?: string; profilePicture?: string | null }) => {
      await updateMutation.mutateAsync(data);
    },
    [updateMutation]
  );

  const logout = useCallback(async () => {
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    await apiClient.logout();
  }, [queryClient]);

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
