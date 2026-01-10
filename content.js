// BugFinder Content Script - Full Page Overlay Annotation
// version: Fabric.js implementation with proper state management

// Initialize window-level state for proper cleanup between sessions
window.bugfinderState = window.bugfinderState || {
  fabricCanvas: null,
  overlay: null,
  notesInput: null,
  keyboardHandler: null,
  currentTool: "arrow",
  isDrawing: false,
  startX: 0,
  startY: 0,
  activeObject: null,
  pageUrl: "",
  pageTitle: "",
  screenshotDataUrl: "",
  canvasScale: 1,
};

// Icons as SVG strings
const icons = {
  select:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>',
  arrow:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  rect: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>',
  ellipse:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/></svg>',
  text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
  clear:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  clock:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
};

// Comprehensive cleanup function that resets ALL state
function cleanupOverlay() {
  const state = window.bugfinderState;

  // Clean up Fabric canvas
  if (state.fabricCanvas) {
    try {
      state.fabricCanvas.off();
      state.fabricCanvas.dispose();
    } catch (e) {
      console.warn("BugFinder: Error disposing canvas", e);
    }
    state.fabricCanvas = null;
  }

  // Remove overlay DOM element
  if (state.overlay) {
    state.overlay.remove();
    state.overlay = null;
  }

  // Remove keyboard event listener
  if (state.keyboardHandler) {
    document.removeEventListener("keydown", state.keyboardHandler);
    state.keyboardHandler = null;
  }

  // Reset all state variables
  state.notesInput = null;
  state.currentTool = "arrow";
  state.isDrawing = false;
  state.startX = 0;
  state.startY = 0;
  state.activeObject = null;
  state.pageUrl = "";
  state.pageTitle = "";
  state.screenshotDataUrl = "";
  state.canvasScale = 1;

  // Restore page scroll
  document.body.style.overflow = "";
}

// Create overlay UI
function createOverlay() {
  const state = window.bugfinderState;

  state.overlay = document.createElement("div");
  state.overlay.id = "bugfinder-overlay";
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
                <option value="16">16px</option>
                <option value="20" selected>20px</option>
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
  state.notesInput = document.getElementById("bf-description-input");
  setupEventListeners();
}

// Setup keyboard handler with proper reference storage
function setupKeyboardHandler() {
  const state = window.bugfinderState;

  // Remove existing handler if any
  if (state.keyboardHandler) {
    document.removeEventListener("keydown", state.keyboardHandler);
  }

  // Create and store new handler
  state.keyboardHandler = function handleKeyboard(e) {
    // Skip if in input/textarea
    if (
      e.target.tagName === "TEXTAREA" ||
      (e.target.tagName === "INPUT" && e.target.type === "text")
    ) {
      return;
    }

    // Check if Fabric is currently editing text
    if (
      state.fabricCanvas &&
      state.fabricCanvas.getActiveObject() &&
      state.fabricCanvas.getActiveObject().isEditing
    ) {
      return;
    }

    if (e.key === "Escape") {
      cleanupOverlay();
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
        state.fabricCanvas.remove(active);
      }
    }
  };

  document.addEventListener("keydown", state.keyboardHandler);
}

function setupEventListeners() {
  const state = window.bugfinderState;

  // Tool selection
  state.overlay.querySelectorAll(".bf-tool-btn[data-tool]").forEach((btn) => {
    btn.addEventListener("click", () => selectTool(btn.dataset.tool));
  });

  // Action buttons
  document.getElementById("bf-undo-btn").addEventListener("click", undo);
  document
    .getElementById("bf-delete-btn")
    .addEventListener("click", deleteSelected);
  document
    .getElementById("bf-cancel-btn")
    .addEventListener("click", cleanupOverlay);
  document.getElementById("bf-save-btn").addEventListener("click", saveTask);

  // Property changes
  document
    .getElementById("bf-color-picker")
    .addEventListener("input", updateContextStyles);
  document
    .getElementById("bf-stroke-width")
    .addEventListener("change", updateContextStyles);
  document
    .getElementById("bf-font-size")
    .addEventListener("change", updateContextStyles);

  // Setup keyboard handler
  setupKeyboardHandler();
  document.body.style.overflow = "hidden";

  // Auto-resize title textarea
  const titleInput = document.getElementById("bf-title-input");
  titleInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });
}

