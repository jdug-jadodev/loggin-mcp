import express from 'express';
import AuthController from '../controller/AuthController';
import { SupabaseUserRepositoryAdapter } from '../repository/adapter/SupabaseUserRepositoryAdapter';
import { CheckEmailExistsUseCase } from '../../application/usecase/CheckEmailExistsUseCase';
import { CreatePasswordUseCase } from '../../application/usecase/CreatePasswordUseCase';
import { LoginUseCase } from '../../application/usecase/LoginUseCase';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import { ResendEmailAdapter } from '../email/adapter/ResendEmailAdapter';
import { SupabasePasswordTokenRepositoryAdapter } from '../repository/adapter/SupabasePasswordTokenRepositoryAdapter';
import { RegisterEmailUseCase } from '../../application/usecase/RegisterEmailUseCase';

const router = express.Router();

const userRepository = new SupabaseUserRepositoryAdapter();
const checkEmailUseCase = new CheckEmailExistsUseCase(userRepository);
const createPasswordUseCase = new CreatePasswordUseCase(userRepository);
const loginUseCase = new LoginUseCase(userRepository);

const passwordTokenRepository = new SupabasePasswordTokenRepositoryAdapter();
const emailService = new ResendEmailAdapter();
const registerEmailUseCase = new RegisterEmailUseCase(userRepository, passwordTokenRepository, emailService);

const authController = new AuthController(
  checkEmailUseCase,
  createPasswordUseCase,
  loginUseCase,
  registerEmailUseCase
);

router.post('/check-email', (req, res) => authController.checkEmail(req, res));
router.post('/create-password', (req, res) => authController.createPassword(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/register-email', authMiddleware, adminMiddleware, (req, res) => authController.registerEmail(req, res));

export default router;
