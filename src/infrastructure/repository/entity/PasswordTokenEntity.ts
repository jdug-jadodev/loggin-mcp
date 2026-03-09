export interface PasswordTokenEntity {
  id: string;
  user_id: string;
  token: string;
  type: 'password_creation' | 'password_reset';
  expires_at: string;
  used: boolean;
  used_at?: string | null;
  created_at: string;
}
