// Chrome storage helpers for future auth/project integration

export async function getAuthToken(): Promise<string | null> {
  const result = await chrome.storage.local.get("authToken");
  return (result.authToken as string) || null;
}

export async function setAuthToken(token: string): Promise<void> {
  await chrome.storage.local.set({ authToken: token });
}

export async function clearAuthToken(): Promise<void> {
  await chrome.storage.local.remove("authToken");
}

export interface StoredProject {
  id: string;
  name: string;
  workspaceId: string;
}

export async function getCurrentProject(): Promise<StoredProject | null> {
  const result = await chrome.storage.local.get("currentProject");
  return (result.currentProject as StoredProject) || null;
}

export async function setCurrentProject(project: StoredProject): Promise<void> {
  await chrome.storage.local.set({ currentProject: project });
}

export async function clearCurrentProject(): Promise<void> {
  await chrome.storage.local.remove("currentProject");
}
