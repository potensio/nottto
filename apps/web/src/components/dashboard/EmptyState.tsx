"use client";

import Link from "next/link";

export interface EmptyStateProps {
  type: "no-workspaces" | "no-projects" | "no-annotations" | "not-found";
  workspaceSlug?: string;
  onAction?: () => void;
  actionLabel?: string;
}

const emptyStateConfig = {
  "no-workspaces": {
    icon: "lucide:folder-plus",
    title: "No workspaces yet",
    description:
      "Create your first workspace to start capturing and organizing bug reports.",
    actionLabel: "Create Workspace",
    actionIcon: "lucide:plus",
  },
  "no-projects": {
    icon: "lucide:folder-open",
    title: "No projects yet",
    description:
      "Create a project to organize your annotations by application or website.",
    actionLabel: "Create Project",
    actionIcon: "lucide:plus",
  },
  "no-annotations": {
    icon: "lucide:image-plus",
    title: "No annotations yet",
    description:
      "Install the Chrome extension to start capturing and annotating screenshots.",
    actionLabel: "Install Extension",
    actionIcon: "lucide:download",
    isExternal: true,
  },
  "not-found": {
    icon: "lucide:file-question",
    title: "Not found",
    description:
      "The resource you're looking for doesn't exist or has been deleted.",
    actionLabel: "Back to Dashboard",
    actionIcon: "lucide:arrow-left",
  },
};

export function EmptyState({
  type,
  workspaceSlug,
  onAction,
  actionLabel,
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const label = actionLabel || config.actionLabel;

  const renderAction = () => {
    if (type === "not-found" && workspaceSlug) {
      return (
        <Link
          href={`/dashboard/${workspaceSlug}`}
          className="bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 min-h-[44px]"
        >
          <iconify-icon icon={config.actionIcon}></iconify-icon>
          {label}
        </Link>
      );
    }

    if (type === "no-annotations") {
      return (
        <a
          href="https://chrome.google.com/webstore"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 min-h-[44px]"
        >
          <iconify-icon icon={config.actionIcon}></iconify-icon>
          {label}
        </a>
      );
    }

    if (onAction) {
      return (
        <button
          onClick={onAction}
          className="bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 min-h-[44px]"
        >
          <iconify-icon icon={config.actionIcon}></iconify-icon>
          {label}
        </button>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-neutral-200">
      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
        <iconify-icon
          icon={config.icon}
          className="text-3xl text-neutral-400"
        ></iconify-icon>
      </div>
      <h3 className="text-2xl font-instrument-serif text-neutral-900 mb-2">
        {config.title}
      </h3>
      <p className="text-sm text-neutral-500 mb-6 text-center max-w-md px-4">
        {config.description}
      </p>
      {renderAction()}
    </div>
  );
}

export default EmptyState;
