# Plan de Trabajo: Endpoint de Registro de Correos con Autenticación y Notificación

**Fecha de Creación:** 7 de Marzo de 2026  
**Última Actualización:** 8 de Marzo de 2026  
**Objetivo:** Crear un endpoint protegido para registrar correos en Supabase que solo funcione para usuarios autorizados, y envíe un email con la URL para crear contraseña. Implementar sistema seguro de tokens de un solo uso y flujo completo de recuperación de contraseña.

---

## 🔐 Mejoras de Seguridad Implementadas

### Tokens de Un Solo Uso
- ✨ **Token de Creación de Contraseña:** Válido 24 horas, solo un uso
- ✨ **Token de Recuperación de Contraseña:** Válido 15 minutos, solo un uso
- ✨ **Tabla en Base de Datos:** Tracking de todos los tokens (activos, usados, expirados)
- ✨ **Validación Estricta:** Verificar firma JWT + validación en BD antes de usar
- ✨ **Invalidación Inmediata:** Tokens marcados como usados después de consumirse
- ✨ **Limpieza Automática:** Función para eliminar tokens expirados periódicamente

### Flujo de Recuperación de Contraseña
- ✨ **Endpoint Público /forgot-password:** Solicitar recuperación por email
- ✨ **Endpoint Público /reset-password:** Resetear contraseña con token
- ✨ **Seguridad:** No revela si un email existe en el sistema
- ✨ **Invalidación de Sesiones:** Al resetear, invalida tokens de sesión anteriores
- ✨ **Templates de Email:** Distintos para creación y recuperación

---

## 📦 Dependencias Requeridas

```bash
# Servicio de email
npm install resend

# Generación de UUIDs para JWT IDs (jti)
npm install uuid
npm install --save-dev @types/uuid

# Opcional: Cron jobs para limpieza automática de tokens
npm install node-cron
npm install --save-dev @types/node-cron
```

**Nota:** Asegúrate de tener instaladas todas las dependencias antes de comenzar el desarrollo.

---

## 📋 Contexto del Problema

- **Necesidad:** Endpoint para registrar correos en Supabase
- **Seguridad:** Solo accesible por el propietario y usuarios autorizados
- **Notificación:** Enviar email automático con URL de creación de contraseña
- **Restricción:** Sin presupuesto para servicios de email pagos
- **Arquitectura Actual:** Clean/Hexagonal con Express + TypeScript + Supabase + JWT
- **Seguridad de Tokens:** Tokens de un solo uso que expiran (24h para creación, 15min para recuperación)
- **Flujo de Recuperación:** Sistema de recuperación de contraseña con enlace temporal

---

## 🏗️ Arquitectura de la Solución

### 1. Sistema de Autenticación
- Middleware JWT para validar tokens
- Sistema de autorización basado en roles (admin/user)

### 2. Servicio de Email
- **Opción Recomendada:** Resend (100 emails/día gratis)
- **Alternativa 1:** SendGrid (100 emails/día gratis)
- **Alternativa 2:** Nodemailer con Gmail SMTP (gratis, menos confiable)

### 3. Flujo del Endpoint de Registro
```
1. Usuario autenticado hace POST /auth/register-email
2. Middleware valida JWT y rol admin
3. Validar email no existe en base de datos
4. Insertar email en Supabase (tabla users)
5. Generar token único de un solo uso (24h de validez)
6. Guardar token en tabla password_tokens
7. Enviar email con la URL conteniendo el token
8. Retornar confirmación exitosa
```

### 4. Sistema de Tokens de Un Solo Uso
- **Tabla password_tokens:** Almacena tokens activos y usados
- **Token de Creación:** Válido por 24 horas, un solo uso
- **Token de Recuperación:** Válido por 15 minutos, un solo uso
- **Validación:** Verificar que el token existe, no está usado, y no expiró
- **Invalidación:** Marcar token como usado después de consumirse

**Flujo de Validación de Token:**
```
1. Cliente envía request con token
2. Verificar firma JWT (criptográficamente válido)
3. Verificar expiración en payload JWT
4. Buscar token en tabla password_tokens
5. Verificar que existe en BD
6. Verificar que used = FALSE
7. Verificar que expires_at > NOW()
8. Verificar que type coincide con la operación
9. Si todo OK: procesar request
10. Marcar token como usado (used = TRUE, used_at = NOW())
11. Token no puede volver a usarse
```

### 5. Flujo de Recuperación de Contraseña
```
1. Usuario hace POST /auth/forgot-password con su email
2. Validar que el email existe en la base de datos
3. Generar token único de un solo uso (15 min de validez)
4. Guardar token en tabla password_tokens
5. Enviar email con URL de recuperación
6. Usuario hace POST /auth/reset-password con token y nueva contraseña
7. Validar token (existe, no usado, no expirado)
8. Actualizar contraseña
9. Invalidar token
10. Retornar confirmación
```

---

## 📦 Fases y Tareas

## 🔷 FASE 1: Middleware de Autenticación JWT (Protección de Rutas)

### Tarea 1.1: Crear la interfaz de Request extendido
**Archivo:** `src/types/express.d.ts`  
**Acción:** Crear archivo de definición de tipos para extender Request de Express
**Detalles:**
- Extender interfaz `Request` de Express
- Agregar propiedades `userId: string` y `email: string`
- Agregar propiedad opcional `userRole?: string`

### Tarea 1.2: Crear el middleware de autenticación
**Archivo:** `src/infrastructure/middleware/auth.middleware.ts`  
**Acción:** Implementar middleware para validar JWT
**Detalles:**
- Extraer token del header `Authorization: Bearer <token>`
- Validar que el token exista
- Usar `verifyToken()` de `src/utils/jwt.ts`
- Manejar errores: token inválido, expirado, o ausente
- Agregar `userId` y `email` al objeto `req`
- Retornar errores 401 con mensajes descriptivos

