# 📊 Informe de Exploración de Código - Loggin-MCP

**Fecha de análisis:** 5 de marzo de 2026  
**Proyecto:** Microservicio de Autenticación (Loggin-MCP)  
**Ubicación:** `C:\Users\Usuario\Documents\mcp-server\Loggin-Mcp`

---

## 🔍 Contexto Detectado

### Descripción General
**Loggin-MCP** es un microservicio de autenticación construido con Node.js, Express y TypeScript que implementa un sistema de gestión de usuarios con autenticación JWT y Supabase como backend. El proyecto sigue una **arquitectura hexagonal (Ports & Adapters)** con separación clara de responsabilidades.

### Propósito del Sistema
Sistema de autenticación que permite:
- Verificación de correos electrónicos preexistentes en la base de datos
- Creación de contraseñas por primera vez para usuarios registrados
- Autenticación mediante JWT con tokens válidos por 15 horas
- Gestión segura de credenciales con hashing de contraseñas

### Stack Tecnológico

| Categoría | Tecnología | Versión | Propósito |
|-----------|-----------|---------|-----------|
| **Runtime** | Node.js | 18+ | Entorno de ejecución JavaScript |
| **Lenguaje** | TypeScript | 5.3.3 | Tipado estático y features modernas ES2022 |
| **Framework Web** | Express | 4.18.2 | Servidor HTTP y gestión de rutas |
| **Base de Datos** | Supabase/PostgreSQL | - | Backend as a Service + BD relacional |
| **Cliente BD** | @supabase/supabase-js | 2.98.0 | Cliente oficial de Supabase |
| **CORS** | cors | 2.8.5 | Control de acceso entre orígenes |
| **Variables de Entorno** | dotenv | 16.3.1 | Gestión de configuración |
| **Autenticación** | JWT | - | Tokens de autenticación (planificado) |
| **Hash de Contraseñas** | bcrypt | - | Hashing seguro (planificado) |

### Arquitectura Aplicada

**Arquitectura Hexagonal (Ports and Adapters)**

```
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ Controllers │  │   Adapters   │  │  Config/Setup  │    │
│  │  (HTTP API) │  │  (Supabase)  │  │   (Supabase)   │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
                    Port Interface
                         │
┌────────────────────────┴────────────────────────────────────┐
│                     DOMAIN LAYER                             │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐    │
│  │   Entities   │  │  Port Contracts│  │  Use Cases   │    │
│  │    (User)    │  │ (Repository IF)│  │  (Business)  │    │
│  └──────────────┘  └────────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
         │                                         │
┌────────┴────────────────────────────────────────┴───────────┐
│                    APPLICATION LAYER                         │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐       │
│  │   DTOs   │  │  Mappers │  │   Use Case Impls    │       │
│  │  (empty) │  │  (empty) │  │      (empty)        │       │
│  └──────────┘  └──────────┘  └─────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

**Principio de dependencias:**
- Infrastructure depende de Domain
- Application orquesta Domain
- Domain NO depende de nada (núcleo puro)

---

## 📂 Archivos Analizados

### Estructura Jerárquica Completa

```
Loggin-Mcp/
├── 📄 Configuration & Documentation
│   ├── package.json          # Dependencias y scripts npm
│   ├── tsconfig.json         # Configuración de TypeScript
│   ├── README.md            # Documentación principal
│   ├── PLAN_DESARROLLO.md   # Plan de desarrollo en fases
│   ├── ONE_SPEC.md          # Especificación root (vacío)
│   ├── cambios-registro.md  # Log automático de cambios
│   └── setup-database.sql   # Script de configuración de PostgreSQL
│
├── 🧪 Testing & Monitoring
│   ├── test-supabase.ts     # Script de prueba de conexión Supabase
│   └── monitor.js           # Monitor de cambios con Git
│
└── 📦 src/ (Código fuente)
    ├── index.ts             # ⭐ Punto de entrada del servidor
    │
    ├── 🎯 domain/           # CAPA DE DOMINIO (Reglas de negocio)
    │   ├── entity/
    │   │   └── User.ts      # ✅ Entidad de usuario (6 propiedades)
    │   └── port/
    │       ├── portin/      # Puertos de entrada (Use Cases - VACÍO)
    │       └── portout/
    │           └── UserRepositoryPort.ts  # ✅ Contrato de repositorio
    │
    ├── 🚀 application/      # CAPA DE APLICACIÓN (Casos de uso)
    │   ├── dto/             # DTOs de aplicación (VACÍO)
    │   ├── mapper/          # Mappers de aplicación (VACÍO)
    │   └── usecase/         # Implementaciones de casos de uso (VACÍO)
    │
    └── 🏗️ infrastructure/   # CAPA DE INFRAESTRUCTURA (Detalles técnicos)
        ├── config/
        │   └── supabase.ts  # ✅ Configuración del cliente Supabase
        ├── controller/      # Controladores HTTP (VACÍO)
        ├── dto/             # DTOs de infraestructura (VACÍO)
        ├── mapper/          # Mappers de infraestructura (VACÍO - tiene uno)
        └── repository/
            ├── adapter/
            │   └── SupabaseUserRepositoryAdapter.ts  # ✅ Adaptador Supabase
            ├── entity/
            │   └── UserEntity.ts  # ✅ Entidad ORM de Supabase
            └── mapper/
                └── UserMapper.ts  # ✅ Mapper Domain ↔️ Infrastructure

