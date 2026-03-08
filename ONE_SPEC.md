# One Spec (Root Spec)

**Feature:** Middleware de Autenticación JWT (FASE 1)  
**Versión:** 1.0.0  
**Fecha:** 7 de Marzo de 2026  
**Estado:** Especificación  

---

## Objetivo

Implementar un sistema de autenticación basado en JWT que proteja las rutas de la API mediante middleware, asegurando que solo usuarios autenticados con tokens válidos puedan acceder a recursos protegidos.

### Objetivos Específicos:

1. **Validación de Tokens JWT**: Crear middleware que valide tokens JWT en cada petición a rutas protegidas
2. **Extensión de Request**: Permitir que las rutas accedan a la información del usuario autenticado
3. **Manejo de Errores**: Proporcionar respuestas HTTP claras para casos de autenticación fallida
4. **Reutilización**: Crear componentes reutilizables que puedan aplicarse a cualquier ruta

---

## Alcance / No alcance

### ✅ Dentro del Alcance (SÍ se incluye):

1. **Middleware de Autenticación JWT**
   - Extracción del token desde header `Authorization: Bearer <token>`
   - Validación del token usando la utilidad existente `verifyToken()`
   - Agregación de `userId` y `email` al objeto `Request`
   - Manejo de tokens inválidos, expirados o ausentes

2. **Definición de Tipos TypeScript**
   - Extensión de la interfaz `Request` de Express
   - Declaración de tipos para propiedades de usuario autenticado

3. **Excepciones de Autenticación**
   - `UnauthorizedError`: Token ausente o formato inválido
   - `TokenExpiredError`: Token expirado
   - `InvalidTokenError`: Token malformado o firma inválida

4. **Respuestas HTTP Estandarizadas**
   - Código 401 Unauthorized para errores de autenticación
   - Mensajes descriptivos en formato JSON
   - Timestamps de error

### ❌ Fuera del Alcance (NO se incluye):

1. **Autorización basada en roles** - Corresponde a Fase 2
2. **Generación de tokens** - Ya implementado en `src/utils/jwt.ts`
3. **Refresh tokens o renovación** - Funcionalidad futura
4. **Rate limiting o throttling** - Seguridad adicional futura
5. **Logout o revocación de tokens** - Funcionalidad futura
6. **Autenticación de terceros (OAuth)** - No requerido
7. **Tests unitarios** - Opcional, no crítico para MVP
8. **Registro de auditoría** - Funcionalidad futura

---

## Definiciones (lenguaje de dominio)

### Entidades y Conceptos:

**JWT (JSON Web Token)**
- Token de autenticación firmado digitalmente
- Contiene payload con `userId` y `email`
- Tiene expiración de 15 horas (según configuración actual)
- Se genera al hacer login exitoso

**Middleware de Autenticación**
- Función que intercepta requests HTTP antes de llegar al controlador
- Valida la presencia y validez del token JWT
- Enriquece el request con información del usuario
- Bloquea acceso si el token es inválido

**Bearer Token**
- Esquema de autenticación HTTP donde el token se envía en el header
- Formato: `Authorization: Bearer <token>`
- El token va precedido por la palabra "Bearer" y un espacio

**Request Extendido**
- Objeto `Request` de Express con propiedades adicionales
- Incluye `userId`, `email` del usuario autenticado
- Disponible en todos los controladores que usen el middleware

**Usuario Autenticado**
- Usuario que ha iniciado sesión exitosamente
- Posee un token JWT válido y no expirado
- Corresponde a un registro en la tabla `users` de Supabase

### Estados del Token:

1. **Válido**: Token presente, bien formado, no expirado, firma correcta
2. **Ausente**: No se envió header Authorization
3. **Malformado**: Header presente pero no sigue formato "Bearer <token>"
4. **Inválido**: Token con firma incorrecta o payload corrupto
5. **Expirado**: Token válido pero más allá de su tiempo de expiración

---

## Principios / Reglas no negociables

### Seguridad:

1. **JWT_SECRET Obligatorio**
   - El servidor NO debe iniciar sin JWT_SECRET configurado
   - Debe tener mínimo 32 caracteres (validación ya existe en jwt.ts)

2. **Validación en Cada Request**
   - El middleware DEBE verificar el token en CADA petición a rutas protegidas
   - No cachear estados de autenticación en servidor (stateless)

