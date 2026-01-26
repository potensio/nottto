// src/index.ts
import { Hono as Hono8 } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// src/routes/auth.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { setCookie, deleteCookie } from "hono/cookie";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  magicLinkRequestSchema,
  magicLinkVerifySchema,
  updateUserProfileSchema
} from "@notto/shared";

// src/middleware/auth.ts
import { HTTPException as HTTPException2 } from "hono/http-exception";
import { getCookie } from "hono/cookie";
import { jwtVerify as jwtVerify2 } from "jose";

// src/services/auth.ts
import { eq, lt } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

// src/db.ts
import { createDb } from "@notto/shared/db";
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}
var db = createDb(process.env.DATABASE_URL);

// src/services/auth.ts
import {
  users,
  workspaces,
  workspaceMembers,
  projects,
  sessions
} from "@notto/shared/db";

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
async function deleteAllUserSessions(userId) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
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

// src/middleware/auth.ts
async function authMiddleware(c, next) {
  const sessionCookie = getCookie(c, "session");
  if (sessionCookie) {
    const session = await validateSession(sessionCookie);
    if (session) {
      c.set("userId", session.userId);
      c.set("userEmail", session.userEmail);
      await next();
      return;
    }
  }
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify2(token, secret);
      if (!payload.sub || !payload.email) {
        throw new HTTPException2(401, { message: "Invalid token payload" });
      }
      c.set("userId", payload.sub);
      c.set("userEmail", payload.email);
      await next();
      return;
    } catch (error) {
      if (error instanceof HTTPException2) {
        throw error;
      }
      throw new HTTPException2(401, { message: "Invalid or expired token" });
    }
  }
  throw new HTTPException2(401, {
    message: "Missing or invalid authentication"
  });
}

// src/services/magic-link.ts
import { eq as eq3, and as and2, isNull } from "drizzle-orm";
import { HTTPException as HTTPException3 } from "hono/http-exception";
import {
  users as users2,
  magicLinkTokens,
  workspaces as workspaces2,
  workspaceMembers as workspaceMembers2,
  projects as projects2
} from "@notto/shared/db";

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
  <title>Sign in to Notto</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 480px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px 40px; text-align: center;">
              <img src="https://notto.site/notto-logo.png" alt="Notto" style="height: 32px; width: auto;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #171717; text-align: center;">
                Sign in to Notto
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #525252; text-align: center;">
                Click the button below to securely sign in to your account. This link will expire in ${expirationMinutes} minutes.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${magicLinkUrl}" style="display: inline-block; padding: 14px 32px; background-color: #171717; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500; border-radius: 8px;">
                      Sign in to Notto
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
                \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Notto. All rights reserved.
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
Sign in to Notto

Click the link below to securely sign in to your account. This link will expire in ${expirationMinutes} minutes.

${magicLinkUrl}

If you didn't request this email, you can safely ignore it.

