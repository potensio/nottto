"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

type VerifyStatus = "verifying" | "success" | "error";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<VerifyStatus>("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setError("Invalid link. No token provided.");
      return;
    }

    const verifyToken = async () => {
      try {
        const result = await apiClient.verifyMagicLink(token);

        // Notify extension if it's listening
        if (typeof window !== "undefined") {
          window.postMessage(
            {
              type: "NOTTTO_AUTH_SUCCESS",
              payload: {
                accessToken: result.tokens.accessToken,
                refreshToken: result.tokens.refreshToken,
                user: result.user,
              },
            },
            "*"
          );
        }

        setStatus("success");

        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
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
  }, [searchParams, router]);

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
