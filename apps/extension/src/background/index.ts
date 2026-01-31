// Notto Background Service Worker
import { hasValidTokens } from "../utils/auth-storage";
import { startOAuthFlow } from "../utils/oauth-flow";
import { config } from "../config";

/**
 * Validates if a tab is suitable for screen capture
 */
function isValidTab(tab: chrome.tabs.Tab): boolean {
  if (!tab || !tab.id) return false;
  if (tab.url?.startsWith("chrome://")) return false;
  if (tab.url?.startsWith("chrome-extension://")) return false;
  if (tab.url?.startsWith("about:")) return false;
  if (tab.discarded) return false;
  return true;
}

/**
 * Waits for the document in a tab to be fully loaded
 */
async function waitForDocumentReady(
  tabId: number,
  maxRetries = 10,
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => document.readyState,
      });

      if (results[0]?.result === "complete") {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      return false;
    }
  }

  return false;
}

/**
 * Sends auth completion message to all tabs
 */
async function broadcastAuthComplete(success: boolean): Promise<void> {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs
        .sendMessage(tab.id, { action: "authFlowComplete", success })
        .catch(() => {});
    }
  }
}

/**
 * Handles logout by clearing all authentication state
 */
async function handleLogout(): Promise<void> {
  const { clearAuthState } = await import("../utils/auth-storage");

  // Clear all authentication state
  await clearAuthState();

  // Clear any legacy tokens or cached data
  await chrome.storage.local.remove(["authToken", "notto_selection"]);

  console.log("Notto Background: User logged out successfully");

  // Broadcast logout to all tabs
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs
        .sendMessage(tab.id, { action: "userLoggedOut" })
        .catch(() => {});
    }
  }
}

/**
 * Shows auth prompt in the content script
 */
