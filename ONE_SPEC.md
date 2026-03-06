# One Spec (Root Spec)
**Fase 4: Módulo de JWT - Sistema de Autenticación con JSON Web Tokens**

---
 
## Objetivo

Implementar un módulo de utilidad centralizado para la gestión de JSON Web Tokens (JWT) que permita:

1. **Generar tokens de autenticación** firmados digitalmente con información mínima del usuario (userId + email)
2. **Verificar tokens** existentes validando su integridad, firma y vigencia temporal
3. **Gestionar expiración automática** de tokens con una duración exacta de 15 horas
4. **Proporcionar manejo robusto de errores** para tokens inválidos, expirados o manipulados

Este módulo será la base del sistema de autenticación del microservicio y será utilizado por los servicios de login (Fase 5) y middlewares de protección (Fase 7).

---
 
## Alcance / No alcance

### ✅ Dentro del Alcance

- Instalación de dependencias: `jsonwebtoken` y `@types/jsonwebtoken`
- Creación del archivo `src/utils/jwt.ts` siguiendo los estándares del proyecto
- Implementación de función `generateToken(userId: string, email: string): string`
- Implementación de función `verifyToken(token: string): JwtPayload`
- Configuración de expiración fija de 15 horas (`15h`)
- Manejo de errores: `TokenExpiredError`, `JsonWebTokenError`, `NotBeforeError`
- Definición de tipos TypeScript para payload JWT
- Documentación JSDoc completa de todas las funciones
- Uso de variable de entorno `JWT_SECRET` para firma
- Validaciones de entrada (parámetros no vacíos)
- Tests manuales básicos de generación y verificación

### ❌ Fuera del Alcance

- Implementación de refresh tokens (Fase 10 opcional)
- Almacenamiento de tokens en base de datos
- Blacklist de tokens revocados
- Rotación automática de claves JWT
- Tokens con scopes o permisos granulares
- Middleware de autenticación (corresponde a Fase 7)
- Integración con servicios de autenticación (corresponde a Fase 5)
- Testing automatizado con Jest/Mocha
- Rate limiting o protección contra fuerza bruta

---
 
## Definiciones (lenguaje de dominio)

### JWT (JSON Web Token)
Token compacto y autocontenido que transmite información entre partes de forma segura. Estructura: `header.payload.signature` codificada en Base64URL.

### Payload
Objeto JSON que contiene claims (afirmaciones) sobre el usuario. En este proyecto incluye:
- `userId`: Identificador único del usuario (UUID)
- `email`: Correo electrónico del usuario
- `iat`: Timestamp de emisión (generado automáticamente)
- `exp`: Timestamp de expiración (generado automáticamente)

### JWT_SECRET
Clave secreta utilizada para firmar y verificar tokens. Debe ser una cadena aleatoria de mínimo 64 caracteres guardada en variable de entorno.

### Token Expirado
Token cuyo campo `exp` indica una fecha/hora anterior al momento actual. Debe ser rechazado y requerir nuevo login.

### Token Inválido
Token con firma incorrecta, payload manipulado, o formato malformado. Indica intento de falsificación.

### Expiración de 15 horas
Duración temporal exacta del token desde su emisión. Después de este período, el token se considera expirado automáticamente.

### HS256 (HMAC-SHA256)
Algoritmo de firma simétrica utilizado por defecto en jsonwebtoken. Requiere la misma clave para firmar y verificar.

---
 
## Principios / Reglas no negociables

### 1. Seguridad de la Clave Secreta
- ❌ **NUNCA** hardcodear `JWT_SECRET` en el código fuente
- ✅ **SIEMPRE** leer `JWT_SECRET` desde variable de entorno
- ✅ El servidor **DEBE fallar al iniciar** si `JWT_SECRET` no está definido o es muy corto (< 32 caracteres)
- ✅ En producción, usar claves de mínimo 64 caracteres con alta entropía

### 2. Duración del Token No Modificable
- ✅ La expiración **DEBE ser exactamente 15 horas** (`expiresIn: '15h'`)
- ❌ No aceptar duración como parámetro configurable
- ✅ Esta duración es un requerimiento de negocio explícito

### 3. Payload Mínimo y Sin Datos Sensibles
- ✅ El payload **SOLO** debe contener: `userId` y `email`
- ❌ **NUNCA** incluir: contraseñas, password_hash, tokens de terceros, datos financieros
- ✅ El token será transmitido en headers HTTP y puede ser decodificado sin la clave

### 4. Manejo Explícito de Errores
- ✅ Diferenciar tipos de error: token expirado ≠ token inválido
- ✅ Propagar errores específicos con mensajes claros
- ❌ No retornar `null` o `undefined` silenciosamente
- ✅ Lanzar excepciones tipadas que puedan ser capturadas en capas superiores

### 5. Inmutabilidad del Token
- ✅ Los tokens **NO deben ser modificables** después de generados
- ✅ Cualquier cambio en el payload invalida la firma
- ✅ Para actualizar información, generar un nuevo token

### 6. Validación de Parametros de Entrada
- ✅ `userId` y `email` **NO** deben ser vacíos, undefined o null
- ✅ `token` **NO** debe ser vacío, undefined o null
- ✅ Validar antes de llamar a librerías externas

### 7. Consistencia con Módulos Existentes
- ✅ Seguir el mismo patrón de documentación que `password.ts`
- ✅ Usar el mismo estilo de manejo de errores
- ✅ Mantener estructura JSDoc consistente

---
 
## Límites

### Límites Técnicos

**Tamaño del Token:**
- Tokens JWT típicamente tienen entre 200-400 caracteres
- Límite recomendado: < 8KB para compatibilidad con headers HTTP
- Payload actual (userId + email) genera tokens de ~150-250 caracteres ✅

