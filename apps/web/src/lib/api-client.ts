const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface ApiError {
  status: number;
  message: string;
  code?: string;
}

class ApiClient {
  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Include credentials to send cookies automatically
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Important: sends cookies with requests
    });

    // Handle errors
    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        message: "An error occurred",
      };

      try {
        const errorData = await response.json();
        error.message = errorData.message || error.message;
        error.code = errorData.code;
      } catch {
        // Ignore JSON parse errors
      }

      // Redirect to auth on 401 (but not if already on auth page)
      if (response.status === 401 && typeof window !== "undefined") {
        const isAuthPage = window.location.pathname.startsWith("/auth");
        if (!isAuthPage) {
          window.location.href = "/auth";
        }
      }

      throw error;
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const data = await this.fetch<{
      user: { id: string; email: string; name: string };
      tokens: { accessToken: string; refreshToken: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    // Cookie is set automatically by server
    return data;
  }

  async register(email: string, password: string, name: string) {
    const data = await this.fetch<{
      user: { id: string; email: string; name: string };
      tokens: { accessToken: string; refreshToken: string };
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    // Cookie is set automatically by server
    return data;
  }

  // Magic Link Auth endpoints
  async requestMagicLink(
    email: string,
    isRegister: boolean = false,
    name?: string,
    extensionSession?: string
  ) {
    return this.fetch<{
      message: string;
      email: string;
    }>("/auth/magic-link", {
      method: "POST",
      body: JSON.stringify({ email, isRegister, name, extensionSession }),
    });
  }

  async verifyMagicLink(token: string) {
    const data = await this.fetch<{
      user: {
        id: string;
        email: string;
        name: string | null;
        profilePicture: string | null;
      };
      tokens: { accessToken: string; refreshToken: string };
      isNewUser: boolean;
    }>("/auth/verify-magic-link", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    // Cookie is set automatically by server
    return data;
  }

  async getMe() {
    return this.fetch<{
      user: {
        id: string;
        email: string;
        name: string | null;
        profilePicture: string | null;
      };
    }>("/auth/me");
  }

  async updateMe(data: { name?: string; profilePicture?: string | null }) {
    return this.fetch<{
      user: {
        id: string;
        email: string;
        name: string | null;
        profilePicture: string | null;
      };
    }>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteAccount() {
    return this.fetch<{ success: boolean; message: string }>("/auth/me", {
      method: "DELETE",
    });
  }

  async uploadProfilePicture(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${API_BASE_URL}/upload/profile-picture`;

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include", // Send cookies
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Upload failed" }));
      throw { status: response.status, message: error.message };
    }

    return response.json() as Promise<{ url: string }>;
  }

  async logout() {
    try {
      await this.fetch("/auth/logout", {
        method: "POST",
      });
    } catch {
      // Ignore errors during logout
    }

    // Redirect to auth page
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    }
  }

  // Workspace endpoints
  async getWorkspaces() {
    return this.fetch<{
      workspaces: Array<{
        id: string;
        name: string;
        slug: string;
        icon: string;
      }>;
    }>("/workspaces");
  }

  async getWorkspace(id: string) {
    return this.fetch<{
      workspace: { id: string; name: string; slug: string; icon: string };
    }>(`/workspaces/${id}`);
  }

  async getWorkspaceBySlug(slug: string) {
    return this.fetch<{
      workspace: {
        id: string;
        name: string;
        slug: string;
        icon: string;
        ownerId: string;
      };
    }>(`/workspaces/by-slug/${slug}`);
  }

  async createWorkspace(name: string) {
    return this.fetch<{
      workspace: { id: string; name: string; slug: string; icon: string };
    }>("/workspaces", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async updateWorkspace(
    id: string,
    data: { name?: string; slug?: string; icon?: string }
  ) {
    return this.fetch<{
      workspace: {
        id: string;
        name: string;
        slug: string;
        icon: string;
        ownerId: string;
      };
    }>(`/workspaces/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Project endpoints
  async getProjects(workspaceId: string) {
    return this.fetch<{
      projects: Array<{
        id: string;
        name: string;
        slug: string;
        description?: string;
        annotationCount?: number;
      }>;
    }>(`/workspaces/${workspaceId}/projects`);
  }

  async getProject(id: string) {
    return this.fetch<{
      project: {
        id: string;
        name: string;
        slug: string;
        description?: string;
      };
    }>(`/projects/${id}`);
  }

  async createProject(workspaceId: string, name: string, description?: string) {
    return this.fetch<{
      project: { id: string; name: string; slug: string; description?: string };
    }>(`/workspaces/${workspaceId}/projects`, {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  }

  async updateProject(
    id: string,
    data: { name?: string; slug?: string; description?: string }
  ) {
    return this.fetch<{
      project: { id: string; name: string; slug: string; description?: string };
    }>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Annotation endpoints
  async getAnnotations(projectId: string) {
    return this.fetch<{
      annotations: Array<{
        id: string;
        title: string;
        description?: string;
        priority?: string;
        type?: string;
        pageUrl?: string;
        pageTitle?: string;
        screenshotAnnotated?: string;
        createdAt: string;
        project: { name: string; slug: string };
        user?: { name: string };
      }>;
    }>(`/projects/${projectId}/annotations`);
  }

  async getAnnotation(id: string) {
    return this.fetch<{
      annotation: {
        id: string;
        title: string;
        description?: string;
        priority?: string;
        type?: string;
        pageUrl?: string;
        pageTitle?: string;
        screenshotOriginal?: string;
        screenshotAnnotated?: string;
        createdAt: string;
        updatedAt: string;
        project: { id: string; name: string; slug: string };
        user?: { id: string; name: string; email: string };
      };
    }>(`/annotations/${id}`);
  }

  async deleteAnnotation(id: string) {
    return this.fetch<{ success: boolean }>(`/annotations/${id}`, {
      method: "DELETE",
    });
  }

  // Integration endpoints
  async getIntegration(projectId: string) {
    return this.fetch<{
      integration: {
        id: string;
        projectId: string;
        url: string;
        headers: Record<string, string>;
        bodyTemplate: string;
        enabled: boolean;
        locked: boolean;
        createdAt: string;
        updatedAt: string;
      } | null;
    }>(`/projects/${projectId}/integration`);
  }

  async saveIntegration(
    projectId: string,
    data: {
      url: string;
      headers: Record<string, string>;
      bodyTemplate: string;
      enabled: boolean;
      locked: boolean;
    }
  ) {
    return this.fetch<{
      integration: {
        id: string;
        projectId: string;
        url: string;
        headers: Record<string, string>;
        bodyTemplate: string;
        enabled: boolean;
        locked: boolean;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/projects/${projectId}/integration`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteIntegration(projectId: string) {
    return this.fetch<void>(`/projects/${projectId}/integration`, {
      method: "DELETE",
    });
  }

  async testIntegration(
    projectId: string,
    data: {
      url: string;
      headers: Record<string, string>;
      bodyTemplate: string;
      enabled: boolean;
      locked: boolean;
    }
  ) {
    return this.fetch<{
      success: boolean;
      statusCode?: number;
      message: string;
    }>(`/projects/${projectId}/integration/test`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export type { ApiError };
