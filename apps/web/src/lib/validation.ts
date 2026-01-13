import type { AnnotationData } from "./types/integration";

/**
 * Email validation regex pattern.
 * Matches most common email formats while being permissive enough
 * for edge cases like plus addressing (user+tag@domain.com).
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates an email address format.
 * Returns validation result with error message if invalid.
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: "Email is required" };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length > 255) {
    return { isValid: false, error: "Email is too long" };
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true };
}

/**
 * Checks if a string is a valid email format.
 * Simple boolean check without error message.
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email).isValid;
}

/**
 * Validates a webhook URL.
 * Must be a valid HTTPS URL.
 */
export function validateWebhookUrl(url: string): ValidationResult {
  if (!url || url.trim().length === 0) {
    return { isValid: false, error: "Webhook URL is required" };
  }

  const trimmedUrl = url.trim();

  // Check if it starts with https://
  if (!trimmedUrl.startsWith("https://")) {
    return { isValid: false, error: "Please enter a valid HTTPS URL" };
  }

  // Try to parse as URL to validate structure
  try {
    const parsed = new URL(trimmedUrl);
    if (parsed.protocol !== "https:") {
      return { isValid: false, error: "Please enter a valid HTTPS URL" };
    }
  } catch {
    return { isValid: false, error: "Please enter a valid HTTPS URL" };
  }

  return { isValid: true };
}

/**
 * Checks if a string is a valid HTTPS webhook URL.
 * Simple boolean check without error message.
 */
export function isValidWebhookUrl(url: string): boolean {
  return validateWebhookUrl(url).isValid;
}

/**
 * Validates a JSON body template.
 * Handles <variable> placeholders by temporarily replacing them before parsing.
 * Also handles literal newlines inside string values by escaping them.
 */
export function validateJsonTemplate(template: string): ValidationResult {
  if (!template || template.trim().length === 0) {
    // Empty template is valid (optional field)
    return { isValid: true };
  }

  const trimmedTemplate = template.trim();

  // Replace <variable> placeholders with valid JSON strings for parsing
  // This allows us to validate the JSON structure while ignoring the placeholders
  const placeholderRegex = /<[a-zA-Z_][a-zA-Z0-9_.]*>/g;
  let sanitizedTemplate = trimmedTemplate.replace(
    placeholderRegex,
    "__PLACEHOLDER__"
  );

  // Escape literal newlines only inside JSON string values
  // This regex matches content between quotes and escapes newlines within
  sanitizedTemplate = escapeNewlinesInStrings(sanitizedTemplate);

  try {
    JSON.parse(sanitizedTemplate);
    return { isValid: true };
  } catch (e) {
    const error = e as SyntaxError;
    return {
      isValid: false,
      error: `Invalid JSON: ${error.message}`,
    };
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
      // Escape literal newlines inside strings
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
 * Checks if a string is valid JSON (with placeholder support).
 * Simple boolean check without error message.
 */
export function isValidJsonTemplate(template: string): boolean {
  return validateJsonTemplate(template).isValid;
}

/**
 * Gets a nested value from an object using dot notation.
 * e.g., getNestedValue(obj, "created_by.name") returns obj.created_by.name
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let value: unknown = obj;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return "";
    }
  }

  return value !== undefined && value !== null ? String(value) : "";
}

/**
 * Substitutes template variables in a body template with actual annotation data.
 * Supports variables like <title>, <description>, <created_by.name>, etc.
 */
export function substituteVariables(
  template: string,
  data: AnnotationData
): string {
  if (!template) return template;

  // Map of variable names to their paths in the data object
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
      return getNestedValue(data as unknown as Record<string, unknown>, path);
    }

    // Return original placeholder if variable is not recognized
    return match;
  });
}
