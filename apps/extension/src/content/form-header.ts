// Form header component for the annotation form
// Contains workspace selector and user avatar

import type { User } from "../utils/auth-storage";
import { icons } from "../utils/icons";
import {
  createUserAvatar,
  createAvatarDropdown,
  initUserAvatar,
  cleanupUserAvatar,
} from "./user-avatar";

/**
 * Creates the form header HTML with workspace selector and user avatar
 */
export function createFormHeader(user: User | null): string {
  const avatarHtml = user
    ? createUserAvatar(user)
    : `<div class="bf-avatar-placeholder">?</div>`;

  const dropdownHtml = user ? createAvatarDropdown(user) : "";

  return `
    <div class="bf-form-header">
      <div class="bf-header-left">
        <div class="bf-workspace-switcher" id="bf-header-workspace">
          <button class="bf-workspace-trigger" id="bf-workspace-trigger" disabled>
            <div class="bf-workspace-icon">${icons.folder}</div>
            <span class="bf-workspace-name" id="bf-workspace-name">Loading...</span>
            <div class="bf-workspace-chevron">${icons.chevronDown}</div>
          </button>
          <div class="bf-workspace-dropdown hidden" id="bf-workspace-dropdown">
            <div class="bf-workspace-list" id="bf-workspace-list">
              <!-- Workspace items will be populated dynamically -->
            </div>
          </div>
        </div>
      </div>
      <div class="bf-header-right">
        <div class="bf-user-area">
          ${avatarHtml}
          ${dropdownHtml}
        </div>
      </div>
    </div>
  `;
}

/**
 * Initializes the form header event listeners
 */
export async function initFormHeader(): Promise<void> {
  // Initialize user avatar interactions
  initUserAvatar();
}

/**
 * Cleans up form header event listeners
 */
export function cleanupFormHeader(): void {
  cleanupUserAvatar();
}