async function showAuthPromptInTab(tabId: number): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (webUrl: string) => {
        const overlay = document.createElement("div");
        overlay.id = "notto-auth-prompt";

        let currentMode: "login" | "register" = "login";

        overlay.innerHTML = `
          <div class="notto-auth-backdrop">
            <div class="notto-auth-modal">
              <button id="notto-auth-close-btn" class="notto-auth-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              
              <div class="notto-auth-logo">
                <div class="notto-auth-logo-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                    <path d="M2 2l7.586 7.586"></path>
                    <circle cx="11" cy="11" r="2"></circle>
                  </svg>
                </div>
                <span class="notto-auth-logo-text">Nott<span class="notto-auth-logo-accent">o</span></span>
              </div>
              
              <h2 class="notto-auth-title" id="notto-auth-title">Welcome back</h2>
              <p class="notto-auth-description" id="notto-auth-description">Sign in to save and sync your screenshots</p>
              
              <div class="notto-auth-toggle">
                <button type="button" id="notto-mode-login" class="notto-auth-toggle-btn active">Login</button>
                <button type="button" id="notto-mode-register" class="notto-auth-toggle-btn">Register</button>
              </div>
              
              <button id="notto-auth-signin-btn" class="notto-auth-button">
                <span id="notto-auth-btn-text">Sign in with Email</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
              
              <p id="notto-auth-status" class="notto-auth-status"></p>
              
              <p class="notto-auth-terms">
                By continuing, you agree to our <a href="${webUrl}/terms" target="_blank">Terms</a> and <a href="${webUrl}/privacy" target="_blank">Privacy Policy</a>
              </p>
            </div>
          </div>
        `;

        const style = document.createElement("style");
        style.id = "notto-auth-prompt-styles";
        style.textContent = `
          @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700&display=swap');

          .notto-auth-backdrop {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex; align-items: center; justify-content: center;
            z-index: 2147483647;
            font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(4px);
          }
          .notto-auth-modal {
            background: #fafafa; border-radius: 16px; padding: 32px;
            max-width: 380px; width: 90%; position: relative;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }
          .notto-auth-close {
            position: absolute; top: 16px; right: 16px;
            width: 32px; height: 32px; background: transparent; border: none;
            border-radius: 8px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            color: #a3a3a3; transition: background 0.15s, color 0.15s;
          }
          .notto-auth-close:hover { background: #e5e5e5; color: #525252; }
          .notto-auth-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
          .notto-auth-logo-icon {
            width: 36px; height: 36px; background: #171717; border-radius: 8px;
            display: flex; align-items: center; justify-content: center; color: white;
          }
          .notto-auth-logo-text { font-weight: 700; font-size: 18px; letter-spacing: -0.025em; color: #171717; }
          .notto-auth-logo-accent { color: #ea580c; }
          .notto-auth-title {
            font-family: 'Instrument Serif', serif; font-size: 32px; font-weight: 400;
            color: #171717; margin: 0 0 8px; line-height: 1.2;
          }
          .notto-auth-description { font-size: 14px; color: #737373; margin: 0 0 24px; line-height: 1.5; }
          .notto-auth-toggle {
            display: flex; background: #e5e5e5; border-radius: 8px; padding: 4px; margin-bottom: 20px;
          }
          .notto-auth-toggle-btn {
            flex: 1; padding: 8px 16px; border: none; border-radius: 6px;
            font-size: 14px; font-weight: 500; cursor: pointer;
            transition: all 0.15s; background: transparent; color: #737373;
          }
          .notto-auth-toggle-btn:hover { color: #525252; }
          .notto-auth-toggle-btn.active {
            background: white; color: #171717; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .notto-auth-button {
            width: 100%; padding: 12px 24px; background: #171717; color: white;
            border: none; border-radius: 8px; font-size: 14px; font-weight: 500;
            cursor: pointer; transition: background 0.15s;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          }
          .notto-auth-button:hover { background: #262626; }
          .notto-auth-button:disabled { background: #a3a3a3; cursor: not-allowed; }
          .notto-auth-status { font-size: 12px; color: #737373; text-align: center; margin: 12px 0 0; min-height: 18px; }
          .notto-auth-terms { font-size: 12px; color: #a3a3a3; text-align: center; margin: 8px 0 0; line-height: 1.5; }
          .notto-auth-terms a { color: #ea580c; text-decoration: none; }
          .notto-auth-terms a:hover { text-decoration: underline; }
        `;

        document.head.appendChild(style);
        document.body.appendChild(overlay);

        const removePrompt = () => {
          document.getElementById("notto-auth-prompt")?.remove();
          document.getElementById("notto-auth-prompt-styles")?.remove();
        };

        const switchMode = (mode: "login" | "register") => {
          currentMode = mode;
          const title = document.getElementById("notto-auth-title");
          const description = document.getElementById("notto-auth-description");
          const btnText = document.getElementById("notto-auth-btn-text");
          const loginToggle = document.getElementById("notto-mode-login");
          const registerToggle = document.getElementById("notto-mode-register");

          if (mode === "login") {
            if (title) title.textContent = "Welcome back";
            if (description)
              description.textContent =
                "Sign in to save and sync your screenshots";
            if (btnText) btnText.textContent = "Sign in with Email";
            loginToggle?.classList.add("active");
            registerToggle?.classList.remove("active");
          } else {
            if (title) title.textContent = "Create your account";
            if (description)
              description.textContent = "Get started with Notto in seconds";
            if (btnText) btnText.textContent = "Create Account";
            loginToggle?.classList.remove("active");
            registerToggle?.classList.add("active");
          }
        };

        document
          .getElementById("notto-mode-login")
          ?.addEventListener("click", () => switchMode("login"));
        document
          .getElementById("notto-mode-register")
          ?.addEventListener("click", () => switchMode("register"));

        document
          .getElementById("notto-auth-signin-btn")
          ?.addEventListener("click", () => {
            const modeParam = currentMode === "register" ? "register" : "login";
            const btn = document.getElementById(
              "notto-auth-signin-btn",
            ) as HTMLButtonElement;
            const statusEl = document.getElementById("notto-auth-status");

            if (btn) {
              btn.disabled = true;
              btn.innerHTML = "<span>Opening login page...</span>";
            }
            if (statusEl) {
              statusEl.textContent = "";
              statusEl.style.color = "#737373";
            }

            chrome.runtime.sendMessage(
              {
                action: "startAuthFlow",
                mode: modeParam,
              },
              (response) => {
                // Re-enable button if there was an error
                if (!response?.success && btn) {
                  btn.disabled = false;
                  btn.innerHTML = `
                    <span id="notto-auth-btn-text">${currentMode === "register" ? "Create Account" : "Sign in with Email"}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  `;

                  // Display error message
                  if (statusEl && response?.error) {
                    statusEl.textContent = response.error;
                    statusEl.style.color = "#dc2626";
                  }
                }
              },
            );
          });

        document
          .getElementById("notto-auth-close-btn")
          ?.addEventListener("click", removePrompt);

        overlay
          .querySelector(".notto-auth-backdrop")
          ?.addEventListener("click", (e) => {
            if (e.target === e.currentTarget) removePrompt();
          });

        document.addEventListener("keydown", function handler(e) {
          if (e.key === "Escape") {
            removePrompt();
            document.removeEventListener("keydown", handler);
          }
        });

        // Listen for auth status updates from background
        chrome.runtime.onMessage.addListener(function handler(message) {
          if (message.action === "authFlowStatus") {
            const statusEl = document.getElementById("notto-auth-status");
            if (statusEl) statusEl.textContent = message.status;
          }
          if (message.action === "authFlowComplete") {
            removePrompt();
            chrome.runtime.onMessage.removeListener(handler);
          }
        });
      },
      args: [config.WEB_URL],
    });
  } catch (error) {
    console.error("Notto: Failed to show auth prompt", error);
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (!isValidTab(tab)) {
    return;
  }

  const isAuthenticated = await hasValidTokens();
  if (!isAuthenticated) {
    // Inject the new auth prompt script and call the function
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ["dist/auth-prompt-new.js"],
      });

      // Call the showAuthPrompt function
      await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: () => {
          // @ts-ignore - showAuthPrompt is defined in auth-prompt-new.js
          if (typeof showAuthPrompt === "function") {
            showAuthPrompt();
          }
        },
      });
    } catch (error) {
      console.error("Failed to show auth prompt:", error);
    }
    return;
  }

  try {
    const isReady = await waitForDocumentReady(tab.id!);
    if (!isReady) {
      console.error("Notto: Page did not finish loading.");
      return;
    }

    const screenshotDataUrl = await chrome.tabs.captureVisibleTab({
      format: "png",
    });
    if (!screenshotDataUrl) {
      console.error("Notto: Failed to capture screenshot");
      return;
    }

    await chrome.scripting.insertCSS({
      target: { tabId: tab.id! },
      files: ["dist/overlay.css"],
    });

    const [fabricCheck] = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: () =>
        typeof (window as unknown as { fabric?: unknown }).fabric !==
        "undefined",
    });

    if (!fabricCheck?.result) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ["lib/fabric.min.js"],
      });
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      files: ["dist/content.js"],
    });

    await chrome.tabs.sendMessage(tab.id!, {
      action: "initOverlay",
      screenshot: screenshotDataUrl,
      pageUrl: tab.url,
      pageTitle: tab.title,
    });
  } catch (error) {
    console.error("Notto: Failed to capture screenshot", error);
  }
});

