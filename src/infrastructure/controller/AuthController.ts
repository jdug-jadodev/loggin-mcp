import { Request, Response } from 'express';
import { CheckEmailExistsUseCasePort } from '../../domain/port/portin/CheckEmailExistsUseCasePort';
import { CreatePasswordUseCasePort } from '../../domain/port/portin/CreatePasswordUseCasePort';
import { LoginUseCasePort } from '../../domain/port/portin/LoginUseCasePort';
import { RegisterEmailUseCase } from '../../application/usecase/RegisterEmailUseCase';
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
    private readonly registerEmailUseCase?: RegisterEmailUseCase
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

      const result = await this.createPasswordUseCase.execute({ email, password });
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
        res.status(500).json({
          status: 'error',
          message: 'Token generation failed',
          code: 'TOKEN_ERROR',
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
}

export default AuthController;
