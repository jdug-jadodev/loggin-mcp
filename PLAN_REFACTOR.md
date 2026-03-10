# Plan de Refactorización - Clean Architecture

## Objetivo

Refactorizar el proyecto para garantizar un completo desacoplamiento siguiendo principios de Clean Architecture mediante:

1. **Puertos de Entrada**: Cada UseCase implementará una interfaz de entrada (port-in) para garantizar el desacoplamiento
2. **Separación de Responsabilidades**: Cada interfaz, función y clase tendrá su propio archivo

## Estado Actual

### Use Cases sin Puerto de Entrada
Actualmente los use cases son clases concretas sin interfaz:
- `CheckEmailExistsUseCase` 
- `CreatePasswordUseCase`
- `LoginUseCase`
- `RegisterEmailUseCase`

### Archivos con Múltiples Exportaciones
Los siguientes archivos exportan múltiples elementos y deben separarse:

#### 1. `utils/jwt.ts` (4 funciones + 2 interfaces)
- `generateToken()`
- `verifyToken()`
- `generatePasswordCreationToken()`
- `generatePasswordResetToken()`
- `JwtPayload` interface
- `PasswordTokenPayload` interface

#### 2. `utils/password.ts` (3 funciones)
- `hashPassword()`
- `comparePassword()`
- `getSaltRounds()`

#### 3. `application/validator/EmailValidator.ts` (clase + 2 funciones legacy)
- `EmailValidator` class
- `isValidEmail()` function (legacy)
- `validateEmailOrThrow()` function (legacy)

#### 4. `application/validator/PasswordValidator.ts` (1 función)
- `validatePasswordStrength()` function

#### 5. `application/mapper/UserApplicationMapper.ts` (1 función)
- `toLoginResultDTO()` function

#### 6. `infrastructure/config/resend.ts` (3 exportaciones)
- `resend` client
- `RESEND_FROM_EMAIL` constant
- `APP_BASE_URL` constant

## Plan Detallado

---

## FASE 1: Crear Estructura de Puertos de Entrada

### 1.1 Crear directorio y archivos de puertos de entrada

**Archivos a crear en `src/domain/port/portin/`:**

#### `CheckEmailExistsUseCasePort.ts`
```typescript
import { CheckEmailInputDTO } from '../../../application/dto/CheckEmailInputDTO';
import { EmailCheckResultDTO } from '../../../application/dto/EmailCheckResultDTO';

export interface CheckEmailExistsUseCasePort {
  execute(input: CheckEmailInputDTO): Promise<EmailCheckResultDTO>;
}
```

#### `CreatePasswordUseCasePort.ts`
```typescript
import { CreatePasswordInputDTO } from '../../../application/dto/CreatePasswordInputDTO';
import { CreatePasswordResultDTO } from '../../../application/dto/CreatePasswordResultDTO';

export interface CreatePasswordUseCasePort {
  execute(input: CreatePasswordInputDTO): Promise<CreatePasswordResultDTO>;
}
```

#### `LoginUseCasePort.ts`
```typescript
import { LoginInputDTO } from '../../../application/dto/LoginInputDTO';
import { LoginResultDTO } from '../../../application/dto/LoginResultDTO';

export interface LoginUseCasePort {
  execute(input: LoginInputDTO): Promise<LoginResultDTO>;
}
```

#### `RegisterEmailUseCasePort.ts`
```typescript
import { RegisterEmailInputDTO } from '../../../application/dto/RegisterEmailInputDTO';
import { RegisterEmailResultDTO } from '../../../application/dto/RegisterEmailResultDTO';

export interface RegisterEmailUseCasePort {
  execute(input: RegisterEmailInputDTO): Promise<RegisterEmailResultDTO>;
}
```

### 1.2 Crear DTOs de entrada faltantes

**Archivos a crear en `src/application/dto/`:**

#### `CheckEmailInputDTO.ts`
```typescript
export interface CheckEmailInputDTO {
  email: string;
}
```

