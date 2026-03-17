export interface RevokedTokenRepositoryPort {
  revokeToken(jti: string, expiresAt: Date): Promise<void>;
  isRevoked(jti: string): Promise<boolean>;
  deleteExpiredRevokedTokens(): Promise<void>;
}

export default RevokedTokenRepositoryPort;
