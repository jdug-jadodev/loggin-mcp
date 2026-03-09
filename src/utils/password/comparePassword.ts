import * as bcrypt from 'bcrypt';

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!password || password.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }

  if (!hash || hash.trim().length === 0) {
    throw new Error('Hash cannot be empty');
  }

  try {
    const bcryptHashRegex = /^\$2[aby]\$\d{2}\$/;
    if (!bcryptHashRegex.test(hash)) {
      throw new Error('Invalid hash format');
    }

    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    throw new Error(`Failed to compare password: ${(error as Error).message}`);
  }
}
