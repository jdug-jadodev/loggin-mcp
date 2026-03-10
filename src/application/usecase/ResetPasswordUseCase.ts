import { ResetPasswordInputDTO } from '../dto/ResetPasswordInputDTO';
import { ResetPasswordResultDTO } from '../dto/ResetPasswordResultDTO';
import { PasswordTokenRepositoryPort } from '../../domain/port/portout/PasswordTokenRepositoryPort';
import { UserRepositoryPort } from '../../domain/port/portout/UserRepositoryPort';
import { validatePasswordStrength } from '../validator/password';
import { hashPassword } from '../../utils/password';
import { TokenNotFoundError } from '../exception/TokenNotFoundError';
import { TokenAlreadyUsedError } from '../exception/TokenAlreadyUsedError';
import { WeakPasswordError } from '../exception/WeakPasswordError';

export class ResetPasswordUseCase {
  constructor(
    private readonly passwordTokenRepository: PasswordTokenRepositoryPort,
    private readonly userRepository: UserRepositoryPort
  ) {}

  async execute(dto: ResetPasswordInputDTO): Promise<ResetPasswordResultDTO> {
    const validation = await this.passwordTokenRepository.validateToken(dto.token, 'password_reset');

    if (!validation.valid) {
      const msg = validation.message || 'Invalid token';
      if (msg.includes('not found')) throw new TokenNotFoundError();
      if (msg.includes('already used')) throw new TokenAlreadyUsedError();
      if (msg.includes('expired')) throw new TokenNotFoundError('Token expired');
      throw new Error(msg);
    }

    const userId = validation.userId!;
    const user = await this.userRepository.findById(userId);
    if (!user) throw new TokenNotFoundError('User for token not found');

    try {
      validatePasswordStrength(dto.newPassword, user.email);
    } catch (err) {
      throw new WeakPasswordError((err as Error).message);
    }

    try {
      const hashed = await hashPassword(dto.newPassword);
      await this.userRepository.updatePassword(user.id, hashed);
      await this.passwordTokenRepository.markTokenAsUsed(dto.token);

      return { success: true, message: 'Password updated' };
    } catch (err) {
      throw err;
    }
  }
}

export default ResetPasswordUseCase;
