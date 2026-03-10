import { ForgotPasswordInputDTO } from '../dto/ForgotPasswordInputDTO';
import { ForgotPasswordResultDTO } from '../dto/ForgotPasswordResultDTO';
import { UserRepositoryPort } from '../../domain/port/portout/UserRepositoryPort';
import { PasswordTokenRepositoryPort } from '../../domain/port/portout/PasswordTokenRepositoryPort';
import { EmailServicePort } from '../../domain/port/portout/EmailServicePort';
import { validateEmailOrThrow } from '../validator/email/validateEmailOrThrow';
import { generatePasswordResetToken } from '../../utils/jwt';

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordTokenRepository: PasswordTokenRepositoryPort,
    private readonly emailService: EmailServicePort
  ) {}

  async execute(dto: ForgotPasswordInputDTO): Promise<ForgotPasswordResultDTO> {
    validateEmailOrThrow(dto.email);

    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      return { message: 'If the email exists, you will receive instructions.', emailSent: false };
    }

    const token = generatePasswordResetToken(user.id, user.email);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.passwordTokenRepository.createToken(user.id, token, 'password_reset', expiresAt);

    let emailSent = true;
    try {
      await this.emailService.sendPasswordResetEmail(user.email, token);
    } catch (err) {
      emailSent = false;
    }

    return { message: 'If the email exists, you will receive instructions.', emailSent };
  }
}

export default ForgotPasswordUseCase;
