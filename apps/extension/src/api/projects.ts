// Project API for Nottto backend integration

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
  const response = await get<{ projects: Project[] }>(
    `/workspaces/${workspaceId}/projects`
  );
  return response.projects;
}

export async function getProject(id: string): Promise<Project> {
  const response = await get<{ project: Project }>(`/projects/${id}`);
  return response.project;
}

export async function createProject(data: CreateProjectData): Promise<Project> {
  const response = await post<{ project: Project }>(
    `/workspaces/${data.workspaceId}/projects`,
    data
  );
  return response.project;
}

export async function updateProject(
  id: string,
  data: UpdateProjectData
): Promise<Project> {
  const response = await put<{ project: Project }>(`/projects/${id}`, data);
  return response.project;
}

export async function deleteProject(id: string): Promise<void> {
  return del<void>(`/projects/${id}`);
}