```

### Resumen Cuantitativo

| Categoría | Cantidad | Estado |
|-----------|----------|--------|
| **Archivos TypeScript** | 9 | ✅ Funcionales |
| **Archivos JavaScript** | 1 | ✅ Funcional (monitor) |
| **Archivos SQL** | 1 | ✅ Funcional |
| **Archivos Markdown** | 4 | 📝 Documentación |
| **Archivos de Config** | 2 | ✅ Configurados |
| **Carpetas Vacías** | 6 | ⏳ Pendientes (por diseño) |
| **Total de Archivos** | 17 | - |

---

## 📖 Explicación Detallada

### 1. Configuración del Proyecto

#### TypeScript Configuration (`tsconfig.json`)
```typescript
{
  "compilerOptions": {
    "target": "ES2022",        // JavaScript moderno
    "module": "CommonJS",       // Compatible con Node.js
    "strict": true,            // Modo estricto activado
    "outDir": "./dist",        // Compilación a carpeta dist
    "rootDir": "./src",        // Código fuente en src
    "esModuleInterop": true,   // Interoperabilidad con ES modules
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

**Análisis:**
- ✅ Configuración profesional con strict mode
- ✅ Soporte para decoradores (preparado para frameworks como NestJS si se migra)
- ✅ Source maps activados para debugging
- ✅ Tipado estricto (noImplicitAny, strictNullChecks)

#### Package Scripts
```json
{
  "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

**Análisis:**
- ✅ Hot-reload en desarrollo con `ts-node-dev`
- ✅ Compilación optimizada para producción
- ✅ Separación clara entre dev y prod

### 2. Capa de Dominio (Domain Layer)

#### Entidad User (`domain/entity/User.ts`)
```typescript
export interface User {
  id: string;
  email: string;
  passwordHash: string | null;    // null = sin contraseña aún
  hasPassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Características:**
- ✅ Entidad pura sin dependencias externas
- ✅ Inmutabilidad por diseño (interface)
- ✅ Nomenclatura camelCase (estándar TypeScript/JavaScript)
- ✅ Tipado estricto con `string | null` para estado transicional

#### Puerto de Repositorio (`domain/port/portout/UserRepositoryPort.ts`)
```typescript
export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(email: string): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<User>;
}
```

**Análisis:**
- ✅ Contrato puro (interface) sin implementación
- ✅ Inversión de dependencias correcta
- ✅ Retorno de dominio puro (`User`), no entidades de BD
- ✅ Operaciones CRUD básicas bien definidas

### 3. Capa de Infraestructura (Infrastructure Layer)

#### Configuración de Supabase (`infrastructure/config/supabase.ts`)
```typescript
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
```

**Análisis:**
- ✅ Validación temprana de variables de entorno
- ✅ Singleton pattern (instancia única exportada)
- ⚠️ Falta configuración adicional (retry policies, timeouts)

#### Adaptador de Supabase (`infrastructure/repository/adapter/SupabaseUserRepositoryAdapter.ts`)

**Características destacadas:**
- ✅ Implementa `UserRepositoryPort` correctamente
- ✅ Manejo de errores específicos:
  - `PGRST116` → Usuario no encontrado (retorna null)
  - `23505` → Violación de constraint UNIQUE (usuario duplicado)
- ✅ Uso del mapper para conversión Domain ↔️ Infrastructure
- ✅ Manejo asíncrono con async/await
- ✅ Selección específica de campos con `.select()`

**Código destacado:**
```typescript
async findByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {  // Not found
      return null;
    }
    throw new Error(`Error finding user: ${error.message}`);
  }
  
  return data ? UserMapper.toDomain(data as UserEntity) : null;
}
```

#### Mapper de Usuario (`infrastructure/repository/mapper/UserMapper.ts`)

**Responsabilidad:**
- Conversión bidireccional entre `User` (dominio) y `UserEntity` (BD)
- Transformación de nomenclatura: `snake_case` ↔️ `camelCase`
- Conversión de tipos: `string` ↔️ `Date`

```typescript
static toDomain(entity: UserEntity): User {
  return {
    id: entity.id,
    email: entity.email,
    passwordHash: entity.password_hash,     // snake_case → camelCase
    hasPassword: entity.has_password,
    createdAt: new Date(entity.created_at), // string → Date
    updatedAt: new Date(entity.updated_at),
  };
}
```

**Análisis:**
- ✅ Separación clara de nomenclaturas
- ✅ Conversión de tipos explícita
- ✅ Método estático (sin estado)
- 🔄 `toEntity()` retorna `Partial<UserEntity>` (podría ser más específico)

### 4. Servidor Express (`index.ts`)

#### Funcionalidades Implementadas

**Middlewares:**
```typescript
app.use(express.json({ limit: '10mb' }));  // Parser JSON con límite
app.use(cors());                            // CORS habilitado
app.use((req, res, next) => {              // Logging básico
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

**Endpoints actuales:**
- ✅ `GET /health` - Health check completo con uptime y versión
- ✅ `* (404)` - Manejo de rutas no encontradas

**Gestión de Errores:**
- ✅ Manejo de excepciones no capturadas (`uncaughtException`)
- ✅ Manejo de promesas rechazadas (`unhandledRejection`)
- ✅ Manejo de señales de terminación (`SIGTERM`, `SIGINT`)
- ✅ Validación de variables de entorno en inicio

**Response del Health Check:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-05T00:47:22.961Z",
  "uptime": 31.85,
  "version": "1.0.0",
  "service": "loggin-mcp"
}
```

### 5. Base de Datos (PostgreSQL/Supabase)

#### Esquema de la Tabla `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,                    -- nullable inicialmente
  has_password BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Características:**
- ✅ UUID como clave primaria (mejor que auto-increment para distribución)
- ✅ Email con constraint UNIQUE
- ✅ Índice en email para búsquedas rápidas
- ✅ Trigger automático para `updated_at`
- ✅ Timestamps con zona horaria
- ✅ Row Level Security (RLS) habilitado
- ⚠️ Política permisiva temporal ("Allow all") - **debe restringirse en producción**

#### Trigger de Actualización Automática
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Análisis:**
- ✅ Actualización automática de `updated_at` en cada UPDATE
- ✅ Implementación estándar de PostgreSQL

### 6. Herramientas de Monitoreo

#### Monitor de Cambios (`monitor.js`)
Script Node.js que:
- 📊 Monitorea cambios en Git (staged + unstaged + untracked)
- 📝 Genera registro detallado en `cambios-registro.md`
- 🔄 Se limpia automáticamente después de cada commit
- 📈 Proporciona estadísticas de líneas añadidas/eliminadas

**Características:**
- Detección de nuevos commits
- Debouncing para evitar escrituras excesivas
- Exclusión automática del propio archivo de registro
- Formato tabular con emojis para legibilidad

#### Script de Prueba (`test-supabase.ts`)
Script temporal para validar integración:
1. Crea usuario de prueba
2. Busca por email
3. Busca por ID

---

## 💪 Puntos Fuertes

### 1. Arquitectura y Diseño

#### ⭐ Arquitectura Hexagonal Bien Implementada
- **Separación de capas clara:** Domain, Application, Infrastructure
- **Inversión de dependencias correcta:** Infrastructure depende de Domain, no al revés
- **Contratos bien definidos:** Interfaces (Ports) definen comportamientos sin implementación

#### ⭐ Principios SOLID Aplicados
- **S (Single Responsibility):** Cada clase/módulo tiene una única responsabilidad
  - `UserMapper` solo mapea
  - `SupabaseUserRepositoryAdapter` solo gestiona persistencia
- **O (Open/Closed):** Extensible sin modificar código existente
  - Se pueden agregar nuevos adaptadores implementando `UserRepositoryPort`
- **L (Liskov Substitution):** Interfaces bien diseñadas
- **I (Interface Segregation):** Interfaces específicas y cohesivas
- **D (Dependency Inversion):** Domain no depende de detalles técnicos

#### ⭐ Patrones de Diseño Aplicados
1. **Repository Pattern:** Abstracción de persistencia
2. **Adapter Pattern:** `SupabaseUserRepositoryAdapter` adapta Supabase al dominio
3. **Mapper Pattern:** Traducción entre capas
4. **Singleton Pattern:** Cliente de Supabase
5. **Port and Adapter Pattern:** Core de la arquitectura hexagonal

### 2. Calidad de Código

#### ⭐ TypeScript Configurado Estrictamente
```typescript
"strict": true,
"noImplicitAny": true,
"strictNullChecks": true,
"strictFunctionTypes": true
```
**Beneficios:**
- Detección temprana de errores
- Autocompletado robusto en IDE
- Refactoring seguro

#### ⭐ Tipado Explícito y Descriptivo
```typescript
async findByEmail(email: string): Promise<User | null>
```
- Retornos nullables explícitos
- No uso de `any`
- Interfaces en lugar de types (más extensibles)

#### ⭐ Manejo de Errores Robusto
```typescript
if (error.code === 'PGRST116') {
  return null;  // Not found es normal
}
if (error.code === '23505') {
  throw new Error(`User with email ${email} already exists`);
}
```
- Distinción entre errores esperados y excepcionales
- Mensajes de error descriptivos
- Manejo específico por código de error

### 3. Configuración del Proyecto

#### ⭐ Variables de Entorno Seguras
- Uso de `dotenv` para configuración
- Validación temprana de variables críticas
- Separación de configuración de código

#### ⭐ Scripts de Desarrollo Profesionales
- Hot-reload en desarrollo
- Build optimizado para producción
- Separación clara de entornos

#### ⭐ Base de Datos Bien Diseñada
- UUID como PK (mejor para sistemas distribuidos)
- Índices en campos de búsqueda frecuente
- Triggers para auditoría automática
- RLS habilitado (seguridad a nivel de fila)

### 4. Documentación

#### ⭐ Documentación Extensa
- **README.md:** Guía completa de instalación y uso
- **PLAN_DESARROLLO.md:** Plan de desarrollo detallado en 10 fases
- **Comentarios en código:** Claros y concisos
- **Estructura autoexplicativa:** Nombres descriptivos

### 5. Testabilidad

#### ⭐ Alta Testabilidad por Diseño
- **Inyección de dependencias:** Fácil crear mocks
- **Interfaces/Ports:** Se pueden simular sin BD real
- **Lógica pura en Domain:** Sin side effects, fácil de testear
- **Script de prueba incluido:** `test-supabase.ts`

---

## 🔧 Áreas de Mejora

### 1. Capas Incompletas

#### ⚠️ Capa de Aplicación Vacía
**Estado actual:** Carpetas `application/dto`, `application/mapper`, `application/usecase` vacías

**Impacto:**
- No hay casos de uso implementados
- No hay orquestación de lógica de negocio
- Controllers accederían directamente a repositorios (anti-patrón)

**Recomendaciones:**
```typescript
// application/usecase/CreateUserPasswordUseCase.ts
export class CreateUserPasswordUseCase implements CreateUserPasswordPortIn {
  constructor(private readonly userRepository: UserRepositoryPort) {}
  
  async execute(request: CreatePasswordRequest): Promise<CreatePasswordResponse> {
    // 1. Validar que el usuario existe
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new UserNotFoundError(request.email);
    }
    
    // 2. Validar que NO tiene contraseña
    if (user.hasPassword) {
      throw new UserAlreadyHasPasswordError(request.email);
    }
    
    // 3. Hashear contraseña
    const passwordHash = await hashPassword(request.password);
    
    // 4. Actualizar usuario
    const updatedUser = await this.userRepository.updatePassword(user.id, passwordHash);
    
    return { userId: updatedUser.id, email: updatedUser.email };
  }
}
```

**Archivos necesarios:**
- `application/port/portin/CreateUserPasswordPortIn.ts`
- `application/port/portin/LoginPortIn.ts`
- `application/port/portin/CheckEmailPortIn.ts`
- `application/usecase/CreateUserPasswordUseCase.ts`
- `application/usecase/LoginUseCase.ts`
- `application/dto/CreatePasswordRequest.ts`
- `application/dto/CreatePasswordResponse.ts`

#### ⚠️ Sin Controladores HTTP
**Estado actual:** `infrastructure/controller/` vacío

**Impacto:**
- No hay exposición HTTP de funcionalidades
- Solo existe health check

**Recomendaciones:**
```typescript
// infrastructure/controller/AuthController.ts
export class AuthController {
  constructor(
    private readonly createPasswordUseCase: CreateUserPasswordUseCase,
    private readonly loginUseCase: LoginUseCase
  ) {}
  
  async createPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this.createPasswordUseCase.execute({ email, password });
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof UserAlreadyHasPasswordError) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
  
  async login(req: Request, res: Response): Promise<void> {
    // Implementar
  }
}
```

**Archivos necesarios:**
- `infrastructure/controller/AuthController.ts`
- `infrastructure/routes/auth.routes.ts`
- `infrastructure/dto/CreatePasswordRequestDTO.ts` (validación HTTP)
- `infrastructure/middleware/authMiddleware.ts`

### 2. Seguridad

#### 🔐 Módulos de Seguridad Faltantes

**a) Hash de Contraseñas (bcrypt)**
```bash
npm install bcrypt @types/bcrypt
```
```typescript
// infrastructure/utils/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

**b) JWT (Autenticación)**
```bash
npm install jsonwebtoken @types/jsonwebtoken
```
```typescript
// infrastructure/utils/jwt.ts
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '15h',
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
}
```

**c) Middleware de Autenticación**
```typescript
// infrastructure/middleware/authMiddleware.ts
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    res.status(401).json({ error: 'Token required' });
    return;
  }
  
  try {
    const payload = verifyToken(token);
    (req as any).user = payload;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}
