const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface ApiError {
  status: number;
  message: string;
  code?: string;
}

class ApiClient {
  private getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }

  private setAccessToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessToken", token);
  }

  private clearAccessToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
  }

  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add Bearer token if available
    const token = this.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Merge with any additional headers from options
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
          headers[key] = value;
        }
      });
    }

    // Include credentials to send cookies automatically (fallback)
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    // Handle errors
    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        message: "An error occurred",
      };

      try {
        const errorData = await response.json();
        // Handle nested error structure from API
        if (errorData.error) {
          error.message = errorData.error.message || error.message;
          error.code = errorData.error.code;

          // Include validation details if present
          if (errorData.error.details) {
            const validationErrors = Object.entries(errorData.error.details)
              .map(
                ([field, messages]) =>
                  `${field}: ${(messages as string[]).join(", ")}`,
              )
              .join("; ");
            error.message = `${error.message} (${validationErrors})`;
          }
        } else {
          // Fallback for non-standard error format
          error.message =
            errorData.message || errorData.error_description || error.message;
          error.code = errorData.code || errorData.error;
        }
      } catch {
        // Ignore JSON parse errors
      }

      // Redirect to auth on 401 (but not if already on auth page or invitation page)
      // Also don't redirect if this is a /auth/me request (let the auth context handle it)
      if (response.status === 401 && typeof window !== "undefined") {
        const isAuthPage = window.location.pathname.startsWith("/auth");
        const isInvitationPage =
          window.location.pathname.startsWith("/invitations");
        const isAuthMeRequest = endpoint === "/auth/me";
        if (!isAuthPage && !isInvitationPage && !isAuthMeRequest) {
          window.location.href = "/auth";
        }
      }

      throw error;
    }

    // Handle 204 No Content responses (no body to parse)
    if (response.status === 204) {
      return undefined as T;
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
    // Store token
    this.setAccessToken(data.tokens.accessToken);
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
    // Store token
    this.setAccessToken(data.tokens.accessToken);
    return data;
  }

  // Magic Link Auth endpoints
  async requestMagicLink(
    email: string,
    isRegister: boolean = false,
    name?: string,
    extensionSession?: string,
  ) {
    const body: Record<string, any> = { email, isRegister };
    // Only include name if it's provided and not empty
    if (name && name.trim().length > 0) body.name = name;
    if (extensionSession) body.extensionSession = extensionSession;

    return this.fetch<{
      message: string;
      email: string;
    }>("/auth/magic-link", {
      method: "POST",
      body: JSON.stringify(body),
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
    // Store token
    this.setAccessToken(data.tokens.accessToken);
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

    // Clear token
    this.clearAccessToken();

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
    data: { name?: string; slug?: string; icon?: string },
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
    data: { name?: string; slug?: string; description?: string },
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

  async updateAnnotationStatus(id: string, status: "open" | "done") {
    return this.fetch<{
      annotation: {
        id: string;
        title: string;
        description?: string;
        priority?: string;
        type?: string;
        status: string;
        pageUrl?: string;
        pageTitle?: string;
        screenshotOriginal?: string;
        screenshotAnnotated?: string;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/annotations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
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
    },
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
    },
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

  // Team invitation endpoints
  async getWorkspaceMembers(workspaceId: string) {
    return this.fetch<{
      members: Array<{
        id: string;
        workspaceId: string;
        userId: string;
        role: "owner" | "admin" | "member";
        createdAt: string;
        user: {
          id: string;
          email: string;
          name: string | null;
          profilePicture: string | null;
        };
      }>;
    }>(`/workspaces/${workspaceId}/members`);
  }

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    role: "admin" | "member",
  ) {
    return this.fetch<{
      member: {
        id: string;
        workspaceId: string;
        userId: string;
        role: "owner" | "admin" | "member";
        createdAt: string;
      };
    }>(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  }

  async removeMember(workspaceId: string, memberId: string) {
    return this.fetch<void>(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: "DELETE",
    });
  }

  async getPendingInvitations(workspaceId: string) {
    return this.fetch<{
      invitations: Array<{
        id: string;
        workspaceId: string;
        inviterUserId: string;
        inviteeEmail: string;
        role: "admin" | "member";
        status: string;
        expiresAt: string;
        createdAt: string;
      }>;
    }>(`/workspaces/${workspaceId}/invitations`);
  }

  async sendInvitation(
    workspaceId: string,
    email: string,
    role: "admin" | "member",
  ) {
    return this.fetch<{
      invitation: {
        id: string;
        workspaceId: string;
        inviterUserId: string;
        inviteeEmail: string;
        role: "admin" | "member";
        status: string;
        expiresAt: string;
        createdAt: string;
      };
    }>(`/workspaces/${workspaceId}/invitations`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  }

  async cancelInvitation(workspaceId: string, invitationId: string) {
    return this.fetch<void>(
      `/workspaces/${workspaceId}/invitations/${invitationId}`,
      {
        method: "DELETE",
      },
    );
  }

  async resendInvitation(workspaceId: string, invitationId: string) {
    return this.fetch<{
      invitation: {
        id: string;
        workspaceId: string;
        inviterUserId: string;
        inviteeEmail: string;
        role: "admin" | "member";
        status: string;
        expiresAt: string;
        createdAt: string;
      };
    }>(`/workspaces/${workspaceId}/invitations/${invitationId}/resend`, {
      method: "POST",
    });
  }

  // Invitation acceptance endpoints (invitee actions)
  async getInvitationDetails(token: string) {
    return this.fetch<{
      invitation: {
        id: string;
        workspaceId: string;
        inviterUserId: string;
        inviteeEmail: string;
        role: "admin" | "member";
        status: string;
        expiresAt: string;
        createdAt: string;
      };
      workspace: {
        id: string;
        name: string;
        icon: string;
      };
      inviter: {
        name: string | null;
        email: string;
      };
      userExists: boolean;
    }>(`/invitations/${token}`);
  }

  async acceptInvitation(token: string, fullName?: string) {
    return this.fetch<{
      workspace: {
        id: string;
        name: string;
        slug: string;
        icon: string;
      };
      sessionToken?: string;
      user?: {
        id: string;
        email: string;
        name: string | null;
      };
    }>(`/invitations/${token}/accept`, {
      method: "POST",
      body: JSON.stringify({ fullName }),
    });
  }

  async declineInvitation(token: string) {
    return this.fetch<void>(`/invitations/${token}/decline`, {
      method: "POST",
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export type { ApiError };
