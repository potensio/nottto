// Workspace selector functionality for the annotation form
import { listWorkspaces, type Workspace } from "../api/workspaces";
import {
  loadSelection,
  saveWorkspaceSelection,
} from "../utils/selection-storage";
import { initProjectSelector, resetProjectSelector } from "./project-selector";
import { config } from "../config";
import { icons } from "../utils/icons";

let workspaces: Workspace[] = [];
let selectedWorkspaceId: string | null = null;
let isDropdownOpen = false;

/**
 * Initialize the workspace selector - fetch workspaces and populate custom dropdown
 */
export async function initWorkspaceSelector(): Promise<void> {
  const trigger = document.getElementById(
    "bf-workspace-trigger"
  ) as HTMLButtonElement;
  const nameEl = document.getElementById("bf-workspace-name");

  if (!trigger || !nameEl) return;

  const maxRetries = 3;
  let retryCount = 0;

  const attemptFetch = async (): Promise<void> => {
    try {
      // Show loading state
      nameEl.textContent = retryCount > 0 ? "Retrying..." : "Loading...";
      trigger.disabled = true;

      // Fetch workspaces from API
      console.log(
        "Nottto: Fetching workspaces...",
        retryCount > 0 ? `(retry ${retryCount})` : ""
      );
      workspaces = await listWorkspaces();
      console.log("Nottto: Workspaces fetched:", workspaces.length);

      if (workspaces.length === 0) {
        renderNoWorkspacesState();
        return;
      }

      // Populate dropdown list
      renderWorkspaceList(workspaces);

      // Try to restore previous selection or auto-select first workspace
      const savedSelection = await loadSelection();
      let workspaceToSelect: string | null = null;

      if (savedSelection.workspaceId) {
        const exists = workspaces.some(
          (w) => w.id === savedSelection.workspaceId
        );
        if (exists) {
          workspaceToSelect = savedSelection.workspaceId;
        }
      }

      // If no valid saved selection, auto-select first workspace
      if (!workspaceToSelect && workspaces.length > 0) {
        workspaceToSelect = workspaces[0].id;
        await saveWorkspaceSelection(workspaceToSelect);
      }

      // Apply the selection
      if (workspaceToSelect) {
        await selectWorkspace(workspaceToSelect, false);
      }

      // Enable the trigger
      trigger.disabled = false;

      // Setup event listeners
      setupDropdownListeners();
    } catch (error) {
      console.error("Nottto: Failed to load workspaces", error);

      // Check if it's an authentication error
      if (
        error instanceof Error &&
        error.message === "AUTHENTICATION_REQUIRED"
      ) {
        renderAuthRequiredState();
        return;
      }

      // Retry logic for network errors
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(
          `Nottto: Retrying workspace fetch (${retryCount}/${maxRetries})...`
        );
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount - 1) * 1000;
        setTimeout(attemptFetch, delay);
      } else {
        renderErrorState("Failed to load");
      }
    }
  };

  await attemptFetch();
}

/**
 * Setup dropdown toggle and click-outside listeners
 */
function setupDropdownListeners(): void {
  const trigger = document.getElementById("bf-workspace-trigger");

  trigger?.addEventListener("click", toggleDropdown);

  // Close dropdown when clicking outside
  document.addEventListener("click", handleClickOutside);
}

/**
 * Toggle dropdown visibility
 */
function toggleDropdown(event: Event): void {
  event.stopPropagation();
  const dropdown = document.getElementById("bf-workspace-dropdown");

  if (!dropdown) return;

  isDropdownOpen = !isDropdownOpen;

  if (isDropdownOpen) {
    dropdown.classList.remove("hidden");
  } else {
    dropdown.classList.add("hidden");
  }
}

/**
 * Close dropdown when clicking outside
 */
function handleClickOutside(event: Event): void {
  const switcher = document.getElementById("bf-header-workspace");
  const dropdown = document.getElementById("bf-workspace-dropdown");

  if (!switcher?.contains(event.target as Node) && isDropdownOpen) {
    isDropdownOpen = false;
    dropdown?.classList.add("hidden");
  }
}

/**
 * Select a workspace
 */
