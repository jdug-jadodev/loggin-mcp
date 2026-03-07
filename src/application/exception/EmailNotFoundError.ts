import { AuthError } from './AuthError';

export class EmailNotFoundError extends AuthError {
  constructor(message = 'Email not found in system', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'EmailNotFoundError';
  }
}
