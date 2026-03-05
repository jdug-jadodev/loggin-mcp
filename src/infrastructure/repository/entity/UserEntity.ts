export interface UserEntity {
  id: string;
  email: string;
  password_hash: string | null;
  has_password: boolean;
  created_at: string;
  updated_at: string;
}
