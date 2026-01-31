// New auth prompt with 6-digit code verification
// Direct authentication in extension without OAuth
import { config } from "../config";

const API_URL = config.API_URL;
const WEB_URL = config.WEB_URL;

type AuthStep = "email" | "code" | "loading" | "success" | "error";
type AuthMode = "login" | "register";

let currentStep: AuthStep = "email";
let currentMode: AuthMode = "login";
let userEmail = "";
let userName = "";

/**
 * Shows the new auth prompt with email and code input
 */
export function showAuthPrompt(errorMessage?: string): void {
  removeAuthPrompt();

  const overlay = document.createElement("div");
  overlay.id = "notto-auth-prompt";

  const style = document.createElement("style");
  style.id = "notto-auth-prompt-styles";
  style.textContent = getStyles();

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  renderStep("email", errorMessage);
}

/**
 * Renders the current step
 */
function renderStep(step: AuthStep, message?: string): void {
  currentStep = step;
  const overlay = document.getElementById("notto-auth-prompt");
  if (!overlay) return;

  overlay.innerHTML = getStepHTML(step, message);
  initEventListeners();
}

/**
 * Returns HTML for the current step
 */
function getStepHTML(step: AuthStep, message?: string): string {
  const iconUrl = chrome.runtime.getURL("icons/icon48.png");

  const backdrop = `<div class="notto-auth-backdrop">`;
  const modalStart = `<div class="notto-auth-modal">`;
  const closeBtn = `
    <button id="notto-auth-close-btn" class="notto-auth-close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;
  const logo = `
    <div class="notto-auth-logo">
      <img src="${iconUrl}" alt="Notto" class="notto-auth-logo-icon" />
    </div>
  `;

  let content = "";

  switch (step) {
    case "email":
      content = `
        ${logo}
        <h2 class="notto-auth-title">${currentMode === "login" ? "Welcome back" : "Create account"}</h2>
        <p class="notto-auth-description">${currentMode === "login" ? "Enter your email to sign in" : "Enter your details to get started"}</p>
        
        ${message ? `<div class="notto-auth-error">${message}</div>` : ""}
        
        <div class="notto-auth-toggle">
          <button type="button" id="notto-mode-login" class="notto-auth-toggle-btn ${currentMode === "login" ? "active" : ""}">Login</button>
          <button type="button" id="notto-mode-register" class="notto-auth-toggle-btn ${currentMode === "register" ? "active" : ""}">Register</button>
        </div>
        
        ${
          currentMode === "register"
            ? `
          <div class="notto-auth-input-group">
            <label>Full Name</label>
            <input type="text" id="notto-name-input" placeholder="John Doe" value="${userName}" />
          </div>
        `
            : ""
        }
        
        <div class="notto-auth-input-group">
          <label>Email Address</label>
          <input type="email" id="notto-email-input" placeholder="you@example.com" value="${userEmail}" />
        </div>
        
        <button id="notto-submit-btn" class="notto-auth-button">
          <span>Continue</span>
          <svg class="notto-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
          <svg class="notto-btn-loader" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </button>
        
        <p class="notto-auth-terms">
          By continuing, you agree to our <a href="${WEB_URL}/terms" target="_blank">Terms</a> and <a href="${WEB_URL}/privacy" target="_blank">Privacy Policy</a>
        </p>
      `;
      break;

    case "code":
      content = `
        ${logo}
        <h2 class="notto-auth-title">Check your email</h2>
        <p class="notto-auth-description">We sent a 6-digit code to<br/><strong>${userEmail}</strong></p>
        
        ${message ? `<div class="notto-auth-error">${message}</div>` : ""}
        
        <div class="notto-auth-code-inputs">
          <input type="text" maxlength="1" class="notto-code-input" data-index="0" />
          <input type="text" maxlength="1" class="notto-code-input" data-index="1" />
          <input type="text" maxlength="1" class="notto-code-input" data-index="2" />
          <input type="text" maxlength="1" class="notto-code-input" data-index="3" />
          <input type="text" maxlength="1" class="notto-code-input" data-index="4" />
          <input type="text" maxlength="1" class="notto-code-input" data-index="5" />
        </div>
        
        <button id="notto-verify-btn" class="notto-auth-button" disabled>
          <span>Verify Code</span>
        </button>
        
        <button id="notto-back-btn" class="notto-auth-button-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Use different email</span>
        </button>
      `;
      break;

    case "loading":
      content = `
        ${logo}
        <div class="notto-auth-loading">
          <svg class="notto-spinner" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="display: block; margin: 0 auto;">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p>${message || "Processing..."}</p>
        </div>
      `;
      break;

    case "success":
      content = `
        ${logo}
        <div class="notto-auth-success">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1" style="display: block; margin: 0 auto;">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h2>You're all set!</h2>
          <p>${message || "Authentication successful"}</p>
        </div>
      `;
      break;

    case "error":
      content = `
        ${logo}
        <div class="notto-auth-error-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1" style="display: block; margin: 0 auto;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <h2>Something went wrong</h2>
          <p>${message || "Please try again"}</p>
        </div>
        <button id="notto-retry-btn" class="notto-auth-button">Try Again</button>
      `;
      break;
  }

  return `${backdrop}${modalStart}${step !== "loading" && step !== "success" ? closeBtn : ""}${content}</div></div>`;
}

/**
 * Initialize event listeners for current step
 */
function initEventListeners(): void {
  const overlay = document.getElementById("notto-auth-prompt");
  if (!overlay) return;

  // Close button
  const closeBtn = document.getElementById("notto-auth-close-btn");
  closeBtn?.addEventListener("click", removeAuthPrompt);

  // Mode toggle
  document.getElementById("notto-mode-login")?.addEventListener("click", () => {
    currentMode = "login";
    renderStep("email");
  });
  document
    .getElementById("notto-mode-register")
    ?.addEventListener("click", () => {
      currentMode = "register";
      renderStep("email");
    });

  // Email step
  const emailInput = document.getElementById(
    "notto-email-input",
  ) as HTMLInputElement;
  const nameInput = document.getElementById(
    "notto-name-input",
  ) as HTMLInputElement;
  const submitBtn = document.getElementById("notto-submit-btn");

  emailInput?.focus();

  submitBtn?.addEventListener("click", async () => {
    userEmail = emailInput?.value.trim() || "";
    userName = nameInput?.value.trim() || "";

    if (!userEmail || !userEmail.includes("@")) {
      renderStep("email", "Please enter a valid email address");
      return;
    }

    if (currentMode === "register" && !userName) {
      renderStep("email", "Please enter your full name");
      return;
    }

    // Show loader
    const btnText = submitBtn.querySelector("span");
    const btnIcon = submitBtn.querySelector(".notto-btn-icon") as HTMLElement;
    const btnLoader = submitBtn.querySelector(
      ".notto-btn-loader",
    ) as HTMLElement;
    if (btnText) btnText.textContent = "Sending...";
    if (btnIcon) btnIcon.style.display = "none";
    if (btnLoader) btnLoader.style.display = "block";
    (submitBtn as HTMLButtonElement).disabled = true;

    await requestCode();
  });

  // Code inputs
  const codeInputs = document.querySelectorAll(
    ".notto-code-input",
  ) as NodeListOf<HTMLInputElement>;
  const verifyBtn = document.getElementById(
    "notto-verify-btn",
  ) as HTMLButtonElement;

  codeInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      const value = (e.target as HTMLInputElement).value;
      if (value && index < 5) {
        codeInputs[index + 1].focus();
      }

      // Check if all inputs are filled
      const code = Array.from(codeInputs)
        .map((i) => i.value)
        .join("");
      if (verifyBtn) {
        verifyBtn.disabled = code.length !== 6;
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        codeInputs[index - 1].focus();
      }
    });

    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData?.getData("text") || "";
      const digits = pastedData.replace(/\D/g, "").slice(0, 6);

      digits.split("").forEach((digit, i) => {
        if (codeInputs[i]) {
          codeInputs[i].value = digit;
        }
      });

      if (digits.length === 6 && verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.focus();
      }
    });
  });

  if (codeInputs.length > 0) {
    codeInputs[0].focus();
  }

  verifyBtn?.addEventListener("click", async () => {
    const code = Array.from(codeInputs)
      .map((i) => i.value)
      .join("");
    await verifyCode(code);
  });

  // Back button
  document.getElementById("notto-back-btn")?.addEventListener("click", () => {
    renderStep("email");
  });

  // Retry button
  document.getElementById("notto-retry-btn")?.addEventListener("click", () => {
    renderStep("email");
  });

  // Backdrop click
  overlay
    .querySelector(".notto-auth-backdrop")
    ?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget && currentStep !== "loading") {
        removeAuthPrompt();
      }
    });

  // Escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape" && currentStep !== "loading") {
      removeAuthPrompt();
    }
  };
  document.addEventListener("keydown", handleEscape);
}

/**
 * Request verification code from API
 */
async function requestCode(): Promise<void> {
  renderStep("loading", "Sending code...");

  try {
    const response = await fetch(`${API_URL}/auth/request-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        isRegister: currentMode === "register",
        name: currentMode === "register" ? userName : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error?.message || error.message || "Failed to send code",
      );
    }

    renderStep("code");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send code";
    renderStep("error", message);
  }
}

