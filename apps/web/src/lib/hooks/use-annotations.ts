import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api-client";
import {
  mockAnnotations,
  getAnnotationById,
  getWorkspaceAnnotations,
} from "../mock-data";

// Set to true to use mock data instead of real API
const USE_MOCK_DATA = false;

export interface AnnotationSummary {
  id: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  type?: string;
  status?: "open" | "done";
  pageUrl?: string;
  pageTitle?: string;
  screenshotAnnotated?: string;
  createdAt: string;
  project: {
    name: string;
    slug: string;
  };
  user?: {
    name: string;
  };
}

export interface AnnotationDetail {
  id: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  type?: string;
  status?: "open" | "done";
  pageUrl?: string;
  pageTitle?: string;
  screenshotOriginal?: string;
  screenshotAnnotated?: string;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    slug: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export function useAnnotations(projectId: string) {
  return useQuery({
    queryKey: ["annotations", projectId],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 400));
        const annotations =
          mockAnnotations[projectId as keyof typeof mockAnnotations] || [];
        // Sort by createdAt descending (newest first)
        return [...annotations].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ) as AnnotationSummary[];
      }
      const data = await apiClient.getAnnotations(projectId);
      // Sort by createdAt descending (newest first)
      return data.annotations.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ) as AnnotationSummary[];
    },
    enabled: !!projectId,
  });
}

export function useAnnotation(id: string) {
  return useQuery({
    queryKey: ["annotation", id],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 300));
        return getAnnotationById(id) as AnnotationDetail | null;
      }
      const data = await apiClient.getAnnotation(id);
      return data.annotation as AnnotationDetail;
    },
    enabled: !!id,
  });
}

export function useDeleteAnnotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.deleteAnnotation(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annotations"] });
    },
  });
}

export function useUpdateAnnotationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "open" | "done";
    }) => {
      const data = await apiClient.updateAnnotationStatus(id, status);
      return data.annotation;
    },
    onSuccess: (annotation) => {
      // Invalidate both the single annotation and the list
      queryClient.invalidateQueries({
        queryKey: ["annotation", annotation.id],
      });
      queryClient.invalidateQueries({ queryKey: ["annotations"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-annotations"] });
    },
  });
}

// Hook to get all annotations for a workspace (across all projects)
export function useWorkspaceAnnotations(
  workspaceId: string,
  projectIds: string[],
) {
  return useQuery({
    queryKey: ["workspace-annotations", workspaceId, projectIds],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 500));
        return getWorkspaceAnnotations(workspaceId) as AnnotationSummary[];
      }
      // Fetch annotations from all projects in parallel
      const results = await Promise.all(
        projectIds.map((projectId) => apiClient.getAnnotations(projectId)),
      );

      // Flatten and sort by createdAt descending
      const allAnnotations = results.flatMap((r) => r.annotations);
      return allAnnotations.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ) as AnnotationSummary[];
    },
    enabled: !!workspaceId && (USE_MOCK_DATA || projectIds.length > 0),
  });
}