```

#### 🔐 Validación de Entrada Faltante

**Estado actual:** No hay validación de datos de entrada

**Riesgos:**
- Inyección SQL (mitigado parcialmente por Supabase)
- Formato de email inválido
- Contraseñas débiles

**Recomendaciones:**
```bash
npm install joi
```
```typescript
// infrastructure/validation/authSchemas.ts
import Joi from 'joi';

export const createPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
```

**Middleware de validación:**
```typescript
export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }
    next();
  };
}

// Uso en rutas:
router.post('/create-password', validate(createPasswordSchema), authController.createPassword);
```

#### 🔐 Row Level Security (RLS) Permisivo

**Estado actual:**
```sql
CREATE POLICY "Allow all operations for now" ON users FOR ALL USING (true);
```

**Riesgo:**
- Cualquier cliente puede leer/modificar cualquier registro
- No hay aislamiento de datos

**Recomendaciones para producción:**
```sql
-- Permitir SELECT solo para el propio usuario
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Permitir UPDATE solo para el propio usuario
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- INSERT solo permitido por service_role o función específica
CREATE POLICY "Service role can insert users" ON users
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

### 3. Gestión de Errores

#### ⚠️ Errores Genéricos

**Problema actual:**
```typescript
throw new Error(`Error finding user by email: ${error.message}`);
```

