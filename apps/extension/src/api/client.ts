// Base API client for Notto backend integration
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
 * Makes an API request through the background script to avoid CORS issues
 */
async function apiRequestViaBackground<T>(
  endpoint: string,
  method: string = "GET",
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "apiRequest",
        endpoint,
        method,
        body,
        headers,
      },
      (response: { success: boolean; error?: string; data?: T }) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response.success) {
          resolve(response.data as T);
        } else {
          const error: ApiError = {
            message: response.error || "API request failed",
          };
          reject(error);
        }
      },
    );
  });
}

/**
 * Attempts to refresh the access token using the stored refresh token.
 * Returns the new access token or null if refresh failed.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await clearAuthState();
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh token is invalid, clear auth state
      console.error("Notto API: Token refresh failed:", response.status);
      await clearAuthState();
      return null;
    }

    const data = await response.json();
    await updateAccessToken(data.accessToken);
    console.log("Notto API: Access token refreshed successfully");
    return data.accessToken;
  } catch (error) {
    console.error("Notto API: Token refresh error:", error);
    await clearAuthState();
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    // Add 60 second buffer to refresh before actual expiration
    return payload.exp && payload.exp - 60 < now;
  } catch (error) {
    console.error("Notto API: Failed to parse token:", error);
    return true; // Treat invalid tokens as expired
  }
}

/**
 * Makes an authenticated API request with automatic token refresh on 401.
 * Uses background script proxy to avoid CORS issues.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    // Try request via background script first (avoids CORS)
    return await apiRequestViaBackground<T>(
      endpoint,
      options.method || "GET",
      options.body ? JSON.parse(options.body as string) : undefined,
      options.headers as Record<string, string>,
    );
  } catch (error) {
    console.error("Notto API: Background request failed:", error);

    // If background request fails due to auth, handle it
    if (error instanceof Error && error.message === "AUTHENTICATION_REQUIRED") {
      throw error;
    }

    // Fallback to direct request (for development or if background script fails)
    return await directApiRequest<T>(endpoint, options);
  }
}

/**
 * Direct API request (fallback method)
 */
async function directApiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  let accessToken = await getAccessToken();

  // Check if access token is expired before making request
  if (accessToken && isTokenExpired(accessToken)) {
    // Token is expired, try to refresh it proactively
    const newToken = await refreshAccessToken();
    if (newToken) {
      accessToken = newToken;
    } else {
      // Refresh failed, throw authentication error
      throw new Error("AUTHENTICATION_REQUIRED");
    }
  }

  const makeRequest = async (token: string | null) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  let response = await makeRequest(accessToken);

  // Handle 401 - try to refresh token (fallback if proactive refresh didn't work)
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await makeRequest(newToken);
    } else {
      // Throw a specific error that the UI can handle
      throw new Error("AUTHENTICATION_REQUIRED");
    }
  }

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage =
        errorData.message || errorData.error?.message || errorMessage;
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
}

export function clearAuthToken(): void {
  // No-op: tokens are now managed via chrome.storage
}

export function getAuthToken(): string | null {
  // No-op: tokens are now managed via chrome.storage
  return null;
}
