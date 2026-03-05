/**
 * Script de Testing Manual - Password Module
 *
 * Uso: npx ts-node test-password.ts
 */

import { hashPassword, comparePassword, getSaltRounds } from './src/utils/password';

async function testPasswordModule() {
  console.log('🔒 ===============================================');
  console.log('🧪 Testing Password Module - Fase 3');
  console.log('🔒 ===============================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Configuración
  console.log('📋 Test 1: Verificar configuración');
  try {
    const saltRounds = getSaltRounds();
    console.log(`   Salt rounds: ${saltRounds}`);
    if (saltRounds === 10) {
      console.log('   ✅ PASS: Salt rounds correctamente configurado en 10\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAIL: Salt rounds debería ser 10\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error}\n`);
    testsFailed++;
  }

  // Test 2: Hash generation
  console.log('📋 Test 2: Generar hash de contraseña');
  try {
    const password = 'TestPassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    console.log(`   Password: "${password}"`);
    console.log(`   Hash 1: ${hash1}`);
    console.log(`   Hash 2: ${hash2}`);

    if (hash1.startsWith('$2b$10$') && hash2.startsWith('$2b$10$') && hash1 !== hash2) {
      console.log('   ✅ PASS: Hashes generados correctamente y son únicos\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAIL: Hashes inválidos o no únicos\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error}\n`);
    testsFailed++;
  }

  // Test 3: Correct password validation
  console.log('📋 Test 3: Validar contraseña correcta');
  try {
    const password = 'CorrectPassword456!';
    const hash = await hashPassword(password);
    const isValid = await comparePassword(password, hash);

    console.log(`   Password: "${password}"`);
    console.log(`   Match result: ${isValid}`);

    if (isValid === true) {
      console.log('   ✅ PASS: Contraseña correcta validada exitosamente\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAIL: Contraseña correcta no fue reconocida\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error}\n`);
    testsFailed++;
  }

  // Test 4: Incorrect password validation
  console.log('📋 Test 4: Rechazar contraseña incorrecta');
  try {
    const correctPassword = 'CorrectPassword789!';
    const wrongPassword = 'WrongPassword999!';
    const hash = await hashPassword(correctPassword);
    const isValid = await comparePassword(wrongPassword, hash);

    console.log(`   Correct password: "${correctPassword}"`);
    console.log(`   Wrong password: "${wrongPassword}"`);
    console.log(`   Match result: ${isValid}`);

    if (isValid === false) {
      console.log('   ✅ PASS: Contraseña incorrecta rechazada correctamente\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAIL: Contraseña incorrecta fue aceptada\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error}\n`);
    testsFailed++;
  }

  // Test 5: Case sensitivity
  console.log('📋 Test 5: Verificar case sensitivity');
  try {
    const password = 'Password123!';
    const hash = await hashPassword(password);
    const isValid = await comparePassword('password123!', hash); // lowercase

    console.log(`   Original: "${password}"`);
    console.log(`   Lowercase: "password123!"`);
    console.log(`   Match result: ${isValid}`);

    if (isValid === false) {
      console.log('   ✅ PASS: Case sensitivity funciona correctamente\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAIL: No distingue mayúsculas de minúsculas\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error}\n`);
    testsFailed++;
  }

  // Test 6: Empty password validation (hashPassword)
  console.log('📋 Test 6: Validar rechazo de contraseña vacía en hash');
  try {
    await hashPassword('');
    console.log('   ❌ FAIL: Debería lanzar error para contraseña vacía\n');
    testsFailed++;
  } catch (error) {
    console.log(`   Error esperado: ${(error as Error).message}`);
    console.log('   ✅ PASS: Error lanzado correctamente para contraseña vacía\n');
    testsPassed++;
  }

  // Test 7: Empty password validation (comparePassword)
  console.log('📋 Test 7: Validar rechazo de contraseña vacía en compare');
  try {
    const hash = await hashPassword('ValidPassword');
    await comparePassword('', hash);
    console.log('   ❌ FAIL: Debería lanzar error para contraseña vacía\n');
    testsFailed++;
  } catch (error) {
    console.log(`   Error esperado: ${(error as Error).message}`);
    console.log('   ✅ PASS: Error lanzado correctamente para contraseña vacía\n');
    testsPassed++;
  }

  // Test 8: Invalid hash handling
  console.log('📋 Test 8: Validar manejo de hash inválido');
  try {
    await comparePassword('SomePassword', 'invalid-hash-format');
    console.log('   ❌ FAIL: Debería lanzar error para hash inválido\n');
    testsFailed++;
  } catch (error) {
    console.log(`   Error esperado: ${(error as Error).message}`);
    console.log('   ✅ PASS: Error lanzado correctamente para hash inválido\n');
    testsPassed++;
  }

  // Test 9: Performance check
  console.log('📋 Test 9: Verificar performance de hashing');
  try {
    const start = Date.now();
    await hashPassword('PerformanceTest123!');
    const duration = Date.now() - start;

    console.log(`   Tiempo de ejecución: ${duration}ms`);

    if (duration < 300) {
      console.log('   ✅ PASS: Performance aceptable (< 300ms)\n');
      testsPassed++;
    } else {
      console.log('   ⚠️  WARNING: Performance lenta (> 300ms) - puede ser normal en hardware antiguo\n');
      testsPassed++; // No falla el test, solo advertencia
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error}\n`);
    testsFailed++;
  }

  // Resumen final
  console.log('🔒 ===============================================');
  console.log('📊 RESUMEN DE TESTS');
  console.log('🔒 ===============================================');
  console.log(`✅ Tests pasados: ${testsPassed}`);
  console.log(`❌ Tests fallidos: ${testsFailed}`);
  console.log(`📈 Total: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON! Password Module listo para Fase 4.\n');
  } else {
    console.log('\n⚠️  ALGUNOS TESTS FALLARON. Revisar implementación.\n');
    process.exit(1);
  }
}

testPasswordModule().catch((error) => {
  console.error('❌ Error fatal en tests:', error);
  process.exit(1);
});
