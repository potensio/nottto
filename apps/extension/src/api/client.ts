// Base API client for Nottto backend integration
// This is a stub - implement when backend is ready

const API_BASE = "https://api.nottto.com";

let authToken: string | null = null;

export function setAuthToken(token: string): void {
  authToken = token;
}

export function clearAuthToken(): void {
  authToken = null;
}

export function getAuthToken(): string | null {
  return authToken;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (authToken) {
    (headers as Record<string, string>)[
      "Authorization"
    ] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `API request failed: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}

export async function get<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: "GET" });
}

export async function post<T>(endpoint: string, data: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function put<T>(endpoint: string, data: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function del<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: "DELETE" });
}