### Tarea 1.3: Crear excepciones de autenticación
**Archivos:**
- `src/application/exception/UnauthorizedError.ts`
- `src/application/exception/TokenExpiredError.ts`
- `src/application/exception/InvalidTokenError.ts`

**Detalles:**
- Crear las 3 clases de error extendiendo `AuthError`
- Agregar mensajes y códigos específicos

### Tarea 1.4: Crear tests del middleware (opcional)
**Archivo:** `src/infrastructure/middleware/__tests__/auth.middleware.test.ts`  
**Acción:** Tests unitarios del middleware
**Detalles:**
- Test con token válido
- Test con token inválido
- Test sin token
- Test con token expirado

---

## 🔷 FASE 2: Sistema de Autorización (Control de Acceso Admin)

### Tarea 2.1: Agregar campo role y tabla de tokens a la base de datos
**Archivo:** `setup-database.sql` (actualizar)  
**Acción:** Agregar columna `role` a la tabla `users` y crear tabla `password_tokens`
**Detalles:**
```sql
-- Agregar columna role a users
ALTER TABLE users 
ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Actualizar usuario principal como admin (reemplazar con tu email)
UPDATE users SET role = 'admin' WHERE email = 'tu-email@ejemplo.com';

-- Crear tabla para tokens de un solo uso
CREATE TABLE password_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('password_creation', 'password_reset')),
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX idx_password_tokens_token ON password_tokens(token);
CREATE INDEX idx_password_tokens_user_id ON password_tokens(user_id);
CREATE INDEX idx_password_tokens_expires_at ON password_tokens(expires_at);

-- Función para limpiar tokens expirados (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION clean_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_tokens 
  WHERE expires_at < NOW() AND used = TRUE;
END;
$$ LANGUAGE plpgsql;
```

### Tarea 2.2: Actualizar UserEntity con rol
**Archivo:** `src/infrastructure/repository/entity/UserEntity.ts`  
**Acción:** Agregar campo `role` a la interfaz
**Detalles:**
- Agregar propiedad `role: string`

### Tarea 2.3: Actualizar User domain entity con rol
**Archivo:** `src/domain/entity/User.ts`  
**Acción:** Agregar campo `role` a la entidad de dominio
**Detalles:**
- Agregar propiedad `role: string`
- Actualizar constructor si es necesario

### Tarea 2.4: Actualizar UserMapper con rol
**Archivo:** `src/infrastructure/repository/mapper/UserMapper.ts`  
**Acción:** Mapear campo `role` entre entidades
**Detalles:**
- Actualizar método `toDomain` para incluir `role`
- Actualizar método `toEntity` si existe

### Tarea 2.5: Crear middleware de autorización admin
**Archivo:** `src/infrastructure/middleware/admin.middleware.ts`  
**Acción:** Middleware que valida rol de admin
**Detalles:**
- Verificar que `req.userId` exista (requiere auth.middleware antes)
- Consultar usuario en base de datos usando repositorio
- Validar que `user.role === 'admin'`
- Si no es admin, retornar 403 Forbidden
- Agregar `req.userRole = 'admin'` si pasa

### Tarea 2.6: Crear excepción ForbiddenError
**Archivo:** `src/application/exception/ForbiddenError.ts`  
**Acción:** Error para acceso denegado
**Detalles:**
- Extender `AuthError`
- Mensaje: "Access denied. Admin privileges required"
- Código: `FORBIDDEN`

---

## 🔷 FASE 3: Servicio de Email (Integración de Resend)

### Tarea 3.1: Instalar dependencias de Resend
**Comando:** `npm install resend`  
**Acción:** Agregar librería de Resend al proyecto

### Tarea 3.2: Configurar variables de entorno para email
**Archivo:** `.env.example`  
**Acción:** Agregar configuración de Resend
**Detalles:**
```env
# =================================
# SERVICIO DE EMAIL (RESEND)
# =================================
# API Key de Resend (obtener de https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxx
# Email del remitente (debe estar verificado en Resend)
RESEND_FROM_EMAIL=noreply@tudominio.com
# URL base de tu aplicación frontend (para generar links)
APP_BASE_URL=http://localhost:5173
```

### Tarea 3.3: Crear configuración de Resend
**Archivo:** `src/infrastructure/config/resend.ts`  
**Acción:** Configurar cliente de Resend
**Detalles:**
- Importar `Resend` de 'resend'
- Crear y exportar instancia con API key del .env
- Validar que exista `RESEND_API_KEY`

### Tarea 3.4: Crear interfaz de EmailService (Puerto)
**Archivo:** `src/domain/port/portout/EmailServicePort.ts`  
**Acción:** Definir contrato del servicio de email
**Detalles:**
```typescript
export interface EmailServicePort {
  sendPasswordCreationEmail(to: string, token: string): Promise<void>;
}
```

### Tarea 3.5: Crear DTO para envío de email
**Archivo:** `src/application/dto/SendEmailInputDTO.ts`  
**Acción:** DTO para datos de email
**Detalles:**
- Propiedades: `to: string`, `subject: string`, `token: string`

### Tarea 3.6: Crear adaptador de Resend
**Archivo:** `src/infrastructure/email/adapter/ResendEmailAdapter.ts`  
**Acción:** Implementar `EmailServicePort` con Resend
**Detalles:**
- Implementar método `sendPasswordCreationEmail`
- Generar URL completa: `${APP_BASE_URL}/create-password?token=${token}`
- Crear template HTML del email (simple y claro)
- Usar `resend.emails.send()`
- Manejar errores de envío

### Tarea 3.7: Crear template HTML del email
**Archivo:** `src/infrastructure/email/templates/password-creation.template.ts`  
**Acción:** Template HTML para el email
**Detalles:**
- Función que recibe `email` y `url` y retorna HTML
- Diseño simple, responsivo
- Incluir título, mensaje de bienvenida, botón/link, y footer
- Mencionar que el link expira en 24h (o tiempo que definas)

