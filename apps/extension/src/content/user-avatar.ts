// User avatar component for the annotation form header
import type { User } from "../utils/auth-storage";
import { clearAuthState } from "../utils/auth-storage";
import { getInitials, getAvatarColor } from "../utils/user-utils";
import { cleanupOverlay } from "./overlay";

let dropdownOpen = false;
let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
let escapeHandler: ((e: KeyboardEvent) => void) | null = null;

/**
 * Creates the user avatar HTML - displays image or initials
 */
export function createUserAvatar(user: User): string {
  const initials = getInitials(user);
  const bgColor = getAvatarColor(user);

  if (user.avatarUrl) {
    return `
      <button id="bf-user-avatar-btn" class="bf-user-avatar" title="${
        user.email
      }">
        <img 
          src="${user.avatarUrl}" 
          alt="${user.name || user.email}" 
          class="bf-avatar-img"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <span class="bf-avatar-initials" style="background-color: ${bgColor}; display: none;">${initials}</span>
      </button>
    `;
  }

  return `
    <button id="bf-user-avatar-btn" class="bf-user-avatar" title="${user.email}">
      <span class="bf-avatar-initials" style="background-color: ${bgColor};">${initials}</span>
    </button>
  `;
}

/**
 * Creates the avatar dropdown menu HTML
 */
export function createAvatarDropdown(user: User): string {
  return `
    <div id="bf-avatar-dropdown" class="bf-avatar-dropdown" data-hidden="true">
      <div class="bf-dropdown-header">
        <span class="bf-dropdown-email">${user.email}</span>
      </div>
      <div class="bf-dropdown-divider"></div>
      <button id="bf-signout-btn" class="bf-dropdown-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Sign out
      </button>
    </div>
  `;
}

/**
 * Toggles the dropdown visibility
 */
export function toggleDropdown(): void {
  const dropdown = document.getElementById("bf-avatar-dropdown");
  if (!dropdown) return;

  dropdownOpen = !dropdownOpen;

  if (dropdownOpen) {
    dropdown.removeAttribute("data-hidden");
    setupDropdownCloseHandlers();
  } else {
    dropdown.setAttribute("data-hidden", "true");
    removeDropdownCloseHandlers();
  }
}

/**
 * Closes the dropdown
 */
export function closeDropdown(): void {
  const dropdown = document.getElementById("bf-avatar-dropdown");
  if (dropdown && dropdownOpen) {
    dropdown.setAttribute("data-hidden", "true");
    dropdownOpen = false;
    removeDropdownCloseHandlers();
  }
}

/**
 * Sets up handlers to close dropdown on click outside or Escape key
 */
function setupDropdownCloseHandlers(): void {
  // Click outside handler
  clickOutsideHandler = (e: MouseEvent) => {
    const dropdown = document.getElementById("bf-avatar-dropdown");
    const avatarBtn = document.getElementById("bf-user-avatar-btn");
    const target = e.target as Node;

    if (
      dropdown &&
      !dropdown.contains(target) &&
      avatarBtn &&
      !avatarBtn.contains(target)
    ) {
      closeDropdown();
    }
  };

  // Escape key handler
  escapeHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeDropdown();
    }
  };

  // Add handlers with a small delay to prevent immediate close
  setTimeout(() => {
    document.addEventListener("click", clickOutsideHandler!);
    document.addEventListener("keydown", escapeHandler!);
  }, 10);
}

/**
 * Removes dropdown close handlers
 */
function removeDropdownCloseHandlers(): void {
  if (clickOutsideHandler) {
    document.removeEventListener("click", clickOutsideHandler);
    clickOutsideHandler = null;
  }
  if (escapeHandler) {
    document.removeEventListener("keydown", escapeHandler);
    escapeHandler = null;
  }
}

/**
 * Handles the logout action
 */
export async function handleLogout(): Promise<void> {
  try {
    // Clear all stored authentication data
    await clearAuthState();

    // Also clear any legacy auth tokens that might exist
    await chrome.storage.local.remove(["authToken"]);

    // Optionally clear workspace/project selection on logout
    // This ensures a clean slate when the user logs back in
    await chrome.storage.local.remove(["notto_selection"]);

    // Close the annotation overlay
    cleanupOverlay();

    console.log("Notto: Successfully logged out");
  } catch (error) {
    console.error("Notto: Failed to logout", error);
  }
}

/**
 * Initializes avatar event listeners
 */
export function initUserAvatar(): void {
  const avatarBtn = document.getElementById("bf-user-avatar-btn");
  const signoutBtn = document.getElementById("bf-signout-btn");

  avatarBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  signoutBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    handleLogout();
  });
}

/**
 * Cleans up avatar event listeners
 */
export function cleanupUserAvatar(): void {
  removeDropdownCloseHandlers();
  dropdownOpen = false;
}
