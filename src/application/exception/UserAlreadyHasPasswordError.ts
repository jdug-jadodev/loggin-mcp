import { AuthError } from './AuthError';

export class UserAlreadyHasPasswordError extends AuthError {
  constructor(message = 'User already has a password', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'UserAlreadyHasPasswordError';
  }
}
