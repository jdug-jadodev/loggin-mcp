# One Spec (Root Spec)

# FASE 4: Caso de Uso de Registro de Email

## Objetivo

Implementar la lógica de negocio para el registro de correos electrónicos con generación de tokens seguros de un solo uso, permitiendo que usuarios administradores puedan registrar nuevos correos en el sistema, generando automáticamente un token de creación de contraseña con validez de 24 horas que será enviado por email al nuevo usuario.

**Meta Principal:** Crear el caso de uso `RegisterEmailUseCase` que orquesta la validación, persistencia, generación de tokens y notificación por email, garantizando que los tokens sean de un solo uso y seguros mediante el sistema de tracking en base de datos.

## Alcance / No alcance

### ✅ Dentro del Alcance (FASE 4)

**Excepciones de Dominio:**
- Crear `EmailAlreadyExistsError` para manejar duplicados de email
- Mantener consistencia con jerarquía de errores existente (extendiendo clase base apropiada)

**Objetos de Transferencia de Datos (DTOs):**
- Crear `RegisterEmailInputDTO` para entrada del caso de uso
- Crear `RegisterEmailResultDTO` para respuesta del caso de uso
- Seguir patrón readonly de DTOs existentes

**Generación de Tokens Seguros:**
- Extender `src/utils/jwt.ts` con función `generatePasswordCreationToken()`
- Extender `src/utils/jwt.ts` con función `generatePasswordResetToken()`
- Implementar JWT con payload extendido: `{ userId, email, type, jti }`
- Generar UUID único (jti) para cada token
- Configurar expiración: 24h para creación, 15min para recuperación

**Contratos de Repositorio:**
- Verificar/actualizar `UserRepositoryPort` con método `create(email: string)`
- Crear nuevo `PasswordTokenRepositoryPort` con métodos:
  - `createToken()`: persistir token en BD
  - `validateToken()`: verificar existencia, uso y expiración
  - `markTokenAsUsed()`: invalidar token después de uso
  - `deleteExpiredTokens()`: limpieza de tokens vencidos

**Caso de Uso Principal:**
- Implementar `RegisterEmailUseCase` en capa de aplicación
- Orquestar validación de email → verificación de existencia → creación de usuario → generación de token → persistencia de token → envío de email
- Manejar errores específicos en cada paso
- Retornar DTO estructurado con resultado

**Validadores:**
- Verificar/actualizar `EmailValidator` para garantizar validación robusta
- Asegurar que lance `ValidationError` con mensajes descriptivos

### ❌ Fuera del Alcance (FASE 4)

**No incluido en esta fase:**
- Implementación del middleware de autenticación JWT (FASE 1)
- Implementación del middleware de autorización admin (FASE 2)
- Implementación del servicio de email Resend (FASE 3)
- Implementación del adaptador `SupabasePasswordTokenRepositoryAdapter` (FASE 6)
- Implementación del controller y rutas HTTP (FASE 5)
- Creación de templates HTML de email (FASE 3)
- Modificaciones a la base de datos (FASE 2)
- Tests unitarios o de integración
- Documentación de API (OpenAPI/Swagger)
- Flujo de recuperación de contraseña completo (FASE 6)

**Dependencias externas requeridas (instaladas previamente):**
- `uuid` y `@types/uuid` para generación de JWT IDs
- Las dependencias deben estar instaladas antes de ejecutar esta fase

## Definiciones (lenguaje de dominio)

### Entidades y Conceptos

**User (Usuario):**
- Entidad de dominio que representa a un usuario del sistema
- Propiedades: `id`, `email`, `password` (opcional), `role`, `createdAt`
- Estado inicial tras registro: email sin contraseña asignada

**Password Token (Token de Contraseña):**
- Token JWT firmado con información adicional para operaciones específicas
- Tipos: `password_creation` (24h) y `password_reset` (15min)
- Características: Un solo uso, expiración configurable, tracking en BD

**jti (JWT ID):**
- Identificador único (UUID v4) incluido en el payload del JWT
- Propósito: permitir tracking individual de cada token específico
- Evita reutilización de tokens con mismo userId/email

**Token de Creación de Contraseña:**
- Token generado al registrar un nuevo usuario
- Validez: 24 horas desde creación
- Propósito: permitir que el usuario establezca su contraseña inicial
- Payload: `{ userId, email, type: 'password_creation', jti, exp, iat }`

**Token de Recuperación de Contraseña:**
- Token generado cuando usuario olvida su contraseña
- Validez: 15 minutos desde creación
- Propósito: permitir resetear contraseña de forma segura
- Payload: `{ userId, email, type: 'password_reset', jti, exp, iat }`

