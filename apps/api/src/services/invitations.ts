import { eq, and, lt, or } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../db";
import {
  workspaceInvitations,
  workspaceMembers,
  workspaces,
  users,
  sessions,
} from "@notto/shared/db";
import { generateSecureToken, hashToken } from "../utils/magic-link";
import { checkAccess } from "./workspaces";
import { sendInvitationEmail } from "./email";
import { checkPermission } from "./members";
import { nanoid } from "nanoid";

const INVITATION_EXPIRY_DAYS = 7;
const MAX_PENDING_INVITATIONS = 5;
const CLEANUP_THRESHOLD_DAYS = 30;
const WEB_URL = process.env.WEB_URL || "http://localhost:3000";

/**
 * Creates a new workspace invitation with a secure token.
 * Validates workspace access, email uniqueness, and pending invitation limits.
 *
 * Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 9.2
 */
export async function createInvitation(
  workspaceId: string,
  inviterUserId: string,
  inviteeEmail: string,
  role: "admin" | "member",
): Promise<{
  invitation: {
    id: string;
    workspaceId: string;
    inviterUserId: string;
    inviteeEmail: string;
    role: string;
    status: string;
    expiresAt: Date;
    createdAt: Date;
  };
  token: string;
}> {
  // Normalize email
  const normalizedEmail = inviteeEmail.toLowerCase().trim();

  // Validate workspace exists and user has access
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  // Check if inviter has permission to invite members (Requirement 8.5)
  const hasPermission = await checkPermission(
    workspaceId,
    inviterUserId,
    "invite_members",
  );
  if (!hasPermission) {
    throw new HTTPException(403, {
      message: "You do not have permission to invite members to this workspace",
    });
  }

  // Check if email is already a workspace member (Requirement 1.3)
  const [existingMember] = await db
    .select({ userId: workspaceMembers.userId })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(users.email, normalizedEmail),
      ),
    )
    .limit(1);

  if (existingMember) {
    throw new HTTPException(409, {
      message: "User is already a member of this workspace",
    });
  }

  // Check if there's already a pending invitation for this email (Requirement 1.4)
  const [existingInvitation] = await db
    .select()
    .from(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.workspaceId, workspaceId),
        eq(workspaceInvitations.inviteeEmail, normalizedEmail),
        eq(workspaceInvitations.status, "pending"),
      ),
    )
    .limit(1);

  if (existingInvitation) {
    throw new HTTPException(409, {
      message: "A pending invitation already exists for this email",
    });
  }

  // Check maximum pending invitations limit (Requirement 9.4)
  const pendingInvitations = await db
    .select({ id: workspaceInvitations.id })
    .from(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.workspaceId, workspaceId),
        eq(workspaceInvitations.status, "pending"),
      ),
    );

  if (pendingInvitations.length >= MAX_PENDING_INVITATIONS) {
    throw new HTTPException(400, {
      message: `Maximum of ${MAX_PENDING_INVITATIONS} pending invitations reached`,
    });
  }

  // Generate secure token (Requirement 9.2)
  const token = generateSecureToken();
  const tokenHash = hashToken(token);

  // Set expiration to 7 days from now (Requirement 1.5)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  // Create invitation record (Requirement 1.1, 1.6)
  const [invitation] = await db
    .insert(workspaceInvitations)
    .values({
      workspaceId,
      inviterUserId,
      inviteeEmail: normalizedEmail,
      role,
      tokenHash,
      status: "pending",
      expiresAt,
    })
    .returning();

  // Get inviter details for email
  const [inviter] = await db
    .select({
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, inviterUserId))
    .limit(1);

  // Send invitation email (Requirement 1.2)
  const acceptUrl = `${WEB_URL}/invitations/${encodeURIComponent(token)}`;
  const declineUrl = `${WEB_URL}/invitations/${encodeURIComponent(token)}/decline`;

  const emailResult = await sendInvitationEmail(normalizedEmail, {
    inviteeName: null, // We don't know if they have an account yet
    inviterName: inviter?.name || null,
    workspaceName: workspace.name,
    workspaceIcon: workspace.icon,
    role,
    acceptUrl,
    declineUrl,
    expiresAt,
  });

  if (!emailResult.success) {
    // Log the error but don't fail the invitation creation
    // The invitation is already created, so we can resend it later
    console.error("Failed to send invitation email:", {
      invitationId: invitation.id,
      email: normalizedEmail,
      error: emailResult.error,
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
      createdAt: invitation.createdAt,
    },
    token, // Return the plain token for email sending
  };
}

