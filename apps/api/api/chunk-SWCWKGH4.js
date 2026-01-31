var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/services/auth.ts
import { eq, lt } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

// ../../packages/shared/src/db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// ../../packages/shared/src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  annotations: () => annotations,
  annotationsRelations: () => annotationsRelations,
  magicLinkTokens: () => magicLinkTokens,
  oauthAuthorizationCodes: () => oauthAuthorizationCodes,
  projects: () => projects,
  projectsRelations: () => projectsRelations,
  rateLimitRecords: () => rateLimitRecords,
  sessions: () => sessions,
  sessionsRelations: () => sessionsRelations,
  users: () => users,
  usersRelations: () => usersRelations,
  verificationCodes: () => verificationCodes,
  webhookIntegrations: () => webhookIntegrations,
  webhookIntegrationsRelations: () => webhookIntegrationsRelations,
  workspaceInvitations: () => workspaceInvitations,
  workspaceInvitationsRelations: () => workspaceInvitationsRelations,
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
  profilePicture: text("profile_picture"),
  // URL to profile picture
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
var verificationCodes = pgTable(
  "verification_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    codeHash: varchar("code_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    // For registration - stores user's full name
    isRegister: boolean("is_register").default(false).notNull(),
    // Distinguishes login vs register
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    usedAt: timestamp("used_at")
  },
  (table) => [
    index("idx_verification_codes_email").on(table.email),
    index("idx_verification_codes_expires_at").on(table.expiresAt)
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
var workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    inviterUserId: uuid("inviter_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    inviteeEmail: varchar("invitee_email", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).default("member").notNull(),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    declinedAt: timestamp("declined_at"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [
    index("idx_workspace_invitations_workspace_id").on(table.workspaceId),
    index("idx_workspace_invitations_email").on(table.inviteeEmail),
    index("idx_workspace_invitations_expires_at").on(table.expiresAt),
    // Prevent duplicate pending invitations
    unique("workspace_email_pending_unique").on(
      table.workspaceId,
      table.inviteeEmail,
      table.status
    )
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
var webhookIntegrations = pgTable("webhook_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).unique().notNull(),
  url: text("url").notNull(),
  headers: jsonb("headers").default({}).notNull(),
  bodyTemplate: text("body_template").default("").notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  locked: boolean("locked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    sessionToken: varchar("session_token", { length: 255 }).unique().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 })
  },
  (table) => [
    index("idx_sessions_user_id").on(table.userId),
    index("idx_sessions_expires_at").on(table.expiresAt)
  ]
);
var oauthAuthorizationCodes = pgTable(
  "oauth_authorization_codes",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    // nanoid
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    codeChallenge: varchar("code_challenge", { length: 255 }).notNull(),
    redirectUri: text("redirect_uri").notNull(),
    clientId: varchar("client_id", { length: 255 }).notNull(),
    state: varchar("state", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [
    index("idx_oauth_authorization_codes_user_id").on(table.userId),
    index("idx_oauth_authorization_codes_expires_at").on(table.expiresAt)
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
  status: varchar("status", { length: 20 }).default("open").notNull(),
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
  annotations: many(annotations),
  sessions: many(sessions)
}));
var sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}));
var workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id]
  }),
  members: many(workspaceMembers),
  invitations: many(workspaceInvitations),
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
var workspaceInvitationsRelations = relations(
  workspaceInvitations,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceInvitations.workspaceId],
      references: [workspaces.id]
    }),
    inviter: one(users, {
      fields: [workspaceInvitations.inviterUserId],
      references: [users.id]
    })
  })
);
var projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id]
  }),
  annotations: many(annotations),
  webhookIntegration: one(webhookIntegrations)
}));
var webhookIntegrationsRelations = relations(
  webhookIntegrations,
  ({ one }) => ({
    project: one(projects, {
      fields: [webhookIntegrations.projectId],
      references: [projects.id]
    })
  })
);
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
import { SignJWT, jwtVerify } from "jose";
var SALT_ROUNDS = 10;
var ACCESS_TOKEN_EXPIRY = "30d";
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
  const { payload } = await jwtVerify(token, secret);
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
import { nanoid } from "nanoid";
var SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1e3;
async function createSession(userId, userAgent, ipAddress) {
  const sessionToken = nanoid(64);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
  await db.insert(sessions).values({
    userId,
    sessionToken,
    expiresAt,
    userAgent: userAgent || null,
    ipAddress: ipAddress || null
  });
  return sessionToken;
}
async function validateSession(sessionToken) {
  const [session] = await db.select({
    userId: sessions.userId,
    expiresAt: sessions.expiresAt,
    userEmail: users.email
  }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(eq(sessions.sessionToken, sessionToken)).limit(1);
  if (!session) {
    return null;
  }
  if (/* @__PURE__ */ new Date() > session.expiresAt) {
    await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
    return null;
  }
  await db.update(sessions).set({ lastActiveAt: /* @__PURE__ */ new Date() }).where(eq(sessions.sessionToken, sessionToken));
  return {
    userId: session.userId,
    userEmail: session.userEmail
  };
}
async function deleteSession(sessionToken) {
  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}
async function deleteAllUserSessions(userId) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
async function cleanupExpiredSessions() {
  await db.delete(sessions).where(lt(sessions.expiresAt, /* @__PURE__ */ new Date()));
}
async function register(email, password, name) {
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser.length > 0) {
    throw new HTTPException(409, { message: "Email already registered" });
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
    profilePicture: newUser.profilePicture,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt
  };
  return { user, tokens };
}
async function login(email, password) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    throw new HTTPException(401, { message: "Invalid email or password" });
  }
  if (!user.passwordHash) {
    throw new HTTPException(401, {
      message: "This account uses magic link authentication. Please use the magic link option."
    });
  }
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new HTTPException(401, { message: "Invalid email or password" });
  }
  const tokens = await generateTokens({
    sub: user.id,
    email: user.email
  });
  const userResponse = {
    id: user.id,
    email: user.email,
    name: user.name,
    profilePicture: user.profilePicture,
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
      throw new HTTPException(401, { message: "User not found" });
    }
    const accessToken = await generateAccessToken({
      sub: user.id,
      email: user.email
    });
    return { accessToken };
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(401, {
      message: "Invalid or expired refresh token"
    });
  }
}
async function getUser(userId) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
async function updateUser(userId, data) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }
  const [updatedUser] = await db.update(users).set({
    ...data,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId)).returning();
  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    profilePicture: updatedUser.profilePicture,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt
  };
}
async function deleteUser(userId) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }
  await db.delete(users).where(eq(users.id, userId));
}

export {
  users,
  magicLinkTokens,
  verificationCodes,
  rateLimitRecords,
  workspaces,
  workspaceMembers,
  workspaceInvitations,
  projects,
  webhookIntegrations,
  sessions,
  oauthAuthorizationCodes,
  annotations,
  db,
  generateTokens,
  generateUniqueSlug,
  createSession,
  validateSession,
  deleteSession,
  deleteAllUserSessions,
  cleanupExpiredSessions,
  register,
  login,
  refresh,
  getUser,
  updateUser,
  deleteUser
};