**Expiración Temporal:**
- Mínimo: No definido (tokens de corta duración no aplican a este caso de uso)
- Establecido: **15 horas exactas** (requerimiento de negocio)
- Máximo: Técnicamente ilimitado, pero no recomendado por seguridad

**Compatibilidad de Algoritmo:**
- Usar **HS256** (HMAC-SHA256) - algoritmo simétrico por defecto
- No usar RS256, ES256 (algoritmos asimétricos) en esta fase

**Precisión de Timestamp:**
- Los campos `iat` y `exp` usan timestamps Unix en **segundos** (no milisegundos)
- Reloj del servidor debe estar sincronizado (NTP recomendado)

### Límites de Integración

**Dependencias del Proyecto:**
- Requiere `dotenv` configurado previamente (Fase 1 ✅)
- Requiere variable `JWT_SECRET` en archivo `.env`
- Compatible con Node.js 18+ y TypeScript 5.x

**No gestiona:**
- Transporte del token (será manejado por controllers/middlewares)
- Almacenamiento del token (cliente es responsable)
- Revocación/invalidación manual de tokens

### Límites de Performance

**Operaciones Sincrónicas:**
- `jwt.sign()` y `jwt.verify()` son operaciones **síncronas rápidas** (< 1ms)
- No requieren `async/await` ni generan cuellos de botella
- Pueden procesar miles de tokens por segundo en hardware moderno

**Carga de CPU:**
- HS256 es computacionalmente ligero comparado con bcrypt
- No requiere optimizaciones especiales para carga normal

---
 
## Eventos y estados (visión raíz)

### Flujo 1: Generación de Token

```
┌────────────────────────────────────────────────────────────┐
│ INICIO: Usuario se autentica exitosamente                 │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │ INPUT: userId + email       │
         └──────────┬──────────────────┘
                    │
                    ▼
         ┌─────────────────────────────┐
         │ VALIDAR: Parámetros no      │
         │ vacíos ni undefined         │
         └──────────┬──────────────────┘
                    │
                    ├─── [❌ Inválidos] ──→ throw Error('Invalid input')
                    │
                    ▼ [✅ Válidos]
         ┌─────────────────────────────┐
         │ CONSTRUIR: payload = {      │
         │   userId,                   │
         │   email                     │
         │ }                           │
         └──────────┬──────────────────┘
                    │
                    ▼
         ┌─────────────────────────────┐
         │ FIRMAR: jwt.sign(           │
         │   payload,                  │
         │   JWT_SECRET,               │
         │   { expiresIn: '15h' }      │
         │ )                           │
         └──────────┬──────────────────┘
                    │
                    ▼
         ┌─────────────────────────────┐
         │ OUTPUT: Token string        │
         │ (formato: header.payload.   │
         │  signature)                 │
         └──────────┬──────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────┐
│ FIN: Token listo para enviar al cliente                   │
│ Estado: VÁLIDO por 15 horas desde ahora                   │
└────────────────────────────────────────────────────────────┘
```

**Estados del token generado:**
- **VÁLIDO**: Desde `iat` hasta `exp` (15 horas)
- **EXPIRADO**: Después de `exp`

---

### Flujo 2: Verificación de Token

```
┌────────────────────────────────────────────────────────────┐
│ INICIO: Cliente envía petición con token                  │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │ INPUT: token string         │
         └──────────┬──────────────────┘
                    │
                    ▼
         ┌─────────────────────────────┐
         │ VALIDAR: Token no vacío     │
         └──────────┬──────────────────┘
                    │
                    ├─── [❌ Vacío] ──→ throw Error('Token required')
                    │
                    ▼ [✅ Presente]
         ┌─────────────────────────────────────────────┐
         │ VERIFICAR: jwt.verify(token, JWT_SECRET)    │
         └──────────┬────────────────────────────┬─────┘
                    │                            │
                    ▼                            │
            [✅ Verificación OK]                 │
         ┌─────────────────────────────┐         │
         │ EXTRAER: payload = {        │         │
         │   userId,                   │         │
         │   email,                    │         │
         │   iat,                      │         │
         │   exp                       │         │
         │ }                           │         │
         └──────────┬──────────────────┘         │
                    │                            │
                    ▼                            │
         ┌─────────────────────────────┐         │
         │ OUTPUT: JwtPayload          │         │
         └──────────┬──────────────────┘         │
                    │                            │
                    ▼                            │
┌────────────────────────────────────┐           │
│ FIN: Token verificado correctamente│           │
│ Estado: AUTENTICADO                │           │
└────────────────────────────────────┘           │
                                                 │
                         [❌ Error de verificación]
                                                 │
                         ┌───────────────────────┴────────┐
                         │                                │
                         ▼                                ▼
              ┌────────────────────┐         ┌──────────────────────┐
              │ TokenExpiredError  │         │ JsonWebTokenError    │
              │ Token expirado     │         │ Token inválido       │
              │ (> 15 horas)       │         │ o firma incorrecta   │
              └─────────┬──────────┘         └──────────┬───────────┘
                        │                               │
                        ▼                               ▼
              throw Error('Token expired')   throw Error('Invalid token')
                        │                               │
                        ▼                               ▼
            ┌─────────────────────────────────────────────┐
            │ FIN: Autenticación rechazada                │
            │ Estado: NO AUTENTICADO                      │
            │ Acción: Cliente debe hacer login            │
            └─────────────────────────────────────────────┘
```

**Estados posibles en verificación:**
- **VÁLIDO Y NO EXPIRADO**: Token aceptado, usuario autenticado
- **EXPIRADO**: Token rechazado, usuario debe hacer login de nuevo
- **INVÁLIDO**: Token manipulado o firma incorrecta, usuario debe hacer login
- **MALFORMADO**: Formato incorrecto, usuario debe hacer login

---

### Diagrama de Estados del Token (Lifecycle)

