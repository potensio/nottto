import { getState } from "./state";
import { switchToSelectAndSelect } from "./canvas";
import type { Tool } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const fabric: any;

export function selectTool(tool: Tool): void {
  const state = getState();
  state.currentTool = tool;

  state.overlay?.querySelectorAll(".bf-tool-btn[data-tool]").forEach((btn) => {
    btn.classList.toggle("active", (btn as HTMLElement).dataset.tool === tool);
  });

  if (!state.fabricCanvas) return;

  if (tool === "select") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state.fabricCanvas.forEachObject((o: any) => {
      o.selectable = true;
      o.evented = true;
    });
    state.fabricCanvas.skipTargetFind = false;
    state.fabricCanvas.selection = true;
    state.fabricCanvas.defaultCursor = "default";
  } else {
    state.fabricCanvas.discardActiveObject();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state.fabricCanvas.forEachObject((o: any) => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function onMouseDown(o: any): void {
  const state = getState();

  // If in select mode, do nothing custom
  if (state.currentTool === "select") return;

  const pointer = state.fabricCanvas!.getPointer(o.e as MouseEvent);
  state.isDrawing = true;
  state.startX = pointer.x;
  state.startY = pointer.y;

  const colorPicker = document.getElementById(
    "bf-color-picker"
  ) as HTMLInputElement;
  const strokeWidthSelect = document.getElementById(
    "bf-stroke-width"
  ) as HTMLSelectElement;
  const color = colorPicker.value;
  const strokeWidth = parseInt(strokeWidthSelect.value);

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
    state.fabricCanvas!.add(state.activeObject);
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
    state.fabricCanvas!.add(state.activeObject);
  } else if (state.currentTool === "arrow") {
    const points: [number, number, number, number] = [
      state.startX,
      state.startY,
      state.startX,
      state.startY,
    ];
    state.activeObject = new fabric.Line(points, {
      strokeWidth: strokeWidth,
      stroke: color,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
    state.fabricCanvas!.add(state.activeObject);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function onMouseMove(o: any): void {
  const state = getState();

  if (!state.isDrawing || !state.activeObject) return;
  const pointer = state.fabricCanvas!.getPointer(o.e as MouseEvent);

  if (state.currentTool === "rect") {
    const rect = state.activeObject;
    if (state.startX > pointer.x) {
      rect.set({ left: Math.abs(pointer.x) });
    }
    if (state.startY > pointer.y) {
      rect.set({ top: Math.abs(pointer.y) });
    }
    rect.set({ width: Math.abs(state.startX - pointer.x) });
    rect.set({ height: Math.abs(state.startY - pointer.y) });
  } else if (state.currentTool === "ellipse") {
    const ellipse = state.activeObject;
    const rx = Math.abs(pointer.x - state.startX);
    const ry = Math.abs(pointer.y - state.startY);
    ellipse.set({ rx: rx, ry: ry });
  } else if (state.currentTool === "arrow") {
    const line = state.activeObject;
    line.set({ x2: pointer.x, y2: pointer.y });
  }

  state.fabricCanvas!.renderAll();
}

export function onMouseUp(): void {
  const state = getState();

  if (!state.isDrawing) return;
  state.isDrawing = false;

  if (state.currentTool === "arrow") {
    const line = state.activeObject;
    // Finalize arrow: add a triangle head
    const color = line.stroke as string;
    const strokeWidth = line.strokeWidth!;
    const x1 = line.x1!;
    const y1 = line.y1!;
    const x2 = line.x2!;
    const y2 = line.y2!;

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
    state.fabricCanvas!.remove(state.activeObject!);

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
        selectable: true,
        evented: true,
      }
    );

    state.fabricCanvas!.add(arrowGroup);
    // Auto-switch to Select mode and select the arrow
    switchToSelectAndSelect(arrowGroup);
    state.activeObject = null;
  } else if (state.currentTool === "rect" || state.currentTool === "ellipse") {
    // Make the shape selectable after creation
    state.activeObject!.set({ selectable: true, evented: true });
    state.activeObject!.setCoords();
    // Auto-switch to Select mode and select the shape
    switchToSelectAndSelect(state.activeObject!);
    state.activeObject = null;
  }
}

export function addText(x: number, y: number, color: string): void {
  const state = getState();
  const fontSizeSelect = document.getElementById(
    "bf-font-size"
  ) as HTMLSelectElement;
  const fontWeightSelect = document.getElementById(
    "bf-font-weight"
  ) as HTMLSelectElement;
  const fontSize = parseInt(fontSizeSelect.value);
  const fontWeight = parseInt(fontWeightSelect.value);

  const text = new fabric.IText("Type here...", {
    left: x,
    top: y,
    fontFamily: "Gochi Hand, cursive",
    fill: color,
    fontSize: fontSize,
    fontWeight: fontWeight,
    padding: 5,
    cornerColor: "#ffffff",
    cornerStrokeColor: "#000000",
    transparentCorners: false,
    selectable: false,
    evented: false,
  });

  state.fabricCanvas!.add(text);
  state.fabricCanvas!.setActiveObject(text);
  text.enterEditing();
  text.selectAll();
  text.set({ selectable: true, evented: true });
}
