"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  useWorkspaces,
  useProjects,
  useCreateWorkspace,
  useCreateProject,
} from "@/lib/hooks";
import { AuthGuard } from "@/components/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] =
    useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showIntegrationGuideModal, setShowIntegrationGuideModal] =
    useState(false);

  // Fetch workspaces
  const { data: workspaces = [] } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();

  // Extract workspace slug from pathname
  const workspaceSlug = pathname.split("/")[2];
  const currentProjectSlug = pathname.includes("/projects/")
    ? pathname.split("/projects/")[1]?.split("/")[0]
    : undefined;

  // Find current workspace
  const currentWorkspace = workspaces.find((w) => w.slug === workspaceSlug);

  // Fetch projects for current workspace
  const { data: projects = [] } = useProjects(currentWorkspace?.id || "");

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only close if clicking outside dropdown areas
      if (
        !target.closest('[data-dropdown="workspace"]') &&
        !target.closest('[data-dropdown="user"]')
      ) {
        setShowWorkspaceDropdown(false);
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      const workspace = await createWorkspace.mutateAsync(
        newWorkspaceName.trim(),
      );
      setShowCreateWorkspaceModal(false);
      setNewWorkspaceName("");
      router.push(`/dashboard/${workspace.slug}`);
    } catch (err) {
      console.error("Failed to create workspace:", err);
    }
  };

  const openCreateWorkspaceModal = () => {
    setShowWorkspaceDropdown(false);
    setShowCreateWorkspaceModal(true);
  };

  const handleIntegrationClick = () => {
    setShowIntegrationGuideModal(true);
  };

  // Don't show layout on workspace selector page
  if (pathname === "/dashboard") {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-neutral-50 relative">
        {/* Animated background */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -right-40 w-[600px] h-[600px] bg-red-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute bottom-0 -left-40 w-[600px] h-[600px] bg-orange-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob delay-2000"></div>
          <div className="absolute inset-0 tech-grid opacity-60"></div>
        </div>

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-sm border-b border-neutral-200 z-10">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Left section */}
            <div className="flex items-center gap-4">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <iconify-icon
                  icon={sidebarOpen ? "lucide:x" : "lucide:menu"}
                  className="text-xl text-neutral-600"
                ></iconify-icon>
              </button>

              {/* Logo */}
              <Link href="/dashboard" className="flex items-center h-6">
                <img src="/notto-logo.png" alt="Notto" className="h-full" />
              </Link>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4">
              {/* User menu */}
              {user && (
                <div className="relative" data-dropdown="user">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserDropdown(!showUserDropdown);
                      setShowWorkspaceDropdown(false);
                    }}
                    className="flex items-center gap-2 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name || user.email}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>

                  {showUserDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg border border-neutral-200 shadow-lg py-1 z-50">
                      <div className="px-4 py-3 border-b border-neutral-100">
                        {user.name && (
                          <div className="font-medium text-neutral-900">
                            {user.name}
                          </div>
                        )}
                        <div className="text-sm text-neutral-500">
                          {user.email}
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/${workspaceSlug}/account`}
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 transition-colors text-neutral-700 w-full text-left"
                      >
                        <iconify-icon icon="lucide:user"></iconify-icon>
                        <span className="text-sm">Account Settings</span>
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          logout();
                        }}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 transition-colors text-red-600 w-full text-left"
                      >
                        <iconify-icon icon="lucide:log-out"></iconify-icon>
                        <span className="text-sm">Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Sidebar */}
        <aside
          className={`fixed top-16 left-0 bottom-0 w-64 bg-white/80 backdrop-blur-sm border-r border-neutral-200 z-10 transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 h-full flex flex-col">
            {/* Workspace selector */}
            {currentWorkspace && (
              <div className="mb-4">
                <div className="relative" data-dropdown="workspace">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowWorkspaceDropdown(!showWorkspaceDropdown);
                      setShowUserDropdown(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600 text-lg font-mono border border-neutral-200">
                      #
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm font-semibold text-neutral-900 truncate">
                        {currentWorkspace.name}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-xs text-neutral-500 truncate">
                          {user?.email}
                        </span>
                      </div>
                    </div>
                    <iconify-icon
                      icon="lucide:chevrons-up-down"
                      className="text-neutral-400 text-sm"
                    ></iconify-icon>
                  </button>

                  {showWorkspaceDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-neutral-200 shadow-lg py-1 z-50">
                      {workspaces.map((workspace) => (
                        <Link
                          key={workspace.id}
                          href={`/dashboard/${workspace.slug}`}
                          className={`flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 transition-colors ${
                            workspace.slug === workspaceSlug
                              ? "bg-neutral-50"
                              : ""
                          }`}
                          onClick={() => setShowWorkspaceDropdown(false)}
                        >
                          <div className="w-6 h-6 bg-neutral-100 rounded flex items-center justify-center text-neutral-500 text-xs font-mono">
                            #
                          </div>
                          <span className="text-sm text-neutral-700 truncate">
                            {workspace.name}
                          </span>
                          {workspace.slug === workspaceSlug && (
                            <iconify-icon
                              icon="lucide:check"
                              className="ml-auto text-accent"
                            ></iconify-icon>
                          )}
                        </Link>
                      ))}
                      <div className="border-t border-neutral-100 mt-1 pt-1">
                        <button
                          onClick={openCreateWorkspaceModal}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 transition-colors text-neutral-600 w-full text-left"
                        >
                          <iconify-icon
                            icon="lucide:plus"
                            className="text-neutral-400"
                          ></iconify-icon>
                          <span className="text-sm">Create workspace</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Link Integrations */}
            <div className="mb-4 pb-4 border-b border-neutral-200">
              <button
                onClick={handleIntegrationClick}
                className="flex items-center justify-between w-full px-3 py-2 hover:bg-neutral-100 rounded-lg transition-colors group"
              >
                <span className="text-sm text-neutral-600 group-hover:text-neutral-900">
                  Link Integrations
                </span>
                <div className="flex items-center gap-1 border rounded-full p-1.5">
                  <iconify-icon
                    icon="simple-icons:linear"
                    style={{ color: "#5E6AD2" }}
                    className="text-base"
                  ></iconify-icon>
                  <iconify-icon
                    icon="simple-icons:jira"
                    style={{ color: "#0052CC" }}
                    className="text-base"
                  ></iconify-icon>
                  <iconify-icon
                    icon="simple-icons:asana"
                    style={{ color: "#F06A6A" }}
                    className="text-base"
                  ></iconify-icon>
                </div>
              </button>
            </div>

            {/* Main Navigation */}
            <nav className="space-y-1 mb-4">
              <Link
                href={`/dashboard/${workspaceSlug}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === `/dashboard/${workspaceSlug}`
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                <iconify-icon
                  icon="lucide:home"
                  className="text-lg text-neutral-400"
                ></iconify-icon>
                <span className="text-sm font-medium">Home</span>
              </Link>
            </nav>

            {/* Projects section */}
            <div className="flex items-center justify-between mb-3 px-3">
              <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Projects
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateProjectModal(true);
                }}
                className="p-1 hover:bg-neutral-100 rounded transition-colors"
              >
                <iconify-icon
                  icon="lucide:plus"
                  className="text-orange-500 text-sm"
                ></iconify-icon>
              </button>
            </div>

            {/* Projects list */}
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {projects.length === 0 ? (
                <div className="text-sm text-neutral-400 py-4 text-center">
                  No projects yet
                </div>
              ) : (
                projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/${workspaceSlug}/projects/${project.slug}`}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      currentProjectSlug === project.slug
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <iconify-icon
                        icon="lucide:folder"
                        className={
                          currentProjectSlug === project.slug
                            ? "text-accent"
                            : "text-neutral-400"
                        }
                      ></iconify-icon>
                      <span className="text-sm font-medium truncate">
                        {project.name}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                      {project.annotationCount}
                    </span>
                  </Link>
                ))
              )}
            </nav>

            {/* Bottom section */}
            <div className="pt-4 border-t border-neutral-200 space-y-1">
              <Link
                href={`/dashboard/${workspaceSlug}/team`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === `/dashboard/${workspaceSlug}/team`
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                <iconify-icon
                  icon="lucide:users"
                  className="text-lg text-neutral-400"
                ></iconify-icon>
                <span className="text-sm font-medium">Team</span>
              </Link>
              <Link
                href={`/dashboard/${workspaceSlug}/settings`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === `/dashboard/${workspaceSlug}/settings`
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                <iconify-icon
                  icon="lucide:settings"
                  className="text-lg text-neutral-400"
                ></iconify-icon>
                <span className="text-sm font-medium">Workspace Settings</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main content */}
        <main
          className={`pt-16 min-h-screen transition-all duration-300 relative z-0 ${
            sidebarOpen && !isMobile ? "lg:pl-64" : ""
          }`}
        >
          {children}
        </main>

        {/* Create Workspace Modal */}
        {showCreateWorkspaceModal && (
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
              <form onSubmit={handleCreateWorkspace}>
                <div className="p-6">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Workspace name
                  </label>
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="e.g., My Company, Personal"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                    autoFocus
                  />
                </div>
                <div className="p-6 pt-0 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateWorkspaceModal(false);
                      setNewWorkspaceName("");
                    }}
                    className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !newWorkspaceName.trim() || createWorkspace.isPending
                    }
                    className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {createWorkspace.isPending && (
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
        )}

        {/* Create Project Modal */}
        {showCreateProjectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6 border-b border-neutral-100">
                <h3 className="text-xl font-instrument-serif text-neutral-900">
                  Create New Project
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Projects help you organize your annotations.
                </p>
              </div>
              <CreateProjectModalForm
                workspaceId={currentWorkspace?.id || ""}
                onClose={() => setShowCreateProjectModal(false)}
                onSuccess={() => setShowCreateProjectModal(false)}
              />
            </div>
          </div>
        )}

        {/* Integration Guide Modal */}
        {showIntegrationGuideModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="p-6 border-b border-neutral-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-instrument-serif text-neutral-900">
                      Link Integrations
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">
                      Connect your annotations to Linear, Jira, or Asana
                    </p>
                  </div>
                  <button
                    onClick={() => setShowIntegrationGuideModal(false)}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <iconify-icon
                      icon="lucide:x"
                      className="text-xl"
                    ></iconify-icon>
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="text-sm text-neutral-700">
                      Go to your project settings page
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="text-sm text-neutral-700">
                      Navigate to the{" "}
                      <span className="font-medium">Integration</span> tab
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="text-sm text-neutral-700">
                      Enter your webhook URL from Linear, Jira, or Asana
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div>
                    <p className="text-sm text-neutral-700">
                      Configure headers and body template as needed
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-medium">
                    5
                  </div>
                  <div>
                    <p className="text-sm text-neutral-700">
                      Test the connection and save your settings
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 pt-0 flex gap-3 justify-end border-t border-neutral-100">
                <button
                  onClick={() => setShowIntegrationGuideModal(false)}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

function CreateProjectModalForm({
  workspaceId,
  onClose,
  onSuccess,
}: {
  workspaceId: string;
  onClose: () => void;
  onSuccess: (project: { id: string; name: string; slug: string }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createProject = useCreateProject(workspaceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter a project name");
      return;
    }

    try {
      const project = await createProject.mutateAsync({
        name: trimmedName,
        description: description.trim() || undefined,
      });
      onSuccess(project);
    } catch (err) {
      console.error("Failed to create project:", err);
      setError("Failed to create project. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Project name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Website Redesign, Mobile App"
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
          autoFocus
        />
        <label className="block text-sm font-medium text-neutral-700 mb-2 mt-4">
          Description <span className="text-neutral-400">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project about?"
          rows={3}
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none"
        />
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
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
          disabled={!name.trim() || createProject.isPending}
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {createProject.isPending && (
            <iconify-icon
              icon="lucide:loader-2"
              className="animate-spin"
            ></iconify-icon>
          )}
          Create project
        </button>
      </div>
    </form>
  );
}
