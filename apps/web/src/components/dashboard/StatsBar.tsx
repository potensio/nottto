"use client";

export interface StatsBarProps {
  totalAnnotations: number;
  thisWeekCount: number;
  highPriorityCount: number;
  isLoading?: boolean;
}

export function StatsBar({
  totalAnnotations,
  thisWeekCount,
  highPriorityCount,
  isLoading = false,
}: StatsBarProps) {
  if (isLoading) {
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

  const stats = [
    {
      value: totalAnnotations,
      label: "Total Annotations",
      icon: "lucide:image",
    },
    {
      value: thisWeekCount,
      label: "This Week",
      icon: "lucide:calendar",
    },
    {
      value: highPriorityCount,
      label: "High Priority",
      icon: "lucide:alert-triangle",
      highlight: highPriorityCount > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`bg-white p-6 rounded-lg border transition-colors ${
            stat.highlight
              ? "border-red-200 bg-red-50/50"
              : "border-neutral-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`text-3xl font-instrument-serif ${
                stat.highlight ? "text-red-600" : "text-neutral-900"
              }`}
            >
              {stat.value}
            </div>
            <iconify-icon
              icon={stat.icon}
              className={`text-xl ${
                stat.highlight ? "text-red-400" : "text-neutral-300"
              }`}
            ></iconify-icon>
          </div>
          <div className="text-xs text-neutral-500 uppercase tracking-wider">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsBar;
