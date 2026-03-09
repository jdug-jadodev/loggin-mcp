export interface UserEntity {
  id: string;
  email: string;
  password_hash: string | null;
  has_password: boolean;
  role?: string;
  created_at: string;
  updated_at: string;
}
