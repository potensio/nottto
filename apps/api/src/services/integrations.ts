import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../db";
import { webhookIntegrations } from "@notto/shared/db";
import { checkProjectAccess } from "./projects";

export interface WebhookIntegration {
  id: string;
  projectId: string;
  url: string;
  headers: Record<string, string>;
  bodyTemplate: string;
  enabled: boolean;
  locked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookIntegrationInput {
  url: string;
  headers: Record<string, string>;
  bodyTemplate: string;
  enabled: boolean;
  locked: boolean;
}

export interface TestResult {
  success: boolean;
  statusCode?: number;
  message: string;
}

/**
 * Validates a webhook URL (must be HTTPS)
 */
export function validateWebhookUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: "Webhook URL is required" };
  }

  const trimmedUrl = url.trim();

  if (!trimmedUrl.startsWith("https://")) {
    return { valid: false, error: "URL must be a valid HTTPS URL" };
  }

  try {
    const parsed = new URL(trimmedUrl);
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "URL must be a valid HTTPS URL" };
    }
  } catch {
    return { valid: false, error: "URL must be a valid HTTPS URL" };
  }

  return { valid: true };
}

/**
 * Validates a JSON body template (with placeholder support)
 */
export function validateJsonTemplate(template: string): {
  valid: boolean;
  error?: string;
} {
  if (!template || template.trim().length === 0) {
    return { valid: true }; // Empty template is valid
  }

  const trimmedTemplate = template.trim();

  // Replace <variable> placeholders with valid strings for parsing
  const placeholderRegex = /<[a-zA-Z_][a-zA-Z0-9_.]*>/g;
  let sanitizedTemplate = trimmedTemplate.replace(
    placeholderRegex,
    "__PLACEHOLDER__",
  );

  // Escape literal newlines only inside JSON string values
  sanitizedTemplate = escapeNewlinesInStrings(sanitizedTemplate);

  try {
    JSON.parse(sanitizedTemplate);
    return { valid: true };
  } catch (e) {
    const error = e as SyntaxError;
    return { valid: false, error: `Invalid JSON: ${error.message}` };
  }
}

/**
 * Escapes literal newlines only inside JSON string values.
 * Preserves newlines outside of strings (for pretty-printed JSON).
 */
