import { AuthError } from './AuthError';

export class TokenTypeMismatchError extends AuthError {
  constructor(message = 'Token type mismatch', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'TokenTypeMismatchError';
  }
}
