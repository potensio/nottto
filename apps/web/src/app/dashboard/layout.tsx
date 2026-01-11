"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useWorkspaces, useProjects } from "@/lib/hooks";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Fetch workspaces
  const { data: workspaces = [] } = useWorkspaces();

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
    const handleClickOutside = () => {
      setShowWorkspaceDropdown(false);
      setShowUserDropdown(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Don't show layout on workspace selector page
  if (pathname === "/dashboard") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 relative">
      {/* Animated background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -right-40 w-[600px] h-[600px] bg-red-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 -left-40 w-[600px] h-[600px] bg-orange-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob delay-2000"></div>
        <div className="absolute inset-0 tech-grid opacity-30"></div>
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

            {/* Workspace selector */}
            {workspaces.length > 1 && currentWorkspace && (
              <div className="relative ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowWorkspaceDropdown(!showWorkspaceDropdown);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  <iconify-icon
                    icon="lucide:building-2"
                    className="text-neutral-500"
                  ></iconify-icon>
                  <span className="text-sm font-medium text-neutral-700">
                    {currentWorkspace.name}
                  </span>
                  <iconify-icon
                    icon="lucide:chevron-down"
                    className="text-neutral-400"
                  ></iconify-icon>
                </button>

                {showWorkspaceDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg border border-neutral-200 shadow-lg py-1 z-50">
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
                        <iconify-icon
                          icon="lucide:building-2"
                          className="text-neutral-400"
                        ></iconify-icon>
                        <span className="text-sm text-neutral-700">
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
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* User menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserDropdown(!showUserDropdown);
                  }}
                  className="flex items-center gap-2 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>

                {showUserDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg border border-neutral-200 shadow-lg py-1 z-50">
                    <div className="px-4 py-3 border-b border-neutral-100">
                      <div className="font-medium text-neutral-900">
                        {user.name}
                      </div>
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
          <div className="pt-4 border-t border-neutral-200">
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
    </div>
  );
}
