// Fabric.js type declarations for the subset we use
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const fabric: any;

declare global {
  interface Window {
    bugfinderState: BugfinderState;
    bugfinderListenerRegistered?: boolean;
  }
}

export type Tool = "select" | "arrow" | "rect" | "ellipse" | "text";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricObject = any;

export interface BugfinderState {
  fabricCanvas: FabricCanvas | null;
  overlay: HTMLElement | null;
  notesInput: HTMLTextAreaElement | null;
  keyboardHandler: ((e: KeyboardEvent) => void) | null;
  currentTool: Tool;
  isDrawing: boolean;
  startX: number;
  startY: number;
  activeObject: FabricObject | null;
  pageUrl: string;
  pageTitle: string;
  screenshotDataUrl: string;
  canvasScale: number;
}

export interface Task {
  id: string;
  createdAt: string;
  pageUrl: string;
  pageTitle: string;
  title: string;
  type: string;
  priority: string;
  description: string;
  screenshotOriginal: string;
  screenshotAnnotated: string;
  canvasData: object;
}

export interface InitOverlayMessage {
  action: "initOverlay";
  screenshot: string;
  pageUrl: string;
  pageTitle: string;
}

export interface DownloadMessage {
  action: "download";
  url: string;
  filename: string;
  saveAs?: boolean;
}

export type ExtensionMessage = InitOverlayMessage | DownloadMessage;