3. **No Exponer Información Sensible**
   - Los mensajes de error NO deben revelar detalles del sistema
   - No incluir stack traces en respuestas de producción
   - No loguear tokens completos (solo primeros/últimos caracteres para debug)

4. **Validación Estricta del Header**
   - Rechazar cualquier formato que no sea "Bearer <token>"
   - El token debe ser una cadena no vacía
   - Case-sensitive para "Bearer"

### Arquitectura:

5. **Separación de Responsabilidades**
   - Middleware solo valida, NO autoriza (autorización es Fase 2)
   - No acceder a base de datos en este middleware (performance)
   - Delegar verificación criptográfica a `verifyToken()` existente

6. **Inmutabilidad del Request Original**
   - Solo agregar propiedades, nunca modificar existentes
   - Usar TypeScript para garantizar tipo-seguridad

7. **Fail-Fast**
   - Si el token es inválido, rechazar inmediatamente
   - No continuar el procesamiento del request

### Código:

8. **Usar Utilidades Existentes**
   - DEBE usar `verifyToken()` de `src/utils/jwt.ts`
   - No reimplementar lógica de validación JWT

9. **Manejo de Errores Consistente**
   - Todas las excepciones de autenticación DEBEN extender `AuthError`
   - Respuestas JSON con estructura estándar del proyecto

10. **TypeScript Strict**
    - Sin uso de `any`
    - Todas las funciones con tipos de retorno explícitos
    - Interfaces bien definidas

---

## Límites

### Límites Técnicos:

**Performance:**
- Validación de token: < 10ms por request
- Sin consultas a base de datos en el middleware de autenticación
- Overhead mínimo en requests

**Concurrencia:**
- Stateless: No mantener estado de sesión en servidor
- Múltiples requests simultáneos con el mismo token son válidos
- No hay límite de dispositivos/sesiones por usuario

**Compatibilidad:**
- Compatible con Express 4.x
- TypeScript 5.x
- Node.js 18+

### Límites de Negocio:

**Token Válido:**
- Expiración: 15 horas (heredado de configuración actual)
- No renovable automáticamente (requiere nuevo login)
- Un token válido da acceso completo (sin granularidad hasta Fase 2)

**Rutas Protegidas:**
- Por defecto, las rutas que usen el middleware requieren autenticación
- No hay "permisos parciales" en esta fase
- Autenticación binaria: autenticado o no autenticado

### Límites Operacionales:

**Variables de Entorno:**
- `JWT_SECRET` es OBLIGATORIA
- Valor debe cumplir longitud mínima (32 chars)
- Cambiar JWT_SECRET invalida todos los tokens existentes

**Errores:**
- Todos los errores de autenticación resultan en HTTP 401
- No se distingue entre "token inválido" y "token expirado" en el código HTTP (ambos 401)
- Mensajes específicos solo en el JSON de respuesta

---

## Eventos y estados (visión raíz)

### Flujo de Autenticación (Happy Path):

```
┌─────────────┐
│   Cliente   │
│  con Token  │
└──────┬──────┘
       │
       │ 1. POST /ruta-protegida
       │    Authorization: Bearer eyJhbGc...
       ▼
┌─────────────────────────────┐
│  Express Server             │
│                             │
│  ┌────────────────────────┐ │
│  │ auth.middleware.ts     │ │
│  │                        │ │
│  │ 2. Extraer token       │ │
│  │    del header          │ │
│  └───────┬────────────────┘ │
│          │                  │
│          │ 3. Validar token │
│          ▼                  │
│  ┌────────────────────────┐ │
│  │   verifyToken()        │ │
│  │   (utils/jwt.ts)       │ │
│  │                        │ │
│  │ 4. Verificar firma y   │ │
│  │    expiración          │ │
│  └───────┬────────────────┘ │
│          │                  │
│          │ 5. Token válido  │
│          │    { userId,     │
│          │      email }     │
│          ▼                  │
│  ┌────────────────────────┐ │
│  │ Agregar a req:         │ │
│  │   req.userId = ...     │ │
│  │   req.email = ...      │ │
│  └───────┬────────────────┘ │
│          │                  │
│          │ 6. next()        │
│          ▼                  │
│  ┌────────────────────────┐ │
│  │   Controlador          │ │
│  │   (AuthController)     │ │
│  │                        │ │
│  │ 7. Acceso a userId,    │ │
│  │    email desde req     │ │
│  └───────┬────────────────┘ │
└──────────┼──────────────────┘
           │
           │ 8. Respuesta exitosa
           ▼
     ┌─────────────┐
     │   Cliente   │
     │ 200/201 OK  │
     └─────────────┘
```

