import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { workspaceRoutes } from "./routes/workspaces";
import { projectRoutes } from "./routes/projects";
import { annotationRoutes } from "./routes/annotations";
import { uploadRoutes } from "./routes/upload";
import { errorHandler } from "./middleware/error-handler";

// Create Hono app with /api base path
const app = new Hono().basePath("/api");

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "https://app.nottto.com",
      "chrome-extension://*",
    ],
    credentials: true,
  })
);

// Error handler
app.onError(errorHandler);

// Health check at /api
app.get("/", (c) => c.json({ status: "ok", service: "nottto-api" }));

// Routes
app.route("/auth", authRoutes);
app.route("/workspaces", workspaceRoutes);
app.route("/projects", projectRoutes);
app.route("/annotations", annotationRoutes);
app.route("/upload", uploadRoutes);

// 404 handler
app.notFound((c) =>
  c.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404)
);

// Vercel serverless exports
const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;

export default app;
