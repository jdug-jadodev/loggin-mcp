export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  hasPassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}
