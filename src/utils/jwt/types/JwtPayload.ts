export interface JwtPayload {
  userId: string;
  email: string;
  jti?: string;
}
