import { AuthError } from './AuthError';

export class TokenExpiredError extends AuthError {
  constructor(message = 'Token has expired', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'TokenExpiredError';
  }
}
