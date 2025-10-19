/**
 * Validation utility functions for form inputs
 */

/**
 * Validates email format using regex
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates password complexity
 * Returns validation result with specific error messages
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain a number')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain a special character: !@#$%^&*')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validates that two passwords match
 */
export function validatePasswordMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword
}

/**
 * Validates string length
 */
export function validateLength(value: string, min: number, max: number): boolean {
  const length = value.length
  return length >= min && length <= max
}

/**
 * Sanitizes input by trimming whitespace
 */
export function sanitizeInput(value: string): string {
  return value.trim()
}

/**
 * Gets password strength level
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  const result = validatePassword(password)

  if (result.valid) {
    return 'strong'
  } else if (password.length >= 8 && result.errors.length <= 2) {
    return 'medium'
  }

  return 'weak'
}
