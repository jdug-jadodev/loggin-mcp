import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { PasswordTokenPayload } from './types/PasswordTokenPayload';

const MIN_SECRET_LENGTH = 32;

export function generatePasswordCreationToken(userId: string, email: string): string {
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

  const payload: PasswordTokenPayload = {
    userId,
    email,
    type: 'password_creation',
    jti: uuidv4()
  };

  try {
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: '24h'
    });

    return token;
  } catch (error) {
    throw new Error(`Failed to generate password creation token: ${(error as Error).message}`);
  }
}
