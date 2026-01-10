// Workspace API stubs for BugFinder backend integration
// Implement when backend is ready

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
  return get<Workspace[]>("/workspaces");
}

export async function getWorkspace(id: string): Promise<Workspace> {
  return get<Workspace>(`/workspaces/${id}`);
}

export async function createWorkspace(
  data: CreateWorkspaceData
): Promise<Workspace> {
  return post<Workspace>("/workspaces", data);
}

export async function updateWorkspace(
  id: string,
  data: UpdateWorkspaceData
): Promise<Workspace> {
  return put<Workspace>(`/workspaces/${id}`, data);
}

export async function deleteWorkspace(id: string): Promise<void> {
  return del<void>(`/workspaces/${id}`);
}
