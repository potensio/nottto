import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

function getErrorCode(status: number): string {
  const codes: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    500: "INTERNAL_ERROR",
  };
  return codes[status] || "UNKNOWN_ERROR";
}

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }
  return details;
}

export function errorHandler(err: Error, c: Context): Response {
  // Handle HTTP exceptions (thrown by our code)
  if (err instanceof HTTPException) {
    const response: ErrorResponse = {
      error: {
        code: getErrorCode(err.status),
        message: err.message,
      },
    };
    return c.json(response, err.status);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: formatZodErrors(err),
      },
    };
    return c.json(response, 400);
  }

  // Log internal errors but don't expose details
  console.error("Internal error:", err);

  const response: ErrorResponse = {
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  };
  return c.json(response, 500);
}