/**
 * Verifies an invitation token and returns invitation details with workspace info.
 * Validates token hash, expiration, and status.
 *
 * Requirements: 2.1, 2.6, 2.7
 */
export async function verifyInvitationToken(token: string): Promise<{
  invitation: {
    id: string;
    workspaceId: string;
    inviterUserId: string;
    inviteeEmail: string;
    role: string;
    status: string;
    expiresAt: Date;
    createdAt: Date;
  };
  workspace: {
    id: string;
    name: string;
    icon: string;
  };
  inviter: {
    name: string | null;
    email: string;
  };
  userExists: boolean;
}> {
  // Hash the incoming token (Requirement 2.1)
  const tokenHash = hashToken(token);

  // Find invitation by token hash
  const [invitationRecord] = await db
    .select({
      invitation: workspaceInvitations,
      workspace: {
        id: workspaces.id,
        name: workspaces.name,
        icon: workspaces.icon,
      },
      inviter: {
        name: users.name,
        email: users.email,
      },
    })
    .from(workspaceInvitations)
    .innerJoin(workspaces, eq(workspaceInvitations.workspaceId, workspaces.id))
    .innerJoin(users, eq(workspaceInvitations.inviterUserId, users.id))
    .where(eq(workspaceInvitations.tokenHash, tokenHash))
    .limit(1);

  // Check if token exists (Requirement 2.7)
  if (!invitationRecord) {
    throw new HTTPException(404, {
      message: "Invalid invitation link",
    });
  }

  const { invitation, workspace, inviter } = invitationRecord;

  // Check if invitation has expired (Requirement 2.6)
  if (new Date() > invitation.expiresAt) {
    throw new HTTPException(410, {
      message: "This invitation has expired",
    });
  }

  // Check if invitation status is pending (Requirement 2.1)
  if (invitation.status !== "pending") {
    throw new HTTPException(410, {
      message: `This invitation has already been ${invitation.status}`,
    });
  }

  // Check if a user with this email already exists
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, invitation.inviteeEmail))
    .limit(1);

  return {
    invitation: {
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      inviterUserId: invitation.inviterUserId,
      inviteeEmail: invitation.inviteeEmail,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      icon: workspace.icon,
    },
    inviter: {
      name: inviter.name,
      email: inviter.email,
    },
    userExists: !!existingUser,
  };
}

/**
 * Accepts an invitation and adds the user to the workspace.
 * Verifies token, checks email match (or creates user if needed), creates workspace member, and updates invitation status.
 *
 * Requirements: 2.2, 2.3
 */
