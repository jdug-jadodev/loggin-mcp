import { isValidEmail } from './isValidEmail';

export function validateEmailOrThrow(email: string): void {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }
}
