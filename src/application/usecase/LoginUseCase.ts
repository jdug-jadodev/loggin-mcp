import { UserRepositoryPort } from '../../domain/port/portout/UserRepositoryPort';
import { comparePassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';
import { InvalidCredentialsError } from '../exception/InvalidCredentialsError';
import { isValidEmail } from '../validator/EmailValidator';
import { toLoginResultDTO } from '../mapper/UserApplicationMapper';

const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLmnopqrstuv';

export class LoginUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(email: string, password: string) {
    if (!isValidEmail(email) || !password || password.trim().length === 0) {
      throw new InvalidCredentialsError();
    }

    const user = await this.userRepository.findByEmail(email);

    const hash = user?.passwordHash ?? DUMMY_HASH;

    // Always call comparePassword to protect against timing attacks
    const isMatch = await comparePassword(password, hash).catch(() => false);

    if (!user || !user.hasPassword || !isMatch) {
      throw new InvalidCredentialsError();
    }

    const token = generateToken(user.id, user.email);
    return toLoginResultDTO(user, token);
  }
}