---

## FASE 2: Actualizar Use Cases para Implementar Puertos

### 2.1 CheckEmailExistsUseCase
**Archivo:** `src/application/usecase/CheckEmailExistsUseCase.ts`

**Cambios:**
- Implementar `CheckEmailExistsUseCasePort`
- Cambiar firma del método `execute()` para recibir `CheckEmailInputDTO`
- Mantener inyección de `UserRepositoryPort`

### 2.2 CreatePasswordUseCase
**Archivo:** `src/application/usecase/CreatePasswordUseCase.ts`

**Cambios:**
- Implementar `CreatePasswordUseCasePort`
- Cambiar firma del método `execute()` para recibir `CreatePasswordInputDTO`
- Mantener inyección de `UserRepositoryPort`

### 2.3 LoginUseCase
**Archivo:** `src/application/usecase/LoginUseCase.ts`

**Cambios:**
- Implementar `LoginUseCasePort`
- Cambiar firma del método `execute()` para recibir `LoginInputDTO` (ya existe)
- Mantener inyección de `UserRepositoryPort`

### 2.4 RegisterEmailUseCase
**Archivo:** `src/application/usecase/RegisterEmailUseCase.ts`

**Cambios:**
- Implementar `RegisterEmailUseCasePort`
- Ya recibe `RegisterEmailInputDTO`, solo agregar implementación de interfaz
- Mantener inyecciones actuales

---

## FASE 3: Separar Funciones de JWT en Archivos Individuales

### 3.1 Crear estructura de directorios
```
src/utils/jwt/
  ├── types/
  │   ├── JwtPayload.ts
  │   └── PasswordTokenPayload.ts
  ├── generateToken.ts
  ├── verifyToken.ts
  ├── generatePasswordCreationToken.ts
  ├── generatePasswordResetToken.ts
  └── index.ts (barrel export)
```

### 3.2 Contenido de nuevos archivos

#### `src/utils/jwt/types/JwtPayload.ts`
```typescript
export interface JwtPayload {
  userId: string;
  email: string;
}
```

#### `src/utils/jwt/types/PasswordTokenPayload.ts`
```typescript
import * as jwt from 'jsonwebtoken';

export interface PasswordTokenPayload extends jwt.JwtPayload {
  userId: string;
  email: string;
  type: 'password_creation' | 'password_reset';
  jti: string;
}
```

#### `src/utils/jwt/generateToken.ts`
```typescript
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from './types/JwtPayload';

const TOKEN_EXPIRATION = '15h';
const MIN_SECRET_LENGTH = 32;

export function generateToken(userId: string, email: string): string {
  // ... contenido de la función actual
}
```

#### `src/utils/jwt/verifyToken.ts`
```typescript
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from './types/JwtPayload';

export function verifyToken(token: string): JwtPayload & jwt.JwtPayload {
  // ... contenido de la función actual
}
```

#### `src/utils/jwt/generatePasswordCreationToken.ts`
```typescript
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { PasswordTokenPayload } from './types/PasswordTokenPayload';

const MIN_SECRET_LENGTH = 32;

export function generatePasswordCreationToken(userId: string, email: string): string {
  // ... contenido de la función actual
}
```

#### `src/utils/jwt/generatePasswordResetToken.ts`
```typescript
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { PasswordTokenPayload } from './types/PasswordTokenPayload';

const MIN_SECRET_LENGTH = 32;

export function generatePasswordResetToken(userId: string, email: string): string {
  // ... contenido de la función actual
}
```

#### `src/utils/jwt/index.ts`
```typescript
export { generateToken } from './generateToken';
export { verifyToken } from './verifyToken';
export { generatePasswordCreationToken } from './generatePasswordCreationToken';
export { generatePasswordResetToken } from './generatePasswordResetToken';
export { JwtPayload } from './types/JwtPayload';
export { PasswordTokenPayload } from './types/PasswordTokenPayload';
```

