import { User } from '../../../domain/entity/User';
import { LoginResultDTO } from '../../dto/LoginResultDTO';
import { getTokenExpiration } from '../../../utils/jwt/expiration';

export function toLoginResultDTO(user: User, token: string): LoginResultDTO {
  const { expiresIn, expiresMs } = getTokenExpiration();

  return {
    token,
    userId: user.id,
    email: user.email,
    expiresIn,
    expiresAt: Date.now() + expiresMs
  };
}
