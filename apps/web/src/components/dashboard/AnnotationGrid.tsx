"use client";

import { AnnotationCard, AnnotationCardProps } from "./AnnotationCard";
import { AnnotationCardSkeleton } from "./Skeletons";

export interface AnnotationGridProps {
  annotations: AnnotationCardProps["annotation"][];
  workspaceSlug: string;
  isLoading?: boolean;
  onAnnotationClick?: (id: string) => void;
}

export function AnnotationGrid({
  annotations,
  workspaceSlug,
  isLoading = false,
  onAnnotationClick,
}: AnnotationGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <AnnotationCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (annotations.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {annotations.map((annotation) => (
        <AnnotationCard
          key={annotation.id}
          annotation={annotation}
          workspaceSlug={workspaceSlug}
          onClick={
            onAnnotationClick
              ? () => onAnnotationClick(annotation.id)
              : undefined
          }
        />
      ))}
    </div>
  );
}

export default AnnotationGrid;
