import { eq, and } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../db";
import { workspaceMembers, users, workspaces } from "@notto/shared/db";
import { checkAccess } from "./workspaces";

export interface WorkspaceMemberWithUser {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    name: string | null;
    profilePicture: string | null;
  };
}

/**
 * Member roles in a workspace
 */
export type MemberRole = "owner" | "admin" | "member";

/**
 * Actions that can be performed in a workspace
 */
export type WorkspaceAction =
  | "invite_members"
  | "manage_members"
  | "update_workspace"
  | "delete_workspace"
  | "create_project"
  | "view_workspace";

/**
 * Role-based permissions map
 * Defines which actions each role can perform
 * Requirements: 8.2, 8.3, 8.4
 */
export const PERMISSIONS: Record<MemberRole, WorkspaceAction[]> = {
  owner: [
    "invite_members",
    "manage_members",
    "update_workspace",
    "delete_workspace",
    "create_project",
    "view_workspace",
  ],
  admin: [
    "invite_members",
    "manage_members",
    "create_project",
    "view_workspace",
  ],
  member: ["create_project", "view_workspace"],
};

/**
 * List all members of a workspace with their user details
 * Requirements: 5.1, 5.2
 */
export async function listWorkspaceMembers(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceMemberWithUser[]> {
  // Check if user has permission to view the workspace (Requirement 8.5)
  const hasPermission = await checkPermission(
    workspaceId,
    userId,
    "view_workspace",
  );
  if (!hasPermission) {
    throw new HTTPException(403, {
      message: "You do not have permission to view this workspace",
    });
  }

  // Query workspace_members with user details
  const members = await db
    .select({
      id: workspaceMembers.id,
      workspaceId: workspaceMembers.workspaceId,
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      createdAt: workspaceMembers.createdAt,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        profilePicture: users.profilePicture,
      },
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  return members;
}

/**
 * Update a workspace member's role
 * Requirements: 5.3, 5.6
 */
export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  userId: string,
  newRole: "admin" | "member",
): Promise<WorkspaceMemberWithUser> {
  // Verify user has permission to manage members (Requirement 8.5)
  const hasPermission = await checkPermission(
    workspaceId,
    userId,
    "manage_members",
  );
  if (!hasPermission) {
    throw new HTTPException(403, {
      message: "You do not have permission to manage members in this workspace",
    });
  }

  // Get the member to update
  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.id, memberId))
    .limit(1);

  if (!member) {
    throw new HTTPException(404, { message: "Member not found" });
  }

  // Verify member belongs to the workspace
  if (member.workspaceId !== workspaceId) {
    throw new HTTPException(404, { message: "Member not found" });
  }

  // Prevent self-role-change (Requirement 5.6)
  if (member.userId === userId) {
    throw new HTTPException(403, {
      message: "Cannot change your own role",
    });
  }

  // Prevent changing owner role (Requirement 5.6)
  if (member.role === "owner") {
    throw new HTTPException(403, {
      message: "Cannot change the owner's role",
    });
  }

  // Update the member's role
  const [updatedMember] = await db
    .update(workspaceMembers)
    .set({ role: newRole })
    .where(eq(workspaceMembers.id, memberId))
    .returning();

  // Fetch user details to return complete member info
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, updatedMember.userId))
    .limit(1);

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
      profilePicture: user.profilePicture,
    },
  };
}

/**
 * Remove a member from a workspace
 * Requirements: 5.4, 5.5
 */
export async function removeMember(
  workspaceId: string,
  memberId: string,
  userId: string,
): Promise<void> {
  // Verify user has permission to manage members (Requirement 8.5)
  const hasPermission = await checkPermission(
    workspaceId,
    userId,
    "manage_members",
  );
  if (!hasPermission) {
    throw new HTTPException(403, {
      message: "You do not have permission to manage members in this workspace",
    });
  }

  // Get the member to remove
  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.id, memberId))
    .limit(1);

  if (!member) {
    throw new HTTPException(404, { message: "Member not found" });
  }

  // Verify member belongs to the workspace
  if (member.workspaceId !== workspaceId) {
    throw new HTTPException(404, { message: "Member not found" });
  }

  // Prevent self-removal (Requirement 5.5)
  if (member.userId === userId) {
    throw new HTTPException(403, {
      message: "Cannot remove yourself from the workspace",
    });
  }

  // Prevent removing owner (Requirement 5.5)
  if (member.role === "owner") {
    throw new HTTPException(403, {
      message: "Cannot remove the workspace owner",
    });
  }

  // Delete the workspace_members record
  await db.delete(workspaceMembers).where(eq(workspaceMembers.id, memberId));
}

/**
 * Check if a user has permission to perform a specific action in a workspace
 * Requirements: 8.2, 8.3, 8.4
 *
 * @param workspaceId - The workspace ID to check permissions for
 * @param userId - The user ID to check permissions for
 * @param action - The action to check permission for
 * @returns Promise<boolean> - True if user has permission, false otherwise
 */
export async function checkPermission(
  workspaceId: string,
  userId: string,
  action: WorkspaceAction,
): Promise<boolean> {
  // First check if user is the workspace owner
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    return false;
  }

  // If user is the workspace owner, they have owner role
  if (workspace.ownerId === userId) {
    const ownerPermissions = PERMISSIONS.owner;
    return ownerPermissions.includes(action);
  }

  // Check if user is a member and get their role
  const [member] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!member) {
    return false;
  }

  // Check if the user's role has permission for the action
  const userRole = member.role as MemberRole;
  const rolePermissions = PERMISSIONS[userRole];

  if (!rolePermissions) {
    return false;
  }

  return rolePermissions.includes(action);
}
