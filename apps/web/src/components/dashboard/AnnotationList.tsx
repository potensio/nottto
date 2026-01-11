"use client";

import Link from "next/link";
import { formatDate, truncateUrl } from "./AnnotationCard";

export interface AnnotationListProps {
  annotations: Array<{
    id: string;
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    type?: string;
    pageUrl?: string;
    pageTitle?: string;
    createdAt: string;
    project?: {
      name: string;
      slug: string;
    };
    user?: {
      name: string;
    };
  }>;
  workspaceSlug: string;
  isLoading?: boolean;
  showProject?: boolean;
}

function getPriorityStyles(priority: string): string {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-yellow-100 text-yellow-700";
    case "low":
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

export function AnnotationListSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-100">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="h-5 w-3/4 bg-neutral-200 rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-neutral-100 rounded"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 w-16 bg-neutral-100 rounded"></div>
              <div className="h-4 w-20 bg-neutral-100 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnnotationList({
  annotations,
  workspaceSlug,
  isLoading = false,
  showProject = true,
}: AnnotationListProps) {
  if (isLoading) {
    return <AnnotationListSkeleton />;
  }

  if (annotations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-100">
      {annotations.map((annotation) => (
        <Link
          key={annotation.id}
          href={`/dashboard/${workspaceSlug}/annotations/${annotation.id}`}
          className="flex items-center justify-between gap-4 p-4 hover:bg-neutral-50 transition-colors group"
        >
          {/* Left side - Title and metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-medium text-neutral-900 truncate group-hover:text-accent transition-colors">
                {annotation.title}
              </h3>
              {annotation.priority && (
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${getPriorityStyles(
                    annotation.priority
                  )}`}
                >
                  {annotation.priority}
                </span>
              )}
              {annotation.type && (
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-neutral-100 text-neutral-500 shrink-0">
                  {annotation.type}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-500">
              {showProject && annotation.project && (
                <>
                  <span>{annotation.project.name}</span>
                  <span className="text-neutral-300">•</span>
                </>
              )}
              {annotation.pageUrl && (
                <>
                  <span
                    className="truncate max-w-[200px]"
                    title={annotation.pageUrl}
                  >
                    {truncateUrl(annotation.pageUrl, 40)}
                  </span>
                  <span className="text-neutral-300">•</span>
                </>
              )}
              <span className="shrink-0">
                {formatDate(annotation.createdAt)}
              </span>
            </div>
          </div>

          {/* Right side - Arrow */}
          <iconify-icon
            icon="lucide:chevron-right"
            className="text-neutral-300 group-hover:text-neutral-500 transition-colors shrink-0"
          ></iconify-icon>
        </Link>
      ))}
    </div>
  );
}

export default AnnotationList;
