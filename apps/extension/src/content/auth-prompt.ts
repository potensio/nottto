// Auth prompt UI for extension
// Displayed when user is not authenticated
import { config } from "../config";

const WEB_URL = config.WEB_URL;

/**
 * Creates and displays the auth prompt overlay
 */
export function showAuthPrompt(): void {
  // Remove existing prompt if any
  removeAuthPrompt();

  const overlay = document.createElement("div");
  overlay.id = "nottto-auth-prompt";
  overlay.innerHTML = `
    <div class="nottto-auth-backdrop">
      <div class="nottto-auth-modal">
        <div class="nottto-auth-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2 class="nottto-auth-title">Sign in to Nottto</h2>
        <p class="nottto-auth-description">
          Sign in to save and sync your screenshots across devices.
        </p>
        <button id="nottto-auth-signin-btn" class="nottto-auth-button">
          Sign in
        </button>
        <button id="nottto-auth-close-btn" class="nottto-auth-close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement("style");
  style.id = "nottto-auth-prompt-styles";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700&display=swap');

    .nottto-auth-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .nottto-auth-modal {
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 360px;
      width: 90%;
      text-align: center;
      position: relative;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .nottto-auth-icon {
      width: 64px;
      height: 64px;
      background: #fef2f2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      color: #eb3b3b;
    }

    .nottto-auth-title {
      font-family: 'Instrument Serif', serif;
      font-size: 24px;
      font-weight: 400;
      color: #171717;
      margin: 0 0 8px;
    }

    .nottto-auth-description {
      font-size: 14px;
      color: #525252;
      margin: 0 0 24px;
      line-height: 1.5;
    }

    .nottto-auth-button {
      width: 100%;
      padding: 12px 24px;
      background: #171717;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .nottto-auth-button:hover {
      background: #262626;
    }

    .nottto-auth-close {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #a3a3a3;
      transition: background 0.2s, color 0.2s;
    }

    .nottto-auth-close:hover {
      background: #f5f5f5;
      color: #525252;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  // Add event listeners
  const signInBtn = document.getElementById("nottto-auth-signin-btn");
  const closeBtn = document.getElementById("nottto-auth-close-btn");

  signInBtn?.addEventListener("click", () => {
    openAuthPage();
    removeAuthPrompt();
  });

  closeBtn?.addEventListener("click", () => {
    removeAuthPrompt();
  });

  // Close on backdrop click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay.querySelector(".nottto-auth-backdrop")) {
      removeAuthPrompt();
    }
  });

  // Close on Escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      removeAuthPrompt();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);
}

/**
 * Removes the auth prompt overlay
 */
export function removeAuthPrompt(): void {
  const overlay = document.getElementById("nottto-auth-prompt");
  const styles = document.getElementById("nottto-auth-prompt-styles");
  overlay?.remove();
  styles?.remove();
}

/**
 * Opens the web app auth page in a new tab
 */
export function openAuthPage(): void {
  window.open(`${WEB_URL}/auth?source=extension`, "_blank");
}
