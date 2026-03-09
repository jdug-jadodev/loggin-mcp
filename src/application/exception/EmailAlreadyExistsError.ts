import { AuthError } from './AuthError';

export class EmailAlreadyExistsError extends AuthError {
  public readonly code = 'EMAIL_ALREADY_EXISTS';

  constructor(email: string, context?: Record<string, unknown>) {
    super(`Email already registered: ${email}`, context);
    this.name = 'EmailAlreadyExistsError';
  }
}
