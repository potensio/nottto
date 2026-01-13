import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import * as extensionAuthService from "../services/extension-auth";

export const extensionAuthRoutes = new Hono();

// POST /extension-auth/session - Create a new extension auth session
// Called by the extension when user clicks "Sign in"
extensionAuthRoutes.post("/session", async (c) => {
  const result = await extensionAuthService.createAuthSession();
  return c.json(result);
});

// GET /extension-auth/session/:sessionId - Poll for auth completion
// Called by the extension to check if user has authenticated
extensionAuthRoutes.get("/session/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");
  const result = await extensionAuthService.getAuthSession(sessionId);
  return c.json(result);
});

// POST /extension-auth/session/:sessionId/complete - Complete auth session
// Called by the web app after successful login to link tokens to session
const completeSessionSchema = z.object({
  // No body needed - we get user from auth middleware
});

extensionAuthRoutes.post(
  "/session/:sessionId/complete",
  authMiddleware,
  zValidator("json", completeSessionSchema),
  async (c) => {
    const sessionId = c.req.param("sessionId");
    const userId = c.get("userId");
    const result = await extensionAuthService.completeAuthSession(
      sessionId,
      userId
    );
    return c.json(result);
  }
);

// DELETE /extension-auth/session/:sessionId - Cancel/cleanup session
extensionAuthRoutes.delete("/session/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");
  await extensionAuthService.deleteAuthSession(sessionId);
  return c.json({ success: true });
});
