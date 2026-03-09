import { AuthError } from './AuthError';

export class InvalidTokenError extends AuthError {
  constructor(message = 'Invalid token', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'InvalidTokenError';
  }
}
