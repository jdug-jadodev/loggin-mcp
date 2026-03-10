import { User } from '../../../domain/entity/User';
import { LoginResultDTO } from '../../dto/LoginResultDTO';

export function toLoginResultDTO(user: User, token: string): LoginResultDTO {
  return {
    token,
    userId: user.id,
    email: user.email,
    expiresIn: '15h',
    expiresAt: Date.now() + 15 * 60 * 60 * 1000
  };
}
