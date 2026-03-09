import { CreatePasswordInputDTO } from '../../../application/dto/CreatePasswordInputDTO';
import { CreatePasswordResultDTO } from '../../../application/dto/CreatePasswordResultDTO';

export interface CreatePasswordUseCasePort {
  execute(input: CreatePasswordInputDTO): Promise<CreatePasswordResultDTO>;
}