**Email Service Port:**
- Interfaz (puerto de salida) que define el contrato para envío de emails
- Implementación concreta en capa de infraestructura
- Métodos: `sendPasswordCreationEmail()`, `sendPasswordResetEmail()`

### Estados del Sistema

**Estado de Usuario:**
- `REGISTERED_WITHOUT_PASSWORD`: Email registrado, pendiente de crear contraseña
- `ACTIVE`: Usuario con contraseña establecida, puede hacer login
- `PASSWORD_RESET_PENDING`: Solicitó recuperación, pendiente de resetear

**Estado de Token:**
- `ACTIVE`: Token generado, no usado, no expirado
- `USED`: Token consumido, no puede reutilizarse
- `EXPIRED`: Token que superó su tiempo de validez

## Principios / Reglas no negociables

### Seguridad

1. **Token de Un Solo Uso (Obligatorio):**
   - Cada token solo puede usarse UNA vez
   - Después de usar, debe marcarse `used = TRUE` en BD
   - Verificación dual: firma JWT + validación en base de datos

2. **Validación Estricta de Tokens:**
   - Verificar firma JWT (criptográficamente válido)
   - Verificar expiración en payload JWT
   - Verificar existencia en tabla `password_tokens`
   - Verificar que `used = FALSE`
   - Verificar que `expires_at > NOW()`
   - Verificar que `type` coincide con la operación

3. **No Revelación de Información:**
   - Nunca revelar si un email existe o no en respuestas públicas
   - Mensajes genéricos en flujos públicos (forgot-password)
   - Errores específicos solo en operaciones autenticadas

### Arquitectura y Diseño

4. **Separación de Capas (Clean Architecture):**
   - **Application Layer:** DTOs, casos de uso, validadores, excepciones
   - **Domain Layer:** Entidades, puertos (interfaces)
   - **Infrastructure Layer:** Adaptadores, controladores, repositorios concretos
   - NO mezclar responsabilidades entre capas

5. **Dependency Inversion:**
   - Casos de uso dependen de interfaces (ports), no de implementaciones
   - Repositorios y servicios externos inyectados como dependencias
   - Facilita testing y cambio de implementaciones

6. **Inmutabilidad de DTOs:**
   - Todos los DTOs deben tener propiedades `readonly`
   - No mutación después de creación
   - Validación en constructor o factory si es necesario

### Validación y Errores

7. **Validación Temprana:**
   - Validar inputs en el primer paso del caso de uso
   - Lanzar `ValidationError` con mensaje descriptivo
   - No proceder si la validación falla

8. **Excepciones Específicas:**
   - Crear excepciones tipadas para cada caso de error
   - Incluir código de error único (string constant)
   - Incluir timestamp y contexto en excepciones

9. **Email Validation:**
   - Usar regex robusto para validar formato de email
   - Normalizar email a lowercase antes de persistir
   - Rechazar emails inválidos con `ValidationError`

### Persistencia

10. **Atomicidad Parcial:**
    - Si falla el envío de email DESPUÉS de crear usuario, retornar éxito parcial
    - Indicar en respuesta que usuario fue creado pero email no se envió
    - Permitir reenvío manual del token por admin

11. **Expiración de Tokens:**
    - Calcular `expires_at` como `NOW() + 24 hours` (creación) o `NOW() + 15 minutes` (reset)
    - Persistir fecha de expiración en BD junto con token
    - Función de limpieza periódica de tokens expirados

## Límites

### Límites Técnicos

**Dependencias Externas:**
- Requiere JWT_SECRET configurado en variables de entorno (min 32 caracteres)
- Requiere base de datos Supabase operativa con tabla `users`
- Requiere tabla `password_tokens` creada (FASE 2)
- Requiere servicio de email configurado (FASE 3)

**Tamaño de Tokens:**
- Token JWT típicamente 200-500 caracteres
- Campo `token` en BD: VARCHAR(500)
- Payload incluye userId (UUID), email, type, jti (UUID), timestamps

**Tasas y Límites:**
- Sin límite de tasa en esta capa (debe implementarse en middleware HTTP)
- Sin límite de tokens activos por usuario (considerar en futuro)

### Límites de Negocio

**Emails Únicos:**
- Un email solo puede registrarse una vez en el sistema
- Lanzar `EmailAlreadyExistsError` (409) si ya existe

**Tokens Únicos:**
- Cada token tiene jti único (UUID v4)
- Combinación (user_id, type, jti) debe ser única

**Roles y Permisos:**
- Solo usuarios admin pueden ejecutar RegisterEmailUseCase
- Validación de autorización en capas superiores (middleware FASE 2)

### Límites de Alcance

