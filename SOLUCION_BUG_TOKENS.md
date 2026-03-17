# 🐛 Análisis y Solución del Bug de Validación de Tokens

**Fecha:** 17 de Marzo, 2026  
**Proyecto:** Loggin-MCP  
**Severidad:** 🔴 CRÍTICA  
**Estado:** Propuesta de Solución

---

## 📋 Tabla de Contenidos

1. [Descripción del Problema](#1-descripción-del-problema)
2. [Análisis del Flujo Actual](#2-análisis-del-flujo-actual)
3. [Problemas Identificados](#3-problemas-identificados)
4. [Impacto en la Experiencia del Usuario](#4-impacto-en-la-experiencia-del-usuario)
5. [Solución Propuesta](#5-solución-propuesta)
6. [Implementación Técnica](#6-implementación-técnica)
7. [Cambios Necesarios](#7-cambios-necesarios)
8. [Testing y Validación](#8-testing-y-validación)

---

## 1. Descripción del Problema

### 🔴 **Problema Principal**

Cuando un usuario hace clic en el enlace del correo para crear/restablecer contraseña:

1. ✅ La redirección al frontend funciona correctamente
2. ❌ El frontend muestra el formulario SIN verificar primero si el token es válido
3. ❌ El usuario completa el formulario con su nueva contraseña
4. ❌ Al enviar, recibe error: "Token inválido o expirado"
5. ❌ Mala experiencia: usuario perdió tiempo llenando el formulario

### 🔍 **Síntomas Reportados**

- "Valida el token y dice que es inválido o expiró"
- "¿Cómo sabe el front que ese token sí es válido?"
- "¿Cómo se marca en Supabase que ya se usó?"
- "Cuando me envía para restablecer contraseña va sin nada, no lleva un token ni nada"

---

## 2. Análisis del Flujo Actual

### 📧 **Flujo de Registro de Usuario**

```
┌─────────────┐
│   Usuario   │
│ hace signup │
└──────┬──────┘
       │
       ▼
┌────────────────────────────────────────┐
│ POST /auth/register-email              │
│ Body: { email: "user@example.com" }    │
└──────┬─────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────┐
│ Backend (RegisterEmailUseCase)         │
│ 1. Crea usuario en DB                  │
│ 2. Genera JWT token:                   │
│    {                                   │
│      userId: "uuid",                   │
│      email: "user@example.com",        │
│      type: "password_creation",        │
│      jti: "uuid",                      │
│      exp: now + 24h                    │
│    }                                   │
│ 3. Inserta en password_tokens:         │
│    - user_id, token, type,             │
│      expires_at, used=false            │
│ 4. Envía email con enlace:             │
│    https://front.app/create-password   │
│    ?token=eyJhbGci...                  │
└──────┬─────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────┐
│ 📧 Usuario recibe email y hace click  │
└──────┬─────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────┐
│ Frontend: /create-password?token=...   │
│ ❌ PROBLEMA: Muestra formulario SIN    │
│    validar el token primero            │
└──────┬─────────────────────────────────┘
       │
       │ Usuario llena formulario
       │
       ▼
┌────────────────────────────────────────┐
│ POST /auth/create-password             │
│ Body: {                                │
│   token: "eyJhbGci...",                │
│   password: "NewPass123!"              │
│ }                                      │
└──────┬─────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────┐
│ Backend (CreatePasswordUseCase)        │
│ 1. validateToken(token, 'password_     │
│    creation')                          │
│    - Busca en password_tokens          │
│    - Verifica: used=false?             │
│    - Verifica: expires_at > now?       │
│    - Verifica: type correcto?          │
│                                        │
│ ❌ AQUÍ ES DONDE FALLA:                │
│    Si token expiró/usado → ERROR       │
└──────┬─────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────┐
│ Response 400/500:                      │
│ "Token invalid or expired"             │
└────────────────────────────────────────┘
```

### 🔑 **Flujo de Recuperación de Contraseña**

```
┌─────────────┐
│   Usuario   │
│ olvidó pwd  │
└──────┬──────┘
       │
       ▼
┌────────────────────────────────────────┐
│ POST /auth/forgot-password             │
│ Body: { email: "user@example.com" }    │
└──────┬─────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────┐
│ Backend (ForgotPasswordUseCase)        │
│ 1. Busca usuario por email             │
│ 2. Genera JWT token:                   │
│    {                                   │
│      userId: "uuid",                   │
│      email: "user@example.com",        │
│      type: "password_reset",           │
│      jti: "uuid",                      │
│      exp: now + 15min                  │
│    }                                   │
│ 3. Inserta en password_tokens          │
│ 4. Envía email con enlace:             │
│    https://front.app/reset-password    │
│    ?token=eyJhbGci...                  │
└──────┬─────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────┐
│ 📧 Usuario recibe email y hace click  │
└──────┬─────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────┐
│ Frontend: /reset-password?token=...    │
│ ❌ PROBLEMA: Muestra formulario SIN    │
│    validar el token primero            │
└──────┬─────────────────────────────────┘
       │
       │ Usuario llena formulario
       │
       ▼
┌────────────────────────────────────────┐
│ POST /auth/reset-password              │
│ Body: {                                │
│   token: "eyJhbGci...",                │
│   newPassword: "NewPass123!"           │
│ }                                      │
└──────┬─────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────┐
│ Backend (ResetPasswordUseCase)         │
│ 1. validateToken(token, 'password_     │
│    reset')                             │
│    - Busca en password_tokens          │
│    - Verifica: used=false?             │
│    - Verifica: expires_at > now?       │
│    - Verifica: type correcto?          │
│                                        │
│ ❌ AQUÍ ES DONDE FALLA:                │
│    Si token expiró/usado → ERROR       │
└────────────────────────────────────────┘
```

---

## 3. Problemas Identificados

### ❌ **Problema 1: No hay validación previa del token**

**Ubicación:** Frontend  
**Descripción:** El frontend no valida el token ANTES de mostrar el formulario.

```typescript
// ❌ FLUJO ACTUAL (INCORRECTO)
// Página: /create-password?token=xyz

function CreatePasswordPage() {
  const token = useSearchParams().get('token');
  
  // ❌ No valida el token aquí
  // Simplemente muestra el formulario
  
  return <PasswordForm token={token} />;
}
```

**Consecuencia:** Usuario llena formulario con token ya expirado/usado.

---

### ❌ **Problema 2: No existe endpoint de validación previa**

**Ubicación:** Backend  
**Descripción:** No hay un endpoint GET para validar tokens sin consumirlos.

```typescript
// ❌ NO EXISTE ESTE ENDPOINT
// GET /auth/validate-token?token=xyz&type=password_creation
```

**Rutas actuales:**

```typescript
// src/infrastructure/routes/auth.routes.ts
router.post('/check-email', ...);
router.post('/create-password', ...);  // ✅ Existe
router.post('/login', ...);
router.post('/register-email', ...);
router.post('/forgot-password', ...);
router.post('/reset-password', ...);   // ✅ Existe
router.post('/logout', ...);
// ❌ FALTA: GET /validate-token
```

---

### ❌ **Problema 3: Validación y consumo van juntos**

**Ubicación:** `CreatePasswordUseCase.ts`, `ResetPasswordUseCase.ts`  
**Descripción:** La validación del token solo ocurre al intentar usarlo.

```typescript
// CreatePasswordUseCase.execute()
const validation = await this.passwordTokenRepository.validateToken(
  input.token, 
  'password_creation'
);

if (!validation.valid) {
  // ❌ Usuario ya llenó el formulario cuando llega aquí
  throw new TokenNotFoundError();
}
```

---

### ❌ **Problema 4: Mensajes de error poco informativos**

**Ubicación:** `SupabasePasswordTokenRepositoryAdapter.ts`

```typescript
async validateToken(token: string, type: string): Promise<TokenValidationResult> {
  const { data, error } = await supabase
    .from('password_tokens')
    .select('*')
    .eq('token', token)
    .limit(1)
    .single();

  if (error) {
    // ❌ Cualquier error de DB retorna genérico
    return { valid: false, message: `DB error: ${error.message}` };
  }

  if (!data) return { valid: false, message: 'Token not found' };
  
  // ❌ No distingue entre "no existe" y "ya expiró hace 1 mes"
  
  if (data.used) return { valid: false, message: 'Token already used' };
  if (expiresAt < now) return { valid: false, message: 'Token expired' };
  
  // ❌ No dice CUÁNDO expiró, ni CUÁNDO se usó
}
```

---

### ❌ **Problema 5: Frontend no puede decodificar el token de forma segura**

**Descripción:** Aunque el JWT contiene la información (userId, email, type), el frontend no puede verificar que sea legítimo sin consultar al backend.

```typescript
// ❌ INSEGURO - El frontend podría decodificar (sin verificar firma)
const payload = jwt_decode(token); // Librería jwt-decode
// Pero no puede verificar:
// - ¿Fue firmado por el backend real?
// - ¿Ya se usó este token?
// - ¿Está en la base de datos?
```

---

## 4. Impacto en la Experiencia del Usuario

### 😡 **Frustración del Usuario**

1. Usuario recibe email
2. Hace clic en el enlace
3. Ve formulario de "Crear Contraseña"
4. Crea contraseña compleja (MyP@ssw0rd2026!)
5. La confirma (MyP@ssw0rd2026!)
6. Click en "Crear Contraseña"
7. ❌ **Error: "Token inválido o expirado"**
8. 😡 Usuario abandona el flujo o contacta soporte

### 📊 **Métricas Afectadas**

- ❌ Tasa de conversión de registro ⬇️
- ❌ Tiempo de recuperación de contraseña ⬆️
- ❌ Tickets de soporte ⬆️
- ❌ Satisfacción del usuario ⬇️

---

## 5. Solución Propuesta

### ✅ **Solución Integral**

Implementar un sistema de validación en dos fases:

1. **FASE 1 (Frontend):** Validar token ANTES de mostrar formulario
2. **FASE 2 (Backend):** Crear endpoint de validación sin consumir token

### 🎯 **Flujo Mejorado**

```
┌─────────────┐
│   Usuario   │
│ click email │
└──────┬──────┘
       │
       ▼
┌────────────────────────────────────────┐
│ Frontend: /create-password?token=...   │
│ 1. Extrae token de URL                 │
│ 2. ✅ Muestra: "Validando token..."    │
└──────┬─────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────┐
│ GET /auth/validate-token?token=...     │
│     &type=password_creation            │
└──────┬─────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────┐
│ Backend: Valida token SIN consumirlo   │
│ - Busca en password_tokens             │
│ - Verifica estado                      │
│ - NO marca como usado                  │
│ - Retorna estado detallado             │
└──────┬─────────────────────────────────┘
       │
       ├────────────┬────────────┬─────────────┐
       │            │            │             │
       ▼            ▼            ▼             ▼
  ✅ VÁLIDO    ❌ EXPIRADO  ❌ USADO    ❌ INVÁLIDO
       │            │            │             │
       ▼            ▼            ▼             ▼
  Mostrar      Mostrar       Mostrar      Mostrar
  formulario   mensaje:      mensaje:     mensaje:
               "Token        "Token ya    "Token
               expiró.       se usó.      inválido.
               Solicitar     Solicitar    Contactar
               nuevo"        nuevo"       soporte"
```

---

## 6. Implementación Técnica

### 🔧 **Backend: Nuevo Endpoint de Validación**

#### **6.1. Crear nuevo caso de uso**

**Archivo:** `src/application/usecase/ValidatePasswordTokenUseCase.ts`

```typescript
import { PasswordTokenRepositoryPort, TokenValidationResult } from '../../domain/port/portout/PasswordTokenRepositoryPort';

export interface ValidatePasswordTokenInputDTO {
  token: string;
  type: 'password_creation' | 'password_reset';
}

export interface ValidatePasswordTokenResultDTO {
  valid: boolean;
  status: 'valid' | 'expired' | 'used' | 'not_found' | 'invalid_type' | 'error';
  message: string;
  email?: string;
  userId?: string;
  expiresAt?: string;
  usedAt?: string;
}

export class ValidatePasswordTokenUseCase {
  constructor(
    private readonly passwordTokenRepository: PasswordTokenRepositoryPort
  ) {}

  async execute(dto: ValidatePasswordTokenInputDTO): Promise<ValidatePasswordTokenResultDTO> {
    try {
      const validation = await this.passwordTokenRepository.validateToken(dto.token, dto.type);

      if (validation.valid) {
        return {
          valid: true,
          status: 'valid',
          message: 'Token is valid and ready to be used',
          email: validation.email,
          userId: validation.userId
        };
      }

      // Analizar el mensaje de error para determinar el estado
      const msg = validation.message || '';
      
      if (msg.includes('already used')) {
        return {
          valid: false,
          status: 'used',
          message: 'This token has already been used. Please request a new one.'
        };
      }
      
      if (msg.includes('expired')) {
        return {
          valid: false,
          status: 'expired',
          message: 'This token has expired. Please request a new one.'
        };
      }
      
      if (msg.includes('not found')) {
        return {
          valid: false,
          status: 'not_found',
          message: 'Token not found. It may have been deleted or never existed.'
        };
      }
      
      if (msg.includes('Invalid token type')) {
        return {
          valid: false,
          status: 'invalid_type',
          message: 'This token cannot be used for this operation.'
        };
      }

      return {
        valid: false,
        status: 'error',
        message: validation.message || 'Token validation failed'
      };
      
    } catch (error) {
      return {
        valid: false,
        status: 'error',
        message: 'An error occurred while validating the token'
      };
    }
  }
}

export default ValidatePasswordTokenUseCase;
```

---

#### **6.2. Agregar método al controlador**

**Archivo:** `src/infrastructure/controller/AuthController.ts`

```typescript
import { ValidatePasswordTokenUseCase } from '../../application/usecase/ValidatePasswordTokenUseCase';

export class AuthController {
  constructor(
    private readonly checkEmailExistsUseCase: CheckEmailExistsUseCasePort,
    private readonly createPasswordUseCase: CreatePasswordUseCasePort,
    private readonly loginUseCase: LoginUseCasePort,
    private readonly registerEmailUseCase?: RegisterEmailUseCase,
    private readonly forgotPasswordUseCase?: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase?: ResetPasswordUseCase,
    private readonly revokedTokenRepository?: RevokedTokenRepositoryPort,
    private readonly validatePasswordTokenUseCase?: ValidatePasswordTokenUseCase // ✅ NUEVO
  ) {}

  // ... métodos existentes ...

  // ✅ NUEVO MÉTODO
  async validatePasswordToken(req: Request, res: Response): Promise<void> {
    try {
      if (!this.validatePasswordTokenUseCase) {
        res.status(500).json({
          status: 'error',
          message: 'ValidatePasswordTokenUseCase not configured',
          code: 'INTERNAL_ERROR'
        });
        return;
      }

      const { token, type } = req.query;

      if (!token || typeof token !== 'string') {
        res.status(400).json({
          status: 'error',
          message: 'Missing or invalid required parameter: token',
          code: 'MISSING_PARAMETER'
        });
        return;
      }

      if (!type || (type !== 'password_creation' && type !== 'password_reset')) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid or missing parameter: type. Must be "password_creation" or "password_reset"',
          code: 'INVALID_PARAMETER'
        });
        return;
      }

      const result = await this.validatePasswordTokenUseCase.execute({ 
        token, 
        type: type as 'password_creation' | 'password_reset'
      });

      res.status(200).json({
        status: 'success',
        data: result
      });

    } catch (error) {
      console.error('validatePasswordToken error', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}
```

---

#### **6.3. Registrar ruta**

**Archivo:** `src/infrastructure/routes/auth.routes.ts`

```typescript
import { ValidatePasswordTokenUseCase } from '../../application/usecase/ValidatePasswordTokenUseCase';

// ... código existente ...

const validatePasswordTokenUseCase = new ValidatePasswordTokenUseCase(passwordTokenRepository);

const authController = new AuthController(
  checkEmailUseCase,
  createPasswordUseCase,
  loginUseCase,
  registerEmailUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase,
  revokedTokenRepository,
  validatePasswordTokenUseCase // ✅ NUEVO
);

// ✅ NUEVA RUTA
router.get('/validate-token', (req, res) => authController.validatePasswordToken(req, res));

// Rutas existentes...
router.post('/check-email', (req, res) => authController.checkEmail(req, res));
router.post('/create-password', (req, res) => authController.createPassword(req, res));
// ... etc ...
```

---

#### **6.4. Mejorar validación del repositorio (opcional)**

**Archivo:** `src/infrastructure/repository/adapter/SupabasePasswordTokenRepositoryAdapter.ts`

```typescript
async validateToken(token: string, type: string): Promise<TokenValidationResult> {
  const { data, error } = await supabase
    .from('password_tokens')
    .select('*')
    .eq('token', token)
    .limit(1)
    .single();

  if (error) {
    // Diferenciar error de "no encontrado" vs error de BD
    if (error.code === 'PGRST116') {
      return { valid: false, message: 'Token not found' };
    }
    return { valid: false, message: `DB error: ${error.message}` };
  }

  if (!data) return { valid: false, message: 'Token not found' };

  const now = new Date();
  const expiresAt = new Date(data.expires_at);

  if (data.used) {
    // ✅ Información más detallada
    const usedAtStr = data.used_at ? new Date(data.used_at).toISOString() : 'unknown';
    return { 
      valid: false, 
      message: `Token already used on ${usedAtStr}` 
    };
  }
  
  if (expiresAt < now) {
    // ✅ Información más detallada
    const expiredAtStr = expiresAt.toISOString();
    return { 
      valid: false, 
      message: `Token expired on ${expiredAtStr}` 
    };
  }
  
  if (data.type !== type) {
    return { 
      valid: false, 
      message: `Invalid token type. Expected: ${type}, Got: ${data.type}` 
    };
  }

  return { 
    valid: true, 
    userId: data.user_id, 
    email: data.email 
  };
}
```

---

### 🎨 **Frontend: Implementación de Validación**

#### **6.5. Página de Crear Contraseña**

**Archivo:** `src/pages/CreatePasswordPage.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

type TokenStatus = 'validating' | 'valid' | 'expired' | 'used' | 'not_found' | 'invalid' | 'error';

export function CreatePasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<TokenStatus>('validating');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setStatus('invalid');
        setMessage('No token provided in URL');
        return;
      }

      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/validate-token`, {
          params: {
            token,
            type: 'password_creation'
          }
        });

        const result = response.data.data;

        if (result.valid) {
          setStatus('valid');
          setEmail(result.email || '');
        } else {
          setStatus(result.status);
          setMessage(result.message);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setStatus('error');
        setMessage('Failed to validate token. Please try again.');
      }
    };

    validateToken();
  }, [token]);

  // Estado: Validando
  if (status === 'validating') {
    return (
      <div className="container">
        <div className="spinner">Validating token...</div>
      </div>
    );
  }

  // Estado: Token válido - Mostrar formulario
  if (status === 'valid') {
    return (
      <div className="container">
        <h1>Create Your Password</h1>
        <p>Email: {email}</p>
        <CreatePasswordForm token={token!} email={email} />
      </div>
    );
  }

  // Estado: Token expirado
  if (status === 'expired') {
    return (
      <div className="container error">
        <h1>⏰ Token Expired</h1>
        <p>{message}</p>
        <p>The link you used has expired. Please request a new one.</p>
        <button onClick={() => navigate('/request-new-link')}>
          Request New Link
        </button>
      </div>
    );
  }

  // Estado: Token ya usado
  if (status === 'used') {
    return (
      <div className="container error">
        <h1>✅ Token Already Used</h1>
        <p>{message}</p>
        <p>This link has already been used to create a password. Try logging in.</p>
        <button onClick={() => navigate('/login')}>
          Go to Login
        </button>
      </div>
    );
  }

  // Estado: Token no encontrado o inválido
  return (
    <div className="container error">
      <h1>❌ Invalid Token</h1>
      <p>{message}</p>
      <p>Please contact support or request a new link.</p>
      <button onClick={() => navigate('/support')}>
        Contact Support
      </button>
    </div>
  );
}
```

---

#### **6.6. Página de Restablecer Contraseña (similar)**

**Archivo:** `src/pages/ResetPasswordPage.tsx`

```typescript
// Mismo patrón que CreatePasswordPage, pero:
// - type: 'password_reset'
// - Títulos y mensajes adaptados
```

---

## 7. Cambios Necesarios

### ✅ **Checklist de Implementación**

#### **Backend**

- [ ] Crear `ValidatePasswordTokenUseCase.ts`
- [ ] Agregar método `validatePasswordToken()` en `AuthController.ts`
- [ ] Actualizar constructor de `AuthController` para recibir el nuevo caso de uso
- [ ] Registrar ruta `GET /auth/validate-token` en `auth.routes.ts`
- [ ] Instanciar `ValidatePasswordTokenUseCase` en `auth.routes.ts`
- [ ] (Opcional) Mejorar mensajes de error en `SupabasePasswordTokenRepositoryAdapter`
- [ ] Testing del nuevo endpoint

#### **Frontend**

- [ ] Crear lógica de validación en `CreatePasswordPage.tsx`
- [ ] Crear lógica de validación en `ResetPasswordPage.tsx`
- [ ] Agregar estados de UI: validating, valid, expired, used, invalid
- [ ] Agregar manejo de errores y mensajes informativos
- [ ] Testing de flujos completos

#### **Base de Datos**

- [ ] Verificar que las políticas RLS permiten SELECT en `password_tokens`
- [ ] (Opcional) Agregar índice en `(token, type)` para optimizar consultas

---

## 8. Testing y Validación

### 🧪 **Casos de Prueba**

#### **Test 1: Token válido**

```bash
# 1. Registrar usuario
POST /auth/register-email
Body: { "email": "test@example.com" }

# 2. Obtener token del email (de logs o DB)
SELECT token FROM password_tokens 
WHERE user_id = '...' AND type = 'password_creation'
ORDER BY created_at DESC LIMIT 1;

# 3. Validar token
GET /auth/validate-token?token=eyJhbGci...&type=password_creation

# Esperado: 200 OK
{
  "status": "success",
  "data": {
    "valid": true,
    "status": "valid",
    "message": "Token is valid and ready to be used",
    "email": "test@example.com",
    "userId": "uuid..."
  }
}
```

---

#### **Test 2: Token expirado**

```bash
# 1. Crear token que expire en 1 segundo
# (Modificar temporalmente expiresIn en generatePasswordCreationToken)

# 2. Esperar 2 segundos

# 3. Validar token
GET /auth/validate-token?token=...&type=password_creation

# Esperado: 200 OK (pero token inválido)
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "expired",
    "message": "This token has expired. Please request a new one."
  }
}
```

---

#### **Test 3: Token ya usado**

```bash
# 1. Crear token y usarlo para crear contraseña
POST /auth/create-password
Body: { "token": "...", "password": "Test123!" }

# 2. Intentar validar el mismo token
GET /auth/validate-token?token=...&type=password_creation

# Esperado: 200 OK (pero token usado)
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "used",
    "message": "This token has already been used. Please request a new one."
  }
}
```

---

#### **Test 4: Token inválido**

```bash
GET /auth/validate-token?token=invalid-token&type=password_creation

