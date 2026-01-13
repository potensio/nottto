// Auth prompt UI for extension
// Displayed when user is not authenticated
import { config } from "../config";

const WEB_URL = config.WEB_URL;

type AuthMode = "login" | "register";

let currentMode: AuthMode = "login";

/**
 * Creates and displays the auth prompt overlay
 */
export function showAuthPrompt(): void {
  // Remove existing prompt if any
  removeAuthPrompt();
  currentMode = "login";

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
          <div class="nottto-auth-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="M2 2l7.586 7.586"></path>
              <circle cx="11" cy="11" r="2"></circle>
            </svg>
          </div>
          <span class="nottto-auth-logo-text">Nott<span class="nottto-auth-logo-accent">to</span></span>
        </div>
        
        <!-- Header -->
        <h2 class="nottto-auth-title" id="nottto-auth-title">Welcome back</h2>
        <p class="nottto-auth-description" id="nottto-auth-description">Sign in to save and sync your screenshots</p>
        
        <!-- Mode Toggle -->
        <div class="nottto-auth-toggle">
          <button type="button" id="nottto-mode-login" class="nottto-auth-toggle-btn active">Login</button>
          <button type="button" id="nottto-mode-register" class="nottto-auth-toggle-btn">Register</button>
        </div>
        
        <!-- Sign In Button -->
        <button id="nottto-auth-signin-btn" class="nottto-auth-button">
          <span id="nottto-auth-btn-text">Sign in with Email</span>
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
      gap: 10px;
      margin-bottom: 24px;
    }

    .nottto-auth-logo-icon {
      width: 36px;
      height: 36px;
      background: #171717;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .nottto-auth-logo-text {
      font-weight: 700;
      font-size: 18px;
      letter-spacing: -0.025em;
      color: #171717;
    }

    .nottto-auth-logo-accent {
      color: #ea580c;
    }

    .nottto-auth-title {
      font-family: 'Instrument Serif', serif;
      font-size: 32px;
      font-weight: 400;
      color: #171717;
      margin: 0 0 8px;
      line-height: 1.2;
    }

    .nottto-auth-description {
      font-size: 14px;
      color: #737373;
      margin: 0 0 24px;
      line-height: 1.5;
    }

    .nottto-auth-toggle {
      display: flex;
      background: #e5e5e5;
      border-radius: 8px;
      padding: 4px;
      margin-bottom: 20px;
    }

    .nottto-auth-toggle-btn {
      flex: 1;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      background: transparent;
      color: #737373;
    }

    .nottto-auth-toggle-btn:hover {
      color: #525252;
    }

    .nottto-auth-toggle-btn.active {
      background: white;
      color: #171717;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  const loginToggle = document.getElementById("nottto-mode-login");
  const registerToggle = document.getElementById("nottto-mode-register");

  // Mode toggle handlers
  loginToggle?.addEventListener("click", () => switchMode("login"));
  registerToggle?.addEventListener("click", () => switchMode("register"));

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
 * Switch between login and register modes
 */
function switchMode(mode: AuthMode): void {
  currentMode = mode;

  const title = document.getElementById("nottto-auth-title");
  const description = document.getElementById("nottto-auth-description");
  const btnText = document.getElementById("nottto-auth-btn-text");
  const loginToggle = document.getElementById("nottto-mode-login");
  const registerToggle = document.getElementById("nottto-mode-register");

  if (mode === "login") {
    if (title) title.textContent = "Welcome back";
    if (description)
      description.textContent = "Sign in to save and sync your screenshots";
    if (btnText) btnText.textContent = "Sign in with Email";
    loginToggle?.classList.add("active");
    registerToggle?.classList.remove("active");
  } else {
    if (title) title.textContent = "Create your account";
    if (description)
      description.textContent = "Get started with Nottto in seconds";
    if (btnText) btnText.textContent = "Create Account";
    loginToggle?.classList.remove("active");
    registerToggle?.classList.add("active");
  }
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
  const modeParam = currentMode === "register" ? "&mode=register" : "";
  window.open(`${WEB_URL}/auth?source=extension${modeParam}`, "_blank");
}