**Responsabilidad del Caso de Uso:**
- SÍ: Orquestación de lógica de negocio
- SÍ: Validación de inputs
- SÍ: Coordinación de repositorios y servicios
- NO: Implementación de repositorios concretos
- NO: Implementación de servicios de email
- NO: Manejo de HTTP (controller)
- NO: Autenticación/autorización (middleware)

## Eventos y estados (visión raíz)

### Flujo de Estados - Registro de Email

```
┌─────────────────────────────────────────────────────────────┐
│                   INICIO: Email Recibido                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Validar Formato     │──────► [EmailInválido]
            │      de Email        │        ValidationError
            └──────────┬───────────┘
                       │ ✓ Válido
                       ▼
            ┌──────────────────────┐
            │  Verificar Email     │
            │   en Base de Datos   │
            └──────────┬───────────┘
                       │
                ┌──────┴──────┐
                │             │
         [Existe]      [No Existe]
           │                  │
           ▼                  ▼
    ┌─────────────┐   ┌──────────────────┐
    │   Lanzar    │   │  Crear Usuario   │
    │EmailAlready │   │   en BD (sin     │
    │ExistsError  │   │   password)      │
    └─────────────┘   └─────────┬────────┘
                                 │ ✓ Creado
                                 │ Estado: REGISTERED_WITHOUT_PASSWORD
                                 ▼
                      ┌──────────────────────┐
                      │ Generar Token JWT    │
                      │ type: password_      │
                      │      creation        │
                      │ jti: UUID único      │
                      │ exp: NOW() + 24h     │
                      └──────────┬───────────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │ Persistir Token en   │
                      │   password_tokens    │
                      │ Estado: ACTIVE       │
                      └──────────┬───────────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │  Enviar Email con    │
                      │  Link + Token        │
                      └──────────┬───────────┘
                                 │
                        ┌────────┴────────┐
                        │                 │
                   [Éxito]           [Error]
                        │                 │
                        ▼                 ▼
            ┌────────────────┐   ┌──────────────────┐
            │  Retornar DTO  │   │  Usuario Creado  │
            │  emailSent:    │   │  pero Email NO   │
            │     true       │   │    enviado       │
            │                │   │  emailSent:      │
            │                │   │     false        │
            └────────────────┘   └──────────────────┘
                        │                 │
                        └────────┬────────┘
                                 │
                                 ▼
                    ┌─────────────────────┐
                    │  FIN: Retornar      │
                    │ RegisterEmailResult │
                    │      DTO            │
                    └─────────────────────┘
```

### Eventos del Sistema

**Evento 1: EmailRegistrationRequested**
- **Trigger:** Admin ejecuta RegisterEmailUseCase
- **Payload:** `{ email: string }`
- **Siguiente Estado:** Validación en progreso

**Evento 2: EmailValidated**
- **Trigger:** EmailValidator aprueba formato
- **Payload:** `{ email: string, normalized: string }`
- **Siguiente Estado:** Verificación de duplicados

**Evento 3: EmailAlreadyExists**
- **Trigger:** Email encontrado en BD
- **Payload:** `{ email: string }`
- **Acción:** Lanzar excepción, terminar flujo
- **Estado Final:** ERROR

**Evento 4: UserCreatedWithoutPassword**
- **Trigger:** Inserción exitosa en tabla users
- **Payload:** `{ userId: string, email: string, role: 'user' }`
- **Siguiente Estado:** Generación de token

**Evento 5: PasswordCreationTokenGenerated**
- **Trigger:** JWT creado con payload completo
- **Payload:** `{ token: string, jti: string, expiresAt: Date }`
- **Siguiente Estado:** Persistencia de token

**Evento 6: TokenPersisted**
- **Trigger:** Token insertado en password_tokens
- **Payload:** `{ tokenId: string, userId: string, expiresAt: Date }`
- **Siguiente Estado:** Envío de email

**Evento 7: PasswordCreationEmailSent**
- **Trigger:** Email enviado exitosamente
- **Payload:** `{ email: string, token: string }`
- **Estado Final:** SUCCESS (emailSent: true)

**Evento 8: EmailSendFailed**
- **Trigger:** Error al enviar email
- **Payload:** `{ email: string, error: string }`
- **Estado Final:** PARTIAL_SUCCESS (emailSent: false)

## Criterios de aceptación (root)

### CA-1: Crear EmailAlreadyExistsError

**Dado que** necesitamos manejar el caso de emails duplicados de forma específica

**Cuando** se intenta registrar un email que ya existe en la base de datos

