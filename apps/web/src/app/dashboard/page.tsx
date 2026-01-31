"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaces, useCreateWorkspace } from "@/lib/hooks";
import { EmptyState } from "@/components/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const { data: workspaces, isLoading, error } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      const workspace = await createWorkspace.mutateAsync(
        newWorkspaceName.trim(),
      );
      setShowCreateModal(false);
      setNewWorkspaceName("");
      router.push(`/dashboard/${workspace.slug}`);
    } catch (err) {
      console.error("Failed to create workspace:", err);
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setNewWorkspaceName("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-neutral-200 rounded-lg"></div>
          <div className="h-4 w-32 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <iconify-icon
              icon="lucide:alert-circle"
              className="text-3xl text-red-500 mx-auto"
            ></iconify-icon>
          </div>
          <h2 className="text-2xl text-neutral-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-neutral-500 mb-6">
            Unable to load workspaces. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No workspaces - show empty state
  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
        <EmptyState
          type="no-workspaces"
          onAction={() => setShowCreateModal(true)}
        />
        {showCreateModal && (
          <CreateWorkspaceModal
            isOpen={showCreateModal}
            onClose={closeModal}
            name={newWorkspaceName}
            setName={setNewWorkspaceName}
            onSubmit={handleCreateWorkspace}
            isLoading={createWorkspace.isPending}
          />
        )}
      </div>
    );
  }

  // Multiple workspaces - show selector
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md mx-auto p-8">
        <h2 className="text-3xl font-instrument-serif text-neutral-900 mb-2 text-center">
          Select a workspace
        </h2>
        <p className="text-neutral-500 mb-8 text-center">
          Choose a workspace to view your annotations
        </p>
        <div className="space-y-3">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => router.push(`/dashboard/${workspace.slug}`)}
              className="w-full p-4 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 hover:shadow-sm transition-all flex items-center gap-4 text-left min-h-[44px]"
            >
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-xl">
                {workspace.icon || "📁"}
              </div>
              <div>
                <div className="font-medium text-neutral-900">
                  {workspace.name}
                </div>
                <div className="text-sm text-neutral-500">{workspace.slug}</div>
              </div>
              <iconify-icon
                icon="lucide:chevron-right"
                className="ml-auto text-neutral-400"
              ></iconify-icon>
            </button>
          ))}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full p-4 border border-dashed border-neutral-300 rounded-lg hover:border-neutral-400 hover:bg-neutral-50 transition-all flex items-center gap-4 text-left min-h-[44px]"
          >
            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
              <iconify-icon
                icon="lucide:plus"
                className="text-xl text-neutral-500"
              ></iconify-icon>
            </div>
            <div className="font-medium text-neutral-600">
              Create new workspace
            </div>
          </button>
        </div>
      </div>

      {showCreateModal && (
        <CreateWorkspaceModal
          isOpen={showCreateModal}
          onClose={closeModal}
          name={newWorkspaceName}
          setName={setNewWorkspaceName}
          onSubmit={handleCreateWorkspace}
          isLoading={createWorkspace.isPending}
        />
      )}
    </div>
  );
}

function CreateWorkspaceModal({
  isOpen,
  onClose,
  name,
  setName,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-neutral-100">
          <h3 className="text-xl font-instrument-serif text-neutral-900">
            Create workspace
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            Workspaces help you organize your projects and annotations.
          </p>
        </div>
        <form onSubmit={onSubmit}>
          <div className="p-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Workspace name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Company, Personal"
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
              autoFocus
            />
          </div>
          <div className="p-6 pt-0 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && (
                <iconify-icon
                  icon="lucide:loader-2"
                  className="animate-spin"
                ></iconify-icon>
              )}
              Create workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
