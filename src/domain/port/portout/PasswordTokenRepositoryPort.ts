export interface TokenValidationResult {
  readonly valid: boolean;
  readonly userId?: string;
  readonly email?: string;
  readonly message?: string;
}

export interface PasswordTokenRepositoryPort {
  createToken(
    userId: string,
    token: string,
    type: 'password_creation' | 'password_reset',
    expiresAt: Date
  ): Promise<void>;

  validateToken(token: string, type: string): Promise<TokenValidationResult>;
  markTokenAsUsed(token: string): Promise<void>;
  deleteExpiredTokens(): Promise<void>;
}