**Entonces:**
- ✅ Debe existir archivo `src/application/exception/EmailAlreadyExistsError.ts`
- ✅ La clase debe extender la clase base apropiada del sistema de excepciones
- ✅ Debe incluir propiedad `code` con valor `'EMAIL_ALREADY_EXISTS'`
- ✅ Debe incluir mensaje por defecto: `"Email already registered"`
- ✅ Debe incluir `timestamp` (heredado o propio)
- ✅ Debe capturar stack trace correctamente
- ✅ Debe permitir contexto adicional opcional

**Implementación esperada:**
```typescript
export class EmailAlreadyExistsError extends Error {
  public readonly code = 'EMAIL_ALREADY_EXISTS';
  public readonly timestamp: string;
  public readonly context?: Record<string, unknown>;

  constructor(email: string, context?: Record<string, unknown>) {
    super(`Email already registered: ${email}`);
    this.name = 'EmailAlreadyExistsError';
    this.timestamp = new Date().toISOString();
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

---

### CA-2: Crear RegisterEmailInputDTO

**Dado que** el caso de uso necesita un contrato claro para sus inputs

**Cuando** se invoca el método execute del caso de uso

**Entonces:**
- ✅ Debe existir archivo `src/application/dto/RegisterEmailInputDTO.ts`
- ✅ Debe ser una interfaz TypeScript (no clase)
- ✅ Debe tener una única propiedad: `email` de tipo `string`
- ✅ La propiedad debe ser `readonly`
- ✅ Debe exportarse como named export
- ✅ Debe seguir patrón de nombre: `*InputDTO`

**Implementación esperada:**
```typescript
export interface RegisterEmailInputDTO {
  readonly email: string;
}
```

---

### CA-3: Crear RegisterEmailResultDTO

**Dado que** el caso de uso necesita retornar información estructurada

**Cuando** la operación de registro se completa (exitosa o parcialmente)

**Entonces:**
- ✅ Debe existir archivo `src/application/dto/RegisterEmailResultDTO.ts`
- ✅ Debe ser una interfaz TypeScript
- ✅ Debe incluir propiedad `userId: string` (ID del usuario creado)
- ✅ Debe incluir propiedad `email: string` (email normalizado)
- ✅ Debe incluir propiedad `message: string` (mensaje descriptivo)
- ✅ Debe incluir propiedad `emailSent: boolean` (indica si email se envió)
- ✅ Todas las propiedades deben ser `readonly`
- ✅ Debe exportarse como named export

**Implementación esperada:**
```typescript
export interface RegisterEmailResultDTO {
  readonly userId: string;
  readonly email: string;
  readonly message: string;
  readonly emailSent: boolean;
}
```

**Ejemplos de uso:**
```typescript
// Caso exitoso
{
  userId: "123e4567-e89b-12d3-a456-426614174000",
  email: "user@example.com",
  message: "User registered successfully. Password creation email sent.",
  emailSent: true
}

// Caso parcial (usuario creado, email falló)
{
  userId: "123e4567-e89b-12d3-a456-426614174000",
  email: "user@example.com",
  message: "User registered but email failed to send. Admin can resend token manually.",
  emailSent: false
}
```

---

### CA-4: Generar Funciones de Tokens en jwt.ts

**Dado que** necesitamos tokens especializados con metadata adicional

**Cuando** se genera un token de creación o recuperación de contraseña

**Entonces:**

**Para `generatePasswordCreationToken(userId: string, email: string): string`:**
- ✅ Debe agregarse al archivo `src/utils/jwt.ts`
- ✅ Debe validar que `userId` no esté vacío
- ✅ Debe validar que `email` no esté vacío
- ✅ Debe validar que `JWT_SECRET` esté configurado
- ✅ Debe generar UUID v4 único para `jti`
- ✅ Debe crear payload con estructura:
  ```typescript
  {
    userId: string,
    email: string,
    type: 'password_creation',
    jti: string  // UUID v4
  }
  ```
- ✅ Debe configurar expiración: `'24h'`
- ✅ Debe firmar con JWT_SECRET del environment
- ✅ Debe retornar token firmado (string)
- ✅ Debe lanzar error descriptivo si falla la generación

**Para `generatePasswordResetToken(userId: string, email: string): string`:**
- ✅ Debe agregarse al archivo `src/utils/jwt.ts`
- ✅ Debe validar que `userId` no esté vacío
- ✅ Debe validar que `email` no esté vacío
- ✅ Debe validar que `JWT_SECRET` esté configurado
- ✅ Debe generar UUID v4 único para `jti`
- ✅ Debe crear payload con estructura:
  ```typescript
  {
    userId: string,
    email: string,
    type: 'password_reset',
    jti: string  // UUID v4
  }
  ```
- ✅ Debe configurar expiración: `'15m'`
- ✅ Debe firmar con JWT_SECRET del environment
- ✅ Debe retornar token firmado (string)
- ✅ Debe lanzar error descriptivo si falla la generación

**Dependencias requeridas:**
```typescript
import { v4 as uuidv4 } from 'uuid';
```

**Implementación esperada:**
```typescript
export interface PasswordTokenPayload extends JwtPayload {
  userId: string;
  email: string;
  type: 'password_creation' | 'password_reset';
  jti: string;
}