### 3.3 Eliminar archivo original
- Eliminar `src/utils/jwt.ts`

---

## FASE 4: Separar Funciones de Password en Archivos Individuales

### 4.1 Crear estructura de directorios
```
src/utils/password/
  ├── hashPassword.ts
  ├── comparePassword.ts
  ├── getSaltRounds.ts
  └── index.ts (barrel export)
```

### 4.2 Contenido de nuevos archivos

#### `src/utils/password/hashPassword.ts`
```typescript
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  // ... contenido de la función actual
}
```

#### `src/utils/password/comparePassword.ts`
```typescript
import * as bcrypt from 'bcrypt';

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  // ... contenido de la función actual
}
```

#### `src/utils/password/getSaltRounds.ts`
```typescript
const SALT_ROUNDS = 10;

export function getSaltRounds(): number {
  return SALT_ROUNDS;
}
```

#### `src/utils/password/index.ts`
```typescript
export { hashPassword } from './hashPassword';
export { comparePassword } from './comparePassword';
export { getSaltRounds } from './getSaltRounds';
```

### 4.3 Eliminar archivo original
- Eliminar `src/utils/password.ts`

---

## FASE 5: Separar EmailValidator

### 5.1 Crear estructura
```
src/application/validator/email/
  ├── EmailValidator.ts (clase)
  ├── isValidEmail.ts (función legacy)
  ├── validateEmailOrThrow.ts (función legacy)
  └── index.ts
```

### 5.2 Contenido de nuevos archivos

#### `src/application/validator/email/EmailValidator.ts`
```typescript
import { ValidationError } from '../../exception/ValidationError';

export class EmailValidator {
  private readonly emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  validate(email: string): void {
    // ... contenido actual
  }
}
```

#### `src/application/validator/email/isValidEmail.ts`
```typescript
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}
```

#### `src/application/validator/email/validateEmailOrThrow.ts`
```typescript
import { isValidEmail } from './isValidEmail';

export function validateEmailOrThrow(email: string): void {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }
}
```

#### `src/application/validator/email/index.ts`
```typescript
export { EmailValidator } from './EmailValidator';
export { isValidEmail } from './isValidEmail';
export { validateEmailOrThrow } from './validateEmailOrThrow';
```

### 5.3 Eliminar archivo original
- Eliminar `src/application/validator/EmailValidator.ts`

---

## FASE 6: Separar PasswordValidator

### 6.1 Crear estructura
```
src/application/validator/password/
  ├── validatePasswordStrength.ts
  └── index.ts
```

### 6.2 Contenido de nuevos archivos

#### `src/application/validator/password/validatePasswordStrength.ts`
```typescript
import { WeakPasswordError } from '../../exception/WeakPasswordError';

export function validatePasswordStrength(password: string, email?: string): void {
  // ... contenido actual
}
```

#### `src/application/validator/password/index.ts`
```typescript
export { validatePasswordStrength } from './validatePasswordStrength';
```

### 6.3 Eliminar archivo original
- Eliminar `src/application/validator/PasswordValidator.ts`

---

## FASE 7: Separar UserApplicationMapper

### 7.1 Crear estructura
```
src/application/mapper/user/
  ├── toLoginResultDTO.ts
  └── index.ts
```

### 7.2 Contenido de nuevos archivos

#### `src/application/mapper/user/toLoginResultDTO.ts`
```typescript
import { User } from '../../../domain/entity/User';
import { LoginResultDTO } from '../../dto/LoginResultDTO';

export function toLoginResultDTO(user: User, token: string): LoginResultDTO {
  // ... contenido actual
}
```

#### `src/application/mapper/user/index.ts`
```typescript
export { toLoginResultDTO } from './toLoginResultDTO';
```

### 7.3 Eliminar archivo original
- Eliminar `src/application/mapper/UserApplicationMapper.ts`

---

## FASE 8: Separar Configuración de Resend

