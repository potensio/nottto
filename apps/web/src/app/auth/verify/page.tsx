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
  sessionId: string
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
      }
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
  const verificationAttempted = useRef(false);

  useEffect(() => {
    // Prevent double verification in React strict mode
    if (verificationAttempted.current) return;

    const token = searchParams.get("token");
    const extensionSession = searchParams.get("session");

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

        // If this is from the extension, complete the auth session
        if (extensionSession) {
          const completed = await completeExtensionAuthSession(
            extensionSession
          );
          if (completed) {
            console.log("Extension auth session completed successfully");
          }
        }

        setStatus("success");

        // Use hard navigation to ensure cookies are properly sent
        setTimeout(() => {
          window.location.href = "/dashboard";
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
              You're signed in!
            </h2>
            <p className="text-neutral-500">
              Redirecting you to the dashboard...
            </p>
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
