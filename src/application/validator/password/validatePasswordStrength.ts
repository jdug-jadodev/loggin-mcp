import { WeakPasswordError } from '../../exception/WeakPasswordError';

export function validatePasswordStrength(password: string, email?: string): void {
  if (!password || typeof password !== 'string') {
    throw new WeakPasswordError('Password cannot be empty');
  }

  const trimmed = password.trim();
  if (trimmed.length < 8) {
    throw new WeakPasswordError('Password must be at least 8 characters long');
  }

  if (trimmed.length > 72) {
    throw new WeakPasswordError('Password must be at most 72 characters long');
  }

  if (!/[A-Z]/.test(trimmed)) {
    throw new WeakPasswordError('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(trimmed)) {
    throw new WeakPasswordError('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(trimmed)) {
    throw new WeakPasswordError('Password must contain at least one number');
  }

  if (email && trimmed.toLowerCase().includes(email.toLowerCase())) {
    throw new WeakPasswordError('Password must not contain the email');
  }
}
