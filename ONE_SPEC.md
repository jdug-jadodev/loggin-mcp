# One Spec (Root Spec) - Fase 1: Middleware de Autenticación JWT

**Versión:** 1.0  
**Fecha:** 8 de Marzo de 2026  
**Fase:** FASE 1 - Middleware de Autenticación JWT (Protección de Rutas)  
**Responsable:** Equipo de Desarrollo

---

## Objetivo

Implementar un sistema robusto de autenticación basado en JWT para proteger las rutas de la API que requieren autorización, garantizando que solo usuarios autenticados con tokens válidos puedan acceder a endpoints protegidos.

### Objetivos Específicos:
1. **Validación de Tokens JWT:** Verificar la autenticidad, integridad y vigencia de tokens en cada request protegido
2. **Extensión de Request:** Enriquecer el objeto Request de Express con información del usuario autenticado
3. **Manejo de Errores:** Proporcionar respuestas claras y específicas para diferentes escenarios de fallo
4. **Seguridad:** Implementar validaciones estrictas siguiendo mejores prácticas de seguridad JWT

---

## Alcance / No alcance

### ✅ Dentro del Alcance (Fase 1)

#### 1. Middleware de Autenticación JWT
- Extracción de token desde header `Authorization: Bearer <token>`
- Validación de firma JWT usando `JWT_SECRET`
- Verificación de expiración de tokens
- Inyección de datos del usuario (`userId`, `email`) en el objeto Request
- Manejo de errores con códigos HTTP apropiados (401)

#### 2. Sistema de Excepciones
- Clase `UnauthorizedError`: Token ausente o sesión no iniciada
- Clase `TokenExpiredError`: Token expirado temporalmente
- Clase `InvalidTokenError`: Token con firma inválida o formato corrupto
- Todas extienden de `AuthError` existente

#### 3. Soporte de TypeScript
- Archivo de definición de tipos `express.d.ts`
- Extensión de interfaz `Request` con propiedades `userId`, `email`, `userRole?`
- Type-safety en todo el middleware

#### 4. Documentación
- Comentarios JSDoc en funciones y clases
- Mensajes de error descriptivos y accionables

### ❌ Fuera del Alcance (Otras Fases)

- **Sistema de Roles y Autorización (Fase 2):** Middleware de admin, validación de permisos
- **Generación de Tokens:** Ya implementado en `src/utils/jwt.ts`
- **Refresh Tokens:** Sistema de renovación automática de tokens
- **Rate Limiting:** Control de tasa de requests por IP
- **2FA/MFA:** Autenticación de dos factores
- **OAuth/SSO:** Integración con proveedores externos
- **Blacklist de Tokens:** Invalidación manual de tokens antes de expiración
- **Tests Unitarios:** Opcional en esta fase, documentados pero no obligatorios

---

## Definiciones (lenguaje de dominio)

### Términos del Dominio de Autenticación

#### **JWT (JSON Web Token)**
Token criptográfico compuesto de tres partes (header.payload.signature) que contiene información del usuario autenticado. En este sistema:
- **Payload:** `{ userId, email, iat, exp }`
- **Expiración:** 15 horas (definido en `jwt.ts`)
- **Algoritmo:** HS256 (HMAC-SHA256)

#### **Middleware**
Función de Express que se ejecuta entre el request y el controlador, permitiendo validar, transformar o rechazar requests antes de llegar a la lógica de negocio.

#### **Request Extendido**
Objeto Request de Express enriquecido con propiedades adicionales:
- `req.userId`: UUID del usuario autenticado
- `req.email`: Email del usuario autenticado
- `req.userRole`: Rol del usuario (para Fase 2)

#### **Bearer Token**
Esquema de autenticación HTTP donde el token se envía en el header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Token Expiration (exp)**
Claim estándar JWT que indica el timestamp Unix después del cual el token no debe ser aceptado.

#### **Token Verification**
Proceso de validación que verifica:
1. Firma criptográfica (integridad)
2. Estructura válida (formato)
3. No expiración (vigencia)
4. Claims requeridos presentes

### Entidades del Sistema

