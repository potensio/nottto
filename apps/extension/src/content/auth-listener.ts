// Auth listener for receiving tokens from web app
import { saveAuthState, User, AuthTokens } from "../utils/auth-storage";

interface AuthSuccessMessage {
  type: "NOTTTO_AUTH_SUCCESS";
  payload: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

/**
 * Whitelist of allowed origins for postMessage authentication.
 * Only messages from these origins will be processed.
 */
const ALLOWED_ORIGINS: readonly string[] = [
  "http://localhost:3000",
  "https://nottto.com",
  "https://www.nottto.com",
  "https://app.nottto.com",
] as const;

/**
 * Validates if the given origin is in the allowed origins whitelist.
 * Uses strict equality comparison for security.
 */
export function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Initializes the auth message listener.
 * Listens for postMessage events from the web app containing auth tokens.
 */
export function initAuthListener(): void {
  window.addEventListener("message", handleAuthMessage);
}

/**
 * Removes the auth message listener.
 */
export function removeAuthListener(): void {
  window.removeEventListener("message", handleAuthMessage);
}

/**
 * Validates the auth message payload structure.
 */
function isValidAuthPayload(
  payload: unknown
): payload is AuthSuccessMessage["payload"] {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.accessToken === "string" &&
    typeof p.refreshToken === "string" &&
    p.user !== null &&
    typeof p.user === "object" &&
    typeof (p.user as Record<string, unknown>).id === "string" &&
    typeof (p.user as Record<string, unknown>).email === "string"
  );
}

/**
 * Handles incoming auth messages from the web app.
 * Implements strict origin validation for security.
 */
async function handleAuthMessage(event: MessageEvent): Promise<void> {
  // Strict origin validation - only accept messages from whitelisted origins
  if (!isAllowedOrigin(event.origin)) {
    return;
  }

  const message = event.data;

  // Validate message type
  if (!message || message.type !== "NOTTTO_AUTH_SUCCESS") {
    return;
  }

  // Validate payload structure
  if (!isValidAuthPayload(message.payload)) {
    console.error("Nottto: Invalid auth message payload structure");
    return;
  }

  const { accessToken, refreshToken, user } = message.payload;

  try {
    const tokens: AuthTokens = { accessToken, refreshToken };
    await saveAuthState(tokens, user);
    console.log("Nottto: Auth tokens saved successfully");

    // Notify background script that auth is complete
    chrome.runtime.sendMessage({
      action: "authComplete",
      user,
    });
  } catch (error) {
    console.error("Nottto: Failed to save auth tokens", error);
  }
}
