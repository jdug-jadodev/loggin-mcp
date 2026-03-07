export class AuthError extends Error {
  public readonly timestamp: string;
  public readonly context?: Record<string, unknown>;

  constructor(message?: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'AuthError';
    this.timestamp = new Date().toISOString();
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}
