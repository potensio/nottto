// Extension authentication service using polling
import { config } from "../config";
import { saveAuthState, AuthTokens, User } from "./auth-storage";

const API_URL = config.API_URL;

interface AuthSession {
  sessionId: string;
  expiresAt: string;
}

interface AuthSessionStatus {
  status: "pending" | "completed" | "expired";
  tokens?: AuthTokens;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * Creates a new auth session and returns the session ID.
 */
export async function createAuthSession(): Promise<AuthSession> {
  const response = await fetch(`${API_URL}/extension-auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to create auth session");
  }

  return response.json();
}

/**
 * Polls for auth session completion.
 */
export async function pollAuthSession(
  sessionId: string
): Promise<AuthSessionStatus> {
  const response = await fetch(
    `${API_URL}/extension-auth/session/${sessionId}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      return { status: "expired" };
    }
    throw new Error("Failed to check auth session");
  }

  return response.json();
}

/**
 * Cancels/deletes an auth session.
 */
export async function cancelAuthSession(sessionId: string): Promise<void> {
  await fetch(`${API_URL}/extension-auth/session/${sessionId}`, {
    method: "DELETE",
  });
}

/**
 * Starts the auth flow:
 * 1. Creates a session
 * 2. Opens the web app auth page with session ID
 * 3. Polls for completion
 * 4. Saves tokens when complete
 */
export async function startAuthFlow(
  onStatusChange?: (status: string) => void,
  mode: "login" | "register" = "login"
): Promise<{ success: boolean; user?: User }> {
  let sessionId: string | null = null;

  try {
    // Create auth session
    onStatusChange?.("Creating session...");
    const session = await createAuthSession();
    sessionId = session.sessionId;

    // Open web app auth page with session ID
    const modeParam = mode === "register" ? "&mode=register" : "";
    const authUrl = `${config.WEB_URL}/auth?source=extension&session=${sessionId}${modeParam}`;
    chrome.tabs.create({ url: authUrl });

    onStatusChange?.("Waiting for login...");

    // Poll for completion (max 10 minutes)
    const maxAttempts = 120; // 10 minutes at 5 second intervals
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const status = await pollAuthSession(sessionId);

      if (status.status === "completed" && status.tokens && status.user) {
        // Save tokens to extension storage
        const user: User = {
          id: status.user.id,
          email: status.user.email,
          name: status.user.name,
        };

        await saveAuthState(status.tokens, user);
        onStatusChange?.("Login successful!");

        return { success: true, user };
      }

      if (status.status === "expired") {
        onStatusChange?.("Session expired");
        return { success: false };
      }

      // Still pending, continue polling
    }

    // Timeout
    onStatusChange?.("Login timed out");
    await cancelAuthSession(sessionId);
    return { success: false };
  } catch (error) {
    console.error("Nottto: Auth flow error", error);
    onStatusChange?.("Login failed");

    // Cleanup session if created
    if (sessionId) {
      await cancelAuthSession(sessionId).catch(() => {});
    }

    return { success: false };
  }
}