function initFabric(dataUrl) {
  const state = window.bugfinderState;

  state.screenshotDataUrl = dataUrl;

  const img = new Image();
  img.onload = () => {
    // Calculate fit-to-screen dimensions
    // Account for: form panel (360px) + horizontal padding (px-16 = 64px * 2 = 128px)
    const viewportWidth = window.innerWidth - 360 - 128;
    const viewportHeight = window.innerHeight - 160; // Top/bottom padding + toolbar space

    const scaleX = viewportWidth / img.width;
    const scaleY = viewportHeight / img.height;
    // Fit entirely within view
    state.canvasScale = Math.min(scaleX, scaleY, 1); // Never scale UP, only down if needed

    const displayWidth = img.width * state.canvasScale;
    const displayHeight = img.height * state.canvasScale;

    // Create Fabric Canvas with display dimensions
    state.fabricCanvas = new fabric.Canvas("bf-fabric-canvas", {
      width: displayWidth,
      height: displayHeight,
      selection: false,
    });

    // Set background image scaled using fabric.Image.fromURL for reliable loading
    fabric.Image.fromURL(dataUrl, (fabricImg) => {
      fabricImg.set({
        originX: "left",
        originY: "top",
        scaleX: state.canvasScale,
        scaleY: state.canvasScale,
      });
      state.fabricCanvas.setBackgroundImage(
        fabricImg,
        state.fabricCanvas.renderAll.bind(state.fabricCanvas)
      );
    });

    // Hook up Fabric events for drawing
    state.fabricCanvas.on("mouse:down", onMouseDown);
    state.fabricCanvas.on("mouse:move", onMouseMove);
    state.fabricCanvas.on("mouse:up", onMouseUp);

    // Hook up selection events for delete button state
    state.fabricCanvas.on("selection:created", updateDeleteButtonState);
    state.fabricCanvas.on("selection:updated", updateDeleteButtonState);
    state.fabricCanvas.on("selection:cleared", updateDeleteButtonState);
    state.fabricCanvas.on("object:removed", updateDeleteButtonState);

    // Reset selection mode based on tool
    selectTool(state.currentTool);

    // Initialize delete button state
    updateDeleteButtonState();
  };
  img.src = dataUrl;
}

function selectTool(tool) {
  const state = window.bugfinderState;
  state.currentTool = tool;

  state.overlay?.querySelectorAll(".bf-tool-btn[data-tool]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tool === tool);
  });

  if (!state.fabricCanvas) return;

  if (tool === "select") {
    state.fabricCanvas.forEachObject((o) => {
      o.selectable = true;
      o.evented = true;
    });
    state.fabricCanvas.skipTargetFind = false;
    state.fabricCanvas.selection = true;
    state.fabricCanvas.defaultCursor = "default";
  } else {
    state.fabricCanvas.discardActiveObject();
    state.fabricCanvas.forEachObject((o) => {
      o.selectable = false;
      o.evented = false;
    });
    state.fabricCanvas.skipTargetFind = true;
    state.fabricCanvas.selection = false;

    if (tool === "text") {
      state.fabricCanvas.defaultCursor = "text";
    } else {
      state.fabricCanvas.defaultCursor = "crosshair";
    }
  }
  state.fabricCanvas.requestRenderAll();
}

// --- Drawing Logic ---

