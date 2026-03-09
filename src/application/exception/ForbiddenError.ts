import { AuthError } from './AuthError';

export class ForbiddenError extends AuthError {
  constructor(message = 'Access denied. Admin privileges required', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'ForbiddenError';
  }
}
