import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { setCookie, deleteCookie } from "hono/cookie";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  magicLinkRequestSchema,
  magicLinkVerifySchema,
  updateUserProfileSchema,
} from "@nottto/shared";
import { authMiddleware } from "../middleware/auth";
import * as authService from "../services/auth";
import * as magicLinkService from "../services/magic-link";

export const authRoutes = new Hono();

// Helper to set session cookie
function setSessionCookie(c: any, sessionToken: string) {
  setCookie(c, "session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

// Helper to clear session cookie
function clearSessionCookie(c: any) {
  deleteCookie(c, "session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
  });
}

// POST /auth/magic-link - Request magic link
authRoutes.post(
  "/magic-link",
  zValidator("json", magicLinkRequestSchema),
  async (c) => {
    const { email, isRegister, name, extensionSession } = c.req.valid("json");
    const result = await magicLinkService.requestMagicLink(
      email,
      isRegister,
      name,
      extensionSession
    );
    return c.json(result);
  }
);

// POST /auth/verify-magic-link - Verify magic link token
authRoutes.post(
  "/verify-magic-link",
  zValidator("json", magicLinkVerifySchema),
  async (c) => {
    const { token } = c.req.valid("json");
    const result = await magicLinkService.verifyMagicLink(token);

    // Create session and set cookie
    const userAgent = c.req.header("user-agent");
    const sessionToken = await authService.createSession(
      result.user.id,
      userAgent
    );
    setSessionCookie(c, sessionToken);

    return c.json(result);
  }
);

// POST /auth/register - Create account (legacy, kept for compatibility)
authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");
  const result = await authService.register(email, password, name);

  // Create session and set cookie
  const userAgent = c.req.header("user-agent");
  const sessionToken = await authService.createSession(
    result.user.id,
    userAgent
  );
  setSessionCookie(c, sessionToken);

  // Return user data (tokens for backward compatibility)
  return c.json(result, 201);
});

// POST /auth/login - Login (legacy, kept for compatibility)
authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const result = await authService.login(email, password);

  // Create session and set cookie
  const userAgent = c.req.header("user-agent");
  const sessionToken = await authService.createSession(
    result.user.id,
    userAgent
  );
  setSessionCookie(c, sessionToken);

  // Return user data (tokens for backward compatibility)
  return c.json(result);
});

// POST /auth/refresh - Refresh token
authRoutes.post("/refresh", zValidator("json", refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid("json");
  const result = await authService.refresh(refreshToken);
  return c.json(result);
});

// GET /auth/me - Get current user (protected)
authRoutes.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const user = await authService.getUser(userId);
  return c.json({ user });
});

// PATCH /auth/me - Update current user profile (protected)
authRoutes.patch(
  "/me",
  authMiddleware,
  zValidator("json", updateUserProfileSchema),
  async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");
    const user = await authService.updateUser(userId, data);
    return c.json({ user });
  }
);

// DELETE /auth/me - Delete current user account (protected)
authRoutes.delete("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");
  await authService.deleteUser(userId);
  clearSessionCookie(c);
  return c.json({ success: true, message: "Account deleted successfully" });
});

// POST /auth/logout - Logout (clear session)
authRoutes.post("/logout", authMiddleware, async (c) => {
  const userId = c.get("userId");

  // Delete all user sessions
  await authService.deleteAllUserSessions(userId);

  // Clear cookie
  clearSessionCookie(c);

  return c.json({ success: true, message: "Logged out successfully" });
});
