import express from 'express';
import AuthController from '../controller/AuthController';
import { SupabaseUserRepositoryAdapter } from '../repository/adapter/SupabaseUserRepositoryAdapter';
import { CheckEmailExistsUseCase } from '../../application/usecase/CheckEmailExistsUseCase';
import { CreatePasswordUseCase } from '../../application/usecase/CreatePasswordUseCase';
import { LoginUseCase } from '../../application/usecase/LoginUseCase';
import { ValidatePasswordTokenUseCase } from '../../application/usecase/ValidatePasswordTokenUseCase';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import { ResendEmailAdapter } from '../email/adapter/ResendEmailAdapter';
import { SupabasePasswordTokenRepositoryAdapter } from '../repository/adapter/SupabasePasswordTokenRepositoryAdapter';
import { SupabaseRevokedTokenRepositoryAdapter } from '../repository/adapter/SupabaseRevokedTokenRepositoryAdapter';
import { RegisterEmailUseCase } from '../../application/usecase/RegisterEmailUseCase';
import { ForgotPasswordUseCase } from '../../application/usecase/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../application/usecase/ResetPasswordUseCase';

const router = express.Router();

const userRepository = new SupabaseUserRepositoryAdapter();
const checkEmailUseCase = new CheckEmailExistsUseCase(userRepository);
const passwordTokenRepository = new SupabasePasswordTokenRepositoryAdapter();
const revokedTokenRepository = new SupabaseRevokedTokenRepositoryAdapter();
const emailService = new ResendEmailAdapter();

const createPasswordUseCase = new CreatePasswordUseCase(userRepository, passwordTokenRepository);
const loginUseCase = new LoginUseCase(userRepository);
const registerEmailUseCase = new RegisterEmailUseCase(userRepository, passwordTokenRepository, emailService);

const forgotPasswordUseCase = new ForgotPasswordUseCase(userRepository, passwordTokenRepository, emailService);
const resetPasswordUseCase = new ResetPasswordUseCase(passwordTokenRepository, userRepository);
const validatePasswordTokenUseCase = new ValidatePasswordTokenUseCase(passwordTokenRepository);

const authController = new AuthController(
  checkEmailUseCase,
  createPasswordUseCase,
  loginUseCase,
  registerEmailUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase,
  revokedTokenRepository,
  validatePasswordTokenUseCase
);

router.post('/check-email', (req, res) => authController.checkEmail(req, res));
router.post('/create-password', (req, res) => authController.createPassword(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/validate-token', (req, res) => authController.validatePasswordToken(req, res));
router.post('/register-email', authMiddleware, adminMiddleware, (req, res) => authController.registerEmail(req, res));
router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));
router.post('/logout', authMiddleware, (req, res) => authController.logout(req, res));

export default router;
