var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/index.ts
import { Hono as Hono6 } from "hono";
import { handle } from "hono/vercel";
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
var magicLinkRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  isRegister: z.boolean().default(false),
  name: z.string().min(1, "Full name is required").max(255).optional()
}).refine(
  (data) => !data.isRegister || data.name && data.name.trim().length > 0,
  { message: "Full name is required for registration", path: ["name"] }
);
var magicLinkVerifySchema = z.object({
  token: z.string().min(1, "Token is required")
});
var createWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(255)
});
var updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens").optional(),
  icon: z.string().min(1).max(50).optional()
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
  pageUrl: z.string().max(2048).optional(),
  // Allow any string for page URLs (some may not be valid URLs)
  pageTitle: z.string().max(255).optional(),
  screenshotOriginal: z.string().url("Invalid URL").optional(),
  screenshotAnnotated: z.string().url("Invalid URL").optional(),
  screenshotAnnotatedBase64: z.string().optional(),
  // Base64 data URL from extension
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
  magicLinkTokens: () => magicLinkTokens,
  projects: () => projects,
  projectsRelations: () => projectsRelations,
  rateLimitRecords: () => rateLimitRecords,
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
  unique,
  index,
  boolean
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  // Nullable for magic link auth
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var magicLinkTokens = pgTable(
  "magic_link_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    // For registration - stores user's full name
    isRegister: boolean("is_register").default(false).notNull(),
    // Distinguishes login vs register
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    usedAt: timestamp("used_at")
  },
  (table) => [
    index("idx_magic_link_tokens_email").on(table.email),
    index("idx_magic_link_tokens_expires_at").on(table.expiresAt)
  ]
);
var rateLimitRecords = pgTable(
  "rate_limit_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [
    index("idx_rate_limit_identifier_action").on(
      table.identifier,
      table.action,
      table.createdAt
    )
  ]
);
var workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  icon: varchar("icon", { length: 50 }).default("\u{1F4C1}").notNull(),
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
var ACCESS_TOKEN_EXPIRY = "1h";
var REFRESH_TOKEN_EXPIRY = "30d";
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

// src/services/magic-link.ts
import { eq as eq3, and as and2, isNull } from "drizzle-orm";
import { HTTPException as HTTPException3 } from "hono/http-exception";

// src/utils/magic-link.ts
import { randomBytes, createHash, timingSafeEqual } from "crypto";
var TOKEN_BYTES = 32;
function generateSecureToken() {
  const buffer = randomBytes(TOKEN_BYTES);
  return buffer.toString("base64url");
}
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
function getTokenExpiration(minutes = 15) {
  const expiration = /* @__PURE__ */ new Date();
  expiration.setMinutes(expiration.getMinutes() + minutes);
  return expiration;
}
function isTokenExpired(expiresAt) {
  return /* @__PURE__ */ new Date() > expiresAt;
}
function maskEmail(email) {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return email;
  const visibleChars = Math.min(2, localPart.length);
  const masked = localPart.slice(0, visibleChars) + "***";
  return `${masked}@${domain}`;
}

// src/services/email.ts
import { Resend } from "resend";