```
                    generateToken()
                          │
                          ▼
          ┌───────────────────────────────┐
          │      TOKEN GENERADO           │
          │   Estado: VÁLIDO (FRESH)      │
          │   Edad: 0h                    │
          │   Tiempo restante: 15h        │
          └───────────────┬───────────────┘
                          │
                   (tiempo transcurre)
                          │
                          ▼
          ┌───────────────────────────────┐
          │      TOKEN ACTIVO             │
          │   Estado: VÁLIDO (ACTIVE)     │
          │   Edad: 0-15h                 │
          │   Tiempo restante: 15h-0h     │
          │   ✅ verifyToken() retorna OK │
          └───────────────┬───────────────┘
                          │
                  (15h pasan desde iat)
                          │
                          ▼
          ┌───────────────────────────────┐
          │      TOKEN EXPIRADO           │
          │   Estado: EXPIRADO            │
          │   Edad: > 15h                 │
          │   Tiempo restante: 0h         │
          │   ❌ verifyToken() lanza      │
          │      TokenExpiredError        │
          └───────────────────────────────┘
                          │
                          ▼
              (Token descartado, requiere login)


                    ┌──────────────────┐
                    │  TOKEN INVÁLIDO  │ ◄─── [manipulación detectada]
                    │  Estado: INVÁLIDO│
                    │  ❌ verifyToken() │
                    │     lanza error   │
                    └──────────────────┘
```

---
 
## Criterios de aceptación (root)

### CA-1: Instalación de Dependencias
**DADO** un proyecto Node.js con package.json configurado  
**CUANDO** se ejecuta el comando de instalación de JWT  
**ENTONCES**:
- [ ] `jsonwebtoken` versión ^9.0.0 o superior está instalado como dependencia de producción
- [ ] `@types/jsonwebtoken` está instalado como dependencia de desarrollo
- [ ] Las dependencias aparecen en `package.json` correctamente
- [ ] `package-lock.json` se actualiza sin conflictos
- [ ] El comando `npm list jsonwebtoken` confirma la instalación exitosa

**Comando de instalación:**
```bash
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

---

### CA-2: Creación del Archivo jwt.ts
**DADO** la estructura de carpetas del proyecto  
**CUANDO** se crea el archivo de utilidades JWT  
**ENTONCES**:
- [ ] Existe archivo en ruta exacta: `src/utils/jwt.ts`
- [ ] El archivo contiene comentario de módulo siguiendo patrón de `password.ts`
- [ ] El archivo importa correctamente: `import * as jwt from 'jsonwebtoken';`
- [ ] El archivo exporta al menos 2 funciones: `generateToken` y `verifyToken`
- [ ] El archivo define interfaz TypeScript `JwtPayload` con campos `userId` y `email`
- [ ] El archivo compila sin errores TypeScript (`npm run build`)

**Estructura esperada del archivo:**
```typescript
/**
 * JWT Utility Module
 * 
 * Proporciona funciones para generación y verificación de JSON Web Tokens
 * [descripción detallada...]
 * 
 * @module utils/jwt
 */

import * as jwt from 'jsonwebtoken';

// Interfaces
export interface JwtPayload {
  userId: string;
  email: string;
}

// Funciones exportadas
export function generateToken(userId: string, email: string): string { /* ... */ }
export function verifyToken(token: string): JwtPayload & jwt.JwtPayload { /* ... */ }
```

---

### CA-3: Función generateToken() - Implementación Básica
**DADO** un userId y email válidos  
**CUANDO** se llama a `generateToken(userId, email)`  
**ENTONCES**:
- [ ] La función retorna un string no vacío
- [ ] El string retornado tiene formato JWT válido: 3 secciones separadas por `.`
- [ ] El token puede ser decodificado con `jwt.decode()` sin errores
- [ ] El payload decodificado contiene `userId` con el valor exacto proporcionado
- [ ] El payload decodificado contiene `email` con el valor exacto proporcionado
- [ ] El payload decodificado contiene campo `iat` (issued at) con timestamp actual
- [ ] El payload decodificado contiene campo `exp` (expiration) con timestamp `iat + 15 horas`
- [ ] La función es determinista: mismo input NO genera el mismo token (debido a `iat` dinámico)

**Ejemplo de uso:**
```typescript
const token = generateToken('123e4567-e89b-12d3-a456-426614174000', 'user@example.com');
console.log(token); 
// Output esperado: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDk2MDE2MjcsImV4cCI6MTcwOTY1NTYyN30.XYZ..."
```

---

### CA-4: Función generateToken() - Uso de JWT_SECRET
**DADO** una variable de entorno `JWT_SECRET` configurada  
**CUANDO** se genera un token  
**ENTONCES**:
- [ ] La función lee `JWT_SECRET` desde `process.env.JWT_SECRET`
- [ ] Si `JWT_SECRET` es `undefined` o vacío, lanza error claro: `'JWT_SECRET is not defined in environment variables'`
- [ ] Si `JWT_SECRET` tiene menos de 32 caracteres, lanza error: `'JWT_SECRET must be at least 32 characters long'`
- [ ] El token generado está firmado con el valor de `JWT_SECRET`
- [ ] La firma puede ser verificada usando el mismo `JWT_SECRET`
- [ ] La firma NO puede ser verificada usando un `JWT_SECRET` diferente

**Validación de seguridad:**
```typescript
// ❌ Esto debe fallar:
process.env.JWT_SECRET = 'short';
generateToken('user123', 'user@test.com'); // throw Error

