import { User } from '../../entity/User';

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(email: string, role?: string): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<User>;
}
