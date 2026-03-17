import { Request, Response } from 'express';
import { CheckEmailExistsUseCasePort } from '../../domain/port/portin/CheckEmailExistsUseCasePort';
import { CreatePasswordUseCasePort } from '../../domain/port/portin/CreatePasswordUseCasePort';
import { LoginUseCasePort } from '../../domain/port/portin/LoginUseCasePort';
import { RegisterEmailUseCase } from '../../application/usecase/RegisterEmailUseCase';
import { ForgotPasswordUseCase } from '../../application/usecase/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../application/usecase/ResetPasswordUseCase';
import { ValidatePasswordTokenUseCase } from '../../application/usecase/ValidatePasswordTokenUseCase';
import { RevokedTokenRepositoryPort } from '../../domain/port/portout/RevokedTokenRepositoryPort';
import { EmailNotFoundError } from '../../application/exception/EmailNotFoundError';
import { UserAlreadyHasPasswordError } from '../../application/exception/UserAlreadyHasPasswordError';
import { InvalidCredentialsError } from '../../application/exception/InvalidCredentialsError';
import { WeakPasswordError } from '../../application/exception/WeakPasswordError';
import { HashingError } from '../../application/exception/HashingError';
import { TokenGenerationError } from '../../application/exception/TokenGenerationError';

export class AuthController {
  constructor(
    private readonly checkEmailExistsUseCase: CheckEmailExistsUseCasePort,
    private readonly createPasswordUseCase: CreatePasswordUseCasePort,
    private readonly loginUseCase: LoginUseCasePort,
    private readonly registerEmailUseCase?: RegisterEmailUseCase,
    private readonly forgotPasswordUseCase?: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase?: ResetPasswordUseCase,
    private readonly revokedTokenRepository?: RevokedTokenRepositoryPort,
    private readonly validatePasswordTokenUseCase?: ValidatePasswordTokenUseCase
  ) {}