// src/templates/magic-link-email.ts
function getMagicLinkEmailHtml({
  magicLinkUrl,
  expirationMinutes
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to Nottto</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 480px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px 40px; text-align: center;">
              <img src="https://nottto.com/nottto-logo.png" alt="Nottto" style="height: 32px; width: auto;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #171717; text-align: center;">
                Sign in to Nottto
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #525252; text-align: center;">
                Click the button below to securely sign in to your account. This link will expire in ${expirationMinutes} minutes.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${magicLinkUrl}" style="display: inline-block; padding: 14px 32px; background-color: #171717; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500; border-radius: 8px;">
                      Sign in to Nottto
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #737373; text-align: center;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;" />
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 40px 40px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 16px; color: #a3a3a3; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 16px; color: #a3a3a3; text-align: center; word-break: break-all;">
                <a href="${magicLinkUrl}" style="color: #f97316; text-decoration: none;">${magicLinkUrl}</a>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Brand Footer -->
        <table role="presentation" style="width: 100%; max-width: 480px; border-collapse: collapse;">
          <tr>
            <td style="padding: 24px 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
                \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Nottto. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
function getMagicLinkEmailText({
  magicLinkUrl,
  expirationMinutes
}) {
  return `
Sign in to Nottto

Click the link below to securely sign in to your account. This link will expire in ${expirationMinutes} minutes.

${magicLinkUrl}

If you didn't request this email, you can safely ignore it.

\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Nottto. All rights reserved.
  `.trim();
}

// src/services/email.ts
var resend = new Resend(process.env.RESEND_API_KEY);
var EMAIL_FROM = process.env.EMAIL_FROM || "Nottto <noreply@nottto.com>";
var EMAIL_MODE = process.env.EMAIL_MODE || "production";
var MAGIC_LINK_EXPIRATION_MINUTES = 15;
async function sendMagicLinkEmail(email, magicLinkUrl) {
  if (EMAIL_MODE === "development") {
    console.log("\n" + "=".repeat(60));
    console.log("\u{1F517} MAGIC LINK (dev mode - no email sent)");
    console.log("=".repeat(60));
    console.log(`\u{1F4E7} Email: ${email}`);
    console.log(`\u{1F511} Link: ${magicLinkUrl}`);
    console.log("=".repeat(60) + "\n");
    return { success: true };
  }
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Sign in to Nottto",
      html: getMagicLinkEmailHtml({
        magicLinkUrl,
        expirationMinutes: MAGIC_LINK_EXPIRATION_MINUTES
      }),
      text: getMagicLinkEmailText({
        magicLinkUrl,
        expirationMinutes: MAGIC_LINK_EXPIRATION_MINUTES
      })
    });
    if (error) {
      console.error("Failed to send magic link email:", {
        email: maskEmailForLog(email),
        error: error.message
      });
      return { success: false, error: error.message };
    }
    console.log("Magic link email sent:", {
      email: maskEmailForLog(email),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    console.error("Failed to send magic link email:", {
      email: maskEmailForLog(email),
      error: errorMessage
    });
    return { success: false, error: errorMessage };
  }
}
function maskEmailForLog(email) {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  const visibleChars = Math.min(2, localPart.length);
  const masked = localPart.slice(0, visibleChars) + "***";
  return `${masked}@${domain}`;
}

// src/services/rate-limiter.ts
import { eq as eq2, and, gte, lt } from "drizzle-orm";
var MAGIC_LINK_LIMIT = 5;
var WINDOW_HOURS = 1;
async function checkMagicLinkLimit(email) {
  const windowStart = getWindowStart();
  const requests = await db.select().from(rateLimitRecords).where(
    and(
      eq2(rateLimitRecords.identifier, email.toLowerCase()),
      eq2(rateLimitRecords.action, "magic_link"),
      gte(rateLimitRecords.createdAt, windowStart)
    )
  );
  const count = requests.length;
  const remaining = Math.max(0, MAGIC_LINK_LIMIT - count);
  const allowed = count < MAGIC_LINK_LIMIT;
  if (!allowed) {
    const oldestRequest = requests.reduce(
      (oldest, req) => req.createdAt < oldest.createdAt ? req : oldest
    );
    const resetTime = new Date(oldestRequest.createdAt);
    resetTime.setHours(resetTime.getHours() + WINDOW_HOURS);
    const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1e3);
    return { allowed, remaining, retryAfter: Math.max(0, retryAfter) };
  }
  return { allowed, remaining };
}
async function recordMagicLinkRequest(email) {
  await db.insert(rateLimitRecords).values({
    identifier: email.toLowerCase(),
    action: "magic_link"
  });
}
function getWindowStart() {
  const windowStart = /* @__PURE__ */ new Date();
  windowStart.setHours(windowStart.getHours() - WINDOW_HOURS);
  return windowStart;
}

