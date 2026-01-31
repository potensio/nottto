"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Get OAuth parameters from URL
        const oauthData = searchParams.get("oauth");
        if (!oauthData) {
          throw new Error("Missing OAuth parameters");
        }

        const oauthParams = JSON.parse(decodeURIComponent(oauthData));

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

        setStatus("success");

        // Redirect to extension with authorization code
        setTimeout(() => {
          const redirectUrl = new URL(oauthParams.redirect_uri);
          redirectUrl.searchParams.set("code", data.code);
          redirectUrl.searchParams.set("state", data.state);
          window.location.replace(redirectUrl.toString());
        }, 800);
      } catch (err) {
        console.error("OAuth callback error:", err);
        setStatus("error");
        setError(
          err instanceof Error
            ? err.message
            : "Failed to authorize extension. Please try again.",
        );
      }
    };

    processOAuthCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
      <div className="w-full max-w-md text-center">
        {status === "processing" && (
          <>
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <iconify-icon
                icon="lucide:loader-2"
                className="text-4xl text-blue-600 animate-spin"
              ></iconify-icon>
            </div>
            <h2 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
              Authorizing extension...
            </h2>
            <p className="text-neutral-500">
              Please wait while we complete the authorization.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <iconify-icon
                icon="lucide:check-circle"
                className="text-4xl text-green-600"
              ></iconify-icon>
            </div>
            <h2 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
              Authorization complete!
            </h2>
            <p className="text-neutral-500">Redirecting to extension...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <iconify-icon
                icon="lucide:alert-circle"
                className="text-4xl text-red-600"
              ></iconify-icon>
            </div>
            <h2 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
              Authorization failed
            </h2>
            <p className="text-neutral-500 mb-8">
              {error || "Something went wrong. Please try again."}
            </p>
            <a
              href="/auth"
              className="inline-flex items-center justify-center gap-2 w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              <iconify-icon icon="lucide:arrow-left"></iconify-icon>
              Try again
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <iconify-icon
                icon="lucide:loader-2"
                className="text-4xl text-neutral-600 animate-spin"
              ></iconify-icon>
            </div>
            <h2 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
              Loading...
            </h2>
          </div>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
