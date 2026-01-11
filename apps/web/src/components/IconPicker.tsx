"use client";

import { useState } from "react";

// Curated list of workspace icons (emojis)
export const WORKSPACE_ICONS = [
  "📁",
  "💼",
  "🏠",
  "🚀",
  "⭐",
  "💡",
  "🎯",
  "📊",
  "🔧",
  "🎨",
  "📱",
  "💻",
  "🌐",
  "📝",
  "🔬",
  "🎮",
  "📚",
  "🏢",
  "🌟",
  "⚡",
  "🔥",
  "💎",
  "🎪",
  "🌈",
  "🎵",
  "📷",
  "🎬",
  "🏆",
  "💰",
  "🔒",
  "🌍",
  "🎁",
];

export const DEFAULT_WORKSPACE_ICON = "📁";

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
}

export function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Selected icon button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors w-full"
      >
        <span className="text-2xl">
          {selectedIcon || DEFAULT_WORKSPACE_ICON}
        </span>
        <span className="text-sm text-neutral-600 flex-1 text-left">
          {selectedIcon ? "Change icon" : "Select an icon"}
        </span>
        <iconify-icon
          icon={isOpen ? "lucide:chevron-up" : "lucide:chevron-down"}
          className="text-neutral-400"
        ></iconify-icon>
      </button>

      {/* Icon picker dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg p-3 z-50">
          <div className="grid grid-cols-8 gap-1">
            {WORKSPACE_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => {
                  onSelect(icon);
                  setIsOpen(false);
                }}
                className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg transition-colors ${
                  selectedIcon === icon
                    ? "bg-accent/10 ring-2 ring-accent"
                    : "hover:bg-neutral-100"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