// src/services/magic-link.ts
var WEB_URL = process.env.WEB_URL || "http://localhost:3000";
async function requestMagicLink(email, isRegister = false, name) {
  const normalizedEmail = email.toLowerCase().trim();
  const rateLimit = await checkMagicLinkLimit(normalizedEmail);
  if (!rateLimit.allowed) {
    throw new HTTPException3(429, {
      message: "Too many requests. Please try again later.",
      // @ts-ignore - Adding custom property for retry-after
      retryAfter: rateLimit.retryAfter
    });
  }
  const [existingUser] = await db.select().from(users).where(eq3(users.email, normalizedEmail)).limit(1);
  if (isRegister) {
    if (existingUser) {
      throw new HTTPException3(409, {
        message: "An account with this email already exists. Please login instead."
      });
    }
    if (!name || name.trim().length === 0) {
      throw new HTTPException3(400, {
        message: "Full name is required for registration."
      });
    }
  } else {
    if (!existingUser) {
      throw new HTTPException3(404, {
        message: "No account found with this email. Please register first."
      });
    }
  }
  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const expiresAt = getTokenExpiration(15);
  await db.insert(magicLinkTokens).values({
    email: normalizedEmail,
    tokenHash,
    name: isRegister ? name?.trim() : null,
    isRegister,
    expiresAt
  });
  await recordMagicLinkRequest(normalizedEmail);
  const magicLinkUrl = `${WEB_URL}/auth/verify?token=${encodeURIComponent(
    token
  )}`;
  const emailResult = await sendMagicLinkEmail(normalizedEmail, magicLinkUrl);
  if (!emailResult.success) {
    throw new HTTPException3(500, {
      message: "Failed to send email. Please try again."
    });
  }
  return {
    message: "Magic link sent! Check your email.",
    email: maskEmail(normalizedEmail)
  };
}
async function verifyMagicLink(token) {
  const tokenHash = hashToken(token);
  const [tokenRecord] = await db.select().from(magicLinkTokens).where(
    and2(
      eq3(magicLinkTokens.tokenHash, tokenHash),
      isNull(magicLinkTokens.usedAt)
    )
  ).limit(1);
  if (!tokenRecord) {
    throw new HTTPException3(401, {
      message: "Invalid or expired link. Please request a new one."
    });
  }
  if (isTokenExpired(tokenRecord.expiresAt)) {
    await db.update(magicLinkTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(eq3(magicLinkTokens.id, tokenRecord.id));
    throw new HTTPException3(401, {
      message: "This link has expired. Please request a new one."
    });
  }
  await db.update(magicLinkTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(eq3(magicLinkTokens.id, tokenRecord.id));
  let [existingUser] = await db.select().from(users).where(eq3(users.email, tokenRecord.email)).limit(1);
  let isNewUser = false;
  if (!existingUser) {
    isNewUser = true;
    const [newUser] = await db.insert(users).values({
      email: tokenRecord.email,
      name: tokenRecord.name || null,
      // Use name from registration token
      passwordHash: null
      // Passwordless user
    }).returning();
    existingUser = newUser;
    const existingWorkspaces = await db.select({ slug: workspaces.slug }).from(workspaces);
    const existingSlugs = existingWorkspaces.map((w) => w.slug);
    const workspaceName = tokenRecord.name || "Personal";
    const workspaceSlug = generateUniqueSlug(workspaceName, existingSlugs);
    const [newWorkspace] = await db.insert(workspaces).values({
      name: workspaceName,
      slug: workspaceSlug,
      icon: "\u{1F4C1}",
      // Default icon
      ownerId: newUser.id
    }).returning();
    await db.insert(workspaceMembers).values({
      workspaceId: newWorkspace.id,
      userId: newUser.id,
      role: "owner"
    });
    const existingProjects = await db.select({ slug: projects.slug }).from(projects).where(eq3(projects.workspaceId, newWorkspace.id));
    const existingProjectSlugs = existingProjects.map((p) => p.slug);
    const projectSlug = generateUniqueSlug(
      "My First Project",
      existingProjectSlugs
    );
    await db.insert(projects).values({
      workspaceId: newWorkspace.id,
      name: "My First Project",
      slug: projectSlug,
      description: "Your first project - start capturing feedback!"
    });
  }
  const tokens = await generateTokens({
    sub: existingUser.id,
    email: existingUser.email
  });
  const user = {
    id: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
    createdAt: existingUser.createdAt,
    updatedAt: existingUser.updatedAt
  };
  return { user, tokens, isNewUser };
}

// src/routes/auth.ts
var authRoutes = new Hono();
authRoutes.post(
  "/magic-link",
  zValidator("json", magicLinkRequestSchema),
  async (c) => {
    const { email, isRegister, name } = c.req.valid("json");
    const result = await requestMagicLink(
      email,
      isRegister,
      name
    );
    return c.json(result);
  }
);
authRoutes.post(
  "/verify-magic-link",
  zValidator("json", magicLinkVerifySchema),
  async (c) => {
    const { token } = c.req.valid("json");
    const result = await verifyMagicLink(token);
    return c.json(result);
  }
);
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
import { eq as eq4, and as and3 } from "drizzle-orm";
import { HTTPException as HTTPException4 } from "hono/http-exception";
async function list(userId) {
  const ownedWorkspaces = await db.select().from(workspaces).where(eq4(workspaces.ownerId, userId));
  const memberWorkspaces = await db.select({
    id: workspaces.id,
    name: workspaces.name,
    slug: workspaces.slug,
    icon: workspaces.icon,
    ownerId: workspaces.ownerId,
    createdAt: workspaces.createdAt,
    updatedAt: workspaces.updatedAt
  }).from(workspaceMembers).innerJoin(workspaces, eq4(workspaceMembers.workspaceId, workspaces.id)).where(eq4(workspaceMembers.userId, userId));
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
    icon: ws.icon,
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
    icon: "\u{1F4C1}",
    // Default icon
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
    icon: newWorkspace.icon,
    ownerId: newWorkspace.ownerId,
    createdAt: newWorkspace.createdAt,
    updatedAt: newWorkspace.updatedAt
  };
}
async function get(workspaceId, userId) {
  const [workspace] = await db.select().from(workspaces).where(eq4(workspaces.id, workspaceId)).limit(1);
  if (!workspace) {
    throw new HTTPException4(404, { message: "Workspace not found" });
  }
  const hasAccess = await checkAccess(workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException4(403, {
      message: "Access denied to this workspace"
    });
  }
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    icon: workspace.icon,
    ownerId: workspace.ownerId,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt
  };
}
async function getBySlug(slug, userId) {
  const [workspace] = await db.select().from(workspaces).where(eq4(workspaces.slug, slug)).limit(1);
  if (!workspace) {
    throw new HTTPException4(404, { message: "Workspace not found" });
  }
  const hasAccess = await checkAccess(workspace.id, userId);
  if (!hasAccess) {
    throw new HTTPException4(403, {
      message: "Access denied to this workspace"
    });
  }
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    icon: workspace.icon,
    ownerId: workspace.ownerId,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt
  };
}
async function update(workspaceId, userId, data) {
  const [workspace] = await db.select().from(workspaces).where(eq4(workspaces.id, workspaceId)).limit(1);
  if (!workspace) {
    throw new HTTPException4(404, { message: "Workspace not found" });
  }
  if (workspace.ownerId !== userId) {
    throw new HTTPException4(403, {
      message: "Only the owner can update this workspace"
    });
  }
  if (data.slug && data.slug !== workspace.slug) {
    const [existing] = await db.select().from(workspaces).where(eq4(workspaces.slug, data.slug)).limit(1);
    if (existing) {
      throw new HTTPException4(409, { message: "Slug already in use" });
    }
  }
  const [updated] = await db.update(workspaces).set({
    ...data,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq4(workspaces.id, workspaceId)).returning();
  return {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    icon: updated.icon,
    ownerId: updated.ownerId,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  };
}
async function remove(workspaceId, userId) {
  const [workspace] = await db.select().from(workspaces).where(eq4(workspaces.id, workspaceId)).limit(1);
  if (!workspace) {
    throw new HTTPException4(404, { message: "Workspace not found" });
  }
  if (workspace.ownerId !== userId) {
    throw new HTTPException4(403, {
      message: "Only the owner can delete this workspace"
    });
  }
  await db.delete(workspaces).where(eq4(workspaces.id, workspaceId));
}
async function checkAccess(workspaceId, userId) {
  const [workspace] = await db.select().from(workspaces).where(and3(eq4(workspaces.id, workspaceId), eq4(workspaces.ownerId, userId))).limit(1);
  if (workspace) {
    return true;
  }
  const [member] = await db.select().from(workspaceMembers).where(
    and3(
      eq4(workspaceMembers.workspaceId, workspaceId),
      eq4(workspaceMembers.userId, userId)
    )
  ).limit(1);
  return !!member;
}

// src/services/projects.ts
import { eq as eq5, and as and4 } from "drizzle-orm";
import { HTTPException as HTTPException5 } from "hono/http-exception";
async function list2(workspaceId, userId) {
  const hasAccess = await checkAccess(workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException5(403, {
      message: "Access denied to this workspace"
    });
  }
  const projectList = await db.select().from(projects).where(eq5(projects.workspaceId, workspaceId));
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
    throw new HTTPException5(403, {
      message: "Access denied to this workspace"
    });
  }
  const existingProjects = await db.select({ slug: projects.slug }).from(projects).where(eq5(projects.workspaceId, workspaceId));
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
  const [project] = await db.select().from(projects).where(eq5(projects.id, projectId)).limit(1);
  if (!project) {
    throw new HTTPException5(404, { message: "Project not found" });
  }
  const hasAccess = await checkAccess(project.workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException5(403, { message: "Access denied to this project" });
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
  const [project] = await db.select().from(projects).where(eq5(projects.id, projectId)).limit(1);
  if (!project) {
    throw new HTTPException5(404, { message: "Project not found" });
  }
  const hasAccess = await checkAccess(project.workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException5(403, { message: "Access denied to this project" });
  }
  if (data.slug && data.slug !== project.slug) {
    const [existing] = await db.select().from(projects).where(
      and4(
        eq5(projects.workspaceId, project.workspaceId),
        eq5(projects.slug, data.slug)
      )
    ).limit(1);
    if (existing) {
      throw new HTTPException5(409, {
        message: "Slug already in use in this workspace"
      });
    }
  }
  const [updated] = await db.update(projects).set({
    ...data,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq5(projects.id, projectId)).returning();
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
  const [project] = await db.select().from(projects).where(eq5(projects.id, projectId)).limit(1);
  if (!project) {
    throw new HTTPException5(404, { message: "Project not found" });
  }
  const hasAccess = await checkAccess(project.workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException5(403, { message: "Access denied to this project" });
  }
  await db.delete(projects).where(eq5(projects.id, projectId));
}
async function checkProjectAccess(projectId, userId) {
  const [project] = await db.select().from(projects).where(eq5(projects.id, projectId)).limit(1);
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
workspaceRoutes.get("/by-slug/:slug", async (c) => {
  const userId = c.get("userId");
  const slug = c.req.param("slug");
  const workspace = await getBySlug(slug, userId);
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
  const projects3 = await list2(workspaceId, userId);
  return c.json({ projects: projects3 });
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
import { eq as eq6 } from "drizzle-orm";
import { HTTPException as HTTPException7 } from "hono/http-exception";

// src/services/upload.ts
import { put } from "@vercel/blob";
import { HTTPException as HTTPException6 } from "hono/http-exception";
var MAX_FILE_SIZE = 10 * 1024 * 1024;
var ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
var ALLOWED_MIME_EXTENSIONS = {
  png: "png",
  jpeg: "jpg",
  gif: "gif",
  webp: "webp"
};
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
async function uploadBase64Screenshot(base64Data, userId) {
  const matches = base64Data.match(
    /^data:image\/(png|jpeg|gif|webp);base64,(.+)$/
  );
  if (!matches) {
    throw new HTTPException6(400, {
      message: "Invalid base64 image format. Expected data:image/(png|jpeg|gif|webp);base64,..."
    });
  }
  const [, mimeType, base64Content] = matches;
  let buffer;
  try {
    buffer = Buffer.from(base64Content, "base64");
  } catch {
    throw new HTTPException6(400, { message: "Invalid base64 encoding" });
  }
  if (buffer.length > MAX_FILE_SIZE) {
    throw new HTTPException6(413, { message: "File size exceeds 10MB limit" });
  }
  const timestamp2 = Date.now();
  const extension = ALLOWED_MIME_EXTENSIONS[mimeType] || "png";
  const filename = `screenshots/${userId}/${timestamp2}.${extension}`;
  try {
    const blob = await put(filename, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: `image/${mimeType}`
    });
    return { url: blob.url };
  } catch (error) {
    console.error("Upload error:", error);
    throw new HTTPException6(500, { message: "Failed to upload file" });
  }
}

// src/services/annotations.ts
async function list3(projectId, userId) {
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    throw new HTTPException7(403, { message: "Access denied to this project" });
  }
  const annotationList = await db.select().from(annotations).where(eq6(annotations.projectId, projectId));
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
    throw new HTTPException7(403, { message: "Access denied to this project" });
  }
  let screenshotAnnotatedUrl = data.screenshotAnnotated || null;
  if (data.screenshotAnnotatedBase64) {
    const uploadResult = await uploadBase64Screenshot(
      data.screenshotAnnotatedBase64,
      userId
    );
    screenshotAnnotatedUrl = uploadResult.url;
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
    screenshotAnnotated: screenshotAnnotatedUrl,
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
  const [annotation] = await db.select().from(annotations).where(eq6(annotations.id, annotationId)).limit(1);
  if (!annotation) {
    throw new HTTPException7(404, { message: "Annotation not found" });
  }
  const hasAccess = await checkProjectAccess(annotation.projectId, userId);
  if (!hasAccess) {
    throw new HTTPException7(403, {
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
  const [annotation] = await db.select().from(annotations).where(eq6(annotations.id, annotationId)).limit(1);
  if (!annotation) {
    throw new HTTPException7(404, { message: "Annotation not found" });
  }
  const hasAccess = await checkProjectAccess(annotation.projectId, userId);
  if (!hasAccess) {
    throw new HTTPException7(403, {
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
  const [updated] = await db.update(annotations).set(updateData).where(eq6(annotations.id, annotationId)).returning();
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
  const [annotation] = await db.select().from(annotations).where(eq6(annotations.id, annotationId)).limit(1);
  if (!annotation) {
    throw new HTTPException7(404, { message: "Annotation not found" });
  }
  const hasAccess = await checkProjectAccess(annotation.projectId, userId);
  if (!hasAccess) {
    throw new HTTPException7(403, {
      message: "Access denied to this annotation"
    });
  }
  await db.delete(annotations).where(eq6(annotations.id, annotationId));
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
import { HTTPException as HTTPException8 } from "hono/http-exception";
var uploadRoutes = new Hono5();
uploadRoutes.use("*", authMiddleware);
uploadRoutes.post("/screenshot", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!file || !(file instanceof File)) {
    throw new HTTPException8(400, { message: "No file provided" });
  }
  const result = await uploadScreenshot(file, userId);
  return c.json(result, 201);
});

// src/middleware/error-handler.ts
import { HTTPException as HTTPException9 } from "hono/http-exception";
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
  if (err instanceof HTTPException9) {
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
var app = new Hono6().basePath("/api");
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "http://localhost:3000";
      if (origin === "http://localhost:3000") return origin;
      if (origin === "https://app.nottto.com") return origin;
      if (origin.startsWith("chrome-extension://")) return origin;
      if (process.env.NODE_ENV !== "production") {
        return origin;
      }
      return "http://localhost:3000";
    },
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
var handler = handle(app);
var GET = handler;
var POST = handler;
var PATCH = handler;
var PUT = handler;
var DELETE = handler;
var OPTIONS = handler;
var src_default = app;
export {
  DELETE,
  GET,
  OPTIONS,
  PATCH,
  POST,
  PUT,
  src_default as default
};
