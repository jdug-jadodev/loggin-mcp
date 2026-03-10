import { AuthError } from './AuthError';

export class TokenNotFoundError extends AuthError {
  constructor(message = 'Token not found', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'TokenNotFoundError';
  }
}
