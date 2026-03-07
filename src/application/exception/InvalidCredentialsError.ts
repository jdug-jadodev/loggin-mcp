import { AuthError } from './AuthError';

export class InvalidCredentialsError extends AuthError {
  constructor(message = 'Invalid email or password', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'InvalidCredentialsError';
  }
}