**Recomendaciones:** Crear jerarquía de errores específicos del dominio

```typescript
// domain/error/DomainError.ts
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// domain/error/UserNotFoundError.ts
export class UserNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
  }
}

// domain/error/UserAlreadyExistsError.ts
export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`User already exists: ${email}`);
  }
}

// domain/error/InvalidCredentialsError.ts
export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid email or password');
  }
}

// domain/error/UserAlreadyHasPasswordError.ts
export class UserAlreadyHasPasswordError extends DomainError {
  constructor(email: string) {
    super(`User already has a password: ${email}`);
  }
}
```

**Middleware de manejo de errores:**
```typescript
// infrastructure/middleware/errorMiddleware.ts
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);
  
  if (err instanceof UserNotFoundError) {
    res.status(404).json({ error: err.message });
  } else if (err instanceof UserAlreadyExistsError) {
    res.status(409).json({ error: err.message });
  } else if (err instanceof InvalidCredentialsError) {
    res.status(401).json({ error: err.message });
  } else if (err instanceof UserAlreadyHasPasswordError) {
    res.status(409).json({ error: err.message });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// En index.ts (DESPUÉS de las rutas):
app.use(errorHandler);
```

### 4. Testing

#### ⚠️ Sin Suite de Tests Formal

**Estado actual:**
- Solo existe `test-supabase.ts` (script manual)
- No hay framework de testing configurado
- No hay tests unitarios ni de integración

**Recomendaciones:**

**a) Instalar framework de testing:**
```bash
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/jest-dom
npm install --save-dev supertest @types/supertest
```

