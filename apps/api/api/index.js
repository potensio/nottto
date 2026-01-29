import {
  annotations,
  createSession,
  db,
  deleteAllUserSessions,
  deleteUser,
  extensionAuthSessions,
  generateTokens,
  generateUniqueSlug,
  getUser,
  login,
  magicLinkTokens,
  projects,
  rateLimitRecords,
  refresh,
  register,
  sessions,
  updateUser,
  users,
  validateSession,
  webhookIntegrations,
  workspaceInvitations,
  workspaceMembers,
  workspaces
} from "./chunk-GZMTDH7Q.js";

// src/index.ts
import { Hono as Hono9 } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// src/routes/auth.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { setCookie, deleteCookie } from "hono/cookie";

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
  name: z.string().min(1, "Full name is required").max(255).optional(),
  extensionSession: z.string().max(64).optional()
  // Extension auth session ID
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
var annotationStatusSchema = z.enum(["open", "done"]);
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
  status: annotationStatusSchema.optional(),
  pageUrl: z.string().url("Invalid URL").optional().nullable(),
  pageTitle: z.string().max(255).optional().nullable(),
  screenshotOriginal: z.string().url("Invalid URL").optional().nullable(),
  screenshotAnnotated: z.string().url("Invalid URL").optional().nullable(),
  canvasData: z.any().optional().nullable()
});
var updateUserProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).optional(),
  profilePicture: z.string().url("Invalid URL").optional().nullable()
});
var updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "member"], {
    errorMap: () => ({ message: "Role must be either 'admin' or 'member'" })
  })
});
var createInvitationSchema = z.object({
  email: z.string().email("Invalid email format"),
  role: z.enum(["admin", "member"], {
    errorMap: () => ({ message: "Role must be either 'admin' or 'member'" })
  })
});

// src/middleware/auth.ts
import { HTTPException } from "hono/http-exception";
import { getCookie } from "hono/cookie";
import { jwtVerify } from "jose";
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
      const { payload } = await jwtVerify(token, secret);
      if (!payload.sub || !payload.email) {
        throw new HTTPException(401, { message: "Invalid token payload" });
      }
      c.set("userId", payload.sub);
      c.set("userEmail", payload.email);
      await next();
      return;
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(401, { message: "Invalid or expired token" });
    }
  }
  throw new HTTPException(401, {
    message: "Missing or invalid authentication"
  });
}

// src/services/magic-link.ts
import { eq as eq2, and as and2, isNull } from "drizzle-orm";
import { HTTPException as HTTPException2 } from "hono/http-exception";

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

