"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-8">
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-neutral-200">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
          <iconify-icon
            icon="lucide:file-question"
            className="text-3xl text-neutral-400"
          ></iconify-icon>
        </div>
        <h3 className="text-xl font-instrument-serif text-neutral-900 mb-2">
          Page not found
        </h3>
        <p className="text-neutral-500 mb-6 text-center max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 min-h-[44px]"
        >
          <iconify-icon icon="lucide:arrow-left"></iconify-icon>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
