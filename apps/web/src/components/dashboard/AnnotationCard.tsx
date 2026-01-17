"use client";

import Link from "next/link";
import { useUpdateAnnotationStatus } from "@/lib/hooks";

export interface AnnotationCardProps {
  annotation: {
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
  };
  workspaceSlug: string;
  onClick?: () => void;
}

// Truncate URL to max 50 characters
export function truncateUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + "...";
}

// Format date to readable string
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Get priority badge styles
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

export function AnnotationCard({
  annotation,
  workspaceSlug,
  onClick,
}: AnnotationCardProps) {
  const href = `/dashboard/${workspaceSlug}/annotations/${annotation.id}`;
  const updateStatus = useUpdateAnnotationStatus();
  const isDone = annotation.status === "done";

  const handleStatusToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateStatus.mutate({
      id: annotation.id,
      status: isDone ? "open" : "done",
    });
  };

  const content = (
    <>
      {/* Thumbnail */}
      <div className="h-40 bg-neutral-100 relative overflow-hidden">
        {annotation.screenshotAnnotated ? (
          <img
            src={annotation.screenshotAnnotated}
            alt={annotation.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              isDone ? "opacity-50" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <iconify-icon
              icon="lucide:image"
              className={`text-4xl ${
                isDone ? "text-neutral-200" : "text-neutral-300"
              }`}
            ></iconify-icon>
          </div>
        )}

        {/* Status checkbox - positioned in top-left corner */}
        <button
          onClick={handleStatusToggle}
          className="absolute top-2 left-2 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center hover:scale-110 transition-transform z-10"
          style={{
            borderColor: isDone ? "#10b981" : "#d4d4d8",
          }}
          title={isDone ? "Mark as open" : "Mark as done"}
        >
          {isDone && (
            <iconify-icon
              icon="lucide:check"
              className="text-sm text-green-500"
            ></iconify-icon>
          )}
        </button>
      </div>

      {/* Content */}
      <div className={`p-4 ${isDone ? "opacity-60" : ""}`}>
        {/* Title and priority */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className={`font-medium line-clamp-1 ${
              isDone ? "text-neutral-500 line-through" : "text-neutral-900"
            }`}
            title={annotation.title}
          >
            {annotation.title}
          </h3>
          {annotation.priority && (
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${getPriorityStyles(
                annotation.priority,
              )}`}
            >
              {annotation.priority}
            </span>
          )}
        </div>

        {/* Project name */}
        <div className="text-sm text-neutral-500 mb-2">
          {annotation.project.name}
        </div>

        {/* Page URL */}
        {annotation.pageUrl && (
          <div
            className="text-xs text-neutral-400 truncate mb-2"
            title={annotation.pageUrl}
          >
            {truncateUrl(annotation.pageUrl)}
          </div>
        )}

        {/* Creation date */}
        <div className="text-xs text-neutral-400">
          {formatDate(annotation.createdAt)}
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all group text-left w-full min-h-[44px]"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all group block min-h-[44px]"
    >
      {content}
    </Link>
  );
}

export default AnnotationCard;
