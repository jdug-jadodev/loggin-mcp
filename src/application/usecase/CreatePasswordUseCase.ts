import { CreatePasswordUseCasePort } from '../../domain/port/portin/CreatePasswordUseCasePort';
import { CreatePasswordInputDTO } from '../dto/CreatePasswordInputDTO';
import { CreatePasswordResultDTO } from '../dto/CreatePasswordResultDTO';
import { UserRepositoryPort } from '../../domain/port/portout/UserRepositoryPort';
import { PasswordTokenRepositoryPort } from '../../domain/port/portout/PasswordTokenRepositoryPort';
import { validatePasswordStrength } from '../validator/password';
import { isValidEmail } from '../validator/email';
import { EmailNotFoundError } from '../exception/EmailNotFoundError';
import { UserAlreadyHasPasswordError } from '../exception/UserAlreadyHasPasswordError';
import { HashingError } from '../exception/HashingError';
import { TokenAlreadyUsedError } from '../exception/TokenAlreadyUsedError';
import { TokenNotFoundError } from '../exception/TokenNotFoundError';
import { TokenTypeMismatchError } from '../exception/TokenTypeMismatchError';
import { hashPassword } from '../../utils/password';

export class CreatePasswordUseCase implements CreatePasswordUseCasePort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordTokenRepository?: PasswordTokenRepositoryPort
  ) {}

  async execute(input: CreatePasswordInputDTO): Promise<CreatePasswordResultDTO> {
    // Token-based flow (from emailed link)
    if (input.token) {
      if (!this.passwordTokenRepository) {
        throw new Error('PasswordTokenRepository not configured');
      }

      const validation = await this.passwordTokenRepository.validateToken(input.token, 'password_creation');
      if (!validation.valid) {
        const msg = validation.message || 'Invalid token';
        if (msg.includes('not found')) throw new TokenNotFoundError();
        if (msg.includes('already used')) throw new TokenAlreadyUsedError();
        if (msg.includes('expired')) throw new TokenNotFoundError('Token expired');
        throw new Error(msg);
      }

      const userId = validation.userId!;
      const user = await this.userRepository.findById(userId);
      if (!user) throw new EmailNotFoundError();
      if (user.hasPassword) throw new UserAlreadyHasPasswordError();

      validatePasswordStrength(input.password, user.email);

      try {
        const passwordHash = await hashPassword(input.password);
        await this.userRepository.updatePassword(user.id, passwordHash);
        await this.passwordTokenRepository.markTokenAsUsed(input.token);

        return {
          success: true,
          userId: user.id,
          email: user.email,
          message: 'Password created successfully'
        };
      } catch (error) {
        throw new HashingError((error as Error).message);
      }
    }

    // Existing email-based flow
    if (!input.email || !isValidEmail(input.email)) {
      throw new Error('Invalid email format');
    }

    validatePasswordStrength(input.password, input.email);

    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new EmailNotFoundError();
    }

    if (user.hasPassword) {
      throw new UserAlreadyHasPasswordError();
    }

    try {
      const passwordHash = await hashPassword(input.password);
      await this.userRepository.updatePassword(user.id, passwordHash);

      return {
        success: true,
        userId: user.id,
        email: user.email,
        message: 'Password created successfully'
      };
    } catch (error) {
      throw new HashingError((error as Error).message);
    }
  }
}
