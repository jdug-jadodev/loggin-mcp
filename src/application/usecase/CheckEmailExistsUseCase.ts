import { UserRepositoryPort } from '../../domain/port/portout/UserRepositoryPort';
import { isValidEmail } from '../validator/EmailValidator';
import { EmailNotFoundError } from '../exception/EmailNotFoundError';
import { EmailCheckResultDTO } from '../dto/EmailCheckResultDTO';

export class CheckEmailExistsUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(email: string): Promise<EmailCheckResultDTO> {
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new EmailNotFoundError();
    }

    return {
      exists: true,
      hasPassword: user.hasPassword,
      email: user.email
    };
  }
}
