// Project selector functionality for the annotation form
import { listProjects, createProject, type Project } from "../api/projects";
import {
  loadSelection,
  saveProjectSelection,
} from "../utils/selection-storage";
import { showToast } from "../utils/toast";

let projects: Project[] = [];
let selectedProjectId: string | null = null;
let currentWorkspaceId: string | null = null;

/**
 * Initialize the project selector for a given workspace
 */
export async function initProjectSelector(workspaceId: string): Promise<void> {
  const select = document.getElementById(
    "bf-project-select"
  ) as HTMLSelectElement;
  const createBtn = document.getElementById(
    "bf-create-project-btn"
  ) as HTMLButtonElement;

  if (!select) return;

  currentWorkspaceId = workspaceId;

  try {
    // Show loading state
    select.innerHTML = '<option value="">Loading projects...</option>';
    select.disabled = true;
    if (createBtn) createBtn.disabled = true;

    // Fetch projects from API
    projects = await listProjects(workspaceId);

    // Populate dropdown
    renderProjectDropdown(projects);

    // Try to restore previous selection if workspace matches
    const savedSelection = await loadSelection();
    if (
      savedSelection.projectId &&
      savedSelection.workspaceId === workspaceId
    ) {
      const exists = projects.some((p) => p.id === savedSelection.projectId);
      if (exists) {
        select.value = savedSelection.projectId;
        selectedProjectId = savedSelection.projectId;
      }
    }

    // Enable the select and create button
    select.disabled = false;
    if (createBtn) createBtn.disabled = false;

    // Add change listener
    select.removeEventListener("change", handleProjectChange);
    select.addEventListener("change", handleProjectChange);

    // Setup create project form handlers
    setupCreateProjectHandlers();
  } catch (error) {
    console.error("Nottto: Failed to load projects", error);
    renderErrorState("Failed to load projects");
  }
}

/**
 * Reset the project selector to initial state
 */
export function resetProjectSelector(): void {
  const select = document.getElementById(
    "bf-project-select"
  ) as HTMLSelectElement;
  const createBtn = document.getElementById(
    "bf-create-project-btn"
  ) as HTMLButtonElement;

  if (select) {
    select.innerHTML = '<option value="">Select workspace first</option>';
    select.disabled = true;
  }
  if (createBtn) {
    createBtn.disabled = true;
  }

  projects = [];
  selectedProjectId = null;
  currentWorkspaceId = null;
  hideCreateProjectForm();
}

/**
 * Handle project selection change
 */
async function handleProjectChange(event: Event): Promise<void> {
  const select = event.target as HTMLSelectElement;
  const projectId = select.value;

  if (!projectId) {
    selectedProjectId = null;
    await saveProjectSelection(null);
    return;
  }

  selectedProjectId = projectId;
  await saveProjectSelection(projectId);
}

/**
 * Render the project dropdown with available projects
 */
function renderProjectDropdown(projects: Project[]): void {
  const select = document.getElementById(
    "bf-project-select"
  ) as HTMLSelectElement;
  if (!select) return;

  if (projects.length === 0) {
    select.innerHTML =
      '<option value="">No projects - create one below</option>';
  } else {
    select.innerHTML = '<option value="">Select a project</option>';
    projects.forEach((project) => {
      const option = document.createElement("option");
      option.value = project.id;
      option.textContent = project.name;
      select.appendChild(option);
    });
  }
}

/**
 * Render error state with retry button
 */
function renderErrorState(message: string): void {
  const container = document.getElementById("bf-project-container");
  if (!container) return;

  const originalContent = container.innerHTML;
  container.innerHTML = `
    <div class="text-sm">
      <p class="text-red-500 mb-2">${message}</p>
      <button id="bf-retry-projects" class="text-blue-500 hover:text-blue-600 underline">
        Try again
      </button>
    </div>
  `;

  document
    .getElementById("bf-retry-projects")
    ?.addEventListener("click", () => {
      container.innerHTML = originalContent;
      if (currentWorkspaceId) {
        initProjectSelector(currentWorkspaceId);
      }
    });
}

