import { UserRepositoryPort } from '../../domain/port/portout/UserRepositoryPort';
import { validatePasswordStrength } from '../validator/PasswordValidator';
import { isValidEmail } from '../validator/EmailValidator';
import { EmailNotFoundError } from '../exception/EmailNotFoundError';
import { UserAlreadyHasPasswordError } from '../exception/UserAlreadyHasPasswordError';
import { HashingError } from '../exception/HashingError';
import { CreatePasswordResultDTO } from '../dto/CreatePasswordResultDTO';
import { hashPassword } from '../../utils/password';

export class CreatePasswordUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(email: string, password: string): Promise<CreatePasswordResultDTO> {
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    validatePasswordStrength(password, email);

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new EmailNotFoundError();
    }

    if (user.hasPassword) {
      throw new UserAlreadyHasPasswordError();
    }

    try {
      const passwordHash = await hashPassword(password);
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