#### **AuthError**
Clase base para errores de autenticación/autorización que incluye:
- `message`: Descripción del error
- `timestamp`: ISO string de cuándo ocurrió
- `context`: Metadata adicional opcional

#### **UnauthorizedError**
Error 401 cuando el usuario no ha proporcionado credenciales válidas.

#### **TokenExpiredError**
Error 401 cuando el token proporcionado ha caducado.

#### **InvalidTokenError**
Error 401 cuando el token tiene firma inválida o está corrupto.

---

## Principios / Reglas no negociables

### 1. Seguridad First

#### 1.1 Validación de JWT_SECRET
- **REGLA CRÍTICA:** El `JWT_SECRET` DEBE tener mínimo 64 caracteres en producción
- **NUNCA** usar valores por defecto o secrets débiles
- **SIEMPRE** verificar que `JWT_SECRET` existe antes de validar tokens
- **RECHAZAR** requests si el secret no está configurado

#### 1.2 Validación Estricta de Tokens
- **NUNCA** aceptar tokens sin firma
- **SIEMPRE** verificar expiración antes de procesar
- **RECHAZAR** tokens con estructura inválida inmediatamente
- **NO** incluir el token completo en logs (solo primeros 10 caracteres)

#### 1.3 Headers de Seguridad
- **OBLIGATORIO:** Aceptar SOLO header `Authorization` con esquema `Bearer`
- **RECHAZAR:** Tokens en query params, cookies o body (antipatrón)
- **CASE-SENSITIVE:** El header debe ser exactamente "Bearer" (no "bearer")

### 2. Clean Architecture

#### 2.1 Separación de Responsabilidades
- **Middleware:** Solo validación y extracción de datos
- **Excepciones:** Solo representación de errores
- **Utils (jwt.ts):** Solo operaciones criptográficas
- **NO** mezclar lógica de negocio en el middleware

#### 2.2 Estructura de Archivos
```
src/
├── types/
│   └── express.d.ts          # Extensiones de tipos
├── infrastructure/
│   └── middleware/
│       └── auth.middleware.ts # Middleware de autenticación
├── application/
│   └── exception/
│       ├── UnauthorizedError.ts
│       ├── TokenExpiredError.ts
│       └── InvalidTokenError.ts
└── utils/
    └── jwt.ts                 # Ya existe, no modificar
```

#### 2.3 Dependencias
- **Middleware depende de:** `utils/jwt.ts` (verifyToken)
- **Excepciones dependen de:** `AuthError` (clase base)
- **Controladores dependen de:** Middleware (protección de rutas)

### 3. Manejo de Errores

#### 3.1 Códigos HTTP Estandarizados
- **401 Unauthorized:** Token ausente, inválido o expirado
- **403 Forbidden:** Token válido pero permisos insuficientes (Fase 2)
- **500 Internal Server Error:** Errores inesperados del sistema

#### 3.2 Estructura de Respuestas de Error
```json
{
  "status": "error",
  "message": "Descripción legible del error",
  "code": "CODIGO_ERROR_ESPECIFICO",
  "timestamp": "2026-03-08T10:30:00.000Z"
}
```

#### 3.3 Mensajes de Error
- **NUNCA** revelar información sensible (JWT_SECRET, stack traces)
- **SIEMPRE** proporcionar mensajes accionables
- **INCLUIR** timestamp para debugging
- **USAR** códigos de error únicos y consistentes

### 4. TypeScript Strict

#### 4.1 Type Safety
- **NO** usar `any` sin justificación documentada
- **SIEMPRE** definir tipos explícitos para parámetros y retornos
- **EXTENDER** interfaces existentes, no redefinir
- **MODULE AUGMENTATION:** Usar para extender Express tipos

#### 4.2 Null Safety
- **VERIFICAR** valores undefined/null antes de usar
- **USAR** optional chaining (`?.`) donde sea apropiado
- **RETORNAR** errores explícitos en lugar de throw genéricos

### 5. Consistencia con el Sistema Actual

#### 5.1 Patrón de Excepciones
- **TODAS** las excepciones de auth DEBEN extender `AuthError`
- **MANTENER** estructura: `name`, `message`, `timestamp`, `context`
- **USAR** constructor apropiado con parámetros opcionales