### 8.1 Crear estructura
```
src/infrastructure/config/resend/
  ├── resendClient.ts
  ├── resendConfig.ts
  └── index.ts
```

### 8.2 Contenido de nuevos archivos

#### `src/infrastructure/config/resend/resendClient.ts`
```typescript
import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY || '';
export const resend = new Resend(apiKey);
```

#### `src/infrastructure/config/resend/resendConfig.ts`
```typescript
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || '';
export const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
```

#### `src/infrastructure/config/resend/index.ts`
```typescript
export { resend } from './resendClient';
export { RESEND_FROM_EMAIL, APP_BASE_URL } from './resendConfig';
```

### 8.3 Eliminar archivo original
- Eliminar `src/infrastructure/config/resend.ts`

---

## FASE 9: Actualizar Imports en Todo el Proyecto

### 9.1 Archivos que importan JWT utils
- `src/application/usecase/LoginUseCase.ts`
- `src/application/usecase/RegisterEmailUseCase.ts`
- `src/infrastructure/middleware/auth.middleware.ts`
- Scripts en `src/utils/scripts/`

**Cambiar:**
```typescript
import { generateToken, verifyToken } from '../../utils/jwt';
```

**Por:**
```typescript
import { generateToken, verifyToken } from '../../utils/jwt';
// El import path no cambia gracias al barrel export index.ts
```

### 9.2 Archivos que importan Password utils
- `src/application/usecase/CreatePasswordUseCase.ts`
- `src/application/usecase/LoginUseCase.ts`
- Scripts en `src/utils/scripts/`

**Cambiar:**
```typescript
import { hashPassword, comparePassword } from '../../utils/password';
```

**Por:**
```typescript
import { hashPassword, comparePassword } from '../../utils/password';
// El import path no cambia gracias al barrel export index.ts
```

### 9.3 Archivos que importan EmailValidator
- `src/application/usecase/CheckEmailExistsUseCase.ts`
- `src/application/usecase/CreatePasswordUseCase.ts`
- `src/application/usecase/LoginUseCase.ts`

**Cambiar:**
```typescript
import { isValidEmail } from '../validator/EmailValidator';
```

**Por:**
```typescript
import { isValidEmail } from '../validator/email';
```

### 9.4 Archivos que importan PasswordValidator
- `src/application/usecase/CreatePasswordUseCase.ts`

**Cambiar:**
```typescript
import { validatePasswordStrength } from '../validator/PasswordValidator';
```

**Por:**
```typescript
import { validatePasswordStrength } from '../validator/password';
```

### 9.5 Archivos que importan UserApplicationMapper
- `src/application/usecase/LoginUseCase.ts`

**Cambiar:**
```typescript
import { toLoginResultDTO } from '../mapper/UserApplicationMapper';
```

**Por:**
```typescript
import { toLoginResultDTO } from '../mapper/user';
```

### 9.6 Archivos que importan Resend config
- `src/infrastructure/email/adapter/ResendEmailAdapter.ts`
- `src/infrastructure/email/templates/password-creation.template.ts`
- `src/infrastructure/email/templates/password-reset.template.ts`

**Cambiar:**
```typescript
import { resend, RESEND_FROM_EMAIL, APP_BASE_URL } from '../../config/resend';
```

**Por:**
```typescript
import { resend, RESEND_FROM_EMAIL, APP_BASE_URL } from '../../config/resend';
// El import path no cambia gracias al barrel export index.ts
```

---

## FASE 10: Actualizar Referencias en Controllers y Routes

### 10.1 AuthController
**Archivo:** `src/infrastructure/controller/AuthController.ts`

**Cambios:**
- Cambiar tipo de las propiedades de use cases concretos a interfaces de puerto
- Actualizar constructor para recibir las interfaces

**Antes:**
```typescript
constructor(
  private readonly checkEmailExistsUseCase: CheckEmailExistsUseCase,
  private readonly createPasswordUseCase: CreatePasswordUseCase,
  private readonly loginUseCase: LoginUseCase
)
```