// ✅ Esto debe funcionar:
process.env.JWT_SECRET = 'my-super-secret-key-with-at-least-32-characters-for-security';
generateToken('user123', 'user@test.com'); // retorna token válido
```

---

### CA-5: Función generateToken() - Expiración de 15 Horas
**DADO** un token recién generado  
**CUANDO** se decodifica el token  
**ENTONCES**:
- [ ] El campo `exp` existe en el payload
- [ ] El campo `exp` es un número (timestamp Unix en segundos)
- [ ] La diferencia entre `exp` y `iat` es exactamente 54000 segundos (15 horas)
- [ ] `exp - iat === 54000` ✅
- [ ] La configuración usa la notación `expiresIn: '15h'` en `jwt.sign()`

**Cálculo esperado:**
```
15 horas = 15 × 60 minutos/hora × 60 segundos/minuto = 54,000 segundos
```

**Verificación:**
```typescript
const token = generateToken('user123', 'user@example.com');
const decoded = jwt.decode(token) as jwt.JwtPayload;

console.log(decoded.iat); // Ej: 1709601627 (5 marzo 2026, 10:00:27 AM)
console.log(decoded.exp); // Ej: 1709655627 (6 marzo 2026, 01:00:27 AM)
console.log(decoded.exp! - decoded.iat!); // Debe ser: 54000 ✅
```

---

### CA-6: Función generateToken() - Validación de Entrada
**DADO** parámetros inválidos  
**CUANDO** se llama a `generateToken()` con valores incorrectos  
**ENTONCES**:

| Input                              | Comportamiento Esperado                                   | Validación |
|------------------------------------|-----------------------------------------------------------|------------|
| `generateToken('', 'user@test.com')` | Lanza Error: 'userId cannot be empty'                   | [ ]        |
| `generateToken('user123', '')`      | Lanza Error: 'email cannot be empty'                     | [ ]        |
| `generateToken(null as any, 'email')` | Lanza Error: 'userId cannot be empty'                   | [ ]        |
| `generateToken('id', undefined as any)` | Lanza Error: 'email cannot be empty'                  | [ ]        |
| `generateToken('  ', 'email')`      | Lanza Error: 'userId cannot be empty' (trim validado)    | [ ]        |
| `generateToken('id', '  ')`         | Lanza Error: 'email cannot be empty' (trim validado)     | [ ]        |
| `generateToken('valid-id', 'valid@email.com')` | Retorna token exitosamente            | [ ]        |

**Nota:** Las validaciones deben ejecutarse ANTES de llamar a `jwt.sign()`.

---

### CA-7: Función verifyToken() - Verificación Exitosa
**DADO** un token válido y no expirado  
**CUANDO** se llama a `verifyToken(token)`  
**ENTONCES**:
- [ ] La función retorna un objeto (no lanza error)
- [ ] El objeto retornado contiene propiedad `userId` con valor correcto
- [ ] El objeto retornado contiene propiedad `email` con valor correcto
- [ ] El objeto retornado contiene propiedad `iat` (número)
- [ ] El objeto retornado contiene propiedad `exp` (número)
- [ ] El tipo de retorno es `JwtPayload & jwt.JwtPayload` (combina ambas interfaces)
- [ ] La función NO modifica el token original

**Ejemplo de flujo exitoso:**
```typescript
// Paso 1: Generar token
const token = generateToken('user-uuid-123', 'john@example.com');

// Paso 2: Verificar inmediatamente (token fresco, no expirado)
const payload = verifyToken(token);

// Paso 3: Aserciones
console.log(payload.userId);  // 'user-uuid-123' ✅
console.log(payload.email);   // 'john@example.com' ✅
console.log(typeof payload.iat); // 'number' ✅
console.log(typeof payload.exp); // 'number' ✅
```

---

### CA-8: Función verifyToken() - Token Expirado
**DADO** un token cuyo campo `exp` es anterior a la hora actual  
**CUANDO** se llama a `verifyToken(token)`  
**ENTONCES**:
- [ ] La función lanza una excepción (no retorna valor)
- [ ] El error capturado es de tipo `jwt.TokenExpiredError`
- [ ] El mensaje de error contiene 'expired' o 'Token has expired'
- [ ] El error incluye información sobre `expiredAt` (fecha de expiración)
- [ ] La función NO retorna `null` ni `undefined`

**Simulación de token expirado:**
```typescript
// Token generado hace 16 horas (> 15 horas de TTL)
const expiredToken = jwt.sign(
  { userId: 'test', email: 'test@example.com' },
  process.env.JWT_SECRET!,
  { expiresIn: -1 } // Truco: expiración negativa para testing
);

// Intentar verificar
try {
  verifyToken(expiredToken);
  console.log('❌ NO DEBERÍA LLEGAR AQUÍ');
} catch (error) {
  console.log(error.name); // 'TokenExpiredError' ✅
  console.log(error.message); // 'jwt expired' ✅
}
```

**Nota:** En producción, esperar 15+ horas no es práctico para testing. Ver CA-11 para estrategias de prueba.

---

### CA-9: Función verifyToken() - Token Inválido o Manipulado
**DADO** un token con firma incorrecta, payload alterado o formato malformado  
**CUANDO** se llama a `verifyToken(token)`  
**ENTONCES**:
- [ ] La función lanza una excepción de tipo `jwt.JsonWebTokenError`
- [ ] El mensaje de error indica el problema: 'invalid signature', 'malformed', 'invalid token'
- [ ] Casos específicos manejados:

| Escenario | Token de Prueba | Error Esperado |
|-----------|----------------|----------------|
| Firma incorrecta | Token generado con otro JWT_SECRET | `JsonWebTokenError: invalid signature` |
| Payload modificado | Token con payload alterado manualmente | `JsonWebTokenError: invalid signature` |
| Formato malformado | `'not.a.valid.jwt.format.at.all'` | `JsonWebTokenError: jwt malformed` |
| Token vacío | `''` | Error: 'Token is required' |
| Token sin secciones | `'invalidsinglestring'` | `JsonWebTokenError: jwt malformed` |

**Ejemplo de verificación de manipulación:**
```typescript
const validToken = generateToken('user123', 'user@example.com');

// Manipular token (cambiar un carácter en la firma)
const manipulatedToken = validToken.slice(0, -5) + 'XXXXX';