#### 5.2 Patrón de Verificación
- **USAR** la función existente `verifyToken()` de `utils/jwt.ts`
- **NO** reimplementar lógica de verificación JWT
- **CONFIAR** en las validaciones ya implementadas

---

## Límites

### Límites Técnicos

#### 1. Expiración de Tokens
- **Límite Temporal:** 15 horas (configurado en `jwt.ts`)
- **No Renovable:** Tokens expirados DEBEN requerir nuevo login
- **Zona Horaria:** UTC para timestamps

#### 2. Tamaño de Token
- **Máximo Recomendado:** 8KB (límite típico de headers HTTP)
- **Payload Mínimo:** `{ userId, email, iat, exp }`
- **Sin Claims Personalizados:** En esta fase, solo campos estándar

#### 3. Rate y Performance
- **Tiempo de Verificación:** < 10ms por token en promedio
- **No Caché:** Cada request valida el token (stateless)
- **Overhead Mínimo:** No debe agregar latencia significativa

### Límites de Alcance

#### 1. Fase 1 Únicamente
- **NO** implementar lógica de roles/permisos
- **NO** validar recursos específicos (ownership)
- **NO** implementar refresh tokens
- **SOLO** validar que el usuario está autenticado

#### 2. Compatibilidad
- **Express:** Middleware compatible con Express 4.x+
- **Node.js:** Versión 18+ (módulos ES6)
- **TypeScript:** 5.x con strict mode

#### 3. Dependencias Externas
- **jsonwebtoken:** Ya instalada, no agregar más librerías JWT
- **@types/express:** Para extensión de tipos
- **NO** agregar dependencias nuevas sin justificación

### Límites de Seguridad

#### 1. Amenazas Mitigadas
- ✅ Tokens falsificados (firma inválida)
- ✅ Tokens expirados (replay attacks limitados)
- ✅ Tokens ausentes (acceso no autorizado)
- ✅ Formato inválido (tokens corruptos)

#### 2. Amenazas NO Mitigadas (Fuera de Alcance)
- ❌ Token Theft (robo de tokens válidos)
- ❌ Man-in-the-Middle (requiere HTTPS en infraestructura)
- ❌ Brute Force (requiere rate limiting - fuera de fase)
- ❌ Session Hijacking (requiere blacklist - fuera de fase)

#### 3. Supuestos de Seguridad
- **HTTPS en Producción:** Los tokens NUNCA viajan por HTTP plano
- **JWT_SECRET Seguro:** Generado criptográficamente, > 64 chars
- **Tokens en Headers:** NUNCA en URLs o localStorage inseguro

---

## Eventos y estados (visión raíz)

### Diagrama de Flujo de Estados

```
┌───────────────────────────────────────────────────────────────┐
│                    REQUEST ENTRANTE                           │
│                 (Cliente → Servidor)                          │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Middleware Auth    │
         │   (authMiddleware)  │
         └──────────┬──────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
   [Sin Header]            [Con Header]
   Authorization           Authorization: Bearer <token>
        │                       │
        ▼                       ▼
   UnauthorizedError        Extraer Token
   401: "No token             │
   provided"                  ▼
        │              ┌──────────────┐
        │              │ verifyToken()│
        │              │  (jwt.ts)    │
        │              └──────┬───────┘
        │                     │
        │         ┌───────────┼───────────┐
        │         │           │           │
        │         ▼           ▼           ▼
        │    [Expirado]  [Inválido]  [Válido]
        │         │           │           │
        │         ▼           ▼           ▼
        │  TokenExpired InvalidToken  Payload
        │     Error        Error    { userId, email }
        │   401: "Token  401: "Invalid    │
        │   expired"      token"          ▼
        │         │           │      ┌─────────────┐
        │         │           │      │ Enriquecer  │
        │         │           │      │  Request    │
        │         │           │      │ req.userId  │
        │         │           │      │ req.email   │
        │         │           │      └──────┬──────┘
        │         │           │             │
        │         └───────────┴─────────────┘
        │                     │
        ▼                     ▼
   [Error Handler]      [Next Middleware]
   Response JSON        o Controller
   Status: 401               │
   Con detalles              ▼
                    ┌─────────────────┐
                    │ Lógica Negocio  │
                    │  (Controller)   │
                    └─────────┬───────┘
                              │
                              ▼
                        Response 200/201
```

