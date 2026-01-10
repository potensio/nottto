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

export interface FormData {
  title: string;
  type: string;
  priority: string;
  description: string;
}

export function getFormData(): FormData {
  const state = getState();
  const titleInput = document.getElementById(
    "bf-title-input"
  ) as HTMLTextAreaElement;
  const typeSelect = document.getElementById(
    "bf-type-select"
  ) as HTMLSelectElement;
  const prioritySelect = document.getElementById(
    "bf-priority-select"
  ) as HTMLSelectElement;

  return {
    title: titleInput.value.trim(),
    type: typeSelect.value,
    priority: prioritySelect.value,
    description: state.notesInput?.value.trim() || "",
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

  // Setup keyboard handler
  setupKeyboardHandler();
  document.body.style.overflow = "hidden";

  // Auto-resize title textarea
  const titleInput = document.getElementById("bf-title-input");
  titleInput?.addEventListener("input", function (this: HTMLTextAreaElement) {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
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

  const color = colorPicker.value;
  const strokeWidth = parseInt(strokeWidthSelect.value);
  const fontSize = parseInt(fontSizeSelect.value);

  // Map stroke weight to font weight: Thin(2)→400, Medium(4)→600, Thick(6)→700
  const fontWeightMap: Record<number, number> = { 2: 400, 4: 600, 6: 700 };
  const fontWeight = fontWeightMap[strokeWidth] || 600;

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