// Handle messages from content script and auth flow
chrome.runtime.onMessage.addListener(
  (
    message: {
      action: string;
      url?: string;
      filename?: string;
      saveAs?: boolean;
      mode?: string;
      user?: { id: string; email: string; name: string | null };
      endpoint?: string;
      method?: string;
      body?: unknown;
      headers?: Record<string, string>;
    },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: {
      success: boolean;
      error?: string;
      data?: unknown;
      user?: { id: string; email: string; name: string | null };
    }) => void,
  ) => {
    if (message.action === "download") {
      chrome.downloads
        .download({
          url: message.url!,
          filename: message.filename!,
          saveAs: message.saveAs || false,
        })
        .then(() => sendResponse({ success: true }))
        .catch((err: Error) =>
          sendResponse({ success: false, error: err.message }),
        );
      return true;
    }

    if (message.action === "apiRequest") {
      // Proxy API requests through background script to avoid CORS issues
      handleApiRequest(
        message.endpoint!,
        message.method || "GET",
        message.body,
        message.headers,
      )
        .then((data) => sendResponse({ success: true, data }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        );
      return true;
    }

    if (message.action === "startAuthFlow") {
      // Start the OAuth flow using chrome.identity API
      startOAuthFlow(message.mode as "login" | "register")
        .then((result) => {
          broadcastAuthComplete(result.success);
          if (result.success) {
            sendResponse({ success: true, user: result.user });
          } else {
            // Send error details back to content script
            sendResponse({
              success: false,
              error: result.error || "Authentication failed",
            });
          }
        })
        .catch((error) => {
          console.error("Notto Background: Auth flow error", error);
          broadcastAuthComplete(false);
          sendResponse({
            success: false,
            error:
              error instanceof Error ? error.message : "Authentication failed",
          });
        });
      return true; // Keep message channel open for async response
    }

    if (message.action === "logout") {
      // Handle logout request
      handleLogout()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error("Notto Background: Logout error", error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Logout failed",
          });
        });
      return true;
    }

    if (message.action === "authComplete") {
      sendResponse({ success: true });
      return false;
    }

    return false;
  },
);

