import * as jwt from 'jsonwebtoken';

export interface PasswordTokenPayload extends jwt.JwtPayload {
  userId: string;
  email: string;
  type: 'password_creation' | 'password_reset';
  jti: string;
}