### Tarea 3.8: Crear excepción EmailSendError
**Archivo:** `src/application/exception/EmailSendError.ts`  
**Acción:** Error para fallos al enviar email
**Detalles:**
- Extender clase base de error apropiada
- Mensaje descriptivo
- Código: `EMAIL_SEND_FAILED`

---

## 🔷 FASE 4: Caso de Uso de Registro de Email

### Tarea 4.1: Crear EmailAlreadyExistsError
**Archivo:** `src/application/exception/EmailAlreadyExistsError.ts`  
**Acción:** Error cuando email ya está registrado
**Detalles:**
- Extender clase base apropiada
- Mensaje: "Email already registered"
- Código: `EMAIL_ALREADY_EXISTS`

### Tarea 4.2: Crear RegisterEmailInputDTO
**Archivo:** `src/application/dto/RegisterEmailInputDTO.ts`  
**Acción:** DTO de entrada para registrar email
**Detalles:**
- Propiedad: `email: string`

### Tarea 4.3: Crear RegisterEmailResultDTO
**Archivo:** `src/application/dto/RegisterEmailResultDTO.ts`  
**Acción:** DTO de resultado del registro
**Detalles:**
- Propiedades: `userId: string`, `email: string`, `message: string`, `emailSent: boolean`

### Tarea 4.4: Generar token de creación de contraseña
**Archivo:** `src/utils/jwt.ts` (actualizar)  
**Acción:** Agregar funciones para generar tokens especiales
**Detalles:**
- Crear función `generatePasswordCreationToken(userId: string, email: string): string`
  - Token con payload: `{ userId, email, type: 'password_creation', jti: uuid() }`
  - jti (JWT ID): identificador único para el token
  - Expiración: 24 horas
  - Retornar token firmado
- Crear función `generatePasswordResetToken(userId: string, email: string): string`
  - Token con payload: `{ userId, email, type: 'password_reset', jti: uuid() }`
  - Expiración: 15 minutos
  - Retornar token firmado

### Tarea 4.5: Actualizar UserRepositoryPort con método create
**Archivo:** `src/domain/port/portout/UserRepositoryPort.ts`  
**Acción:** Verificar que existe método `create(email: string)`
**Detalles:**
- Si no existe, agregarlo
- Retorna `Promise<User>`

### Tarea 4.6: Crear PasswordTokenRepositoryPort
**Archivo:** `src/domain/port/portout/PasswordTokenRepositoryPort.ts`  
**Acción:** Definir puerto para gestión de tokens
**Detalles:**
```typescript
export interface PasswordTokenRepositoryPort {
  createToken(userId: string, token: string, type: 'password_creation' | 'password_reset', expiresAt: Date): Promise<void>;
  validateToken(token: string, type: string): Promise<{ valid: boolean; userId?: string; email?: string }>;
  markTokenAsUsed(token: string): Promise<void>;
  deleteExpiredTokens(): Promise<void>;
}
```

### Tarea 4.7: Crear RegisterEmailUseCase
**Archivo:** `src/application/usecase/RegisterEmailUseCase.ts`  
**Acción:** Lógica de negocio para registrar email
**Detalles:**
```typescript
Pasos del caso de uso:
1. Validar email con EmailValidator
2. Verificar que email NO exista en base de datos
3. Si existe, lanzar EmailAlreadyExistsError
4. Crear usuario en base de datos (UserRepository.create)
5. Generar token de creación de contraseña con generatePasswordCreationToken
6. Calcular fecha de expiración (24h desde ahora)
7. Guardar token en base de datos (PasswordTokenRepository.createToken)
8. Enviar email con EmailService incluyendo el token en la URL
9. Retornar RegisterEmailResultDTO
```

### Tarea 4.8: Actualizar validación de email si es necesario
**Archivo:** `src/application/validator/EmailValidator.ts`  
**Acción:** Verificar que valida correctamente
**Detalles:**
- Asegurar validación con regex adecuado
- Lanzar `ValidationError` si es inválido

---

## 🔷 FASE 5: Endpoint de Registro de Email

### Tarea 5.1: Actualizar AuthController con registerEmail
**Archivo:** `src/infrastructure/controller/AuthController.ts`  
**Acción:** Agregar método `registerEmail`
**Detalles:**
- Inyectar `RegisterEmailUseCase` en constructor
- Método `async registerEmail(req: Request, res: Response)`
- Extraer `email` del body
- Validar que exista email (400 si falta)
- Ejecutar caso de uso
- Manejar errores específicos:
  - `EmailAlreadyExistsError` → 409 Conflict
  - `ValidationError` → 400 Bad Request
  - `EmailSendError` → 500 pero usuario creado (indicar en respuesta)
- Retornar 201 Created si todo OK

### Tarea 5.2: Actualizar auth.routes.ts con nueva ruta
**Archivo:** `src/infrastructure/routes/auth.routes.ts`  
**Acción:** Agregar ruta POST protegida
**Detalles:**
```typescript
router.post(
  '/register-email',
  authMiddleware,
  adminMiddleware,
  (req, res) => authController.registerEmail(req, res)
);
```

### Tarea 5.3: Actualizar factory/inyección de dependencias
**Archivo:** `src/infrastructure/routes/auth.routes.ts` o archivo de inyección
**Acción:** Instanciar RegisterEmailUseCase y EmailService
**Detalles:**
- Crear instancia de `ResendEmailAdapter`
- Crear instancia de `RegisterEmailUseCase` con repositorio y emailService
- Pasar al controlador

