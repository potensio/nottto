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
  overlay.innerHTML = getModalHTML();

  // Add styles
  const style = document.createElement("style");
  style.id = "nottto-auth-prompt-styles";
  style.textContent = getStyles();

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  // Initialize event listeners
  initEventListeners(overlay);
}

/**
 * Returns the modal HTML structure
 */
function getModalHTML(): string {
  // Get the extension icon URL
  const iconUrl = chrome.runtime.getURL("icons/icon48.png");

  return `
    <div class="nottto-auth-backdrop">
      <div class="nottto-auth-modal">
        <button id="nottto-auth-close-btn" class="nottto-auth-close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <!-- Logo -->
        <div class="nottto-auth-logo">
          <img src="${iconUrl}" alt="Nottto" class="nottto-auth-logo-icon" />
        </div>
        
        <!-- Header -->
        <h2 class="nottto-auth-title">Welcome to Nottto</h2>
        <p class="nottto-auth-description">Sign in to save and sync your screenshots</p>
        
        <!-- Sign In Button -->
        <button id="nottto-auth-signin-btn" class="nottto-auth-button">
          <span>Login / Register</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
        
        <!-- Terms -->
        <p class="nottto-auth-terms">
          By continuing, you agree to our <a href="${WEB_URL}/terms" target="_blank">Terms</a> and <a href="${WEB_URL}/privacy" target="_blank">Privacy Policy</a>
        </p>
      </div>
    </div>
  `;
}

/**
 * Returns the CSS styles for the modal
 */
function getStyles(): string {
  return `
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
      backdrop-filter: blur(4px);
    }

    .nottto-auth-modal {
      background: #fafafa;
      border-radius: 16px;
      padding: 32px;
      max-width: 380px;
      width: 90%;
      position: relative;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .nottto-auth-close {
      position: absolute;
      top: 16px;
      right: 16px;
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
      transition: background 0.15s, color 0.15s;
    }

    .nottto-auth-close:hover {
      background: #e5e5e5;
      color: #525252;
    }

    .nottto-auth-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    .nottto-auth-logo-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
    }

    .nottto-auth-title {
      font-family: 'Instrument Serif', serif;
      font-size: 32px;
      font-weight: 400;
      color: #171717;
      margin: 0 0 8px;
      line-height: 1.2;
      text-align: center;
    }

    .nottto-auth-description {
      font-size: 14px;
      color: #737373;
      margin: 0 0 24px;
      line-height: 1.5;
      text-align: center;
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
      transition: background 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .nottto-auth-button:hover {
      background: #262626;
    }

    .nottto-auth-terms {
      font-size: 12px;
      color: #a3a3a3;
      text-align: center;
      margin: 16px 0 0;
      line-height: 1.5;
    }

    .nottto-auth-terms a {
      color: #ea580c;
      text-decoration: none;
    }

    .nottto-auth-terms a:hover {
      text-decoration: underline;
    }
  `;
}

/**
 * Initialize all event listeners for the modal
 */
function initEventListeners(overlay: HTMLElement): void {
  const signInBtn = document.getElementById("nottto-auth-signin-btn");
  const closeBtn = document.getElementById("nottto-auth-close-btn");

  // Sign in button
  signInBtn?.addEventListener("click", () => {
    openAuthPage();
    removeAuthPrompt();
  });

  // Close button
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
