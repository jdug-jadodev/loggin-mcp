# 📚 Índice del Proyecto Loggin-MCP

**Microservicio de Autenticación con Arquitectura Hexagonal**

> Documentación completa de la estructura, componentes implementados y ubicación de cada módulo.

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura](#arquitectura)
4. [Estructura de Carpetas](#estructura-de-carpetas)
5. [Capa de Dominio](#capa-de-dominio)
6. [Capa de Aplicación](#capa-de-aplicación)
7. [Capa de Infraestructura](#capa-de-infraestructura)
8. [Utilidades](#utilidades)
9. [Endpoints API](#endpoints-api)
10. [Base de Datos](#base-de-datos)
11. [Variables de Entorno](#variables-de-entorno)

---

## 📖 Descripción General

**Loggin-MCP** es un microservicio de autenticación construido con Node.js, Express y TypeScript, siguiendo los principios de **Arquitectura Hexagonal (Ports & Adapters)**. Proporciona funcionalidades de:

- Registro de usuarios por email
- Creación de contraseñas seguras
- Login con JWT
- Envío de emails transaccionales
- Control de acceso basado en roles (Admin/User)

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | 18+ | Runtime |
| **TypeScript** | 5.3.x | Tipado estático |
| **Express** | 4.18.x | Servidor HTTP |
| **Supabase** | 2.98.x | Base de datos PostgreSQL |
| **JWT (jsonwebtoken)** | 9.0.x | Autenticación con tokens |
| **bcrypt** | 6.0.x | Hash de contraseñas |
| **Resend** | 6.9.x | Envío de emails |
| **dotenv** | 16.3.x | Variables de entorno |

### Dependencias de Desarrollo
- `ts-node-dev` - Hot reload en desarrollo
- `@types/*` - Tipos TypeScript para las dependencias

---

## 🏗️ Arquitectura

El proyecto implementa **Arquitectura Hexagonal** con tres capas principales:

```
┌────────────────────────────────────────────────────────────┐
│                    INFRAESTRUCTURA                         │
│  (Controllers, Routes, Adapters, Config, Middlewares)      │
├────────────────────────────────────────────────────────────┤
│                      APLICACIÓN                            │
│     (Use Cases, DTOs, Validators, Mappers, Exceptions)     │
├────────────────────────────────────────────────────────────┤
│                        DOMINIO                             │
│              (Entities, Ports In/Out)                      │
└────────────────────────────────────────────────────────────┘
```

### Flujo de Dependencias
- **Dominio** → No depende de nada externo
- **Aplicación** → Depende solo del Dominio
- **Infraestructura** → Implementa los puertos del Dominio

---

## 📁 Estructura de Carpetas

```
src/
├── index.ts                          # Punto de entrada del servidor
├── application/                      # Capa de aplicación
│   ├── dto/                          # Data Transfer Objects
│   ├── exception/                    # Excepciones personalizadas
│   ├── mapper/                       # Mappers de dominio a DTO
│   ├── usecase/                      # Casos de uso (lógica de negocio)
│   └── validator/                    # Validadores
├── domain/                           # Capa de dominio
│   ├── entity/                       # Entidades del dominio
│   └── port/                         # Puertos (interfaces)
│       ├── portin/                   # Puertos de entrada
│       └── portout/                  # Puertos de salida
├── infrastructure/                   # Capa de infraestructura
│   ├── config/                       # Configuraciones externas
│   ├── controller/                   # Controladores HTTP
│   ├── email/                        # Servicio de email
│   │   ├── adapter/                  # Adaptador de Resend
│   │   └── templates/                # Templates HTML de emails
│   ├── middleware/                   # Middlewares Express
│   ├── repository/                   # Repositorios
│   │   ├── adapter/                  # Adaptadores de Supabase
│   │   ├── entity/                   # Entidades de persistencia
│   │   └── mapper/                   # Mappers DB ↔ Dominio
│   └── routes/                       # Definición de rutas
├── types/                            # Tipos TypeScript globales
└── utils/                            # Utilidades
    ├── jwt/                          # Funciones JWT
    ├── password/                     # Funciones de hashing
    └── scripts/                      # Scripts de configuración
```

---

## 🔷 Capa de Dominio

### Entidades

| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| `User.ts` | `src/domain/entity/` | Entidad principal del usuario |

**Estructura User:**
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  hasPassword: boolean;
  role?: string;           // 'user' | 'admin'
  createdAt: Date;
  updatedAt: Date;
}
```

### Puertos de Entrada (Port In)

Interfaces que definen los casos de uso disponibles:

| Puerto | Ubicación | Descripción |
|--------|-----------|-------------|
| `CheckEmailExistsUseCasePort` | `src/domain/port/portin/` | Verificar si un email existe |
| `CreatePasswordUseCasePort` | `src/domain/port/portin/` | Crear contraseña para usuario |
| `LoginUseCasePort` | `src/domain/port/portin/` | Autenticar usuario |
| `RegisterEmailUseCasePort` | `src/domain/port/portin/` | Registrar nuevo usuario |

### Puertos de Salida (Port Out)

Interfaces para dependencias externas:

| Puerto | Ubicación | Descripción |
|--------|-----------|-------------|
| `UserRepositoryPort` | `src/domain/port/portout/` | Operaciones CRUD de usuarios |
| `PasswordTokenRepositoryPort` | `src/domain/port/portout/` | Gestión de tokens de contraseña |
| `EmailServicePort` | `src/domain/port/portout/` | Envío de emails |

**Métodos de UserRepositoryPort:**
- `findByEmail(email)` → Buscar usuario por email
- `findById(id)` → Buscar usuario por ID
- `create(email, role)` → Crear nuevo usuario
- `updatePassword(id, hash)` → Actualizar contraseña

**Métodos de EmailServicePort:**
- `sendPasswordCreationEmail(to, token)` → Email de creación de contraseña
- `sendPasswordResetEmail(to, token)` → Email de reset de contraseña

---

## 🟢 Capa de Aplicación

### Casos de Uso

| Caso de Uso | Ubicación | Descripción |
|-------------|-----------|-------------|
| `CheckEmailExistsUseCase` | `src/application/usecase/` | Verifica si un email está registrado y si tiene contraseña |
| `CreatePasswordUseCase` | `src/application/usecase/` | Crea contraseña para usuario sin contraseña |
| `ForgotPasswordUseCase` | `src/application/usecase/` | Inicia el flujo de recuperación de contraseña, genera token y envía email |
| `LoginUseCase` | `src/application/usecase/` | Autentica usuario y genera JWT |
| `RegisterEmailUseCase` | `src/application/usecase/` | Registra email, crea usuario y envía email con token |
| `ResetPasswordUseCase` | `src/application/usecase/` | Valida token de reset y actualiza la contraseña del usuario |

### DTOs (Data Transfer Objects)

**Entrada:**

| DTO | Ubicación | Campos |
|-----|-----------|--------|
| `CheckEmailInputDTO` | `src/application/dto/` | `email` |
| `CreatePasswordInputDTO` | `src/application/dto/` | `email`, `password`, `token` |
| `ForgotPasswordInputDTO` | `src/application/dto/` | `email` |
| `LoginInputDTO` | `src/application/dto/` | `email`, `password` |
| `RegisterEmailInputDTO` | `src/application/dto/` | `email` |
| `ResetPasswordInputDTO` | `src/application/dto/` | `token`, `newPassword` |
| `SendEmailInputDTO` | `src/application/dto/` | Para envío de emails |

**Salida:**

| DTO | Ubicación | Campos |
|-----|-----------|--------|
| `EmailCheckResultDTO` | `src/application/dto/` | `exists`, `hasPassword`, `email` |
| `CreatePasswordResultDTO` | `src/application/dto/` | `success`, `userId`, `email`, `message` |
| `ForgotPasswordResultDTO` | `src/application/dto/` | `message`, `emailSent` |
| `LoginResultDTO` | `src/application/dto/` | `token`, `userId`, `email`, `expiresIn`, `expiresAt` |
| `RegisterEmailResultDTO` | `src/application/dto/` | `userId`, `email`, `message`, `emailSent` |
| `ResetPasswordResultDTO` | `src/application/dto/` | `success`, `message` |

### Validadores

| Validador | Ubicación | Descripción |
|-----------|-----------|-------------|
| `isValidEmail` | `src/application/validator/email/` | Valida formato de email |
| `validateEmailOrThrow` | `src/application/validator/email/` | Valida email o lanza excepción |
| `validatePasswordStrength` | `src/application/validator/password/` | Valida fortaleza de contraseña |

**Reglas de Validación de Contraseña:**
- Mínimo 8 caracteres
- Máximo 72 caracteres (límite bcrypt)
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número
- No puede contener el email

### Excepciones Personalizadas

| Excepción | Ubicación | Propósito |
|-----------|-----------|-----------|
| `AuthError` | `src/application/exception/` | **Clase base** para todas las excepciones |
| `ValidationError` | `src/application/exception/` | Errores de validación genéricos |
| `EmailNotFoundError` | `src/application/exception/` | Email no existe en BD |
| `EmailAlreadyExistsError` | `src/application/exception/` | Email ya registrado |
| `InvalidCredentialsError` | `src/application/exception/` | Credenciales incorrectas |
| `UserAlreadyHasPasswordError` | `src/application/exception/` | Usuario ya tiene contraseña |
| `WeakPasswordError` | `src/application/exception/` | Contraseña no cumple requisitos |
| `HashingError` | `src/application/exception/` | Error al hashear contraseña |
| `TokenGenerationError` | `src/application/exception/` | Error generando JWT |
| `TokenExpiredError` | `src/application/exception/` | Token JWT expirado |
| `InvalidTokenError` | `src/application/exception/` | Token JWT inválido |
| `TokenAlreadyUsedError` | `src/application/exception/` | Token ya fue utilizado |
| `TokenNotFoundError` | `src/application/exception/` | Token no encontrado en BD |
| `TokenTypeMismatchError` | `src/application/exception/` | Tipo de token incorrecto |
| `UnauthorizedError` | `src/application/exception/` | No autorizado (401) |
| `ForbiddenError` | `src/application/exception/` | Prohibido (403) |
| `EmailSendError` | `src/application/exception/` | Error enviando email |
| `DatabaseError` | `src/application/exception/` | Error de base de datos |

### Mappers de Aplicación

| Mapper | Ubicación | Descripción |
|--------|-----------|-------------|
| `toLoginResultDTO` | `src/application/mapper/user/` | Convierte User + token a LoginResultDTO |

---

## 🔶 Capa de Infraestructura

### Controladores

| Controlador | Ubicación | Descripción |
|-------------|-----------|-------------|
| `AuthController` | `src/infrastructure/controller/` | Controlador principal de autenticación |
| `HealthController` | `src/infrastructure/controller/` | Health check del servidor |

**Métodos de AuthController:**
- `checkEmail(req, res)` → Verificar email
- `createPassword(req, res)` → Crear contraseña
- `forgotPassword(req, res)` → Iniciar recuperación de contraseña
- `login(req, res)` → Autenticar usuario
- `registerEmail(req, res)` → Registrar nuevo email
- `resetPassword(req, res)` → Resetear contraseña con token

### Rutas

| Archivo | Ubicación | Endpoints |
|---------|-----------|-----------|
| `auth.routes.ts` | `src/infrastructure/routes/` | `/auth/*` |
| `health.routes.ts` | `src/infrastructure/routes/` | `/health` |
| `notFound.routes.ts` | `src/infrastructure/routes/` | Catch-all 404 |

### Middlewares

| Middleware | Ubicación | Descripción |
|------------|-----------|-------------|
| `authMiddleware` | `src/infrastructure/middleware/` | Verifica JWT en Authorization header |
| `adminMiddleware` | `src/infrastructure/middleware/` | Verifica rol de administrador |

**Flujo de Autenticación:**
1. `authMiddleware` extrae y verifica el token JWT
2. Inyecta `userId`, `email` en `req`
3. `adminMiddleware` verifica si `user.role === 'admin'`

### Adaptadores de Repositorio (Supabase)

| Adaptador | Ubicación | Implementa |
|-----------|-----------|------------|
| `SupabaseUserRepositoryAdapter` | `src/infrastructure/repository/adapter/` | `UserRepositoryPort` |
| `SupabasePasswordTokenRepositoryAdapter` | `src/infrastructure/repository/adapter/` | `PasswordTokenRepositoryPort` |

### Entidades de Persistencia

| Entidad | Ubicación | Descripción |
|---------|-----------|-------------|
| `UserEntity` | `src/infrastructure/repository/entity/` | Estructura de la tabla `users` |

**Diferencias User vs UserEntity:**
```
User (Dominio)          UserEntity (DB)
─────────────           ───────────────
passwordHash      ←→    password_hash
hasPassword       ←→    has_password
createdAt         ←→    created_at
updatedAt         ←→    updated_at
```

### Mappers de Infraestructura

| Mapper | Ubicación | Descripción |
|--------|-----------|-------------|
| `UserMapper` | `src/infrastructure/repository/mapper/` | Convierte UserEntity ↔ User |

### Servicio de Email (Resend)

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `ResendEmailAdapter` | `src/infrastructure/email/adapter/` | Implementa EmailServicePort |
| `passwordCreationTemplate` | `src/infrastructure/email/templates/` | Template HTML para crear contraseña |
| `resetTemplate` | `src/infrastructure/email/templates/` | Template HTML para resetear contraseña |

### Configuraciones

| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| `supabase.ts` | `src/infrastructure/config/` | Cliente Supabase |
| `resend/index.ts` | `src/infrastructure/config/resend/` | Cliente Resend |

---

## 🔧 Utilidades

### JWT

| Función | Ubicación | Descripción |
|---------|-----------|-------------|
| `generateToken` | `src/utils/jwt/` | Genera JWT de sesión (15h) |
| `generatePasswordCreationToken` | `src/utils/jwt/` | Genera token para crear contraseña (24h) |
| `generatePasswordResetToken` | `src/utils/jwt/` | Genera token para reset (15min) |
| `verifyToken` | `src/utils/jwt/` | Verifica y decodifica JWT |

**Tipos JWT:**

| Tipo | Ubicación | Descripción |
|------|-----------|-------------|
| `JwtPayload` | `src/utils/jwt/types/` | Payload básico (userId, email) |
| `PasswordTokenPayload` | `src/utils/jwt/types/` | Payload para tokens de contraseña |

### Password

| Función | Ubicación | Descripción |
|---------|-----------|-------------|
| `hashPassword` | `src/utils/password/` | Hashea contraseña con bcrypt |
| `comparePassword` | `src/utils/password/` | Compara contraseña con hash |
| `getSaltRounds` | `src/utils/password/` | Obtiene salt rounds (default: 10) |

### Scripts

| Script | Ubicación | Descripción |
|--------|-----------|-------------|
| `setup-database.sql` | `src/utils/scripts/` | Script SQL para crear tablas |
| `test-jwt.ts` | `src/utils/scripts/` | Test de funciones JWT |
| `test-password.ts` | `src/utils/scripts/` | Test de funciones de password |
| `test-supabase.ts` | `src/utils/scripts/` | Test de conexión Supabase |
| `test-send-email.ts` | `src/utils/scripts/` | Test de envío de emails |

---

## 🌐 Endpoints API

### Health Check

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| `GET` | `/health` | ❌ | Estado del servidor |

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-10T...",
  "uptime": 123.45,
  "version": "1.0.0",
  "service": "loggin-mcp"
}
```

### Autenticación

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| `POST` | `/auth/check-email` | ❌ | Verificar si email existe |
| `POST` | `/auth/create-password` | ❌ | Crear contraseña |
| `POST` | `/auth/forgot-password` | ❌ | Solicitar recuperación de contraseña |
| `POST` | `/auth/login` | ❌ | Iniciar sesión |
| `POST` | `/auth/register-email` | ✅ Admin | Registrar nuevo usuario |
| `POST` | `/auth/reset-password` | ❌ | Resetear contraseña con token |

#### POST /auth/check-email
```json
// Request
{ "email": "usuario@example.com" }

// Response 200
{ "status": "success", "exists": true, "hasPassword": true, "email": "..." }
```

#### POST /auth/create-password
```json
// Request
{ "email": "usuario@example.com", "password": "SecurePass123" }

// Response 201
{ "status": "success", "userId": "uuid", "email": "...", "message": "Password created successfully" }
```

#### POST /auth/login
```json
// Request
{ "email": "usuario@example.com", "password": "SecurePass123" }

// Response 200
{
  "status": "success",
  "token": "eyJhbG...",
  "userId": "uuid",
  "email": "...",
  "expiresIn": "15h",
  "expiresAt": 1741234567890
}
```

#### POST /auth/register-email
```json
// Headers: Authorization: Bearer <admin-token>
// Request
{ "email": "nuevo@example.com" }

// Response 201
{ "userId": "uuid", "email": "...", "message": "User created and email sent", "emailSent": true }
```

#### POST /auth/forgot-password
```json
// Request
{ "email": "usuario@example.com" }

// Response 200
{ "status": "success", "message": "If the email exists, you will receive instructions.", "emailSent": true }
```

#### POST /auth/reset-password
```json
// Request
{ "token": "eyJhbG...", "newPassword": "NewSecurePass123" }

// Response 200
{ "status": "success", "message": "Password updated" }
```

---

## 🗄️ Base de Datos

### Tabla: `users`

| Columna | Tipo | Null | Default | Descripción |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `email` | TEXT | NO | - | Email único |
| `password_hash` | TEXT | SI | NULL | Hash bcrypt |
| `has_password` | BOOLEAN | NO | false | ¿Tiene contraseña? |
| `role` | VARCHAR(20) | SI | 'user' | Rol del usuario |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Fecha creación |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Última actualización |

**Índices:**
- `idx_users_email` en `email`

**Trigger:**
- `users_updated_at` → Actualiza `updated_at` en cada UPDATE

### Tabla: `password_tokens`

| Columna | Tipo | Null | Default | Descripción |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `user_id` | UUID | NO | - | FK → users.id |
| `token` | TEXT | NO | - | Token JWT |
| `type` | VARCHAR(32) | NO | - | 'password_creation' \| 'password_reset' |
| `expires_at` | TIMESTAMPTZ | NO | - | Fecha expiración |
| `used` | BOOLEAN | NO | false | ¿Token usado? |
| `used_at` | TIMESTAMPTZ | SI | NULL | Fecha de uso |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Fecha creación |

**Índices:**
- `idx_password_tokens_token`
- `idx_password_tokens_user_id`
- `idx_password_tokens_expires_at`

**Script SQL:** `src/utils/scripts/setup-database.sql`

---

## ⚙️ Variables de Entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `PORT` | ❌ | Puerto del servidor (default: 3000) |
| `NODE_ENV` | ❌ | development \| production |
| `JWT_SECRET` | ✅ | Clave para firmar JWT (min 32 chars) |
| `SUPABASE_URL` | ✅ | URL del proyecto Supabase |
| `SUPABASE_KEY` | ✅ | Clave anon de Supabase |
| `RESEND_API_KEY` | ✅* | API Key de Resend |
| `RESEND_FROM_EMAIL` | ✅* | Email remitente |
| `APP_BASE_URL` | ✅* | URL base de la app (para links en emails) |

*Requeridas para funcionalidad de emails

---

## 🚀 Scripts NPM

```bash
npm run dev      # Desarrollo con hot-reload
npm run build    # Compilar TypeScript
npm start        # Ejecutar producción
```

---

## 📝 Tipos Globales

**Extensión de Express Request:**
```typescript
// src/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      userId: string;
      email: string;
      userRole?: string;
    }
  }
}
```

---

## ✅ Funcionalidades Implementadas

- [x] Arquitectura Hexagonal completa
- [x] Autenticación JWT con expiración configurable
- [x] Hash seguro de contraseñas (bcrypt)
- [x] Validación robusta de emails y contraseñas
- [x] Registro de usuarios por admin
- [x] Flujo de creación de contraseña por email
- [x] **Flujo de recuperación de contraseña (forgot/reset)**
- [x] Sistema de excepciones tipadas
- [x] Middlewares de autenticación y autorización
- [x] Integración con Supabase (PostgreSQL)
- [x] Envío de emails con Resend
- [x] Templates HTML para emails (creación y reset)
- [x] Gestión de tokens de un solo uso
- [x] Health check endpoint
- [x] Manejo de rutas no encontradas (404)
- [x] Logging básico de requests
- [x] Graceful shutdown

---

*Documento generado el 10 de marzo de 2026*
