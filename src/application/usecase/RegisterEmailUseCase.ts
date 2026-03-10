import { RegisterEmailInputDTO } from '../dto/RegisterEmailInputDTO';
import { RegisterEmailResultDTO } from '../dto/RegisterEmailResultDTO';
import { UserRepositoryPort } from '../../domain/port/portout/UserRepositoryPort';
import { PasswordTokenRepositoryPort } from '../../domain/port/portout/PasswordTokenRepositoryPort';
import { EmailServicePort } from '../../domain/port/portout/EmailServicePort';
import { validateEmailOrThrow } from '../validator/email/validateEmailOrThrow';
import { EmailAlreadyExistsError } from '../exception/EmailAlreadyExistsError';
import { EmailSendError } from '../exception/EmailSendError';
import { generatePasswordCreationToken } from '../../utils/jwt';

export class RegisterEmailUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordTokenRepository: PasswordTokenRepositoryPort,
    private readonly emailService: EmailServicePort
  ) {}

  async execute(dto: RegisterEmailInputDTO): Promise<RegisterEmailResultDTO> {
    validateEmailOrThrow(dto.email);

    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new EmailAlreadyExistsError(dto.email);
    }

    const user = await this.userRepository.create(dto.email, 'user');

    const token = generatePasswordCreationToken(user.id, user.email);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.passwordTokenRepository.createToken(user.id, token, 'password_creation', expiresAt);

    let emailSent = true;
    try {
      await this.emailService.sendPasswordCreationEmail(user.email, token);
    } catch (err) {
      emailSent = false;
      throw new EmailSendError((err as Error).message);
    }

    return {
      userId: user.id,
      email: user.email,
      message: 'User created and email sent',
      emailSent
    };
  }
}
export default RegisterEmailUseCase;
