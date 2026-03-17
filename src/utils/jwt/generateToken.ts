import * as jwt from 'jsonwebtoken';
import { JwtPayload } from './types/JwtPayload';
import { getTokenExpiration } from './expiration';
import crypto from 'crypto';
import { TokenGenerationError } from '../../application/exception/TokenGenerationError';

const MIN_SECRET_LENGTH = 32;

export function generateToken(userId: string, email: string): string {
  if (!userId || userId.trim().length === 0) {
    throw new Error('userId cannot be empty');
  }

  if (!email || email.trim().length === 0) {
    throw new Error('email cannot be empty');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim().length === 0) {
    throw new TokenGenerationError('JWT_SECRET is not defined in environment variables');
  }

  if (jwtSecret.length < MIN_SECRET_LENGTH) {
    throw new TokenGenerationError(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`);
  }

  const jti = (crypto as any).randomUUID ? (crypto as any).randomUUID() : crypto.randomBytes(16).toString('hex');

  const payload: JwtPayload = {
    userId,
    email
  };

  try {
    const { expiresIn } = getTokenExpiration();

    const token = (jwt.sign as any)(payload, jwtSecret, {
      expiresIn,
      jwtid: jti
    });

    return token;
  } catch (error) {
    throw new TokenGenerationError(`Failed to generate token: ${(error as Error).message}`);
  }
}