export function generatePasswordCreationToken(userId: string, email: string): string {
  if (!userId || userId.trim().length === 0) {
    throw new Error('userId cannot be empty');
  }
  if (!email || email.trim().length === 0) {
    throw new Error('email cannot be empty');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim().length === 0) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  if (jwtSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`);
  }

  const payload: PasswordTokenPayload = {
    userId,
    email,
    type: 'password_creation',
    jti: uuidv4()
  };

  try {
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: '24h'
    });
    return token;
  } catch (error) {
    throw new Error(`Failed to generate password creation token: ${(error as Error).message}`);
  }
}

export function generatePasswordResetToken(userId: string, email: string): string {
  // Similar pero con type: 'password_reset' y expiresIn: '15m'
}
```

---

### CA-5: Actualizar UserRepositoryPort

**Dado que** el caso de uso necesita crear usuarios en la base de datos

**Cuando** se revisa/actualiza el contrato del repositorio de usuarios

**Entonces:**
- ✅ Debe existir archivo `src/domain/port/portout/UserRepositoryPort.ts`
- ✅ Debe existir interfaz `UserRepositoryPort`
- ✅ Debe incluir método `create(email: string): Promise<User>`
- ✅ El método debe retornar la entidad User de dominio (no UserEntity)
- ✅ Si el método ya existe, verificar firma correcta
- ✅ Si no existe, agregarlo a la interfaz

**Implementación esperada (si requiere modificación):**
```typescript
import { User } from '../../entity/User';

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  create(email: string): Promise<User>;  // ← Asegurar que existe
  // ... otros métodos existentes
}
```

**Notas:**
- El método `create` debe crear usuario SIN password (password será null/undefined)
- El rol por defecto debe ser 'user'
- La implementación concreta está en FASE 2 (SupabaseUserRepositoryAdapter)

---

### CA-6: Crear PasswordTokenRepositoryPort

**Dado que** necesitamos persistir y validar tokens de manera segura

**Cuando** el caso de uso necesita gestionar tokens de un solo uso

**Entonces:**
- ✅ Debe existir archivo `src/domain/port/portout/PasswordTokenRepositoryPort.ts`
- ✅ Debe exportar interfaz `PasswordTokenRepositoryPort`
- ✅ Debe incluir método `createToken(userId: string, token: string, type: 'password_creation' | 'password_reset', expiresAt: Date): Promise<void>`
- ✅ Debe incluir método `validateToken(token: string, type: string): Promise<TokenValidationResult>`
- ✅ Debe incluir método `markTokenAsUsed(token: string): Promise<void>`
- ✅ Debe incluir método `deleteExpiredTokens(): Promise<void>`
- ✅ Debe exportar interfaz `TokenValidationResult` con estructura:
  ```typescript
  {
    valid: boolean;
    userId?: string;
    email?: string;
    message?: string;
  }
  ```

**Implementación esperada:**
```typescript
export interface TokenValidationResult {
  readonly valid: boolean;
  readonly userId?: string;
  readonly email?: string;
  readonly message?: string;
}

export interface PasswordTokenRepositoryPort {
  /**
   * Persiste un nuevo token en la base de datos
   * @param userId - ID del usuario propietario del token
   * @param token - Token JWT completo (firmado)
   * @param type - Tipo de token: 'password_creation' | 'password_reset'
   * @param expiresAt - Fecha y hora de expiración
   */
  createToken(
    userId: string,
    token: string,
    type: 'password_creation' | 'password_reset',
    expiresAt: Date
  ): Promise<void>;

  /**
   * Valida un token verificando:
   * - Existe en BD
   * - No ha sido usado (used = false)
   * - No ha expirado (expires_at > NOW())
   * - El tipo coincide
   * 
   * @param token - Token JWT a validar
   * @param type - Tipo esperado de token
   * @returns Resultado de validación con userId y email si es válido
   */
  validateToken(token: string, type: string): Promise<TokenValidationResult>;

  /**
   * Marca un token como usado, impidiendo su reutilización
   * @param token - Token JWT a invalidar
   */
  markTokenAsUsed(token: string): Promise<void>;

  /**
   * Elimina tokens expirados y ya usados de la base de datos
   * Ejecutar periódicamente para limpieza
   */
  deleteExpiredTokens(): Promise<void>;
}
```

**Notas:**
- La implementación concreta (`SupabasePasswordTokenRepositoryAdapter`) se crea en FASE 6
- Esta interfaz define el contrato que el caso de uso usará

---

### CA-7: Crear RegisterEmailUseCase

**Dado que** necesitamos orquestar la lógica completa de registro de email

**Cuando** un administrador solicita registrar un nuevo email en el sistema

**Entonces:**

**Estructura del archivo:**
- ✅ Debe existir archivo `src/application/usecase/RegisterEmailUseCase.ts`
- ✅ Debe exportar clase `RegisterEmailUseCase`
- ✅ Debe inyectar dependencias por constructor:
  - `UserRepositoryPort` (para verificar y crear usuarios)
  - `PasswordTokenRepositoryPort` (para persistir tokens)
  - `EmailServicePort` (para enviar emails)
  - `EmailValidator` (para validar formato)

**Método `execute(input: RegisterEmailInputDTO): Promise<RegisterEmailResultDTO>`:**

**Paso 1: Validación de Email**
- ✅ Debe extraer `email` del input DTO
- ✅ Debe invocar `EmailValidator.validate(email)`
- ✅ Si es inválido, debe lanzar `ValidationError`

**Paso 2: Verificar Email No Existe**
- ✅ Debe invocar `userRepository.findByEmail(email)`
- ✅ Si retorna un usuario (no null), debe lanzar `EmailAlreadyExistsError`

**Paso 3: Crear Usuario en Base de Datos**
- ✅ Debe invocar `userRepository.create(email)`
- ✅ Debe capturar la entidad User retornada
- ✅ Debe extraer `userId` de la entidad

**Paso 4: Generar Token de Creación de Contraseña**
- ✅ Debe invocar `generatePasswordCreationToken(userId, email)`
- ✅ Debe recibir token JWT firmado (string)

**Paso 5: Calcular Fecha de Expiración**
- ✅ Debe calcular fecha: `new Date(Date.now() + 24 * 60 * 60 * 1000)` (24 horas)
- ✅ Debe almacenar en variable `expiresAt`

**Paso 6: Persistir Token en Base de Datos**
- ✅ Debe invocar `passwordTokenRepository.createToken(userId, token, 'password_creation', expiresAt)`
- ✅ Debe manejar posibles errores de persistencia

**Paso 7: Enviar Email (con Manejo de Errores)**
- ✅ Debe intentar invocar `emailService.sendPasswordCreationEmail(email, token)`
- ✅ Debe usar try-catch para capturar errores de envío
- ✅ Si el envío falla:
  - NO debe lanzar error (usuario ya fue creado)
  - Debe marcar `emailSent = false`
  - Debe incluir mensaje indicando fallo parcial
- ✅ Si el envío tiene éxito:
  - Debe marcar `emailSent = true`
  - Debe incluir mensaje de éxito completo

**Paso 8: Retornar Resultado**
- ✅ Debe construir y retornar `RegisterEmailResultDTO` con:
  - `userId`: ID del usuario creado
  - `email`: Email normalizado
  - `message`: Mensaje descriptivo según resultado
  - `emailSent`: true/false según éxito del envío

**Manejo de Excepciones:**
- ✅ `ValidationError` → propagar (email inválido)
- ✅ `EmailAlreadyExistsError` → propagar (email duplicado)
- ✅ `DatabaseError` → propagar si falla creación de usuario o token
- ✅ `EmailSendError` → capturar, NO propagar, retornar éxito parcial

**Implementación esperada (esqueleto):**
```typescript
import { RegisterEmailInputDTO } from '../dto/RegisterEmailInputDTO';
import { RegisterEmailResultDTO } from '../dto/RegisterEmailResultDTO';
import { UserRepositoryPort } from '../../domain/port/portout/UserRepositoryPort';
import { PasswordTokenRepositoryPort } from '../../domain/port/portout/PasswordTokenRepositoryPort';
import { EmailServicePort } from '../../domain/port/portout/EmailServicePort';
import { EmailValidator } from '../validator/EmailValidator';
import { EmailAlreadyExistsError } from '../exception/EmailAlreadyExistsError';
import { generatePasswordCreationToken } from '../../utils/jwt';

export class RegisterEmailUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordTokenRepository: PasswordTokenRepositoryPort,
    private readonly emailService: EmailServicePort,
    private readonly emailValidator: EmailValidator
  ) {}

  async execute(input: RegisterEmailInputDTO): Promise<RegisterEmailResultDTO> {
    // 1. Validar email
    const email = input.email.toLowerCase().trim();
    this.emailValidator.validate(email);

    // 2. Verificar que email NO existe
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new EmailAlreadyExistsError(email);
    }

    // 3. Crear usuario en BD
    const user = await this.userRepository.create(email);

    // 4. Generar token JWT con jti único
    const token = generatePasswordCreationToken(user.id, user.email);

    // 5. Calcular expiración (24 horas)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 6. Persistir token en BD
    await this.passwordTokenRepository.createToken(
      user.id,
      token,
      'password_creation',
      expiresAt
    );

    // 7. Intentar enviar email (sin fallar si hay error)
    let emailSent = true;
    let message = 'User registered successfully. Password creation email sent.';

    try {
      await this.emailService.sendPasswordCreationEmail(user.email, token);
    } catch (error) {
      emailSent = false;
      message = 'User registered but email failed to send. Admin can resend token manually.';
      // Log error pero no lanzar excepción
      console.error('Failed to send password creation email:', error);
    }

    // 8. Retornar resultado
    return {
      userId: user.id,
      email: user.email,
      message,
      emailSent
    };
  }
}
```

---

### CA-8: Verificar EmailValidator

**Dado que** la validación de email es crítica para la seguridad

**Cuando** se valida un email en el flujo de registro

**Entonces:**
- ✅ Debe existir archivo `src/application/validator/EmailValidator.ts`
- ✅ Debe existir clase `EmailValidator`
- ✅ Debe tener método `validate(email: string): void`
- ✅ Debe usar regex robusto para validación de formato
- ✅ Debe rechazar emails vacíos o solo espacios
- ✅ Debe rechazar emails sin '@'
- ✅ Debe rechazar emails sin dominio
- ✅ Debe lanzar `ValidationError` con mensaje descriptivo si es inválido
- ✅ Debe aceptar emails válidos sin lanzar error

**Regex recomendado:**
```typescript
/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
```

**Casos de prueba esperados:**
```typescript
// Válidos (no debe lanzar error)
'user@example.com'
'user.name@example.com'
'user_name@example.co.uk'
'user-name@sub.example.com'

// Inválidos (debe lanzar ValidationError)
''                    // vacío
'   '                 // solo espacios
'invalid'             // sin @
'@example.com'        // sin usuario
'user@'               // sin dominio
'user @example.com'   // con espacios
```

**Implementación esperada (si requiere modificación):**
```typescript
import { ValidationError } from '../exception/ValidationError';

export class EmailValidator {
  private readonly emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  validate(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new ValidationError('Email is required');
    }

    const trimmedEmail = email.trim();

    if (!this.emailRegex.test(trimmedEmail)) {
      throw new ValidationError(
        `Invalid email format: ${trimmedEmail}. Email must match pattern: user@domain.com`
      );
    }
  }
}
```

---

## Trazabilidad

### Referencias Cruzadas con Otras Fases

**Dependencias de FASE 4 → Otras Fases:**

| Elemento de FASE 4 | Requiere de Fase | Descripción |
|---------------------|------------------|-------------|
| `EmailServicePort` | FASE 3 | Interfaz definida en FASE 4, implementada en FASE 3 |
| `UserRepositoryPort.create()` | FASE 2 | Adaptador Supabase creado en FASE 2 |
| `PasswordTokenRepositoryPort` | FASE 6 | Interfaz en FASE 4, adaptador en FASE 6 |
| Tabla `password_tokens` | FASE 2 | Schema SQL ejecutado en FASE 2 |
| Variables de entorno | FASE 3, 5 | `RESEND_API_KEY`, `APP_BASE_URL`, etc. |

**Elementos de FASE 4 Usados por Otras Fases:**

| Elemento | Usado en Fase | Descripción |
|----------|---------------|-------------|
| `RegisterEmailUseCase` | FASE 5 | Inyectado en `AuthController` |
| `generatePasswordCreationToken()` | FASE 6 | Usado en `CreatePasswordUseCase` |
| `generatePasswordResetToken()` | FASE 6 | Usado en `ForgotPasswordUseCase` |
| `PasswordTokenRepositoryPort` | FASE 6 | Implementado como `SupabasePasswordTokenRepositoryAdapter` |
| `EmailAlreadyExistsError` | FASE 5 | Manejado en controller (status 409) |

### Archivos Creados/Modificados en FASE 4

**Archivos Nuevos (8):**
1. `src/application/exception/EmailAlreadyExistsError.ts`
2. `src/application/dto/RegisterEmailInputDTO.ts`
3. `src/application/dto/RegisterEmailResultDTO.ts`
4. `src/domain/port/portout/PasswordTokenRepositoryPort.ts`
5. `src/application/usecase/RegisterEmailUseCase.ts`

**Archivos Modificados (2):**
6. `src/utils/jwt.ts` (agregar 2 funciones + 1 interfaz)
7. `src/domain/port/portout/UserRepositoryPort.ts` (verificar método `create`)
8. `src/application/validator/EmailValidator.ts` (verificar/mejorar validación)

### Dependencias de Paquetes

**Instaladas previamente (requeridas en FASE 4):**
```bash
npm install uuid
npm install --save-dev @types/uuid
```

**Ya existentes en el proyecto:**
- `jsonwebtoken` (para firma de JWT)
- `typescript` (lenguaje)

### Testing de FASE 4 (Fuera de Alcance pero Recomendado)

**Tests Unitarios Recomendados:**
- `RegisterEmailUseCase.test.ts`
  - ✓ Debe registrar email exitosamente
  - ✓ Debe lanzar error si email ya existe
  - ✓ Debe lanzar error si email es inválido
  - ✓ Debe retornar emailSent=false si falla envío
  - ✓ Debe persistir token antes de enviar email
  
- `jwt.test.ts`
  - ✓ Debe generar token de creación con payload correcto
  - ✓ Debe generar token de reset con payload correcto
  - ✓ Debe incluir jti único en cada token
  - ✓ Debe configurar expiración correcta (24h vs 15m)

- `EmailValidator.test.ts`
  - ✓ Debe aceptar emails válidos
  - ✓ Debe rechazar emails inválidos
  - ✓ Debe rechazar emails vacíos

### Documentación de Referencia

**Arquitectura del Proyecto:**
- Patrón: Clean/Hexagonal Architecture
- Referencia: [informe-exploracion.md](informe-exploracion.md)

**Plan Completo:**
- Documento: [PLAN_REGISTRO_CORREOS.md](PLAN_REGISTRO_CORREOS.md)
- Sección relevante: FASE 4 (líneas 333-424)

**JWT Best Practices:**
- jti (JWT ID): https://tools.ietf.org/html/rfc7519#section-4.1.7
- Token expiration: https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims

**TypeScript:**
- Readonly properties: https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties
- Error handling: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html#control-flow-analysis-of-aliased-conditions

---

## Resumen de Ejecución

### Orden de Implementación Recomendado

1. **Primero:** Excepciones y DTOs (sin dependencias)
   - EmailAlreadyExistsError.ts
   - RegisterEmailInputDTO.ts
   - RegisterEmailResultDTO.ts

2. **Segundo:** Interfaces de puerto (contratos)
   - PasswordTokenRepositoryPort.ts
   - Verificar UserRepositoryPort.ts

3. **Tercero:** Utilidades (funciones helper)
   - Actualizar jwt.ts con funciones de generación de tokens

4. **Cuarto:** Validadores (si requiere actualización)
   - Verificar/actualizar EmailValidator.ts

5. **Quinto:** Caso de uso (orquestación)
   - RegisterEmailUseCase.ts

6. **Sexto:** Tests (opcional pero recomendado)
   - Tests unitarios para cada componente

### Checklist de Verificación Final

Antes de considerar FASE 4 completa:

- [ ] Todos los archivos nuevos creados (5 archivos)
- [ ] Archivos existentes actualizados (3 archivos)
- [ ] Todas las interfaces exportadas correctamente
- [ ] DTOs tienen propiedades readonly
- [ ] Excepciones incluyen código, timestamp y mensaje
- [ ] Funciones de token validan inputs y secrets
- [ ] Funciones de token generan jti único (UUID v4)
- [ ] Token de creación expira en 24h
- [ ] Token de reset expira en 15m
- [ ] RegisterEmailUseCase inyecta todas las dependencias
- [ ] Caso de uso valida email antes de procesar
- [ ] Caso de uso verifica email no existe
- [ ] Caso de uso persiste token antes de enviar email
- [ ] Caso de uso maneja error de envío sin fallar
- [ ] Caso de uso retorna DTO estructurado
- [ ] EmailValidator usa regex robusto
- [ ] Código compila sin errores TypeScript
- [ ] Imports están correctos y sin ciclos
- [ ] Documentación JSDoc en métodos públicos

### Comando de Verificación

```bash
# Compilar TypeScript para verificar errores
npm run build

# Verificar estructura de archivos
ls src/application/exception/EmailAlreadyExistsError.ts
ls src/application/dto/RegisterEmailInputDTO.ts
ls src/application/dto/RegisterEmailResultDTO.ts
ls src/domain/port/portout/PasswordTokenRepositoryPort.ts
ls src/application/usecase/RegisterEmailUseCase.ts
```

---

**FIN DE ESPECIFICACIÓN - FASE 4**

*Este documento sirve como manual completo para la implementación de la FASE 4 del sistema de registro de correos con tokens de un solo uso.*
