import { UserRepositoryPort } from '../../../domain/port/portout/UserRepositoryPort';
import { User } from '../../../domain/entity/User';
import { supabase } from '../../config/supabase';
import { UserEntity } from '../entity/UserEntity';
import { UserMapper } from '../mapper/UserMapper';

export class SupabaseUserRepositoryAdapter implements UserRepositoryPort {
  
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error finding user by email: ${error.message}`);
    }
    
    return data ? UserMapper.toDomain(data as UserEntity) : null;
  }
  
  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error finding user by id: ${error.message}`);
    }
    
    return data ? UserMapper.toDomain(data as UserEntity) : null;
  }
  
  async create(email: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: null,
        has_password: false,
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        throw new Error(`User with email ${email} already exists`);
      }
      throw new Error(`Error creating user: ${error.message}`);
    }
    
    return UserMapper.toDomain(data as UserEntity);
  }
  
  async updatePassword(id: string, passwordHash: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        has_password: true,
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
    
    if (!data) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return UserMapper.toDomain(data as UserEntity);
  }
}
