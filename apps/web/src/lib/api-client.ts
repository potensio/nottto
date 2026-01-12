const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface ApiError {
  status: number;
  message: string;
  code?: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on init (client-side only)
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken");
      this.refreshToken = localStorage.getItem("refreshToken");
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  isAuthenticated() {
    return !!this.accessToken;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)[
        "Authorization"
      ] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry the request with new token
        (headers as Record<string, string>)[
          "Authorization"
        ] = `Bearer ${this.accessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    }

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

      // Redirect to auth on 401
      if (response.status === 401 && typeof window !== "undefined") {
        window.location.href = "/auth";
      }

      throw error;
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const data = await this.fetch<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string; name: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async register(email: string, password: string, name: string) {
    const data = await this.fetch<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string; name: string };
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  // Magic Link Auth endpoints
  async requestMagicLink(
    email: string,
    isRegister: boolean = false,
    name?: string
  ) {
    return this.fetch<{
      message: string;
      email: string;
    }>("/auth/magic-link", {
      method: "POST",
      body: JSON.stringify({ email, isRegister, name }),
    });
  }

  async verifyMagicLink(token: string) {
    const data = await this.fetch<{
      user: { id: string; email: string; name: string | null };
      tokens: { accessToken: string; refreshToken: string };
      isNewUser: boolean;
    }>("/auth/verify-magic-link", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    return data;
  }

  async getMe() {
    return this.fetch<{ user: { id: string; email: string; name: string } }>(
      "/auth/me"
    );
  }

  logout() {
    this.clearTokens();
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
}

// Export singleton instance
export const apiClient = new ApiClient();
export type { ApiError };
