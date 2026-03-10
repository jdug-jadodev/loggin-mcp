import { AuthError } from './AuthError';

export class TokenAlreadyUsedError extends AuthError {
  constructor(message = 'Token already used', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'TokenAlreadyUsedError';
  }
}