try {
  verifyToken(manipulatedToken);
  console.log('❌ NO DEBERÍA LLEGAR AQUÍ');
} catch (error) {
  console.log(error.name); // 'JsonWebTokenError' ✅
  console.log(error.message); // 'invalid signature' ✅
}
```

---

### CA-10: Función verifyToken() - Validación de Entrada
**DADO** parámetros inválidos  
**CUANDO** se llama a `verifyToken()` con valores incorrectos  
**ENTONCES**:

| Input                     | Comportamiento Esperado                         | Validación |
|---------------------------|-------------------------------------------------|------------|
| `verifyToken('')`         | Lanza Error: 'Token is required'                | [ ]        |
| `verifyToken(null as any)` | Lanza Error: 'Token is required'               | [ ]        |
| `verifyToken(undefined as any)` | Lanza Error: 'Token is required'          | [ ]        |
| `verifyToken('  ')`       | Lanza Error: 'Token is required' (trim aplicado) | [ ]        |
| `verifyToken('valid.jwt.token')` | Procesa verificación (puede lanzar JsonWebTokenError si inválido) | [ ]        |

**Nota:** Las validaciones básicas deben ejecutarse ANTES de llamar a `jwt.verify()`.

---

### CA-11: Testing Manual Completo
**DADO** el módulo JWT implementado completamente  
**CUANDO** se ejecutan pruebas manuales de integración  
**ENTONCES** los siguientes casos de prueba pasan:

#### ✅ Test 1: Ciclo Completo Exitoso
```typescript
// 1. Generar token
const token = generateToken('uuid-test-123', 'test@example.com');
console.log('Token generado:', token.substring(0, 50) + '...');

// 2. Verificar inmediatamente
const payload = verifyToken(token);
console.log('✅ userId:', payload.userId === 'uuid-test-123');
console.log('✅ email:', payload.email === 'test@example.com');
console.log('✅ iat presente:', typeof payload.iat === 'number');
console.log('✅ exp presente:', typeof payload.exp === 'number');
console.log('✅ Duración:', (payload.exp! - payload.iat!) === 54000);
```
- [ ] Todos los console.log muestran `true` o valores correctos

#### ✅ Test 2: Token Expirado
```typescript
// Generar token con expiración de 1 segundo para testing
const shortLivedToken = jwt.sign(
  { userId: 'test', email: 'test@test.com' },
  process.env.JWT_SECRET!,
  { expiresIn: '1s' }
);

// Esperar 2 segundos
setTimeout(() => {
  try {
    verifyToken(shortLivedToken);
    console.log('❌ FALLÓ: Debería haber lanzado error');
  } catch (error) {
    console.log('✅ Token expirado detectado:', error.message);
  }
}, 2000);
```
- [ ] Captura error de token expirado correctamente

#### ✅ Test 3: Token Manipulado
```typescript
const token = generateToken('user123', 'user@test.com');
const parts = token.split('.');
const manipulated = parts[0] + '.' + parts[1] + '.FAKE_SIGNATURE';

try {
  verifyToken(manipulated);
  console.log('❌ FALLÓ: Debería rechazar firma inválida');
} catch (error) {
  console.log('✅ Firma inválida detectada:', error.message);
}
```
- [ ] Detecta manipulación de firma

#### ✅ Test 4: JWT_SECRET Incorrecto
```typescript
const token = generateToken('user123', 'user@test.com');

// Cambiar JWT_SECRET temporalmente
const originalSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'different-secret-key-that-wont-match-original';

try {
  verifyToken(token);
  console.log('❌ FALLÓ: Debería rechazar con secret diferente');
} catch (error) {
  console.log('✅ Secret incorrecto detectado:', error.message);
}

// Restaurar secret original
process.env.JWT_SECRET = originalSecret;
```
- [ ] Rechaza tokens firmados con diferentes secretos

#### ✅ Test 5: Validaciones de Entrada
```typescript
const testCases = [
  { fn: () => generateToken('', 'email@test.com'), expected: 'userId cannot be empty' },
  { fn: () => generateToken('user', ''), expected: 'email cannot be empty' },
  { fn: () => verifyToken(''), expected: 'Token is required' },
];

testCases.forEach((test, idx) => {
  try {
    test.fn();
    console.log(`❌ Test ${idx + 1} FALLÓ: No lanzó error`);
  } catch (error) {
    console.log(`✅ Test ${idx + 1}: ${error.message}`);
  }
});
```
- [ ] Todas las validaciones de entrada funcionan correctamente

---

### CA-12: Documentación JSDoc Completa
**DADO** el archivo `jwt.ts` implementado  
**CUANDO** se revisa la documentación del código  
**ENTONCES**:
- [ ] Existe comentario de módulo al inicio del archivo con descripción del propósito
- [ ] La interfaz `JwtPayload` tiene JSDoc explicando cada propiedad
- [ ] `generateToken()` tiene JSDoc con:
  - Descripción de la función
  - `@param userId` con descripción y tipo
  - `@param email` con descripción y tipo
  - `@returns` explicando qué retorna
  - `@throws` listando posibles errores
  - Ejemplo de uso con bloque `@example`
- [ ] `verifyToken()` tiene JSDoc con:
  - Descripción de la función
  - `@param token` con descripción
  - `@returns` explicando el payload retornado
  - `@throws` listando errores: TokenExpiredError, JsonWebTokenError, etc.
  - Ejemplo de uso con bloque `@example`
- [ ] Comentarios inline explican lógica compleja (validaciones, manejo de errores)
- [ ] El estilo de documentación es consistente con `src/utils/password.ts`

**Ejemplo de estándar esperado:**
```typescript
/**
 * Genera un JSON Web Token firmado con información del usuario.
 * 
 * El token generado tiene una duración fija de 15 horas y contiene
 * el identificador único del usuario y su correo electrónico.
 * La firma utiliza la clave secreta definida en JWT_SECRET.
 * 
 * @param userId - Identificador único del usuario (UUID recomendado)
 * @param email - Correo electrónico del usuario
 * @returns Token JWT firmado en formato string (header.payload.signature)
 * @throws {Error} Si userId o email están vacíos
 * @throws {Error} Si JWT_SECRET no está configurado o es muy corto
 * 
 * @example
 * ```typescript
 * const token = generateToken('123e4567-e89b-12d3-a456-426614174000', 'user@example.com');
 * // token: "eyJhbGc...XYZ"
 * ```
 */