**b) Configurar Jest:**
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
};
```

**c) Tests unitarios de ejemplo:**
```typescript
// src/domain/entity/__tests__/User.test.ts
describe('User Entity', () => {
  it('should create a user with null password initially', () => {
    const user: User = {
      id: '123',
      email: 'test@example.com',
      passwordHash: null,
      hasPassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    expect(user.hasPassword).toBe(false);
    expect(user.passwordHash).toBeNull();
  });
});

// src/infrastructure/repository/mapper/__tests__/UserMapper.test.ts
describe('UserMapper', () => {
  describe('toDomain', () => {
    it('should map UserEntity to User domain', () => {
      const entity: UserEntity = {
        id: '123',
        email: 'test@example.com',
        password_hash: 'hashedPassword',
        has_password: true,
        created_at: '2026-03-05T00:00:00Z',
        updated_at: '2026-03-05T00:00:00Z',
      };
      
      const domain = UserMapper.toDomain(entity);
      
      expect(domain.id).toBe('123');
      expect(domain.email).toBe('test@example.com');
      expect(domain.passwordHash).toBe('hashedPassword');
      expect(domain.hasPassword).toBe(true);
      expect(domain.createdAt).toBeInstanceOf(Date);
    });
  });
});
```

**d) Tests de integración:**
```typescript
// src/infrastructure/repository/adapter/__tests__/SupabaseUserRepositoryAdapter.integration.test.ts
import { SupabaseUserRepositoryAdapter } from '../SupabaseUserRepositoryAdapter';

describe('SupabaseUserRepositoryAdapter (Integration)', () => {
  let repository: SupabaseUserRepositoryAdapter;
  
  beforeAll(() => {
    repository = new SupabaseUserRepositoryAdapter();
  });
  
  it('should create and find user by email', async () => {
    const email = `test-${Date.now()}@example.com`;
    
    const created = await repository.create(email);
    expect(created.email).toBe(email);
    expect(created.hasPassword).toBe(false);
    
    const found = await repository.findByEmail(email);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
  });
  
  it('should return null for non-existent email', async () => {
    const result = await repository.findByEmail('nonexistent@example.com');
    expect(result).toBeNull();
  });
});
```

**e) Tests E2E:**
```typescript
// src/__tests__/auth.e2e.test.ts
import request from 'supertest';
import app from '../index'; // Exportar app desde index.ts

describe('Auth Endpoints (E2E)', () => {
  it('should return 404 for non-existent email check', async () => {
    const response = await request(app)
      .post('/auth/check-email')
      .send({ email: 'nonexistent@example.com' });
    
    expect(response.status).toBe(404);
  });
  
  it('should create password for valid user', async () => {
    // Implementar test completo
  });
});
```

**f) Scripts en package.json:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=__tests__"
  }
}
```

### 5. Observabilidad y Logging

#### ⚠️ Logging Básico

**Estado actual:**
```typescript
console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
```

**Limitaciones:**
- No hay niveles de log (debug, info, warn, error)
- No hay contexto estructurado
- No hay persistencia de logs
- Difícil de buscar y analizar

**Recomendaciones:**

**a) Instalar winston:**
```bash
npm install winston winston-daily-rotate-file
```

**b) Configurar logger:**
```typescript
// infrastructure/config/logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
        }`;
      })
    ),
  }),
];

if (process.env.NODE_ENV === 'production') {
  transports.push(
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
});
```

**c) Middleware de logging:**
```typescript
// infrastructure/middleware/loggingMiddleware.ts
import { logger } from '../config/logger';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  
  next();
}
```

**d) Uso en el código:**
```typescript
// En lugar de console.log
logger.info('User created successfully', { userId: user.id, email: user.email });
logger.error('Failed to create user', { email, error: error.message });
logger.warn('User attempted to create duplicate password', { email });
```

#### ⚠️ Sin Métricas

**Recomendaciones:**
- Agregar `prom-client` para métricas de Prometheus
- Métricas a trackear:
  - Cantidad de requests por endpoint
  - Latencia de endpoints
  - Tasa de errores
  - Usuarios activos
  - Tokens generados

### 6. Configuración de Producción

#### ⚠️ Sin Dockerfile

**Recomendación:**
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env
    restart: unless-stopped
```

#### ⚠️ Sin CI/CD

**Recomendación:** GitHub Actions workflow
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
```

### 7. Mejoras de Código Específicas

#### ⚠️ Falta Inyección de Dependencias Formal

**Problema actual:**
```typescript
export const supabase = createClient(...); // Singleton global
```

**Recomendación:** Usar contenedor de IoC (Inversión de Control)

```bash
npm install tsyringe reflect-metadata
```

```typescript
// infrastructure/container.ts
import { container } from 'tsyringe';
import { SupabaseUserRepositoryAdapter } from './infrastructure/repository/adapter/SupabaseUserRepositoryAdapter';
import { CreateUserPasswordUseCase } from './application/usecase/CreateUserPasswordUseCase';

// Registrar dependencias
container.register('UserRepositoryPort', {
  useClass: SupabaseUserRepositoryAdapter,
});

container.register('CreateUserPasswordUseCase', {
  useClass: CreateUserPasswordUseCase,
});

export { container };
```

```typescript
// infrastructure/controller/AuthController.ts
import { injectable, inject } from 'tsyringe';

@injectable()
export class AuthController {
  constructor(
    @inject('CreateUserPasswordUseCase')
    private readonly createPasswordUseCase: CreateUserPasswordUseCase
  ) {}
  
  // Métodos...
}
```

#### ⚠️ `index.ts` Demasiado Grande

**Problema:** Toda la configuración del servidor en un solo archivo

**Recomendación:** Separar responsabilidades

```typescript
// infrastructure/server/ExpressServer.ts
export class ExpressServer {
  private app: Application;
  
  constructor() {
    this.app = express();
    this.configureMiddlewares();
    this.configureRoutes();
    this.configureErrorHandling();
  }
  
  private configureMiddlewares(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(cors());
    this.app.use(loggingMiddleware);
  }
  
  private configureRoutes(): void {
    this.app.use('/health', healthRouter);
    this.app.use('/auth', authRouter);
    this.app.use('*', notFoundHandler);
  }
  
  private configureErrorHandling(): void {
    this.app.use(errorHandler);
  }
  
  public start(port: number): void {
    this.app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  }
  
  public getApp(): Application {
    return this.app; // Para tests
  }
}
```

```typescript
// index.ts (simplificado)
import 'reflect-metadata';
import './infrastructure/container';
import { ExpressServer } from './infrastructure/server/ExpressServer';

const PORT = parseInt(process.env.PORT || '3000', 10);
const server = new ExpressServer();

server.start(PORT);
```

#### ⚠️ Sin Rate Limiting

**Riesgo:** Ataques de fuerza bruta en login

**Recomendación:**
```bash
npm install express-rate-limit
```

```typescript
// infrastructure/middleware/rateLimitMiddleware.ts
import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos máximo
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const createPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 intentos máximo
  message: 'Too many password creation attempts',
});

