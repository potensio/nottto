var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/index.ts
import { Hono as Hono6 } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// src/routes/auth.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

// ../../packages/shared/src/schemas/index.ts
import { z } from "zod";
var registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(255).optional()
});
var loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});
var refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
});
var createWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(255)
});
var updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens").optional()
});
var createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1e3).optional()
});
var updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens").optional(),
  description: z.string().max(1e3).optional()
});
var annotationTypeSchema = z.enum(["bug", "improvement", "question"]);
var annotationPrioritySchema = z.enum([
  "urgent",
  "high",
  "medium",
  "low"
]);
var createAnnotationSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(5e3).optional(),
  type: annotationTypeSchema.optional(),
  priority: annotationPrioritySchema.optional(),
  pageUrl: z.string().url("Invalid URL").optional(),
  pageTitle: z.string().max(255).optional(),
  screenshotOriginal: z.string().url("Invalid URL").optional(),
  screenshotAnnotated: z.string().url("Invalid URL").optional(),
  canvasData: z.any().optional()
});
var updateAnnotationSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5e3).optional(),
  type: annotationTypeSchema.optional().nullable(),
  priority: annotationPrioritySchema.optional().nullable(),
  pageUrl: z.string().url("Invalid URL").optional().nullable(),
  pageTitle: z.string().max(255).optional().nullable(),
  screenshotOriginal: z.string().url("Invalid URL").optional().nullable(),
  screenshotAnnotated: z.string().url("Invalid URL").optional().nullable(),
  canvasData: z.any().optional().nullable()
});

// src/middleware/auth.ts
import { HTTPException } from "hono/http-exception";
import { jwtVerify } from "jose";
async function authMiddleware(c, next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, {
      message: "Missing or invalid authorization header"
    });
  }
  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || !payload.email) {
      throw new HTTPException(401, { message: "Invalid token payload" });
    }
    c.set("userId", payload.sub);
    c.set("userEmail", payload.email);
    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }
}

// src/services/auth.ts
import { eq } from "drizzle-orm";
import { HTTPException as HTTPException2 } from "hono/http-exception";

// ../../packages/shared/src/db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// ../../packages/shared/src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  annotations: () => annotations,
  annotationsRelations: () => annotationsRelations,
  projects: () => projects,
  projectsRelations: () => projectsRelations,
  users: () => users,
  usersRelations: () => usersRelations,
  workspaceMembers: () => workspaceMembers,
  workspaceMembersRelations: () => workspaceMembersRelations,
  workspaces: () => workspaces,
  workspacesRelations: () => workspacesRelations
});
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  unique
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    role: varchar("role", { length: 50 }).default("member").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [
    unique("workspace_user_unique").on(table.workspaceId, table.userId)
  ]
);
var projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
  },
  (table) => [
    unique("workspace_project_slug_unique").on(table.workspaceId, table.slug)
  ]
);
var annotations = pgTable("annotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }),
  priority: varchar("priority", { length: 50 }),
  pageUrl: text("page_url"),
  pageTitle: varchar("page_title", { length: 255 }),
  screenshotOriginal: text("screenshot_original"),
  screenshotAnnotated: text("screenshot_annotated"),
  canvasData: jsonb("canvas_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  workspaceMembers: many(workspaceMembers),
  annotations: many(annotations)
}));
var workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id]
  }),
  members: many(workspaceMembers),
  projects: many(projects)
}));
var workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id]
    }),
    user: one(users, {
      fields: [workspaceMembers.userId],
      references: [users.id]
    })
  })
);
var projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id]
  }),
  annotations: many(annotations)
}));
var annotationsRelations = relations(annotations, ({ one }) => ({
  project: one(projects, {
    fields: [annotations.projectId],
    references: [projects.id]
  }),
  user: one(users, {
    fields: [annotations.userId],
    references: [users.id]
  })
}));

