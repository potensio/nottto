"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useWorkspaces, useProjects, useCreateWorkspace } from "@/lib/hooks";
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
        newWorkspaceName.trim()
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
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-sm border-b border-neutral-200 z-40">
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
                <img src="/nottto-logo.png" alt="Nottto" className="h-full" />
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
                    <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
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
          className={`fixed top-16 left-0 bottom-0 w-64 bg-white/80 backdrop-blur-sm border-r border-neutral-200 z-30 transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 h-full flex flex-col">
            {/* Workspace selector */}
            {currentWorkspace && (
              <div className="mb-4 pb-4 border-b border-neutral-200">
                <div className="relative" data-dropdown="workspace">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowWorkspaceDropdown(!showWorkspaceDropdown);
                      setShowUserDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    <span className="text-lg">
                      {currentWorkspace.icon || "📁"}
                    </span>
                    <span className="text-sm font-medium text-neutral-700 flex-1 text-left truncate">
                      {currentWorkspace.name}
                    </span>
                    <iconify-icon
                      icon="lucide:chevron-down"
                      className="text-neutral-400"
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
                          <span className="text-lg">
                            {workspace.icon || "📁"}
                          </span>
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
            {/* Projects section */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Projects
              </h3>
              <button className="p-1 hover:bg-neutral-100 rounded transition-colors">
                <iconify-icon
                  icon="lucide:plus"
                  className="text-neutral-400"
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
                    <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                      {project.annotationCount}
                    </span>
                  </Link>
                ))
              )}
            </nav>

            {/* Bottom section */}
            <div className="pt-4 border-t border-neutral-200 space-y-1">
              <Link
                href={`/dashboard/${workspaceSlug}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === `/dashboard/${workspaceSlug}`
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                <iconify-icon
                  icon="lucide:layout-dashboard"
                  className="text-neutral-400"
                ></iconify-icon>
                <span className="text-sm font-medium">All Annotations</span>
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
                  className="text-neutral-400"
                ></iconify-icon>
                <span className="text-sm font-medium">Settings</span>
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
          className={`pt-16 min-h-screen transition-all duration-300 relative z-10 ${
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
      </div>
    </AuthGuard>
  );
}
