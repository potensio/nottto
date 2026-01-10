// BugFinder Content Script - Full Page Overlay Annotation
// version: Fabric.js implementation

(function() {
  // Prevent multiple injections
  if (window.bugfinderInjected) return;
  window.bugfinderInjected = true;

  // State
  let fabricCanvas = null;
  let currentTool = 'arrow';
  let isDrawing = false;
  let startX = 0;
  let startY = 0;
  let activeObject = null; // For drawing logic
  let pageUrl = '';
  let pageTitle = '';
  let screenshotDataUrl = '';
  
  // DOM References
  let overlay;
  let notesInput;

  // Icons as SVG strings
  const icons = {
    select: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    rect: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>',
    ellipse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/></svg>',
    text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
    clear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
  };

  // Create overlay UI
  function createOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'bugfinder-overlay';
    overlay.innerHTML = `
      <!-- Left Panel (Canvas Area) -->
      <div id="bugfinder-left-panel">
        <!-- Gradient Header -->
        <div id="bugfinder-header-gradient"></div>
        
        <!-- Canvas Container -->
        <div id="bugfinder-canvas-container">
          <div id="bugfinder-canvas-wrapper">
            <canvas id="bf-fabric-canvas"></canvas>
            
            <!-- Floating Toolbar (anchored to bottom of canvas) -->
            <div id="bugfinder-toolbar">
              <div class="bf-tool-group">
                <button class="bf-tool-btn" data-tool="select" title="Select (S)">${icons.select}</button>
                <button class="bf-tool-btn active" data-tool="arrow" title="Arrow (A)">${icons.arrow}</button>
                <button class="bf-tool-btn" data-tool="rect" title="Rectangle (R)">${icons.rect}</button>
                <button class="bf-tool-btn" data-tool="ellipse" title="Ellipse (E)">${icons.ellipse}</button>
              </div>
              <div class="bf-divider"></div>
              <div class="bf-tool-group">
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
              <div class="bf-divider"></div>
              <div class="bf-tool-group">
                <button class="bf-tool-btn" id="bf-undo-btn" title="Undo (Ctrl+Z)">${icons.undo}</button>
                <button class="bf-tool-btn danger" id="bf-clear-btn" title="Clear All">${icons.clear}</button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Hidden color picker -->
        <input type="color" id="bf-color-picker" value="#ff3366">
      </div>
      
      <!-- Right Panel (Form) -->
      <div id="bugfinder-right-panel">
        <div id="bugfinder-form-content">
          <!-- Title -->
          <input type="text" id="bf-title-input" placeholder="Write an annotation title">
          
          <!-- Form Fields -->
          <div class="bf-form-field">
            <div class="bf-field-icon">${icons.user}</div>
            <div class="bf-field-label">Reported by</div>
            <div class="bf-field-value" id="bf-reporter">You</div>
          </div>
          
          <div class="bf-form-field">
            <div class="bf-field-icon">${icons.tag}</div>
            <div class="bf-field-label">Type</div>
            <div class="bf-field-value">
              <select id="bf-type-select" class="bf-select">
                <option value="">-</option>
                <option value="bug">Bug</option>
                <option value="improvement">Improvement</option>
                <option value="question">Question</option>
              </select>
            </div>
          </div>
          
          <div class="bf-form-field">
            <div class="bf-field-icon">${icons.clock}</div>
            <div class="bf-field-label">Priority</div>
            <div class="bf-field-value">
              <select id="bf-priority-select" class="bf-select">
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium" selected>🔵 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>
          
          <!-- Description -->
          <div class="bf-description-section">
            <div class="bf-description-label">Description</div>
            <textarea id="bf-description-input" placeholder="What is this annotation about?"></textarea>
          </div>
        </div>
        
        <!-- Footer Actions -->
        <div id="bugfinder-form-footer">
          <button class="bf-action-btn secondary" id="bf-cancel-btn">Cancel</button>
          <button class="bf-action-btn primary" id="bf-save-btn">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    notesInput = document.getElementById('bf-description-input');
    setupEventListeners();
  }


  function setupEventListeners() {
    // Tool selection
    overlay.querySelectorAll('.bf-tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => selectTool(btn.dataset.tool));
    });

    // Action buttons
    document.getElementById('bf-undo-btn').addEventListener('click', undo);
    document.getElementById('bf-clear-btn').addEventListener('click', clearAnnotations);
    document.getElementById('bf-cancel-btn').addEventListener('click', closeOverlay);
    document.getElementById('bf-save-btn').addEventListener('click', saveTask);

    // Property changes
    document.getElementById('bf-color-picker').addEventListener('input', updateContextStyles);
    document.getElementById('bf-stroke-width').addEventListener('change', updateContextStyles);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    document.body.style.overflow = 'hidden';
  }

  // Scale factor to map screen coordinates to original image coordinates
  let canvasScale = 1;

  function initFabric(dataUrl) {
    screenshotDataUrl = dataUrl;
    
    const img = new Image();
    img.onload = () => {
      // Calculate fit-to-screen dimensions
      const viewportWidth = window.innerWidth - 80; // Padding
      const viewportHeight = window.innerHeight - 200; // Toolbar + Bottom panel spaces
      
      const scaleX = viewportWidth / img.width;
      const scaleY = viewportHeight / img.height;
      // Fit entirely within view
      canvasScale = Math.min(scaleX, scaleY, 1); // Never scale UP, only down if needed
      
      const displayWidth = img.width * canvasScale;
      const displayHeight = img.height * canvasScale;

      // Create Fabric Canvas with display dimensions
      fabricCanvas = new fabric.Canvas('bf-fabric-canvas', {
        width: displayWidth,
        height: displayHeight,
        selection: false
      });

      // Set background image scaled
      fabricCanvas.setBackgroundImage(dataUrl, fabricCanvas.renderAll.bind(fabricCanvas), {
        originX: 'left',
        originY: 'top',
        scaleX: canvasScale,
        scaleY: canvasScale
      });

      // Hook up Fabric events for drawing
      fabricCanvas.on('mouse:down', onMouseDown);
      fabricCanvas.on('mouse:move', onMouseMove);
      fabricCanvas.on('mouse:up', onMouseUp);

      // Reset selection mode based on tool
      selectTool(currentTool);
    };
    img.src = dataUrl;
  }

  function selectTool(tool) {
    currentTool = tool;
    overlay.querySelectorAll('.bf-tool-btn[data-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    if (!fabricCanvas) return;

    if (tool === 'select') {
      fabricCanvas.forEachObject(o => {
        o.selectable = true; 
        o.evented = true;
      });
      fabricCanvas.skipTargetFind = false;
      fabricCanvas.selection = true;
      fabricCanvas.defaultCursor = 'default';
    } else {
      fabricCanvas.discardActiveObject();
      fabricCanvas.forEachObject(o => {
        o.selectable = false;
        o.evented = false; // Disable events so clicks pass through to canvas mouse events
      });
      fabricCanvas.skipTargetFind = true; // Crucial to prevent selecting objects while trying to draw
      fabricCanvas.selection = false;
      
      if (tool === 'text') {
        fabricCanvas.defaultCursor = 'text';
      } else {
        fabricCanvas.defaultCursor = 'crosshair';
      }
    }
    fabricCanvas.requestRenderAll();
  }

  // --- Drawing Logic ---

  function onMouseDown(o) {
    // If in select mode, do nothing custom
    if (currentTool === 'select') return;

    const pointer = fabricCanvas.getPointer(o.e);
    isDrawing = true;
    startX = pointer.x;
    startY = pointer.y;

    const color = document.getElementById('bf-color-picker').value;
    const strokeWidth = parseInt(document.getElementById('bf-stroke-width').value);

    if (currentTool === 'text') {
      isDrawing = false; // Text is instant click, not drag
      addText(startX, startY, color, strokeWidth);
      return;
    }

    if (currentTool === 'rect') {
      activeObject = new fabric.Rect({
        left: startX,
        top: startY,
        originX: 'left',
        originY: 'top',
        width: 0,
        height: 0,
        stroke: color,
        strokeWidth: strokeWidth,
        fill: 'transparent',
        rx: 2, 
        ry: 2,
        transparentCorners: false,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#000000',
        borderColor: '#000000',
        cornerSize: 10,
        padding: 5,
        selectable: false,
        evented: false
      });
      fabricCanvas.add(activeObject);
    } else if (currentTool === 'ellipse') {
      activeObject = new fabric.Ellipse({
        left: startX,
        top: startY,
        originX: 'center',
        originY: 'center',
        rx: 0,
        ry: 0,
        stroke: color,
        strokeWidth: strokeWidth,
        fill: 'transparent',
        transparentCorners: false,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#000000',
        borderColor: '#000000',
        cornerSize: 10,
        padding: 5,
        selectable: false,
        evented: false
      });
      fabricCanvas.add(activeObject);
    } else if (currentTool === 'arrow') {
      // Arrow consists of a Line and a Triangle (head)
      const points = [startX, startY, startX, startY];
      activeObject = new fabric.Line(points, {
        strokeWidth: strokeWidth,
        stroke: color,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false
      });
      fabricCanvas.add(activeObject);
    }
  }

  function onMouseMove(o) {
    if (!isDrawing || !activeObject) return;
    const pointer = fabricCanvas.getPointer(o.e);

    if (currentTool === 'rect') {
      if (startX > pointer.x) {
        activeObject.set({ left: Math.abs(pointer.x) });
      }
      if (startY > pointer.y) {
        activeObject.set({ top: Math.abs(pointer.y) });
      }
      activeObject.set({ width: Math.abs(startX - pointer.x) });
      activeObject.set({ height: Math.abs(startY - pointer.y) });
    } else if (currentTool === 'ellipse') {
      const rx = Math.abs(pointer.x - startX);
      const ry = Math.abs(pointer.y - startY);
      activeObject.set({ rx: rx, ry: ry });
    } else if (currentTool === 'arrow') {
      activeObject.set({ x2: pointer.x, y2: pointer.y });
    }

    fabricCanvas.renderAll();
  }

  function onMouseUp(o) {
    if (!isDrawing) return;
    isDrawing = false;

    if (currentTool === 'arrow') {
      // Finalize arrow: add a triangle head
      const color = activeObject.stroke;
      const strokeWidth = activeObject.strokeWidth;
      const x1 = activeObject.x1;
      const y1 = activeObject.y1;
      const x2 = activeObject.x2;
      const y2 = activeObject.y2;

      // Calculate angle
      const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      const headSize = strokeWidth * 3;

      const head = new fabric.Triangle({
        fill: color,
        stroke: color,
        strokeWidth: strokeWidth,
        width: headSize,
        height: headSize, // Base to tip
        left: x2,
        top: y2,
        originX: 'center',
        originY: 'center',
        angle: angle + 90 // Triangle default points up, we need to rotate
      });

      // Remove the temp line and group them
      fabricCanvas.remove(activeObject);
      
      const arrowGroup = new fabric.Group([
        new fabric.Line([x1, y1, x2, y2], {
          stroke: color,
          strokeWidth: strokeWidth,
          originX: 'center',
          originY: 'center'
        }),
        head
      ], {
        selectable: false, 
        evented: false 
      });

      fabricCanvas.add(arrowGroup);
      activeObject = null;
    } else if (currentTool === 'rect' || currentTool === 'ellipse') {
      activeObject.setCoords();
      activeObject = null;
    }
    
    // Note: We do NOT enableSelection() here automatically anymore.
    // User must click "Select" tool to edit.
  }

  function addText(x, y, color, fontSizeBase) {
    const fontSize = 20 + (fontSizeBase * 2);
    const text = new fabric.IText('Type here...', {
      left: x,
      top: y,
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fill: color,
      fontSize: fontSize,
      fontWeight: 'bold',
      backgroundColor: 'rgba(0,0,0,0.75)', // Similar to old style
      padding: 5,
      // style
      cornerColor: '#ffffff',
      cornerStrokeColor: '#000000',
      transparentCorners: false,
      selectable: false, // Initially false until Select tool used
      evented: false
    });
    
    fabricCanvas.add(text);
    
    // Auto-switch to select mode for text so they can type immediately?
    // Fabric IText needs to be active to type.
    // Exception: For Text, let's make it active immediately even in Text tool.
    fabricCanvas.setActiveObject(text);
    text.enterEditing();
    text.selectAll();
    // But we need to make it selectable otherwise it's frozen
    text.set({ selectable: true, evented: true });
  }

  function enableSelection() {
    fabricCanvas.forEachObject(o => {
      o.selectable = true;
      o.evented = true;
    });
  }

  function updateContextStyles() {
    // If an object is selected, update its style
    const color = document.getElementById('bf-color-picker').value;
    const strokeWidth = parseInt(document.getElementById('bf-stroke-width').value);
    const active = fabricCanvas.getActiveObject();

    if (active) {
      if (active.type === 'i-text') {
        active.set({ fill: color });
      } else if (active.type === 'rect') {
        active.set({ stroke: color, strokeWidth: strokeWidth });
      } else if (active.type === 'group') {
        // Arrow group usually
        active.getObjects().forEach(obj => {
          if (obj.type === 'line') obj.set({ stroke: color, strokeWidth: strokeWidth });
          if (obj.type === 'triangle') obj.set({ fill: color, stroke: color, strokeWidth: strokeWidth });
        });
      }
      fabricCanvas.renderAll();
    }
  }

  // Actions
  function undo() {
    // Simple undo: remove last added object
    // Proper undo usage would require a history stack logic, 
    // but pop() is a decent start for specific drawing actions.
    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      fabricCanvas.remove(objects[objects.length - 1]);
    }
  }

  function clearAnnotations() {
    fabricCanvas.clear();
    // Re-apply background
    if (screenshotDataUrl) {
      fabricCanvas.setBackgroundImage(screenshotDataUrl, fabricCanvas.renderAll.bind(fabricCanvas));
    }
  }

  function closeOverlay() {
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyboard);
      window.bugfinderInjected = false;
      fabricCanvas.dispose(); // cleanup
      fabricCanvas = null;
    }
  }

  async function saveTask() {
    // De-select everything so selection handles don't show up in screenshot
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();

    // Scale UP to original size for the export
    const multiplier = 1 / canvasScale;

    const annotatedImageDataUrl = fabricCanvas.toDataURL({
      format: 'png',
      multiplier: multiplier
    });
    
    const taskId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    // Get form values
    const title = document.getElementById('bf-title-input').value.trim();
    const type = document.getElementById('bf-type-select').value;
    const priority = document.getElementById('bf-priority-select').value;
    const description = notesInput.value.trim();

    // Create task object
    const task = {
      id: taskId,
      createdAt: new Date().toISOString(),
      pageUrl: pageUrl,
      pageTitle: pageTitle,
      title: title || 'Untitled Annotation',
      type: type,
      priority: priority,
      description: description,
      screenshotOriginal: screenshotDataUrl,
      screenshotAnnotated: annotatedImageDataUrl,
      canvasData: fabricCanvas.toJSON() // Save editable fabric data!
    };

    // Download JSON
    const jsonBlob = new Blob([JSON.stringify(task, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);

    try {
      await chrome.runtime.sendMessage({
        action: 'download',
        url: jsonUrl,
        filename: `bugfinder-task-${taskId}.json`,
        saveAs: true
      });

      // Download annotated image
      await chrome.runtime.sendMessage({
        action: 'download',
        url: annotatedImageDataUrl,
        filename: `bugfinder-screenshot-${taskId}.png`,
        saveAs: false
      });

      showToast('Task saved successfully!');
      setTimeout(closeOverlay, 1500);
    } catch (error) {
      console.error('BugFinder: Save failed', error);
      showToast('Failed to save task', 'error');
    }
  }

  function showToast(message, type = 'success') {
    const existing = document.querySelector('.bf-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'bf-toast';
    toast.textContent = message;
    if (type === 'error') {
      toast.style.background = '#ff4757';
    }
    overlay.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Keyboard shortcuts
  function handleKeyboard(e) {
    if (e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && e.target.type === 'text')) return;

    // Check if Fabric is currently editing text
    if (fabricCanvas && fabricCanvas.getActiveObject() && fabricCanvas.getActiveObject().isEditing) return;

    if (e.key === 'Escape') {
      closeOverlay();
    } else if (e.key === 's' || e.key === 'S') {
      if ((e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveTask();
      } else {
        selectTool('select');
      }
    } else if (e.key === 'a' || e.key === 'A') {
      selectTool('arrow');
    } else if (e.key === 'r' || e.key === 'R') {
      selectTool('rect');
    } else if (e.key === 'e' || e.key === 'E') {
      selectTool('ellipse');
    } else if (e.key === 't' || e.key === 'T') {
      selectTool('text');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Delete selected object
      const active = fabricCanvas.getActiveObject();
      if (active) {
        fabricCanvas.remove(active);
      }
    }
  }

  // Listen for initialization message from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'initOverlay') {
      pageUrl = message.pageUrl;
      pageTitle = message.pageTitle;
      createOverlay();
      initFabric(message.screenshot);
      sendResponse({ success: true });
    }
    return true;
  });
})();
