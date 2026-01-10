import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { registerSchema, loginSchema, refreshSchema } from "@nottto/shared";
import { authMiddleware } from "../middleware/auth";
import * as authService from "../services/auth";

export const authRoutes = new Hono();

// POST /auth/register - Create account
authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");
  const result = await authService.register(email, password, name);
  return c.json(result, 201);
});

// POST /auth/login - Login
authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const result = await authService.login(email, password);
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