export function generateToken(userId: string, email: string): string {
  // ... implementación
}
```

---

### CA-13: Integración con Variables de Entorno
**DADO** el archivo `.env` del proyecto  
**CUANDO** se configura `JWT_SECRET`  
**ENTONCES**:
- [ ] Existe entrada `JWT_SECRET` en `.env.example` como template
- [ ] `.env.example` incluye comentario explicando: "Clave secreta para firmar JWT (mínimo 64 caracteres en producción)"
- [ ] El archivo `jwt.ts` lee `JWT_SECRET` correctamente desde `process.env.JWT_SECRET`
- [ ] Si `JWT_SECRET` no está definido, el módulo falla al intentar generar tokens (no falla al importar)
- [ ] En `.env` local, existe una entrada real de `JWT_SECRET` con longitud adecuada

**Contenido de .env.example esperado:**
```bash
# JWT Configuration
# Clave secreta para firmar tokens de autenticación
# IMPORTANTE: En producción usar mínimo 64 caracteres aleatorios
# Generar con: openssl rand -base64 64
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-64-chars
```

**Verificación de lectura:**
```typescript
console.log('JWT_SECRET configurado:', !!process.env.JWT_SECRET); // true ✅
console.log('Longitud:', process.env.JWT_SECRET?.length); // >= 32 ✅
```

---

### CA-14: Tipado TypeScript Completo
**DADO** el código TypeScript implementado  
**CUANDO** se compila el proyecto con `npm run build`  
**ENTONCES**:
- [ ] No existen errores de compilación TypeScript
- [ ] No existen warnings de tipos `any` implícitos
- [ ] La interfaz `JwtPayload` está correctamente exportada
- [ ] Las funciones tienen tipos de retorno explícitos (no inferidos)
- [ ] Los parámetros tienen tipos explícitos
- [ ] El tipo de retorno de `verifyToken` es `JwtPayload & jwt.JwtPayload` (combina ambas interfaces)
- [ ] IntelliSense/autocompletado funciona correctamente en VSCode al importar el módulo

**Verificación de tipos:**
```typescript
import { generateToken, verifyToken, JwtPayload } from './utils/jwt';

// TypeScript debe inferir tipos correctamente
const token: string = generateToken('id', 'email'); // ✅
const payload: JwtPayload = verifyToken(token); // ✅

// TypeScript debe detectar errores
const wrongToken: number = generateToken('id', 'email'); // ❌ Error de compilación
const wrongPayload: string = verifyToken(token); // ❌ Error de compilación
```

---

### CA-15: Manejo de Errores Específicos
**DADO** diferentes tipos de errores que pueden ocurrir  
**CUANDO** se capturan errores en un bloque try-catch  
**ENTONCES** se pueden distinguir los tipos de error:

```typescript
import * as jwt from 'jsonwebtoken';

try {
  const payload = verifyToken(someToken);
  console.log('Autenticado:', payload.email);
} catch (error) {
  if (error instanceof jwt.TokenExpiredError) {
    // Token expirado - pedir re-login
    console.log('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
    console.log('Expiró en:', error.expiredAt);
  } else if (error instanceof jwt.JsonWebTokenError) {
    // Token inválido - posible manipulación
    console.log('Token inválido. Acceso denegado.');
  } else if (error instanceof Error) {
    // Error de validación (token vacío, etc.)
    console.log('Error de validación:', error.message);
  }
}
```

**Verificaciones:**
- [ ] Los errores de `jsonwebtoken` se propagan correctamente sin ser envueltos
- [ ] Los errores de validación propia usan clase `Error` estándar
- [ ] Es posible distinguir entre token expirado vs token inválido
- [ ] Los mensajes de error son claros y útiles para debugging

---

### CA-16: Compatibilidad con Fases Posteriores
**DADO** que este módulo será usado en Fase 5 (Servicios) y Fase 7 (Middlewares)  
**CUANDO** se diseña la interfaz pública del módulo  
**ENTONCES**:
- [ ] Las funciones son exportadas correctamente y pueden ser importadas desde otros archivos
- [ ] La interfaz `JwtPayload` es exportada para uso en type annotations
- [ ] Los errores pueden ser capturados y manejados en capas superiores
- [ ] No existen dependencias circulares con otros módulos
- [ ] El módulo es **stateless** (no mantiene estado interno)
- [ ] Múltiples llamadas concurrentes a `generateToken` y `verifyToken` son seguras (thread-safe)

**Ejemplo de uso en Fase 5 (AuthService):**
```typescript
// src/services/auth.service.ts (Fase 5 - futuro)
import { generateToken } from '../utils/jwt';

async function login(email: string, password: string) {
  // ... validar credenciales ...
  
  // Usar módulo JWT
  const token = generateToken(user.id, user.email);
  
  return { token, user };
}
```

**Ejemplo de uso en Fase 7 (Middleware):**
```typescript
// src/infrastructure/middlewares/auth.middleware.ts (Fase 7 - futuro)
import { verifyToken } from '../../utils/jwt';
import * as jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // "Bearer TOKEN"
  
  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.email = payload.email;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}
