import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import * as invitationService from "../services/invitations";

export const invitationRoutes = new Hono();

// GET /invitations/:token - Verify and get invitation details (public endpoint)
invitationRoutes.get("/:token", async (c) => {
  const token = c.req.param("token");
  const details = await invitationService.verifyInvitationToken(token);
  return c.json(details);
});

// POST /invitations/:token/accept - Accept invitation (works for both authenticated and unauthenticated users)
invitationRoutes.post("/:token/accept", async (c) => {
  const token = c.req.param("token");

  // Try to get userId from auth middleware if available
  let userId: string | undefined;
  try {
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      // User is authenticated, get their ID
      const sessionToken = authHeader.substring(7);
      const { validateSession } = await import("../services/auth");
      const session = await validateSession(sessionToken);
      if (session) {
        userId = session.userId;
      }
    }
  } catch (error) {
    // Not authenticated, that's okay
  }

  // Get full name from request body if provided (for new users)
  const body = await c.req.json().catch(() => ({}));
  const fullName = body.fullName as string | undefined;

  const result = await invitationService.acceptInvitation(
    token,
    userId,
    fullName,
  );

  // If a session token was created, set it as a cookie
  if (result.sessionToken) {
    c.header(
      "Set-Cookie",
      `session=${result.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`,
    );
  }

  return c.json(result);
});

// POST /invitations/:token/decline - Decline invitation (public endpoint)
invitationRoutes.post("/:token/decline", async (c) => {
  const token = c.req.param("token");
  await invitationService.declineInvitation(token);
  return c.body(null, 204);
});
