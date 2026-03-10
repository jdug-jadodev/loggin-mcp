import { CreatePasswordUseCasePort } from '../../domain/port/portin/CreatePasswordUseCasePort';
import { CreatePasswordInputDTO } from '../dto/CreatePasswordInputDTO';
import { CreatePasswordResultDTO } from '../dto/CreatePasswordResultDTO';
import { UserRepositoryPort } from '../../domain/port/portout/UserRepositoryPort';
import { validatePasswordStrength } from '../validator/password';
import { isValidEmail } from '../validator/email';
import { EmailNotFoundError } from '../exception/EmailNotFoundError';
import { UserAlreadyHasPasswordError } from '../exception/UserAlreadyHasPasswordError';
import { HashingError } from '../exception/HashingError';
import { hashPassword } from '../../utils/password';

export class CreatePasswordUseCase implements CreatePasswordUseCasePort {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(input: CreatePasswordInputDTO): Promise<CreatePasswordResultDTO> {
    if (!isValidEmail(input.email)) {
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
