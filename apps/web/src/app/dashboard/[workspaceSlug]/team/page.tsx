"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    profilePicture: string | null;
  };
}

interface PendingInvitation {
  id: string;
  workspaceId: string;
  inviterUserId: string;
  inviteeEmail: string;
  role: "admin" | "member";
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
}

export default function TeamManagementPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const [workspace, setWorkspace] = useState<any>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch workspace, current user, members, and invitations
        const [workspaceRes, userRes, membersRes, invitationsRes] =
          await Promise.all([
            apiClient.getWorkspaceBySlug(workspaceSlug),
            apiClient.getMe(),
            apiClient
              .getWorkspaceMembers(
                (await apiClient.getWorkspaceBySlug(workspaceSlug)).workspace
                  .id,
              )
              .catch(() => ({ members: [] })),
            apiClient
              .getPendingInvitations(
                (await apiClient.getWorkspaceBySlug(workspaceSlug)).workspace
                  .id,
              )
              .catch(() => ({ invitations: [] })),
          ]);

        setWorkspace(workspaceRes.workspace);
        setCurrentUser(userRes.user);
        setMembers(membersRes.members);
        setInvitations(invitationsRes.invitations);
      } catch (err: any) {
        setError(err.message || "Failed to load team data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [workspaceSlug]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(false);

    // Validate email
    if (!inviteEmail || !inviteEmail.includes("@")) {
      setInviteError("Please enter a valid email address");
      return;
    }

    if (!workspace) return;

    setIsInviting(true);

    try {
      const result = await apiClient.sendInvitation(
        workspace.id,
        inviteEmail,
        inviteRole,
      );
      setInvitations([...invitations, result.invitation]);
      setInviteEmail("");
      setInviteRole("member");
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err: any) {
      setInviteError(err.message || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!workspace) return;
    setActionLoading(invitationId);
    setActionError(null);

    try {
      await apiClient.cancelInvitation(workspace.id, invitationId);
      setInvitations(invitations.filter((inv) => inv.id !== invitationId));
    } catch (err: any) {
      setActionError(err.message || "Failed to cancel invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    if (!workspace) return;
    setActionLoading(invitationId);
    setActionError(null);

    try {
      const result = await apiClient.resendInvitation(
        workspace.id,
        invitationId,
      );
      setInvitations(
        invitations.map((inv) =>
          inv.id === invitationId ? result.invitation : inv,
        ),
      );
    } catch (err: any) {
      setActionError(err.message || "Failed to resend invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async (
    memberId: string,
    newRole: "admin" | "member",
  ) => {
    if (!workspace) return;
    setActionLoading(memberId);
    setActionError(null);

    try {
      await apiClient.updateMemberRole(workspace.id, memberId, newRole);
      setMembers(
        members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
      );
    } catch (err: any) {
      setActionError(err.message || "Failed to update role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!workspace) return;
    if (
      !confirm(
        "Are you sure you want to remove this member from the workspace?",
      )
    ) {
      return;
    }

    setActionLoading(memberId);
    setActionError(null);

    try {
      await apiClient.removeMember(workspace.id, memberId);
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (err: any) {
      setActionError(err.message || "Failed to remove member");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-48 mb-8"></div>
            <div className="space-y-6">
              <div className="h-32 bg-neutral-200 rounded"></div>
              <div className="h-64 bg-neutral-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <iconify-icon
              icon="lucide:alert-circle"
              className="text-3xl text-red-600"
            ></iconify-icon>
          </div>
          <h2 className="text-xl font-medium text-neutral-900 mb-2">
            Failed to load team
          </h2>
          <p className="text-neutral-500 mb-6">{error}</p>
          <Link
            href={`/dashboard/${workspaceSlug}`}
            className="inline-flex items-center gap-2 text-accent hover:underline"
          >
            <iconify-icon icon="lucide:arrow-left"></iconify-icon>
            Back to workspace
          </Link>
        </div>
      </div>
    );
  }

  const currentMember = members.find((m) => m.userId === currentUser?.id);
  const canManageTeam =
    currentMember?.role === "owner" || currentMember?.role === "admin";

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/${workspaceSlug}`}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
          >
            <iconify-icon icon="lucide:arrow-left"></iconify-icon>
            Back to workspace
          </Link>
          <h1 className="text-3xl font-instrument-serif font-normal text-neutral-900">
            Team Management
          </h1>
          <p className="text-neutral-500 mt-2">
            Manage team members and invitations for {workspace?.name}
          </p>
        </div>

        {/* Action error */}
        {actionError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <iconify-icon
              icon="lucide:alert-circle"
              className="text-red-600 text-xl"
            ></iconify-icon>
            <span className="text-red-800">{actionError}</span>
          </div>
        )}

        {/* Invite form */}
        {canManageTeam && (
          <div className="mb-8 bg-white border border-neutral-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-neutral-900">
                Invite Team Member
              </h2>
              {!showInviteForm && (
                <button
                  onClick={() => setShowInviteForm(true)}
                  className="text-sm text-accent hover:underline"
                >
                  Show form
                </button>
              )}
            </div>

            {showInviteForm && (
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                {inviteSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm">
                    <iconify-icon
                      icon="lucide:check-circle"
                      className="text-green-600"
                    ></iconify-icon>
                    <span className="text-green-800">
                      Invitation sent successfully!
                    </span>
                  </div>
                )}

                {inviteError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm">
                    <iconify-icon
                      icon="lucide:alert-circle"
                      className="text-red-600"
                    ></iconify-icon>
                    <span className="text-red-800">{inviteError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        if (inviteError) setInviteError(null);
                      }}
                      placeholder="colleague@example.com"
                      className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) =>
                        setInviteRole(e.target.value as "admin" | "member")
                      }
                      className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteForm(false);
                      setInviteEmail("");
                      setInviteRole("member");
                      setInviteError(null);
                    }}
                    className="px-6 py-2 text-neutral-600 hover:text-neutral-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="bg-neutral-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isInviting ? (
                      <>
                        <iconify-icon
                          icon="lucide:loader-2"
                          className="animate-spin"
                        ></iconify-icon>
                        Sending...
                      </>
                    ) : (
                      <>Send Invitation</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Pending invitations */}
        {canManageTeam && invitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">
              Pending Invitations ({invitations.length})
            </h2>
            <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-200">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                        <iconify-icon
                          icon="lucide:mail"
                          className="text-neutral-500"
                        ></iconify-icon>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">
                          {invitation.inviteeEmail}
                        </p>
                        <p className="text-sm text-neutral-500">
                          Invited {formatDate(invitation.createdAt)} • Expires{" "}
                          {formatDate(invitation.expiresAt)} •{" "}
                          <span className="capitalize">{invitation.role}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResendInvitation(invitation.id)}
                      disabled={actionLoading === invitation.id}
                      className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded transition-colors disabled:opacity-50"
                    >
                      {actionLoading === invitation.id ? (
                        <iconify-icon
                          icon="lucide:loader-2"
                          className="animate-spin"
                        ></iconify-icon>
                      ) : (
                        <iconify-icon icon="lucide:refresh-cw"></iconify-icon>
                      )}
                    </button>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={actionLoading === invitation.id}
                      className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    >
                      {actionLoading === invitation.id ? (
                        <iconify-icon
                          icon="lucide:loader-2"
                          className="animate-spin"
                        ></iconify-icon>
                      ) : (
                        <iconify-icon icon="lucide:x"></iconify-icon>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team members */}
        <div>
          <h2 className="text-lg font-medium text-neutral-900 mb-4">
            Team Members ({members.length})
          </h2>
          <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-200">
            {members.map((member) => {
              const isSelf = member.userId === currentUser?.id;
              const isOwner = member.role === "owner";
              const canModify = canManageTeam && !isSelf && !isOwner;

              return (
                <div
                  key={member.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {member.user.profilePicture ? (
                      <img
                        src={member.user.profilePicture}
                        alt={member.user.name || member.user.email}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-accent">
                          {getInitials(member.user.name, member.user.email)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-900">
                          {member.user.name || member.user.email}
                        </p>
                        {isSelf && (
                          <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500">
                        {member.user.email} • Joined{" "}
                        {formatDate(member.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {canModify ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(
                            member.id,
                            e.target.value as "admin" | "member",
                          )
                        }
                        disabled={actionLoading === member.id}
                        className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="px-3 py-1.5 text-sm text-neutral-600 capitalize">
                        {member.role}
                      </span>
                    )}
                    {canModify && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={actionLoading === member.id}
                        className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Remove member"
                      >
                        {actionLoading === member.id ? (
                          <iconify-icon
                            icon="lucide:loader-2"
                            className="animate-spin"
                          ></iconify-icon>
                        ) : (
                          <iconify-icon icon="lucide:trash-2"></iconify-icon>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
