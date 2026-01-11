"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { IconPicker, DEFAULT_WORKSPACE_ICON } from "@/components/IconPicker";

interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  icon: string;
  ownerId: string;
}

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState(DEFAULT_WORKSPACE_ICON);

  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  // Fetch workspace data
  useEffect(() => {
    async function fetchWorkspace() {
      try {
        setIsLoading(true);
        const response = await apiClient.getWorkspaceBySlug(workspaceSlug);
        setWorkspace(response.workspace);
        setName(response.workspace.name);
        setSlug(response.workspace.slug);
        setIcon(response.workspace.icon || DEFAULT_WORKSPACE_ICON);
      } catch (err: unknown) {
        const errorObj = err as { message?: string };
        setError(errorObj.message || "Failed to load workspace");
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkspace();
  }, [workspaceSlug]);

  const validateForm = (): boolean => {
    let isValid = true;
    setNameError(null);
    setSlugError(null);

    if (!name || name.trim().length === 0) {
      setNameError("Workspace name is required");
      isValid = false;
    }

    if (!slug || slug.trim().length === 0) {
      setSlugError("Workspace slug is required");
      isValid = false;
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError(
        "Slug must contain only lowercase letters, numbers, and hyphens"
      );
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !workspace) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient.updateWorkspace(workspace.id, {
        name: name.trim(),
        slug: slug.trim(),
        icon,
      });

      setWorkspace(response.workspace);
      setSuccess(true);

      // If slug changed, redirect to new URL
      if (slug !== workspaceSlug) {
        router.push(`/dashboard/${slug}/settings`);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const errorObj = err as { message?: string; status?: number };
      if (errorObj.status === 409) {
        setSlugError("This slug is already in use");
      } else if (errorObj.status === 403) {
        setError("You don't have permission to modify this workspace");
      } else {
        setError(errorObj.message || "Failed to save changes");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-48 mb-8"></div>
            <div className="space-y-6">
              <div className="h-12 bg-neutral-200 rounded"></div>
              <div className="h-12 bg-neutral-200 rounded"></div>
              <div className="h-12 bg-neutral-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <iconify-icon
              icon="lucide:alert-circle"
              className="text-3xl text-red-600"
            ></iconify-icon>
          </div>
          <h2 className="text-xl font-medium text-neutral-900 mb-2">
            Failed to load workspace
          </h2>
          <p className="text-neutral-500 mb-6">{error}</p>
          <Link
            href={`/dashboard/${workspaceSlug}`}
            className="inline-flex items-center gap-2 text-accent hover:underline"
          >
            <iconify-icon icon="lucide:arrow-left"></iconify-icon>
            Back to workspace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/${workspaceSlug}`}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
          >
            <iconify-icon icon="lucide:arrow-left"></iconify-icon>
            Back to workspace
          </Link>
          <h1 className="text-3xl font-instrument-serif font-normal text-neutral-900">
            Workspace Settings
          </h1>
          <p className="text-neutral-500 mt-2">
            Manage your workspace name, URL, and appearance
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <iconify-icon
              icon="lucide:check-circle"
              className="text-green-600 text-xl"
            ></iconify-icon>
            <span className="text-green-800">Changes saved successfully!</span>
          </div>
        )}

        {/* Error message */}
        {error && workspace && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <iconify-icon
              icon="lucide:alert-circle"
              className="text-red-600 text-xl"
            ></iconify-icon>
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Settings form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Workspace Icon
            </label>
            <IconPicker selectedIcon={icon} onSelect={setIcon} />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="My Workspace"
              className={`w-full px-4 py-3 bg-white border rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all ${
                nameError
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  : "border-neutral-200"
              }`}
            />
            {nameError && (
              <p className="mt-2 text-sm text-red-600">{nameError}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Workspace URL
            </label>
            <div className="flex items-center">
              <span className="px-4 py-3 bg-neutral-100 border border-r-0 border-neutral-200 rounded-l-lg text-neutral-500 text-sm">
                /dashboard/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                  );
                  if (slugError) setSlugError(null);
                }}
                placeholder="my-workspace"
                className={`flex-1 px-4 py-3 bg-white border rounded-r-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all ${
                  slugError
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-neutral-200"
                }`}
              />
            </div>
            {slugError && (
              <p className="mt-2 text-sm text-red-600">{slugError}</p>
            )}
            <p className="mt-2 text-xs text-neutral-500">
              Only lowercase letters, numbers, and hyphens are allowed
            </p>
          </div>

          {/* Submit button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <iconify-icon
                    icon="lucide:loader-2"
                    className="animate-spin"
                  ></iconify-icon>
                  Saving...
                </>
              ) : (
                <>
                  <iconify-icon icon="lucide:save"></iconify-icon>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
