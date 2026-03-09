import * as bcrypt from 'bcrypt';
import { getSaltRounds } from './getSaltRounds';

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }

  try {
    const saltRounds = getSaltRounds();
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  } catch (error) {
    throw new Error(`Failed to hash password: ${(error as Error).message}`);
  }
}
