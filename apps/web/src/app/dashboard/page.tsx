"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaces } from "@/lib/hooks";
import { EmptyState } from "@/components/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const { data: workspaces, isLoading, error } = useWorkspaces();

  useEffect(() => {
    // Auto-redirect if single workspace
    if (workspaces && workspaces.length === 1) {
      router.replace(`/dashboard/${workspaces[0].slug}`);
    }
  }, [workspaces, router]);

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
              className="text-3xl text-red-500"
            ></iconify-icon>
          </div>
          <h2 className="text-2xl font-instrument-serif text-neutral-900 mb-2">
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
          onAction={() => {
            // TODO: Open create workspace modal
            console.log("Create workspace");
          }}
        />
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
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                <iconify-icon
                  icon="lucide:building-2"
                  className="text-xl text-neutral-600"
                ></iconify-icon>
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
        </div>
      </div>
    </div>
  );
}
