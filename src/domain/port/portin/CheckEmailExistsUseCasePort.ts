import { CheckEmailInputDTO } from '../../../application/dto/CheckEmailInputDTO';
import { EmailCheckResultDTO } from '../../../application/dto/EmailCheckResultDTO';

export interface CheckEmailExistsUseCasePort {
  execute(input: CheckEmailInputDTO): Promise<EmailCheckResultDTO>;
}
