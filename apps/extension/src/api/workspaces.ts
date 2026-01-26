// Workspace API for Notto backend integration

import { get, post, put, del } from "./client";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceData {
  name: string;
  slug?: string;
}

export interface UpdateWorkspaceData {
  name?: string;
  slug?: string;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  try {
    console.log("Notto API: Requesting workspaces...");
    const response = await get<{ workspaces: Workspace[] }>("/workspaces");
    console.log("Notto API: Workspaces response:", response);
    return response.workspaces;
  } catch (error) {
    console.error("Notto API: Failed to fetch workspaces:", error);
    throw error;
  }
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const response = await get<{ workspace: Workspace }>(`/workspaces/${id}`);
  return response.workspace;
}

export async function createWorkspace(
  data: CreateWorkspaceData,
): Promise<Workspace> {
  const response = await post<{ workspace: Workspace }>("/workspaces", data);
  return response.workspace;
}

export async function updateWorkspace(
  id: string,
  data: UpdateWorkspaceData,
): Promise<Workspace> {
  const response = await put<{ workspace: Workspace }>(
    `/workspaces/${id}`,
    data,
  );
  return response.workspace;
}

export async function deleteWorkspace(id: string): Promise<void> {
  return del<void>(`/workspaces/${id}`);
}
