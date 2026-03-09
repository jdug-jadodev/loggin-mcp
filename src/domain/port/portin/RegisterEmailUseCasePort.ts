import { RegisterEmailInputDTO } from '../../../application/dto/RegisterEmailInputDTO';
import { RegisterEmailResultDTO } from '../../../application/dto/RegisterEmailResultDTO';

export interface RegisterEmailUseCasePort {
  execute(input: RegisterEmailInputDTO): Promise<RegisterEmailResultDTO>;
}
