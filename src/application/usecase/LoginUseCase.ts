import { LoginUseCasePort } from '../../domain/port/portin/LoginUseCasePort';
import { LoginInputDTO } from '../dto/LoginInputDTO';
import { LoginResultDTO } from '../dto/LoginResultDTO';
import { UserRepositoryPort } from '../../domain/port/portout/UserRepositoryPort';
import { comparePassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';
import { InvalidCredentialsError } from '../exception/InvalidCredentialsError';
import { isValidEmail } from '../validator/email';
import { toLoginResultDTO } from '../mapper/user';

const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLmnopqrstuv';

export class LoginUseCase implements LoginUseCasePort {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(input: LoginInputDTO): Promise<LoginResultDTO> {
    if (!isValidEmail(input.email) || !input.password || input.password.trim().length === 0) {
      throw new InvalidCredentialsError();
    }

    const user = await this.userRepository.findByEmail(input.email);

    const hash = user?.passwordHash ?? DUMMY_HASH;

    const isMatch = await comparePassword(input.password, hash).catch(() => false);

    if (!user || !user.hasPassword || !isMatch) {
      throw new InvalidCredentialsError();
    }

    const token = generateToken(user.id, user.email);
    return toLoginResultDTO(user, token);
  }
}
