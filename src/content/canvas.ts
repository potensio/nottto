import { getState } from "./state";
import { selectTool, onMouseDown, onMouseMove, onMouseUp } from "./tools";
import { updateDeleteButtonState } from "./actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const fabric: any;

export function initCanvas(dataUrl: string): void {
  const state = getState();
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabric.Image.fromURL(dataUrl, (fabricImg: any) => {
      fabricImg.set({
        originX: "left",
        originY: "top",
        scaleX: state.canvasScale,
        scaleY: state.canvasScale,
      });
      state.fabricCanvas!.setBackgroundImage(
        fabricImg,
        state.fabricCanvas!.renderAll.bind(state.fabricCanvas)
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

    // Auto-switch to Select mode when text editing is exited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state.fabricCanvas.on("text:editing:exited", function (e: any) {
      const target = e.target;
      if (target) {
        target.set({ selectable: true, evented: true });
        switchToSelectAndSelect(target);
      }
    });

    // Reset selection mode based on tool
    selectTool(state.currentTool);

    // Initialize delete button state
    updateDeleteButtonState();
  };
  img.src = dataUrl;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCanvas(): any | null {
  return getState().fabricCanvas;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function switchToSelectAndSelect(obj: any): void {
  const state = getState();
  selectTool("select");
  if (obj && state.fabricCanvas) {
    state.fabricCanvas.setActiveObject(obj);
    state.fabricCanvas.requestRenderAll();
    updateDeleteButtonState();
  }
}