### Flujo con Token Inválido (Error Path):

```
┌─────────────┐
│   Cliente   │
│  sin Token  │
│  o inválido │
└──────┬──────┘
       │
       │ 1. POST /ruta-protegida
       │    Authorization: Bearer INVALID_TOKEN
       ▼
┌─────────────────────────────┐
│  Express Server             │
│                             │
│  ┌────────────────────────┐ │
│  │ auth.middleware.ts     │ │
│  │                        │ │
│  │ 2. Extraer token       │ │
│  └───────┬────────────────┘ │
│          │                  │
│          │ 3. Validar       │
│          ▼                  │
│  ┌────────────────────────┐ │
│  │   verifyToken()        │ │
│  │                        │ │
│  │ ❌ Token inválido       │ │
│  │    throw Error         │ │
│  └───────┬────────────────┘ │
│          │                  │
│          │ 4. catch error   │
│          ▼                  │
│  ┌────────────────────────┐ │
│  │ Determinar tipo        │ │
│  │ de error:              │ │
│  │ - Sin token            │ │
│  │ - Malformado           │ │
│  │ - Expirado             │ │
│  │ - Firma inválida       │ │
│  └───────┬────────────────┘ │
│          │                  │
│          │ 5. res.status(401)│
│          │    .json({...})  │
│          ▼                  │
│     STOP - No llega        │
│     al controlador         │
└────────────────────────────┘
       │
       │ 6. Respuesta error
       ▼
┌─────────────┐
│   Cliente   │
│  401 Error  │
└─────────────┘
```

### Transiciones de Estado del Request:

1. **Request Inicial** → Sin información de usuario
2. **Middleware Ejecutado** → Request con `userId` y `email` (si válido)
3. **Error de Autenticación** → Request abortado, respuesta 401 enviada
4. **Controlador Recibe** → Request enriquecido con datos de usuario

### Eventos del Sistema:

| Evento | Trigger | Resultado |
|--------|---------|-----------|
| `TokenValidationStarted` | Middleware recibe request | Inicia proceso de validación |
| `TokenExtracted` | Header Authorization parseado | Token disponible para validar |
| `TokenValid` | `verifyToken()` exitoso | Usuario autenticado, continua flujo |
| `TokenMissing` | Header Authorization ausente | 401 Unauthorized |
| `TokenMalformed` | Header sin formato "Bearer <token>" | 401 Unauthorized |
| `TokenExpired` | Token válido pero expirado | 401, mensaje específico |
| `TokenInvalid` | Firma incorrecta o payload corrupto | 401 Unauthorized |
| `UserAuthenticated` | Token válido agregado a req | Controlador puede proceder |

---

## Criterios de aceptación (root)

### AC-1: Extensión de Tipos de Request

**Como** desarrollador  
**Quiero** que TypeScript reconozca `userId` y `email` en el objeto Request  
**Para** tener autocompletado y type-safety en los controladores  

**Criterios:**
- ✅ Archivo `src/types/express.d.ts` creado
- ✅ Interfaz `Request` de Express extendida con:
  - `userId: string`
  - `email: string`
  - `userRole?: string` (para uso futuro en Fase 2)
- ✅ TypeScript no muestra errores al acceder a `req.userId` o `req.email`
- ✅ Propiedades opcionales marcadas correctamente

**Definición de Hecho:**
```typescript
// En cualquier controlador:
const userId = req.userId; // ✅ Sin error de TypeScript
const email = req.email;   // ✅ Sin error de TypeScript
```

---

### AC-2: Middleware de Autenticación JWT

**Como** sistema de API  
**Quiero** validar automáticamente tokens JWT en rutas protegidas  
**Para** asegurar que solo usuarios autenticados accedan a recursos sensibles  

**Criterios:**

**2.1 Extracción del Token:**
- ✅ Lee header `Authorization`
- ✅ Valida formato `Bearer <token>`
- ✅ Extrae el token correctamente
- ✅ Rechaza headers malformados (sin "Bearer", sin espacio, etc.)

