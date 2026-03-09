export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  hasPassword: boolean;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}
