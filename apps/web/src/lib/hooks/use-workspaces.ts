import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api-client";
import { mockWorkspaces } from "../mock-data";

// Set to true to use mock data instead of real API
const USE_MOCK_DATA = false;

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        // Simulate network delay
        await new Promise((r) => setTimeout(r, 500));
        return mockWorkspaces;
      }
      const data = await apiClient.getWorkspaces();
      return data.workspaces;
    },
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: ["workspace", id],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 300));
        return mockWorkspaces.find((w) => w.id === id) || null;
      }
      const data = await apiClient.getWorkspace(id);
      return data.workspace;
    },
    enabled: !!id,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const data = await apiClient.createWorkspace(name);
      return data.workspace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; slug?: string; icon?: string };
    }) => {
      const response = await apiClient.updateWorkspace(id, data);
      return response.workspace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}
