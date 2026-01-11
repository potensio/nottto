// Selection storage utility for persisting workspace and project selections
// Uses chrome.storage.local for persistence across sessions

export interface SelectionData {
  workspaceId: string | null;
  projectId: string | null;
  timestamp: number;
}

const STORAGE_KEY = "nottto_selection";

/**
 * Save workspace and project selection to chrome.storage.local
 */
export async function saveSelection(data: {
  workspaceId: string | null;
  projectId: string | null;
}): Promise<void> {
  const selectionData: SelectionData = {
    workspaceId: data.workspaceId,
    projectId: data.projectId,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEY]: selectionData }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Load workspace and project selection from chrome.storage.local
 */
export async function loadSelection(): Promise<SelectionData> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        const data = result[STORAGE_KEY] as SelectionData | undefined;
        resolve(
          data || {
            workspaceId: null,
            projectId: null,
            timestamp: 0,
          }
        );
      }
    });
  });
}

/**
 * Clear workspace and project selection from chrome.storage.local
 */
export async function clearSelection(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove([STORAGE_KEY], () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Save only workspace selection (clears project when workspace changes)
 */
export async function saveWorkspaceSelection(
  workspaceId: string | null
): Promise<void> {
  return saveSelection({
    workspaceId,
    projectId: null, // Clear project when workspace changes
  });
}

/**
 * Save only project selection (preserves workspace)
 */
export async function saveProjectSelection(
  projectId: string | null
): Promise<void> {
  const current = await loadSelection();
  return saveSelection({
    workspaceId: current.workspaceId,
    projectId,
  });
}
