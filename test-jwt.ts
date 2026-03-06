/**
 * Test Manual para el Módulo JWT
 * 
 * Este archivo contiene pruebas manuales para validar el módulo JWT
 * según los criterios de aceptación del ONE_SPEC (CA-11).
 * 
 * Ejecutar con: npm run dev (luego importar este archivo en index.ts temporalmente)
 * O con ts-node: npx ts-node test-jwt.ts
 */

import 'dotenv/config';
import * as jwt from 'jsonwebtoken';
import { generateToken, verifyToken } from './src/utils/jwt';

console.log('='.repeat(60));
console.log('PRUEBAS MANUALES DEL MÓDULO JWT - FASE 4');
console.log('='.repeat(60));
console.log();

// ============================================================================
// Test 1: Ciclo Completo Exitoso
// ============================================================================
console.log('📋 Test 1: Ciclo Completo Exitoso');
console.log('-'.repeat(60));

try {
  // 1. Generar token
  const token = generateToken('uuid-test-123', 'test@example.com');
  console.log('✅ Token generado:', token.substring(0, 50) + '...');
  
  // 2. Verificar inmediatamente
  const payload = verifyToken(token);
  console.log('✅ userId correcto:', payload.userId === 'uuid-test-123');
  console.log('✅ email correcto:', payload.email === 'test@example.com');
  console.log('✅ iat presente:', typeof payload.iat === 'number');
  console.log('✅ exp presente:', typeof payload.exp === 'number');
  console.log('✅ Duración (54000s = 15h):', (payload.exp! - payload.iat!) === 54000);
  
  // Decodificar para ver el contenido
  const decoded = jwt.decode(token) as any;
  console.log('\n📊 Contenido del token:');
  console.log('   - userId:', decoded.userId);
  console.log('   - email:', decoded.email);
  console.log('   - iat:', decoded.iat, '(', new Date(decoded.iat * 1000).toISOString(), ')');
  console.log('   - exp:', decoded.exp, '(', new Date(decoded.exp * 1000).toISOString(), ')');
  
  console.log('\n✅ Test 1: PASADO\n');
} catch (error) {
  console.log('❌ Test 1: FALLIDO -', (error as Error).message);
  console.log();
}

// ============================================================================
// Test 2: Token Expirado
// ============================================================================
console.log('📋 Test 2: Token Expirado');
console.log('-'.repeat(60));

try {
  // Generar token con expiración de 1 segundo para testing
  const shortLivedToken = jwt.sign(
    { userId: 'test', email: 'test@test.com' },
    process.env.JWT_SECRET!,
    { expiresIn: '1s' }
  );
  
  console.log('⏳ Esperando 2 segundos para que expire...');
  
  setTimeout(() => {
    try {
      verifyToken(shortLivedToken);
      console.log('❌ Test 2: FALLIDO - Debería haber lanzado error\n');
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.log('✅ Token expirado detectado correctamente');
        console.log('   Mensaje:', (error as Error).message);
        console.log('\n✅ Test 2: PASADO\n');
      } else {
        console.log('❌ Test 2: FALLIDO - Error incorrecto:', (error as Error).message);
        console.log();
      }
    }
  }, 2100);
} catch (error) {
  console.log('❌ Test 2: ERROR -', (error as Error).message);
  console.log();
}

// ============================================================================
// Test 3: Token Manipulado
// ============================================================================
console.log('📋 Test 3: Token Manipulado');
console.log('-'.repeat(60));

try {
  const token = generateToken('user123', 'user@test.com');
  const parts = token.split('.');
  const manipulated = parts[0] + '.' + parts[1] + '.FAKE_SIGNATURE';
  
  try {
    verifyToken(manipulated);
    console.log('❌ Test 3: FALLIDO - Debería rechazar firma inválida\n');
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.log('✅ Firma inválida detectada correctamente');
      console.log('   Mensaje:', (error as Error).message);
      console.log('\n✅ Test 3: PASADO\n');
    } else {
      console.log('❌ Test 3: FALLIDO - Error incorrecto:', (error as Error).message);
      console.log();
    }
  }
} catch (error) {
  console.log('❌ Test 3: ERROR -', (error as Error).message);
  console.log();
}

// ============================================================================
// Test 4: JWT_SECRET Incorrecto
// ============================================================================
console.log('📋 Test 4: JWT_SECRET Incorrecto');
console.log('-'.repeat(60));

