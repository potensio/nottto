import { getState } from "./state";
import { icons } from "../utils/icons";

/**
 * Get the annotated canvas as a data URL
 */
function getCanvasDataUrl(): string | null {
  const state = getState();
  if (!state.fabricCanvas) return null;

  // Export the canvas with white background
  return state.fabricCanvas.toDataURL({
    format: "png",
    quality: 1,
    multiplier: 2, // 2x resolution for better quality
  });
}

/**
 * Copy the annotated canvas to clipboard
 */
export async function copyCanvasToClipboard(): Promise<boolean> {
  const dataUrl = getCanvasDataUrl();
  if (!dataUrl) return false;

  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Use Clipboard API to copy image
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);

    return true;
  } catch (error) {
    console.error("Nottto: Failed to copy canvas to clipboard", error);
    return false;
  }
}

/**
 * Download the annotated canvas as PNG
 */
export function downloadCanvas(): boolean {
  const state = getState();
  const dataUrl = getCanvasDataUrl();
  if (!dataUrl) return false;

  try {
    // Create download link
    const link = document.createElement("a");
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:-]/g, "");
    const pageTitle =
      state.pageTitle?.replace(/[^a-z0-9]/gi, "_").slice(0, 30) || "screenshot";

    link.download = `nottto_${pageTitle}_${timestamp}.png`;
    link.href = dataUrl;
    link.click();

    return true;
  } catch (error) {
    console.error("Nottto: Failed to download canvas", error);
    return false;
  }
}

/**
 * Show success feedback on button
 */
function showButtonSuccess(button: HTMLElement): void {
  const originalContent = button.innerHTML;
  button.classList.add("success");
  button.innerHTML = icons.check;

  setTimeout(() => {
    button.classList.remove("success");
    button.innerHTML = originalContent;
  }, 1500);
}

/**
 * Setup canvas action button event listeners
 */
export function setupCanvasActionListeners(): void {
  const copyBtn = document.getElementById("bf-copy-btn");
  const downloadBtn = document.getElementById("bf-download-btn");

  copyBtn?.addEventListener("click", async () => {
    const success = await copyCanvasToClipboard();
    if (success && copyBtn) {
      showButtonSuccess(copyBtn);
    }
  });

  downloadBtn?.addEventListener("click", () => {
    const success = downloadCanvas();
    if (success && downloadBtn) {
      showButtonSuccess(downloadBtn);
    }
  });
}