  async checkEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body ?? {};
      if (!email) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required field: email',
          code: 'MISSING_FIELD',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await this.checkEmailExistsUseCase.execute({ email });
      res.status(200).json({
        status: 'success',
        exists: result.exists,
        hasPassword: result.hasPassword,
        email: result.email
      });
    } catch (error) {
      if (error instanceof EmailNotFoundError) {
        res.status(404).json({
          status: 'error',
          message: 'Email not found',
          code: 'EMAIL_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  async createPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, token } = req.body ?? {};
      const missing: string[] = [];
      if (!password) missing.push('password');
      if (!email && !token) missing.push('email_or_token');
      if (missing.length > 0) {
        res.status(400).json({
          status: 'error',
          message: `Missing required field(s): ${missing.join(', ')}`,
          code: 'MISSING_FIELDS',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await this.createPasswordUseCase.execute({ email, password, token });
      res.status(201).json({
        status: 'success',
        userId: result.userId,
        email: result.email,
        message: result.message ?? 'Password created successfully'
      });
    } catch (error) {
      if (error instanceof EmailNotFoundError) {
        res.status(404).json({
          status: 'error',
          message: 'Email not found',
          code: 'EMAIL_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      } else if (error instanceof UserAlreadyHasPasswordError) {
        res.status(409).json({
          status: 'error',
          message: 'User already has a password',
          code: 'ALREADY_HAS_PASSWORD',
          timestamp: new Date().toISOString()
        });
      } else if (error instanceof WeakPasswordError) {
        res.status(400).json({
          status: 'error',
          message: error.message || 'Weak password',
          code: 'WEAK_PASSWORD',
          timestamp: new Date().toISOString()
        });
      } else if (error instanceof HashingError) {
        res.status(500).json({
          status: 'error',
          message: 'Error hashing password',
          code: 'HASHING_ERROR',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body ?? {};
      const missing: string[] = [];
      if (!email) missing.push('email');
      if (!password) missing.push('password');
      if (missing.length > 0) {
        res.status(400).json({
          status: 'error',
          message: `Missing required field(s): ${missing.join(', ')}`,
          code: 'MISSING_FIELDS',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await this.loginUseCase.execute({ email, password });
      res.status(200).json({
        status: 'success',
        token: result.token,
        user: {
          userId: result.userId,
          email: result.email
        },
        expiresIn: result.expiresIn
      });
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
          timestamp: new Date().toISOString()
        });
      } else if (error instanceof TokenGenerationError) {
        console.error('Token generation error during login:', error);
        res.status(500).json({
          status: 'error',
          message: 'Token generation failed',
          code: 'TOKEN_ERROR',
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('login error', error);
        res.status(500).json({
          status: 'error',
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  async registerEmail(req: Request, res: Response): Promise<void> {
    try {
      if (!this.registerEmailUseCase) {
        res.status(500).json({ status: 'error', message: 'RegisterEmailUseCase not configured', code: 'INTERNAL_ERROR' });
        return;
      }

      const { email } = req.body ?? {};
      if (!email) {
        res.status(400).json({ status: 'error', message: 'Missing required field: email', code: 'MISSING_FIELD' });
        return;
      }

      const result = await this.registerEmailUseCase.execute({ email });
      res.status(201).json({ status: 'success', ...result });
    } catch (error) {
      // Email already exists
      if (error && (error as any).name === 'EmailAlreadyExistsError') {
        res.status(409).json({ status: 'error', message: (error as any).message, code: 'EMAIL_ALREADY_EXISTS' });
        return;
      }

      if (error && (error as any).name === 'EmailSendError') {
        // user created but email failed
        res.status(201).json({ status: 'warning', message: 'User created but email sending failed', code: 'EMAIL_SEND_FAILED' });
        return;
      }

      console.error('registerEmail error', error);
      res.status(500).json({ status: 'error', message: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      if (!this.forgotPasswordUseCase) {
        res.status(500).json({ status: 'error', message: 'ForgotPasswordUseCase not configured', code: 'INTERNAL_ERROR' });
        return;
      }

      const { email } = req.body ?? {};
      if (!email) {
        res.status(400).json({ status: 'error', message: 'Missing required field: email', code: 'MISSING_FIELD' });
        return;
      }

      const result = await this.forgotPasswordUseCase.execute({ email });
      res.status(200).json({ status: 'success', message: result.message, emailSent: result.emailSent });
    } catch (error) {
      console.error('forgotPassword error', error);
      res.status(500).json({ status: 'error', message: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      if (!this.resetPasswordUseCase) {
        res.status(500).json({ status: 'error', message: 'ResetPasswordUseCase not configured', code: 'INTERNAL_ERROR' });
        return;
      }

      const { token, newPassword } = req.body ?? {};
      const missing: string[] = [];
      if (!token) missing.push('token');
      if (!newPassword) missing.push('newPassword');
      if (missing.length > 0) {
        res.status(400).json({ status: 'error', message: `Missing required field(s): ${missing.join(', ')}`, code: 'MISSING_FIELDS' });
        return;
      }

      const result = await this.resetPasswordUseCase.execute({ token, newPassword });
      res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
      if ((error as any).name === 'TokenExpiredError' || (error as any).name === 'TokenNotFoundError') {
        res.status(400).json({ status: 'error', message: 'Token invalid or expired', code: 'INVALID_TOKEN' });
        return;
      }

      if ((error as any).name === 'TokenAlreadyUsedError') {
        res.status(400).json({ status: 'error', message: 'Token already used', code: 'TOKEN_ALREADY_USED' });
        return;
      }

      if ((error as any).name === 'WeakPasswordError') {
        res.status(400).json({ status: 'error', message: (error as Error).message || 'Weak password', code: 'WEAK_PASSWORD' });
        return;
      }

      console.error('resetPassword error', error);
      res.status(500).json({ status: 'error', message: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      if (!this.revokedTokenRepository) {
        res.status(500).json({ status: 'error', message: 'RevokedTokenRepository not configured', code: 'INTERNAL_ERROR' });
        return;
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(400).json({ status: 'error', message: 'Missing or invalid Authorization header', code: 'MISSING_AUTH' });
        return;
      }

      const token = authHeader.substring(7);
      const { verifyToken } = require('../../utils/jwt');
      const payload = verifyToken(token) as { jti?: string; exp?: number };

      if (!payload || !payload.jti) {
        res.status(400).json({ status: 'error', message: 'Token missing jti claim', code: 'INVALID_TOKEN' });
        return;
      }

      const expiresAt = payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 60 * 1000);

      await this.revokedTokenRepository.revokeToken(payload.jti, expiresAt);

      res.status(200).json({ status: 'success', message: 'Logged out' });
    } catch (error) {
      console.error('logout error', error);
      res.status(500).json({ status: 'error', message: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async validatePasswordToken(req: Request, res: Response): Promise<void> {
    try {
      if (!this.validatePasswordTokenUseCase) {
        res.status(500).json({ status: 'error', message: 'ValidatePasswordTokenUseCase not configured', code: 'INTERNAL_ERROR' });
        return;
      }

      // Extraer parámetros de query
      const { token, type } = req.query;

      // Validar que token sea un string no vacío
      if (!token || typeof token !== 'string' || token.trim() === '') {
        res.status(400).json({
          status: 'error',
          message: 'Missing or invalid required parameter: token',
          code: 'MISSING_PARAMETER'
        });
        return;
      }

      // Validar que type sea uno de los valores permitidos
      if (!type || typeof type !== 'string' || !['password_creation', 'password_reset'].includes(type)) {
        res.status(400).json({
          status: 'error',
          message: `Invalid or missing parameter: type. Must be "password_creation" or "password_reset"`,
          code: 'INVALID_PARAMETER'
        });
        return;
      }

      // Ejecutar validación
      const result = await this.validatePasswordTokenUseCase.execute({
        token: token.trim(),
        type: type as 'password_creation' | 'password_reset'
      });

      // Retornar respuesta exitosa con el resultado
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('validatePasswordToken error', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

export default AuthController;