// Uso en rutas:
router.post('/login', loginRateLimiter, authController.login);
router.post('/create-password', createPasswordRateLimiter, authController.createPassword);
```

### 8. Mejoras de Base de Datos

#### ⚠️ Sin Migraciones

**Problema:**
- Cambios de esquema se gestionan manualmente
- Difícil sincronizar entre entornos

**Recomendación:**
```bash
npm install knex
```

```typescript
// migrations/001_create_users_table.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').nullable();
    table.boolean('has_password').defaultTo(false);
    table.timestamps(true, true);
    
    table.index('email');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users');
}
```

#### ⚠️ Sin Pooling de Conexiones Configurado

**Recomendación:** Si se usa PostgreSQL directo (alternativa a Supabase):
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Máximo de conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## 🚀 Próximos Pasos

### Fase 1: Completar Funcionalidades Core (Alta Prioridad)

#### 1.1 Implementar Capa de Aplicación
**Estimación:** 2-3 días

**Tareas:**
- [ ] Crear `CreateUserPasswordUseCase` con validaciones
- [ ] Crear `LoginUseCase` con generación de JWT
- [ ] Crear `CheckEmailUseCase` para validar existencia
- [ ] Definir DTOs de entrada/salida
- [ ] Implementar mappers Application ↔️ Domain

**Archivos a crear:**
```
src/application/
├── port/portin/
│   ├── CreateUserPasswordPortIn.ts
│   ├── LoginPortIn.ts
│   └── CheckEmailPortIn.ts
├── usecase/
│   ├── CreateUserPasswordUseCase.ts
│   ├── LoginUseCase.ts
│   └── CheckEmailUseCase.ts
└── dto/
    ├── CreatePasswordRequest.ts
    ├── CreatePasswordResponse.ts
    ├── LoginRequest.ts
    ├── LoginResponse.ts
    ├── CheckEmailRequest.ts
    └── CheckEmailResponse.ts
```

#### 1.2 Implementar Seguridad
**Estimación:** 2 días

**Tareas:**
- [ ] Instalar e integrar bcrypt para hashing
- [ ] Instalar e integrar jsonwebtoken
- [ ] Crear utilidades de password (hash/compare)
- [ ] Crear utilidades de JWT (generate/verify)
- [ ] Implementar middleware de autenticación

**Archivos a crear:**
```
src/infrastructure/
├── utils/
│   ├── password.ts
│   └── jwt.ts
└── middleware/
    └── authMiddleware.ts
```

#### 1.3 Crear Controladores y Rutas
**Estimación:** 2 días

**Tareas:**
- [ ] Implementar `AuthController` con 3 endpoints
- [ ] Crear rutas `/auth/check-email`, `/auth/create-password`, `/auth/login`
- [ ] Implementar ruta protegida `/auth/profile` como ejemplo
- [ ] Integrar middleware de autenticación en rutas protegidas

**Archivos a crear:**
```
src/infrastructure/
├── controller/
│   └── AuthController.ts
└── routes/
    ├── auth.routes.ts
    └── index.ts
```

#### 1.4 Implementar Validación
**Estimación:** 1 día

**Tareas:**
- [ ] Instalar Joi o express-validator
- [ ] Crear schemas de validación para cada endpoint
- [ ] Crear middleware de validación genérico
- [ ] Aplicar validaciones en rutas

**Archivos a crear:**
```
src/infrastructure/
├── validation/
│   ├── authSchemas.ts
│   └── validateMiddleware.ts
```

### Fase 2: Mejorar Gestión de Errores (Media Prioridad)

#### 2.1 Crear Jerarquía de Errores
**Estimación:** 1 día

**Tareas:**
- [ ] Crear clase base `DomainError`
- [ ] Implementar errores específicos (UserNotFound, InvalidCredentials, etc.)
- [ ] Crear middleware de manejo de errores global
- [ ] Reemplazar `throw new Error()` por errores específicos

**Archivos a crear:**
```
src/domain/error/
├── DomainError.ts
├── UserNotFoundError.ts
├── UserAlreadyExistsError.ts
├── InvalidCredentialsError.ts
└── UserAlreadyHasPasswordError.ts