// ../../packages/shared/src/db/index.ts
function createDb(databaseUrl) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema: schema_exports });
}

// src/db.ts
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}
var db = createDb(process.env.DATABASE_URL);

// src/utils/auth.ts
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify as jwtVerify2 } from "jose";
var SALT_ROUNDS = 10;
var ACCESS_TOKEN_EXPIRY = "15m";
var REFRESH_TOKEN_EXPIRY = "7d";
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
async function generateAccessToken(payload) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  return new SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(ACCESS_TOKEN_EXPIRY).sign(secret);
}
async function generateRefreshToken(payload) {
  const secret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);
  return new SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(REFRESH_TOKEN_EXPIRY).sign(secret);
}
async function generateTokens(payload) {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload)
  ]);
  return { accessToken, refreshToken };
}
async function verifyRefreshToken(token) {
  const secret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);
  const { payload } = await jwtVerify2(token, secret);
  return {
    sub: payload.sub,
    email: payload.email
  };
}

// src/utils/slug.ts
function generateSlug(name) {
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
function generateUniqueSlug(name, existingSlugs) {
  const baseSlug = generateSlug(name);
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  return uniqueSlug;
}

// src/services/auth.ts
async function register(email, password, name) {
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser.length > 0) {
    throw new HTTPException2(409, { message: "Email already registered" });
  }
  const passwordHash = await hashPassword(password);
  const [newUser] = await db.insert(users).values({
    email,
    passwordHash,
    name: name || null
  }).returning();
  const workspaceSlug = generateSlug("My Workspace");
  const [newWorkspace] = await db.insert(workspaces).values({
    name: "My Workspace",
    slug: workspaceSlug,
    ownerId: newUser.id
  }).returning();
  await db.insert(workspaceMembers).values({
    workspaceId: newWorkspace.id,
    userId: newUser.id,
    role: "owner"
  });
  const projectSlug = generateSlug("Default Project");
  await db.insert(projects).values({
    workspaceId: newWorkspace.id,
    name: "Default Project",
    slug: projectSlug,
    description: "Your first project"
  });
  const tokens = await generateTokens({
    sub: newUser.id,
    email: newUser.email
  });
  const user = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt
  };
  return { user, tokens };
}
async function login(email, password) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    throw new HTTPException2(401, { message: "Invalid email or password" });
  }
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new HTTPException2(401, { message: "Invalid email or password" });
  }
  const tokens = await generateTokens({
    sub: user.id,
    email: user.email
  });
  const userResponse = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
  return { user: userResponse, tokens };
}
async function refresh(refreshToken) {
  try {
    const payload = await verifyRefreshToken(refreshToken);
    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user) {
      throw new HTTPException2(401, { message: "User not found" });
    }
    const accessToken = await generateAccessToken({
      sub: user.id,
      email: user.email
    });
    return { accessToken };
  } catch (error) {
    if (error instanceof HTTPException2) {
      throw error;
    }
    throw new HTTPException2(401, {
      message: "Invalid or expired refresh token"
    });
  }
}
async function getUser(userId) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw new HTTPException2(404, { message: "User not found" });
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

// src/routes/auth.ts
var authRoutes = new Hono();
authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");
  const result = await register(email, password, name);
  return c.json(result, 201);
});
authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const result = await login(email, password);
  return c.json(result);
});
authRoutes.post("/refresh", zValidator("json", refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid("json");
  const result = await refresh(refreshToken);
  return c.json(result);
});
authRoutes.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const user = await getUser(userId);
  return c.json({ user });
});

// src/routes/workspaces.ts
import { Hono as Hono2 } from "hono";
import { zValidator as zValidator2 } from "@hono/zod-validator";

