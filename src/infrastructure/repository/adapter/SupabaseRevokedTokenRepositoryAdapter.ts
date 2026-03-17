import { RevokedTokenRepositoryPort } from '../../../domain/port/portout/RevokedTokenRepositoryPort';
import { supabase } from '../../config/supabase';

export class SupabaseRevokedTokenRepositoryAdapter implements RevokedTokenRepositoryPort {
  async revokeToken(jti: string, expiresAt: Date): Promise<void> {
    const { error } = await supabase.from('revoked_tokens').insert({ jti, expires_at: expiresAt });
    if (error) throw new Error(`Error revoking token: ${error.message}`);
  }

  async isRevoked(jti: string): Promise<boolean> {
    const { data, error } = await supabase.from('revoked_tokens').select('jti').eq('jti', jti).limit(1).single();
    if (error) {
      // If not found, supabase returns an error when single() and no rows; handle gracefully
      if ((error as any).code === 'PGRST116') return false;
      throw new Error(`Error checking revoked token: ${error.message}`);
    }
    return Boolean(data);
  }

  async deleteExpiredRevokedTokens(): Promise<void> {
    const { error } = await supabase.from('revoked_tokens').delete().lt('expires_at', new Date());
    if (error) throw new Error(`Error deleting expired revoked tokens: ${error.message}`);
  }
}

export default SupabaseRevokedTokenRepositoryAdapter;
