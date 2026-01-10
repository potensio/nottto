import { getState, resetState } from "./state";
import { icons } from "../utils/icons";
import { setupEventListeners } from "./form";
import { removeKeyboardHandler } from "./keyboard";

export function createOverlay(): void {
  const state = getState();

  state.overlay = document.createElement("div");
  state.overlay.id = "nottto-overlay";
  state.overlay.className =
    "fixed top-0 left-0 w-screen h-screen z-overlay bg-bf-bg flex flex-row font-sans text-bf-primary";
  state.overlay.innerHTML = `
    <!-- Left Panel (Canvas Area) -->
    <div class="flex-1 flex flex-col relative overflow-hidden">
      <!-- Gradient Header -->
      <div class="absolute inset-0 pointer-events-none z-10 bg-overlay-gradient"></div>
      
      <!-- Canvas Container -->
      <div class="flex-1 flex items-center justify-center px-8 relative z-20">
        <!-- Canvas Area: relative container for absolute toolbar positioning -->
        <div class="relative flex flex-col items-center justify-center w-full h-full">
          <!-- Canvas Wrapper -->
          <div class="relative bg-white rounded-xl shadow-lg max-w-full overflow-visible">
            <canvas id="bf-fabric-canvas" class="bg-transparent max-w-full"></canvas>
          </div>
          
          <!-- Floating Toolbar (absolute positioned at bottom of container) -->
          <div class="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-1 px-4 py-2 bg-white rounded-full shadow-lg z-100">
            <div class="flex items-center gap-1">
              <button class="bf-tool-btn" data-tool="select" title="Select (S)">${icons.select}</button>
              <button class="bf-tool-btn active" data-tool="arrow" title="Arrow (A)">${icons.arrow}</button>
              <button class="bf-tool-btn" data-tool="rect" title="Rectangle (R)">${icons.rect}</button>
              <button class="bf-tool-btn" data-tool="ellipse" title="Ellipse (E)">${icons.ellipse}</button>
            </div>
            <div class="w-px h-6 bg-bf-border mx-2"></div>
            <div class="flex items-center gap-1">
              <button class="bf-tool-btn" data-tool="text" title="Text (T)">${icons.text}</button>
              <select id="bf-font-size" class="bf-text-control" title="Font Size">
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16" selected>16px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
                <option value="32">32px</option>
              </select>
              <select id="bf-stroke-width" class="bf-text-control" title="Stroke Weight">
                <option value="2">Thin</option>
                <option value="4" selected>Medium</option>
                <option value="6">Thick</option>
              </select>
            </div>
            <div class="w-px h-6 bg-bf-border mx-2"></div>
            <div class="w-px h-6 bg-bf-border mx-2"></div>
            <div class="flex items-center gap-1">
              <input type="color" id="bf-color-picker" value="#ff3366" class="bf-color-picker" title="Color">
            </div>
            <div class="w-px h-6 bg-bf-border mx-2"></div>
            <div class="flex items-center gap-1">
              <button class="bf-tool-btn" id="bf-undo-btn" title="Undo (Ctrl+Z)">${icons.undo}</button>
              <button class="bf-tool-btn danger" id="bf-delete-btn" title="Delete Selected" disabled>${icons.clear}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Right Panel (Form) -->
    <div class="w-90 min-w-90 bg-white border-l border-bf-border flex flex-col h-full">
      <div class="flex-1 p-6 overflow-y-auto">
        <!-- Title -->
        <textarea id="bf-title-input" placeholder="Write an annotation title" rows="1" class="w-full p-0 border-none bg-transparent text-xl font-normal text-bf-primary outline-none mb-6 placeholder-gray-400 resize-none overflow-hidden"></textarea>
        
        <!-- Form Fields -->
        <div class="flex items-start gap-3 py-3 border-b border-gray-100">
          <div class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5">${icons.user}</div>
          <div class="w-22 text-sm text-bf-secondary flex-shrink-0">Reported by</div>
          <div class="flex-1 text-sm text-bf-primary" id="bf-reporter">You</div>
        </div>
        
        <div class="flex items-start gap-3 py-3 border-b border-gray-100">
          <div class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5">${icons.tag}</div>
          <div class="w-22 text-sm text-bf-secondary flex-shrink-0">Type</div>
          <div class="flex-1 text-sm text-bf-primary">
            <select id="bf-type-select" class="bf-select">
              <option value="">-</option>
              <option value="bug">Bug</option>
              <option value="improvement">Improvement</option>
              <option value="question">Question</option>
            </select>
          </div>
        </div>
        
        <div class="flex items-start gap-3 py-3 border-b border-gray-100">
          <div class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5">${icons.clock}</div>
          <div class="w-22 text-sm text-bf-secondary flex-shrink-0">Priority</div>
          <div class="flex-1 text-sm text-bf-primary">
            <select id="bf-priority-select" class="bf-select">
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="medium" selected>🔵 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
        </div>
        
        <!-- Description -->
        <div class="mt-6">
          <div class="text-sm font-medium text-bf-primary mb-2">Description</div>
          <textarea id="bf-description-input" placeholder="What is this annotation about?" class="w-full min-h-25 p-3 border-none rounded-lg bg-bf-bg text-sm font-sans text-bf-primary outline-none resize-y transition-all duration-150 ease-in-out placeholder-gray-400 focus:bg-white"></textarea>
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
}

export function cleanupOverlay(): void {
  const state = getState();

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