// src/services/workspaces.ts
import { eq as eq2, and } from "drizzle-orm";
import { HTTPException as HTTPException3 } from "hono/http-exception";
async function list(userId) {
  const ownedWorkspaces = await db.select().from(workspaces).where(eq2(workspaces.ownerId, userId));
  const memberWorkspaces = await db.select({
    id: workspaces.id,
    name: workspaces.name,
    slug: workspaces.slug,
    ownerId: workspaces.ownerId,
    createdAt: workspaces.createdAt,
    updatedAt: workspaces.updatedAt
  }).from(workspaceMembers).innerJoin(workspaces, eq2(workspaceMembers.workspaceId, workspaces.id)).where(eq2(workspaceMembers.userId, userId));
  const allWorkspaces = [...ownedWorkspaces];
  for (const ws of memberWorkspaces) {
    if (!allWorkspaces.find((w) => w.id === ws.id)) {
      allWorkspaces.push(ws);
    }
  }
  return allWorkspaces.map((ws) => ({
    id: ws.id,
    name: ws.name,
    slug: ws.slug,
    ownerId: ws.ownerId,
    createdAt: ws.createdAt,
    updatedAt: ws.updatedAt
  }));
}
async function create(userId, data) {
  const existingWorkspaces = await db.select({ slug: workspaces.slug }).from(workspaces);
  const existingSlugs = existingWorkspaces.map((w) => w.slug);
  const slug = generateUniqueSlug(data.name, existingSlugs);
  const [newWorkspace] = await db.insert(workspaces).values({
    name: data.name,
    slug,
    ownerId: userId
  }).returning();
  await db.insert(workspaceMembers).values({
    workspaceId: newWorkspace.id,
    userId,
    role: "owner"
  });
  return {
    id: newWorkspace.id,
    name: newWorkspace.name,
    slug: newWorkspace.slug,
    ownerId: newWorkspace.ownerId,
    createdAt: newWorkspace.createdAt,
    updatedAt: newWorkspace.updatedAt
  };
}
async function get(workspaceId, userId) {
  const [workspace] = await db.select().from(workspaces).where(eq2(workspaces.id, workspaceId)).limit(1);
  if (!workspace) {
    throw new HTTPException3(404, { message: "Workspace not found" });
  }
  const hasAccess = await checkAccess(workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException3(403, {
      message: "Access denied to this workspace"
    });
  }
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    ownerId: workspace.ownerId,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt
  };
}
async function update(workspaceId, userId, data) {
  const [workspace] = await db.select().from(workspaces).where(eq2(workspaces.id, workspaceId)).limit(1);
  if (!workspace) {
    throw new HTTPException3(404, { message: "Workspace not found" });
  }
  if (workspace.ownerId !== userId) {
    throw new HTTPException3(403, {
      message: "Only the owner can update this workspace"
    });
  }
  if (data.slug && data.slug !== workspace.slug) {
    const [existing] = await db.select().from(workspaces).where(eq2(workspaces.slug, data.slug)).limit(1);
    if (existing) {
      throw new HTTPException3(409, { message: "Slug already in use" });
    }
  }
  const [updated] = await db.update(workspaces).set({
    ...data,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq2(workspaces.id, workspaceId)).returning();
  return {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    ownerId: updated.ownerId,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  };
}
async function remove(workspaceId, userId) {
  const [workspace] = await db.select().from(workspaces).where(eq2(workspaces.id, workspaceId)).limit(1);
  if (!workspace) {
    throw new HTTPException3(404, { message: "Workspace not found" });
  }
  if (workspace.ownerId !== userId) {
    throw new HTTPException3(403, {
      message: "Only the owner can delete this workspace"
    });
  }
  await db.delete(workspaces).where(eq2(workspaces.id, workspaceId));
}
async function checkAccess(workspaceId, userId) {
  const [workspace] = await db.select().from(workspaces).where(and(eq2(workspaces.id, workspaceId), eq2(workspaces.ownerId, userId))).limit(1);
  if (workspace) {
    return true;
  }
  const [member] = await db.select().from(workspaceMembers).where(
    and(
      eq2(workspaceMembers.workspaceId, workspaceId),
      eq2(workspaceMembers.userId, userId)
    )
  ).limit(1);
  return !!member;
}

// src/services/projects.ts
import { eq as eq3, and as and2 } from "drizzle-orm";
import { HTTPException as HTTPException4 } from "hono/http-exception";
async function list2(workspaceId, userId) {
  const hasAccess = await checkAccess(workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException4(403, {
      message: "Access denied to this workspace"
    });
  }
  const projectList = await db.select().from(projects).where(eq3(projects.workspaceId, workspaceId));
  return projectList.map((p) => ({
    id: p.id,
    workspaceId: p.workspaceId,
    name: p.name,
    slug: p.slug,
    description: p.description,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }));
}
async function create2(workspaceId, userId, data) {
  const hasAccess = await checkAccess(workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException4(403, {
      message: "Access denied to this workspace"
    });
  }
  const existingProjects = await db.select({ slug: projects.slug }).from(projects).where(eq3(projects.workspaceId, workspaceId));
  const existingSlugs = existingProjects.map((p) => p.slug);
  const slug = generateUniqueSlug(data.name, existingSlugs);
  const [newProject] = await db.insert(projects).values({
    workspaceId,
    name: data.name,
    slug,
    description: data.description || null
  }).returning();
  return {
    id: newProject.id,
    workspaceId: newProject.workspaceId,
    name: newProject.name,
    slug: newProject.slug,
    description: newProject.description,
    createdAt: newProject.createdAt,
    updatedAt: newProject.updatedAt
  };
}
async function get2(projectId, userId) {
  const [project] = await db.select().from(projects).where(eq3(projects.id, projectId)).limit(1);
  if (!project) {
    throw new HTTPException4(404, { message: "Project not found" });
  }
  const hasAccess = await checkAccess(project.workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException4(403, { message: "Access denied to this project" });
  }
  return {
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
    slug: project.slug,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
}
async function update2(projectId, userId, data) {
  const [project] = await db.select().from(projects).where(eq3(projects.id, projectId)).limit(1);
  if (!project) {
    throw new HTTPException4(404, { message: "Project not found" });
  }
  const hasAccess = await checkAccess(project.workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException4(403, { message: "Access denied to this project" });
  }
  if (data.slug && data.slug !== project.slug) {
    const [existing] = await db.select().from(projects).where(
      and2(
        eq3(projects.workspaceId, project.workspaceId),
        eq3(projects.slug, data.slug)
      )
    ).limit(1);
    if (existing) {
      throw new HTTPException4(409, {
        message: "Slug already in use in this workspace"
      });
    }
  }
  const [updated] = await db.update(projects).set({
    ...data,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq3(projects.id, projectId)).returning();
  return {
    id: updated.id,
    workspaceId: updated.workspaceId,
    name: updated.name,
    slug: updated.slug,
    description: updated.description,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  };
}
async function remove2(projectId, userId) {
  const [project] = await db.select().from(projects).where(eq3(projects.id, projectId)).limit(1);
  if (!project) {
    throw new HTTPException4(404, { message: "Project not found" });
  }
  const hasAccess = await checkAccess(project.workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException4(403, { message: "Access denied to this project" });
  }
  await db.delete(projects).where(eq3(projects.id, projectId));
}
async function checkProjectAccess(projectId, userId) {
  const [project] = await db.select().from(projects).where(eq3(projects.id, projectId)).limit(1);
  if (!project) {
    return false;
  }
  return checkAccess(project.workspaceId, userId);
}

// src/routes/workspaces.ts
var workspaceRoutes = new Hono2();
workspaceRoutes.use("*", authMiddleware);
workspaceRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const workspaces3 = await list(userId);
  return c.json({ workspaces: workspaces3 });
});
workspaceRoutes.post(
  "/",
  zValidator2("json", createWorkspaceSchema),
  async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");
    const workspace = await create(userId, data);
    return c.json({ workspace }, 201);
  }
);
workspaceRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const workspaceId = c.req.param("id");
  const workspace = await get(workspaceId, userId);
  return c.json({ workspace });
});
workspaceRoutes.patch(
  "/:id",
  zValidator2("json", updateWorkspaceSchema),
  async (c) => {
    const userId = c.get("userId");
    const workspaceId = c.req.param("id");
    const data = c.req.valid("json");
    const workspace = await update(workspaceId, userId, data);
    return c.json({ workspace });
  }
);
workspaceRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const workspaceId = c.req.param("id");
  await remove(workspaceId, userId);
  return c.body(null, 204);
});
workspaceRoutes.get("/:workspaceId/projects", async (c) => {
  const userId = c.get("userId");
  const workspaceId = c.req.param("workspaceId");
  const projects4 = await list2(workspaceId, userId);
  return c.json({ projects: projects4 });
});
workspaceRoutes.post(
  "/:workspaceId/projects",
  zValidator2("json", createProjectSchema),
  async (c) => {
    const userId = c.get("userId");
    const workspaceId = c.req.param("workspaceId");
    const data = c.req.valid("json");
    const project = await create2(workspaceId, userId, data);
    return c.json({ project }, 201);
  }
);