function escapeNewlinesInStrings(json: string): string {
  let result = "";
  let inString = false;
  let escape = false;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];

    if (escape) {
      result += char;
      escape = false;
      continue;
    }

    if (char === "\\") {
      result += char;
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString) {
      if (char === "\n") {
        result += "\\n";
      } else if (char === "\r") {
        result += "\\r";
      } else if (char === "\t") {
        result += "\\t";
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Get webhook integration for a project
 */
export async function get(
  projectId: string,
  userId: string,
): Promise<WebhookIntegration | null> {
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    throw new HTTPException(403, { message: "Access denied to this project" });
  }

  const [integration] = await db
    .select()
    .from(webhookIntegrations)
    .where(eq(webhookIntegrations.projectId, projectId))
    .limit(1);

  if (!integration) {
    return null;
  }

  return {
    id: integration.id,
    projectId: integration.projectId,
    url: integration.url,
    headers: (integration.headers as Record<string, string>) || {},
    bodyTemplate: integration.bodyTemplate,
    enabled: integration.enabled,
    locked: integration.locked,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
  };
}

/**
 * Create or update webhook integration for a project
 */
export async function upsert(
  projectId: string,
  userId: string,
  data: WebhookIntegrationInput,
): Promise<WebhookIntegration> {
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    throw new HTTPException(403, { message: "Access denied to this project" });
  }

  // Validate URL
  const urlValidation = validateWebhookUrl(data.url);
  if (!urlValidation.valid) {
    throw new HTTPException(400, { message: urlValidation.error });
  }

  // Validate body template
  const templateValidation = validateJsonTemplate(data.bodyTemplate);
  if (!templateValidation.valid) {
    throw new HTTPException(400, { message: templateValidation.error });
  }

  // Check if integration exists and is locked
  const [existing] = await db
    .select()
    .from(webhookIntegrations)
    .where(eq(webhookIntegrations.projectId, projectId))
    .limit(1);

  if (existing) {
    // If locked, only allow changing the lock state
    if (existing.locked) {
      const isOnlyLockChange =
        data.url === existing.url &&
        JSON.stringify(data.headers) === JSON.stringify(existing.headers) &&
        data.bodyTemplate === existing.bodyTemplate &&
        data.enabled === existing.enabled;

      if (!isOnlyLockChange) {
        throw new HTTPException(403, {
          message: "Integration is locked and cannot be modified",
        });
      }
    }

    // Update existing
    const [updated] = await db
      .update(webhookIntegrations)
      .set({
        url: data.url.trim(),
        headers: data.headers,
        bodyTemplate: data.bodyTemplate,
        enabled: data.enabled,
        locked: data.locked,
        updatedAt: new Date(),
      })
      .where(eq(webhookIntegrations.projectId, projectId))
      .returning();

    return {
      id: updated.id,
      projectId: updated.projectId,
      url: updated.url,
      headers: (updated.headers as Record<string, string>) || {},
      bodyTemplate: updated.bodyTemplate,
      enabled: updated.enabled,
      locked: updated.locked,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  // Create new
  const [created] = await db
    .insert(webhookIntegrations)
    .values({
      projectId,
      url: data.url.trim(),
      headers: data.headers,
      bodyTemplate: data.bodyTemplate,
      enabled: data.enabled,
      locked: data.locked,
    })
    .returning();

  return {
    id: created.id,
    projectId: created.projectId,
    url: created.url,
    headers: (created.headers as Record<string, string>) || {},
    bodyTemplate: created.bodyTemplate,
    enabled: created.enabled,
    locked: created.locked,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
}

/**
 * Remove webhook integration for a project
 */
export async function remove(projectId: string, userId: string): Promise<void> {
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    throw new HTTPException(403, { message: "Access denied to this project" });
  }

  const [existing] = await db
    .select()
    .from(webhookIntegrations)
    .where(eq(webhookIntegrations.projectId, projectId))
    .limit(1);

  if (!existing) {
    throw new HTTPException(404, { message: "Integration not found" });
  }

  if (existing.locked) {
    throw new HTTPException(403, {
      message: "Integration is locked and cannot be deleted",
    });
  }

  await db
    .delete(webhookIntegrations)
    .where(eq(webhookIntegrations.projectId, projectId));
}

/**
 * Test webhook integration by sending a sample payload
 */
export async function test(
  projectId: string,
  userId: string,
  data: WebhookIntegrationInput,
): Promise<TestResult> {
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    throw new HTTPException(403, { message: "Access denied to this project" });
  }

  // Validate URL
  const urlValidation = validateWebhookUrl(data.url);
  if (!urlValidation.valid) {
    throw new HTTPException(400, { message: urlValidation.error });
  }

  // Validate body template
  const templateValidation = validateJsonTemplate(data.bodyTemplate);
  if (!templateValidation.valid) {
    throw new HTTPException(400, { message: templateValidation.error });
  }

  // Sample annotation data for testing
  const sampleData = {
    title: "Sample Annotation",
    description: "This is a test webhook payload",
    url: "https://example.com/page",
    screenshot_url: "https://cdn.example.com/screenshot.png",
    page_title: "Example Page",
    priority: "medium",
    type: "bug",
    created_by: {
      name: "Test User",
      email: "test@example.com",
    },
    project: {
      name: "Test Project",
    },
    created_at: new Date().toISOString(),
  };

  // Substitute variables in body template
  let body = data.bodyTemplate || JSON.stringify(sampleData, null, 2);
  if (data.bodyTemplate) {
    // Escape newlines inside string values before substitution
    const normalizedTemplate = escapeNewlinesInStrings(data.bodyTemplate);
    body = substituteVariables(normalizedTemplate, sampleData);
  }

  // Prepare headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...data.headers,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(data.url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        success: true,
        statusCode: response.status,
        message: "Test webhook sent successfully!",
      };
    } else {
      return {
        success: false,
        statusCode: response.status,
        message: `Request failed with status ${response.status}`,
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          message: "Request timed out after 10 seconds",
        };
      }
      return {
        success: false,
        message: `Request failed: ${error.message}`,
      };
    }
    return {
      success: false,
      message: "Request failed with unknown error",
    };
  }
}

/**
 * Substitute template variables with actual data
 */
function substituteVariables(
  template: string,
  data: Record<string, unknown>,
): string {
  const variableMap: Record<string, string> = {
    title: "title",
    description: "description",
    url: "url",
    screenshot_url: "screenshot_url",
    page_title: "page_title",
    priority: "priority",
    type: "type",
    "created_by.name": "created_by.name",
    "created_by.email": "created_by.email",
    "project.name": "project.name",
    created_at: "created_at",
  };

  return template.replace(/<([a-zA-Z_][a-zA-Z0-9_.]*)>/g, (match, variable) => {
    const trimmedVar = variable.trim();
    const path = variableMap[trimmedVar];

    if (path) {
      const value = getNestedValue(data, path);
      return value !== undefined && value !== null ? String(value) : "";
    }

    return match;
  });
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let value: unknown = obj;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * Get enabled integration for a project (used by webhook executor)
 */
export async function getEnabledIntegration(
  projectId: string,
): Promise<WebhookIntegration | null> {
  const [integration] = await db
    .select()
    .from(webhookIntegrations)
    .where(eq(webhookIntegrations.projectId, projectId))
    .limit(1);

  if (!integration || !integration.enabled) {
    return null;
  }

  return {
    id: integration.id,
    projectId: integration.projectId,
    url: integration.url,
    headers: (integration.headers as Record<string, string>) || {},
    bodyTemplate: integration.bodyTemplate,
    enabled: integration.enabled,
    locked: integration.locked,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
  };
}
