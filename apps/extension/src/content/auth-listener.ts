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
 * Handles incoming auth messages from the web app.
 */
async function handleAuthMessage(event: MessageEvent): Promise<void> {
  // Only accept messages from our web app
  const allowedOrigins = [
    "http://localhost:3000",
    "https://nottto.com",
    "https://www.nottto.com",
  ];

  if (!allowedOrigins.includes(event.origin)) {
    return;
  }

  const message = event.data as AuthSuccessMessage;

  if (message?.type !== "NOTTTO_AUTH_SUCCESS") {
    return;
  }

  const { accessToken, refreshToken, user } = message.payload;

  if (!accessToken || !refreshToken || !user) {
    console.error("Nottto: Invalid auth message payload");
    return;
  }

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