// src/routes/projects.ts
import { Hono as Hono3 } from "hono";
import { zValidator as zValidator3 } from "@hono/zod-validator";

// src/services/annotations.ts
import { eq as eq4 } from "drizzle-orm";
import { HTTPException as HTTPException5 } from "hono/http-exception";
async function list3(projectId, userId) {
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    throw new HTTPException5(403, { message: "Access denied to this project" });
  }
  const annotationList = await db.select().from(annotations).where(eq4(annotations.projectId, projectId));
  return annotationList.map((a) => ({
    id: a.id,
    projectId: a.projectId,
    userId: a.userId,
    title: a.title,
    description: a.description,
    type: a.type,
    priority: a.priority,
    pageUrl: a.pageUrl,
    pageTitle: a.pageTitle,
    screenshotOriginal: a.screenshotOriginal,
    screenshotAnnotated: a.screenshotAnnotated,
    canvasData: a.canvasData,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }));
}
async function create3(projectId, userId, data) {
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    throw new HTTPException5(403, { message: "Access denied to this project" });
  }
  const [newAnnotation] = await db.insert(annotations).values({
    projectId,
    userId,
    title: data.title,
    description: data.description || null,
    type: data.type || null,
    priority: data.priority || null,
    pageUrl: data.pageUrl || null,
    pageTitle: data.pageTitle || null,
    screenshotOriginal: data.screenshotOriginal || null,
    screenshotAnnotated: data.screenshotAnnotated || null,
    canvasData: data.canvasData || null
  }).returning();
  return {
    id: newAnnotation.id,
    projectId: newAnnotation.projectId,
    userId: newAnnotation.userId,
    title: newAnnotation.title,
    description: newAnnotation.description,
    type: newAnnotation.type,
    priority: newAnnotation.priority,
    pageUrl: newAnnotation.pageUrl,
    pageTitle: newAnnotation.pageTitle,
    screenshotOriginal: newAnnotation.screenshotOriginal,
    screenshotAnnotated: newAnnotation.screenshotAnnotated,
    canvasData: newAnnotation.canvasData,
    createdAt: newAnnotation.createdAt,
    updatedAt: newAnnotation.updatedAt
  };
}
async function get3(annotationId, userId) {
  const [annotation] = await db.select().from(annotations).where(eq4(annotations.id, annotationId)).limit(1);
  if (!annotation) {
    throw new HTTPException5(404, { message: "Annotation not found" });
  }
  const hasAccess = await checkProjectAccess(annotation.projectId, userId);
  if (!hasAccess) {
    throw new HTTPException5(403, {
      message: "Access denied to this annotation"
    });
  }
  return {
    id: annotation.id,
    projectId: annotation.projectId,
    userId: annotation.userId,
    title: annotation.title,
    description: annotation.description,
    type: annotation.type,
    priority: annotation.priority,
    pageUrl: annotation.pageUrl,
    pageTitle: annotation.pageTitle,
    screenshotOriginal: annotation.screenshotOriginal,
    screenshotAnnotated: annotation.screenshotAnnotated,
    canvasData: annotation.canvasData,
    createdAt: annotation.createdAt,
    updatedAt: annotation.updatedAt
  };
}
async function update3(annotationId, userId, data) {
  const [annotation] = await db.select().from(annotations).where(eq4(annotations.id, annotationId)).limit(1);
  if (!annotation) {
    throw new HTTPException5(404, { message: "Annotation not found" });
  }
  const hasAccess = await checkProjectAccess(annotation.projectId, userId);
  if (!hasAccess) {
    throw new HTTPException5(403, {
      message: "Access denied to this annotation"
    });
  }
  const updateData = { updatedAt: /* @__PURE__ */ new Date() };
  if (data.title !== void 0) updateData.title = data.title;
  if (data.description !== void 0) updateData.description = data.description;
  if (data.type !== void 0) updateData.type = data.type;
  if (data.priority !== void 0) updateData.priority = data.priority;
  if (data.pageUrl !== void 0) updateData.pageUrl = data.pageUrl;
  if (data.pageTitle !== void 0) updateData.pageTitle = data.pageTitle;
  if (data.screenshotOriginal !== void 0)
    updateData.screenshotOriginal = data.screenshotOriginal;
  if (data.screenshotAnnotated !== void 0)
    updateData.screenshotAnnotated = data.screenshotAnnotated;
  if (data.canvasData !== void 0) updateData.canvasData = data.canvasData;
  const [updated] = await db.update(annotations).set(updateData).where(eq4(annotations.id, annotationId)).returning();
  return {
    id: updated.id,
    projectId: updated.projectId,
    userId: updated.userId,
    title: updated.title,
    description: updated.description,
    type: updated.type,
    priority: updated.priority,
    pageUrl: updated.pageUrl,
    pageTitle: updated.pageTitle,
    screenshotOriginal: updated.screenshotOriginal,
    screenshotAnnotated: updated.screenshotAnnotated,
    canvasData: updated.canvasData,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  };
}
async function remove3(annotationId, userId) {
  const [annotation] = await db.select().from(annotations).where(eq4(annotations.id, annotationId)).limit(1);
  if (!annotation) {
    throw new HTTPException5(404, { message: "Annotation not found" });
  }
  const hasAccess = await checkProjectAccess(annotation.projectId, userId);
  if (!hasAccess) {
    throw new HTTPException5(403, {
      message: "Access denied to this annotation"
    });
  }
  await db.delete(annotations).where(eq4(annotations.id, annotationId));
}

