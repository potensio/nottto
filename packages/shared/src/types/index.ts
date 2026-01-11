// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithoutPassword extends User {}

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  icon: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  createdAt: Date;
}

// Project types
export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Annotation types
export type AnnotationType = "bug" | "improvement" | "question";
export type AnnotationPriority = "urgent" | "high" | "medium" | "low";

export interface Annotation {
  id: string;
  projectId: string;
  userId: string | null;
  title: string;
  description: string | null;
  type: AnnotationType | null;
  priority: AnnotationPriority | null;
  pageUrl: string | null;
  pageTitle: string | null;
  screenshotOriginal: string | null;
  screenshotAnnotated: string | null;
  canvasData: unknown;
  createdAt: Date;
  updatedAt: Date;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserWithoutPassword;
  tokens: AuthTokens;
}

export interface RefreshResponse {
  accessToken: string;
}

// API Response types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiErrorResponse {
  error: ApiError;
}