/**
 * Verify code with API
 */
async function verifyCode(code: string): Promise<void> {
  renderStep("loading", "Verifying code...");

  try {
    const response = await fetch(`${API_URL}/auth/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Important: include cookies
      body: JSON.stringify({
        email: userEmail,
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || error.message || "Invalid code");
    }

    const data = await response.json();

    // Store tokens using correct storage keys for extension
    await chrome.storage.local.set({
      notto_access_token: data.tokens.accessToken,
      notto_refresh_token: data.tokens.refreshToken,
      notto_user: data.user,
    });

    renderStep("success", "Welcome to Notto!");

    // Redirect user to magic link URL to log in on web app
    // This opens in a new tab and logs them in automatically
    if (data.magicLinkUrl) {
      setTimeout(() => {
        window.open(data.magicLinkUrl, "_blank");
      }, 500);
    }

    // Close auth prompt and reload after 2 seconds
    setTimeout(() => {
      removeAuthPrompt();
      window.location.reload();
    }, 2000);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid code";
    renderStep("code", message);
  }
}

/**
 * Removes the auth prompt
 */
export function removeAuthPrompt(): void {
  document.getElementById("notto-auth-prompt")?.remove();
  document.getElementById("notto-auth-prompt-styles")?.remove();
}

/**
 * Returns CSS styles
 */
function getStyles(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Manrope:wght@400;500;600;700&display=swap');

    .notto-auth-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 2147483647;
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .notto-auth-modal {
      background: #fafafa; border-radius: 16px; padding: 32px;
      max-width: 400px; width: 90%; position: relative;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .notto-auth-close {
      position: absolute; top: 16px; right: 16px;
      width: 32px; height: 32px; background: transparent; border: none;
      border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #a3a3a3; transition: all 0.15s;
    }

    .notto-auth-close:hover { background: #e5e5e5; color: #525252; }

    .notto-auth-logo {
      display: flex; justify-content: center; margin-bottom: 24px;
    }

    .notto-auth-logo-icon {
      width: 24px; height: 24px; border-radius: 6px;
    }

    .notto-auth-title {
      font-family: 'Instrument Serif', serif; font-size: 28px; font-weight: 400;
      color: #171717; margin: 0 0 8px; text-align: center;
    }

    .notto-auth-description {
      font-size: 14px; color: #737373; margin: 0 0 24px;
      text-align: center; line-height: 1.5;
    }

    .notto-auth-error {
      padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 8px; margin-bottom: 16px; color: #991b1b;
      font-size: 13px; text-align: center;
    }

    .notto-auth-toggle {
      display: flex; background: #e5e5e5; border-radius: 8px;
      padding: 4px; margin-bottom: 20px;
    }

    .notto-auth-toggle-btn {
      flex: 1; padding: 8px 16px; border: none; border-radius: 6px;
      font-size: 14px; font-weight: 500; cursor: pointer;
      transition: all 0.15s; background: transparent; color: #737373;
    }

    .notto-auth-toggle-btn:hover { color: #525252; }

    .notto-auth-toggle-btn.active {
      background: white; color: #171717;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .notto-auth-input-group {
      margin-bottom: 16px;
    }

    .notto-auth-input-group label {
      display: block; font-size: 13px; font-weight: 500;
      color: #525252; margin-bottom: 6px;
    }

    .notto-auth-input-group input {
      width: 100%; padding: 10px 12px; border: 1px solid #e5e5e5;
      border-radius: 8px; font-size: 14px; color: #171717;
      background: white; transition: all 0.15s;
    }

    .notto-auth-input-group input:focus {
      outline: none; border-color: #ea580c;
      box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
    }

    .notto-auth-code-inputs {
      display: flex; gap: 8px; justify-content: center; margin-bottom: 20px;
    }

    .notto-code-input {
      width: 48px; height: 56px; text-align: center;
      font-size: 24px; font-weight: 600; border: 2px solid #e5e5e5;
      border-radius: 8px; background: white; color: #171717;
      transition: all 0.15s;
    }

    .notto-code-input:focus {
      outline: none; border-color: #ea580c;
      box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
    }

    .notto-auth-button {
      width: 100%; padding: 12px 24px; background: #171717; color: white;
      border: none; border-radius: 8px; font-size: 14px; font-weight: 500;
      cursor: pointer; transition: all 0.15s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-bottom: 12px;
    }

    .notto-auth-button:hover:not(:disabled) { background: #262626; }
    .notto-auth-button:disabled { opacity: 0.5; cursor: not-allowed; }

    .notto-auth-button-secondary {
      width: 100%; padding: 10px 24px; background: transparent;
      color: #525252; border: none; border-radius: 8px;
      font-size: 14px; font-weight: 500; cursor: pointer;
      transition: all 0.15s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }

    .notto-auth-button-secondary:hover { background: #e5e5e5; }

    .notto-auth-terms {
      font-size: 12px; color: #a3a3a3; text-align: center;
      margin: 16px 0 0; line-height: 1.5;
    }

    .notto-auth-terms a { color: #ea580c; text-decoration: none; }
    .notto-auth-terms a:hover { text-decoration: underline; }

    .notto-auth-loading, .notto-auth-success, .notto-auth-error-state {
      text-align: center; padding: 20px 0;
    }

    .notto-auth-loading p, .notto-auth-success p, .notto-auth-error-state p {
      margin: 16px 0 0; color: #737373; font-size: 14px;
    }

    .notto-auth-success h2, .notto-auth-error-state h2 {
      font-size: 20px; font-weight: 600; color: #171717;
      margin: 16px 0 8px;
    }

    .notto-spinner {
      animation: spin 0.5s linear infinite;
      margin: 0 auto;
    }

    .notto-btn-loader {
      animation: spin 0.5s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
}

// Expose globally for extension to call
(window as any).showAuthPrompt = showAuthPrompt;
(window as any).removeAuthPrompt = removeAuthPrompt;
