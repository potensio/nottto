import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  unique,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }), // Nullable for magic link auth
  name: varchar("name", { length: 255 }),
  profilePicture: text("profile_picture"), // URL to profile picture
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Magic Link Tokens table
export const magicLinkTokens = pgTable(
  "magic_link_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }), // For registration - stores user's full name
    isRegister: boolean("is_register").default(false).notNull(), // Distinguishes login vs register
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    usedAt: timestamp("used_at"),
  },
  (table) => [
    index("idx_magic_link_tokens_email").on(table.email),
    index("idx_magic_link_tokens_expires_at").on(table.expiresAt),
  ],
);

// Verification Codes table (for extension auth)
export const verificationCodes = pgTable(
  "verification_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    codeHash: varchar("code_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }), // For registration - stores user's full name
    isRegister: boolean("is_register").default(false).notNull(), // Distinguishes login vs register
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    usedAt: timestamp("used_at"),
  },
  (table) => [
    index("idx_verification_codes_email").on(table.email),
    index("idx_verification_codes_expires_at").on(table.expiresAt),
  ],
);

// Rate Limit Records table
export const rateLimitRecords = pgTable(
  "rate_limit_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_rate_limit_identifier_action").on(
      table.identifier,
      table.action,
      table.createdAt,
    ),
  ],
);

// Workspaces table
export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  icon: varchar("icon", { length: 50 }).default("📁").notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workspace members table (for future multi-user support)
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: varchar("role", { length: 50 }).default("member").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("workspace_user_unique").on(table.workspaceId, table.userId),
  ],
);

// Workspace invitations table
export const workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    inviterUserId: uuid("inviter_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    inviteeEmail: varchar("invitee_email", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).default("member").notNull(),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    declinedAt: timestamp("declined_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_workspace_invitations_workspace_id").on(table.workspaceId),
    index("idx_workspace_invitations_email").on(table.inviteeEmail),
    index("idx_workspace_invitations_expires_at").on(table.expiresAt),
    // Prevent duplicate pending invitations
    unique("workspace_email_pending_unique").on(
      table.workspaceId,
      table.inviteeEmail,
      table.status,
    ),
  ],
);

// Projects table
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("workspace_project_slug_unique").on(table.workspaceId, table.slug),
  ],
);

// Webhook Integrations table (one-to-one with projects)
export const webhookIntegrations = pgTable("webhook_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  url: text("url").notNull(),
  headers: jsonb("headers").default({}).notNull(),
  bodyTemplate: text("body_template").default("").notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  locked: boolean("locked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions table (for HTTP-only cookie authentication)
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    sessionToken: varchar("session_token", { length: 255 }).unique().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
  },
  (table) => [
    index("idx_sessions_user_id").on(table.userId),
    index("idx_sessions_expires_at").on(table.expiresAt),
  ],
);

// OAuth Authorization Codes table (for OAuth 2.0 with PKCE flow)
export const oauthAuthorizationCodes = pgTable(
  "oauth_authorization_codes",
  {
    id: varchar("id", { length: 64 }).primaryKey(), // nanoid
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    codeChallenge: varchar("code_challenge", { length: 255 }).notNull(),
    redirectUri: text("redirect_uri").notNull(),
    clientId: varchar("client_id", { length: 255 }).notNull(),
    state: varchar("state", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_oauth_authorization_codes_user_id").on(table.userId),
    index("idx_oauth_authorization_codes_expires_at").on(table.expiresAt),
  ],
);

// Annotations table
export const annotations = pgTable("annotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  workspaceMembers: many(workspaceMembers),
  annotations: many(annotations),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  members: many(workspaceMembers),
  invitations: many(workspaceInvitations),
  projects: many(projects),
}));

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
    }),
    user: one(users, {
      fields: [workspaceMembers.userId],
      references: [users.id],
    }),
  }),
);

export const workspaceInvitationsRelations = relations(
  workspaceInvitations,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceInvitations.workspaceId],
      references: [workspaces.id],
    }),
    inviter: one(users, {
      fields: [workspaceInvitations.inviterUserId],
      references: [users.id],
    }),
  }),
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  annotations: many(annotations),
  webhookIntegration: one(webhookIntegrations),
}));

export const webhookIntegrationsRelations = relations(
  webhookIntegrations,
  ({ one }) => ({
    project: one(projects, {
      fields: [webhookIntegrations.projectId],
      references: [projects.id],
    }),
  }),
);

export const annotationsRelations = relations(annotations, ({ one }) => ({
  project: one(projects, {
    fields: [annotations.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [annotations.userId],
    references: [users.id],
  }),
}));

// Type exports
export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;
export type WorkspaceRecord = typeof workspaces.$inferSelect;
export type NewWorkspaceRecord = typeof workspaces.$inferInsert;
export type WorkspaceMemberRecord = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMemberRecord = typeof workspaceMembers.$inferInsert;
export type WorkspaceInvitationRecord =
  typeof workspaceInvitations.$inferSelect;
export type NewWorkspaceInvitationRecord =
  typeof workspaceInvitations.$inferInsert;
export type ProjectRecord = typeof projects.$inferSelect;
export type NewProjectRecord = typeof projects.$inferInsert;
export type AnnotationRecord = typeof annotations.$inferSelect;
export type NewAnnotationRecord = typeof annotations.$inferInsert;
export type MagicLinkTokenRecord = typeof magicLinkTokens.$inferSelect;
export type NewMagicLinkTokenRecord = typeof magicLinkTokens.$inferInsert;
export type VerificationCodeRecord = typeof verificationCodes.$inferSelect;
export type NewVerificationCodeRecord = typeof verificationCodes.$inferInsert;
export type RateLimitRecord = typeof rateLimitRecords.$inferSelect;
export type NewRateLimitRecord = typeof rateLimitRecords.$inferInsert;
export type WebhookIntegrationRecord = typeof webhookIntegrations.$inferSelect;
export type NewWebhookIntegrationRecord =
  typeof webhookIntegrations.$inferInsert;
export type SessionRecord = typeof sessions.$inferSelect;
export type NewSessionRecord = typeof sessions.$inferInsert;
export type OAuthAuthorizationCodeRecord =
  typeof oauthAuthorizationCodes.$inferSelect;
export type NewOAuthAuthorizationCodeRecord =
  typeof oauthAuthorizationCodes.$inferInsert;
