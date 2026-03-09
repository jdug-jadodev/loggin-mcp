import { LoginInputDTO } from '../../../application/dto/LoginInputDTO';
import { LoginResultDTO } from '../../../application/dto/LoginResultDTO';

export interface LoginUseCasePort {
  execute(input: LoginInputDTO): Promise<LoginResultDTO>;
}
