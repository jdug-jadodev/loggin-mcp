import { RegisterEmailUseCasePort } from '../../domain/port/portin/RegisterEmailUseCasePort';
import { RegisterEmailInputDTO } from '../dto/RegisterEmailInputDTO';
import { RegisterEmailResultDTO } from '../dto/RegisterEmailResultDTO';
import { UserRepositoryPort } from '../../domain/port/portout/UserRepositoryPort';
import { PasswordTokenRepositoryPort } from '../../domain/port/portout/PasswordTokenRepositoryPort';
import { EmailServicePort } from '../../domain/port/portout/EmailServicePort';
import { EmailValidator } from '../validator/email';
import { EmailAlreadyExistsError } from '../exception/EmailAlreadyExistsError';
import { generatePasswordCreationToken } from '../../utils/jwt';

export class RegisterEmailUseCase implements RegisterEmailUseCasePort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordTokenRepository: PasswordTokenRepositoryPort,
    private readonly emailService: EmailServicePort,
    private readonly emailValidator: EmailValidator
  ) {}

  async execute(input: RegisterEmailInputDTO): Promise<RegisterEmailResultDTO> {
    // 1. Validar email
    const email = input.email.toLowerCase().trim();
    this.emailValidator.validate(email);

    // 2. Verificar que email NO existe
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new EmailAlreadyExistsError(email);
    }

    // 3. Crear usuario en BD
    const user = await this.userRepository.create(email);

    // 4. Generar token JWT con jti único
    const token = generatePasswordCreationToken(user.id, user.email);

    // 5. Calcular expiración (24 horas)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 6. Persistir token en BD
    await this.passwordTokenRepository.createToken(
      user.id,
      token,
      'password_creation',
      expiresAt
    );

    // 7. Intentar enviar email (sin fallar si hay error)
    let emailSent = true;
    let message = 'User registered successfully. Password creation email sent.';

    try {
      await this.emailService.sendPasswordCreationEmail(user.email, token);
    } catch (error) {
      emailSent = false;
      message = 'User registered but email failed to send. Admin can resend token manually.';
      // Log error pero no lanzar excepción
      console.error('Failed to send password creation email:', error);
    }

    // 8. Retornar resultado
    return {
      userId: user.id,
      email: user.email,
      message,
      emailSent
    };
  }
}
