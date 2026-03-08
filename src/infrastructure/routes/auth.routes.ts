import express from 'express';
import AuthController from '../controller/AuthController';
import { SupabaseUserRepositoryAdapter } from '../repository/adapter/SupabaseUserRepositoryAdapter';
import { CheckEmailExistsUseCase } from '../../application/usecase/CheckEmailExistsUseCase';
import { CreatePasswordUseCase } from '../../application/usecase/CreatePasswordUseCase';
import { LoginUseCase } from '../../application/usecase/LoginUseCase';

const router = express.Router();

const userRepository = new SupabaseUserRepositoryAdapter();
const checkEmailUseCase = new CheckEmailExistsUseCase(userRepository);
const createPasswordUseCase = new CreatePasswordUseCase(userRepository);
const loginUseCase = new LoginUseCase(userRepository);

const authController = new AuthController(
  checkEmailUseCase,
  createPasswordUseCase,
  loginUseCase
);

router.post('/check-email', (req, res) => authController.checkEmail(req, res));
router.post('/create-password', (req, res) => authController.createPassword(req, res));
router.post('/login', (req, res) => authController.login(req, res));

export default router;
