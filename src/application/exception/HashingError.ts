import { AuthError } from './AuthError';

export class HashingError extends AuthError {
  constructor(message = 'Failed to hash password', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'HashingError';
  }
}