**Después:**
```typescript
constructor(
  private readonly checkEmailExistsUseCase: CheckEmailExistsUseCasePort,
  private readonly createPasswordUseCase: CreatePasswordUseCasePort,
  private readonly loginUseCase: LoginUseCasePort
)
```

### 10.2 auth.routes.ts
**Archivo:** `src/infrastructure/routes/auth.routes.ts`

**Cambios:**
- Actualizar imports para usar interfaces de puerto
- Las instanciaciones de use cases permanecen iguales (clases concretas)
- El controller recibe las interfaces (polimorfismo)

---

## FASE 11: Testing y Validación

### 11.1 Pruebas de compilación
```bash
npm run build
```

### 11.2 Pruebas de ejecución
```bash
npm start
```

### 11.3 Verificar imports
- Revisar que no haya imports rotos
- Verificar que todos los barrel exports funcionen correctamente

### 11.4 Pruebas funcionales
- Probar endpoint de registro
- Probar endpoint de login
- Probar endpoint de check email
- Probar endpoint de crear password

---

## FASE 12: Actualizar tsconfig.json (si es necesario)

Si hay problemas con los paths, verificar configuración de `paths` en `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@application/*": ["src/application/*"],
      "@domain/*": ["src/domain/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

---

## Beneficios Esperados

### 1. Desacoplamiento Total
- Los use cases ahora dependen de abstracciones (interfaces) no de implementaciones
- Facilita testing con mocks e inyección de dependencias

### 2. Principio de Responsabilidad Única
- Cada archivo tiene una única responsabilidad
- Más fácil de mantener y entender

### 3. Mejor Organización
- Estructura de carpetas más clara
- Fácil localizar funcionalidad específica

### 4. Facilita Testing
- Cada función/clase puede testearse de forma aislada
- Los use cases pueden mockearse mediante sus interfaces

### 5. Escalabilidad
- Agregar nuevos use cases sigue un patrón claro
- Agregar nuevas implementaciones no afecta el código existente

---

## Orden de Ejecución Recomendado

1. **FASE 1-2**: Crear puertos de entrada y actualizar use cases (crítico)
2. **FASE 3-4**: Separar utils JWT y Password (alto impacto)
3. **FASE 5-7**: Separar validators y mappers (mejora organización)
4. **FASE 8**: Separar config Resend (menor prioridad)
5. **FASE 9**: Actualizar todos los imports
6. **FASE 10**: Actualizar controllers y routes
7. **FASE 11**: Testing exhaustivo
8. **FASE 12**: Ajustes finales si necesario

---

## Checklist de Finalización

- [ ] Todos los use cases implementan una interfaz de puerto de entrada
- [ ] Todas las funciones están en archivos separados
- [ ] Todos los barrel exports (`index.ts`) están creados
- [ ] Todos los imports están actualizados
- [ ] El proyecto compila sin errores (`npm run build`)
- [ ] Todos los endpoints funcionan correctamente
- [ ] No quedan archivos antiguos sin usar
- [ ] La documentación está actualizada

---

## Archivos a Eliminar al Final

- `src/utils/jwt.ts`
- `src/utils/password.ts`
- `src/application/validator/EmailValidator.ts`
- `src/application/validator/PasswordValidator.ts`
- `src/application/mapper/UserApplicationMapper.ts`
- `src/infrastructure/config/resend.ts`

---

## Notas Adicionales

- Mantener commits atómicos por cada fase
- Hacer testing después de cada fase importante
- Si una fase falla, revertir antes de continuar
- Documentar cualquier desviación del plan en este archivo

---

_Plan de refactorización creado el: ${new Date().toISOString().split('T')[0]}_
_Basado en: informe-exploracion.md y análisis completo del proyecto_


######################################################################
# COMPLETADO: PLAN DE REFACTORIZACIÓN - CLEAN ARCHITECTURE
######################################################################