import * as jwt from 'jsonwebtoken';
import { JwtPayload } from './types/JwtPayload';

const TOKEN_EXPIRATION = '15h';
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
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  if (jwtSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`);
  }

  const payload: JwtPayload = {
    userId,
    email
  };

  try {
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: TOKEN_EXPIRATION
    });

    return token;
  } catch (error) {
    throw new Error(`Failed to generate token: ${(error as Error).message}`);
  }
}
