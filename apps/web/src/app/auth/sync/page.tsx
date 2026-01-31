"use client";

import { useEffect, Suspense, useState } from "react";

/**
 * Auth sync page - receives tokens from extension and stores them in localStorage
 * This allows users who authenticate in the extension to be automatically logged in on the web
 */
function AuthSyncContent() {
  const [status, setStatus] = useState<"waiting" | "synced" | "error">(
    "waiting",
  );

  useEffect(() => {
    // Listen for postMessage from extension iframe
    const handleMessage = (event: MessageEvent) => {
      // Validate message type
      if (event.data?.type === "auth_sync") {
        const { accessToken, refreshToken } = event.data;

        if (accessToken && refreshToken) {
          try {
            // Store tokens in localStorage
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);

            console.log("Auth synced from extension");
            setStatus("synced");

            // Send confirmation back to parent
            if (window.parent !== window) {
              window.parent.postMessage({ type: "auth_sync_complete" }, "*");
            }

            // Trigger a storage event to notify other tabs/windows
            // This helps the auth context detect the change
            window.dispatchEvent(new Event("storage"));

            // If this page is opened directly (not in iframe), redirect to dashboard
            if (window.parent === window) {
              setTimeout(() => {
                window.location.href = "/dashboard";
              }, 1000);
            }
          } catch (error) {
            console.error("Failed to sync auth:", error);
            setStatus("error");
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "system-ui, sans-serif",
        color: "#666",
      }}
    >
      <div style={{ textAlign: "center" }}>
        {status === "waiting" && (
          <>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid #f3f3f3",
                borderTop: "3px solid #ea580c",
                borderRadius: "50%",
                margin: "0 auto 16px",
                animation: "spin 1s linear infinite",
              }}
            />
            <p>Syncing authentication...</p>
          </>
        )}
        {status === "synced" && (
          <>
            <div
              style={{
                width: "40px",
                height: "40px",
                margin: "0 auto 16px",
                color: "#10b981",
              }}
            >
              ✓
            </div>
            <p style={{ color: "#10b981" }}>Authentication synced!</p>
          </>
        )}
        {status === "error" && (
          <>
            <div
              style={{
                width: "40px",
                height: "40px",
                margin: "0 auto 16px",
                color: "#ef4444",
              }}
            >
              ✗
            </div>
            <p style={{ color: "#ef4444" }}>Failed to sync authentication</p>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function AuthSyncPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
          }}
        >
          Loading...
        </div>
      }
    >
      <AuthSyncContent />
    </Suspense>
  );
}
