"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type VerifyStatus = "verifying" | "success" | "error";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Completes the extension auth session after successful login.
 * This allows the extension to receive the auth tokens via polling.
 */
async function completeExtensionAuthSession(
  sessionId: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_URL}/extension-auth/session/${sessionId}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send session cookie
        body: JSON.stringify({}),
      },
    );
    return response.ok;
  } catch (error) {
    console.error("Failed to complete extension auth session:", error);
    return false;
  }
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const { verifyMagicLink } = useAuth();
  const [status, setStatus] = useState<VerifyStatus>("verifying");
  const [error, setError] = useState<string | null>(null);
  const [isExtensionAuth, setIsExtensionAuth] = useState(false);
  const verificationAttempted = useRef(false);

  useEffect(() => {
    // Prevent double verification in React strict mode
    if (verificationAttempted.current) return;

    const token = searchParams.get("token");
    const extensionSession = searchParams.get("session");
    const returnUrl = searchParams.get("returnUrl");

    if (!token) {
      setStatus("error");
      setError("Invalid link. No token provided.");
      return;
    }

    verificationAttempted.current = true;

    const verifyToken = async () => {
      try {
        // Use the auth context's verifyMagicLink to properly set user state
        await verifyMagicLink(token);

        // Check if there's an extension session (OAuth params encoded in the magic link)
        let oauthParams = null;
        if (extensionSession) {
          try {
            // Decode OAuth parameters from the session
            oauthParams = JSON.parse(atob(extensionSession));
            console.log("Decoded OAuth params from session");
          } catch (decodeError) {
            console.error("Failed to decode OAuth params:", decodeError);
          }
        }

        // Also check localStorage for OAuth params (fallback for old flow)
        if (!oauthParams) {
          const oauthParamsStr =
            typeof window !== "undefined"
              ? localStorage.getItem("oauthParams")
              : null;
          if (oauthParamsStr) {
            try {
              oauthParams = JSON.parse(oauthParamsStr);
              console.log("Found OAuth params in localStorage");
            } catch (parseError) {
              console.error("Failed to parse OAuth params:", parseError);
            }
          }
        }

        if (oauthParams) {
          // This is an OAuth flow - generate authorization code and redirect
          try {
            // Generate authorization code
            const response = await fetch(`${API_URL}/oauth/authorize`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
              credentials: "include",
              body: JSON.stringify({
                response_type: oauthParams.response_type,
                client_id: oauthParams.client_id,
                redirect_uri: oauthParams.redirect_uri,
                code_challenge: oauthParams.code_challenge,
                code_challenge_method: oauthParams.code_challenge_method,
                state: oauthParams.state,
              }),
            });

            if (!response.ok) {
              throw new Error("Failed to generate authorization code");
            }

            const data = await response.json();

            // Clear stored OAuth params
            localStorage.removeItem("oauthParams");

            setStatus("success");
            setIsExtensionAuth(true);

            // For extension OAuth: We can't redirect to chromiumapp.org from a regular tab
            // The user clicked the magic link from email, which opened in a new tab
            // We need to show them a message to return to the extension
            // The extension should implement a fallback auth method or show instructions

            // Store auth completion flag that extension can check
            if (typeof window !== "undefined") {
              localStorage.setItem("extensionAuthComplete", "true");
              localStorage.setItem(
                "extensionAuthTimestamp",
                Date.now().toString(),
              );
            }

            return;
          } catch (oauthError) {
            console.error("OAuth authorization failed:", oauthError);
            // Clear OAuth params on error
            localStorage.removeItem("oauthParams");
            setStatus("error");
            setError(
              "Failed to authorize extension. Please try again from the extension.",
            );
            return;
          }
        }

        setStatus("success");

        // Use hard navigation to ensure cookies are properly sent
        setTimeout(() => {
          // Check for stored invitation return URL
          const storedReturnUrl =
            typeof window !== "undefined"
              ? localStorage.getItem("invitationReturnUrl")
              : null;

          // Redirect to returnUrl if provided, stored invitation URL, or dashboard
          const destination = returnUrl || storedReturnUrl || "/dashboard";
          window.location.href = destination;
        }, 2000);
      } catch (err) {
        setStatus("error");
        if (err && typeof err === "object" && "message" in err) {
          setError((err as { message: string }).message);
        } else {
          setError("Failed to verify link. Please try again.");
        }
      }
    };

    verifyToken();
  }, [searchParams, verifyMagicLink]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
      <div className="w-full max-w-md text-center">
        {status === "verifying" && (
          <>
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <iconify-icon
                icon="lucide:loader-2"
                className="text-3xl text-neutral-600 animate-spin"
              ></iconify-icon>
            </div>
            <h2 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
              Verifying your link...
            </h2>
            <p className="text-neutral-500">
              Please wait while we sign you in.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <iconify-icon
                icon="lucide:check"
                className="text-3xl text-green-600"
              ></iconify-icon>
            </div>
            <h2 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
              {isExtensionAuth
                ? "Authentication complete!"
                : "You're signed in!"}
            </h2>
            <p className="text-neutral-500 mb-6">
              {isExtensionAuth
                ? "You can now close this tab and return to the extension to try logging in again."
                : "Redirecting you to the dashboard..."}
            </p>
            {isExtensionAuth && (
              <button
                onClick={() => window.close()}
                className="inline-flex items-center justify-center gap-2 w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                <iconify-icon icon="lucide:x"></iconify-icon>
                Close this tab
              </button>
            )}
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <iconify-icon
                icon="lucide:x"
                className="text-3xl text-red-600"
              ></iconify-icon>
            </div>
            <h2 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
              Link expired or invalid
            </h2>
            <p className="text-neutral-500 mb-8">
              {error || "This link may have expired or already been used."}
            </p>

            <a
              href="/auth"
              className="inline-flex items-center justify-center gap-2 w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              <iconify-icon icon="lucide:arrow-left"></iconify-icon>
              Request a new link
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
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
      <VerifyContent />
    </Suspense>
  );
}
