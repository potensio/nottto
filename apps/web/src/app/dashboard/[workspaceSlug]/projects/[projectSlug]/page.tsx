"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useWorkspaces, useProjects, useAnnotations } from "@/lib/hooks";
import {
  AnnotationList,
  AnnotationListSkeleton,
  EmptyState,
} from "@/components/dashboard";

export default function ProjectDetailPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const projectSlug = params.projectSlug as string;

  // Get workspace by slug
  const { data: workspaces } = useWorkspaces();
  const currentWorkspace = workspaces?.find((w) => w.slug === workspaceSlug);
  const workspaceId = currentWorkspace?.id || "";

  // Get projects to find the current one
  const { data: projects } = useProjects(workspaceId);
  const currentProject = projects?.find((p) => p.slug === projectSlug);
  const projectId = currentProject?.id || "";

  const { data: annotations, isLoading, error } = useAnnotations(projectId);

  if (isLoading || !workspaces || !projects) {
    return (
      <div className="p-8">
        {/* Breadcrumb skeleton */}
        <div className="h-5 w-48 bg-neutral-200 rounded mb-6 animate-pulse"></div>

        {/* Header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 w-64 bg-neutral-200 rounded mb-2"></div>
          <div className="h-4 w-32 bg-neutral-100 rounded"></div>
        </div>

        {/* List skeleton */}
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
            Failed to load project
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

  const projectName =
    currentProject?.name ||
    projectSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link
          href={`/dashboard/${workspaceSlug}`}
          className="text-neutral-500 hover:text-neutral-700 transition-colors min-h-[44px] flex items-center"
        >
          Dashboard
        </Link>
        <iconify-icon
          icon="lucide:chevron-right"
          className="text-neutral-400"
        ></iconify-icon>
        <span className="text-neutral-900 font-medium">{projectName}</span>
      </nav>

      {/* Project header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-instrument-serif text-neutral-900 mb-2">
            {projectName}
          </h1>
          <p className="text-neutral-500">
            {annotations?.length || 0} annotation
            {annotations?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href={`/dashboard/${workspaceSlug}/projects/${projectSlug}/settings`}
          className="flex items-center font-medium gap-2 px-4 py-2 text-sm border border-neutral-300 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <iconify-icon icon="ph:plug" height={16}></iconify-icon>
          Integration
        </Link>
      </div>

      {/* Empty state or annotations */}
      {!annotations || annotations.length === 0 ? (
        <EmptyState type="no-annotations" workspaceSlug={workspaceSlug} />
      ) : (
        <AnnotationList
          annotations={annotations}
          workspaceSlug={workspaceSlug}
          showProject={false}
        />
      )}
    </div>
  );
}
