// Project API stubs for BugFinder backend integration
// Implement when backend is ready

import { get, post, put, del } from "./client";

export interface Project {
  id: string;
  name: string;
  slug: string;
  workspaceId: string;
  description?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  name: string;
  workspaceId: string;
  slug?: string;
  description?: string;
  url?: string;
}

export interface UpdateProjectData {
  name?: string;
  slug?: string;
  description?: string;
  url?: string;
}

export async function listProjects(workspaceId: string): Promise<Project[]> {
  return get<Project[]>(`/workspaces/${workspaceId}/projects`);
}

export async function getProject(id: string): Promise<Project> {
  return get<Project>(`/projects/${id}`);
}

export async function createProject(data: CreateProjectData): Promise<Project> {
  return post<Project>(`/workspaces/${data.workspaceId}/projects`, data);
}

export async function updateProject(
  id: string,
  data: UpdateProjectData
): Promise<Project> {
  return put<Project>(`/projects/${id}`, data);
}

export async function deleteProject(id: string): Promise<void> {
  return del<void>(`/projects/${id}`);
}