// src/routes/projects.ts
var projectRoutes = new Hono3();
projectRoutes.use("*", authMiddleware);
projectRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const projectId = c.req.param("id");
  const project = await get2(projectId, userId);
  return c.json({ project });
});
projectRoutes.patch(
  "/:id",
  zValidator3("json", updateProjectSchema),
  async (c) => {
    const userId = c.get("userId");
    const projectId = c.req.param("id");
    const data = c.req.valid("json");
    const project = await update2(projectId, userId, data);
    return c.json({ project });
  }
);
projectRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const projectId = c.req.param("id");
  await remove2(projectId, userId);
  return c.body(null, 204);
});
projectRoutes.get("/:projectId/annotations", async (c) => {
  const userId = c.get("userId");
  const projectId = c.req.param("projectId");
  const annotations3 = await list3(projectId, userId);
  return c.json({ annotations: annotations3 });
});
projectRoutes.post(
  "/:projectId/annotations",
  zValidator3("json", createAnnotationSchema),
  async (c) => {
    const userId = c.get("userId");
    const projectId = c.req.param("projectId");
    const data = c.req.valid("json");
    const annotation = await create3(projectId, userId, data);
    return c.json({ annotation }, 201);
  }
);

// src/routes/annotations.ts
import { Hono as Hono4 } from "hono";
import { zValidator as zValidator4 } from "@hono/zod-validator";
var annotationRoutes = new Hono4();
annotationRoutes.use("*", authMiddleware);
annotationRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const annotationId = c.req.param("id");
  const annotation = await get3(annotationId, userId);
  return c.json({ annotation });
});
annotationRoutes.patch(
  "/:id",
  zValidator4("json", updateAnnotationSchema),
  async (c) => {
    const userId = c.get("userId");
    const annotationId = c.req.param("id");
    const data = c.req.valid("json");
    const annotation = await update3(
      annotationId,
      userId,
      data
    );
    return c.json({ annotation });
  }
);
annotationRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const annotationId = c.req.param("id");
  await remove3(annotationId, userId);
  return c.body(null, 204);
});

