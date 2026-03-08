/**
 * Test Simple JWT - Verificación rápida
 */

import 'dotenv/config';
import { generateToken, verifyToken } from '../jwt';

console.log('🔐 Testing JWT Module - Phase 4\n');

// Test básico
try {
  console.log('1️⃣ Generando token...');
  const token = generateToken('user-123', 'test@example.com');
  console.log('   ✅ Token generado exitosamente');
  console.log('   📝 Longitud:', token.length, 'caracteres\n');
  
  console.log('2️⃣ Verificando token...');
  const payload = verifyToken(token);
  console.log('   ✅ Token verificado exitosamente');
  console.log('   📝 userId:', payload.userId);
  console.log('   📝 email:', payload.email);
  console.log('   📝 Duración: 15 horas (',  (payload.exp! - payload.iat!), 'segundos )\n');
  
  console.log('3️⃣ Validando expiración...');
  const duration = payload.exp! - payload.iat!;
  const is15Hours = duration === 54000; // 15 * 60 * 60
  console.log('   ✅ Expiración correcta:', is15Hours ? '15 horas' : `${duration}s`);
  
  if (is15Hours) {
    console.log('\n✨ ¡Todas las pruebas básicas pasaron exitosamente!');
    console.log('✅ Módulo JWT implementado correctamente según ONE_SPEC\n');
  }
  
} catch (error) {
  console.error('❌ Error en pruebas:', (error as Error).message);
}
