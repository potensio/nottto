import { getEnabledIntegration, type WebhookIntegration } from "./integrations";

export interface AnnotationData {
  id: string;
  title: string;
  description?: string | null;
  pageUrl?: string | null;
  pageTitle?: string | null;
  screenshotAnnotated?: string | null;
  priority?: string | null;
  type?: string | null;
  createdBy: {
    name: string;
    email: string;
  };
  project: {
    name: string;
  };
  createdAt: string;
}

/**
 * Substitute template variables with actual annotation data
 */
export function substituteVariables(
  template: string,
  data: AnnotationData
): string {
  const variableMap: Record<string, string> = {
    title: "title",
    description: "description",
    url: "pageUrl",
    screenshot_url: "screenshotAnnotated",
    page_title: "pageTitle",
    priority: "priority",
    type: "type",
    "created_by.name": "createdBy.name",
    "created_by.email": "createdBy.email",
    "project.name": "project.name",
    created_at: "createdAt",
  };

  return template.replace(/<([a-zA-Z_][a-zA-Z0-9_.]*)>/g, (match, variable) => {
    const trimmedVar = variable.trim();
    const path = variableMap[trimmedVar];

    if (path) {
      const value = getNestedValue(
        data as unknown as Record<string, unknown>,
        path
      );
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
 * Execute webhook for an annotation
 */
export async function executeWebhook(
  integration: WebhookIntegration,
  annotationData: AnnotationData
): Promise<void> {
  // Prepare body
  let body: string;
  if (integration.bodyTemplate) {
    // Escape newlines inside string values before substitution
    const normalizedTemplate = escapeNewlinesInStrings(
      integration.bodyTemplate
    );
    body = substituteVariables(normalizedTemplate, annotationData);
  } else {
    // Default payload if no template
    body = JSON.stringify({
      event: "annotation.created",
      data: {
        id: annotationData.id,
        title: annotationData.title,
        description: annotationData.description,
        url: annotationData.pageUrl,
        screenshot_url: annotationData.screenshotAnnotated,
        page_title: annotationData.pageTitle,
        priority: annotationData.priority,
        type: annotationData.type,
        created_by: annotationData.createdBy,
        project: annotationData.project,
        created_at: annotationData.createdAt,
      },
    });
  }

  // Prepare headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...integration.headers,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(integration.url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `Webhook failed for project ${integration.projectId}: Status ${response.status}`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `Webhook failed for project ${integration.projectId}: ${error.message}`
      );
    } else {
      console.error(
        `Webhook failed for project ${integration.projectId}: Unknown error`
      );
    }
  }
}

/**
 * Fire webhook if enabled for a project
 * This is the main entry point called after annotation creation
 */
export async function fireWebhookIfEnabled(
  projectId: string,
  annotationData: AnnotationData
): Promise<void> {
  const integration = await getEnabledIntegration(projectId);

  if (!integration) {
    return; // No enabled integration, nothing to do
  }

  await executeWebhook(integration, annotationData);
}