/**
 * Handle API requests through background script to avoid CORS issues
 */
async function handleApiRequest(
  endpoint: string,
  method: string = "GET",
  body?: unknown,
  additionalHeaders?: Record<string, string>,
): Promise<unknown> {
  const { getAccessToken, getRefreshToken, updateAccessToken, clearAuthState } =
    await import("../utils/auth-storage");

  let accessToken = await getAccessToken();

  // Check if access token is expired before making request
  if (accessToken) {
    const isExpired = isTokenExpired(accessToken);
    if (isExpired) {
      // Token is expired, try to refresh it proactively
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        const newToken = await refreshTokenIfNeeded(refreshToken);
        if (newToken) {
          accessToken = newToken;
        } else {
          // Refresh failed, clear auth state and throw error
          await clearAuthState();
          throw new Error("AUTHENTICATION_REQUIRED");
        }
      } else {
        // No refresh token available
        await clearAuthState();
        throw new Error("AUTHENTICATION_REQUIRED");
      }
    }
  }

  const makeRequest = async (token: string | null) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(additionalHeaders || {}),
    };

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${config.API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
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
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      const newToken = await refreshTokenIfNeeded(refreshToken);
      if (newToken) {
        // Retry the request with new token
        response = await makeRequest(newToken);
      } else {
        // Refresh failed, clear auth state and throw error
        await clearAuthState();
        throw new Error("AUTHENTICATION_REQUIRED");
      }
    } else {
      // No refresh token available
      await clearAuthState();
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
    throw new Error(errorMessage);
  }

  return response.json();
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
    console.error("Notto: Failed to parse token:", error);
    return true; // Treat invalid tokens as expired
  }
}

/**
 * Attempts to refresh the access token using the refresh token
 * Returns the new access token or null if refresh failed
 */
async function refreshTokenIfNeeded(
  refreshToken: string,
): Promise<string | null> {
  const { updateAccessToken, clearAuthState } =
    await import("../utils/auth-storage");

  try {
    const refreshResponse = await fetch(`${config.API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      await updateAccessToken(data.accessToken);
      console.log("Notto: Access token refreshed successfully");
      return data.accessToken;
    } else {
      console.error("Notto: Token refresh failed:", refreshResponse.status);
      await clearAuthState();
      return null;
    }
  } catch (error) {
    console.error("Notto: Token refresh error:", error);
    await clearAuthState();
    return null;
  }
}