```

---

### CA-17: Performance y Eficiencia
**DADO** un escenario de alta concurrencia  
**CUANDO** se generan y verifican tokens masivamente  
**ENTONCES**:
- [ ] `generateToken()` ejecuta en < 5ms en hardware moderno (sin I/O)
- [ ] `verifyToken()` ejecuta en < 5ms en hardware moderno (sin I/O)
- [ ] No existen memory leaks en ejecución prolongada
- [ ] Las funciones son síncronas (no requieren `async/await`)
- [ ] El módulo no realiza operaciones bloqueantes (I/O, network, timers)

**Nota:** Las operaciones criptográficas de HS256 son extremadamente rápidas comparadas con bcrypt (que usa 10 rounds por diseño).

---

### CA-18: Seguridad y Mejores Prácticas
**DADO** el contexto de un sistema de autenticación  
**CUANDO** se implementa el módulo JWT  
**ENTONCES** se siguen las mejores prácticas de seguridad:

- [ ] ✅ **Algoritmo HS256**: Se usa algoritmo simétrico recomendado para firmas con clave secreta
- [ ] ✅ **No hardcodear secretos**: `JWT_SECRET` siempre desde variables de entorno
- [ ] ✅ **Payload mínimo**: Solo `userId` y `email`, NO datos sensibles
- [ ] ✅ **Expiración obligatoria**: Todos los tokens tienen `exp` definido (15h)
- [ ] ✅ **Verificación estricta**: No se aceptan tokens sin firma o con firma débil
- [ ] ❌ **NO usar algoritmo "none"**: Librerías modernas lo deshabilitan por defecto
- [ ] ❌ **NO incluir contraseñas en payload**: Payload es decodificable sin clave
- [ ] ❌ **NO ignorar errores de verificación**: Siempre propagar errores hacia arriba
- [ ] ✅ **Validaciones de entrada**: Prevenir inyecciones y valores vacíos
- [ ] ✅ **Mensajes de error informativos**: Facilitan debugging sin exponer datos sensibles

**Referencias de seguridad:**
- OWASP JWT Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
- RFC 7519 (JWT Standard): https://datatracker.ietf.org/doc/html/rfc7519

---
 
## Trazabilidad

### Referencias al Plan de Desarrollo

**Documento fuente:** [PLAN_DESARROLLO.md](PLAN_DESARROLLO.md)

**Fase correspondiente:** Fase 4 - Módulo de JWT

**Tareas específicas:**

| Tarea | Descripción | Estado en ONE_SPEC |
|-------|-------------|---------------------|
| **4.1** | Configurar JWT | ✅ Cubierto en CA-1, CA-2, CA-13 |
| **4.1.1** | Instalar `jsonwebtoken` y `@types/jsonwebtoken` | ✅ CA-1 (Instalación de dependencias) |
| **4.1.2** | Crear archivo `src/utils/jwt.ts` | ✅ CA-2 (Creación del archivo) |
| **4.2** | Implementar generación de tokens | ✅ Cubierto en CA-3 a CA-6 |
| **4.2.1** | Crear función `generateToken(userId, email)` | ✅ CA-3 (Implementación básica) |
| **4.2.2** | Configurar expiración de 15 horas (`expiresIn: '15h'`) | ✅ CA-5 (Expiración de 15 horas) |
| **4.2.3** | Incluir payload: `{ userId, email }` | ✅ CA-3 (Payload en token) |
| **4.3** | Implementar verificación de tokens | ✅ Cubierto en CA-7 a CA-10 |
| **4.3.1** | Crear función `verifyToken(token)` | ✅ CA-7 (Verificación exitosa) |
| **4.3.2** | Manejar errores de token expirado | ✅ CA-8 (Token expirado) |
| **4.3.3** | Manejar errores de token inválido | ✅ CA-9 (Token inválido/manipulado) |

---

### Dependencias con Otras Fases

**Depende de (prerequisitos):**

| Fase | Descripción | Artefactos Requeridos | Estado |
|------|-------------|-----------------------|--------|
| **Fase 1.3** | Variables de entorno | `.env` configurado con estructura básica | ✅ Completado |
| **Fase 1.1** | Configuración TypeScript | `tsconfig.json` con compilador configurado | ✅ Completado |
| - | Librería dotenv | `dotenv` instalado y configurado en `index.ts` | ✅ Completado |

**Requerido por (dependientes):**

| Fase | Descripción | Uso del Módulo JWT | Impacto |
|------|-------------|---------------------|---------|
| **Fase 5.3** | Servicio de login | Llama a `generateToken()` después de validar credenciales | 🔴 Bloqueante |
| **Fase 7.1** | Middleware de autenticación | Llama a `verifyToken()` en cada petición protegida | 🔴 Bloqueante |
| **Fase 9.1** | Testing de flujo completo | Genera y verifica tokens en pruebas end-to-end | 🟡 Importante |

**Leyenda:**  
🔴 Bloqueante = No se puede iniciar sin completar esta fase  
🟡 Importante = Se puede iniciar pero no completar sin esta fase  
🟢 Opcional = No afecta el progreso

---

### Mapeo con Arquitectura Hexagonal

**Ubicación en capas:**

```
📦 src/
└── 🛠️ utils/           ← CAPA TRANSVERSAL (Utilities)
    ├── password.ts     ← Fase 3 ✅
    └── jwt.ts          ← Fase 4 (ESTE SPEC) 🎯
```

**Análisis de responsabilidades:**

| Aspecto | Clasificación | Justificación |
|---------|---------------|---------------|
| **Capa** | Utilities (Transversal) | No pertenece a Domain, Application ni Infrastructure específicamente |
| **Acoplamiento** | Bajo | Solo depende de librerías externas (`jsonwebtoken`) y variables de entorno |
| **Reutilización** | Alta | Usado en Application Layer (Use Cases) e Infrastructure Layer (Middlewares) |
| **Testabilidad** | Alta | Funciones puras sin estado, fácil de mockear |
| **Independencia** | Independiente de dominio | No conoce entidades User, repositorios ni casos de uso |

**Flujo de uso esperado:**

```
[HTTP Request con credenciales]
         │
         ▼