**2.2 Validación del Token:**
- ✅ Usa función `verifyToken()` de `src/utils/jwt.ts`
- ✅ No reimplementa lógica de verificación
- ✅ Maneja todas las excepciones de `verifyToken()`

**2.3 Enriquecimiento del Request:**
- ✅ Agrega `req.userId` con el ID del usuario
- ✅ Agrega `req.email` con el email del usuario
- ✅ Llama `next()` para continuar al siguiente middleware/controlador

**2.4 Manejo de Errores:**
- ✅ Token ausente → 401 con código `TOKEN_REQUIRED`
- ✅ Token malformado → 401 con código `INVALID_TOKEN_FORMAT`
- ✅ Token expirado → 401 con código `TOKEN_EXPIRED`
- ✅ Token inválido → 401 con código `INVALID_TOKEN`
- ✅ Todos los errores incluyen `timestamp` y `message` descriptivo

**Definición de Hecho:**
```typescript
// Aplicar middleware a ruta:
router.post('/protected', authMiddleware, controller.method);

// Request con token válido → continúa
// Request sin token → 401 inmediatamente
// Request con token inválido → 401 inmediatamente
```

---

### AC-3: Excepciones de Autenticación

**Como** sistema  
**Quiero** excepciones específicas para cada tipo de error de autenticación  
**Para** proporcionar mensajes claros y facilitar debugging  

**Criterios:**

**3.1 UnauthorizedError:**
- ✅ Extiende `AuthError`
- ✅ Se lanza cuando no hay token o formato incorrecto
- ✅ Mensaje: "Authentication required"
- ✅ Código: `UNAUTHORIZED`

**3.2 TokenExpiredError:**
- ✅ Extiende `AuthError`
- ✅ Se lanza cuando el token ha expirado
- ✅ Mensaje: "Token has expired"
- ✅ Código: `TOKEN_EXPIRED`

**3.3 InvalidTokenError:**
- ✅ Extiende `AuthError`
- ✅ Se lanza cuando el token es inválido
- ✅ Mensaje: "Invalid token"
- ✅ Código: `INVALID_TOKEN`

**Definición de Hecho:**
```typescript
// Cada excepción puede ser instanciada:
throw new UnauthorizedError();
throw new TokenExpiredError();
throw new InvalidTokenError();

// Y capturada correctamente:
if (error instanceof TokenExpiredError) { /* ... */ }
```

---

### AC-4: Respuestas HTTP Estandarizadas

**Como** cliente de la API  
**Quiero** respuestas de error consistentes y descriptivas  
**Para** manejar errores de autenticación apropiadamente  

**Criterios:**
- ✅ Código HTTP: 401 Unauthorized para todos los errores de autenticación
- ✅ Content-Type: `application/json`
- ✅ Estructura de respuesta:
  ```json
  {
    "status": "error",
    "message": "Mensaje descriptivo en inglés",
    "code": "CODIGO_ERROR",
    "timestamp": "2026-03-07T12:34:56.789Z"
  }
  ```
- ✅ No incluir stack trace en producción
- ✅ Mensajes claros sin exponer detalles internos

**Ejemplos:**

**Sin Token:**
```json
{
  "status": "error",
  "message": "Authentication required. Please provide a valid token",
  "code": "TOKEN_REQUIRED",
  "timestamp": "2026-03-07T12:34:56.789Z"
}
```

**Token Expirado:**
```json
{
  "status": "error",
  "message": "Token has expired. Please login again",
  "code": "TOKEN_EXPIRED",
  "timestamp": "2026-03-07T12:34:56.789Z"
}
```

**Token Inválido:**
```json
{
  "status": "error",
  "message": "Invalid token provided",
  "code": "INVALID_TOKEN",
  "timestamp": "2026-03-07T12:34:56.789Z"
}
```

---

### AC-5: Integración con Rutas Existentes

**Como** desarrollador  
**Quiero** aplicar el middleware a rutas de forma simple  
**Para** proteger endpoints sin duplicar código  

**Criterios:**
- ✅ Middleware exportado y disponible para importar
- ✅ Se puede aplicar a rutas individuales:
  ```typescript
  router.post('/protected', authMiddleware, controller.method);
  ```
- ✅ Se puede aplicar a todas las rutas de un router:
  ```typescript
  router.use(authMiddleware);
  ```
- ✅ Compatible con otros middlewares (puede encadenarse)
- ✅ No rompe rutas públicas existentes (no aplicar globalmente aún)

