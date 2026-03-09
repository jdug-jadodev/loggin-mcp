import * as jwt from 'jsonwebtoken';
import { JwtPayload } from './types/JwtPayload';

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