export async function acceptInvitation(
  token: string,
  userId?: string,
  fullName?: string,
): Promise<{
  workspace: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  };
  role: string;
  sessionToken?: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}> {
  // Verify the token and get invitation details
  const { invitation } = await verifyInvitationToken(token);

  let actualUserId = userId;
  let sessionToken: string | undefined;
  let createdUser:
    | { id: string; email: string; name: string | null }
    | undefined;

  // If no userId provided, check if user exists or create new one
  if (!actualUserId) {
    const [existingUser] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.email, invitation.inviteeEmail))
      .limit(1);

    if (existingUser) {
      // User exists, use their ID and create session
      actualUserId = existingUser.id;
      sessionToken = nanoid(64);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db.insert(sessions).values({
        userId: actualUserId,
        sessionToken,
        expiresAt,
      });

      createdUser = existingUser;
    } else {
      // Create new user without password (they'll set it up later or use magic link)
      const [newUser] = await db
        .insert(users)
        .values({
          email: invitation.inviteeEmail,
          name: fullName || null,
          passwordHash: null,
        })
        .returning();

      actualUserId = newUser.id;

      // Create session for new user
      sessionToken = nanoid(64);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db.insert(sessions).values({
        userId: actualUserId,
        sessionToken,
        expiresAt,
      });

      createdUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      };
    }
  } else {
    // Verify that the user's email matches the invitation email (Requirement 2.2)
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, actualUserId))
      .limit(1);

    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }

    if (user.email.toLowerCase() !== invitation.inviteeEmail.toLowerCase()) {
      throw new HTTPException(403, {
        message: "This invitation was sent to a different email address",
      });
    }
  }

  // Check if user is already a member (shouldn't happen, but defensive check)
  const [existingMember] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, invitation.workspaceId),
        eq(workspaceMembers.userId, actualUserId),
      ),
    )
    .limit(1);

  if (existingMember) {
    throw new HTTPException(409, {
      message: "You are already a member of this workspace",
    });
  }

  // Create workspace member record (Requirement 2.2)
  await db.insert(workspaceMembers).values({
    workspaceId: invitation.workspaceId,
    userId: actualUserId,
    role: invitation.role,
  });

  // Update invitation status to accepted (Requirement 2.3)
  await db
    .update(workspaceInvitations)
    .set({
      status: "accepted",
      acceptedAt: new Date(),
    })
    .where(eq(workspaceInvitations.id, invitation.id));

  // Get workspace details for the response
  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      icon: workspaces.icon,
    })
    .from(workspaces)
    .where(eq(workspaces.id, invitation.workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  return {
    workspace,
    role: invitation.role,
    sessionToken,
    user: createdUser,
  };
}

/**
 * Declines an invitation.
 * Updates invitation status to declined and records decline timestamp.
 *
 * Requirements: 3.1, 3.2
 */
export async function declineInvitation(token: string): Promise<void> {
  // Verify the token and get invitation details
  const { invitation } = await verifyInvitationToken(token);

  // Update invitation status to declined (Requirement 3.1)
  // Record decline timestamp (Requirement 3.2)
  await db
    .update(workspaceInvitations)
    .set({
      status: "declined",
      declinedAt: new Date(),
    })
    .where(eq(workspaceInvitations.id, invitation.id));
}

/**
 * Lists all pending invitations for a workspace.
 * Verifies workspace access and returns invitations with invitee email, dates, and expiration.
 *
 * Requirements: 4.1, 4.2
 */
export async function listPendingInvitations(
  workspaceId: string,
  userId: string,
): Promise<
  Array<{
    id: string;
    inviteeEmail: string;
    role: string;
    createdAt: Date;
    expiresAt: Date;
    inviter: {
      name: string | null;
      email: string;
    };
  }>
> {
  // Verify workspace exists and user has permission to view invitations (Requirement 8.5)
  const hasPermission = await checkPermission(
    workspaceId,
    userId,
    "invite_members",
  );
  if (!hasPermission) {
    throw new HTTPException(403, {
      message:
        "You do not have permission to view invitations for this workspace",
    });
  }

  // Query all pending invitations for the workspace (Requirement 4.1, 4.2)
  const invitations = await db
    .select({
      id: workspaceInvitations.id,
      inviteeEmail: workspaceInvitations.inviteeEmail,
      role: workspaceInvitations.role,
      createdAt: workspaceInvitations.createdAt,
      expiresAt: workspaceInvitations.expiresAt,
      inviter: {
        name: users.name,
        email: users.email,
      },
    })
    .from(workspaceInvitations)
    .innerJoin(users, eq(workspaceInvitations.inviterUserId, users.id))
    .where(
      and(
        eq(workspaceInvitations.workspaceId, workspaceId),
        eq(workspaceInvitations.status, "pending"),
      ),
    )
    .orderBy(workspaceInvitations.createdAt);

  return invitations;
}

/**
 * Cancels a pending invitation.
 * Updates invitation status to cancelled and prevents the token from being used.
 * Requires workspace owner or admin permission.
 *
 * Requirements: 4.3, 4.4
 */
export async function cancelInvitation(
  invitationId: string,
  userId: string,
): Promise<void> {
  // Get the invitation to verify it exists and get workspace ID
  const [invitation] = await db
    .select({
      id: workspaceInvitations.id,
      workspaceId: workspaceInvitations.workspaceId,
      status: workspaceInvitations.status,
    })
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.id, invitationId))
    .limit(1);

  if (!invitation) {
    throw new HTTPException(404, { message: "Invitation not found" });
  }

  // Verify user has permission to manage invitations (Requirement 8.5)
  const hasPermission = await checkPermission(
    invitation.workspaceId,
    userId,
    "invite_members",
  );
  if (!hasPermission) {
    throw new HTTPException(403, {
      message:
        "You do not have permission to cancel invitations for this workspace",
    });
  }

  // Check if invitation is already cancelled or accepted/declined
  if (invitation.status !== "pending") {
    throw new HTTPException(409, {
      message: `Cannot cancel invitation that is already ${invitation.status}`,
    });
  }

  // Update invitation status to cancelled (Requirement 4.3, 4.4)
  await db
    .update(workspaceInvitations)
    .set({
      status: "cancelled",
    })
    .where(eq(workspaceInvitations.id, invitationId));
}

