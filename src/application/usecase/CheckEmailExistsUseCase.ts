import { CheckEmailExistsUseCasePort } from '../../domain/port/portin/CheckEmailExistsUseCasePort';
import { CheckEmailInputDTO } from '../dto/CheckEmailInputDTO';
import { EmailCheckResultDTO } from '../dto/EmailCheckResultDTO';
import { UserRepositoryPort } from '../../domain/port/portout/UserRepositoryPort';
import { isValidEmail } from '../validator/email';
import { EmailNotFoundError } from '../exception/EmailNotFoundError';

export class CheckEmailExistsUseCase implements CheckEmailExistsUseCasePort {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(input: CheckEmailInputDTO): Promise<EmailCheckResultDTO> {
    if (!isValidEmail(input.email)) {
      throw new Error('Invalid email format');
    }

    const user = await this.userRepository.findByEmail(input.email);
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
