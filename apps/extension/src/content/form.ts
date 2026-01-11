import { getState } from "./state";
import { selectTool } from "./tools";
import {
  undo,
  deleteSelected,
  saveTask,
  updateDeleteButtonState,
} from "./actions";
import { cleanupOverlay } from "./overlay";
import { setupKeyboardHandler } from "./keyboard";
import { getSelectedWorkspaceId } from "./workspace-selector";
import { getSelectedProjectId } from "./project-selector";
import { setupCanvasActionListeners } from "./canvas-actions";

export interface FormData {
  title: string;
  type: string;
  priority: string;
  description: string;
  workspaceId: string | null;
  projectId: string | null;
}

export interface FormValidationResult {
  valid: boolean;
  errors: string[];
}

export function getFormData(): FormData {
  const state = getState();
  const titleInput = document.getElementById(
    "bf-title-input"
  ) as HTMLTextAreaElement;
  const typeInput = document.getElementById(
    "bf-type-select"
  ) as HTMLInputElement;
  const priorityInput = document.getElementById(
    "bf-priority-select"
  ) as HTMLInputElement;

  return {
    title: titleInput.value.trim(),
    type: typeInput.value,
    priority: priorityInput.value,
    description: state.notesInput?.value.trim() || "",
    workspaceId: getSelectedWorkspaceId(),
    projectId: getSelectedProjectId(),
  };
}

/**
 * Validate the form data before submission
 */
export function validateForm(): FormValidationResult {
  const formData = getFormData();
  const errors: string[] = [];

  if (!formData.title) {
    errors.push("Please enter a title");
  }

  if (!formData.projectId) {
    errors.push("Please select a project");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function setupEventListeners(): void {
  const state = getState();

  // Tool selection
  state.overlay?.querySelectorAll(".bf-tool-btn[data-tool]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tool = (btn as HTMLElement).dataset.tool;
      if (tool) {
        selectTool(tool as "select" | "arrow" | "rect" | "ellipse" | "text");
      }
    });
  });

  // Action buttons
  document.getElementById("bf-undo-btn")?.addEventListener("click", undo);
  document
    .getElementById("bf-delete-btn")
    ?.addEventListener("click", deleteSelected);
  document
    .getElementById("bf-cancel-btn")
    ?.addEventListener("click", cleanupOverlay);
  document.getElementById("bf-save-btn")?.addEventListener("click", saveTask);

  // Property changes
  document
    .getElementById("bf-color-picker")
    ?.addEventListener("input", updateContextStyles);
  document
    .getElementById("bf-stroke-width")
    ?.addEventListener("change", updateContextStyles);
  document
    .getElementById("bf-font-size")
    ?.addEventListener("change", updateContextStyles);
  document
    .getElementById("bf-font-weight")
    ?.addEventListener("change", updateContextStyles);

  // Setup keyboard handler
  setupKeyboardHandler();
  document.body.style.overflow = "hidden";

  // Setup canvas action buttons (copy/download)
  setupCanvasActionListeners();

  // Auto-resize title textarea
  const titleInput = document.getElementById("bf-title-input");
  titleInput?.addEventListener("input", function (this: HTMLTextAreaElement) {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });

  // Type selector buttons
  const typeSelector = document.getElementById("bf-type-selector");
  const typeInput = document.getElementById(
    "bf-type-select"
  ) as HTMLInputElement;
  typeSelector?.querySelectorAll(".bf-type-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = (btn as HTMLElement).dataset.type || "";
      const isActive = btn.classList.contains("active");

      // Remove active from all buttons
      typeSelector
        .querySelectorAll(".bf-type-btn")
        .forEach((b) => b.classList.remove("active"));

      // Toggle: if clicking active button, deselect; otherwise select new
      if (isActive) {
        typeInput.value = "";
      } else {
        btn.classList.add("active");
        typeInput.value = type;
      }
    });
  });

  // Priority selector dots
  const prioritySelector = document.getElementById("bf-priority-selector");
  const priorityInput = document.getElementById(
    "bf-priority-select"
  ) as HTMLInputElement;
  const priorityMap: Record<number, string> = {
    1: "low",
    2: "medium",
    3: "high",
    4: "urgent",
  };

  prioritySelector?.querySelectorAll(".bf-priority-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      const level = parseInt((dot as HTMLElement).dataset.level || "1");

      // Fill all dots up to and including clicked level
      prioritySelector.querySelectorAll(".bf-priority-dot").forEach((d) => {
        const dotLevel = parseInt((d as HTMLElement).dataset.level || "1");
        if (dotLevel <= level) {
          d.classList.add("filled");
        } else {
          d.classList.remove("filled");
        }
      });

      priorityInput.value = priorityMap[level] || "medium";
    });
  });
}

export function updateContextStyles(): void {
  const state = getState();
  const colorPicker = document.getElementById(
    "bf-color-picker"
  ) as HTMLInputElement;
  const strokeWidthSelect = document.getElementById(
    "bf-stroke-width"
  ) as HTMLSelectElement;
  const fontSizeSelect = document.getElementById(
    "bf-font-size"
  ) as HTMLSelectElement;
  const fontWeightSelect = document.getElementById(
    "bf-font-weight"
  ) as HTMLSelectElement;

  const color = colorPicker.value;
  const strokeWidth = parseInt(strokeWidthSelect.value);
  const fontSize = parseInt(fontSizeSelect.value);
  const fontWeight = parseInt(fontWeightSelect.value);

  const active = state.fabricCanvas?.getActiveObject();

  if (active) {
    if (active.type === "i-text") {
      active.set({
        fill: color,
        fontSize: fontSize,
        fontWeight: fontWeight,
      });
    } else if (active.type === "rect" || active.type === "ellipse") {
      active.set({ stroke: color, strokeWidth: strokeWidth });
    } else if (active.type === "group") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      active.getObjects().forEach((obj: any) => {
        if (obj.type === "line") {
          obj.set({ stroke: color, strokeWidth: strokeWidth });
        }
        if (obj.type === "triangle") {
          obj.set({ fill: color, stroke: color, strokeWidth: strokeWidth });
        }
      });
    }
    state.fabricCanvas?.renderAll();
  }
}
