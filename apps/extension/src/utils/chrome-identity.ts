// Chrome Identity API wrapper for OAuth 2.0 flows
// Provides a clean interface to chrome.identity.launchWebAuthFlow

export interface AuthFlowResult {
  code: string;
  state: string;
}

/**
 * Launches the OAuth web authentication flow
 * @param url - The authorization URL to open
 * @param interactive - Whether to show UI (default: true)
 * @returns Promise resolving to the redirect URL with auth code
 * @throws Error if user cancels, timeout occurs, or other errors
 */
export async function launchWebAuthFlow(
  url: string,
  interactive: boolean = true,
): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log("Notto Chrome Identity: Launching web auth flow", {
      url,
      interactive,
      redirectUri: getRedirectUri(),
    });

    chrome.identity.launchWebAuthFlow(
      {
        url,
        interactive,
      },
      (redirectUrl) => {
        console.log("Notto Chrome Identity: Callback received", {
          redirectUrl,
          hasError: !!chrome.runtime.lastError,
          error: chrome.runtime.lastError?.message,
        });

        // Check for errors
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message || "Unknown error";
          console.error("Notto Chrome Identity: Auth flow error", {
            error,
            lastError: chrome.runtime.lastError,
          });

          // Handle specific error cases with user-friendly messages
          if (error.includes("canceled") || error.includes("cancelled")) {
            reject(new Error("Authentication cancelled by user"));
          } else if (error.includes("timeout") || error.includes("timed out")) {
            reject(new Error("Authentication timed out. Please try again."));
          } else if (error.includes("network")) {
            reject(new Error("Network error. Please check your connection."));
          } else {
            reject(new Error(`Authentication failed: ${error}`));
          }
          return;
        }

        // Validate redirect URL
        if (!redirectUrl) {
          console.error("Notto Chrome Identity: No redirect URL received");
          reject(new Error("No redirect URL received from authentication"));
          return;
        }

        console.log("Notto Chrome Identity: Auth flow completed successfully", {
          redirectUrlLength: redirectUrl.length,
          redirectUrlStart: redirectUrl.substring(0, 100),
        });
        resolve(redirectUrl);
      },
    );
  });
}

/**
 * Extracts the authorization code from the redirect URL
 * @param redirectUrl - The redirect URL from launchWebAuthFlow
 * @returns The authorization code
 * @throws Error if code parameter is missing
 */
export function extractAuthCode(redirectUrl: string): string {
  try {
    const url = new URL(redirectUrl);
    const code = url.searchParams.get("code");

    if (!code) {
      console.error(
        "Notto Chrome Identity: Authorization code not found in URL",
        {
          redirectUrl,
          searchParams: Array.from(url.searchParams.entries()),
        },
      );
      throw new Error("Authorization code not found in redirect URL");
    }

    return code;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Authorization code")
    ) {
      throw error;
    }
    console.error("Notto Chrome Identity: Failed to parse redirect URL", {
      redirectUrl,
      error,
    });
    throw new Error("Failed to parse authorization response");
  }
}

/**
 * Extracts the state parameter from the redirect URL
 * @param redirectUrl - The redirect URL from launchWebAuthFlow
 * @returns The state parameter
 * @throws Error if state parameter is missing
 */
export function extractState(redirectUrl: string): string {
  try {
    const url = new URL(redirectUrl);
    const state = url.searchParams.get("state");

    if (!state) {
      console.error("Notto Chrome Identity: State parameter not found in URL", {
        redirectUrl,
        searchParams: Array.from(url.searchParams.entries()),
      });
      throw new Error("State parameter not found in redirect URL");
    }

    return state;
  } catch (error) {
    if (error instanceof Error && error.message.includes("State parameter")) {
      throw error;
    }
    console.error("Notto Chrome Identity: Failed to parse redirect URL", {
      redirectUrl,
      error,
    });
    throw new Error("Failed to parse authorization response");
  }
}

/**
 * Gets the extension's OAuth redirect URI
 * @returns The redirect URI in format https://<extension-id>.chromiumapp.org/oauth2
 */
export function getRedirectUri(): string {
  const extensionId = chrome.runtime.id;
  return `https://${extensionId}.chromiumapp.org/oauth2`;
}

/**
 * Extracts both code and state from redirect URL
 * @param redirectUrl - The redirect URL from launchWebAuthFlow
 * @returns Object containing code and state
 * @throws Error if either parameter is missing
 */
export function parseAuthResponse(redirectUrl: string): AuthFlowResult {
  console.log("Notto Chrome Identity: Parsing auth response");

  try {
    const code = extractAuthCode(redirectUrl);
    const state = extractState(redirectUrl);

    console.log("Notto Chrome Identity: Successfully parsed auth response", {
      codeLength: code.length,
      stateLength: state.length,
    });

    return { code, state };
  } catch (error) {
    console.error(
      "Notto Chrome Identity: Failed to parse auth response",
      error,
    );
    throw error;
  }
}
