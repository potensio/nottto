// Base API client for Nottto backend integration
import {
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
  clearAuthState,
} from "../utils/auth-storage";
import { config } from "../config";

const API_BASE = config.API_URL;

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

/**
 * Attempts to refresh the access token using the stored refresh token.
 * Returns the new access token or null if refresh failed.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh token is invalid, clear auth state
      await clearAuthState();
      return null;
    }

    const data = await response.json();
    await updateAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    await clearAuthState();
    return null;
  }
}

/**
 * Makes an authenticated API request with automatic token refresh on 401.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let accessToken = await getAccessToken();
  console.log(
    "Nottto API: Making request to",
    endpoint,
    "with token:",
    accessToken ? "present" : "missing"
  );

  const makeRequest = async (token: string | null) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  };

  let response = await makeRequest(accessToken);
  console.log("Nottto API: Response status:", response.status);

  // Handle 401 - try to refresh token
  if (response.status === 401 && accessToken) {
    console.log("Nottto API: Got 401, attempting token refresh...");
    const newToken = await refreshAccessToken();
    if (newToken) {
      console.log("Nottto API: Token refreshed, retrying request...");
      response = await makeRequest(newToken);
      console.log("Nottto API: Retry response status:", response.status);
    } else {
      console.log("Nottto API: Token refresh failed");
    }
  }

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage =
        errorData.message || errorData.error?.message || errorMessage;
      console.log("Nottto API: Error response:", errorData);
    } catch {
      // Ignore JSON parse errors
    }

    const error: ApiError = {
      message: errorMessage,
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

// Legacy exports for backward compatibility
export function setAuthToken(_token: string): void {
  // No-op: tokens are now managed via chrome.storage
  console.warn("setAuthToken is deprecated. Use saveAuthState instead.");
}

export function clearAuthToken(): void {
  // No-op: tokens are now managed via chrome.storage
  console.warn("clearAuthToken is deprecated. Use clearAuthState instead.");
}

export function getAuthToken(): string | null {
  // No-op: tokens are now managed via chrome.storage
  console.warn("getAuthToken is deprecated. Use getAccessToken instead.");
  return null;
}