src/infrastructure/middleware/
└── errorMiddleware.ts
```

### Fase 3: Testing (Media Prioridad)

#### 3.1 Configurar Framework de Testing
**Estimación:** 1 día

**Tareas:**
- [ ] Instalar Jest y dependencias
- [ ] Configurar `jest.config.js`
- [ ] Crear estructura de carpetas `__tests__`
- [ ] Agregar scripts de test en `package.json`

#### 3.2 Implementar Tests Unitarios
**Estimación:** 3 días

**Tareas:**
- [ ] Tests de mappers (UserMapper)
- [ ] Tests de use cases (mock de repositorio)
- [ ] Tests de utilidades (password, jwt)
- [ ] Tests de validación

**Objetivo de cobertura:** >80%

#### 3.3 Implementar Tests de Integración
**Estimación:** 2 días

**Tareas:**
- [ ] Tests de repositorio con Supabase real (o test DB)
- [ ] Tests de flujos completos (create password → login)

#### 3.4 Implementar Tests E2E
**Estimación:** 2 días

**Tareas:**
- [ ] Tests de endpoints HTTP con supertest
- [ ] Tests de autenticación completa
- [ ] Tests de casos edge (token expirado, credenciales inválidas)

### Fase 4: Observabilidad (Baja-Media Prioridad)

#### 4.1 Implementar Logging Estructurado
**Estimación:** 1 día

**Tareas:**
- [ ] Instalar winston
- [ ] Configurar logger con niveles y formato
- [ ] Crear middleware de logging HTTP
- [ ] Reemplazar `console.log` por logger
- [ ] Configurar rotación de logs

#### 4.2 Agregar Métricas
**Estimación:** 1 día

**Tareas:**
- [ ] Instalar `prom-client`
- [ ] Crear endpoint `/metrics` para Prometheus
- [ ] Agregar métricas de HTTP (requests, latencia, errores)
- [ ] Agregar métricas de negocio (logins, registros)

### Fase 5: Mejoras de Seguridad (Alta Prioridad para Producción)

#### 5.1 Configurar Rate Limiting
**Estimación:** 0.5 días

**Tareas:**
- [ ] Instalar `express-rate-limit`
- [ ] Configurar rate limiter para login (5 intentos/15 min)
- [ ] Configurar rate limiter para create password (3 intentos/hora)
- [ ] Aplicar en rutas

#### 5.2 Reforzar RLS en Supabase
**Estimación:** 0.5 días

**Tareas:**
- [ ] Reemplazar política "Allow all" por políticas específicas
- [ ] Configurar RLS para operaciones de lectura/escritura
- [ ] Validar aislamiento de datos por usuario

#### 5.3 Agregar Helmet y HTTPS
**Estimación:** 0.5 días

**Tareas:**
- [ ] Instalar `helmet` para headers de seguridad
- [ ] Configurar CSP (Content Security Policy)
- [ ] Documentar configuración de HTTPS en producción

### Fase 6: Refactoring y Mejoras de Arquitectura (Baja Prioridad)

#### 6.1 Implementar Inyección de Dependencias Formal
**Estimación:** 2 días

**Tareas:**
- [ ] Instalar `tsyringe` o `inversify`
- [ ] Crear contenedor de IoC
- [ ] Refactorizar controllers para usar inyección
- [ ] Eliminar singletons globales

#### 6.2 Separar Configuración del Servidor
**Estimación:** 1 día

**Tareas:**
- [ ] Crear clase `ExpressServer`
- [ ] Extraer configuración de middlewares
- [ ] Extraer configuración de rutas
- [ ] Simplificar `index.ts`

### Fase 7: DevOps (Media Prioridad)

#### 7.1 Containerización
**Estimación:** 1 día

**Tareas:**
- [ ] Crear `Dockerfile` multi-stage
- [ ] Crear `docker-compose.yml`
- [ ] Crear `.dockerignore`
- [ ] Documentar comandos Docker en README

#### 7.2 CI/CD
**Estimación:** 1 día

**Tareas:**
- [ ] Crear workflow GitHub Actions para tests
- [ ] Crear workflow para build y deploy
- [ ] Configurar badges de CI en README

#### 7.3 Variables de Entorno
**Estimación:** 0.5 días

**Tareas:**
- [ ] Crear `.env.example` completo
- [ ] Documentar todas las variables requeridas
- [ ] Validar variables en startup

### Fase 8: Documentación (Baja Prioridad)

#### 8.1 Documentación de API
**Estimación:** 1 día

**Tareas:**
- [ ] Instalar Swagger/OpenAPI
- [ ] Documentar todos los endpoints
- [ ] Agregar ejemplos de request/response
- [ ] Exponer en `/api-docs`

#### 8.2 Completar ONE_SPEC.md
**Estimación:** 0.5 días

**Tareas:**
- [ ] Definir lenguaje de dominio
- [ ] Documentar eventos y estados
- [ ] Establecer criterios de aceptación

#### 8.3 Arquitectura
**Estimación:** 0.5 días

**Tareas:**
- [ ] Crear diagrama de arquitectura (C4 Model)
- [ ] Documentar flujo de datos
- [ ] Documentar decisiones arquitectónicas (ADRs)

---

## 🎯 Hoja de Ruta Sugerida (Roadmap)

### Sprint 1 (Semana 1-2): MVP Funcional
**Objetivo:** Sistema de autenticación completo y funcional

**Prioridad ALTA:**
- ✅ Implementar capa de aplicación (Use Cases)
- ✅ Implementar seguridad (bcrypt + JWT)
- ✅ Crear controladores y rutas HTTP
- ✅ Implementar validación de entrada
- ✅ Crear jerarquía de errores

**Entregable:** API REST funcional con 3 endpoints operativos

---

### Sprint 2 (Semana 3): Testing y Calidad
**Objetivo:** Garantizar calidad y confiabilidad del código

**Prioridad MEDIA:**
- ✅ Configurar Jest
- ✅ Implementar tests unitarios (>80% cobertura)
- ✅ Implementar tests de integración
- ✅ Implementar tests E2E

**Entregable:** Suite de tests completa con CI automatizado

---

### Sprint 3 (Semana 4): Seguridad y Observabilidad
**Objetivo:** Preparar para producción

**Prioridad ALTA (Seguridad):**
- ✅ Rate limiting
- ✅ Reforzar RLS en Supabase
- ✅ Helmet y headers de seguridad

**Prioridad MEDIA (Observabilidad):**
- ✅ Logging estructurado con winston
- ✅ Métricas con Prometheus

**Entregable:** Sistema seguro y monitoreable

---

### Sprint 4 (Semana 5-6): DevOps y Documentación
**Objetivo:** Automatización y documentación completa

**Prioridad MEDIA:**
- ✅ Containerización (Docker)
- ✅ CI/CD (GitHub Actions)
- ✅ Documentación de API (Swagger)
- ✅ Documentación de arquitectura

**Entregable:** Sistema deployable y documentado

---

### Sprint 5 (Futuro): Optimizaciones
**Objetivo:** Mejoras de rendimiento y arquitectura

**Prioridad BAJA:**
- 🔄 Inyección de dependencias formal
- 🔄 Refactoring de `index.ts`
- 🔄 Migraciones de base de datos
- 🔄 Optimizaciones de performance

---

## 📚 Recursos Útiles

### 📖 Documentación Oficial

| Recurso | URL | Uso |
|---------|-----|-----|
| **TypeScript** | [typescriptlang.org](https://www.typescriptlang.org/) | Tipado, features ES2022 |
| **Express.js** | [expressjs.com](https://expressjs.com/) | Framework web, middlewares |
| **Supabase** | [supabase.com/docs](https://supabase.com/docs) | Cliente JS, RLS, triggers |
| **PostgreSQL** | [postgresql.org/docs](https://www.postgresql.org/docs/) | SQL, triggers, índices |
| **JWT** | [jwt.io](https://jwt.io/) | Tokens, claims, mejores prácticas |
| **bcrypt** | [github.com/kelektiv/node.bcrypt.js](https://github.com/kelektiv/node.bcrypt.js) | Hashing de contraseñas |

### 🏗️ Arquitectura y Patrones

| Recurso | Descripción |
|---------|-------------|
| **Arquitectura Hexagonal** | [Netflix Blog](https://netflixtechblog.com/ready-for-changes-with-hexagonal-architecture-b315ec967749) |
| **Clean Architecture** | Libro de Robert C. Martin |
| **Domain-Driven Design** | Libro de Eric Evans |
| **Ports and Adapters** | [Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/) |
| **SOLID Principles** | [Wikipedia](https://en.wikipedia.org/wiki/SOLID) |

### 🔐 Seguridad

| Recurso | Descripción |
|---------|-------------|
| **OWASP Top 10** | [owasp.org/www-project-top-ten](https://owasp.org/www-project-top-ten/) |
| **JWT Best Practices** | [curity.io/resources/learn/jwt-best-practices](https://curity.io/resources/learn/jwt-best-practices/) |
| **bcrypt Salt Rounds** | [auth0.com/blog/hashing-in-action-understanding-bcrypt](https://auth0.com/blog/hashing-in-action-understanding-bcrypt/) |
| **Express Security** | [expressjs.com/en/advanced/best-practice-security.html](https://expressjs.com/en/advanced/best-practice-security.html) |

### 🧪 Testing

| Recurso | Descripción |
|---------|-------------|
| **Jest** | [jestjs.io](https://jestjs.io/) - Framework de testing |
| **Supertest** | [github.com/visionmedia/supertest](https://github.com/visionmedia/supertest) - Tests HTTP |
| **Testing Trophy** | [kentcdodds.com/blog/the-testing-trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) |

### 📊 Observabilidad

| Recurso | Descripción |
|---------|-------------|
| **Winston** | [github.com/winstonjs/winston](https://github.com/winstonjs/winston) - Logging estructurado |
| **Prometheus** | [prometheus.io](https://prometheus.io/) - Sistema de métricas |
| **Grafana** | [grafana.com](https://grafana.com/) - Visualización de métricas |

### 🐳 DevOps

| Recurso | Descripción |
|---------|-------------|
| **Docker** | [docs.docker.com](https://docs.docker.com/) - Containerización |
| **Docker Compose** | [docs.docker.com/compose](https://docs.docker.com/compose/) - Orquestación local |
| **GitHub Actions** | [docs.github.com/actions](https://docs.github.com/en/actions) - CI/CD |

### 📝 Herramientas de Desarrollo

| Herramienta | Descripción | Instalación |
|-------------|-------------|-------------|
| **ESLint** | Linter para TypeScript | `npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin` |
| **Prettier** | Formateador de código | `npm install --save-dev prettier` |
| **Husky** | Git hooks | `npm install --save-dev husky` |
| **Commitlint** | Validación de commits | `npm install --save-dev @commitlint/cli @commitlint/config-conventional` |
| **Nodemon** | Auto-reload en desarrollo | Ya instalado (`ts-node-dev`) |

### 📐 Convenciones de Código Sugeridas

#### Commits (Conventional Commits)
```
feat: agregar endpoint de login
fix: corregir validación de email
docs: actualizar README con ejemplos
test: agregar tests unitarios para UserMapper
refactor: extraer lógica de JWT a utilidad
chore: actualizar dependencias
```

#### Nombres de Archivos
- **PascalCase:** Clases, interfaces (`UserMapper.ts`, `AuthController.ts`)
- **camelCase:** Funciones, variables (`hashPassword.ts`, `createUser.ts`)
- **kebab-case:** Archivos de configuración (`jest.config.js`, `docker-compose.yml`)

#### Estructura de Imports
```typescript
// 1. Node modules
import express from 'express';
import bcrypt from 'bcrypt';

