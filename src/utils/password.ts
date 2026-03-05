/**
 * Password Utility Module
 * 
 * Proporciona funciones para hashing seguro y validación de contraseñas
 * usando bcrypt. Este módulo es independiente de capas y puede ser usado
 * en Application Layer (Use Cases) e Infrastructure Layer (Controllers).
 * 
 * @module utils/password
 */

import * as bcrypt from 'bcrypt';

/**
 * Número de rondas de salt para bcrypt.
 * Valor recomendado en 2026: 10
 * Mayor valor = más seguro pero más lento.
 * 
 * Performance aproximada con 10 rounds: ~100-150ms
 */
const SALT_ROUNDS = 10;

/**
 * Genera un hash seguro de una contraseña usando bcrypt.
 * 
 * El hash generado incluye el salt de forma automática y es único
 * para cada ejecución, incluso con la misma contraseña de entrada.
 * Esto previene ataques con rainbow tables.
 * 
 * @param password - Contraseña en texto plano a hashear (máximo 72 bytes UTF-8)
 * @returns Promise que resuelve al hash bcrypt de la contraseña (formato: $2b$10$...)
 * @throws {Error} Si la contraseña está vacía o es inválida
 * @throws {Error} Si bcrypt falla internamente
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    throw new Error(`Failed to hash password: ${(error as Error).message}`);
  }
}

/**
 * Compara una contraseña en texto plano con su hash bcrypt almacenado.
 * 
 * @param password - Contraseña en texto plano a verificar
 * @param hash - Hash bcrypt almacenado previamente (formato: $2b$10$...)
 * @returns Promise que resuelve a true si coinciden, false si no
 * @throws {Error} Si los parámetros son nulos, undefined o vacíos
 * @throws {Error} Si bcrypt falla internamente
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!password || password.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }

  if (!hash || hash.trim().length === 0) {
    throw new Error('Hash cannot be empty');
  }

  try {
    // Validar formato básico de hash bcrypt. Formatos típicos: $2a$, $2b$, $2y$
    const bcryptHashRegex = /^\$2[aby]\$\d{2}\$/;
    if (!bcryptHashRegex.test(hash)) {
      throw new Error('Invalid hash format');
    }

    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    throw new Error(`Failed to compare password: ${(error as Error).message}`);
  }
}

export function getSaltRounds(): number {
  return SALT_ROUNDS;
}
