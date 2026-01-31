// OAuth 2.0 flow manager with PKCE for extension authentication
// Orchestrates the complete OAuth flow from authorization to token exchange

import { config } from "../config";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from "./pkce";
import {
  launchWebAuthFlow,
  parseAuthResponse,
  getRedirectUri,
} from "./chrome-identity";
import { saveAuthState, type User } from "./auth-storage";

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  errorType?:
    | "cancelled"
    | "timeout"
    | "network"
    | "invalid_code"
    | "pkce_failed"
    | "unknown";
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

/**
 * Starts the OAuth authentication flow
 * @param mode - 'login' or 'register'
 * @returns Promise with authentication result
 */
export async function startOAuthFlow(
  mode: "login" | "register" = "login",
): Promise<AuthResult> {
  try {
    console.log(`Notto OAuth: Starting ${mode} flow`);

    // Step 1: Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    console.log("Notto OAuth: Generated PKCE parameters", {
      verifierLength: codeVerifier.length,
      challengeLength: codeChallenge.length,
      stateLength: state.length,
    });

    // Step 2: Build authorization URL
    const authUrl = buildAuthorizationUrl(codeChallenge, state, mode);
    console.log("Notto OAuth: Authorization URL built");

    // Step 3: Launch OAuth flow in browser
    console.log("Notto OAuth: Launching web auth flow");
    const redirectUrl = await launchWebAuthFlow(authUrl, true);
    console.log("Notto OAuth: Received redirect URL");

    // Step 4: Parse authorization response
    const { code, state: returnedState } = parseAuthResponse(redirectUrl);
    console.log("Notto OAuth: Parsed authorization response");

    // Step 5: Validate state parameter (CSRF protection)
    if (state !== returnedState) {
      console.error("Notto OAuth: State parameter mismatch", {
        expected: state,
        received: returnedState,
      });
      throw new Error("State parameter mismatch - possible CSRF attack");
    }
    console.log("Notto OAuth: State parameter validated");

    // Step 6: Exchange authorization code for tokens
    console.log("Notto OAuth: Exchanging code for tokens");
    const tokenResponse = await exchangeCodeForTokens(code, codeVerifier);
    console.log("Notto OAuth: Token exchange successful");

    // Step 7: Store tokens and user data
    await saveAuthState(
      {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
      },
      tokenResponse.user,
    );
    console.log("Notto OAuth: Auth state saved successfully");

    return {
      success: true,
      user: tokenResponse.user,
    };
  } catch (error) {
    // Determine error type and provide user-friendly message
    let errorMessage = "Unknown error occurred";
    let errorType: AuthResult["errorType"] = "unknown";

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // OAuth cancellation
      if (message.includes("cancel")) {
        errorMessage = "Authentication cancelled";
        errorType = "cancelled";
        console.log("Notto OAuth: User cancelled authentication");
      }
      // OAuth timeout
      else if (message.includes("timeout")) {
        errorMessage = "Authentication timed out. Please try again.";
        errorType = "timeout";
        console.error("Notto OAuth: Authentication timed out");
      }
      // Network errors
      else if (message.includes("network") || message.includes("fetch")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
        errorType = "network";
        console.error("Notto OAuth: Network error", error);
      }
      // Invalid authorization code
      else if (message.includes("invalid") && message.includes("code")) {
        errorMessage = "Invalid authorization code. Please try again.";
        errorType = "invalid_code";
        console.error("Notto OAuth: Invalid authorization code", error);
      }
      // PKCE validation failure
      else if (message.includes("pkce")) {
        errorMessage = "Security validation failed. Please try again.";
        errorType = "pkce_failed";
        console.error("Notto OAuth: PKCE validation failed", error);
      }
      // Token exchange errors
      else if (message.includes("token exchange")) {
        errorMessage = "Failed to complete authentication. Please try again.";
        errorType = "network";
        console.error("Notto OAuth: Token exchange failed", error);
      }
      // State mismatch (CSRF)
      else if (message.includes("state")) {
        errorMessage = "Security validation failed. Please try again.";
        errorType = "pkce_failed";
        console.error("Notto OAuth: State parameter mismatch", error);
      }
      // Generic error with original message
      else {
        errorMessage = error.message;
        console.error("Notto OAuth: Flow failed with error", error);
      }
    } else {
      console.error("Notto OAuth: Flow failed with unknown error", error);
    }

    return {
      success: false,
      error: errorMessage,
      errorType,
    };
  }
}

/**
 * Builds the OAuth authorization URL with all required parameters
 * @param codeChallenge - PKCE code challenge
 * @param state - CSRF protection state
 * @param mode - 'login' or 'register'
 * @returns Complete authorization URL
 */
export function buildAuthorizationUrl(
  codeChallenge: string,
  state: string,
  mode: "login" | "register",
): string {
  const redirectUri = getRedirectUri();
  const clientId = chrome.runtime.id;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state: state,
    mode: mode,
  });

  return `${config.WEB_URL}/auth/authorize?${params.toString()}`;
}

/**
 * Exchanges authorization code for access and refresh tokens
 * @param code - Authorization code from redirect
 * @param codeVerifier - PKCE code verifier
 * @returns Access and refresh tokens with user data
 * @throws Error if token exchange fails
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const redirectUri = getRedirectUri();
  const clientId = chrome.runtime.id;

  try {
    const response = await fetch(`${config.API_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
        client_id: clientId,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Token exchange failed";
      let errorDetails = null;

      try {
        const errorData = await response.json();
        errorDetails = errorData;

        // Handle specific OAuth error codes
        if (errorData.error === "invalid_grant") {
          if (errorData.message?.includes("expired")) {
            errorMessage = "Authorization code expired. Please try again.";
          } else if (errorData.message?.includes("PKCE")) {
            errorMessage = "PKCE validation failed. Please try again.";
          } else {
            errorMessage = "Invalid authorization code. Please try again.";
          }
        } else if (errorData.error === "invalid_client") {
          errorMessage = "Invalid client. Please reinstall the extension.";
        } else if (errorData.error === "invalid_request") {
          errorMessage = "Invalid request. Please try again.";
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If JSON parsing fails, use status text
        errorMessage = `Token exchange failed: ${response.statusText}`;
        console.error(
          "Notto OAuth: Failed to parse error response",
          parseError,
        );
      }

      console.error("Notto OAuth: Token exchange failed", {
        status: response.status,
        statusText: response.statusText,
        errorDetails,
        errorMessage,
      });

      throw new Error(errorMessage);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      user: data.user,
    };
  } catch (error) {
    // Re-throw if already an Error with message
    if (error instanceof Error) {
      throw error;
    }

    // Handle network errors
    console.error("Notto OAuth: Network error during token exchange", error);
    throw new Error(
      "Network error during token exchange. Please check your connection.",
    );
  }
}
