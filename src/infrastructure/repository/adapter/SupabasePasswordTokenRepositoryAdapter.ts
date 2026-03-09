import { supabase } from '../../config/supabase';
import { PasswordTokenRepositoryPort } from '../../../domain/port/portout/PasswordTokenRepositoryPort';
import { PasswordTokenEntity } from '../entity/PasswordTokenEntity';

export class SupabasePasswordTokenRepositoryAdapter implements PasswordTokenRepositoryPort {
  async createToken(userId: string, token: string, type: 'password_creation' | 'password_reset', expiresAt: Date): Promise<void> {
    const { error } = await supabase
      .from('password_tokens')
      .insert({
        user_id: userId,
        token,
        type,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (error) {
      throw new Error(`Error creating password token: ${error.message}`);
    }
  }

  async validateToken(token: string, type: 'password_creation' | 'password_reset') {
    const { data, error } = await supabase
      .from('password_tokens')
      .select('*')
      .eq('token', token)
      .eq('type', type)
      .single();

    if (error) {
      return { valid: false, reason: 'NOT_FOUND' };
    }

    const row = data as PasswordTokenEntity;
    const now = new Date();
    const expires = new Date(row.expires_at);

    if (row.used) {
      return { valid: false, reason: 'ALREADY_USED' };
    }

    if (expires <= now) {
      return { valid: false, reason: 'EXPIRED' };
    }

    // Fetch user email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', row.user_id)
      .single();

    if (userError) {
      return { valid: false, reason: 'USER_NOT_FOUND' };
    }

    return { valid: true, userId: row.user_id, email: (userData as any).email };
  }

  async markTokenAsUsed(token: string): Promise<void> {
    const { error } = await supabase
      .from('password_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', token);

    if (error) {
      throw new Error(`Error marking token as used: ${error.message}`);
    }
  }

  async deleteExpiredTokens(): Promise<void> {
    const { error } = await supabase
      .from('password_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .eq('used', true);

    if (error) {
      throw new Error(`Error deleting expired tokens: ${error.message}`);
    }
  }
}