┌────────────────────────┐
│ Infrastructure Layer   │
│ AuthController.login() │◄──────────┐
└───────────┬────────────┘           │
            │                        │
            ▼                        │
┌────────────────────────┐           │
│ Application Layer      │           │
│ LoginUseCase.execute() │           │
└───────────┬────────────┘           │
            │                        │
            ▼                        │
┌────────────────────────┐           │
│ Infrastructure Layer   │           │
│ SupabaseUserRepository │           │
│ (validar credenciales) │           │
└───────────┬────────────┘           │
            │                        │
    [Credenciales válidas]           │
            │                        │
            ▼                        │
┌────────────────────────┐           │
│ 🛠️ UTILITIES (JWT)    │           │
│ generateToken()        │───────────┘
└────────────────────────┘
            │
            ▼
    [Token JWT retornado]
            │
            ▼
   [Respuesta HTTP 200]
```

---

### Checklist de Implementación (Resumen)

**Pre-requisitos:**
- [x] Fase 1 completada (Configuración inicial del proyecto)
- [x] Variables de entorno configuradas (`.env` con estructura)
- [x] TypeScript compilando sin errores

**Tareas de implementación:**
- [ ] Instalar dependencias: `npm install jsonwebtoken` y `npm install --save-dev @types/jsonwebtoken`
- [ ] Crear archivo `src/utils/jwt.ts` con estructura básica
- [ ] Definir interfaz `JwtPayload` con `userId` y `email`
- [ ] Implementar función `generateToken()` con:
  - [ ] Validación de parámetros de entrada
  - [ ] Validación de `JWT_SECRET` (existencia y longitud)
  - [ ] Generación de token con `jwt.sign()`
  - [ ] Configuración de expiración: `expiresIn: '15h'`
  - [ ] Documentación JSDoc completa
- [ ] Implementar función `verifyToken()` con:
  - [ ] Validación de token no vacío
  - [ ] Verificación con `jwt.verify()`
  - [ ] Manejo de `TokenExpiredError`
  - [ ] Manejo de `JsonWebTokenError`
  - [ ] Documentación JSDoc completa
- [ ] Agregar `JWT_SECRET` a `.env.example` con comentarios
- [ ] Configurar `JWT_SECRET` en `.env` local (mínimo 32 caracteres, recomendado 64)
- [ ] Ejecutar `npm run build` para verificar compilación TypeScript
- [ ] Realizar tests manuales (CA-11):
  - [ ] Test de ciclo completo exitoso
  - [ ] Test de token expirado
  - [ ] Test de token manipulado
  - [ ] Test de JWT_SECRET incorrecto
  - [ ] Test de validaciones de entrada
- [ ] Verificar todos los criterios de aceptación (CA-1 a CA-18)
- [ ] Commit con mensaje descriptivo: `feat: implement JWT module for authentication (Phase 4)`

**Post-implementación:**
- [ ] Documentar uso del módulo en README (opcional, puede hacerse en Fase 9)
- [ ] Preparar integración con Fase 5 (Servicios de autenticación)
- [ ] Preparar integración con Fase 7 (Middlewares de protección)

---

### Estimación de Tiempo

**Tiempo estimado de implementación:** 2-3 horas

**Desglose por tarea:**
| Tarea | Tiempo estimado | Complejidad |
|-------|-----------------|-------------|
| Instalación de dependencias | 5 minutos | Baja |
| Creación de archivo y estructura | 10 minutos | Baja |
| Implementación de `generateToken()` | 45 minutos | Media |
| Implementación de `verifyToken()` | 45 minutos | Media |
| Documentación JSDoc | 30 minutos | Baja |
| Configuración de variables de entorno | 10 minutos | Baja |
| Testing manual | 30 minutos | Media |
| Ajustes y refinamiento | 15 minutos | Baja |

**Factores que pueden aumentar el tiempo:**
- Depuración de errores de TypeScript
- Familiarización con la librería `jsonwebtoken` si no se ha usado antes
- Ajustes en validaciones según feedback de testing

---

### Criterios de Definición de Completado (Definition of Done)

Esta fase se considera **COMPLETADA** cuando:

✅ **Código:**
- [ ] Archivo `src/utils/jwt.ts` existe y compila sin errores
- [ ] Ambas funciones (`generateToken`, `verifyToken`) están implementadas
- [ ] Todas las validaciones de entrada están en su lugar
- [ ] Manejo de errores completo y diferenciado

✅ **Testing:**
- [ ] Todos los tests manuales de CA-11 pasan exitosamente
- [ ] Token generado puede ser verificado correctamente
- [ ] Tokens expirados son rechazados
- [ ] Tokens manipulados son detectados

✅ **Documentación:**
- [ ] JSDoc completo en todas las funciones públicas
- [ ] Comentarios inline en lógica compleja
- [ ] `.env.example` actualizado con `JWT_SECRET`

✅ **Integración:**
- [ ] Variables de entorno configuradas localmente
- [ ] Módulo puede ser importado desde otros archivos sin errores
- [ ] No existen dependencias circulares

✅ **Calidad:**
- [ ] Código sigue convenciones de TypeScript del proyecto
- [ ] Estilo consistente con otros módulos (`password.ts`)
- [ ] No existen warnings de TypeScript ni ESLint
- [ ] Commit realizado con mensaje descriptivo

✅ **Validación:**
- [ ] Al menos un revisor ha validado el código (si aplica)
- [ ] Todos los criterios de aceptación (CA-1 a CA-18) han sido verificados
- [ ] Se puede proceder a Fase 5 sin blockers

---

**Fin de ONE SPEC - Fase 4: Módulo de JWT**

**Próxima fase:** Fase 5 - Servicios de Autenticación (requiere este módulo completado)