### Tarea 5.4: Actualizar validación de variables de entorno
**Archivo:** `src/index.ts`  
**Acción:** Agregar validación de variables de Resend
**Detalles:**
- Agregar a `requiredVars`: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_BASE_URL`
- Validar en función `validateEnvVars()`

---

## 🔷 FASE 6: Sistema de Recuperación de Contraseña (Tokens de Un Solo Uso)

### Tarea 6.1: Crear PasswordTokenEntity
**Archivo:** `src/infrastructure/repository/entity/PasswordTokenEntity.ts`  
**Acción:** Definir entidad de base de datos para tokens
**Detalles:**
```typescript
export interface PasswordTokenEntity {
  id: string;
  user_id: string;
  token: string;
  type: 'password_creation' | 'password_reset';
  used: boolean;
  expires_at: Date;
  used_at?: Date;
  created_at: Date;
}
```

### Tarea 6.2: Crear SupabasePasswordTokenRepositoryAdapter
**Archivo:** `src/infrastructure/repository/adapter/SupabasePasswordTokenRepositoryAdapter.ts`  
**Acción:** Implementar PasswordTokenRepositoryPort con Supabase
**Detalles:**
- Implementar método `createToken()`: insertar en tabla password_tokens
- Implementar método `validateToken()`:
  - Buscar token en base de datos
  - Verificar que existe
  - Verificar que no está usado (used = false)
  - Verificar que no expiró (expires_at > NOW())
  - Retornar { valid: true/false, userId, email }
- Implementar método `markTokenAsUsed()`:
  - UPDATE password_tokens SET used = true, used_at = NOW()
- Implementar método `deleteExpiredTokens()`:
  - DELETE tokens donde expires_at < NOW() y used = true

### Tarea 6.3: Crear excepciones de tokens
**Archivos:**
- `src/application/exception/TokenAlreadyUsedError.ts`
- `src/application/exception/TokenNotFoundError.ts`

**Detalles:**
- Extender clase base apropiada
- Mensajes descriptivos para cada caso
- Códigos: `TOKEN_ALREADY_USED`, `TOKEN_NOT_FOUND`

### Tarea 6.4: Crear ForgotPasswordInputDTO
**Archivo:** `src/application/dto/ForgotPasswordInputDTO.ts`  
**Acción:** DTO para solicitud de recuperación
**Detalles:**
- Propiedad: `email: string`

### Tarea 6.5: Crear ForgotPasswordResultDTO
**Archivo:** `src/application/dto/ForgotPasswordResultDTO.ts`  
**Acción:** DTO de resultado
**Detalles:**
- Propiedades: `message: string`, `emailSent: boolean`

### Tarea 6.6: Crear ResetPasswordInputDTO
**Archivo:** `src/application/dto/ResetPasswordInputDTO.ts`  
**Acción:** DTO para resetear contraseña
**Detalles:**
- Propiedades: `token: string`, `newPassword: string`

### Tarea 6.7: Crear ResetPasswordResultDTO
**Archivo:** `src/application/dto/ResetPasswordResultDTO.ts`  
**Acción:** DTO de resultado
**Detalles:**
- Propiedades: `success: boolean`, `message: string`

### Tarea 6.8: Actualizar EmailServicePort con método de recuperación
**Archivo:** `src/domain/port/portout/EmailServicePort.ts`  
**Acción:** Agregar método para enviar email de recuperación
**Detalles:**
```typescript
export interface EmailServicePort {
  sendPasswordCreationEmail(to: string, token: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
}
```

### Tarea 6.9: Crear template de email de recuperación
**Archivo:** `src/infrastructure/email/templates/password-reset.template.ts`  
**Acción:** Template HTML para recuperación
**Detalles:**
- Función que recibe `email` y `url` y retorna HTML
- Diseño similar al de creación pero con mensaje de recuperación
- **IMPORTANTE:** Mencionar que el link expira en 15 minutos
- Incluir advertencia de seguridad (si no solicitó esto, ignore el email)

### Tarea 6.10: Actualizar ResendEmailAdapter
**Archivo:** `src/infrastructure/email/adapter/ResendEmailAdapter.ts`  
**Acción:** Implementar método sendPasswordResetEmail
**Detalles:**
- Generar URL: `${APP_BASE_URL}/reset-password?token=${token}`
- Usar template de password-reset
- Usar `resend.emails.send()` con subject apropiado
- Manejar errores

### Tarea 6.11: Crear ForgotPasswordUseCase
**Archivo:** `src/application/usecase/ForgotPasswordUseCase.ts`  
**Acción:** Caso de uso para solicitar recuperación
**Detalles:**
```typescript
Pasos del caso de uso:
1. Validar email con EmailValidator
2. Buscar usuario por email en base de datos
3. Si no existe, retornar éxito SIEMPRE (por seguridad, no revelar si email existe)
4. Si existe:
   a. Generar token de recuperación con generatePasswordResetToken
   b. Calcular fecha de expiración (15 minutos desde ahora)
   c. Guardar token en base de datos (PasswordTokenRepository.createToken)
   d. Enviar email con EmailService
5. Retornar ForgotPasswordResultDTO con mensaje genérico
```

### Tarea 6.12: Crear ResetPasswordUseCase
**Archivo:** `src/application/usecase/ResetPasswordUseCase.ts`  
**Acción:** Caso de uso para resetear contraseña
**Detalles:**
```typescript
Pasos del caso de uso:
1. Validar nueva contraseña con PasswordValidator
2. Verificar token con PasswordTokenRepository.validateToken('password_reset')
3. Si token inválido, lanzar TokenExpiredError o TokenAlreadyUsedError
4. Obtener userId del token validado
5. Hash de la nueva contraseña
6. Actualizar contraseña en base de datos
7. Marcar token como usado (PasswordTokenRepository.markTokenAsUsed)
8. Invalidar TODOS los tokens de sesión anteriores del usuario (logout forzado)
9. Retornar ResetPasswordResultDTO
```

### Tarea 6.13: Actualizar CreatePasswordUseCase para validar token
**Archivo:** `src/application/usecase/CreatePasswordUseCase.ts`  
**Acción:** Agregar validación de token de un solo uso
**Detalles:**
```typescript
Pasos actualizados:
1. Decodificar token JWT para obtener email y userId
2. Validar token con PasswordTokenRepository.validateToken('password_creation')
3. Si token ya fue usado o expiró, lanzar error apropiado
4. Validar contraseña con PasswordValidator
5. Hash de la contraseña
6. Actualizar usuario en base de datos
7. Marcar token como usado (PasswordTokenRepository.markTokenAsUsed)
8. Retornar CreatePasswordResultDTO
```

### Tarea 6.14: Actualizar AuthController con endpoints de recuperación
**Archivo:** `src/infrastructure/controller/AuthController.ts`  
**Acción:** Agregar métodos forgotPassword y resetPassword
**Detalles:**

**Método forgotPassword:**
- Público (no requiere autenticación)
- Extraer `email` del body
- Ejecutar ForgotPasswordUseCase
- Siempre retornar 200 con mensaje genérico (seguridad)
- Manejar errores internamente sin revelar información

**Método resetPassword:**
- Público (no requiere autenticación, el token es la autorización)
- Extraer `token` y `newPassword` del body
- Ejecutar ResetPasswordUseCase
- Manejar errores específicos:
  - `TokenExpiredError` → 400 "Token expired"
  - `TokenAlreadyUsedError` → 400 "Token already used"
  - `TokenNotFoundError` → 400 "Invalid token"
  - `WeakPasswordError` → 400 "Password too weak"
- Retornar 200 si éxito

### Tarea 6.15: Actualizar auth.routes.ts con rutas de recuperación
**Archivo:** `src/infrastructure/routes/auth.routes.ts`  
**Acción:** Agregar rutas públicas
**Detalles:**
```typescript
// Solicitar recuperación de contraseña (público)
router.post(
  '/forgot-password',
  (req, res) => authController.forgotPassword(req, res)
);

// Resetear contraseña con token (público)
router.post(
  '/reset-password',
  (req, res) => authController.resetPassword(req, res)
);
```

### Tarea 6.16: Actualizar inyección de dependencias
**Archivo:** `src/infrastructure/routes/auth.routes.ts` o archivo de inyección
**Acción:** Instanciar nuevos casos de uso
**Detalles:**
- Crear instancia de `SupabasePasswordTokenRepositoryAdapter`
- Crear instancias de `ForgotPasswordUseCase` y `ResetPasswordUseCase`
- Actualizar AuthController para recibir estos casos de uso
- Actualizar `CreatePasswordUseCase` con el repositorio de tokens

---

## 🔷 FASE 7: Testing y Documentación

### Tarea 7.1: Ejecutar base de datos actualizada
**Acción:** Aplicar cambios SQL en Supabase
**Detalles:**
- Ejecutar ALTER TABLE para agregar columna `role`
- Crear tabla `password_tokens` con todos los índices
- Crear función `clean_expired_tokens()`
- Actualizar tu usuario como admin
- Verificar que otros usuarios tengan role='user'

### Tarea 7.2: Configurar cuenta de Resend
**Acción:** Crear cuenta y configurar dominio
**Pasos:**
1. Ir a https://resend.com y crear cuenta gratis
2. Verificar dominio o usar dominio de prueba de Resend
3. Obtener API Key
4. Agregar al archivo `.env`

### Tarea 7.3: Crear script de test de registro
**Archivo:** `test-register-email.ts`  
**Acción:** Script para probar el endpoint de registro
**Detalles:**
```typescript
// 1. Login como admin para obtener token
// 2. Llamar POST /auth/register-email con token
// 3. Verificar respuesta 201
// 4. Verificar que llega email
// 5. Verificar que el token está en la base de datos
// 6. Intentar registrar mismo email (debería fallar con 409)
```

### Tarea 7.4: Crear script de test de recuperación
**Archivo:** `test-password-recovery.ts`  
**Acción:** Script para probar flujo de recuperación
**Detalles:**
```typescript
// 1. Usuario existente llama POST /auth/forgot-password
// 2. Verificar respuesta 200
// 3. Verificar que llega email con token de 15min
// 4. Extraer token del email
// 5. Llamar POST /auth/reset-password con token y nueva contraseña
// 6. Verificar respuesta 200
// 7. Intentar usar el mismo token nuevamente (debería fallar: token usado)
// 8. Intentar login con la nueva contraseña (debería funcionar)
```

### Tarea 7.5: Crear script de test de creación con token
**Archivo:** `test-create-password-token.ts`  
**Acción:** Probar que crear contraseña valide token de un solo uso
**Detalles:**
```typescript
// 1. Registrar nuevo email como admin
// 2. Extraer token del email recibido
// 3. Llamar POST /auth/create-password con token válido
// 4. Verificar que contraseña se crea exitosamente
// 5. Verificar que token se marca como usado en BD
// 6. Intentar usar el mismo token otra vez (debería fallar: token usado)
```

### Tarea 7.6: Documentar endpoints en README
**Archivo:** `README.md`  
**Acción:** Agregar documentación completa de todos los endpoints
**Detalles:**
```markdown
## Endpoint: Registrar Email (Admin)
**POST** `/auth/register-email`

**Headers:**
- `Authorization: Bearer <admin-jwt-token>`

**Body:**
```json
{
  "email": "nuevo@ejemplo.com"
}
```

**Respuestas:**
- 201: Email registrado y notificación enviada
- 400: Email inválido
- 401: No autenticado
- 403: No tiene permisos de admin
- 409: Email ya existe
- 500: Error interno

---

## Endpoint: Solicitar Recuperación de Contraseña
**POST** `/auth/forgot-password`

**Body:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Respuestas:**
- 200: Siempre retorna éxito (por seguridad)
  - Si email existe: se envía correo con link de recuperación (válido 15 min)
  - Si email no existe: no se envía nada pero retorna 200 igual

---

## Endpoint: Resetear Contraseña
**POST** `/auth/reset-password`

**Body:**
```json
{
  "token": "jwt-token-del-email",
  "newPassword": "NuevaContraseña123!"
}
```

**Respuestas:**
- 200: Contraseña actualizada exitosamente
- 400: Token inválido, expirado, ya usado, o contraseña débil
- 500: Error interno
```

### Tarea 7.7: Crear guía de configuración de Resend
**Archivo:** `docs/CONFIGURACION_RESEND.md`  
**Acción:** Documentar paso a paso la configuración
**Detalles:**
- Crear cuenta en Resend
- Verificar dominio (o usar sandbox)
- Obtener API Key
- Configurar variables de entorno
- Probar envío de email de prueba

### Tarea 7.8: Actualizar .env.example con valores de ejemplo
**Archivo:** `.env.example`  
**Acción:** Asegurar que incluye todas las variables nuevas
**Detalles:**
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `APP_BASE_URL`

### Tarea 7.9: Pruebas de integración completas - Registro
**Acción:** Probar flujo de registro end-to-end
**Escenarios:**
1. Usuario sin token intenta registrar email → 401
2. Usuario normal (no admin) intenta registrar email → 403
3. Admin registra email válido → 201 + email recibido con token
4. Verificar token en BD (usado=false, type=password_creation, expires en 24h)
5. Admin intenta registrar email duplicado → 409
6. Admin registra email inválido → 400
7. Usuario usa token del email para crear contraseña → 200
8. Verificar token marcado como usado en BD
9. Intentar reusar el mismo token → 400 (token ya usado)

### Tarea 7.10: Pruebas de integración completas - Recuperación
**Acción:** Probar flujo de recuperación end-to-end
**Escenarios:**
1. Usuario solicita recuperación con email existente → 200
2. Verificar email recibido con token de 15 minutos
3. Verificar token en BD (usado=false, type=password_reset, expires en 15min)
4. Usuario solicita recuperación con email inexistente → 200 (sin email enviado)
5. Usuario usa token válido para resetear contraseña → 200
6. Verificar token marcado como usado en BD
7. Intentar reusar el mismo token → 400 (token ya usado)
8. Login con la nueva contraseña → éxito
9. Los tokens de sesión anteriores deberían estar invalidados
10. Dejar pasar 15 minutos, intentar usar token → 400 (token expirado)

### Tarea 7.11: Pruebas de seguridad de tokens
**Acción:** Verificar comportamiento de seguridad
**Escenarios:**
1. Token manipulado (modificar payload) → 400
2. Token con firma inválida → 400
3. Token de tipo incorrecto (usar password_creation en reset-password) → 400
4. Múltiples solicitudes de recuperación (tokens anteriores deben seguir válidos)
5. Verificar que tokens expirados no se pueden usar
6. Verificar que clean_expired_tokens() elimina tokens viejos

### Tarea 7.12: Verificar logs y manejo de errores
**Acción:** Revisar logs del servidor
**Detalles:**
- Verificar que errores se loggean apropiadamente
- No exponer información sensible en logs (contraseñas, tokens completos)
- Logs estructurados para debugging
- Log de intentos de uso de tokens inválidos (posible ataque)

---

## 📊 Resumen de Archivos a Crear/Modificar

### ✨ Archivos Nuevos (35)

**Middleware y Tipos:**
1. `src/types/express.d.ts`
2. `src/infrastructure/middleware/auth.middleware.ts`
3. `src/infrastructure/middleware/admin.middleware.ts`

**Excepciones de Autenticación:**
4. `src/application/exception/UnauthorizedError.ts`
5. `src/application/exception/TokenExpiredError.ts`
6. `src/application/exception/InvalidTokenError.ts`
7. `src/application/exception/ForbiddenError.ts`

**Excepciones de Negocio:**
8. `src/application/exception/EmailAlreadyExistsError.ts`
9. `src/application/exception/EmailSendError.ts`
10. `src/application/exception/TokenAlreadyUsedError.ts`
11. `src/application/exception/TokenNotFoundError.ts`

**Configuración de Servicios:**
12. `src/infrastructure/config/resend.ts`

**Puertos (Interfaces):**
13. `src/domain/port/portout/EmailServicePort.ts`
14. `src/domain/port/portout/PasswordTokenRepositoryPort.ts`

**DTOs de Registro:**
15. `src/application/dto/SendEmailInputDTO.ts`
16. `src/application/dto/RegisterEmailInputDTO.ts`
17. `src/application/dto/RegisterEmailResultDTO.ts`

**DTOs de Recuperación:**
18. `src/application/dto/ForgotPasswordInputDTO.ts`
19. `src/application/dto/ForgotPasswordResultDTO.ts`
20. `src/application/dto/ResetPasswordInputDTO.ts`
21. `src/application/dto/ResetPasswordResultDTO.ts`

**Adaptadores y Repositorios:**
22. `src/infrastructure/email/adapter/ResendEmailAdapter.ts`
23. `src/infrastructure/repository/entity/PasswordTokenEntity.ts`
24. `src/infrastructure/repository/adapter/SupabasePasswordTokenRepositoryAdapter.ts`

**Templates de Email:**
25. `src/infrastructure/email/templates/password-creation.template.ts`
26. `src/infrastructure/email/templates/password-reset.template.ts`

**Casos de Uso:**
27. `src/application/usecase/RegisterEmailUseCase.ts`
28. `src/application/usecase/ForgotPasswordUseCase.ts`
29. `src/application/usecase/ResetPasswordUseCase.ts`

**Scripts de Testing:**
30. `test-register-email.ts`
31. `test-password-recovery.ts`
32. `test-create-password-token.ts`

**Documentación:**
33. `docs/CONFIGURACION_RESEND.md`

### 🔄 Archivos a Modificar (11)
1. `setup-database.sql` - Agregar columna role y tabla password_tokens
2. `src/infrastructure/repository/entity/UserEntity.ts` - Agregar role
3. `src/domain/entity/User.ts` - Agregar role
4. `src/infrastructure/repository/mapper/UserMapper.ts` - Mapear role
5. `src/utils/jwt.ts` - Agregar generatePasswordCreationToken y generatePasswordResetToken
6. `src/infrastructure/controller/AuthController.ts` - Agregar registerEmail, forgotPassword, resetPassword
7. `src/infrastructure/routes/auth.routes.ts` - Agregar rutas protegidas y públicas
8. `src/application/usecase/CreatePasswordUseCase.ts` - Validar token de un solo uso
9. `src/index.ts` - Validar nuevas variables de entorno
10. `.env.example` - Agregar variables de Resend
11. `README.md` - Documentar nuevos endpoints

---

## 🎯 Orden de Ejecución Recomendado

### Sprint 1: Autenticación y Autorización (Fases 1-2)
**Duración Estimada:** 2-3 días
1. Implementar middleware de autenticación JWT
2. Agregar sistema de roles en base de datos
3. Crear tabla password_tokens
4. Implementar middleware de autorización admin
5. Probar protección de rutas

### Sprint 2: Repositorio de Tokens y Servicios Base (Fase 3 parcial + Fase 6 parcial)
**Duración Estimada:** 2-3 días
1. Crear PasswordTokenEntity y PasswordTokenRepositoryPort
2. Implementar SupabasePasswordTokenRepositoryAdapter
3. Configurar cuenta de Resend
4. Integrar cliente de Resend
5. Crear adaptador de email básico
6. Actualizar utilidades JWT con funciones de tokens

### Sprint 3: Flujo de Registro de Email (Fases 4-5)
**Duración Estimada:** 2-3 días
1. Crear templates de email de creación
2. Implementar RegisterEmailUseCase con tokens de un solo uso
3. Actualizar CreatePasswordUseCase para validar tokens
4. Crear endpoint protegido de registro
5. Integrar todo el flujo
6. Manejo de errores completo

### Sprint 4: Flujo de Recuperación de Contraseña (Fase 6)
**Duración Estimada:** 2-3 días
1. Crear templates de email de recuperación
2. Implementar ForgotPasswordUseCase
3. Implementar ResetPasswordUseCase
4. Crear endpoints públicos de recuperación
5. Implementar invalidación de sesiones
6. Manejo de errores y seguridad

### Sprint 5: Testing Completo y Documentación (Fase 7)
**Duración Estimada:** 2-3 días
1. Pruebas end-to-end de registro
2. Pruebas end-to-end de recuperación
3. Pruebas de seguridad de tokens
4. Pruebas de tokens de un solo uso
5. Documentación completa de endpoints
6. Guía de configuración
7. Refinamiento y ajustes
8. Implementar limpieza automática de tokens expirados

---

## ⚠️ Consideraciones Importantes

### Seguridad
- ✅ JWT debe validarse en CADA request protegido
- ✅ Usar HTTPS en producción para headers Authorization
- ✅ JWT_SECRET debe ser fuerte (64+ caracteres, generado aleatoriamente)
- ✅ **Tokens de un solo uso:**
  - Token de creación de contraseña: válido 24h, un solo uso
  - Token de recuperación: válido 15min, un solo uso
  - Validar en BD que el token existe y no está usado antes de procesar
  - Marcar como usado INMEDIATAMENTE después de consumir
- ✅ **No exponer información sensible:**
  - No revelar si un email existe en forgot-password (retornar siempre 200)
  - No incluir tokens completos en logs
  - No exponer APIs de Resend en frontend
- ✅ **Validación de tokens:**
  - Verificar firma JWT
  - Verificar expiración
  - Verificar tipo de token correcto (password_creation vs password_reset)
  - Verificar que no está usado en BD
- ✅ **Rate limiting:** Considerar limitar solicitudes de forgot-password por IP
- ✅ **Invalidación de sesiones:** Al resetear contraseña, invalidar tokens de sesión anteriores

### Performance
- ⚡ Envío de email es asíncrono, no bloquear respuesta si no es crítico
- ⚡ Cachear usuarios admin si se consultan frecuentemente
- ⚡ Índices en tabla password_tokens para búsqueda rápida por token
- ⚡ **Limpieza de tokens expirados:**
  - Ejecutar función clean_expired_tokens() periódicamente (cron job)
  - Considerar retención de 30 días para auditoría
  - Eliminar solo tokens usados y expirados

### Escalabilidad
- 📈 **Resend Free:** 100 emails/día (suficiente para MVP)
- 📈 Si creces, upgrade a plan pagado o cambiar a SendGrid
- 📈 Considerar cola de emails (Redis + Bull) si volumen aumenta
- 📈 **Tabla password_tokens:** Puede crecer rápidamente
  - Implementar particionado si tienes millones de usuarios
  - Limpiar tokens antiguos regularmente
- 📈 **Múltiples solicitudes:** Usuario puede solicitar varios tokens de recuperación
  - Todos los tokens no usados siguen válidos hasta expiración
  - Considerar invalidar tokens anteriores si se genera uno nuevo

### Recuperación y Mantenimiento
- 🔧 **Monitoreo:** Agregar logs para:
  - Intentos de uso de tokens inválidos (posible ataque)
  - Intentos de uso de tokens ya usados
  - Tokens expirados siendo usados
- 🔧 **Métricas:** Trackear:
  - Tasa de conversión de emails registrados a contraseñas creadas
  - Tiempo promedio entre registro y creación de contraseña
  - Tasa de uso de recuperación de contraseña
- 🔧 **Backup:** Asegurar backup de tabla password_tokens para auditoría

### Alternativas a Resend
Si prefieres otra opción:

**SendGrid** (100/día gratis):
```typescript
npm install @sendgrid/mail
// Similar implementación, cambiar adaptador
```

**Nodemailer + Gmail SMTP** (gratis):
```typescript
npm install nodemailer
// Configurar con app password de Gmail
// Menos confiable, límites más estrictos
```

### Limpieza Automática de Tokens (Opcional pero Recomendado)

**Opción 1: Cron Job con node-cron**
```bash
npm install node-cron
```

```typescript
// src/infrastructure/jobs/token-cleanup.job.ts
import cron from 'node-cron';
import { passwordTokenRepository } from '../config/dependencies';

// Ejecutar limpieza diaria a las 3:00 AM
export const startTokenCleanupJob = () => {
  cron.schedule('0 3 * * *', async () => {
    console.log('Running token cleanup job...');
    try {
      await passwordTokenRepository.deleteExpiredTokens();
      console.log('Token cleanup completed successfully');
    } catch (error) {
      console.error('Token cleanup failed:', error);
    }
  });
};

// Iniciar en src/index.ts
startTokenCleanupJob();
```

**Opción 2: Trigger de Supabase (PostgreSQL)**
```sql
-- Trigger que limpia automáticamente al insertar
CREATE OR REPLACE FUNCTION trigger_clean_expired_tokens()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM password_tokens 
  WHERE expires_at < NOW() - INTERVAL '7 days' AND used = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_clean_tokens
AFTER INSERT ON password_tokens
EXECUTE FUNCTION trigger_clean_expired_tokens();
```

**Opción 3: Función Serverless (Supabase Edge Functions)**
- Crear función edge que se ejecute cada 24h
- Llamar a clean_expired_tokens() desde la función

---

## 🔗 Referencias y Recursos

- **Resend Docs:** https://resend.com/docs
- **JWT Best Practices:** https://jwt.io/introduction
- **Express Middleware:** https://expressjs.com/en/guide/writing-middleware.html
- **Supabase SQL:** https://supabase.com/docs/guides/database
- **TypeScript Clean Architecture:** https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html

---

## ✅ Checklist Final

Antes de dar por completado el feature:

### Funcionalidad Básica
- [ ] Todas las pruebas pasan
- [ ] Tabla password_tokens creada correctamente en Supabase
- [ ] Columna role agregada a tabla users
- [ ] Usuario admin configurado en base de datos

### Sistema de Autenticación y Autorización
- [ ] Middleware de autenticación JWT funciona
- [ ] Middleware de autorización admin funciona
- [ ] Usuarios no-admin no pueden acceder a /register-email
- [ ] Usuarios sin token reciben 401

### Flujo de Registro de Email
- [ ] Admin puede registrar emails nuevos exitosamente
- [ ] Email se recibe correctamente con token de 24h
- [ ] Link del email funciona y redirige correctamente
- [ ] Emails duplicados retornan 409 Conflict
- [ ] Emails inválidos retornan 400 Bad Request
- [ ] Token se guarda en BD con tipo password_creation
- [ ] Token de creación solo funciona UNA vez
- [ ] Intentar reusar token de creación retorna error
- [ ] Token expirado (después de 24h) no funciona

### Flujo de Recuperación de Contraseña
- [ ] Endpoint /forgot-password siempre retorna 200 (seguridad)
- [ ] Email de recuperación se recibe con token de 15min
- [ ] Link de recuperación funciona correctamente
- [ ] Token se guarda en BD con tipo password_reset
- [ ] Token de recuperación solo funciona UNA vez
- [ ] Intentar reusar token de recuperación retorna error
- [ ] Token expirado (después de 15min) no funciona
- [ ] Solicitar recuperación con email inexistente no envía email
- [ ] Resetear contraseña invalida sesiones anteriores

### Sistema de Tokens de Un Solo Uso
- [ ] Tokens se marcan como usados después de consumirse
- [ ] No se pueden usar tokens de tipo incorrecto
- [ ] Tokens manipulados son rechazados
- [ ] Validación en BD funciona correctamente
- [ ] Función clean_expired_tokens() funciona
- [ ] Múltiples tokens de recuperación pueden coexistir

### Configuración y Variables de Entorno
- [ ] Variables de entorno documentadas en .env.example
- [ ] RESEND_API_KEY configurado
- [ ] RESEND_FROM_EMAIL configurado
- [ ] APP_BASE_URL configurado correctamente
- [ ] Validación de variables al iniciar servidor funciona

### Documentación
- [ ] README actualizado con todos los endpoints
- [ ] Guía de configuración de Resend creada
- [ ] Respuestas de API documentadas
- [ ] Ejemplos de uso incluidos
- [ ] Documentación de seguridad incluida

### Seguridad y Logs
- [ ] Logs apropiados sin información sensible (contraseñas, tokens completos)
- [ ] No se exponen detalles de existencia de emails
- [ ] Manejo de errores completo y descriptivo
- [ ] Intentos de uso de tokens inválidos se loggean
- [ ] Código sigue la arquitectura existente (Clean/Hexagonal)
- [ ] Sin hardcoding de valores (usar .env)

### Testing
- [ ] Script test-register-email.ts funciona
- [ ] Script test-password-recovery.ts funciona
- [ ] Script test-create-password-token.ts funciona
- [ ] Todos los escenarios de error probados
- [ ] Pruebas de seguridad completadas
- [ ] Pruebas de tokens expirados completadas

---

**¡Éxito en la implementación! 🚀**

**Tiempo Estimado Total:** 10-15 días de desarrollo

**Priorización:**
1. **Crítico:** Fases 1-5 (Sistema base de registro)
2. **Importante:** Fase 6 (Recuperación de contraseña)
3. **Recomendado:** Fase 7 (Testing exhaustivo y documentación)


############################################
# COMPLETADO: PLAN DE REGISTRO DE CORREOS
############################################