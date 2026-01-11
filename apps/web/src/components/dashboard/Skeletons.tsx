"use client";

export function AnnotationCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden animate-pulse">
      <div className="h-40 bg-neutral-100"></div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="h-5 w-3/4 bg-neutral-200 rounded"></div>
          <div className="h-5 w-12 bg-neutral-100 rounded"></div>
        </div>
        <div className="h-4 w-1/2 bg-neutral-100 rounded"></div>
        <div className="h-3 w-2/3 bg-neutral-100 rounded"></div>
        <div className="h-3 w-1/4 bg-neutral-100 rounded"></div>
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-3 py-2 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-neutral-200 rounded"></div>
            <div className="h-4 w-24 bg-neutral-200 rounded"></div>
          </div>
          <div className="h-5 w-8 bg-neutral-100 rounded-full"></div>
        </div>
      ))}
    </div>
  );
}

export function StatsBarSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white p-6 rounded-lg border border-neutral-200 animate-pulse"
        >
          <div className="h-8 w-16 bg-neutral-200 rounded mb-2"></div>
          <div className="h-4 w-24 bg-neutral-100 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-8 animate-pulse">
      <div className="h-6 w-48 bg-neutral-200 rounded mb-6"></div>
      <StatsBarSkeleton />
      <div className="h-6 w-32 bg-neutral-200 rounded mb-4"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <AnnotationCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function AnnotationDetailSkeleton() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse">
      <div className="h-5 w-64 bg-neutral-200 rounded mb-6"></div>
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="h-96 bg-neutral-100"></div>
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-neutral-200 rounded"></div>
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-neutral-100 rounded"></div>
                <div className="h-6 w-16 bg-neutral-100 rounded"></div>
              </div>
            </div>
            <div className="h-10 w-28 bg-neutral-100 rounded-lg"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-neutral-200 rounded"></div>
            <div className="h-4 w-full bg-neutral-100 rounded"></div>
            <div className="h-4 w-3/4 bg-neutral-100 rounded"></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 bg-neutral-200 rounded"></div>
                <div className="h-4 w-32 bg-neutral-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
