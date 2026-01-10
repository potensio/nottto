import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { jwtVerify } from "jose";

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
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, {
      message: "Missing or invalid authorization header",
    });
  }

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
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }
}
