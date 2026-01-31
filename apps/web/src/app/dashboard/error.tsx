"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-neutral-200 max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <iconify-icon
            icon="lucide:alert-circle"
            className="text-3xl text-red-500 mx-auto"
          ></iconify-icon>
        </div>
        <h3 className="text-xl text-neutral-900 mb-2">Something went wrong</h3>
        <p className="text-neutral-500 mb-6 text-center px-4">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 min-h-[44px]"
        >
          <iconify-icon icon="lucide:refresh-cw"></iconify-icon>
          Try again
        </button>
      </div>
    </div>
  );
}
