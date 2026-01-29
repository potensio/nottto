"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";

type InvitationStatus =
  | "loading"
  | "ready"
  | "accepting"
  | "declining"
  | "accepted"
  | "declined"
  | "error";

interface InvitationDetails {
  invitation: {
    id: string;
    workspaceId: string;
    inviterUserId: string;
    inviteeEmail: string;
    role: "admin" | "member";
    status: string;
    expiresAt: string;
    createdAt: string;
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
}

function InvitationContent() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<InvitationStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const fetchAttempted = useRef(false);

  const token = params.token as string;

  // Fetch invitation details
  useEffect(() => {
    if (fetchAttempted.current) return;
    if (!token) {
      setStatus("error");
      setError("Invalid invitation link");
      return;
    }

    fetchAttempted.current = true;

    const fetchDetails = async () => {
      try {
        const data = await apiClient.getInvitationDetails(token);
        setDetails(data);
        setStatus("ready");
      } catch (err: any) {
        setStatus("error");
        if (err.status === 410) {
          setError("This invitation has expired");
        } else if (err.status === 404) {
          setError("Invalid invitation link");
        } else if (err.status === 409) {
          setError("This invitation has already been used");
        } else {
          setError(err.message || "Failed to load invitation details");
        }
      }
    };

    fetchDetails();
  }, [token]);

  const handleAccept = async () => {
    // For new users (not in our system), validate full name is provided
    if (!isAuthenticated && !details?.userExists && !fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    setStatus("accepting");
    setError(null);

    try {
      const result = await apiClient.acceptInvitation(
        token,
        !isAuthenticated && !details?.userExists ? fullName.trim() : undefined,
      );

      setStatus("accepted");

      // If we got a session token, store it and refresh auth
      if (result.sessionToken) {
        localStorage.setItem("accessToken", result.sessionToken);
        // Trigger auth context refresh
        window.location.href = `/dashboard/${result.workspace.slug}`;
        return;
      }

      // Clear any stored invitation data
      if (typeof window !== "undefined") {
        localStorage.removeItem("invitationReturnUrl");
        localStorage.removeItem("invitationFullName");
      }

      // Redirect to workspace after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/${result.workspace.slug}`);
      }, 2000);
    } catch (err: any) {
      setStatus("ready");
      if (err.status === 401) {
        setError("Please sign in to accept this invitation");
      } else if (err.status === 410) {
        setError("This invitation has expired");
      } else if (err.status === 409) {
        setError("This invitation has already been used");
      } else {
        setError(err.message || "Failed to accept invitation");
      }
    }
  };

  const handleDecline = async () => {
    setStatus("declining");
    setError(null);

    try {
      await apiClient.declineInvitation(token);
      setStatus("declined");
    } catch (err: any) {
      setStatus("ready");
      setError(err.message || "Failed to decline invitation");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700";
      case "member":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
      <div className="w-full max-w-md">
        {(status === "loading" || (status === "ready" && authLoading)) && (
          <div className="text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <iconify-icon
                icon="lucide:loader-2"
                className="text-3xl text-neutral-600 animate-spin"
              ></iconify-icon>
            </div>
            <h2 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
              Loading invitation...
            </h2>
          </div>
        )}

        {(status === "ready" ||
          status === "accepting" ||
          status === "declining") &&
          details && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <iconify-icon
                    icon={details.workspace.icon || "lucide:briefcase"}
                    className="text-3xl text-neutral-600"
                  ></iconify-icon>
                </div>
                <h1 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-2">
                  You're invited!
                </h1>
                <p className="text-neutral-600">
                  {details.inviter.name || details.inviter.email} has invited
                  you to join
                </p>
              </div>

              <div className="bg-neutral-50 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-neutral-200">
                    <iconify-icon
                      icon={details.workspace.icon || "lucide:briefcase"}
                      className="text-2xl text-neutral-600"
                    ></iconify-icon>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-900">
                      {details.workspace.name}
                    </h3>
                    <p className="text-sm text-neutral-500">Workspace</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                  <span className="text-sm text-neutral-600">Your role</span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${getRoleBadgeColor(details.invitation.role)}`}
                  >
                    {details.invitation.role.charAt(0).toUpperCase() +
                      details.invitation.role.slice(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-sm text-neutral-600">Expires</span>
                  <span className="text-sm text-neutral-900">
                    {new Date(
                      details.invitation.expiresAt,
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {status === "accepting" && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <iconify-icon
                      icon="lucide:loader-2"
                      className="text-2xl text-neutral-600 animate-spin"
                    ></iconify-icon>
                  </div>
                  <p className="text-neutral-600">Accepting invitation...</p>
                </div>
              )}

              {status === "declining" && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <iconify-icon
                      icon="lucide:loader-2"
                      className="text-2xl text-neutral-600 animate-spin"
                    ></iconify-icon>
                  </div>
                  <p className="text-neutral-600">Declining invitation...</p>
                </div>
              )}

              {status === "ready" && !authLoading && (
                <>
                  {!details.userExists && !isAuthenticated && (
                    <div className="mb-6">
                      <label
                        htmlFor="fullName"
                        className="block text-sm font-medium text-neutral-700 mb-2"
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                        required
                      />
                      <p className="text-xs text-neutral-500 mt-2">
                        We'll create an account for you at{" "}
                        {details.invitation.inviteeEmail}
                      </p>
                    </div>
                  )}

                  {details.userExists && !isAuthenticated && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        You already have an account with us. Click accept to
                        join the workspace and log in automatically.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <button
                      onClick={handleAccept}
                      className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <iconify-icon icon="lucide:check"></iconify-icon>
                      {!isAuthenticated && details.userExists
                        ? "Accept & Log In"
                        : "Accept invitation"}
                    </button>

                    <button
                      onClick={handleDecline}
                      className="w-full bg-white text-neutral-700 py-3 rounded-lg font-medium border border-neutral-300 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <iconify-icon icon="lucide:x"></iconify-icon>
                      Decline
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        {status === "accepted" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <iconify-icon
                icon="lucide:check"
                className="text-3xl text-green-600"
              ></iconify-icon>
            </div>
            <h2 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
              Welcome aboard!
            </h2>
            <p className="text-neutral-500">
              Redirecting you to the workspace...
            </p>
          </div>
        )}

        {status === "declined" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <iconify-icon
                icon="lucide:check"
                className="text-3xl text-neutral-600"
              ></iconify-icon>
            </div>
            <h2 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
              Invitation declined
            </h2>
            <p className="text-neutral-500 mb-8">
              You've declined this invitation
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              Go to homepage
            </a>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <iconify-icon
                icon="lucide:x"
                className="text-3xl text-red-600"
              ></iconify-icon>
            </div>
            <h2 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
              {error === "This invitation has expired"
                ? "Invitation expired"
                : error === "Invalid invitation link"
                  ? "Invalid invitation"
                  : "Something went wrong"}
            </h2>
            <p className="text-neutral-500 mb-8">
              {error || "This invitation link is not valid"}
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              Go to homepage
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <iconify-icon
                icon="lucide:loader-2"
                className="text-3xl text-neutral-600 animate-spin"
              ></iconify-icon>
            </div>
            <h2 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
              Loading...
            </h2>
          </div>
        </div>
      }
    >
      <InvitationContent />
    </Suspense>
  );
}
