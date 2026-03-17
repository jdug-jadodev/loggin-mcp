import { PasswordTokenRepositoryPort } from '../../domain/port/portout/PasswordTokenRepositoryPort';
import { ValidatePasswordTokenResultDTO } from '../dto/ValidatePasswordTokenResultDTO';

export class ValidatePasswordTokenUseCase {
  constructor(private readonly passwordTokenRepository: PasswordTokenRepositoryPort) {}

  async execute(input: {
    token: string;
    type: 'password_creation' | 'password_reset';
  }): Promise<ValidatePasswordTokenResultDTO> {
    try {
      const result = await this.passwordTokenRepository.validateToken(input.token, input.type);

      // Mapear resultado del repositorio a DTO con estado específico
      if (result.valid) {
        return {
          valid: true,
          status: 'valid',
          message: 'Token is valid and ready to be used',
          email: result.email
        };
      }

      // Determinar estado basado en el mensaje del repositorio
      const message = result.message || '';

      if (message.toLowerCase().includes('already used')) {
        return {
          valid: false,
          status: 'used',
          message: 'This token has already been used. Please request a new one.'
        };
      }

      if (message.toLowerCase().includes('expired')) {
        return {
          valid: false,
          status: 'expired',
          message: 'This token has expired. Please request a new one.'
        };
      }

      if (message.toLowerCase().includes('not found')) {
        return {
          valid: false,
          status: 'not_found',
          message: 'Token not found. It may have been deleted or never existed.'
        };
      }

      if (message.toLowerCase().includes('invalid token type')) {
        return {
          valid: false,
          status: 'invalid_type',
          message: 'This token cannot be used for this operation.'
        };
      }

      // Cualquier otro error
      return {
        valid: false,
        status: 'error',
        message: 'An error occurred while validating the token.'
      };
    } catch (error) {
      return {
        valid: false,
        status: 'error',
        message: 'An error occurred while validating the token.'
      };
    }
  }
}
