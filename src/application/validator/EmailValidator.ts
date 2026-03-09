import { ValidationError } from '../exception/ValidationError';

export class EmailValidator {
  private readonly emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  validate(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new ValidationError('Email is required');
    }

    const trimmedEmail = email.trim();

    if (!this.emailRegex.test(trimmedEmail)) {
      throw new ValidationError(
        `Invalid email format: ${trimmedEmail}. Email must match pattern: user@domain.com`
      );
    }
  }
}

// Legacy exported functions for backwards compatibility
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function validateEmailOrThrow(email: string): void {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }
}
