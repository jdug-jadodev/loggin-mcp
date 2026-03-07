import { AuthError } from './AuthError';

export class ValidationError extends AuthError {
  constructor(message = 'Validation error', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'ValidationError';
  }
}