/**
 * Setup event handlers for the create project form
 */
function setupCreateProjectHandlers(): void {
  const createBtn = document.getElementById("bf-create-project-btn");
  const cancelBtn = document.getElementById("bf-cancel-create-project");
  const confirmBtn = document.getElementById("bf-confirm-create-project");
  const nameInput = document.getElementById(
    "bf-new-project-name"
  ) as HTMLInputElement;

  createBtn?.removeEventListener("click", showCreateProjectForm);
  createBtn?.addEventListener("click", showCreateProjectForm);

  cancelBtn?.removeEventListener("click", hideCreateProjectForm);
  cancelBtn?.addEventListener("click", hideCreateProjectForm);

  confirmBtn?.removeEventListener("click", handleCreateProject);
  confirmBtn?.addEventListener("click", handleCreateProject);

  // Handle enter key in input
  nameInput?.removeEventListener("keydown", handleNameInputKeydown);
  nameInput?.addEventListener("keydown", handleNameInputKeydown);
}

function handleNameInputKeydown(event: KeyboardEvent): void {
  if (event.key === "Enter") {
    event.preventDefault();
    handleCreateProject();
  } else if (event.key === "Escape") {
    hideCreateProjectForm();
  }
}

/**
 * Show the create project form
 */
function showCreateProjectForm(): void {
  const form = document.getElementById("bf-create-project-form");
  const nameInput = document.getElementById(
    "bf-new-project-name"
  ) as HTMLInputElement;

  if (form) {
    form.classList.remove("hidden");
    nameInput?.focus();
  }
}

/**
 * Hide the create project form
 */
function hideCreateProjectForm(): void {
  const form = document.getElementById("bf-create-project-form");
  const nameInput = document.getElementById(
    "bf-new-project-name"
  ) as HTMLInputElement;

  if (form) {
    form.classList.add("hidden");
  }
  if (nameInput) {
    nameInput.value = "";
  }
}

/**
 * Handle creating a new project
 */
async function handleCreateProject(): Promise<void> {
  const nameInput = document.getElementById(
    "bf-new-project-name"
  ) as HTMLInputElement;
  const confirmBtn = document.getElementById(
    "bf-confirm-create-project"
  ) as HTMLButtonElement;

  if (!nameInput || !currentWorkspaceId) return;

  const name = nameInput.value.trim();

  // Validate project name
  if (!validateProjectName(name)) {
    showToast("Please enter a valid project name", "error");
    nameInput.focus();
    return;
  }

  try {
    // Disable button and show loading
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Creating...";
    }

    // Create project via API
    const newProject = await createProject({
      name,
      workspaceId: currentWorkspaceId,
    });

    // Add to local list and re-render
    projects.push(newProject);
    renderProjectDropdown(projects);

    // Auto-select the new project
    const select = document.getElementById(
      "bf-project-select"
    ) as HTMLSelectElement;
    if (select) {
      select.value = newProject.id;
      selectedProjectId = newProject.id;
      await saveProjectSelection(newProject.id);
    }

    // Hide form and show success
    hideCreateProjectForm();
    showToast("Project created successfully!");
  } catch (error) {
    console.error("Nottto: Failed to create project", error);
    showToast("Failed to create project", "error");
  } finally {
    // Re-enable button
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Create";
    }
  }
}

/**
 * Validate project name
 * - Must not be empty
 * - Must not be only whitespace
 * - Max 100 characters
 */
export function validateProjectName(name: string): boolean {
  if (!name || name.trim().length === 0) {
    return false;
  }
  if (name.length > 100) {
    return false;
  }
  return true;
}

/**
 * Get the selected project ID
 */
export function getSelectedProjectId(): string | null {
  return selectedProjectId;
}
