import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface PasswordTokenPayload extends jwt.JwtPayload {
  userId: string;
  email: string;
  type: 'password_creation' | 'password_reset';
  jti: string;
}

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

export function verifyToken(token: string): JwtPayload & jwt.JwtPayload {
  if (!token || token.trim().length === 0) {
    throw new Error('Token is required');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim().length === 0) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload & jwt.JwtPayload;
    return decoded;
  } catch (error) {
    throw error;
  }
}

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

export function generatePasswordResetToken(userId: string, email: string): string {
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
    type: 'password_reset',
    jti: uuidv4()
  };

  try {
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: '15m'
    });

    return token;
  } catch (error) {
    throw new Error(`Failed to generate password reset token: ${(error as Error).message}`);
  }
}

