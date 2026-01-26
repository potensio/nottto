import type { NottoState, Tool } from "../types";

export function createInitialState(): NottoState {
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

export function getState(): NottoState {
  if (!window.nottoState) {
    window.nottoState = createInitialState();
  }
  return window.nottoState;
}

export function resetState(): void {
  const state = getState();
  const initial = createInitialState();
  Object.assign(state, initial);
}