**Definición de Hecho:**
- Rutas con middleware requieren token válido
- Rutas sin middleware siguen funcionando como antes
- No hay regresiones en funcionalidad existente

---

### AC-6: Testing Manual

**Como** QA/Desarrollador  
**Quiero** poder probar manualmente el middleware  
**Para** verificar que funciona correctamente antes de deploy  

**Escenarios de Prueba:**

**Escenario 1: Request sin token**
```bash
curl -X POST http://localhost:3000/auth/protected-route
# Esperado: 401, TOKEN_REQUIRED
```

**Escenario 2: Request con token malformado**
```bash
curl -X POST http://localhost:3000/auth/protected-route \
  -H "Authorization: INVALID_FORMAT"
# Esperado: 401, INVALID_TOKEN_FORMAT
```

**Escenario 3: Request con token válido**
```bash
# 1. Primero hacer login para obtener token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# Respuesta: { "token": "eyJhbGc..." }

# 2. Usar token en ruta protegida
curl -X POST http://localhost:3000/auth/protected-route \
  -H "Authorization: Bearer eyJhbGc..."
# Esperado: 200 OK, acceso permitido
```

**Escenario 4: Request con token expirado**
```bash
# Usar token generado hace más de 15 horas
curl -X POST http://localhost:3000/auth/protected-route \
  -H "Authorization: Bearer OLD_EXPIRED_TOKEN"
# Esperado: 401, TOKEN_EXPIRED
```

**Escenario 5: Request con token inválido (firma incorrecta)**
```bash
curl -X POST http://localhost:3000/auth/protected-route \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALID"
# Esperado: 401, INVALID_TOKEN
```

**Criterio de Aceptación:**
- ✅ Todos los escenarios producen respuestas esperadas
- ✅ No hay errores 500 (todos manejados apropiadamente)
- ✅ Logs del servidor no muestran stack traces para errores 401

---

## Trazabilidad

### Mapeo de Requisitos a Implementación:

| Requisito | Archivo(s) Afectado(s) | Tipo Cambio | Prioridad |
|-----------|------------------------|-------------|-----------|
| REQ-1.1: Tipos TypeScript | `src/types/express.d.ts` | Crear nuevo | P0 (Crítico) |
| REQ-1.2: Middleware Auth | `src/infrastructure/middleware/auth.middleware.ts` | Crear nuevo | P0 (Crítico) |
| REQ-1.3: UnauthorizedError | `src/application/exception/UnauthorizedError.ts` | Crear nuevo | P0 (Crítico) |
| REQ-1.4: TokenExpiredError | `src/application/exception/TokenExpiredError.ts` | Crear nuevo | P0 (Crítico) |
| REQ-1.5: InvalidTokenError | `src/application/exception/InvalidTokenError.ts` | Crear nuevo | P0 (Crítico) |
| REQ-1.6: Tests Middleware | `src/infrastructure/middleware/__tests__/auth.middleware.test.ts` | Crear nuevo | P2 (Opcional) |

### Dependencias:

**Dependencias Internas (ya existentes):**
- ✅ `src/utils/jwt.ts` → Función `verifyToken()` para validar tokens
- ✅ `src/application/exception/AuthError.ts` → Clase base para excepciones
- ✅ Variables de entorno → `JWT_SECRET` configurado

**Dependencias Externas (npm):**
- ✅ `express` (ya instalado) → Tipos de Request, Response, NextFunction
- ✅ `jsonwebtoken` (ya instalado) → Usado por jwt.ts
- ✅ `@types/express` (ya instalado) → Tipos de TypeScript

**Bloqueantes:**
- ❌ Ninguno - esta fase no depende de funcionalidad pendiente

### Impacto en Fases Posteriores:

| Fase Posterior | Dependencia de Fase 1 | Descripción |
|----------------|------------------------|-------------|
| **Fase 2: Autorización Admin** | authMiddleware | El middleware de admin debe ejecutarse DESPUÉS de authMiddleware |
| **Fase 5: Endpoint Registro** | authMiddleware | La ruta `/auth/register-email` usará este middleware |
| **Futures Features** | req.userId, req.email | Todas las rutas protegidas necesitan acceder a estos campos |

### Archivos Creados (Nuevos):