# Esperado: 200 OK
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "not_found",
    "message": "Token not found. It may have been deleted or never existed."
  }
}
```

---

#### **Test 5: Tipo incorrecto**

```bash
# Token es de tipo 'password_creation' pero se valida como 'password_reset'
GET /auth/validate-token?token=...&type=password_reset

# Esperado: 200 OK
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "invalid_type",
    "message": "This token cannot be used for this operation."
  }
}
```

---

### 📊 **Pruebas de Integración**

```bash
# Flujo completo de registro
1. POST /auth/register-email → Obtener token del email
2. GET /auth/validate-token → Verificar que es válido
3. POST /auth/create-password → Crear contraseña
4. GET /auth/validate-token → Verificar que ahora está usado
5. POST /auth/login → Login exitoso

# Flujo completo de recuperación
1. POST /auth/forgot-password → Obtener token del email
2. GET /auth/validate-token → Verificar que es válido
3. POST /auth/reset-password → Cambiar contraseña
4. GET /auth/validate-token → Verificar que ahora está usado
5. POST /auth/login → Login exitoso con nueva contraseña
```

---

## 🎯 Resumen Ejecutivo

### **Problema**
Los usuarios reciben errores al crear/restablecer contraseña DESPUÉS de llenar el formulario, porque el token ya expiró o fue usado.

### **Causa Raíz**
No existe validación previa del token antes de mostrar el formulario.

### **Solución**
1. Crear endpoint `GET /auth/validate-token`
2. Frontend valida token ANTES de mostrar formulario
3. Mostrar mensajes informativos según estado del token

### **Beneficios**
- ✅ Mejor experiencia de usuario
- ✅ Menos frustración y abandono
- ✅ Menos tickets de soporte
- ✅ Mensajes de error claros y accionables
- ✅ Información temprana del estado del token

### **Esfuerzo de Implementación**
- **Backend:** ~2-3 horas
- **Frontend:** ~2-3 horas
- **Testing:** ~2 horas
- **Total:** ~6-8 horas

---

## 📌 Próximos Pasos

1. ✅ Revisar y aprobar este documento
2. ✅ Crear branch: `feature/token-validation`
3. ✅ Implementar cambios en backend
4. ✅ Implementar cambios en frontend
5. ✅ Testing completo
6. ✅ Code review
7. ✅ Deploy a staging
8. ✅ QA en staging
9. ✅ Deploy a producción
10. ✅ Monitorear métricas

---

**Documento creado por:** GitHub Copilot  
**Fecha:** 17 de Marzo, 2026  
**Versión:** 1.0
