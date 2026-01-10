import { z } from "zod";

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(255).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Workspace schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
});

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  description: z.string().max(1000).optional(),
});

// Annotation schemas
export const annotationTypeSchema = z.enum(["bug", "improvement", "question"]);
export const annotationPrioritySchema = z.enum([
  "urgent",
  "high",
  "medium",
  "low",
]);

export const createAnnotationSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(5000).optional(),
  type: annotationTypeSchema.optional(),
  priority: annotationPrioritySchema.optional(),
  pageUrl: z.string().url("Invalid URL").optional(),
  pageTitle: z.string().max(255).optional(),
  screenshotOriginal: z.string().url("Invalid URL").optional(),
  screenshotAnnotated: z.string().url("Invalid URL").optional(),
  canvasData: z.any().optional(),
});

export const updateAnnotationSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  type: annotationTypeSchema.optional().nullable(),
  priority: annotationPrioritySchema.optional().nullable(),
  pageUrl: z.string().url("Invalid URL").optional().nullable(),
  pageTitle: z.string().max(255).optional().nullable(),
  screenshotOriginal: z.string().url("Invalid URL").optional().nullable(),
  screenshotAnnotated: z.string().url("Invalid URL").optional().nullable(),
  canvasData: z.any().optional().nullable(),
});

// Type exports from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateAnnotationInput = z.infer<typeof createAnnotationSchema>;
export type UpdateAnnotationInput = z.infer<typeof updateAnnotationSchema>;