\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Notto. All rights reserved.
  `.trim();
}

// src/services/email.ts
var resend = null;
function getResendClient() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}
var EMAIL_FROM = process.env.EMAIL_FROM || "Hanif <noreply@notto.site>";
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
    const { error } = await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Sign in to Notto",
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
import { eq as eq2, and, gte, lt as lt2 } from "drizzle-orm";
import { rateLimitRecords } from "@notto/shared/db";
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
async function requestMagicLink(email, isRegister = false, name, extensionSession) {
  const normalizedEmail = email.toLowerCase().trim();
  const rateLimit = await checkMagicLinkLimit(normalizedEmail);
  if (!rateLimit.allowed) {
    throw new HTTPException3(429, {
      message: "Too many requests. Please try again later.",
      // @ts-ignore - Adding custom property for retry-after
      retryAfter: rateLimit.retryAfter
    });
  }
  const [existingUser] = await db.select().from(users2).where(eq3(users2.email, normalizedEmail)).limit(1);
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
  let magicLinkUrl = `${WEB_URL}/auth/verify?token=${encodeURIComponent(
    token
  )}`;
  if (extensionSession) {
    magicLinkUrl += `&session=${encodeURIComponent(extensionSession)}`;
  }
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
  let [existingUser] = await db.select().from(users2).where(eq3(users2.email, tokenRecord.email)).limit(1);
  let isNewUser = false;
  if (!existingUser) {
    isNewUser = true;
    const [newUser] = await db.insert(users2).values({
      email: tokenRecord.email,
      name: tokenRecord.name || null,
      // Use name from registration token
      passwordHash: null
      // Passwordless user
    }).returning();
    existingUser = newUser;
    const existingWorkspaces = await db.select({ slug: workspaces2.slug }).from(workspaces2);
    const existingSlugs = existingWorkspaces.map((w) => w.slug);
    const workspaceName = tokenRecord.name || "Personal";
    const workspaceSlug = generateUniqueSlug(workspaceName, existingSlugs);
    const [newWorkspace] = await db.insert(workspaces2).values({
      name: workspaceName,
      slug: workspaceSlug,
      icon: "\u{1F4C1}",
      // Default icon
      ownerId: newUser.id
    }).returning();
    await db.insert(workspaceMembers2).values({
      workspaceId: newWorkspace.id,
      userId: newUser.id,
      role: "owner"
    });
    const existingProjects = await db.select({ slug: projects2.slug }).from(projects2).where(eq3(projects2.workspaceId, newWorkspace.id));
    const existingProjectSlugs = existingProjects.map((p) => p.slug);
    const projectSlug = generateUniqueSlug(
      "My First Project",
      existingProjectSlugs
    );
    await db.insert(projects2).values({
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
    profilePicture: existingUser.profilePicture,
    createdAt: existingUser.createdAt,
    updatedAt: existingUser.updatedAt
  };
  return { user, tokens, isNewUser };
}

// src/routes/auth.ts
var authRoutes = new Hono();
function setSessionCookie(c, sessionToken) {
  setCookie(c, "session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    // None required for cross-site cookies
    maxAge: 60 * 60 * 24 * 30,
    // 30 days
    path: "/"
  });
}
function clearSessionCookie(c) {
  deleteCookie(c, "session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    path: "/"
  });
}
authRoutes.post(
  "/magic-link",
  zValidator("json", magicLinkRequestSchema),
  async (c) => {
    const { email, isRegister, name, extensionSession } = c.req.valid("json");
    const result = await requestMagicLink(
      email,
      isRegister,
      name,
      extensionSession
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
    const userAgent = c.req.header("user-agent");
    const sessionToken = await createSession(
      result.user.id,
      userAgent
    );
    setSessionCookie(c, sessionToken);
    return c.json(result);
  }
);
authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");
  const result = await register(email, password, name);
  const userAgent = c.req.header("user-agent");
  const sessionToken = await createSession(
    result.user.id,
    userAgent
  );
  setSessionCookie(c, sessionToken);
  return c.json(result, 201);
});
authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const result = await login(email, password);
  const userAgent = c.req.header("user-agent");
  const sessionToken = await createSession(
    result.user.id,
    userAgent
  );
  setSessionCookie(c, sessionToken);
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
authRoutes.patch(
  "/me",
  authMiddleware,
  zValidator("json", updateUserProfileSchema),
  async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");
    const user = await updateUser(userId, data);
    return c.json({ user });
  }
);
authRoutes.delete("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");
  await deleteUser(userId);
  clearSessionCookie(c);
  return c.json({ success: true, message: "Account deleted successfully" });
});
authRoutes.post("/logout", authMiddleware, async (c) => {
  const userId = c.get("userId");
  await deleteAllUserSessions(userId);
  clearSessionCookie(c);
  return c.json({ success: true, message: "Logged out successfully" });
});

// src/routes/extension-auth.ts
import { Hono as Hono2 } from "hono";
import { zValidator as zValidator2 } from "@hono/zod-validator";
import { z } from "zod";

// src/services/extension-auth.ts
import { eq as eq4, and as and3, gt, lt as lt3 } from "drizzle-orm";
import { HTTPException as HTTPException4 } from "hono/http-exception";
import { users as users3, extensionAuthSessions } from "@notto/shared/db";
import { nanoid as nanoid2 } from "nanoid";
var SESSION_EXPIRY_MS2 = 10 * 60 * 1e3;
async function createAuthSession() {
  const sessionId = nanoid2(32);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS2);
  await db.insert(extensionAuthSessions).values({
    id: sessionId,
    status: "pending",
    expiresAt
  });
  return {
    sessionId,
    expiresAt: expiresAt.toISOString()
  };
}
async function getAuthSession(sessionId) {
  const [session] = await db.select().from(extensionAuthSessions).where(eq4(extensionAuthSessions.id, sessionId)).limit(1);
  if (!session) {
    throw new HTTPException4(404, { message: "Session not found" });
  }
  if (/* @__PURE__ */ new Date() > session.expiresAt) {
    await db.delete(extensionAuthSessions).where(eq4(extensionAuthSessions.id, sessionId));
    return { status: "expired" };
  }
  if (session.status === "pending") {
    return { status: "pending" };
  }
  if (session.status === "completed" && session.userId) {
    const [user] = await db.select().from(users3).where(eq4(users3.id, session.userId)).limit(1);
    if (!user) {
      throw new HTTPException4(404, { message: "User not found" });
    }
    const tokens = await generateTokens({
      sub: user.id,
      email: user.email
    });
    await db.delete(extensionAuthSessions).where(eq4(extensionAuthSessions.id, sessionId));
    return {
      status: "completed",
      tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    };
  }
  return { status: "pending" };
}
async function completeAuthSession(sessionId, userId) {
  const [session] = await db.select().from(extensionAuthSessions).where(
    and3(
      eq4(extensionAuthSessions.id, sessionId),
      gt(extensionAuthSessions.expiresAt, /* @__PURE__ */ new Date())
    )
  ).limit(1);
  if (!session) {
    throw new HTTPException4(404, {
      message: "Session not found or expired"
    });
  }
  if (session.status === "completed") {
    throw new HTTPException4(400, {
      message: "Session already completed"
    });
  }
  await db.update(extensionAuthSessions).set({
    status: "completed",
    userId,
    completedAt: /* @__PURE__ */ new Date()
  }).where(eq4(extensionAuthSessions.id, sessionId));
  return { success: true };
}
async function deleteAuthSession(sessionId) {
  await db.delete(extensionAuthSessions).where(eq4(extensionAuthSessions.id, sessionId));
}

// src/routes/extension-auth.ts
var extensionAuthRoutes = new Hono2();
extensionAuthRoutes.post("/session", async (c) => {
  const result = await createAuthSession();
  return c.json(result);
});
extensionAuthRoutes.get("/session/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");
  const result = await getAuthSession(sessionId);
  return c.json(result);
});
var completeSessionSchema = z.object({
  // No body needed - we get user from auth middleware
});
extensionAuthRoutes.post(
  "/session/:sessionId/complete",
  authMiddleware,
  zValidator2("json", completeSessionSchema),
  async (c) => {
    const sessionId = c.req.param("sessionId");
    const userId = c.get("userId");
    const result = await completeAuthSession(
      sessionId,
      userId
    );
    return c.json(result);
  }
);
extensionAuthRoutes.delete("/session/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");
  await deleteAuthSession(sessionId);
  return c.json({ success: true });
});

// src/routes/workspaces.ts
import { Hono as Hono3 } from "hono";
import { zValidator as zValidator3 } from "@hono/zod-validator";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  createProjectSchema
} from "@notto/shared";

// src/services/workspaces.ts
import { eq as eq5, and as and4 } from "drizzle-orm";
import { HTTPException as HTTPException5 } from "hono/http-exception";
import {
  workspaces as workspaces3,
  workspaceMembers as workspaceMembers3
} from "@notto/shared/db";
async function list(userId) {
  const ownedWorkspaces = await db.select().from(workspaces3).where(eq5(workspaces3.ownerId, userId));
  const memberWorkspaces = await db.select({
    id: workspaces3.id,
    name: workspaces3.name,
    slug: workspaces3.slug,
    icon: workspaces3.icon,
    ownerId: workspaces3.ownerId,
    createdAt: workspaces3.createdAt,
    updatedAt: workspaces3.updatedAt
  }).from(workspaceMembers3).innerJoin(workspaces3, eq5(workspaceMembers3.workspaceId, workspaces3.id)).where(eq5(workspaceMembers3.userId, userId));
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
  const existingWorkspaces = await db.select({ slug: workspaces3.slug }).from(workspaces3);
  const existingSlugs = existingWorkspaces.map((w) => w.slug);
  const slug = generateUniqueSlug(data.name, existingSlugs);
  const [newWorkspace] = await db.insert(workspaces3).values({
    name: data.name,
    slug,
    icon: "\u{1F4C1}",
    // Default icon
    ownerId: userId
  }).returning();
  await db.insert(workspaceMembers3).values({
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
  const [workspace] = await db.select().from(workspaces3).where(eq5(workspaces3.id, workspaceId)).limit(1);
  if (!workspace) {
    throw new HTTPException5(404, { message: "Workspace not found" });
  }
  const hasAccess = await checkAccess(workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException5(403, {
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
  const [workspace] = await db.select().from(workspaces3).where(eq5(workspaces3.slug, slug)).limit(1);
  if (!workspace) {
    throw new HTTPException5(404, { message: "Workspace not found" });
  }
  const hasAccess = await checkAccess(workspace.id, userId);
  if (!hasAccess) {
    throw new HTTPException5(403, {
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
  const [workspace] = await db.select().from(workspaces3).where(eq5(workspaces3.id, workspaceId)).limit(1);
  if (!workspace) {
    throw new HTTPException5(404, { message: "Workspace not found" });
  }
  if (workspace.ownerId !== userId) {
    throw new HTTPException5(403, {
      message: "Only the owner can update this workspace"
    });
  }
  if (data.slug && data.slug !== workspace.slug) {
    const [existing] = await db.select().from(workspaces3).where(eq5(workspaces3.slug, data.slug)).limit(1);
    if (existing) {
      throw new HTTPException5(409, { message: "Slug already in use" });
    }
  }
  const [updated] = await db.update(workspaces3).set({
    ...data,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq5(workspaces3.id, workspaceId)).returning();
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
  const [workspace] = await db.select().from(workspaces3).where(eq5(workspaces3.id, workspaceId)).limit(1);
  if (!workspace) {
    throw new HTTPException5(404, { message: "Workspace not found" });
  }
  if (workspace.ownerId !== userId) {
    throw new HTTPException5(403, {
      message: "Only the owner can delete this workspace"
    });
  }
  await db.delete(workspaces3).where(eq5(workspaces3.id, workspaceId));
}
async function checkAccess(workspaceId, userId) {
  const [workspace] = await db.select().from(workspaces3).where(and4(eq5(workspaces3.id, workspaceId), eq5(workspaces3.ownerId, userId))).limit(1);
  if (workspace) {
    return true;
  }
  const [member] = await db.select().from(workspaceMembers3).where(
    and4(
      eq5(workspaceMembers3.workspaceId, workspaceId),
      eq5(workspaceMembers3.userId, userId)
    )
  ).limit(1);
  return !!member;
}

// src/services/projects.ts
import { eq as eq6, and as and5 } from "drizzle-orm";
import { HTTPException as HTTPException6 } from "hono/http-exception";
import { projects as projects4 } from "@notto/shared/db";
async function list2(workspaceId, userId) {
  const hasAccess = await checkAccess(workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException6(403, {
      message: "Access denied to this workspace"
    });
  }
  const projectList = await db.select().from(projects4).where(eq6(projects4.workspaceId, workspaceId));
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
    throw new HTTPException6(403, {
      message: "Access denied to this workspace"
    });
  }
  const existingProjects = await db.select({ slug: projects4.slug }).from(projects4).where(eq6(projects4.workspaceId, workspaceId));
  const existingSlugs = existingProjects.map((p) => p.slug);
  const slug = generateUniqueSlug(data.name, existingSlugs);
  const [newProject] = await db.insert(projects4).values({
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
  const [project] = await db.select().from(projects4).where(eq6(projects4.id, projectId)).limit(1);
  if (!project) {
    throw new HTTPException6(404, { message: "Project not found" });
  }
  const hasAccess = await checkAccess(project.workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException6(403, { message: "Access denied to this project" });
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
  const [project] = await db.select().from(projects4).where(eq6(projects4.id, projectId)).limit(1);
  if (!project) {
    throw new HTTPException6(404, { message: "Project not found" });
  }
  const hasAccess = await checkAccess(project.workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException6(403, { message: "Access denied to this project" });
  }
  if (data.slug && data.slug !== project.slug) {
    const [existing] = await db.select().from(projects4).where(
      and5(
        eq6(projects4.workspaceId, project.workspaceId),
        eq6(projects4.slug, data.slug)
      )
    ).limit(1);
    if (existing) {
      throw new HTTPException6(409, {
        message: "Slug already in use in this workspace"
      });
    }
  }
  const [updated] = await db.update(projects4).set({
    ...data,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq6(projects4.id, projectId)).returning();
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
  const [project] = await db.select().from(projects4).where(eq6(projects4.id, projectId)).limit(1);
  if (!project) {
    throw new HTTPException6(404, { message: "Project not found" });
  }
  const hasAccess = await checkAccess(project.workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException6(403, { message: "Access denied to this project" });
  }
  await db.delete(projects4).where(eq6(projects4.id, projectId));
}
async function checkProjectAccess(projectId, userId) {
  const [project] = await db.select().from(projects4).where(eq6(projects4.id, projectId)).limit(1);
  if (!project) {
    return false;
  }
  return checkAccess(project.workspaceId, userId);
}

// src/routes/workspaces.ts
var workspaceRoutes = new Hono3();
workspaceRoutes.use("*", authMiddleware);
workspaceRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const workspaces5 = await list(userId);
  return c.json({ workspaces: workspaces5 });
});
workspaceRoutes.post(
  "/",
  zValidator3("json", createWorkspaceSchema),
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
  zValidator3("json", updateWorkspaceSchema),
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
  const projects6 = await list2(workspaceId, userId);
  return c.json({ projects: projects6 });
});
workspaceRoutes.post(
  "/:workspaceId/projects",
  zValidator3("json", createProjectSchema),
  async (c) => {
    const userId = c.get("userId");
    const workspaceId = c.req.param("workspaceId");
    const data = c.req.valid("json");
    const project = await create2(workspaceId, userId, data);
    return c.json({ project }, 201);
  }
);

// src/routes/projects.ts
import { Hono as Hono4 } from "hono";
import { zValidator as zValidator4 } from "@hono/zod-validator";
import { updateProjectSchema, createAnnotationSchema } from "@notto/shared";

// src/services/annotations.ts
import { eq as eq8 } from "drizzle-orm";
import { HTTPException as HTTPException9 } from "hono/http-exception";
import { annotations as annotations2, users as users4, projects as projects5 } from "@notto/shared/db";

// src/services/upload.ts
import { put } from "@vercel/blob";
import { HTTPException as HTTPException7 } from "hono/http-exception";
var MAX_FILE_SIZE = 10 * 1024 * 1024;
var MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024;
var ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
var ALLOWED_MIME_EXTENSIONS = {
  png: "png",
  jpeg: "jpg",
  gif: "gif",
  webp: "webp"
};
async function uploadScreenshot(file, userId) {
  if (file.size > MAX_FILE_SIZE) {
    throw new HTTPException7(413, { message: "File size exceeds 10MB limit" });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new HTTPException7(400, {
      message: "Invalid file type. Only PNG, JPEG, GIF, and WebP are allowed"
    });
  }
  const timestamp = Date.now();
  const extension = file.name.split(".").pop() || "png";
  const filename = `screenshots/${userId}/${timestamp}.${extension}`;
  try {
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true
    });
    return { url: blob.url };
  } catch (error) {
    console.error("Upload error:", error);
    throw new HTTPException7(500, { message: "Failed to upload file" });
  }
}
async function uploadBase64Screenshot(base64Data, userId) {
  const matches = base64Data.match(
    /^data:image\/(png|jpeg|gif|webp);base64,(.+)$/
  );
  if (!matches) {
    throw new HTTPException7(400, {
      message: "Invalid base64 image format. Expected data:image/(png|jpeg|gif|webp);base64,..."
    });
  }
  const [, mimeType, base64Content] = matches;
  let buffer;
  try {
    buffer = Buffer.from(base64Content, "base64");
  } catch {
    throw new HTTPException7(400, { message: "Invalid base64 encoding" });
  }
  if (buffer.length > MAX_FILE_SIZE) {
    throw new HTTPException7(413, { message: "File size exceeds 10MB limit" });
  }
  const timestamp = Date.now();
  const extension = ALLOWED_MIME_EXTENSIONS[mimeType] || "png";
  const filename = `screenshots/${userId}/${timestamp}.${extension}`;
  try {
    const blob = await put(filename, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: `image/${mimeType}`
    });
    return { url: blob.url };
  } catch (error) {
    console.error("Upload error:", error);
    throw new HTTPException7(500, { message: "Failed to upload file" });
  }
}
async function uploadProfilePicture(file, userId) {
  if (file.size > MAX_PROFILE_PICTURE_SIZE) {
    throw new HTTPException7(413, { message: "File size exceeds 5MB limit" });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new HTTPException7(400, {
      message: "Invalid file type. Only PNG, JPEG, GIF, and WebP are allowed"
    });
  }
  const timestamp = Date.now();
  const extension = file.name.split(".").pop() || "png";
  const filename = `profile-pictures/${userId}/${timestamp}.${extension}`;
  try {
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true
    });
    return { url: blob.url };
  } catch (error) {
    console.error("Profile picture upload error:", error);
    throw new HTTPException7(500, {
      message: "Failed to upload profile picture"
    });
  }
}

// src/services/integrations.ts
import { eq as eq7 } from "drizzle-orm";
import { HTTPException as HTTPException8 } from "hono/http-exception";
import { webhookIntegrations } from "@notto/shared/db";
function validateWebhookUrl(url) {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: "Webhook URL is required" };
  }
  const trimmedUrl = url.trim();
  if (!trimmedUrl.startsWith("https://")) {
    return { valid: false, error: "URL must be a valid HTTPS URL" };
  }
  try {
    const parsed = new URL(trimmedUrl);
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "URL must be a valid HTTPS URL" };
    }
  } catch {
    return { valid: false, error: "URL must be a valid HTTPS URL" };
  }
  return { valid: true };
}
function validateJsonTemplate(template) {
  if (!template || template.trim().length === 0) {
    return { valid: true };
  }
  const trimmedTemplate = template.trim();
  const placeholderRegex = /<[a-zA-Z_][a-zA-Z0-9_.]*>/g;
  let sanitizedTemplate = trimmedTemplate.replace(
    placeholderRegex,
    "__PLACEHOLDER__"
  );
  sanitizedTemplate = escapeNewlinesInStrings(sanitizedTemplate);
  try {
    JSON.parse(sanitizedTemplate);
    return { valid: true };
  } catch (e) {
    const error = e;
    return { valid: false, error: `Invalid JSON: ${error.message}` };
  }
}
function escapeNewlinesInStrings(json) {
  let result = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    if (escape) {
      result += char;
      escape = false;
      continue;
    }
    if (char === "\\") {
      result += char;
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    if (inString) {
      if (char === "\n") {
        result += "\\n";
      } else if (char === "\r") {
        result += "\\r";
      } else if (char === "	") {
        result += "\\t";
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }
  return result;
}
async function get3(projectId, userId) {
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    throw new HTTPException8(403, { message: "Access denied to this project" });
  }
  const [integration] = await db.select().from(webhookIntegrations).where(eq7(webhookIntegrations.projectId, projectId)).limit(1);
  if (!integration) {
    return null;
  }
  return {
    id: integration.id,
    projectId: integration.projectId,
    url: integration.url,
    headers: integration.headers || {},
    bodyTemplate: integration.bodyTemplate,
    enabled: integration.enabled,
    locked: integration.locked,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt
  };
}
async function upsert(projectId, userId, data) {
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    throw new HTTPException8(403, { message: "Access denied to this project" });
  }
  const urlValidation = validateWebhookUrl(data.url);
  if (!urlValidation.valid) {
    throw new HTTPException8(400, { message: urlValidation.error });
  }
  const templateValidation = validateJsonTemplate(data.bodyTemplate);
  if (!templateValidation.valid) {
    throw new HTTPException8(400, { message: templateValidation.error });
  }
  const [existing] = await db.select().from(webhookIntegrations).where(eq7(webhookIntegrations.projectId, projectId)).limit(1);
  if (existing) {
    if (existing.locked) {
      const isOnlyLockChange = data.url === existing.url && JSON.stringify(data.headers) === JSON.stringify(existing.headers) && data.bodyTemplate === existing.bodyTemplate && data.enabled === existing.enabled;
      if (!isOnlyLockChange) {
        throw new HTTPException8(403, {
          message: "Integration is locked and cannot be modified"
        });
      }
    }
    const [updated] = await db.update(webhookIntegrations).set({
      url: data.url.trim(),
      headers: data.headers,
      bodyTemplate: data.bodyTemplate,
      enabled: data.enabled,
      locked: data.locked,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq7(webhookIntegrations.projectId, projectId)).returning();
    return {
      id: updated.id,
      projectId: updated.projectId,
      url: updated.url,
      headers: updated.headers || {},
      bodyTemplate: updated.bodyTemplate,
      enabled: updated.enabled,
      locked: updated.locked,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };
  }
  const [created] = await db.insert(webhookIntegrations).values({
    projectId,
    url: data.url.trim(),
    headers: data.headers,
    bodyTemplate: data.bodyTemplate,
    enabled: data.enabled,
    locked: data.locked
  }).returning();
  return {
    id: created.id,
    projectId: created.projectId,
    url: created.url,
    headers: created.headers || {},
    bodyTemplate: created.bodyTemplate,
    enabled: created.enabled,
    locked: created.locked,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt
  };
}
async function remove3(projectId, userId) {
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    throw new HTTPException8(403, { message: "Access denied to this project" });
  }
  const [existing] = await db.select().from(webhookIntegrations).where(eq7(webhookIntegrations.projectId, projectId)).limit(1);
  if (!existing) {
    throw new HTTPException8(404, { message: "Integration not found" });
  }
  if (existing.locked) {
    throw new HTTPException8(403, {
      message: "Integration is locked and cannot be deleted"
    });
  }
  await db.delete(webhookIntegrations).where(eq7(webhookIntegrations.projectId, projectId));
}
async function test(projectId, userId, data) {
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    throw new HTTPException8(403, { message: "Access denied to this project" });
  }
  const urlValidation = validateWebhookUrl(data.url);
  if (!urlValidation.valid) {
    throw new HTTPException8(400, { message: urlValidation.error });
  }
  const templateValidation = validateJsonTemplate(data.bodyTemplate);
  if (!templateValidation.valid) {
    throw new HTTPException8(400, { message: templateValidation.error });
  }
  const sampleData = {
    title: "Sample Annotation",
    description: "This is a test webhook payload",
    url: "https://example.com/page",
    screenshot_url: "https://cdn.example.com/screenshot.png",
    page_title: "Example Page",
    priority: "medium",
    type: "bug",
    created_by: {
      name: "Test User",
      email: "test@example.com"
    },
    project: {
      name: "Test Project"
    },
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  let body = data.bodyTemplate || JSON.stringify(sampleData, null, 2);
  if (data.bodyTemplate) {
    const normalizedTemplate = escapeNewlinesInStrings(data.bodyTemplate);
    body = substituteVariables(normalizedTemplate, sampleData);
  }
  const headers = {
    "Content-Type": "application/json",
    ...data.headers
  };
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1e4);
    const response = await fetch(data.url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      return {
        success: true,
        statusCode: response.status,
        message: "Test webhook sent successfully!"
      };
    } else {
      return {
        success: false,
        statusCode: response.status,
        message: `Request failed with status ${response.status}`
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          message: "Request timed out after 10 seconds"
        };
      }
      return {
        success: false,
        message: `Request failed: ${error.message}`
      };
    }
    return {
      success: false,
      message: "Request failed with unknown error"
    };
  }
}
function substituteVariables(template, data) {
  const variableMap = {
    title: "title",
    description: "description",
    url: "url",
    screenshot_url: "screenshot_url",
    page_title: "page_title",
    priority: "priority",
    type: "type",
    "created_by.name": "created_by.name",
    "created_by.email": "created_by.email",
    "project.name": "project.name",
    created_at: "created_at"
  };
  return template.replace(/<([a-zA-Z_][a-zA-Z0-9_.]*)>/g, (match, variable) => {
    const trimmedVar = variable.trim();
    const path = variableMap[trimmedVar];
    if (path) {
      const value = getNestedValue(data, path);
      return value !== void 0 && value !== null ? String(value) : "";
    }
    return match;
  });
}
function getNestedValue(obj, path) {
  const keys = path.split(".");
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return void 0;
    }
  }
  return value;
}
async function getEnabledIntegration(projectId) {
  const [integration] = await db.select().from(webhookIntegrations).where(eq7(webhookIntegrations.projectId, projectId)).limit(1);
  if (!integration || !integration.enabled) {
    return null;
  }
  return {
    id: integration.id,
    projectId: integration.projectId,
    url: integration.url,
    headers: integration.headers || {},
    bodyTemplate: integration.bodyTemplate,
    enabled: integration.enabled,
    locked: integration.locked,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt
  };
}

// src/services/webhook-executor.ts
function substituteVariables2(template, data) {
  const variableMap = {
    title: "title",
    description: "description",
    url: "pageUrl",
    screenshot_url: "screenshotAnnotated",
    page_title: "pageTitle",
    priority: "priority",
    type: "type",
    "created_by.name": "createdBy.name",
    "created_by.email": "createdBy.email",
    "project.name": "project.name",
    created_at: "createdAt"
  };
  return template.replace(/<([a-zA-Z_][a-zA-Z0-9_.]*)>/g, (match, variable) => {
    const trimmedVar = variable.trim();
    const path = variableMap[trimmedVar];
    if (path) {
      const value = getNestedValue2(
        data,
        path
      );
      return value !== void 0 && value !== null ? String(value) : "";
    }
    return match;
  });
}
function getNestedValue2(obj, path) {
  const keys = path.split(".");
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return void 0;
    }
  }
  return value;
}
function escapeNewlinesInStrings2(json) {
  let result = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    if (escape) {
      result += char;
      escape = false;
      continue;
    }
    if (char === "\\") {
      result += char;
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    if (inString) {
      if (char === "\n") {
        result += "\\n";
      } else if (char === "\r") {
        result += "\\r";
      } else if (char === "	") {
        result += "\\t";
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }
  return result;
}
async function executeWebhook(integration, annotationData) {
  let body;
  if (integration.bodyTemplate) {
    const normalizedTemplate = escapeNewlinesInStrings2(
      integration.bodyTemplate
    );
    body = substituteVariables2(normalizedTemplate, annotationData);
  } else {
    body = JSON.stringify({
      event: "annotation.created",
      data: {
        id: annotationData.id,
        title: annotationData.title,
        description: annotationData.description,
        url: annotationData.pageUrl,
        screenshot_url: annotationData.screenshotAnnotated,
        page_title: annotationData.pageTitle,
        priority: annotationData.priority,
        type: annotationData.type,
        created_by: annotationData.createdBy,
        project: annotationData.project,
        created_at: annotationData.createdAt
      }
    });
  }
  const headers = {
    "Content-Type": "application/json",
    ...integration.headers
  };
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1e4);
    const response = await fetch(integration.url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.error(
        `Webhook failed for project ${integration.projectId}: Status ${response.status}`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `Webhook failed for project ${integration.projectId}: ${error.message}`
      );
    } else {
      console.error(
        `Webhook failed for project ${integration.projectId}: Unknown error`
      );
    }
  }
}
async function fireWebhookIfEnabled(projectId, annotationData) {
  const integration = await getEnabledIntegration(projectId);
  if (!integration) {
    return;
  }
  await executeWebhook(integration, annotationData);
}

// src/services/annotations.ts
async function list3(projectId, userId) {
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    throw new HTTPException9(403, { message: "Access denied to this project" });
  }
  const annotationList = await db.select().from(annotations2).where(eq8(annotations2.projectId, projectId));
  return annotationList.map((a) => ({
    id: a.id,
    projectId: a.projectId,
    userId: a.userId,
    title: a.title,
    description: a.description,
    type: a.type,
    priority: a.priority,
    status: a.status,
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
    throw new HTTPException9(403, { message: "Access denied to this project" });
  }
  let screenshotAnnotatedUrl = data.screenshotAnnotated || null;
  if (data.screenshotAnnotatedBase64) {
    const uploadResult = await uploadBase64Screenshot(
      data.screenshotAnnotatedBase64,
      userId
    );
    screenshotAnnotatedUrl = uploadResult.url;
  }
  const [newAnnotation] = await db.insert(annotations2).values({
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
  fireWebhookAsync(projectId, userId, newAnnotation);
  return {
    id: newAnnotation.id,
    projectId: newAnnotation.projectId,
    userId: newAnnotation.userId,
    title: newAnnotation.title,
    description: newAnnotation.description,
    type: newAnnotation.type,
    priority: newAnnotation.priority,
    status: newAnnotation.status,
    pageUrl: newAnnotation.pageUrl,
    pageTitle: newAnnotation.pageTitle,
    screenshotOriginal: newAnnotation.screenshotOriginal,
    screenshotAnnotated: newAnnotation.screenshotAnnotated,
    canvasData: newAnnotation.canvasData,
    createdAt: newAnnotation.createdAt,
    updatedAt: newAnnotation.updatedAt
  };
}
async function fireWebhookAsync(projectId, userId, annotation) {
  try {
    const [user] = await db.select({ name: users4.name, email: users4.email }).from(users4).where(eq8(users4.id, userId)).limit(1);
    const [project] = await db.select({ name: projects5.name }).from(projects5).where(eq8(projects5.id, projectId)).limit(1);
    if (!user || !project) {
      console.error("Webhook: Could not find user or project info");
      return;
    }
    await fireWebhookIfEnabled(projectId, {
      id: annotation.id,
      title: annotation.title,
      description: annotation.description,
      pageUrl: annotation.pageUrl,
      pageTitle: annotation.pageTitle,
      screenshotAnnotated: annotation.screenshotAnnotated,
      priority: annotation.priority,
      type: annotation.type,
      createdBy: {
        name: user.name || "Unknown",
        email: user.email
      },
      project: {
        name: project.name
      },
      createdAt: annotation.createdAt.toISOString()
    });
  } catch (error) {
    console.error("Webhook execution failed:", error);
  }
}
async function get4(annotationId, userId) {
  const [annotation] = await db.select().from(annotations2).where(eq8(annotations2.id, annotationId)).limit(1);
  if (!annotation) {
    throw new HTTPException9(404, { message: "Annotation not found" });
  }
  const hasAccess = await checkProjectAccess(annotation.projectId, userId);
  if (!hasAccess) {
    throw new HTTPException9(403, {
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
    status: annotation.status,
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
  const [annotation] = await db.select().from(annotations2).where(eq8(annotations2.id, annotationId)).limit(1);
  if (!annotation) {
    throw new HTTPException9(404, { message: "Annotation not found" });
  }
  const hasAccess = await checkProjectAccess(annotation.projectId, userId);
  if (!hasAccess) {
    throw new HTTPException9(403, {
      message: "Access denied to this annotation"
    });
  }
  const updateData = { updatedAt: /* @__PURE__ */ new Date() };
  if (data.title !== void 0) updateData.title = data.title;
  if (data.description !== void 0) updateData.description = data.description;
  if (data.type !== void 0) updateData.type = data.type;
  if (data.priority !== void 0) updateData.priority = data.priority;
  if (data.status !== void 0) updateData.status = data.status;
  if (data.pageUrl !== void 0) updateData.pageUrl = data.pageUrl;
  if (data.pageTitle !== void 0) updateData.pageTitle = data.pageTitle;
  if (data.screenshotOriginal !== void 0)
    updateData.screenshotOriginal = data.screenshotOriginal;
  if (data.screenshotAnnotated !== void 0)
    updateData.screenshotAnnotated = data.screenshotAnnotated;
  if (data.canvasData !== void 0) updateData.canvasData = data.canvasData;
  const [updated] = await db.update(annotations2).set(updateData).where(eq8(annotations2.id, annotationId)).returning();
  return {
    id: updated.id,
    projectId: updated.projectId,
    userId: updated.userId,
    title: updated.title,
    description: updated.description,
    type: updated.type,
    priority: updated.priority,
    status: updated.status,
    pageUrl: updated.pageUrl,
    pageTitle: updated.pageTitle,
    screenshotOriginal: updated.screenshotOriginal,
    screenshotAnnotated: updated.screenshotAnnotated,
    canvasData: updated.canvasData,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  };
}
async function remove4(annotationId, userId) {
  const [annotation] = await db.select().from(annotations2).where(eq8(annotations2.id, annotationId)).limit(1);
  if (!annotation) {
    throw new HTTPException9(404, { message: "Annotation not found" });
  }
  const hasAccess = await checkProjectAccess(annotation.projectId, userId);
  if (!hasAccess) {
    throw new HTTPException9(403, {
      message: "Access denied to this annotation"
    });
  }
  await db.delete(annotations2).where(eq8(annotations2.id, annotationId));
}

// src/routes/projects.ts
var projectRoutes = new Hono4();
projectRoutes.use("*", authMiddleware);
projectRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const projectId = c.req.param("id");
  const project = await get2(projectId, userId);
  return c.json({ project });
});
projectRoutes.patch(
  "/:id",
  zValidator4("json", updateProjectSchema),
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
  zValidator4("json", createAnnotationSchema),
  async (c) => {
    const userId = c.get("userId");
    const projectId = c.req.param("projectId");
    const data = c.req.valid("json");
    const annotation = await create3(projectId, userId, data);
    return c.json({ annotation }, 201);
  }
);

// src/routes/annotations.ts
import { Hono as Hono5 } from "hono";
import { zValidator as zValidator5 } from "@hono/zod-validator";
import { updateAnnotationSchema } from "@notto/shared";
var annotationRoutes = new Hono5();
annotationRoutes.use("*", authMiddleware);
annotationRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const annotationId = c.req.param("id");
  const annotation = await get4(annotationId, userId);
  return c.json({ annotation });
});
annotationRoutes.patch(
  "/:id",
  zValidator5("json", updateAnnotationSchema),
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
  await remove4(annotationId, userId);
  return c.body(null, 204);
});

// src/routes/upload.ts
import { Hono as Hono6 } from "hono";
import { HTTPException as HTTPException10 } from "hono/http-exception";
var uploadRoutes = new Hono6();
uploadRoutes.use("*", authMiddleware);
uploadRoutes.post("/screenshot", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!file || !(file instanceof File)) {
    throw new HTTPException10(400, { message: "No file provided" });
  }
  const result = await uploadScreenshot(file, userId);
  return c.json(result, 201);
});
uploadRoutes.post("/profile-picture", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!file || !(file instanceof File)) {
    throw new HTTPException10(400, { message: "No file provided" });
  }
  const result = await uploadProfilePicture(file, userId);
  return c.json(result, 201);
});

// src/routes/integrations.ts
import { Hono as Hono7 } from "hono";
import { zValidator as zValidator6 } from "@hono/zod-validator";
import { z as z2 } from "zod";
var integrationRoutes = new Hono7();
var webhookIntegrationSchema = z2.object({
  url: z2.string().min(1, "URL is required"),
  headers: z2.record(z2.string()).default({}),
  bodyTemplate: z2.string().default(""),
  enabled: z2.boolean().default(true),
  locked: z2.boolean().default(false)
});
integrationRoutes.use("*", authMiddleware);
integrationRoutes.get("/:projectId/integration", async (c) => {
  const userId = c.get("userId");
  const projectId = c.req.param("projectId");
  const integration = await get3(projectId, userId);
  return c.json({ integration });
});
integrationRoutes.put(
  "/:projectId/integration",
  zValidator6("json", webhookIntegrationSchema),
  async (c) => {
    const userId = c.get("userId");
    const projectId = c.req.param("projectId");
    const data = c.req.valid("json");
    const integration = await upsert(
      projectId,
      userId,
      data
    );
    return c.json({ integration });
  }
);
integrationRoutes.delete("/:projectId/integration", async (c) => {
  const userId = c.get("userId");
  const projectId = c.req.param("projectId");
  await remove3(projectId, userId);
  return c.body(null, 204);
});
integrationRoutes.post(
  "/:projectId/integration/test",
  zValidator6("json", webhookIntegrationSchema),
  async (c) => {
    const userId = c.get("userId");
    const projectId = c.req.param("projectId");
    const data = c.req.valid("json");
    const result = await test(projectId, userId, data);
    return c.json(result);
  }
);

// src/middleware/error-handler.ts
import { HTTPException as HTTPException11 } from "hono/http-exception";
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
  if (err instanceof HTTPException11) {
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
var app = new Hono8().basePath("/api");
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "http://localhost:3000";
      if (origin === "http://localhost:3000" || origin === "http://localhost:3001")
        return origin;
      if (origin === "https://notto-web.vercel.app") return origin;
      if (origin.startsWith("chrome-extension://")) return origin;
      if (process.env.NODE_ENV !== "production") {
        return origin;
      }
      return null;
    },
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Set-Cookie"]
  })
);
app.onError(errorHandler);
app.get("/", (c) => c.json({ status: "ok", service: "notto-api" }));
app.route("/auth", authRoutes);
app.route("/extension-auth", extensionAuthRoutes);
app.route("/workspaces", workspaceRoutes);
app.route("/projects", projectRoutes);
app.route("/annotations", annotationRoutes);
app.route("/upload", uploadRoutes);
app.route("/projects", integrationRoutes);
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
