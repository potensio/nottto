// Auth API stubs for Nottto backend integration
// Implement when backend is ready

import { post, setAuthToken, clearAuthToken } from "./client";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  setAuthToken(response.token);
  return response;
}

export async function register(data: RegisterData): Promise<LoginResponse> {
  const response = await post<LoginResponse>("/auth/register", data);
  setAuthToken(response.token);
  return response;
}

export async function logout(): Promise<void> {
  clearAuthToken();
  // Optionally call backend to invalidate token
}

export async function getCurrentUser(): Promise<User> {
  // Stub - implement when backend is ready
  throw new Error("Not implemented");
}
