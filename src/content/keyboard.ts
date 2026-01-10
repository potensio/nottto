import { getState } from "./state";
import { selectTool } from "./tools";
import {
  undo,
  deleteSelected,
  updateDeleteButtonState,
  saveTask,
} from "./actions";

export function setupKeyboardHandler(): void {
  const state = getState();

  // Remove existing handler if any
  if (state.keyboardHandler) {
    document.removeEventListener("keydown", state.keyboardHandler);
  }

  // Create and store new handler
  state.keyboardHandler = handleKeyboard;
  document.addEventListener("keydown", state.keyboardHandler);
}

export function removeKeyboardHandler(): void {
  const state = getState();
  if (state.keyboardHandler) {
    document.removeEventListener("keydown", state.keyboardHandler);
    state.keyboardHandler = null;
  }
}

function handleKeyboard(e: KeyboardEvent): void {
  const state = getState();

  // Skip if in input/textarea
  const target = e.target as HTMLElement;
  if (
    target.tagName === "TEXTAREA" ||
    (target.tagName === "INPUT" && (target as HTMLInputElement).type === "text")
  ) {
    return;
  }

  // Check if Fabric is currently editing text
  const activeObject = state.fabricCanvas?.getActiveObject();
  if (activeObject && activeObject.isEditing) {
    return;
  }

  if (e.key === "Escape") {
    e.preventDefault();
    // Esc clears selection, never closes extension (user must use Cancel button)
    if (activeObject && activeObject.isEditing) {
      activeObject.exitEditing();
    }
    state.fabricCanvas?.discardActiveObject();
    state.fabricCanvas?.requestRenderAll();
    updateDeleteButtonState();
  } else if (e.key === "s" || e.key === "S") {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      saveTask();
    } else {
      selectTool("select");
    }
  } else if (e.key === "a" || e.key === "A") {
    selectTool("arrow");
  } else if (e.key === "r" || e.key === "R") {
    selectTool("rect");
  } else if (e.key === "e" || e.key === "E") {
    selectTool("ellipse");
  } else if (e.key === "t" || e.key === "T") {
    selectTool("text");
  } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    e.preventDefault();
    undo();
  } else if (e.key === "Delete" || e.key === "Backspace") {
    // Delete selected object
    const active = state.fabricCanvas?.getActiveObject();
    if (active) {
      state.fabricCanvas?.remove(active);
      updateDeleteButtonState();
    }
  }
}
