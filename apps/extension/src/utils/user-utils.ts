// User utility functions for the Chrome extension

import type { User } from "./auth-storage";

/**
 * Derives initials from a user's name or email.
 * Returns the first character of the name (uppercased) if name exists,
 * otherwise returns the first character of the email (uppercased).
 */
export function getInitials(user: User): string {
  if (user.name && user.name.trim().length > 0) {
    return user.name.trim().charAt(0).toUpperCase();
  }
  return user.email.charAt(0).toUpperCase();
}

/**
 * Generates a consistent background color based on user ID or email.
 * Uses a simple hash to pick from a predefined color palette.
 */
export function getAvatarColor(user: User): string {
  const colors = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#14b8a6", // teal
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
  ];

  const str = user.id || user.email;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