### Estados del Sistema

#### Estado 1: REQUEST_RECEIVED
**Descripción:** Request HTTP llega al servidor  
**Trigger:** Cliente hace request a endpoint protegido  
**Siguiente Estado:** TOKEN_EXTRACTION

#### Estado 2: TOKEN_EXTRACTION
**Descripción:** Middleware busca header Authorization  
**Condiciones:**
- ✅ Header presente → TOKEN_VALIDATION
- ❌ Header ausente → UNAUTHORIZED_ERROR

#### Estado 3: TOKEN_VALIDATION
**Descripción:** Verificación criptográfica del JWT  
**Proceso:**
1. Separar "Bearer" del token
2. Llamar `verifyToken(token)`
3. Verificar firma con JWT_SECRET
4. Verificar expiración
5. Extraer payload

**Condiciones:**
- ✅ Token válido → REQUEST_ENRICHMENT
- ❌ Token expirado → EXPIRED_ERROR
- ❌ Token inválido → INVALID_TOKEN_ERROR

#### Estado 4: REQUEST_ENRICHMENT
**Descripción:** Agregar datos del usuario al Request  
**Acciones:**
- Asignar `req.userId = payload.userId`
- Asignar `req.email = payload.email`
- Continuar al siguiente middleware

**Siguiente Estado:** CONTROLLER_EXECUTION

#### Estado 5: CONTROLLER_EXECUTION
**Descripción:** Lógica de negocio se ejecuta  
**Contexto Disponible:**
- `req.userId`: UUID del usuario autenticado
- `req.email`: Email del usuario autenticado
- Request autenticado y verificado

**Siguiente Estado:** RESPONSE_SUCCESS

#### Estado ERROR: UNAUTHORIZED_ERROR
**HTTP Status:** 401  
**Response:**
```json
{
  "status": "error",
  "message": "No authorization token provided",
  "code": "UNAUTHORIZED",
  "timestamp": "2026-03-08T..."
}
```

#### Estado ERROR: EXPIRED_ERROR
**HTTP Status:** 401  
**Response:**
```json
{
  "status": "error",
  "message": "Token has expired",
  "code": "TOKEN_EXPIRED",
  "timestamp": "2026-03-08T..."
}
```

#### Estado ERROR: INVALID_TOKEN_ERROR
**HTTP Status:** 401  
**Response:**
```json
{
  "status": "error",
  "message": "Invalid authentication token",
  "code": "INVALID_TOKEN",
  "timestamp": "2026-03-08T..."
}
```

### Eventos del Sistema

#### Evento: TOKEN_VALIDATED
**Cuándo:** Token JWT verificado exitosamente  
**Payload:**
```typescript
{
  userId: string;
  email: string;
  timestamp: string;
}
```
**Acción:** Continuar procesamiento del request

#### Evento: AUTH_FAILED
**Cuándo:** Validación de token falla  
**Payload:**
```typescript
{
  reason: 'missing' | 'expired' | 'invalid';
  timestamp: string;
  ip?: string; // Opcional para auditoría
}
```
**Acción:** Rechazar request con 401

---

## Criterios de aceptación (root)

### CA-1: Extracción de Token desde Header

#### CA-1.1: Token Presente y Válido
**DADO** un request con header `Authorization: Bearer <token-valido>`  
**CUANDO** el middleware de autenticación se ejecuta  
**ENTONCES**:
- El token se extrae correctamente
- Se llama a `verifyToken(token)`
- No se lanza ningún error
- El request continúa al siguiente middleware

**Criterio de Éxito:** Token extraído sin el prefijo "Bearer "

#### CA-1.2: Token Ausente
**DADO** un request sin header `Authorization`  
**CUANDO** el middleware de autenticación se ejecuta  
**ENTONCES**:
- Se lanza `UnauthorizedError`
- Se retorna status HTTP 401
- Response incluye mensaje: "No authorization token provided"
- El request NO continúa

