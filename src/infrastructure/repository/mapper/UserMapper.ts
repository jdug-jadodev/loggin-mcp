import { User } from '../../../domain/entity/User';
import { UserEntity } from '../entity/UserEntity';

export class UserMapper {
  static toDomain(entity: UserEntity): User {
    return {
      id: entity.id,
      email: entity.email,
      passwordHash: entity.password_hash,
      hasPassword: entity.has_password,
      createdAt: new Date(entity.created_at),
      updatedAt: new Date(entity.updated_at),
    };
  }
  
  static toEntity(user: User): Partial<UserEntity> {
    return {
      id: user.id,
      email: user.email,
      password_hash: user.passwordHash,
      has_password: user.hasPassword,
    };
  }
}
