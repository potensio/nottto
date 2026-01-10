import { getState } from "../content/state";

export function showToast(
  message: string,
  type: "success" | "error" = "success"
): void {
  const state = getState();
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
