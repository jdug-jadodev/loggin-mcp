import { AuthError } from './AuthError';

export class TokenGenerationError extends AuthError {
  constructor(message = 'Failed to generate token', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'TokenGenerationError';
  }
}
