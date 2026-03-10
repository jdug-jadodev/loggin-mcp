import { PasswordTokenRepositoryPort, TokenValidationResult } from '../../../domain/port/portout/PasswordTokenRepositoryPort';
import { supabase } from '../../config/supabase';

export class SupabasePasswordTokenRepositoryAdapter implements PasswordTokenRepositoryPort {
  async createToken(userId: string, token: string, type: 'password_creation' | 'password_reset', expiresAt: Date): Promise<void> {
    const { error } = await supabase.from('password_tokens').insert({
      user_id: userId,
      token,
      type,
      expires_at: expiresAt,
      used: false
    });

    if (error) {
      throw new Error(`Error inserting password token: ${error.message}`);
    }
  }

  async validateToken(token: string, type: string): Promise<TokenValidationResult> {
    const { data, error } = await supabase
      .from('password_tokens')
      .select('*')
      .eq('token', token)
      .limit(1)
      .single();

    if (error) {
      return { valid: false, message: `DB error: ${error.message}` };
    }

    if (!data) return { valid: false, message: 'Token not found' };

    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (data.used) return { valid: false, message: 'Token already used' };
    if (expiresAt < now) return { valid: false, message: 'Token expired' };
    if (data.type !== type) return { valid: false, message: 'Invalid token type' };

    return { valid: true, userId: data.user_id, email: data.email };
  }

  async markTokenAsUsed(token: string): Promise<void> {
    const { error } = await supabase
      .from('password_tokens')
      .update({ used: true, used_at: new Date() })
      .eq('token', token);

    if (error) {
      throw new Error(`Error marking token as used: ${error.message}`);
    }
  }

  async deleteExpiredTokens(): Promise<void> {
    const { error } = await supabase
      .from('password_tokens')
      .delete()
      .lt('expires_at', new Date())
      .eq('used', true);

    if (error) {
      throw new Error(`Error deleting expired tokens: ${error.message}`);
    }
  }
}

export default SupabasePasswordTokenRepositoryAdapter;