**Criterio de Éxito:** Response JSON con estructura correcta

#### CA-1.3: Header Authorization Malformado
**DADO** un request con header `Authorization: <token>` (sin "Bearer")  
**CUANDO** el middleware de autenticación se ejecuta  
**ENTONCES**:
- Se lanza `UnauthorizedError`
- Se retorna status HTTP 401
- Response incluye mensaje descriptivo
- El request NO continúa

**Criterio de Éxito:** Manejo de formato incorrecto

### CA-2: Validación de Token JWT

#### CA-2.1: Token con Firma Válida y No Expirado
**DADO** un token JWT firmado correctamente y dentro del período de validez  
**CUANDO** se llama a `verifyToken(token)`  
**ENTONCES**:
- La función retorna el payload decodificado
- Payload contiene `userId` y `email`
- No se lanza ningún error

**Criterio de Éxito:** Payload extraído correctamente

#### CA-2.2: Token Expirado
**DADO** un token JWT cuyo campo `exp` está en el pasado  
**CUANDO** se llama a `verifyToken(token)`  
**ENTONCES**:
- `verifyToken()` lanza un error
- El middleware captura el error
- Se lanza `TokenExpiredError`
- Se retorna status HTTP 401
- Response incluye código: "TOKEN_EXPIRED"

**Criterio de Éxito:** Error específico de expiración

#### CA-2.3: Token con Firma Inválida
**DADO** un token JWT manipulado o firmado con secret diferente  
**CUANDO** se llama a `verifyToken(token)`  
**ENTONCES**:
- `verifyToken()` lanza un error de verificación
- El middleware captura el error
- Se lanza `InvalidTokenError`
- Se retorna status HTTP 401
- Response incluye código: "INVALID_TOKEN"

**Criterio de Éxito:** Detección de firma incorrecta

#### CA-2.4: Token con Formato Corrupto
**DADO** un token que no sigue el formato JWT (no tiene 3 partes separadas por punto)  
**CUANDO** se intenta validar  
**ENTONCES**:
- Se lanza `InvalidTokenError`
- Se retorna status HTTP 401
- Response incluye mensaje descriptivo

**Criterio de Éxito:** Manejo de tokens mal formados

### CA-3: Enriquecimiento del Request

#### CA-3.1: Agregar userId al Request
**DADO** un token válido con payload `{ userId: "uuid-123", email: "user@test.com" }`  
**CUANDO** el middleware valida y procesa el token  
**ENTONCES**:
- `req.userId` se establece a "uuid-123"
- El valor es accesible en controladores subsecuentes
- El tipo de `req.userId` es `string`

**Criterio de Éxito:** Property accesible con TypeScript type-safe

#### CA-3.2: Agregar email al Request
**DADO** un token válido con payload `{ userId: "uuid-123", email: "user@test.com" }`  
**CUANDO** el middleware valida y procesa el token  
**ENTONCES**:
- `req.email` se establece a "user@test.com"
- El valor es accesible en controladores subsecuentes
- El tipo de `req.email` es `string`

**Criterio de Éxito:** Property accesible con TypeScript type-safe

#### CA-3.3: Continuación del Flujo
**DADO** un token validado exitosamente  
**CUANDO** se completa el enriquecimiento del request  
**ENTONCES**:
- Se llama a `next()` sin errores
- El siguiente middleware/controlador recibe el request enriquecido
- El flujo continúa normalmente

**Criterio de Éxito:** Ejecución sin interrupciones

### CA-4: Manejo de Errores y Respuestas

#### CA-4.1: Estructura de Respuesta de Error
**DADO** cualquier error de autenticación  
**CUANDO** se retorna una respuesta de error  
**ENTONCES** debe incluir:
- `status`: "error"
- `message`: Descripción legible del problema
- `code`: Código único identificable
- `timestamp`: ISO string del momento del error

**Criterio de Éxito:** Estructura JSON consistente

#### CA-4.2: Código HTTP Correcto
**DADO** diferentes tipos de errores de autenticación  
**CUANDO** se envía la respuesta  
**ENTONCES**:
- Token ausente → 401
- Token expirado → 401
- Token inválido → 401
- Error interno del servidor → 500