function onMouseDown(o) {
  const state = window.bugfinderState;

  // If in select mode, do nothing custom
  if (state.currentTool === "select") return;

  const pointer = state.fabricCanvas.getPointer(o.e);
  state.isDrawing = true;
  state.startX = pointer.x;
  state.startY = pointer.y;

  const color = document.getElementById("bf-color-picker").value;
  const strokeWidth = parseInt(
    document.getElementById("bf-stroke-width").value
  );

  if (state.currentTool === "text") {
    state.isDrawing = false;
    addText(state.startX, state.startY, color);
    return;
  }

  if (state.currentTool === "rect") {
    state.activeObject = new fabric.Rect({
      left: state.startX,
      top: state.startY,
      originX: "left",
      originY: "top",
      width: 0,
      height: 0,
      stroke: color,
      strokeWidth: strokeWidth,
      fill: "transparent",
      rx: 2,
      ry: 2,
      transparentCorners: false,
      cornerColor: "#ffffff",
      cornerStrokeColor: "#000000",
      borderColor: "#000000",
      cornerSize: 10,
      padding: 5,
      selectable: false,
      evented: false,
    });
    state.fabricCanvas.add(state.activeObject);
  } else if (state.currentTool === "ellipse") {
    state.activeObject = new fabric.Ellipse({
      left: state.startX,
      top: state.startY,
      originX: "center",
      originY: "center",
      rx: 0,
      ry: 0,
      stroke: color,
      strokeWidth: strokeWidth,
      fill: "transparent",
      transparentCorners: false,
      cornerColor: "#ffffff",
      cornerStrokeColor: "#000000",
      borderColor: "#000000",
      cornerSize: 10,
      padding: 5,
      selectable: false,
      evented: false,
    });
    state.fabricCanvas.add(state.activeObject);
  } else if (state.currentTool === "arrow") {
    const points = [state.startX, state.startY, state.startX, state.startY];
    state.activeObject = new fabric.Line(points, {
      strokeWidth: strokeWidth,
      stroke: color,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
    state.fabricCanvas.add(state.activeObject);
  }
}

function onMouseMove(o) {
  const state = window.bugfinderState;

  if (!state.isDrawing || !state.activeObject) return;
  const pointer = state.fabricCanvas.getPointer(o.e);

  if (state.currentTool === "rect") {
    if (state.startX > pointer.x) {
      state.activeObject.set({ left: Math.abs(pointer.x) });
    }
    if (state.startY > pointer.y) {
      state.activeObject.set({ top: Math.abs(pointer.y) });
    }
    state.activeObject.set({ width: Math.abs(state.startX - pointer.x) });
    state.activeObject.set({ height: Math.abs(state.startY - pointer.y) });
  } else if (state.currentTool === "ellipse") {
    const rx = Math.abs(pointer.x - state.startX);
    const ry = Math.abs(pointer.y - state.startY);
    state.activeObject.set({ rx: rx, ry: ry });
  } else if (state.currentTool === "arrow") {
    state.activeObject.set({ x2: pointer.x, y2: pointer.y });
  }

  state.fabricCanvas.renderAll();
}

function onMouseUp() {
  const state = window.bugfinderState;

  if (!state.isDrawing) return;
  state.isDrawing = false;

  if (state.currentTool === "arrow") {
    // Finalize arrow: add a triangle head
    const color = state.activeObject.stroke;
    const strokeWidth = state.activeObject.strokeWidth;
    const x1 = state.activeObject.x1;
    const y1 = state.activeObject.y1;
    const x2 = state.activeObject.x2;
    const y2 = state.activeObject.y2;

    // Calculate angle
    const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    const headSize = strokeWidth * 3;

    const head = new fabric.Triangle({
      fill: color,
      stroke: color,
      strokeWidth: strokeWidth,
      width: headSize,
      height: headSize,
      left: x2,
      top: y2,
      originX: "center",
      originY: "center",
      angle: angle + 90,
    });

    // Remove the temp line and group them
    state.fabricCanvas.remove(state.activeObject);

    const arrowGroup = new fabric.Group(
      [
        new fabric.Line([x1, y1, x2, y2], {
          stroke: color,
          strokeWidth: strokeWidth,
          originX: "center",
          originY: "center",
        }),
        head,
      ],
      {
        selectable: false,
        evented: false,
      }
    );

    state.fabricCanvas.add(arrowGroup);
    state.activeObject = null;
  } else if (state.currentTool === "rect" || state.currentTool === "ellipse") {
    state.activeObject.setCoords();
    state.activeObject = null;
  }
}

function addText(x, y, color) {
  const state = window.bugfinderState;
  const fontSize = parseInt(document.getElementById("bf-font-size").value);
  const strokeWeight = parseInt(
    document.getElementById("bf-stroke-width").value
  );

  // Map stroke weight to font weight: Thin(2)→400, Medium(4)→600, Thick(6)→700
  const fontWeightMap = { 2: 400, 4: 600, 6: 700 };
  const fontWeight = fontWeightMap[strokeWeight] || 600;

  const text = new fabric.IText("Type here...", {
    left: x,
    top: y,
    fontFamily: "Segoe UI, system-ui, sans-serif",
    fill: color,
    fontSize: fontSize,
    fontWeight: fontWeight,
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 5,
    cornerColor: "#ffffff",
    cornerStrokeColor: "#000000",
    transparentCorners: false,
    selectable: false,
    evented: false,
  });

  state.fabricCanvas.add(text);
  state.fabricCanvas.setActiveObject(text);
  text.enterEditing();
  text.selectAll();
  text.set({ selectable: true, evented: true });
}

function updateContextStyles() {
  const state = window.bugfinderState;
  const color = document.getElementById("bf-color-picker").value;
  const strokeWidth = parseInt(
    document.getElementById("bf-stroke-width").value
  );
  const fontSize = parseInt(document.getElementById("bf-font-size").value);

  // Map stroke weight to font weight: Thin(2)→400, Medium(4)→600, Thick(6)→700
  const fontWeightMap = { 2: 400, 4: 600, 6: 700 };
  const fontWeight = fontWeightMap[strokeWidth] || 600;

  const active = state.fabricCanvas?.getActiveObject();

  if (active) {
    if (active.type === "i-text") {
      active.set({ fill: color, fontSize: fontSize, fontWeight: fontWeight });
    } else if (active.type === "rect" || active.type === "ellipse") {
      active.set({ stroke: color, strokeWidth: strokeWidth });
    } else if (active.type === "group") {
      active.getObjects().forEach((obj) => {
        if (obj.type === "line")
          obj.set({ stroke: color, strokeWidth: strokeWidth });
        if (obj.type === "triangle")
          obj.set({ fill: color, stroke: color, strokeWidth: strokeWidth });
      });
    }
    state.fabricCanvas.renderAll();
  }
}

// Actions
function undo() {
  const state = window.bugfinderState;
  const objects = state.fabricCanvas?.getObjects();
  if (objects && objects.length > 0) {
    state.fabricCanvas.remove(objects[objects.length - 1]);
  }
}

function deleteSelected() {
  const state = window.bugfinderState;
  const active = state.fabricCanvas?.getActiveObject();
  if (active) {
    state.fabricCanvas.remove(active);
    state.fabricCanvas.discardActiveObject();
    updateDeleteButtonState();
  }
}

function updateDeleteButtonState() {
  const state = window.bugfinderState;
  const deleteBtn = document.getElementById("bf-delete-btn");
  if (!deleteBtn) return;

  const hasSelection = state.fabricCanvas?.getActiveObject() != null;

  if (hasSelection) {
    deleteBtn.classList.remove("disabled");
    deleteBtn.disabled = false;
  } else {
    deleteBtn.classList.add("disabled");
    deleteBtn.disabled = true;
  }
}

function clearAnnotations() {
  const state = window.bugfinderState;
  state.fabricCanvas?.clear();
  // Re-apply background
  if (state.screenshotDataUrl && state.fabricCanvas) {
    state.fabricCanvas.setBackgroundImage(
      state.screenshotDataUrl,
      state.fabricCanvas.renderAll.bind(state.fabricCanvas)
    );
  }
}

async function saveTask() {
  const state = window.bugfinderState;

  // De-select everything so selection handles don't show up in screenshot
  state.fabricCanvas.discardActiveObject();
  state.fabricCanvas.renderAll();

  // Scale UP to original size for the export
  const multiplier = 1 / state.canvasScale;

  const annotatedImageDataUrl = state.fabricCanvas.toDataURL({
    format: "png",
    multiplier: multiplier,
  });

  const taskId =
    Date.now().toString(36) + Math.random().toString(36).substring(2);

  // Get form values
  const title = document.getElementById("bf-title-input").value.trim();
  const type = document.getElementById("bf-type-select").value;
  const priority = document.getElementById("bf-priority-select").value;
  const description = state.notesInput.value.trim();

  // Create task object
  const task = {
    id: taskId,
    createdAt: new Date().toISOString(),
    pageUrl: state.pageUrl,
    pageTitle: state.pageTitle,
    title: title || "Untitled Annotation",
    type: type,
    priority: priority,
    description: description,
    screenshotOriginal: state.screenshotDataUrl,
    screenshotAnnotated: annotatedImageDataUrl,
    canvasData: state.fabricCanvas.toJSON(),
  };

  // Download JSON
  const jsonBlob = new Blob([JSON.stringify(task, null, 2)], {
    type: "application/json",
  });
  const jsonUrl = URL.createObjectURL(jsonBlob);

  try {
    await chrome.runtime.sendMessage({
      action: "download",
      url: jsonUrl,
      filename: `bugfinder-task-${taskId}.json`,
      saveAs: true,
    });

    // Download annotated image
    await chrome.runtime.sendMessage({
      action: "download",
      url: annotatedImageDataUrl,
      filename: `bugfinder-screenshot-${taskId}.png`,
      saveAs: false,
    });

    showToast("Task saved successfully!");
    setTimeout(cleanupOverlay, 1500);
  } catch (error) {
    console.error("BugFinder: Save failed", error);
    showToast("Failed to save task", "error");
  }
}

function showToast(message, type = "success") {
  const state = window.bugfinderState;
  const existing = document.querySelector(".bf-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className =
    "bf-toast fixed bottom-25 left-1/2 transform -translate-x-1/2 px-7 py-3.5 bg-bf-primary text-white rounded-lg text-sm font-medium shadow-lg z-1000 animate-slide-up";
  toast.textContent = message;
  if (type === "error") {
    toast.className = toast.className.replace("bg-bf-primary", "bg-red-500");
  } else if (type === "success") {
    toast.className = toast.className.replace("bg-bf-primary", "bg-green-500");
  }
  state.overlay?.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Register message listener only once
if (!window.bugfinderListenerRegistered) {
  window.bugfinderListenerRegistered = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "initOverlay") {
      // Clean up any existing overlay first
      cleanupOverlay();

      // Store page info
      const state = window.bugfinderState;
      state.pageUrl = message.pageUrl;
      state.pageTitle = message.pageTitle;

      // Create and initialize overlay
      createOverlay();
      initFabric(message.screenshot);

      sendResponse({ success: true });
    }
    return true;
  });
}
