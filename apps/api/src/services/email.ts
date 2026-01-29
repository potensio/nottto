import { Resend } from "resend";
import {
  getMagicLinkEmailHtml,
  getMagicLinkEmailText,
} from "../templates/magic-link-email";
import {
  getInvitationEmailHtml,
  getInvitationEmailText,
  type InvitationEmailProps,
} from "../templates/invitation-email";

// Lazy initialization - env vars may not be available at module load time in serverless
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const EMAIL_FROM = process.env.EMAIL_FROM || "Hanif <noreply@notto.site>";
const EMAIL_MODE = process.env.EMAIL_MODE || "production";
const MAGIC_LINK_EXPIRATION_MINUTES = 15;

export interface SendMagicLinkEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Sends a magic link email to the specified address.
 * In development mode, logs the magic link to console instead.
 * Returns success status and any error message.
 */
export async function sendMagicLinkEmail(
  email: string,
  magicLinkUrl: string,
): Promise<SendMagicLinkEmailResult> {
  // Development mode: log magic link to console
  if (EMAIL_MODE === "development") {
    console.log("\n" + "=".repeat(60));
    console.log("🔗 MAGIC LINK (dev mode - no email sent)");
    console.log("=".repeat(60));
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Link: ${magicLinkUrl}`);
    console.log("=".repeat(60) + "\n");
    return { success: true };
  }

  // Production mode: send actual email via Resend
  try {
    const { error } = await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Sign in to Notto",
      html: getMagicLinkEmailHtml({
        magicLinkUrl,
        expirationMinutes: MAGIC_LINK_EXPIRATION_MINUTES,
      }),
      text: getMagicLinkEmailText({
        magicLinkUrl,
        expirationMinutes: MAGIC_LINK_EXPIRATION_MINUTES,
      }),
    });

    if (error) {
      console.error("Failed to send magic link email:", {
        email: maskEmailForLog(email),
        error: error.message,
      });
      return { success: false, error: error.message };
    }

    console.log("Magic link email sent:", {
      email: maskEmailForLog(email),
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("Failed to send magic link email:", {
      email: maskEmailForLog(email),
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Masks email for logging purposes (e.g., "j***@example.com")
 */
function maskEmailForLog(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";

  const visibleChars = Math.min(2, localPart.length);
  const masked = localPart.slice(0, visibleChars) + "***";

  return `${masked}@${domain}`;
}

export interface SendInvitationEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Sends a workspace invitation email to the specified address.
 * In development mode, logs the invitation link to console instead.
 * Returns success status and any error message.
 */
export async function sendInvitationEmail(
  email: string,
  invitationData: InvitationEmailProps,
): Promise<SendInvitationEmailResult> {
  // Development mode: log invitation link to console
  if (EMAIL_MODE === "development") {
    console.log("\n" + "=".repeat(60));
    console.log("📨 WORKSPACE INVITATION (dev mode - no email sent)");
    console.log("=".repeat(60));
    console.log(`📧 Email: ${email}`);
    console.log(
      `🏢 Workspace: ${invitationData.workspaceIcon} ${invitationData.workspaceName}`,
    );
    console.log(`👤 Inviter: ${invitationData.inviterName || "Unknown"}`);
    console.log(`🎭 Role: ${invitationData.role}`);
    console.log(`✅ Accept: ${invitationData.acceptUrl}`);
    console.log(`❌ Decline: ${invitationData.declineUrl}`);
    console.log(`⏰ Expires: ${invitationData.expiresAt.toISOString()}`);
    console.log("=".repeat(60) + "\n");
    return { success: true };
  }

  // Production mode: send actual email via Resend
  try {
    const { error } = await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `You're invited to join ${invitationData.workspaceName}`,
      html: getInvitationEmailHtml(invitationData),
      text: getInvitationEmailText(invitationData),
    });

    if (error) {
      console.error("Failed to send invitation email:", {
        email: maskEmailForLog(email),
        workspace: invitationData.workspaceName,
        error: error.message,
      });
      return { success: false, error: error.message };
    }

    console.log("Invitation email sent:", {
      email: maskEmailForLog(email),
      workspace: invitationData.workspaceName,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("Failed to send invitation email:", {
      email: maskEmailForLog(email),
      workspace: invitationData.workspaceName,
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}