**Criterio de Éxito:** Status codes apropiados según RFC 7231

#### CA-4.3: Mensajes Sin Información Sensible
**DADO** cualquier error de autenticación  
**CUANDO** se genera el mensaje de error  
**ENTONCES**:
- NO incluir el token completo
- NO incluir el JWT_SECRET
- NO incluir stack traces en producción
- Incluir solo información accionable

**Criterio de Éxito:** Logs y responses seguros

### CA-5: Integración con Sistema Existente

#### CA-5.1: Compatible con jwt.ts Existente
**DADO** el archivo `src/utils/jwt.ts` con función `verifyToken()`  
**CUANDO** el middleware necesita validar un token  
**ENTONCES**:
- Usa `verifyToken()` directamente (no reimplementa)
- Maneja los errores de `verifyToken()` apropiadamente
- No modifica el comportamiento de `verifyToken()`

**Criterio de Éxito:** Reutilización sin duplicación

#### CA-5.2: Excepciones Heredan de AuthError
**DADO** las clases `UnauthorizedError`, `TokenExpiredError`, `InvalidTokenError`  
**CUANDO** se instancian  
**ENTONCES**:
- Todas extienden de `AuthError`
- Incluyen properties: `name`, `message`, `timestamp`, `context`
- Siguen el patrón del sistema existente

**Criterio de Éxito:** Consistencia con excepciones actuales

#### CA-5.3: TypeScript Type-Safe
**DADO** el archivo `src/types/express.d.ts`  
**CUANDO** se usa en código  
**ENTONCES**:
- IntelliSense muestra `req.userId` y `req.email`
- No hay errores de compilación TypeScript
- Tipos inferidos correctamente

**Criterio de Éxito:** Compilación exitosa con strict mode

### CA-6: Testing (Opcional pero Especificado)

#### CA-6.1: Test con Token Válido
**DADO** un test unitario del middleware  
**CUANDO** se simula un request con token válido  
**ENTONCES**:
- `next()` es llamado sin errores
- `req.userId` está definido
- `req.email` está definido

**Criterio de Éxito:** Test pasa en ambiente de testing

#### CA-6.2: Test sin Token
**DADO** un test unitario del middleware  
**CUANDO** se simula un request sin header Authorization  
**ENTONCES**:
- Se lanza `UnauthorizedError`
- Response tiene status 401
- `next()` NO es llamado

**Criterio de Éxito:** Test pasa verificando error esperado

#### CA-6.3: Test con Token Expirado
**DADO** un test unitario del middleware  
**CUANDO** se simula un request con token expirado  
**ENTONCES**:
- Se lanza `TokenExpiredError`
- Response tiene status 401 con código "TOKEN_EXPIRED"

**Criterio de Éxito:** Test pasa verificando error específico

---

## Trazabilidad

### Documentos de Referencia

#### DR-01: Plan de Desarrollo
**Archivo:** `PLAN_REGISTRO_CORREOS.md`  
**Sección:** FASE 1: Middleware de Autenticación JWT (Protección de Rutas)  
**Relación:** Este ONE SPEC implementa completamente la Fase 1 descrita

#### DR-02: Arquitectura Actual
**Archivos:**
- `src/utils/jwt.ts`: Funciones de generación y verificación JWT
- `src/application/exception/AuthError.ts`: Clase base de errores
- `src/infrastructure/controller/AuthController.ts`: Patrón de controllers

**Relación:** El middleware sigue los patrones establecidos

#### DR-03: Clean Architecture
**Principio:** Separación de capas (Domain, Application, Infrastructure)  
**Relación:** Middleware en capa Infrastructure, excepciones en Application

### Mapeo de Requerimientos a Tareas

#### Tarea 1.1: Crear la interfaz de Request extendido
**Archivo:** `src/types/express.d.ts`  
**Criterios de Aceptación:** CA-3.1, CA-3.2, CA-5.3  
**Principios Aplicados:** TypeScript Strict (4.1, 4.2)  
**Entregable:**
```typescript
// Extensión de tipos Express con module augmentation
declare global {
  namespace Express {
    interface Request {
      userId: string;
      email: string;
      userRole?: string; // Para Fase 2
    }
  }
}
```

