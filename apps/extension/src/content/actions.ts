import { getState } from "./state";
import { showToast } from "../utils/toast";
import { getFormData, validateForm } from "./form";
import { createAnnotation } from "../api/annotations";
import type { Task } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const fabric: any;

export function undo(): void {
  const state = getState();
  const objects = state.fabricCanvas?.getObjects();
  if (objects && objects.length > 0) {
    state.fabricCanvas?.remove(objects[objects.length - 1]);
  }
}

export function deleteSelected(): void {
  const state = getState();
  const active = state.fabricCanvas?.getActiveObject();
  if (active) {
    state.fabricCanvas?.remove(active);
    state.fabricCanvas?.discardActiveObject();
    updateDeleteButtonState();
  }
}

export function updateDeleteButtonState(): void {
  const state = getState();
  const deleteBtn = document.getElementById(
    "bf-delete-btn",
  ) as HTMLButtonElement | null;
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

export function clearAnnotations(): void {
  const state = getState();
  state.fabricCanvas?.clear();
  // Re-apply background
  if (state.screenshotDataUrl && state.fabricCanvas) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabric.Image.fromURL(state.screenshotDataUrl, (fabricImg: any) => {
      fabricImg.set({
        originX: "left",
        originY: "top",
        scaleX: state.canvasScale,
        scaleY: state.canvasScale,
      });
      state.fabricCanvas!.setBackgroundImage(
        fabricImg,
        state.fabricCanvas!.renderAll.bind(state.fabricCanvas),
      );
    });
  }
}

export async function saveTask(): Promise<void> {
  const state = getState();
  // Import cleanupOverlay dynamically to avoid circular dependency
  const { cleanupOverlay } = await import("./overlay");

  // Validate form before submission
  const validation = validateForm();
  if (!validation.valid) {
    showToast(validation.errors[0], "error");
    return;
  }

  // Get form values
  const formData = getFormData();

  // Disable save button to prevent double submission
  const saveBtn = document.getElementById("bf-save-btn") as HTMLButtonElement;
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
  }

  // De-select everything so selection handles don't show up in screenshot
  state.fabricCanvas?.discardActiveObject();
  state.fabricCanvas?.renderAll();

  // Scale UP to original size for the export
  const multiplier = 1 / state.canvasScale;

  const annotatedImageDataUrl = state.fabricCanvas?.toDataURL({
    format: "png",
    multiplier: multiplier,
  });

  try {
    // Create annotation via API with base64 screenshot
    await createAnnotation({
      projectId: formData.projectId!,
      title: formData.title || "Untitled Annotation",
      description: formData.description || undefined,
      type: formData.type || undefined,
      priority: formData.priority || undefined,
      pageUrl: state.pageUrl,
      pageTitle: state.pageTitle,
      screenshotAnnotatedBase64: annotatedImageDataUrl,
    });

    showToast("Annotation saved successfully!");
    setTimeout(cleanupOverlay, 1500);
  } catch (error) {
    console.error("Notto: Save failed", error);
    showToast("Failed to save annotation", "error");

    // Re-enable save button for retry
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save";
    }
  }
}

/**
 * Legacy save function that downloads files locally (fallback)
 */
export async function saveTaskLocally(): Promise<void> {
  const state = getState();
  const { cleanupOverlay } = await import("./overlay");

  state.fabricCanvas?.discardActiveObject();
  state.fabricCanvas?.renderAll();

  const multiplier = 1 / state.canvasScale;
  const annotatedImageDataUrl = state.fabricCanvas?.toDataURL({
    format: "png",
    multiplier: multiplier,
  });

  const taskId =
    Date.now().toString(36) + Math.random().toString(36).substring(2);

  const formData = getFormData();

  const task: Task = {
    id: taskId,
    createdAt: new Date().toISOString(),
    pageUrl: state.pageUrl,
    pageTitle: state.pageTitle,
    title: formData.title || "Untitled Annotation",
    type: formData.type,
    priority: formData.priority,
    description: formData.description,
    screenshotOriginal: state.screenshotDataUrl,
    screenshotAnnotated: annotatedImageDataUrl || "",
    canvasData: state.fabricCanvas?.toJSON() || {},
  };

  const jsonBlob = new Blob([JSON.stringify(task, null, 2)], {
    type: "application/json",
  });
  const jsonUrl = URL.createObjectURL(jsonBlob);

  try {
    await chrome.runtime.sendMessage({
      action: "download",
      url: jsonUrl,
      filename: `notto-task-${taskId}.json`,
      saveAs: true,
    });

    if (annotatedImageDataUrl) {
      await chrome.runtime.sendMessage({
        action: "download",
        url: annotatedImageDataUrl,
        filename: `notto-screenshot-${taskId}.png`,
        saveAs: false,
      });
    }

    showToast("Task saved successfully!");
    setTimeout(cleanupOverlay, 1500);
  } catch (error) {
    console.error("Notto: Save failed", error);
    showToast("Failed to save task", "error");
  }
}