async function selectWorkspace(
  workspaceId: string,
  saveSelection = true
): Promise<void> {
  const workspace = workspaces.find((w) => w.id === workspaceId);
  if (!workspace) return;

  selectedWorkspaceId = workspaceId;

  // Update trigger display
  const nameEl = document.getElementById("bf-workspace-name");
  if (nameEl) {
    nameEl.textContent = workspace.name;
  }

  // Update selected state in list
  updateSelectedState(workspaceId);

  // Close dropdown
  const dropdown = document.getElementById("bf-workspace-dropdown");
  dropdown?.classList.add("hidden");
  isDropdownOpen = false;

  // Save selection
  if (saveSelection) {
    await saveWorkspaceSelection(workspaceId);
  }

  // Initialize project selector
  await initProjectSelector(workspaceId);
}

/**
 * Update the selected state in the workspace list
 */
function updateSelectedState(selectedId: string): void {
  const items = document.querySelectorAll(".bf-workspace-item");
  items.forEach((item) => {
    const itemId = (item as HTMLElement).dataset.workspaceId;
    const checkIcon = item.querySelector(".bf-workspace-check");

    if (itemId === selectedId) {
      item.classList.add("selected");
      checkIcon?.classList.remove("hidden");
    } else {
      item.classList.remove("selected");
      checkIcon?.classList.add("hidden");
    }
  });
}

/**
 * Render the workspace list in the dropdown
 */
function renderWorkspaceList(workspaces: Workspace[]): void {
  const list = document.getElementById("bf-workspace-list");
  if (!list) return;

  list.innerHTML = workspaces
    .map(
      (workspace) => `
      <button class="bf-workspace-item" data-workspace-id="${workspace.id}">
        <span class="bf-workspace-item-name">${workspace.name}</span>
        <span class="bf-workspace-check hidden">${icons.check}</span>
      </button>
    `
    )
    .join("");

  // Add click listeners to items
  list.querySelectorAll(".bf-workspace-item").forEach((item) => {
    item.addEventListener("click", async (e) => {
      e.stopPropagation();
      const workspaceId = (item as HTMLElement).dataset.workspaceId;
      if (workspaceId) {
        await selectWorkspace(workspaceId);
      }
    });
  });
}

/**
 * Render the no workspaces state
 */
function renderNoWorkspacesState(): void {
  const nameEl = document.getElementById("bf-workspace-name");
  const trigger = document.getElementById(
    "bf-workspace-trigger"
  ) as HTMLButtonElement;

  if (nameEl) {
    nameEl.textContent = "No workspaces";
  }
  if (trigger) {
    trigger.disabled = true;
  }

  // Show link to create workspace
  const container = document.getElementById("bf-header-workspace");
  if (container) {
    const link = document.createElement("a");
    link.href = `${config.WEB_URL}/dashboard`;
    link.target = "_blank";
    link.className = "text-xs text-bf-accent hover:underline ml-2";
    link.textContent = "Create one";
    container.appendChild(link);
  }
}

/**
 * Render error state
 */
function renderErrorState(message: string): void {
  const nameEl = document.getElementById("bf-workspace-name");
  const trigger = document.getElementById(
    "bf-workspace-trigger"
  ) as HTMLButtonElement;

  if (nameEl) {
    nameEl.textContent = message;
  }

  // Add retry on click
  trigger?.addEventListener(
    "click",
    () => {
      initWorkspaceSelector();
    },
    { once: true }
  );
}

/**
 * Render authentication required state
 */
function renderAuthRequiredState(): void {
  const nameEl = document.getElementById("bf-workspace-name");
  const trigger = document.getElementById(
    "bf-workspace-trigger"
  ) as HTMLButtonElement;

  if (nameEl) {
    nameEl.textContent = "Sign in required";
  }

  if (trigger) {
    trigger.disabled = false;
    trigger.addEventListener(
      "click",
      () => {
        // Trigger re-authentication
        window.location.reload();
      },
      { once: true }
    );
  }
}
/**
 * Get the selected workspace ID
 */
export function getSelectedWorkspaceId(): string | null {
  return selectedWorkspaceId;
}

/**
 * Cleanup workspace selector listeners
 */
export function cleanupWorkspaceSelector(): void {
  document.removeEventListener("click", handleClickOutside);
}