/**
 * Resends an invitation with a new token and expiration.
 * Generates a new secure token, updates the invitation record, and returns details for email sending.
 * Requires workspace owner or admin permission.
 *
 * Requirements: 4.5
 */
export async function resendInvitation(
  invitationId: string,
  userId: string,
): Promise<{
  invitation: {
    id: string;
    workspaceId: string;
    inviterUserId: string;
    inviteeEmail: string;
    role: string;
    status: string;
    expiresAt: Date;
    createdAt: Date;
  };
  token: string;
  workspace: {
    id: string;
    name: string;
    icon: string;
  };
  inviter: {
    name: string | null;
    email: string;
  };
}> {
  // Get the invitation with workspace and inviter details
  const [invitationRecord] = await db
    .select({
      invitation: workspaceInvitations,
      workspace: {
        id: workspaces.id,
        name: workspaces.name,
        icon: workspaces.icon,
      },
      inviter: {
        name: users.name,
        email: users.email,
      },
    })
    .from(workspaceInvitations)
    .innerJoin(workspaces, eq(workspaceInvitations.workspaceId, workspaces.id))
    .innerJoin(users, eq(workspaceInvitations.inviterUserId, users.id))
    .where(eq(workspaceInvitations.id, invitationId))
    .limit(1);

  if (!invitationRecord) {
    throw new HTTPException(404, { message: "Invitation not found" });
  }

  const { invitation, workspace, inviter } = invitationRecord;

  // Verify user has permission to manage invitations (Requirement 8.5)
  const hasPermission = await checkPermission(
    invitation.workspaceId,
    userId,
    "invite_members",
  );
  if (!hasPermission) {
    throw new HTTPException(403, {
      message:
        "You do not have permission to resend invitations for this workspace",
    });
  }

  // Check if invitation is pending
  if (invitation.status !== "pending") {
    throw new HTTPException(409, {
      message: `Cannot resend invitation that is ${invitation.status}`,
    });
  }

  // Generate new secure token (Requirement 4.5)
  const token = generateSecureToken();
  const tokenHash = hashToken(token);

  // Set new expiration to 7 days from now (Requirement 4.5)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  // Update invitation with new token and expiration (Requirement 4.5)
  const [updatedInvitation] = await db
    .update(workspaceInvitations)
    .set({
      tokenHash,
      expiresAt,
    })
    .where(eq(workspaceInvitations.id, invitationId))
    .returning();

  // Send invitation email (Requirement 4.5)
  const acceptUrl = `${WEB_URL}/invitations/${encodeURIComponent(token)}`;
  const declineUrl = `${WEB_URL}/invitations/${encodeURIComponent(token)}/decline`;

  const emailResult = await sendInvitationEmail(invitation.inviteeEmail, {
    inviteeName: null, // We don't know if they have an account yet
    inviterName: inviter.name,
    workspaceName: workspace.name,
    workspaceIcon: workspace.icon,
    role: invitation.role,
    acceptUrl,
    declineUrl,
    expiresAt,
  });

  if (!emailResult.success) {
    // Log the error but don't fail the resend operation
    console.error("Failed to send invitation email:", {
      invitationId: invitation.id,
      email: invitation.inviteeEmail,
      error: emailResult.error,
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
      createdAt: updatedInvitation.createdAt,
    },
    token, // Return the plain token for email sending
    workspace: {
      id: workspace.id,
      name: workspace.name,
      icon: workspace.icon,
    },
    inviter: {
      name: inviter.name,
      email: inviter.email,
    },
  };
}

/**
 * Cleans up expired invitations that are older than 30 days.
 * Deletes invitations with status "pending" or "cancelled" that expired more than 30 days ago.
 *
 * Requirements: 9.5
 */
export async function cleanupExpiredInvitations(): Promise<{
  deletedCount: number;
}> {
  // Calculate the threshold date (30 days ago)
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - CLEANUP_THRESHOLD_DAYS);

  // Delete invitations that:
  // 1. Have status "pending" or "cancelled" (not accepted/declined as those are historical records)
  // 2. Have expiresAt date older than 30 days ago
  const deletedInvitations = await db
    .delete(workspaceInvitations)
    .where(
      and(
        or(
          eq(workspaceInvitations.status, "pending"),
          eq(workspaceInvitations.status, "cancelled"),
        ),
        lt(workspaceInvitations.expiresAt, thresholdDate),
      ),
    )
    .returning({ id: workspaceInvitations.id });

  return {
    deletedCount: deletedInvitations.length,
  };
}
