/**
 * Webhook Integration Types
 * Types for project-level webhook integration configuration
 */

/**
 * A single header entry with unique ID for React key management
 */
export interface HeaderEntry {
  id: string;
  key: string;
  value: string;
}

/**
 * Result of a webhook test request
 */
export interface TestResult {
  success: boolean;
  statusCode?: number;
  message: string;
}

/**
 * Full webhook integration configuration stored in database
 */
export interface WebhookIntegration {
  id: string;
  projectId: string;
  url: string;
  headers: Record<string, string>;
  bodyTemplate: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input data for creating/updating a webhook integration
 */
export interface WebhookIntegrationInput {
  url: string;
  headers: Record<string, string>;
  bodyTemplate: string;
  enabled: boolean;
}

/**
 * Annotation data structure used for variable substitution
 */
export interface AnnotationData {
  title: string;
  description?: string;
  url?: string;
  screenshot_url?: string;
  page_title?: string;
  priority?: "low" | "medium" | "high";
  type?: string;
  created_by: {
    name: string;
    email: string;
  };
  project: {
    name: string;
  };
  created_at: string;
}

/**
 * Variable information for the reference panel
 */
export interface VariableInfo {
  name: string;
  description: string;
  example: string;
}

/**
 * Available template variables with their descriptions and examples
 */
export const TEMPLATE_VARIABLES: VariableInfo[] = [
  {
    name: "<title>",
    description: "Annotation title",
    example: "Button misaligned on mobile",
  },
  {
    name: "<description>",
    description: "Annotation description",
    example: "The submit button overlaps...",
  },
  {
    name: "<url>",
    description: "Page URL where annotation was created",
    example: "https://example.com/checkout",
  },
  {
    name: "<screenshot_url>",
    description: "URL to the annotated screenshot",
    example: "https://cdn.app.com/...",
  },
  {
    name: "<page_title>",
    description: "Title of the page",
    example: "Checkout - Example Store",
  },
  { name: "<priority>", description: "Priority level", example: "high" },
  { name: "<type>", description: "Annotation type", example: "bug" },
  {
    name: "<created_by.name>",
    description: "Name of the creator",
    example: "John Doe",
  },
  {
    name: "<created_by.email>",
    description: "Email of the creator",
    example: "john@agency.com",
  },
  {
    name: "<project.name>",
    description: "Project name",
    example: "Client ABC Website",
  },
  {
    name: "<created_at>",
    description: "ISO timestamp of creation",
    example: "2026-01-12T14:30:00Z",
  },
];