// 2. Domain
import { User } from '../domain/entity/User';
import { UserRepositoryPort } from '../domain/port/portout/UserRepositoryPort';

// 3. Application
import { CreateUserPasswordUseCase } from '../application/usecase/CreateUserPasswordUseCase';

// 4. Infrastructure
import { supabase } from './config/supabase';

// 5. Relativos
import { UserMapper } from './mapper/UserMapper';
```

---

## 🏆 Conclusión

### Estado Actual: **Fase 1 Completada** ✅

El proyecto **Loggin-MCP** presenta una **arquitectura sólida y bien diseñada** siguiendo principios de **Clean Architecture** y **arquitectura hexagonal**. La separación de responsabilidades es clara, y los fundamentos están correctamente implementados.

### Fortalezas Principal:
✅ **Arquitectura hexagonal correctamente implementada**  
✅ **TypeScript con configuración estricta**  
✅ **Separación clara de capas (Domain, Application, Infrastructure)**  
✅ **Inversión de dependencias correcta**  
✅ **Base de datos bien diseñada**  
✅ **Documentación y plan de desarrollo detallado**

### Limitaciones Actuales:
⚠️ **Capa de aplicación vacía** (no hay casos de uso)  
⚠️ **Sin controladores HTTP** (solo health check)  
⚠️ **Seguridad incompleta** (falta bcrypt y JWT)  
⚠️ **Sin tests formales** (solo script manual)  
⚠️ **Sin validación de entrada**

### Recomendación General:

El proyecto está en **excelente posición para avanzar**. La arquitectura es escalable y mantenible. Los siguientes pasos críticos son:

1. **Sprint 1 (Prioridad MÁXIMA):** Completar funcionalidades core (Use Cases, JWT, Controllers)
2. **Sprint 2:** Implementar testing comprehensivo
3. **Sprint 3:** Reforzar seguridad y agregar observabilidad
4. **Sprint 4:** Automatizar con CI/CD y containerizar

Con el plan propuesto, el proyecto puede estar **production-ready en 4-6 semanas**.

---

**Generado por:** Análisis Automático de Código  
**Herramientas utilizadas:** Análisis estático, revisión de arquitectura, evaluación de mejores prácticas  
**Fecha:** 5 de marzo de 2026
