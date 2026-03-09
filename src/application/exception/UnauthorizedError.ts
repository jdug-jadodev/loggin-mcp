import { AuthError } from './AuthError';

export class UnauthorizedError extends AuthError {
  constructor(message = 'Unauthorized access', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'UnauthorizedError';
  }
}