// src/routes/upload.ts
import { Hono as Hono5 } from "hono";
import { HTTPException as HTTPException7 } from "hono/http-exception";

// src/services/upload.ts
import { put } from "@vercel/blob";
import { HTTPException as HTTPException6 } from "hono/http-exception";
var MAX_FILE_SIZE = 10 * 1024 * 1024;
var ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
async function uploadScreenshot(file, userId) {
  if (file.size > MAX_FILE_SIZE) {
    throw new HTTPException6(413, { message: "File size exceeds 10MB limit" });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new HTTPException6(400, {
      message: "Invalid file type. Only PNG, JPEG, GIF, and WebP are allowed"
    });
  }
  const timestamp2 = Date.now();
  const extension = file.name.split(".").pop() || "png";
  const filename = `screenshots/${userId}/${timestamp2}.${extension}`;
  try {
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true
    });
    return { url: blob.url };
  } catch (error) {
    console.error("Upload error:", error);
    throw new HTTPException6(500, { message: "Failed to upload file" });
  }
}

// src/routes/upload.ts
var uploadRoutes = new Hono5();
uploadRoutes.use("*", authMiddleware);
uploadRoutes.post("/screenshot", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!file || !(file instanceof File)) {
    throw new HTTPException7(400, { message: "No file provided" });
  }
  const result = await uploadScreenshot(file, userId);
  return c.json(result, 201);
});

