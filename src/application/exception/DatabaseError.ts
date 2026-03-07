import { AuthError } from './AuthError';

export class DatabaseError extends AuthError {
  constructor(message = 'Database operation failed', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'DatabaseError';
  }
}
