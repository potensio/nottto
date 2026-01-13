"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useAnnotation } from "@/lib/hooks";
import { EmptyState } from "@/components/dashboard";
import { formatDate } from "@/components/dashboard/AnnotationCard";

export default function AnnotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const annotationId = params.id as string;
  const [copied, setCopied] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const { data: annotation, isLoading, error } = useAnnotation(annotationId);

  const handleCopyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="animate-pulse">
          <div className="h-5 w-32 bg-neutral-200 rounded mb-6"></div>
          <div className="h-8 w-3/4 bg-neutral-200 rounded mb-4"></div>
          <div className="flex gap-2 mb-6">
            <div className="h-6 w-16 bg-neutral-100 rounded"></div>
            <div className="h-6 w-16 bg-neutral-100 rounded"></div>
          </div>
          <div className="h-32 w-48 bg-neutral-100 rounded-lg mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-3 w-20 bg-neutral-200 rounded mb-2"></div>
                <div className="h-4 w-full bg-neutral-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !annotation) {
    return (
      <div className="p-8">
        <EmptyState type="not-found" workspaceSlug={workspaceSlug} />
      </div>
    );
  }

  return (
    <>
      <div className="p-8 max-w-2xl">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-4"
        >
          <iconify-icon icon="lucide:arrow-left"></iconify-icon>
          Back
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-neutral-400 mb-6 flex-wrap">
          <Link
            href={`/dashboard/${workspaceSlug}`}
            className="hover:text-neutral-600 transition-colors"
          >
            Dashboard
          </Link>
          {annotation.project && (
            <>
              <iconify-icon
                icon="lucide:chevron-right"
                className="text-xs"
              ></iconify-icon>
              <Link
                href={`/dashboard/${workspaceSlug}/projects/${annotation.project.slug}`}
                className="hover:text-neutral-600 transition-colors"
              >
                {annotation.project.name}
              </Link>
            </>
          )}
        </nav>

        {/* Title */}
        <h1 className="text-2xl font-instrument-serif text-neutral-900 mb-3">
          {annotation.title}
        </h1>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {annotation.priority && (
            <span
              className={`text-xs px-2 py-1 rounded font-medium ${
                annotation.priority === "high"
                  ? "bg-red-100 text-red-700"
                  : annotation.priority === "medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {annotation.priority} priority
            </span>
          )}
          {annotation.type && (
            <span className="text-xs px-2 py-1 rounded font-medium bg-neutral-100 text-neutral-600">
              {annotation.type}
            </span>
          )}
        </div>

        {/* Screenshot thumbnail */}
        {annotation.screenshotAnnotated && (
          <div className="mb-6">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
              Screenshot
            </h3>
            <button
              onClick={() => setShowLightbox(true)}
              className="group relative block w-48 h-32 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 hover:border-neutral-300 transition-colors"
            >
              <img
                src={annotation.screenshotAnnotated}
                alt={annotation.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                  <iconify-icon
                    icon="lucide:maximize-2"
                    className="text-neutral-700"
                  ></iconify-icon>
                </div>
              </div>
            </button>
            <p className="text-xs text-neutral-400 mt-1">
              Click to view full size
            </p>
          </div>
        )}

        {/* Description */}
        {annotation.description && (
          <div className="mb-6">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-sm text-neutral-700 whitespace-pre-wrap bg-neutral-50 rounded-lg p-4 border border-neutral-100">
              {annotation.description}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-4 mb-6">
          {annotation.pageUrl && (
            <div>
              <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">
                Page URL
              </h3>
              <a
                href={annotation.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline break-all"
              >
                {annotation.pageUrl}
              </a>
            </div>
          )}

          {annotation.pageTitle && (
            <div>
              <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">
                Page Title
              </h3>
              <p className="text-sm text-neutral-700">{annotation.pageTitle}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {annotation.project && (
              <div>
                <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">
                  Project
                </h3>
                <Link
                  href={`/dashboard/${workspaceSlug}/projects/${annotation.project.slug}`}
                  className="text-sm text-accent hover:underline"
                >
                  {annotation.project.name}
                </Link>
              </div>
            )}

            {annotation.user && (
              <div>
                <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">
                  Created By
                </h3>
                <p className="text-sm text-neutral-700">
                  {annotation.user.name}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">
                Created
              </h3>
              <p className="text-sm text-neutral-700">
                {formatDate(annotation.createdAt)}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">
                Updated
              </h3>
              <p className="text-sm text-neutral-700">
                {formatDate(annotation.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium text-neutral-700 transition-colors"
          >
            <iconify-icon
              icon={copied ? "lucide:check" : "lucide:link"}
            ></iconify-icon>
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && annotation.screenshotAnnotated && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-20"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <iconify-icon icon="lucide:x" className="text-4xl"></iconify-icon>
          </button>
          <img
            src={annotation.screenshotAnnotated}
            alt={annotation.title}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