// src/middleware/error-handler.ts
import { HTTPException as HTTPException8 } from "hono/http-exception";
import { ZodError } from "zod";
function getErrorCode(status) {
  const codes = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    500: "INTERNAL_ERROR"
  };
  return codes[status] || "UNKNOWN_ERROR";
}
function formatZodErrors(error) {
  const details = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }
  return details;
}
function errorHandler(err, c) {
  if (err instanceof HTTPException8) {
    const response2 = {
      error: {
        code: getErrorCode(err.status),
        message: err.message
      }
    };
    return c.json(response2, err.status);
  }
  if (err instanceof ZodError) {
    const response2 = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: formatZodErrors(err)
      }
    };
    return c.json(response2, 400);
  }
  console.error("Internal error:", err);
  const response = {
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred"
    }
  };
  return c.json(response, 500);
}

// src/index.ts
var app = new Hono6();
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://app.nottto.com"],
    credentials: true
  })
);
app.onError(errorHandler);
app.get("/", (c) => c.json({ status: "ok", service: "nottto-api" }));
app.route("/auth", authRoutes);
app.route("/workspaces", workspaceRoutes);
app.route("/projects", projectRoutes);
app.route("/annotations", annotationRoutes);
app.route("/upload", uploadRoutes);
app.notFound(
  (c) => c.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404)
);
var index_default = app;
export {
  index_default as default
};
//# sourceMappingURL=index.js.map