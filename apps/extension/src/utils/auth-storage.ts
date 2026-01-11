// Auth storage utilities for Chrome extension
// Uses chrome.storage.local for persistent token storage

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface StoredAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: "nottto_access_token",
  REFRESH_TOKEN: "nottto_refresh_token",
  USER: "nottto_user",
} as const;

/**
 * Saves authentication tokens and user to chrome.storage.local
 */
export async function saveAuthState(
  tokens: AuthTokens,
  user: User
): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.ACCESS_TOKEN]: tokens.accessToken,
    [STORAGE_KEYS.REFRESH_TOKEN]: tokens.refreshToken,
    [STORAGE_KEYS.USER]: user,
  });
}

/**
 * Retrieves stored authentication state from chrome.storage.local
 */
export async function getAuthState(): Promise<StoredAuthState> {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
  ]);

  return {
    accessToken: result[STORAGE_KEYS.ACCESS_TOKEN] || null,
    refreshToken: result[STORAGE_KEYS.REFRESH_TOKEN] || null,
    user: result[STORAGE_KEYS.USER] || null,
  };
}

/**
 * Updates only the access token (used after refresh)
 */
export async function updateAccessToken(accessToken: string): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.ACCESS_TOKEN]: accessToken,
  });
}

/**
 * Clears all stored authentication data
 */
export async function clearAuthState(): Promise<void> {
  await chrome.storage.local.remove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
  ]);
}

/**
 * Checks if valid tokens are stored
 */
export async function hasValidTokens(): Promise<boolean> {
  const { accessToken, refreshToken } = await getAuthState();
  return !!(accessToken && refreshToken);
}

/**
 * Gets the current access token
 */
export async function getAccessToken(): Promise<string | null> {
  const { accessToken } = await getAuthState();
  return accessToken;
}

/**
 * Gets the current refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  const { refreshToken } = await getAuthState();
  return refreshToken;
}

/**
 * Gets the current user
 */
export async function getUser(): Promise<User | null> {
  const { user } = await getAuthState();
  return user;
}
