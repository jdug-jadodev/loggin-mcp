/**
 * JWT Utility Module
 * 
 * Proporciona funciones para generación y verificación de JSON Web Tokens (JWT)
 * que permiten autenticar usuarios de manera segura. Los tokens generados tienen
 * una duración fija de 15 horas y contienen información mínima del usuario.
 * 
 * Este módulo es independiente de capas y puede ser usado en Application Layer
 * (Use Cases) e Infrastructure Layer (Controllers y Middlewares).
 * 
 * Características:
 * - Tokens firmados con HS256 (HMAC-SHA256)
 * - Expiración automática de 15 horas
 * - Validación estricta de entrada
 * - Manejo diferenciado de errores
 * 
 * @module utils/jwt
 */

import * as jwt from 'jsonwebtoken';

/**
 * Interface que define el payload personalizado del JWT.
 * Contiene la información mínima necesaria para identificar al usuario.
 */
export interface JwtPayload {
  /** Identificador único del usuario (UUID recomendado) */
  userId: string;
  /** Correo electrónico del usuario */
  email: string;
}

/**
 * Duración del token en horas.
 * Valor fijo de 15 horas según requerimiento de negocio.
 */
const TOKEN_EXPIRATION = '15h';

/**
 * Longitud mínima requerida para JWT_SECRET.
 * Valor recomendado: 32 caracteres mínimo, 64 en producción.
 */
const MIN_SECRET_LENGTH = 32;

/**
 * Genera un JSON Web Token firmado con información del usuario.
 * 
 * El token generado tiene una duración fija de 15 horas y contiene
 * el identificador único del usuario y su correo electrónico.
 * La firma utiliza la clave secreta definida en JWT_SECRET.
 * 
 * El token resultante es un string en formato: header.payload.signature
 * codificado en Base64URL. Puede ser decodificado sin la clave, pero
 * cualquier modificación invalida la firma.
 * 
 * @param userId - Identificador único del usuario (UUID recomendado)
 * @param email - Correo electrónico del usuario
 * @returns Token JWT firmado en formato string (header.payload.signature)
 * @throws {Error} Si userId está vacío, es null o undefined
 * @throws {Error} Si email está vacío, es null o undefined
 * @throws {Error} Si JWT_SECRET no está definido en variables de entorno
 * @throws {Error} Si JWT_SECRET tiene menos de 32 caracteres
 * 
 * @example
 * ```typescript
 * const token = generateToken('123e4567-e89b-12d3-a456-426614174000', 'user@example.com');
 * // token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDk2MDE2MjcsImV4cCI6MTcwOTY1NTYyN30.XYZ..."
 * ```
 */
export function generateToken(userId: string, email: string): string {
  // Validar que userId no esté vacío
  if (!userId || userId.trim().length === 0) {
    throw new Error('userId cannot be empty');
  }

  // Validar que email no esté vacío
  if (!email || email.trim().length === 0) {
    throw new Error('email cannot be empty');
  }

  // Validar que JWT_SECRET esté configurado
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim().length === 0) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  // Validar longitud mínima de JWT_SECRET
  if (jwtSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`);
  }

  // Construir payload con información mínima del usuario
  const payload: JwtPayload = {
    userId,
    email
  };

  // Generar y firmar token con expiración de 15 horas
  try {
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: TOKEN_EXPIRATION
    });

    return token;
  } catch (error) {
    throw new Error(`Failed to generate token: ${(error as Error).message}`);
  }
}

/**
 * Verifica y decodifica un JSON Web Token.
 * 
 * Valida la firma del token, verifica que no haya expirado y retorna
 * el payload decodificado. Si el token es inválido, ha sido manipulado
 * o ha expirado, lanza una excepción específica.
 * 
 * Los errores pueden distinguirse usando instanceof:
 * - jwt.TokenExpiredError: Token expirado (> 15 horas)
 * - jwt.JsonWebTokenError: Token inválido o firma incorrecta
 * - Error: Validación de entrada fallida
 * 
 * @param token - Token JWT a verificar (string no vacío)
 * @returns Payload decodificado conteniendo userId, email, iat y exp
 * @throws {Error} Si el token está vacío, es null o undefined
 * @throws {jwt.TokenExpiredError} Si el token ha expirado (> 15 horas desde emisión)
 * @throws {jwt.JsonWebTokenError} Si el token tiene firma inválida o formato malformado
 * @throws {jwt.NotBeforeError} Si el token aún no es válido (claim 'nbf')
 * 
 * @example
 * ```typescript
 * import * as jwt from 'jsonwebtoken';
 * 
 * try {
 *   const payload = verifyToken(token);
 *   console.log('Usuario autenticado:', payload.email);
 *   console.log('ID:', payload.userId);
 * } catch (error) {
 *   if (error instanceof jwt.TokenExpiredError) {
 *     console.log('Sesión expirada. Por favor, inicie sesión nuevamente.');
 *   } else if (error instanceof jwt.JsonWebTokenError) {
 *     console.log('Token inválido. Acceso denegado.');
 *   } else {
 *     console.log('Error de validación:', error.message);
 *   }
 * }
 * ```
 */
export function verifyToken(token: string): JwtPayload & jwt.JwtPayload {
  // Validar que el token no esté vacío
  if (!token || token.trim().length === 0) {
    throw new Error('Token is required');
  }

  // Validar que JWT_SECRET esté configurado
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim().length === 0) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  // Verificar y decodificar token
  // Los errores de jwt.verify se propagan automáticamente:
  // - TokenExpiredError si exp < now
  // - JsonWebTokenError si firma inválida o formato malformado
  // - NotBeforeError si nbf > now
  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload & jwt.JwtPayload;
    return decoded;
  } catch (error) {
    // Propagar errores específicos de JWT sin modificar
    // Esto permite que las capas superiores distingan entre tipos de error
    throw error;
  }
}
