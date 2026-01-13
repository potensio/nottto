"use client";

import { useState } from "react";
import { TEMPLATE_VARIABLES, type VariableInfo } from "@/lib/types/integration";

interface VariableReferencePanelProps {
  variables?: VariableInfo[];
}

export function VariableReferencePanel({
  variables = TEMPLATE_VARIABLES,
}: VariableReferencePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-lg">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-neutral-100 transition-colors rounded-t-lg"
      >
        <span className="text-sm font-medium text-neutral-700">
          Available Variables
        </span>
        <iconify-icon
          icon={isExpanded ? "lucide:chevron-up" : "lucide:chevron-down"}
          className="text-neutral-400"
        ></iconify-icon>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 max-h-80 overflow-y-auto">
          {variables.map((variable) => (
            <div key={variable.name} className="text-sm">
              <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-xs font-mono text-neutral-800">
                {variable.name}
              </code>
              <p className="text-neutral-600 mt-1 text-xs">
                {variable.description}
              </p>
              <p className="text-neutral-400 text-xs mt-0.5">
                Example: <span className="italic">{variable.example}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VariableReferencePanel;
