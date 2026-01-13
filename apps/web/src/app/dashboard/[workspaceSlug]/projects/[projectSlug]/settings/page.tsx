"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useWorkspaces, useProjects } from "@/lib/hooks";
import { IntegrationForm } from "@/components/dashboard";
import { apiClient } from "@/lib/api-client";
import type {
  WebhookIntegrationInput,
  TestResult,
} from "@/lib/types/integration";

interface IntegrationData extends WebhookIntegrationInput {
  locked: boolean;
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const projectSlug = params.projectSlug as string;

  // Get workspace by slug
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();
  const currentWorkspace = workspaces?.find((w) => w.slug === workspaceSlug);
  const workspaceId = currentWorkspace?.id || "";

  // Get projects to find the current one
  const { data: projects, isLoading: projectsLoading } =
    useProjects(workspaceId);
  const currentProject = projects?.find((p) => p.slug === projectSlug);
  const projectId = currentProject?.id || "";

  // Integration state
  const [initialData, setInitialData] = useState<IntegrationData | null>(null);
  const [integrationLoading, setIntegrationLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLoading = workspacesLoading || projectsLoading;

  // Fetch existing integration when projectId is available
  useEffect(() => {
    if (!projectId) return;

    const fetchIntegration = async () => {
      setIntegrationLoading(true);
      setError(null);
      try {
        const response = await apiClient.getIntegration(projectId);
        if (response.integration) {
          setInitialData({
            url: response.integration.url,
            headers: response.integration.headers,
            bodyTemplate: response.integration.bodyTemplate,
            enabled: response.integration.enabled,
            locked: response.integration.locked,
          });
        } else {
          setInitialData(null);
        }
      } catch (err) {
        console.error("Failed to fetch integration:", err);
        setError("Failed to load integration settings");
      } finally {
        setIntegrationLoading(false);
      }
    };

    fetchIntegration();
  }, [projectId]);

  const handleSave = async (
    data: WebhookIntegrationInput & { locked?: boolean }
  ): Promise<void> => {
    if (!projectId) return;

    await apiClient.saveIntegration(projectId, {
      url: data.url,
      headers: data.headers,
      bodyTemplate: data.bodyTemplate,
      enabled: data.enabled,
      locked: data.locked ?? false,
    });

    // Update local state with saved data
    setInitialData({
      url: data.url,
      headers: data.headers,
      bodyTemplate: data.bodyTemplate,
      enabled: data.enabled,
      locked: data.locked ?? false,
    });
  };

  const handleTest = async (
    data: WebhookIntegrationInput & { locked?: boolean }
  ): Promise<TestResult> => {
    if (!projectId) {
      return { success: false, message: "Project not found" };
    }

    return apiClient.testIntegration(projectId, {
      url: data.url,
      headers: data.headers,
      bodyTemplate: data.bodyTemplate,
      enabled: data.enabled,
      locked: data.locked ?? false,
    });
  };

  if (isLoading || integrationLoading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-5 w-32 bg-neutral-200 rounded mb-4"></div>
            <div className="h-8 w-64 bg-neutral-200 rounded mb-2"></div>
            <div className="h-4 w-48 bg-neutral-100 rounded mb-8"></div>
            <div className="space-y-6">
              <div className="h-20 bg-neutral-100 rounded-lg"></div>
              <div className="h-12 bg-neutral-100 rounded-lg"></div>
              <div className="h-32 bg-neutral-100 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const projectName =
    currentProject?.name ||
    projectSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/${workspaceSlug}/projects/${projectSlug}`}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
          >
            <iconify-icon icon="lucide:arrow-left"></iconify-icon>
            Back to {projectName}
          </Link>
          <h1 className="text-3xl font-instrument-serif font-normal text-neutral-900">
            Integration
          </h1>
          <p className="text-neutral-500 mt-2">
            Configure webhook integration for {projectName}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Integration Form */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <IntegrationForm
            projectId={projectId}
            initialData={initialData}
            onSave={handleSave}
            onTest={handleTest}
          />
        </div>
      </div>
    </div>
  );
}
