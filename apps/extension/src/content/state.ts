import type { BugfinderState, Tool } from "../types";

export function createInitialState(): BugfinderState {
  return {
    fabricCanvas: null,
    overlay: null,
    notesInput: null,
    keyboardHandler: null,
    currentTool: "arrow" as Tool,
    isDrawing: false,
    startX: 0,
    startY: 0,
    activeObject: null,
    pageUrl: "",
    pageTitle: "",
    screenshotDataUrl: "",
    canvasScale: 1,
  };
}

export function getState(): BugfinderState {
  if (!window.bugfinderState) {
    window.bugfinderState = createInitialState();
  }
  return window.bugfinderState;
}

export function resetState(): void {
  const state = getState();
  const initial = createInitialState();
  Object.assign(state, initial);
}
