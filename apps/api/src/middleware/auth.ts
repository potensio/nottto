import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCookie } from "hono/cookie";
import { jwtVerify } from "jose";
import { validateSession } from "../services/auth";

export interface AuthContext {
  userId: string;
  userEmail: string;
}

declare module "hono" {
  interface ContextVariableMap {
    userId: string;
    userEmail: string;
  }
}

export async function authMiddleware(
  c: Context,
  next: Next
): Promise<void | Response> {
  // Try 1: Check for session cookie (web app)
  const sessionCookie = getCookie(c, "session");

  if (sessionCookie) {
    const session = await validateSession(sessionCookie);
    if (session) {
      c.set("userId", session.userId);
      c.set("userEmail", session.userEmail);
      await next();
      return;
    }
  }

  // Try 2: Check for Bearer token (extension or legacy)
  const authHeader = c.req.header("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      if (!payload.sub || !payload.email) {
        throw new HTTPException(401, { message: "Invalid token payload" });
      }

      c.set("userId", payload.sub as string);
      c.set("userEmail", payload.email as string);

      await next();
      return;
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(401, { message: "Invalid or expired token" });
    }
  }

  // No valid authentication found
  throw new HTTPException(401, {
    message: "Missing or invalid authentication",
  });
}
