// Auth API stubs for Notto backend integration
// Implement when backend is ready

import { post, setAuthToken, clearAuthToken } from "./client";
import { clearAuthState } from "../utils/auth-storage";

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
  password: string,
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
  // Clear all authentication state from chrome.storage.local
  await clearAuthState();

  // Clear legacy auth token if it exists
  clearAuthToken();

  // Clear any cached selection data
  await chrome.storage.local.remove(["notto_selection", "authToken"]);
}

export async function getCurrentUser(): Promise<User> {
  // Stub - implement when backend is ready
  throw new Error("Not implemented");
}
