/**
 * Email validation regex pattern.
 * Matches most common email formats while being permissive enough
 * for edge cases like plus addressing (user+tag@domain.com).
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates an email address format.
 * Returns validation result with error message if invalid.
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: "Email is required" };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length > 255) {
    return { isValid: false, error: "Email is too long" };
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true };
}

/**
 * Checks if a string is a valid email format.
 * Simple boolean check without error message.
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email).isValid;
}
