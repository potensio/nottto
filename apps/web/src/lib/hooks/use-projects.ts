import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api-client";
import { mockProjects } from "../mock-data";

// Set to true to use mock data instead of real API
const USE_MOCK_DATA = true;

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  annotationCount?: number;
}

export function useProjects(workspaceId: string) {
  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 400));
        return mockProjects[workspaceId as keyof typeof mockProjects] || [];
      }
      const data = await apiClient.getProjects(workspaceId);
      return data.projects;
    },
    enabled: !!workspaceId,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const data = await apiClient.getProject(id);
      return data.project;
    },
    enabled: !!id,
  });
}

export function useCreateProject(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description?: string;
    }) => {
      const data = await apiClient.createProject(
        workspaceId,
        name,
        description
      );
      return data.project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
    },
  });
}
