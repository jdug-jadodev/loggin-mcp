import { AuthError } from './AuthError';

export class WeakPasswordError extends AuthError {
  constructor(message = 'Password does not meet strength requirements', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'WeakPasswordError';
  }
}