#### Tarea 1.2: Crear el middleware de autenticación
**Archivo:** `src/infrastructure/middleware/auth.middleware.ts`  
**Criterios de Aceptación:** CA-1.*, CA-2.*, CA-3.*, CA-4.*  
**Principios Aplicados:** Todos (1.1-5.2)  
**Entregable:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../utils/jwt';
import { UnauthorizedError } from '../../application/exception/UnauthorizedError';
import { TokenExpiredError } from '../../application/exception/TokenExpiredError';
import { InvalidTokenError } from '../../application/exception/InvalidTokenError';

/**
 * Middleware de autenticación JWT
 * Valida que el request incluya un token JWT válido en el header Authorization
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extraer header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new UnauthorizedError('No authorization token provided');
    }

    // Verificar formato Bearer
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid authorization format. Expected: Bearer <token>');
    }

    // Extraer token (sin "Bearer ")
    const token = authHeader.substring(7);
    
    if (!token || token.trim().length === 0) {
      throw new UnauthorizedError('Token cannot be empty');
    }

    // Validar token usando función existente
    const payload = verifyToken(token);
    
    // Enriquecer request con datos del usuario
    req.userId = payload.userId;
    req.email = payload.email;

    // Continuar al siguiente middleware
    next();
    
  } catch (error) {
    // Manejar errores específicos de JWT
    if (error instanceof UnauthorizedError) {
      res.status(401).json({
        status: 'error',
        message: error.message,
        code: 'UNAUTHORIZED',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Detectar token expirado (error de jsonwebtoken)
    if ((error as any).name === 'TokenExpiredError') {
      const tokenExpiredError = new TokenExpiredError('Token has expired');
      res.status(401).json({
        status: 'error',
        message: tokenExpiredError.message,
        code: 'TOKEN_EXPIRED',
        timestamp: tokenExpiredError.timestamp
      });
      return;
    }
    
    // Detectar token inválido (firma incorrecta, formato corrupto)
    if ((error as any).name === 'JsonWebTokenError' || (error as any).message?.includes('invalid')) {
      const invalidTokenError = new InvalidTokenError('Invalid authentication token');
      res.status(401).json({
        status: 'error',
        message: invalidTokenError.message,
        code: 'INVALID_TOKEN',
        timestamp: invalidTokenError.timestamp
      });
      return;
    }
    
    // Error inesperado
    console.error('Unexpected auth middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during authentication',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};
```

#### Tarea 1.3: Crear excepciones de autenticación
**Archivos:**
- `src/application/exception/UnauthorizedError.ts`
- `src/application/exception/TokenExpiredError.ts`
- `src/application/exception/InvalidTokenError.ts`

**Criterios de Aceptación:** CA-4.1, CA-5.2  
**Principios Aplicados:** Consistencia (5.1)  

**Entregables:**

```typescript
// UnauthorizedError.ts
import { AuthError } from './AuthError';

export class UnauthorizedError extends AuthError {
  constructor(message = 'Unauthorized access', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'UnauthorizedError';
  }
}

// TokenExpiredError.ts
import { AuthError } from './AuthError';

export class TokenExpiredError extends AuthError {
  constructor(message = 'Token has expired', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'TokenExpiredError';
  }
}

// InvalidTokenError.ts
import { AuthError } from './AuthError';

export class InvalidTokenError extends AuthError {
  constructor(message = 'Invalid token', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'InvalidTokenError';
  }
}
```

#### Tarea 1.4: Crear tests del middleware (OPCIONAL)
**Archivo:** `src/infrastructure/middleware/__tests__/auth.middleware.test.ts`  
**Criterios de Aceptación:** CA-6.*  
**Principios Aplicados:** Testing Best Practices  
**Estado:** Documentado pero no obligatorio en Fase 1

**Entregable (plantilla):**
```typescript
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../auth.middleware';
import { generateToken } from '../../../utils/jwt';

describe('authMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('debería llamar next() con token válido', async () => {
    const validToken = generateToken('user-id-123', 'test@example.com');
    mockReq.headers = { authorization: `Bearer ${validToken}` };
    
    await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.userId).toBe('user-id-123');
    expect(mockReq.email).toBe('test@example.com');
  });

  it('debería retornar 401 sin header Authorization', async () => {
    await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  // Más tests según CA-6.2 y CA-6.3
});
```

### Matriz de Trazabilidad

| ID | Requerimiento | Tarea | Archivo | CA | Principio | Estado |
|----|---------------|-------|---------|-----|-----------|--------|
| REQ-01 | Extensión TypeScript Request | 1.1 | express.d.ts | CA-3.*, CA-5.3 | 4.1, 4.2 | ✅ Especificado |
| REQ-02 | Middleware de autenticación | 1.2 | auth.middleware.ts | CA-1.*, CA-2.*, CA-3.*, CA-4.* | Todos | ✅ Especificado |
| REQ-03 | Excepción UnauthorizedError | 1.3 | UnauthorizedError.ts | CA-4.1, CA-5.2 | 3.1, 5.1 | ✅ Especificado |
| REQ-04 | Excepción TokenExpiredError | 1.3 | TokenExpiredError.ts | CA-4.1, CA-5.2 | 3.1, 5.1 | ✅ Especificado |
| REQ-05 | Excepción InvalidTokenError | 1.3 | InvalidTokenError.ts | CA-4.1, CA-5.2 | 3.1, 5.1 | ✅ Especificado |
| REQ-06 | Tests unitarios | 1.4 | auth.middleware.test.ts | CA-6.* | Testing | 📝 Opcional |

### Dependencias entre Fases

#### ⬆️ Dependencias de Entrada (Ya Completadas)
1. **JWT Utils:** `src/utils/jwt.ts` con `generateToken()` y `verifyToken()`
2. **AuthError:** `src/application/exception/AuthError.ts` clase base
3. **Express Setup:** Servidor Express configurado en `src/index.ts`
4. **TypeScript Config:** `tsconfig.json` con strict mode

#### ➡️ Salidas de Esta Fase (Para Fases Posteriores)
1. **Middleware Auth:** Reutilizable en todas las rutas protegidas
2. **Request Extendido:** `req.userId` y `req.email` disponibles en controladores
3. **Excepciones Auth:** Clases reutilizables en otras fases
4. **Patrón Establecido:** Template para futuros middlewares (admin, roles)

#### ⬇️ Dependencias de Salida (Próximas Fases)
- **FASE 2:** Middleware de admin necesita este middleware como prerequisito
- **FASE 5:** Endpoint de registro usará `authMiddleware` y `adminMiddleware`
- **FASE 6:** Todas las rutas protegidas aplicarán este middleware

### Validación de Completitud

#### ✅ Checklist de Implementación
- [ ] **express.d.ts creado** con extensión de Request
- [ ] **auth.middleware.ts implementado** con toda la lógica
- [ ] **UnauthorizedError.ts creado** y testeado
- [ ] **TokenExpiredError.ts creado** y testeado
- [ ] **InvalidTokenError.ts creado** y testeado
- [ ] **Tests opcionales creados** (si se decide implementar)
- [ ] **Documentación actualizada** en README
- [ ] **Integración verificada** con rutas existentes

#### ✅ Checklist de Calidad
- [ ] **TypeScript compila** sin errores ni warnings
- [ ] **Linter pasa** (ESLint si está configurado)
- [ ] **Logs seguros** (sin tokens completos)
- [ ] **Mensajes claros** en respuestas de error
- [ ] **Código comentado** con JSDoc donde sea apropiado

#### ✅ Checklist de Seguridad
- [ ] **JWT_SECRET validado** antes de verificar tokens
- [ ] **Solo Bearer tokens** aceptados en Authorization header
- [ ] **Firma JWT verificada** en cada request
- [ ] **Expiración validada** correctamente
- [ ] **Sin información sensible** en logs o responses

---

**FIN DEL ONE SPEC - FASE 1**

**Próximos Pasos:**
1. Implementar los 5 archivos especificados
2. Aplicar el middleware a rutas que requieran autenticación
3. Validar con tests manuales o automatizados
4. Proceder a FASE 2: Sistema de Autorización (Admin Middleware)
