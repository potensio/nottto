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
 * Makes an API request through the background script to avoid CORS issues
 */
async function apiRequestViaBackground<T>(
  endpoint: string,
  method: string = "GET",
  body?: unknown,
  headers?: Record<string, string>
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
      }
    );
  });
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
 * Uses background script proxy to avoid CORS issues.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  console.log(
    "Nottto API: Making request to",
    endpoint,
    "via background script"
  );

  try {
    // Try request via background script first (avoids CORS)
    return await apiRequestViaBackground<T>(
      endpoint,
      options.method || "GET",
      options.body ? JSON.parse(options.body as string) : undefined,
      options.headers as Record<string, string>
    );
  } catch (error) {
    console.error("Nottto API: Background request failed:", error);

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
  options: RequestInit = {}
): Promise<T> {
  let accessToken = await getAccessToken();
  console.log(
    "Nottto API: Making direct request to",
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
      console.log(
        "Nottto API: Token refresh failed - user needs to re-authenticate"
      );
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