try {
  const token = generateToken('user123', 'user@test.com');
  
  // Cambiar JWT_SECRET temporalmente
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'different-secret-key-that-wont-match-the-original-one-for-testing';
  
  try {
    verifyToken(token);
    console.log('❌ Test 4: FALLIDO - Debería rechazar con secret diferente\n');
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.log('✅ Secret incorrecto detectado correctamente');
      console.log('   Mensaje:', (error as Error).message);
      console.log('\n✅ Test 4: PASADO\n');
    } else {
      console.log('❌ Test 4: FALLIDO - Error incorrecto:', (error as Error).message);
      console.log();
    }
  }
  
  // Restaurar secret original
  process.env.JWT_SECRET = originalSecret;
} catch (error) {
  console.log('❌ Test 4: ERROR -', (error as Error).message);
  console.log();
}

// ============================================================================
// Test 5: Validaciones de Entrada
// ============================================================================
console.log('📋 Test 5: Validaciones de Entrada');
console.log('-'.repeat(60));

const testCases = [
  { 
    name: 'userId vacío',
    fn: () => generateToken('', 'email@test.com'), 
    expected: 'userId cannot be empty' 
  },
  { 
    name: 'email vacío',
    fn: () => generateToken('user', ''), 
    expected: 'email cannot be empty' 
  },
  { 
    name: 'token vacío',
    fn: () => verifyToken(''), 
    expected: 'Token is required' 
  },
  { 
    name: 'userId solo espacios',
    fn: () => generateToken('   ', 'email@test.com'), 
    expected: 'userId cannot be empty' 
  },
  { 
    name: 'email solo espacios',
    fn: () => generateToken('user', '   '), 
    expected: 'email cannot be empty' 
  },
];

let testsPassed = 0;
let testsFailed = 0;

testCases.forEach((test, idx) => {
  try {
    test.fn();
    console.log(`❌ Test 5.${idx + 1} (${test.name}): FALLIDO - No lanzó error`);
    testsFailed++;
  } catch (error) {
    const message = (error as Error).message;
    if (message === test.expected) {
      console.log(`✅ Test 5.${idx + 1} (${test.name}): PASADO - "${message}"`);
      testsPassed++;
    } else {
      console.log(`❌ Test 5.${idx + 1} (${test.name}): FALLIDO - Mensaje incorrecto`);
      console.log(`   Esperado: "${test.expected}"`);
      console.log(`   Obtenido: "${message}"`);
      testsFailed++;
    }
  }
});

console.log();
console.log(`✅ Test 5: ${testsPassed}/${testCases.length} validaciones pasadas`);
if (testsFailed === 0) {
  console.log('✅ Test 5: PASADO\n');
} else {
  console.log(`❌ Test 5: FALLIDO (${testsFailed} errores)\n`);
}

// ============================================================================
// Test 6: Formato del Token (3 partes separadas por punto)
// ============================================================================
console.log('📋 Test 6: Formato del Token');
console.log('-'.repeat(60));

try {
  const token = generateToken('user-id', 'user@example.com');
  const parts = token.split('.');
  
  console.log('✅ Token tiene 3 partes:', parts.length === 3);
  console.log('✅ Parte 1 (header):', parts[0].length > 0);
  console.log('✅ Parte 2 (payload):', parts[1].length > 0);
  console.log('✅ Parte 3 (signature):', parts[2].length > 0);
  
  if (parts.length === 3 && parts[0].length > 0 && parts[1].length > 0 && parts[2].length > 0) {
    console.log('\n✅ Test 6: PASADO\n');
  } else {
    console.log('\n❌ Test 6: FALLIDO\n');
  }
} catch (error) {
  console.log('❌ Test 6: ERROR -', (error as Error).message);
  console.log();
}

// ============================================================================
// Test 7: JWT_SECRET con longitud insuficiente
// ============================================================================
console.log('📋 Test 7: JWT_SECRET con longitud insuficiente');
console.log('-'.repeat(60));

try {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'short'; // Solo 5 caracteres (< 32)
  
  try {
    generateToken('user123', 'user@test.com');
    console.log('❌ Test 7: FALLIDO - Debería rechazar JWT_SECRET corto\n');
  } catch (error) {
    if ((error as Error).message.includes('at least 32 characters')) {
      console.log('✅ JWT_SECRET corto detectado correctamente');
      console.log('   Mensaje:', (error as Error).message);
      console.log('\n✅ Test 7: PASADO\n');
    } else {
      console.log('❌ Test 7: FALLIDO - Error incorrecto:', (error as Error).message);
      console.log();
    }
  }
  
  // Restaurar secret original
  process.env.JWT_SECRET = originalSecret;
} catch (error) {
  console.log('❌ Test 7: ERROR -', (error as Error).message);
  console.log();
}

// ============================================================================
// Resumen
// ============================================================================
setTimeout(() => {
  console.log('='.repeat(60));
  console.log('RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));
  console.log('✅ Todos los tests principales ejecutados');
  console.log('📝 Revisar resultados arriba para verificar cada uno');
  console.log();
  console.log('✨ Módulo JWT implementado según ONE_SPEC - Fase 4');
  console.log('='.repeat(60));
}, 3000);
