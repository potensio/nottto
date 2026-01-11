"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  useWorkspaces,
  useProjects,
  useWorkspaceAnnotations,
} from "@/lib/hooks";
import {
  StatsBar,
  AnnotationList,
  AnnotationListSkeleton,
  EmptyState,
  CreateProjectModal,
} from "@/components/dashboard";

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState(false);

  // Get workspaces to find the current one by slug
  const { data: workspaces } = useWorkspaces();
  const currentWorkspace = workspaces?.find((w) => w.slug === workspaceSlug);
  const workspaceId = currentWorkspace?.id || "";

  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects(workspaceId);

  const projectIds = useMemo(
    () => projects?.map((p) => p.id) || [],
    [projects]
  );

  const {
    data: annotations,
    isLoading: annotationsLoading,
    error: annotationsError,
  } = useWorkspaceAnnotations(workspaceId, projectIds);

  const isLoading = projectsLoading || annotationsLoading || !workspaces;
  const error = projectsError || annotationsError;

  // Calculate stats
  const stats = useMemo(() => {
    if (!annotations) {
      return { totalAnnotations: 0, thisWeekCount: 0, highPriorityCount: 0 };
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      totalAnnotations: annotations.length,
      thisWeekCount: annotations.filter(
        (a) => new Date(a.createdAt) >= oneWeekAgo
      ).length,
      highPriorityCount: annotations.filter((a) => a.priority === "high")
        .length,
    };
  }, [annotations]);

  const handleProjectCreated = (project: {
    id: string;
    name: string;
    slug: string;
  }) => {
    // Project list will be automatically refreshed via React Query invalidation
    console.log("Project created:", project.name);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-lg border border-neutral-200 animate-pulse"
            >
              <div className="h-8 w-16 bg-neutral-200 rounded mb-2"></div>
              <div className="h-4 w-24 bg-neutral-100 rounded"></div>
            </div>
          ))}
        </div>
        <div className="h-6 w-40 bg-neutral-200 rounded mb-4"></div>
        <AnnotationListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-neutral-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <iconify-icon
              icon="lucide:alert-circle"
              className="text-3xl text-red-500"
            ></iconify-icon>
          </div>
          <h3 className="text-xl font-instrument-serif text-neutral-900 mb-2">
            Failed to load data
          </h3>
          <p className="text-neutral-500 mb-6">
            Something went wrong. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2"
          >
            <iconify-icon icon="lucide:refresh-cw"></iconify-icon>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Stats bar */}
      <StatsBar
        totalAnnotations={stats.totalAnnotations}
        thisWeekCount={stats.thisWeekCount}
        highPriorityCount={stats.highPriorityCount}
      />

      {/* Projects section header with create button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-instrument-serif text-neutral-900">
          Projects
        </h2>
        <button
          onClick={() => setIsCreateProjectModalOpen(true)}
          className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 min-h-[44px]"
        >
          <iconify-icon icon="lucide:plus"></iconify-icon>
          New Project
        </button>
      </div>

      {/* Projects list */}
      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {projects.map((project) => (
            <a
              key={project.id}
              href={`/dashboard/${workspaceSlug}/projects/${project.slug}`}
              className="bg-white p-4 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <iconify-icon
                    icon="lucide:folder"
                    className="text-neutral-500"
                  ></iconify-icon>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900">
                    {project.name}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {project.annotationCount || 0} annotations
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Empty state or annotations */}
      {!annotations || annotations.length === 0 ? (
        <EmptyState type="no-annotations" workspaceSlug={workspaceSlug} />
      ) : (
        <>
          {/* Recent annotations header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-instrument-serif text-neutral-900">
              Recent Annotations
            </h2>
            <span className="text-sm text-neutral-500">
              {annotations.length} total
            </span>
          </div>

          {/* Annotations list */}
          <AnnotationList
            annotations={annotations}
            workspaceSlug={workspaceSlug}
            showProject={true}
          />
        </>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        workspaceId={workspaceId}
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}
