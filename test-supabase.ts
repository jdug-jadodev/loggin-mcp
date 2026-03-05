// test-supabase.ts (temporal, eliminar después)
import { SupabaseUserRepositoryAdapter } from './src/infrastructure/repository/adapter/SupabaseUserRepositoryAdapter';

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  const repo = new SupabaseUserRepositoryAdapter();
  
  try {
    // 1. Crear usuario de prueba
    console.log('1. Creating test user...');
    const newUser = await repo.create('test@example.com');
    console.log('✅ User created:', newUser);
    
    // 2. Buscar por email
    console.log('\n2. Finding user by email...');
    const foundUser = await repo.findByEmail('test@example.com');
    console.log('✅ User found:', foundUser);
    
    // 3. Buscar por ID
    console.log('\n3. Finding user by ID...');
    const userById = await repo.findById(newUser.id);
    console.log('✅ User found by ID:', userById);
    
    console.log('\n✅ All tests passed! Supabase is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testConnection();
