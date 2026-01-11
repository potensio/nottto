import { getState, resetState } from "./state";
import { icons } from "../utils/icons";
import { setupEventListeners } from "./form";
import { removeKeyboardHandler } from "./keyboard";
import {
  initWorkspaceSelector,
  cleanupWorkspaceSelector,
} from "./workspace-selector";
import { getUser } from "../utils/auth-storage";
import {
  createFormHeader,
  initFormHeader,
  cleanupFormHeader,
} from "./form-header";

export async function createOverlay(): Promise<void> {
  const state = getState();

  // Get current user for the header
  const user = await getUser();

  state.overlay = document.createElement("div");
  state.overlay.id = "nottto-overlay";
  state.overlay.className =
    "fixed top-0 left-0 w-screen h-screen z-overlay bg-bf-bg flex flex-row font-sans text-bf-primary";
  state.overlay.innerHTML = `
    <!-- Left Panel (Canvas Area) -->
    <div class="flex-1 flex flex-col relative overflow-hidden">
      <!-- Gradient Background with Tech Grid -->
      <div class="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div class="bf-gradient-blob blob-1"></div>
        <div class="bf-gradient-blob blob-2"></div>
        <div class="absolute inset-0 bf-tech-grid"></div>
      </div>
      
      <!-- Gradient Header -->
      <div class="absolute inset-0 pointer-events-none z-10 bg-overlay-gradient"></div>
      
      <!-- Canvas Container -->
      <div class="flex-1 flex items-center justify-center px-8 relative z-20">
        <!-- Canvas Area: relative container for absolute toolbar positioning -->
        <div class="relative flex flex-col items-center justify-center w-full h-full">
          <!-- Canvas Wrapper -->
          <div class="relative bg-white rounded-xl shadow-lg max-w-full overflow-visible">
            <!-- Canvas Action Buttons (Above Canvas) -->
            <div class="absolute -top-10 right-0 flex items-center gap-1 z-30">
              <button class="bf-canvas-action-btn" id="bf-copy-btn" title="Copy to clipboard">${
                icons.copy
              }</button>
              <button class="bf-canvas-action-btn" id="bf-download-btn" title="Download image">${
                icons.download
              }</button>
            </div>
            <canvas id="bf-fabric-canvas" class="bg-transparent max-w-full"></canvas>
          </div>
          
          <!-- Floating Toolbar (Dark Theme) -->
          <div class="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-1 px-4 py-2 bg-bf-toolbar rounded-full shadow-lg z-100 border border-bf-toolbar-border">
            <div class="flex items-center gap-1">
              <button class="bf-tool-btn" data-tool="select" title="Select (S)">${
                icons.select
              }</button>
              <button class="bf-tool-btn active" data-tool="arrow" title="Arrow (A)">${
                icons.arrow
              }</button>
              <button class="bf-tool-btn" data-tool="rect" title="Rectangle (R)">${
                icons.rect
              }</button>
              <button class="bf-tool-btn" data-tool="ellipse" title="Ellipse (E)">${
                icons.ellipse
              }</button>
              <select id="bf-stroke-width" class="bf-text-control" title="Stroke Weight">
                <option value="2" selected>Thin</option>
                <option value="4">Medium</option>
                <option value="6">Thick</option>
              </select>
            </div>
            <div class="bf-toolbar-divider"></div>
            <div class="flex items-center gap-1">
              <button class="bf-tool-btn" data-tool="text" title="Text (T)">${
                icons.text
              }</button>
              <select id="bf-font-size" class="bf-text-control" title="Font Size">
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16" selected>16px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
                <option value="32">32px</option>
              </select>
              <select id="bf-font-weight" class="bf-text-control" title="Font Weight">
                <option value="400" selected>Thin</option>
                <option value="600">Medium</option>
                <option value="700">Thick</option>
              </select>
            </div>
            <div class="bf-toolbar-divider"></div>
            <div class="flex items-center gap-1">
              <input type="color" id="bf-color-picker" value="#eb3b3b" class="bf-color-picker" title="Color">
            </div>
            <div class="bf-toolbar-divider"></div>
            <div class="flex items-center gap-1">
              <button class="bf-tool-btn" id="bf-undo-btn" title="Undo (Ctrl+Z)">${
                icons.undo
              }</button>
              <button class="bf-tool-btn danger" id="bf-delete-btn" title="Delete Selected" disabled>${
                icons.clear
              }</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Right Panel (Form) -->
    <div class="w-90 min-w-90 bg-white border-l border-bf-border flex flex-col h-full">
      <!-- Form Header with Workspace Selector and User Avatar -->
      ${createFormHeader(user)}
      
      <div class="flex-1 p-6 overflow-y-auto">
        <!-- Title -->
        <textarea id="bf-title-input" placeholder="What went wrong here..." rows="1" class="bf-title-input mb-3 tracking-tight"></textarea>
        
        <!-- Form Fields -->
        <!-- Project Selector -->
        <div class="flex items-center gap-3 py-3 border-b border-gray-100" id="bf-project-row">
          <div class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5">${
            icons.folderOpen
          }</div>
          <div class="w-22 text-sm text-bf-secondary flex-shrink-0 flex items-center gap-1">
            Project
            <button id="bf-create-project-btn" class="bf-create-btn-inline border-bf-accent/10" title="Create new project" disabled>
              ${icons.plus}
            </button>
          </div>
          <div class="flex-1 text-sm text-bf-primary" id="bf-project-container">
            <select id="bf-project-select" class="bf-select w-fit" disabled>
              <option value="">Select workspace first</option>
            </select>
            <!-- Inline Create Project Form (hidden by default) -->
            <div id="bf-create-project-form" class="bf-create-project-card hidden">
              <input type="text" id="bf-new-project-name" placeholder="Project name" class="bf-input-compact" />
              <div class="flex gap-2 mt-2">
                <button id="bf-cancel-create-project" class="bf-btn-sm secondary">Cancel</button>
                <button id="bf-confirm-create-project" class="bf-btn-sm primary">Create</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-3 py-3 border-b border-gray-100">
          <div class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5">${
            icons.tag
          }</div>
          <div class="w-22 text-sm text-bf-secondary flex-shrink-0">Type</div>
          <div class="flex-1">
            <div class="bf-type-selector" id="bf-type-selector">
              <input type="hidden" id="bf-type-select" value="" />
              <button type="button" class="bf-type-btn" data-type="bug" data-tooltip="Bug">${
                icons.bug
              }</button>
              <button type="button" class="bf-type-btn" data-type="improvement" data-tooltip="Idea">${
                icons.improvement
              }</button>
              <button type="button" class="bf-type-btn" data-type="question" data-tooltip="Question">${
                icons.question
              }</button>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-3 py-3 border-b border-gray-100">
          <div class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5">${
            icons.fire
          }</div>
          <div class="w-22 text-sm text-bf-secondary flex-shrink-0">Priority</div>
          <div class="flex-1">
            <div class="bf-priority-selector" id="bf-priority-selector">
              <input type="hidden" id="bf-priority-select" value="medium" />
              <button type="button" class="bf-priority-dot filled" data-level="1" title="Low"></button>
              <button type="button" class="bf-priority-dot filled" data-level="2" title="Medium"></button>
              <button type="button" class="bf-priority-dot" data-level="3" title="High"></button>
              <button type="button" class="bf-priority-dot" data-level="4" title="Urgent"></button>
            </div>
          </div>
        </div>
        
        <!-- Description -->
        <div class="mt-6">
          <div class="text-sm font-medium text-bf-primary mb-2">Description</div>
          <textarea id="bf-description-input" placeholder="Add details: what's wrong, steps to reproduce, or suggestions for improvement..." class="bf-description-input"></textarea>
        </div>
      </div>
      
      <!-- Footer Actions -->
      <div class="p-4 border-t border-bf-border flex gap-3">
        <button class="bf-action-btn secondary" id="bf-cancel-btn">Cancel</button>
        <button class="bf-action-btn primary" id="bf-save-btn">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(state.overlay);
  state.notesInput = document.getElementById(
    "bf-description-input"
  ) as HTMLTextAreaElement;
  setupEventListeners();

  // Initialize form header (user avatar interactions)
  await initFormHeader();

  // Initialize workspace selector
  await initWorkspaceSelector();
}

export function cleanupOverlay(): void {
  const state = getState();

  // Clean up form header
  cleanupFormHeader();

  // Clean up workspace selector
  cleanupWorkspaceSelector();

  // Clean up Fabric canvas
  if (state.fabricCanvas) {
    try {
      state.fabricCanvas.off();
      state.fabricCanvas.dispose();
    } catch (e) {
      console.warn("Nottto: Error disposing canvas", e);
    }
  }

  // Remove overlay DOM element
  if (state.overlay) {
    state.overlay.remove();
  }

  // Remove keyboard event listener
  removeKeyboardHandler();

  // Restore page scroll
  document.body.style.overflow = "";

  // Reset all state variables
  resetState();
}
