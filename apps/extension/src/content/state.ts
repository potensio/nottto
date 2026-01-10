import type { NotttoState, Tool } from "../types";

export function createInitialState(): NotttoState {
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

export function getState(): NotttoState {
  if (!window.notttoState) {
    window.notttoState = createInitialState();
  }
  return window.notttoState;
}

export function resetState(): void {
  const state = getState();
  const initial = createInitialState();
  Object.assign(state, initial);
}