```
src/
├── types/
│   └── express.d.ts                                    [NUEVO] ✨
└── infrastructure/
    └── middleware/
        ├── auth.middleware.ts                          [NUEVO] ✨
        └── __tests__/
            └── auth.middleware.test.ts                 [NUEVO OPCIONAL] ✨
└── application/
    └── exception/
        ├── UnauthorizedError.ts                        [NUEVO] ✨
        ├── TokenExpiredError.ts                        [NUEVO] ✨
        └── InvalidTokenError.ts                        [NUEVO] ✨
```

### Archivos Modificados:
- Ninguno en esta fase (arquitectura aditiva, sin breaking changes)

### Testing:

**Pruebas Requeridas:**
1. ✅ Prueba manual con Postman/cURL (requisito mínimo)
2. ⚪ Tests unitarios con Jest (opcional pero recomendado)

**Cobertura Esperada (si se implementan tests):**
- Función `authMiddleware`: 100%
- Excepciones de autenticación: 100%
- Casos edge: token vacío, header sin Bearer, null, undefined

### Checklist de Completitud:

Antes de marcar esta fase como completa:

- [ ] Todos los archivos nuevos creados y compilando sin errores
- [ ] TypeScript no muestra errores en `req.userId` o `req.email`
- [ ] Middleware puede ser importado desde `auth.routes.ts`
- [ ] Las 3 excepciones extienden correctamente `AuthError`
- [ ] Request con token válido continúa al controlador
- [ ] Request sin token retorna 401 con mensaje apropiado
- [ ] Request con token expirado retorna 401 específico
- [ ] Request con token inválido retorna 401 específico
- [ ] Respuestas JSON siguen formato estándar del proyecto
- [ ] No hay regresiones en endpoints existentes
- [ ] Código cumple estándares TypeScript (no usar `any`)
- [ ] Build exitoso: `npm run build` sin errores
- [ ] Servidor inicia correctamente: `npm run dev`
- [ ] Pruebas manuales con cURL/Postman exitosas
- [ ] Logs del servidor no exponen información sensible

### Versionado y Rollback:

**Git Strategy:**
- Branch: `feature/auth-middleware-phase1`
- Commits atómicos por cada archivo creado
- PR con descripción completa y checklist

**Rollback:**
- Si falla: eliminar archivos nuevos y revertir imports
- No hay cambios en base de datos en esta fase
- Tokens existentes siguen siendo válidos

---

## 📦 Entregables de la Fase 1

### Código Fuente:
1. `src/types/express.d.ts` - Extensión de tipos
2. `src/infrastructure/middleware/auth.middleware.ts` - Middleware principal
3. `src/application/exception/UnauthorizedError.ts` - Excepción sin token
4. `src/application/exception/TokenExpiredError.ts` - Excepción token expirado
5. `src/application/exception/InvalidTokenError.ts` - Excepción token inválido

### Documentación:
- Este ONE_SPEC.md completado
- Comentarios JSDoc en el middleware
- Ejemplos de uso en código

### Testing:
- Scripts de prueba manual con cURL
- (Opcional) Suite de tests unitarios

---

## 🔗 Referencias Técnicas

**Documentación Interna:**
- [PLAN_REGISTRO_CORREOS.md](./PLAN_REGISTRO_CORREOS.md) - Plan completo de 6 fases
- [src/utils/jwt.ts](./src/utils/jwt.ts) - Utilidades JWT existentes
- [src/application/exception/AuthError.ts](./src/application/exception/AuthError.ts) - Clase base de errores

**Documentación Externa:**
- Express Middleware: https://expressjs.com/en/guide/writing-middleware.html
- TypeScript Declaration Merging: https://www.typescriptlang.org/docs/handbook/declaration-merging.html
- JWT Best Practices: https://tools.ietf.org/html/rfc7519
- HTTP 401 Unauthorized: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401

**Ejemplos de Código:**

**Uso Básico:**
```typescript
// En auth.routes.ts
import { authMiddleware } from '../middleware/auth.middleware';

// Aplicar a ruta específica
router.post('/protected', authMiddleware, controller.method);
```

**Acceso en Controlador:**
```typescript
// En controlador
async method(req: Request, res: Response): Promise<void> {
  const userId = req.userId;  // ✅ TypeScript OK
  const email = req.email;    // ✅ TypeScript OK
  
  // Usar userId para lógica de negocio
  const user = await userRepository.findById(userId);
}
```

---

**Fin del ONE_SPEC de Fase 1: Middleware de Autenticación JWT**
