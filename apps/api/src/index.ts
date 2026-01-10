import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { workspaceRoutes } from "./routes/workspaces";
import { projectRoutes } from "./routes/projects";
import { annotationRoutes } from "./routes/annotations";
import { uploadRoutes } from "./routes/upload";
import { errorHandler } from "./middleware/error-handler";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://app.nottto.com"],
    credentials: true,
  })
);

// Error handler
app.onError(errorHandler);

// Health check
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

export default app;

// Start server when running directly
const port = process.env.PORT || 3001;
console.log(`🚀 Nottto API running on http://localhost:${port}`);

export { app };