// src/templates/invitation-email.ts
function getInvitationEmailHtml({
  inviteeName,
  inviterName,
  workspaceName,
  workspaceIcon,
  role,
  acceptUrl,
  declineUrl,
  expiresAt
}) {
  const greeting = inviteeName ? `Hi ${inviteeName}` : "Hi there";
  const inviterText = inviterName || "Someone";
  const roleText = role === "admin" ? "an admin" : "a member";
  const expirationDate = expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to join ${workspaceName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 560px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
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
                You're invited to join a workspace
              </h1>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #525252;">
                ${greeting},
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #525252;">
                ${inviterText} has invited you to join <strong style="color: #171717;">${workspaceIcon} ${workspaceName}</strong> as ${roleText}.
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #525252;">
                Click the button below to accept the invitation and start collaborating.
              </p>
              
              <!-- CTA Buttons -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${acceptUrl}" style="display: inline-block; padding: 14px 32px; background-color: #171717; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500; border-radius: 8px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${declineUrl}" style="display: inline-block; padding: 12px 24px; background-color: transparent; color: #737373; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 8px;">
                      Decline
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 14px; line-height: 20px; color: #737373; text-align: center;">
                This invitation expires on <strong>${expirationDate}</strong>
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
                <a href="${acceptUrl}" style="color: #f97316; text-decoration: none;">${acceptUrl}</a>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Brand Footer -->
        <table role="presentation" style="width: 100%; max-width: 560px; border-collapse: collapse;">
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
function getInvitationEmailText({
  inviteeName,
  inviterName,
  workspaceName,
  workspaceIcon,
  role,
  acceptUrl,
  declineUrl,
  expiresAt
}) {
  const greeting = inviteeName ? `Hi ${inviteeName}` : "Hi there";
  const inviterText = inviterName || "Someone";
  const roleText = role === "admin" ? "an admin" : "a member";
  const expirationDate = expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  return `
You're invited to join ${workspaceIcon} ${workspaceName}

${greeting},

${inviterText} has invited you to join ${workspaceIcon} ${workspaceName} as ${roleText}.

Role: ${role.charAt(0).toUpperCase() + role.slice(1)}

To accept this invitation, click the link below:
${acceptUrl}

To decline this invitation, click here:
${declineUrl}

This invitation expires on ${expirationDate}.

If you didn't expect this invitation, you can safely ignore this email.

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
async function sendInvitationEmail(email, invitationData) {
  if (EMAIL_MODE === "development") {
    console.log("\n" + "=".repeat(60));
    console.log("\u{1F4E8} WORKSPACE INVITATION (dev mode - no email sent)");
    console.log("=".repeat(60));
    console.log(`\u{1F4E7} Email: ${email}`);
    console.log(
      `\u{1F3E2} Workspace: ${invitationData.workspaceIcon} ${invitationData.workspaceName}`
    );
    console.log(`\u{1F464} Inviter: ${invitationData.inviterName || "Unknown"}`);
    console.log(`\u{1F3AD} Role: ${invitationData.role}`);
    console.log(`\u2705 Accept: ${invitationData.acceptUrl}`);
    console.log(`\u274C Decline: ${invitationData.declineUrl}`);
    console.log(`\u23F0 Expires: ${invitationData.expiresAt.toISOString()}`);
    console.log("=".repeat(60) + "\n");
    return { success: true };
  }
  try {
    const { error } = await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `You're invited to join ${invitationData.workspaceName}`,
      html: getInvitationEmailHtml(invitationData),
      text: getInvitationEmailText(invitationData)
    });
    if (error) {
      console.error("Failed to send invitation email:", {
        email: maskEmailForLog(email),
        workspace: invitationData.workspaceName,
        error: error.message
      });
      return { success: false, error: error.message };
    }
    console.log("Invitation email sent:", {
      email: maskEmailForLog(email),
      workspace: invitationData.workspaceName,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    console.error("Failed to send invitation email:", {
      email: maskEmailForLog(email),
      workspace: invitationData.workspaceName,
      error: errorMessage
    });
    return { success: false, error: errorMessage };
  }
}

// src/services/rate-limiter.ts
import { eq, and, gte, lt } from "drizzle-orm";
var MAGIC_LINK_LIMIT = 5;
var WINDOW_HOURS = 1;
async function checkMagicLinkLimit(email) {
  const windowStart = getWindowStart();
  const requests = await db.select().from(rateLimitRecords).where(
    and(
      eq(rateLimitRecords.identifier, email.toLowerCase()),
      eq(rateLimitRecords.action, "magic_link"),
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
    throw new HTTPException2(429, {
      message: "Too many requests. Please try again later.",
      // @ts-ignore - Adding custom property for retry-after
      retryAfter: rateLimit.retryAfter
    });
  }
  const [existingUser] = await db.select().from(users).where(eq2(users.email, normalizedEmail)).limit(1);
  if (isRegister) {
    if (existingUser) {
      throw new HTTPException2(409, {
        message: "An account with this email already exists. Please login instead."
      });
    }
    if (!name || name.trim().length === 0) {
      throw new HTTPException2(400, {
        message: "Full name is required for registration."
      });
    }
  } else {
    if (!existingUser) {
      throw new HTTPException2(404, {
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
    throw new HTTPException2(500, {
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
      eq2(magicLinkTokens.tokenHash, tokenHash),
      isNull(magicLinkTokens.usedAt)
    )
  ).limit(1);
  if (!tokenRecord) {
    throw new HTTPException2(401, {
      message: "Invalid or expired link. Please request a new one."
    });
  }
  if (isTokenExpired(tokenRecord.expiresAt)) {
    await db.update(magicLinkTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(eq2(magicLinkTokens.id, tokenRecord.id));
    throw new HTTPException2(401, {
      message: "This link has expired. Please request a new one."
    });
  }
  await db.update(magicLinkTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(eq2(magicLinkTokens.id, tokenRecord.id));
  let [existingUser] = await db.select().from(users).where(eq2(users.email, tokenRecord.email)).limit(1);
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
    const existingProjects = await db.select({ slug: projects.slug }).from(projects).where(eq2(projects.workspaceId, newWorkspace.id));
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
import { z as z2 } from "zod";

// src/services/extension-auth.ts
import { eq as eq3, and as and3, gt, lt as lt2 } from "drizzle-orm";
import { HTTPException as HTTPException3 } from "hono/http-exception";
import { nanoid } from "nanoid";
var SESSION_EXPIRY_MS = 10 * 60 * 1e3;
async function createAuthSession() {
  const sessionId = nanoid(32);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
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
  const [session] = await db.select().from(extensionAuthSessions).where(eq3(extensionAuthSessions.id, sessionId)).limit(1);
  if (!session) {
    throw new HTTPException3(404, { message: "Session not found" });
  }
  if (/* @__PURE__ */ new Date() > session.expiresAt) {
    await db.delete(extensionAuthSessions).where(eq3(extensionAuthSessions.id, sessionId));
    return { status: "expired" };
  }
  if (session.status === "pending") {
    return { status: "pending" };
  }
  if (session.status === "completed" && session.userId) {
    const [user] = await db.select().from(users).where(eq3(users.id, session.userId)).limit(1);
    if (!user) {
      throw new HTTPException3(404, { message: "User not found" });
    }
    const tokens = await generateTokens({
      sub: user.id,
      email: user.email
    });
    await db.delete(extensionAuthSessions).where(eq3(extensionAuthSessions.id, sessionId));
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
      eq3(extensionAuthSessions.id, sessionId),
      gt(extensionAuthSessions.expiresAt, /* @__PURE__ */ new Date())
    )
  ).limit(1);
  if (!session) {
    throw new HTTPException3(404, {
      message: "Session not found or expired"
    });
  }
  if (session.status === "completed") {
    throw new HTTPException3(400, {
      message: "Session already completed"
    });
  }
  await db.update(extensionAuthSessions).set({
    status: "completed",
    userId,
    completedAt: /* @__PURE__ */ new Date()
  }).where(eq3(extensionAuthSessions.id, sessionId));
  return { success: true };
}
async function deleteAuthSession(sessionId) {
  await db.delete(extensionAuthSessions).where(eq3(extensionAuthSessions.id, sessionId));
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
var completeSessionSchema = z2.object({
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

// src/services/workspaces.ts
import { eq as eq4, and as and4 } from "drizzle-orm";
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
  const [workspace] = await db.select().from(workspaces).where(and4(eq4(workspaces.id, workspaceId), eq4(workspaces.ownerId, userId))).limit(1);
  if (workspace) {
    return true;
  }
  const [member] = await db.select().from(workspaceMembers).where(
    and4(
      eq4(workspaceMembers.workspaceId, workspaceId),
      eq4(workspaceMembers.userId, userId)
    )
  ).limit(1);
  return !!member;
}

// src/services/projects.ts
import { eq as eq5, and as and5 } from "drizzle-orm";
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
      and5(
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

// src/services/members.ts
import { eq as eq6, and as and6 } from "drizzle-orm";
import { HTTPException as HTTPException6 } from "hono/http-exception";
var PERMISSIONS = {
  owner: [
    "invite_members",
    "manage_members",
    "update_workspace",
    "delete_workspace",
    "create_project",
    "view_workspace"
  ],
  admin: [
    "invite_members",
    "manage_members",
    "create_project",
    "view_workspace"
  ],
  member: ["create_project", "view_workspace"]
};
async function listWorkspaceMembers(workspaceId, userId) {
  const hasPermission = await checkPermission(
    workspaceId,
    userId,
    "view_workspace"
  );
  if (!hasPermission) {
    throw new HTTPException6(403, {
      message: "You do not have permission to view this workspace"
    });
  }
  const members = await db.select({
    id: workspaceMembers.id,
    workspaceId: workspaceMembers.workspaceId,
    userId: workspaceMembers.userId,
    role: workspaceMembers.role,
    createdAt: workspaceMembers.createdAt,
    user: {
      id: users.id,
      email: users.email,
      name: users.name,
      profilePicture: users.profilePicture
    }
  }).from(workspaceMembers).innerJoin(users, eq6(workspaceMembers.userId, users.id)).where(eq6(workspaceMembers.workspaceId, workspaceId));
  return members;
}
async function updateMemberRole(workspaceId, memberId, userId, newRole) {
  const hasPermission = await checkPermission(
    workspaceId,
    userId,
    "manage_members"
  );
  if (!hasPermission) {
    throw new HTTPException6(403, {
      message: "You do not have permission to manage members in this workspace"
    });
  }
  const [member] = await db.select().from(workspaceMembers).where(eq6(workspaceMembers.id, memberId)).limit(1);
  if (!member) {
    throw new HTTPException6(404, { message: "Member not found" });
  }
  if (member.workspaceId !== workspaceId) {
    throw new HTTPException6(404, { message: "Member not found" });
  }
  if (member.userId === userId) {
    throw new HTTPException6(403, {
      message: "Cannot change your own role"
    });
  }
  if (member.role === "owner") {
    throw new HTTPException6(403, {
      message: "Cannot change the owner's role"
    });
  }
  const [updatedMember] = await db.update(workspaceMembers).set({ role: newRole }).where(eq6(workspaceMembers.id, memberId)).returning();
  const [user] = await db.select().from(users).where(eq6(users.id, updatedMember.userId)).limit(1);
  return {
    id: updatedMember.id,
    workspaceId: updatedMember.workspaceId,
    userId: updatedMember.userId,
    role: updatedMember.role,
    createdAt: updatedMember.createdAt,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture
    }
  };
}
async function removeMember(workspaceId, memberId, userId) {
  const hasPermission = await checkPermission(
    workspaceId,
    userId,
    "manage_members"
  );
  if (!hasPermission) {
    throw new HTTPException6(403, {
      message: "You do not have permission to manage members in this workspace"
    });
  }
  const [member] = await db.select().from(workspaceMembers).where(eq6(workspaceMembers.id, memberId)).limit(1);
  if (!member) {
    throw new HTTPException6(404, { message: "Member not found" });
  }
  if (member.workspaceId !== workspaceId) {
    throw new HTTPException6(404, { message: "Member not found" });
  }
  if (member.userId === userId) {
    throw new HTTPException6(403, {
      message: "Cannot remove yourself from the workspace"
    });
  }
  if (member.role === "owner") {
    throw new HTTPException6(403, {
      message: "Cannot remove the workspace owner"
    });
  }
  await db.delete(workspaceMembers).where(eq6(workspaceMembers.id, memberId));
}
async function checkPermission(workspaceId, userId, action) {
  const [workspace] = await db.select().from(workspaces).where(eq6(workspaces.id, workspaceId)).limit(1);
  if (!workspace) {
    return false;
  }
  if (workspace.ownerId === userId) {
    const ownerPermissions = PERMISSIONS.owner;
    return ownerPermissions.includes(action);
  }
  const [member] = await db.select({ role: workspaceMembers.role }).from(workspaceMembers).where(
    and6(
      eq6(workspaceMembers.workspaceId, workspaceId),
      eq6(workspaceMembers.userId, userId)
    )
  ).limit(1);
  if (!member) {
    return false;
  }
  const userRole = member.role;
  const rolePermissions = PERMISSIONS[userRole];
  if (!rolePermissions) {
    return false;
  }
  return rolePermissions.includes(action);
}

// src/services/invitations.ts
import { eq as eq7, and as and7, lt as lt3, or as or2 } from "drizzle-orm";
import { HTTPException as HTTPException7 } from "hono/http-exception";
import { nanoid as nanoid2 } from "nanoid";
var INVITATION_EXPIRY_DAYS = 7;
var MAX_PENDING_INVITATIONS = 5;
var WEB_URL2 = process.env.WEB_URL || "http://localhost:3000";
async function createInvitation(workspaceId, inviterUserId, inviteeEmail, role) {
  const normalizedEmail = inviteeEmail.toLowerCase().trim();
  const [workspace] = await db.select().from(workspaces).where(eq7(workspaces.id, workspaceId)).limit(1);
  if (!workspace) {
    throw new HTTPException7(404, { message: "Workspace not found" });
  }
  const hasPermission = await checkPermission(
    workspaceId,
    inviterUserId,
    "invite_members"
  );
  if (!hasPermission) {
    throw new HTTPException7(403, {
      message: "You do not have permission to invite members to this workspace"
    });
  }
  const [existingMember] = await db.select({ userId: workspaceMembers.userId }).from(workspaceMembers).innerJoin(users, eq7(workspaceMembers.userId, users.id)).where(
    and7(
      eq7(workspaceMembers.workspaceId, workspaceId),
      eq7(users.email, normalizedEmail)
    )
  ).limit(1);
  if (existingMember) {
    throw new HTTPException7(409, {
      message: "User is already a member of this workspace"
    });
  }
  const [existingInvitation] = await db.select().from(workspaceInvitations).where(
    and7(
      eq7(workspaceInvitations.workspaceId, workspaceId),
      eq7(workspaceInvitations.inviteeEmail, normalizedEmail),
      eq7(workspaceInvitations.status, "pending")
    )
  ).limit(1);
  if (existingInvitation) {
    throw new HTTPException7(409, {
      message: "A pending invitation already exists for this email"
    });
  }
  const pendingInvitations = await db.select({ id: workspaceInvitations.id }).from(workspaceInvitations).where(
    and7(
      eq7(workspaceInvitations.workspaceId, workspaceId),
      eq7(workspaceInvitations.status, "pending")
    )
  );
  if (pendingInvitations.length >= MAX_PENDING_INVITATIONS) {
    throw new HTTPException7(400, {
      message: `Maximum of ${MAX_PENDING_INVITATIONS} pending invitations reached`
    });
  }
  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const expiresAt = /* @__PURE__ */ new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);
  const [invitation] = await db.insert(workspaceInvitations).values({
    workspaceId,
    inviterUserId,
    inviteeEmail: normalizedEmail,
    role,
    tokenHash,
    status: "pending",
    expiresAt
  }).returning();
  const [inviter] = await db.select({
    name: users.name,
    email: users.email
  }).from(users).where(eq7(users.id, inviterUserId)).limit(1);
  const acceptUrl = `${WEB_URL2}/invitations/${encodeURIComponent(token)}`;
  const declineUrl = `${WEB_URL2}/invitations/${encodeURIComponent(token)}/decline`;
  const emailResult = await sendInvitationEmail(normalizedEmail, {
    inviteeName: null,
    // We don't know if they have an account yet
    inviterName: inviter?.name || null,
    workspaceName: workspace.name,
    workspaceIcon: workspace.icon,
    role,
    acceptUrl,
    declineUrl,
    expiresAt
  });
  if (!emailResult.success) {
    console.error("Failed to send invitation email:", {
      invitationId: invitation.id,
      email: normalizedEmail,
      error: emailResult.error
    });
  }
  return {
    invitation: {
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      inviterUserId: invitation.inviterUserId,
      inviteeEmail: invitation.inviteeEmail,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt
    },
    token
    // Return the plain token for email sending
  };
}
async function verifyInvitationToken(token) {
  const tokenHash = hashToken(token);
  const [invitationRecord] = await db.select({
    invitation: workspaceInvitations,
    workspace: {
      id: workspaces.id,
      name: workspaces.name,
      icon: workspaces.icon
    },
    inviter: {
      name: users.name,
      email: users.email
    }
  }).from(workspaceInvitations).innerJoin(workspaces, eq7(workspaceInvitations.workspaceId, workspaces.id)).innerJoin(users, eq7(workspaceInvitations.inviterUserId, users.id)).where(eq7(workspaceInvitations.tokenHash, tokenHash)).limit(1);
  if (!invitationRecord) {
    throw new HTTPException7(404, {
      message: "Invalid invitation link"
    });
  }
  const { invitation, workspace, inviter } = invitationRecord;
  if (/* @__PURE__ */ new Date() > invitation.expiresAt) {
    throw new HTTPException7(410, {
      message: "This invitation has expired"
    });
  }
  if (invitation.status !== "pending") {
    throw new HTTPException7(410, {
      message: `This invitation has already been ${invitation.status}`
    });
  }
  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq7(users.email, invitation.inviteeEmail)).limit(1);
  return {
    invitation: {
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      inviterUserId: invitation.inviterUserId,
      inviteeEmail: invitation.inviteeEmail,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      icon: workspace.icon
    },
    inviter: {
      name: inviter.name,
      email: inviter.email
    },
    userExists: !!existingUser
  };
}
async function acceptInvitation(token, userId, fullName) {
  const { invitation } = await verifyInvitationToken(token);
  let actualUserId = userId;
  let sessionToken;
  let createdUser;
  if (!actualUserId) {
    const [existingUser] = await db.select({ id: users.id, email: users.email, name: users.name }).from(users).where(eq7(users.email, invitation.inviteeEmail)).limit(1);
    if (existingUser) {
      actualUserId = existingUser.id;
      sessionToken = nanoid2(64);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3);
      await db.insert(sessions).values({
        userId: actualUserId,
        sessionToken,
        expiresAt
      });
      createdUser = existingUser;
    } else {
      const [newUser] = await db.insert(users).values({
        email: invitation.inviteeEmail,
        name: fullName || null,
        passwordHash: null
      }).returning();
      actualUserId = newUser.id;
      sessionToken = nanoid2(64);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3);
      await db.insert(sessions).values({
        userId: actualUserId,
        sessionToken,
        expiresAt
      });
      createdUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      };
    }
  } else {
    const [user] = await db.select({ email: users.email }).from(users).where(eq7(users.id, actualUserId)).limit(1);
    if (!user) {
      throw new HTTPException7(404, { message: "User not found" });
    }
    if (user.email.toLowerCase() !== invitation.inviteeEmail.toLowerCase()) {
      throw new HTTPException7(403, {
        message: "This invitation was sent to a different email address"
      });
    }
  }
  const [existingMember] = await db.select().from(workspaceMembers).where(
    and7(
      eq7(workspaceMembers.workspaceId, invitation.workspaceId),
      eq7(workspaceMembers.userId, actualUserId)
    )
  ).limit(1);
  if (existingMember) {
    throw new HTTPException7(409, {
      message: "You are already a member of this workspace"
    });
  }
  await db.insert(workspaceMembers).values({
    workspaceId: invitation.workspaceId,
    userId: actualUserId,
    role: invitation.role
  });
  await db.update(workspaceInvitations).set({
    status: "accepted",
    acceptedAt: /* @__PURE__ */ new Date()
  }).where(eq7(workspaceInvitations.id, invitation.id));
  const [workspace] = await db.select({
    id: workspaces.id,
    name: workspaces.name,
    slug: workspaces.slug,
    icon: workspaces.icon
  }).from(workspaces).where(eq7(workspaces.id, invitation.workspaceId)).limit(1);
  if (!workspace) {
    throw new HTTPException7(404, { message: "Workspace not found" });
  }
  return {
    workspace,
    role: invitation.role,
    sessionToken,
    user: createdUser
  };
}
async function declineInvitation(token) {
  const { invitation } = await verifyInvitationToken(token);
  await db.update(workspaceInvitations).set({
    status: "declined",
    declinedAt: /* @__PURE__ */ new Date()
  }).where(eq7(workspaceInvitations.id, invitation.id));
}
async function listPendingInvitations(workspaceId, userId) {
  const hasPermission = await checkPermission(
    workspaceId,
    userId,
    "invite_members"
  );
  if (!hasPermission) {
    throw new HTTPException7(403, {
      message: "You do not have permission to view invitations for this workspace"
    });
  }
  const invitations = await db.select({
    id: workspaceInvitations.id,
    inviteeEmail: workspaceInvitations.inviteeEmail,
    role: workspaceInvitations.role,
    createdAt: workspaceInvitations.createdAt,
    expiresAt: workspaceInvitations.expiresAt,
    inviter: {
      name: users.name,
      email: users.email
    }
  }).from(workspaceInvitations).innerJoin(users, eq7(workspaceInvitations.inviterUserId, users.id)).where(
    and7(
      eq7(workspaceInvitations.workspaceId, workspaceId),
      eq7(workspaceInvitations.status, "pending")
    )
  ).orderBy(workspaceInvitations.createdAt);
  return invitations;
}
async function cancelInvitation(invitationId, userId) {
  const [invitation] = await db.select({
    id: workspaceInvitations.id,
    workspaceId: workspaceInvitations.workspaceId,
    status: workspaceInvitations.status
  }).from(workspaceInvitations).where(eq7(workspaceInvitations.id, invitationId)).limit(1);
  if (!invitation) {
    throw new HTTPException7(404, { message: "Invitation not found" });
  }
  const hasPermission = await checkPermission(
    invitation.workspaceId,
    userId,
    "invite_members"
  );
  if (!hasPermission) {
    throw new HTTPException7(403, {
      message: "You do not have permission to cancel invitations for this workspace"
    });
  }
  if (invitation.status !== "pending") {
    throw new HTTPException7(409, {
      message: `Cannot cancel invitation that is already ${invitation.status}`
    });
  }
  await db.update(workspaceInvitations).set({
    status: "cancelled"
  }).where(eq7(workspaceInvitations.id, invitationId));
}
async function resendInvitation(invitationId, userId) {
  const [invitationRecord] = await db.select({
    invitation: workspaceInvitations,
    workspace: {
      id: workspaces.id,
      name: workspaces.name,
      icon: workspaces.icon
    },
    inviter: {
      name: users.name,
      email: users.email
    }
  }).from(workspaceInvitations).innerJoin(workspaces, eq7(workspaceInvitations.workspaceId, workspaces.id)).innerJoin(users, eq7(workspaceInvitations.inviterUserId, users.id)).where(eq7(workspaceInvitations.id, invitationId)).limit(1);
  if (!invitationRecord) {
    throw new HTTPException7(404, { message: "Invitation not found" });
  }
  const { invitation, workspace, inviter } = invitationRecord;
  const hasPermission = await checkPermission(
    invitation.workspaceId,
    userId,
    "invite_members"
  );
  if (!hasPermission) {
    throw new HTTPException7(403, {
      message: "You do not have permission to resend invitations for this workspace"
    });
  }
  if (invitation.status !== "pending") {
    throw new HTTPException7(409, {
      message: `Cannot resend invitation that is ${invitation.status}`
    });
  }
  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const expiresAt = /* @__PURE__ */ new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);
  const [updatedInvitation] = await db.update(workspaceInvitations).set({
    tokenHash,
    expiresAt
  }).where(eq7(workspaceInvitations.id, invitationId)).returning();
  const acceptUrl = `${WEB_URL2}/invitations/${encodeURIComponent(token)}`;
  const declineUrl = `${WEB_URL2}/invitations/${encodeURIComponent(token)}/decline`;
  const emailResult = await sendInvitationEmail(invitation.inviteeEmail, {
    inviteeName: null,
    // We don't know if they have an account yet
    inviterName: inviter.name,
    workspaceName: workspace.name,
    workspaceIcon: workspace.icon,
    role: invitation.role,
    acceptUrl,
    declineUrl,
    expiresAt
  });
  if (!emailResult.success) {
    console.error("Failed to send invitation email:", {
      invitationId: invitation.id,
      email: invitation.inviteeEmail,
      error: emailResult.error
    });
  }
  return {
    invitation: {
      id: updatedInvitation.id,
      workspaceId: updatedInvitation.workspaceId,
      inviterUserId: updatedInvitation.inviterUserId,
      inviteeEmail: updatedInvitation.inviteeEmail,
      role: updatedInvitation.role,
      status: updatedInvitation.status,
      expiresAt: updatedInvitation.expiresAt,
      createdAt: updatedInvitation.createdAt
    },
    token,
    // Return the plain token for email sending
    workspace: {
      id: workspace.id,
      name: workspace.name,
      icon: workspace.icon
    },
    inviter: {
      name: inviter.name,
      email: inviter.email
    }
  };
}

// src/routes/workspaces.ts
var workspaceRoutes = new Hono3();
workspaceRoutes.use("*", authMiddleware);
workspaceRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const workspaces3 = await list(userId);
  return c.json({ workspaces: workspaces3 });
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
  const projects3 = await list2(workspaceId, userId);
  return c.json({ projects: projects3 });
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
workspaceRoutes.get("/:workspaceId/members", async (c) => {
  const userId = c.get("userId");
  const workspaceId = c.req.param("workspaceId");
  const members = await listWorkspaceMembers(workspaceId, userId);
  return c.json({ members });
});
workspaceRoutes.patch(
  "/:workspaceId/members/:memberId",
  zValidator3("json", updateMemberRoleSchema),
  async (c) => {
    const userId = c.get("userId");
    const workspaceId = c.req.param("workspaceId");
    const memberId = c.req.param("memberId");
    const { role } = c.req.valid("json");
    const member = await updateMemberRole(
      workspaceId,
      memberId,
      userId,
      role
    );
    return c.json({ member });
  }
);
workspaceRoutes.delete("/:workspaceId/members/:memberId", async (c) => {
  const userId = c.get("userId");
  const workspaceId = c.req.param("workspaceId");
  const memberId = c.req.param("memberId");
  await removeMember(workspaceId, memberId, userId);
  return c.body(null, 204);
});
workspaceRoutes.post(
  "/:workspaceId/invitations",
  zValidator3("json", createInvitationSchema),
  async (c) => {
    const userId = c.get("userId");
    const workspaceId = c.req.param("workspaceId");
    const { email, role } = c.req.valid("json");
    const result = await createInvitation(
      workspaceId,
      userId,
      email,
      role
    );
    return c.json({ invitation: result.invitation }, 201);
  }
);
workspaceRoutes.get("/:workspaceId/invitations", async (c) => {
  const userId = c.get("userId");
  const workspaceId = c.req.param("workspaceId");
  const invitations = await listPendingInvitations(
    workspaceId,
    userId
  );
  return c.json({ invitations });
});
workspaceRoutes.delete("/:workspaceId/invitations/:inviteId", async (c) => {
  const userId = c.get("userId");
  const inviteId = c.req.param("inviteId");
  await cancelInvitation(inviteId, userId);
  return c.body(null, 204);
});
workspaceRoutes.post(
  "/:workspaceId/invitations/:inviteId/resend",
  async (c) => {
    const userId = c.get("userId");
    const inviteId = c.req.param("inviteId");
    const result = await resendInvitation(inviteId, userId);
    return c.json({ invitation: result.invitation });
  }
);

// src/routes/projects.ts
import { Hono as Hono4 } from "hono";
import { zValidator as zValidator4 } from "@hono/zod-validator";

// src/services/annotations.ts
import { eq as eq9 } from "drizzle-orm";
import { HTTPException as HTTPException10 } from "hono/http-exception";

// src/services/upload.ts
import { put } from "@vercel/blob";
import { HTTPException as HTTPException8 } from "hono/http-exception";
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
    throw new HTTPException8(413, { message: "File size exceeds 10MB limit" });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new HTTPException8(400, {
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
    throw new HTTPException8(500, { message: "Failed to upload file" });
  }
}
async function uploadBase64Screenshot(base64Data, userId) {
  const matches = base64Data.match(
    /^data:image\/(png|jpeg|gif|webp);base64,(.+)$/
  );
  if (!matches) {
    throw new HTTPException8(400, {
      message: "Invalid base64 image format. Expected data:image/(png|jpeg|gif|webp);base64,..."
    });
  }
  const [, mimeType, base64Content] = matches;
  let buffer;
  try {
    buffer = Buffer.from(base64Content, "base64");
  } catch {
    throw new HTTPException8(400, { message: "Invalid base64 encoding" });
  }
  if (buffer.length > MAX_FILE_SIZE) {
    throw new HTTPException8(413, { message: "File size exceeds 10MB limit" });
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
    throw new HTTPException8(500, { message: "Failed to upload file" });
  }
}
async function uploadProfilePicture(file, userId) {
  if (file.size > MAX_PROFILE_PICTURE_SIZE) {
    throw new HTTPException8(413, { message: "File size exceeds 5MB limit" });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new HTTPException8(400, {
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
    throw new HTTPException8(500, {
      message: "Failed to upload profile picture"
    });
  }
}

// src/services/integrations.ts
import { eq as eq8 } from "drizzle-orm";
import { HTTPException as HTTPException9 } from "hono/http-exception";
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
    throw new HTTPException9(403, { message: "Access denied to this project" });
  }
  const [integration] = await db.select().from(webhookIntegrations).where(eq8(webhookIntegrations.projectId, projectId)).limit(1);
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
    throw new HTTPException9(403, { message: "Access denied to this project" });
  }
  const urlValidation = validateWebhookUrl(data.url);
  if (!urlValidation.valid) {
    throw new HTTPException9(400, { message: urlValidation.error });
  }
  const templateValidation = validateJsonTemplate(data.bodyTemplate);
  if (!templateValidation.valid) {
    throw new HTTPException9(400, { message: templateValidation.error });
  }
  const [existing] = await db.select().from(webhookIntegrations).where(eq8(webhookIntegrations.projectId, projectId)).limit(1);
  if (existing) {
    if (existing.locked) {
      const isOnlyLockChange = data.url === existing.url && JSON.stringify(data.headers) === JSON.stringify(existing.headers) && data.bodyTemplate === existing.bodyTemplate && data.enabled === existing.enabled;
      if (!isOnlyLockChange) {
        throw new HTTPException9(403, {
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
    }).where(eq8(webhookIntegrations.projectId, projectId)).returning();
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
    throw new HTTPException9(403, { message: "Access denied to this project" });
  }
  const [existing] = await db.select().from(webhookIntegrations).where(eq8(webhookIntegrations.projectId, projectId)).limit(1);
  if (!existing) {
    throw new HTTPException9(404, { message: "Integration not found" });
  }
  if (existing.locked) {
    throw new HTTPException9(403, {
      message: "Integration is locked and cannot be deleted"
    });
  }
  await db.delete(webhookIntegrations).where(eq8(webhookIntegrations.projectId, projectId));
}
async function test(projectId, userId, data) {
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    throw new HTTPException9(403, { message: "Access denied to this project" });
  }
  const urlValidation = validateWebhookUrl(data.url);
  if (!urlValidation.valid) {
    throw new HTTPException9(400, { message: urlValidation.error });
  }
  const templateValidation = validateJsonTemplate(data.bodyTemplate);
  if (!templateValidation.valid) {
    throw new HTTPException9(400, { message: templateValidation.error });
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
  const [integration] = await db.select().from(webhookIntegrations).where(eq8(webhookIntegrations.projectId, projectId)).limit(1);
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
    throw new HTTPException10(403, { message: "Access denied to this project" });
  }
  const annotationList = await db.select().from(annotations).where(eq9(annotations.projectId, projectId));
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
    throw new HTTPException10(403, { message: "Access denied to this project" });
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
    const [user] = await db.select({ name: users.name, email: users.email }).from(users).where(eq9(users.id, userId)).limit(1);
    const [project] = await db.select({ name: projects.name }).from(projects).where(eq9(projects.id, projectId)).limit(1);
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
  const [annotation] = await db.select().from(annotations).where(eq9(annotations.id, annotationId)).limit(1);
  if (!annotation) {
    throw new HTTPException10(404, { message: "Annotation not found" });
  }
  const hasAccess = await checkProjectAccess(annotation.projectId, userId);
  if (!hasAccess) {
    throw new HTTPException10(403, {
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
  const [annotation] = await db.select().from(annotations).where(eq9(annotations.id, annotationId)).limit(1);
  if (!annotation) {
    throw new HTTPException10(404, { message: "Annotation not found" });
  }
  const hasAccess = await checkProjectAccess(annotation.projectId, userId);
  if (!hasAccess) {
    throw new HTTPException10(403, {
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
  const [updated] = await db.update(annotations).set(updateData).where(eq9(annotations.id, annotationId)).returning();
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
  const [annotation] = await db.select().from(annotations).where(eq9(annotations.id, annotationId)).limit(1);
  if (!annotation) {
    throw new HTTPException10(404, { message: "Annotation not found" });
  }
  const hasAccess = await checkProjectAccess(annotation.projectId, userId);
  if (!hasAccess) {
    throw new HTTPException10(403, {
      message: "Access denied to this annotation"
    });
  }
  await db.delete(annotations).where(eq9(annotations.id, annotationId));
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
import { HTTPException as HTTPException11 } from "hono/http-exception";
var uploadRoutes = new Hono6();
uploadRoutes.use("*", authMiddleware);
uploadRoutes.post("/screenshot", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!file || !(file instanceof File)) {
    throw new HTTPException11(400, { message: "No file provided" });
  }
  const result = await uploadScreenshot(file, userId);
  return c.json(result, 201);
});
uploadRoutes.post("/profile-picture", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!file || !(file instanceof File)) {
    throw new HTTPException11(400, { message: "No file provided" });
  }
  const result = await uploadProfilePicture(file, userId);
  return c.json(result, 201);
});

// src/routes/integrations.ts
import { Hono as Hono7 } from "hono";
import { zValidator as zValidator6 } from "@hono/zod-validator";
import { z as z3 } from "zod";
var integrationRoutes = new Hono7();
var webhookIntegrationSchema = z3.object({
  url: z3.string().min(1, "URL is required"),
  headers: z3.record(z3.string()).default({}),
  bodyTemplate: z3.string().default(""),
  enabled: z3.boolean().default(true),
  locked: z3.boolean().default(false)
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

// src/routes/invitations.ts
import { Hono as Hono8 } from "hono";
var invitationRoutes = new Hono8();
invitationRoutes.get("/:token", async (c) => {
  const token = c.req.param("token");
  const details = await verifyInvitationToken(token);
  return c.json(details);
});
invitationRoutes.post("/:token/accept", async (c) => {
  const token = c.req.param("token");
  let userId;
  try {
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const sessionToken = authHeader.substring(7);
      const { validateSession: validateSession2 } = await import("./auth-3R3PGA3U.js");
      const session = await validateSession2(sessionToken);
      if (session) {
        userId = session.userId;
      }
    }
  } catch (error) {
  }
  const body = await c.req.json().catch(() => ({}));
  const fullName = body.fullName;
  const result = await acceptInvitation(
    token,
    userId,
    fullName
  );
  if (result.sessionToken) {
    c.header(
      "Set-Cookie",
      `session=${result.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
    );
  }
  return c.json(result);
});
invitationRoutes.post("/:token/decline", async (c) => {
  const token = c.req.param("token");
  await declineInvitation(token);
  return c.body(null, 204);
});

// src/middleware/error-handler.ts
import { HTTPException as HTTPException12 } from "hono/http-exception";
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
  if (err instanceof HTTPException12) {
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
var app = new Hono9().basePath("/api");
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "http://localhost:3000";
      if (origin === "http://localhost:3000" || origin === "http://localhost:3001")
        return origin;
      if (origin === "https://notto-web.vercel.app") return origin;
      if (origin === "https://notto.site") return origin;
      if (origin === "https://www.notto.site") return origin;
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
app.route("/invitations", invitationRoutes);
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
