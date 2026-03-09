# One Spec (Root Spec)

# FASE 5: Separación del EmailValidator en Clean Architecture

## Objetivo

Refactorizar el módulo `EmailValidator` para cumplir con el **Principio de Responsabilidad Única (SRP)** y mejorar la mantenibilidad del código, separando la clase `EmailValidator` y las funciones legacy (`isValidEmail` y `validateEmailOrThrow`) en archivos individuales con una estructura modular clara.

**Resultado esperado:** Una estructura de directorio `email/` dentro de `src/application/validator/` que contenga archivos independientes para cada responsabilidad, con un barrel export centralizado que facilite las importaciones.

## Alcance / No alcance

### ✅ Alcance (Qué SÍ incluye)

1. **Creación de nueva estructura de directorios:**
   - `src/application/validator/email/`
   - Subdirectorio conteniendo 4 archivos individuales + 1 barrel export

2. **Migración de código existente:**
   - Clase `EmailValidator` → `email/EmailValidator.ts`
   - Función `isValidEmail()` → `email/isValidEmail.ts`
   - Función `validateEmailOrThrow()` → `email/validateEmailOrThrow.ts`
   - Barrel export → `email/index.ts`

3. **Actualización de importaciones:**
   - `RegisterEmailUseCase.ts`
   - `CheckEmailExistsUseCase.ts` (si aplica)
   - `CreatePasswordUseCase.ts` (si aplica)
   - `LoginUseCase.ts` (si aplica)

4. **Eliminación de archivo obsoleto:**
   - `src/application/validator/EmailValidator.ts`

### ❌ No Alcance (Qué NO incluye)

1. **Cambios en lógica de validación:** La funcionalidad interna de validación permanece idéntica
2. **Refactorización de otros validators:** `PasswordValidator` se aborda en FASE 6
3. **Cambios en DTOs o excepciones:** Solo restructuración de archivos
4. **Testing:** Las pruebas unitarias se mantienen o actualizan en fase posterior
5. **Optimización de regex:** Las expresiones regulares permanecen sin cambios

## Definiciones (lenguaje de dominio)

| Término | Definición |
|---------|-----------|
| **EmailValidator (clase)** | Clase responsable de validar formato de emails usando regex y lanzar `ValidationError` |
| **isValidEmail (legacy)** | Función legacy que retorna boolean para validación simple de email |
| **validateEmailOrThrow (legacy)** | Función legacy que valida email y lanza `Error` genérico si es inválido |
| **Barrel Export** | Archivo `index.ts` que re-exporta todos los módulos de un directorio para simplificar imports |
| **SRP (Single Responsibility Principle)** | Principio SOLID que establece que cada módulo debe tener una única razón para cambiar |
| **Clean Architecture** | Arquitectura que separa responsabilidades en capas con dependencias unidireccionales |
| **Validator** | Componente de la capa de aplicación responsable de validar datos de entrada |

## Principios / Reglas no negociables

### 1. **Preservación de Funcionalidad**
- ❗ **CRÍTICO:** La lógica de validación NO debe modificarse en ninguna línea de código
- ❗ **CRÍTICO:** Todos los imports existentes deben funcionar sin errores después de la refactorización

### 2. **Responsabilidad Única**
- ✅ Cada archivo debe contener **exactamente UN** componente exportable (clase o función)
- ✅ Un archivo = Una responsabilidad = Un motivo para cambiar

### 3. **Barrel Export Obligatorio**
- ✅ Debe existir `index.ts` como punto único de entrada al módulo
- ✅ Todos los componentes deben exportarse desde `index.ts`
- ✅ Los imports externos deben referenciar el directorio, no archivos internos

### 4. **Compatibilidad hacia atrás**
- ✅ Path de import cambia de `../validator/EmailValidator` a `../validator/email`
- ✅ Los nombres de las exportaciones permanecen idénticos
- ✅ No se rompe ningún código existente

### 5. **Convención de nombres**
- ✅ Nombres de archivo en camelCase coinciden con el export: `EmailValidator.ts` exporta `EmailValidator`
- ✅ Funciones legacy mantienen sus nombres originales por compatibilidad

### 6. **Orden de ejecución estricto**
- ❗ **CRÍTICO:** Primero crear nuevos archivos → Luego actualizar imports → Finalmente eliminar archivo antiguo
- ❗ **CRÍTICO:** No eliminar el archivo original hasta verificar que todo compila sin errores

## Límites

### Límites Técnicos

- **Alcance de refactorización:** Solo archivos dentro de `src/application/validator/`
- **Tipos de cambios permitidos:** Movimiento de código, creación de barrel exports, actualización de imports
- **No se modifica:** Ninguna línea de lógica de negocio en validators

### Límites de Impacto

- **Archivos afectados directamente:** Máximo 8 archivos (4 nuevos + 3-4 use cases)
- **Capas afectadas:** Solo Application Layer (validators y use cases)
- **No afecta:** Infrastructure, Domain, ni DTOs

### Límites de Dependencias

- **Dependencias permitidas para validators:**
  - ✅ Excepciones de `application/exception/`
  - ❌ NO puede depender de use cases
  - ❌ NO puede depender de repositories
  - ❌ NO puede depender de servicios externos

## Eventos y estados (visión raíz)

### Estado Inicial (Pre-refactorización)

```
[ESTADO: MONOLÍTICO]
📄 src/application/validator/EmailValidator.ts
   ├─ export class EmailValidator        ← 18 líneas
   ├─ export function isValidEmail()     ← 5 líneas
   └─ export function validateEmailOrThrow()  ← 5 líneas
   
👥 Consumidores:
   └─ RegisterEmailUseCase → import { EmailValidator }
   └─ (Posibles otros) → import { isValidEmail }
```

### Transición: Creación de Estructura (Estado Intermedio 1)

```
[EVENTO: CREAR_ESTRUCTURA_MODULAR]

Acciones:
1. mkdir src/application/validator/email/
2. touch EmailValidator.ts
3. touch isValidEmail.ts
4. touch validateEmailOrThrow.ts
5. touch index.ts

[ESTADO: DUAL - Archivo antiguo Y nuevos coexisten]
```

### Transición: Migración de Código (Estado Intermedio 2)

```
[EVENTO: MIGRAR_CODIGO]

Flujo de migración por componente:

EmailValidator.ts (nuevo):
  → Copiar import { ValidationError }
  → Copiar export class EmailValidator { ... }
  
isValidEmail.ts (nuevo):
  → Copiar export function isValidEmail(email: string): boolean { ... }
  
validateEmailOrThrow.ts (nuevo):
  → Copiar import { isValidEmail }
  → Copiar export function validateEmailOrThrow(email: string): void { ... }
  
index.ts (nuevo):
  → export { EmailValidator } from './EmailValidator';
  → export { isValidEmail } from './isValidEmail';
  → export { validateEmailOrThrow } from './validateEmailOrThrow';

[ESTADO: CÓDIGO_DUPLICADO - Ambas versiones funcionales]
```

### Transición: Actualización de Imports

```
[EVENTO: ACTUALIZAR_CONSUMERS]

Para cada use case que importa EmailValidator:

RegisterEmailUseCase.ts:
  ANTES: import { EmailValidator } from '../validator/EmailValidator';
  DESPUÉS: import { EmailValidator } from '../validator/email';
  
(Repetir para CheckEmailExistsUseCase, CreatePasswordUseCase, LoginUseCase si aplica)

[ESTADO: IMPORTS_ACTUALIZADOS - Consumidores apuntan a nueva estructura]
```

### Transición: Validación de Compilación

```
[EVENTO: VALIDAR_COMPILACION]

Comando: npm run build

Resultados esperados:
  ✅ Compilación exitosa sin errores
  ✅ TypeScript resuelve todos los imports
  ✅ Estructura de dist/ refleja nueva organización

[ESTADO: VALIDADO - Estructura funcional confirmada]
```

### Estado Final

```
[EVENTO: ELIMINAR_ARCHIVO_ANTIGUO]

Acción: rm src/application/validator/EmailValidator.ts

[ESTADO: REFACTORIZADO]
📁 src/application/validator/email/
   ├─ 📄 EmailValidator.ts           ← Clase principal
   ├─ 📄 isValidEmail.ts             ← Función legacy simple
   ├─ 📄 validateEmailOrThrow.ts     ← Función legacy con throw
   └─ 📄 index.ts                    ← Barrel export
   
✅ Un archivo = Una responsabilidad
✅ Imports funcionando desde '../validator/email'
✅ Compilación limpia
```

### Diagrama de Transición de Estados

```
┌─────────────────┐
│   MONOLÍTICO    │  Estado inicial: 1 archivo, 3 exports
└────────┬────────┘
         │
         │ [Crear estructura]
         ▼
┌─────────────────┐
│   DUAL          │  Archivo original + nuevos archivos vacíos
└────────┬────────┘
         │
         │ [Migrar código]
         ▼
┌─────────────────┐
│ CÓDIGO_DUPLICADO│  Código en ambos lugares
└────────┬────────┘
         │
         │ [Actualizar imports]
         ▼
┌─────────────────┐
│IMPORTS_ACTUALIZADOS│  Consumers apuntan a estructura nueva
└────────┬────────┘
         │
         │ [Validar compilación]
         ▼
┌─────────────────┐
│   VALIDADO      │  npm run build exitoso
└────────┬────────┘
         │
         │ [Eliminar archivo antiguo]
         ▼
┌─────────────────┐
│ REFACTORIZADO   │  Estado final: estructura modular
└─────────────────┘
```

## Criterios de aceptación (root)

### AC1: Estructura de Archivos Creada

**DADO** que necesito separar EmailValidator
**CUANDO** ejecuto la creación de la estructura
**ENTONCES:**
- ✅ Existe el directorio `src/application/validator/email/`
- ✅ Existe el archivo `src/application/validator/email/EmailValidator.ts`
- ✅ Existe el archivo `src/application/validator/email/isValidEmail.ts`
- ✅ Existe el archivo `src/application/validator/email/validateEmailOrThrow.ts`
- ✅ Existe el archivo `src/application/validator/email/index.ts`

**Verificación:**
```bash
ls src/application/validator/email/
# Output esperado:
# EmailValidator.ts
# isValidEmail.ts
# validateEmailOrThrow.ts
# index.ts
```

---

### AC2: EmailValidator.ts Correctamente Separado

**DADO** que el archivo original contiene una clase EmailValidator
**CUANDO** se migra el código a `email/EmailValidator.ts`
**ENTONCES:**
- ✅ Importa `ValidationError` desde `'../../exception/ValidationError'`
- ✅ Exporta `export class EmailValidator`
- ✅ Contiene la propiedad `private readonly emailRegex`
- ✅ Contiene el método `validate(email: string): void`
- ✅ La lógica de validación es idéntica al original

**Verificación:**
```typescript
// Debe compilar sin errores:
import { EmailValidator } from './email/EmailValidator';
const validator = new EmailValidator();
validator.validate('test@example.com'); // No lanza error
validator.validate('invalid'); // Lanza ValidationError
```

---

### AC3: isValidEmail.ts Correctamente Separado

**DADO** que existe una función legacy `isValidEmail`
**CUANDO** se migra a `email/isValidEmail.ts`
**ENTONCES:**
- ✅ Exporta `export function isValidEmail(email: string): boolean`
- ✅ Retorna `false` para emails null/undefined/no-string
- ✅ Retorna `true/false` según regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- ✅ No lanza excepciones, solo retorna boolean

**Verificación:**
```typescript
import { isValidEmail } from './email/isValidEmail';

// Casos de prueba:
isValidEmail('test@example.com')  // → true
isValidEmail('invalid')            // → false
isValidEmail('')                   // → false
isValidEmail(null)                 // → false
isValidEmail(undefined)            // → false
```

---

### AC4: validateEmailOrThrow.ts Correctamente Separado

**DADO** que existe una función legacy `validateEmailOrThrow`
**CUANDO** se migra a `email/validateEmailOrThrow.ts`
**ENTONCES:**
- ✅ Importa `isValidEmail` desde `'./isValidEmail'`
- ✅ Exporta `export function validateEmailOrThrow(email: string): void`
- ✅ Lanza `Error('Invalid email format')` si `isValidEmail` retorna false
- ✅ No lanza error si el email es válido

**Verificación:**
```typescript
import { validateEmailOrThrow } from './email/validateEmailOrThrow';

validateEmailOrThrow('test@example.com'); // OK
validateEmailOrThrow('invalid'); // Lanza Error
```

---

### AC5: Barrel Export (index.ts) Funcional

**DADO** que tengo 3 archivos con exports individuales
**CUANDO** creo el barrel export `index.ts`
**ENTONCES:**
- ✅ Re-exporta `EmailValidator` desde `'./EmailValidator'`
- ✅ Re-exporta `isValidEmail` desde `'./isValidEmail'`
- ✅ Re-exporta `validateEmailOrThrow` desde `'./validateEmailOrThrow'`
- ✅ Permite importar desde `'../validator/email'` sin especificar archivo interno

**Verificación:**
```typescript
// Ambas formas deben funcionar:
import { EmailValidator, isValidEmail, validateEmailOrThrow } from '../validator/email';
// O individualmente:
import { EmailValidator } from '../validator/email';
```

---

### AC6: Imports Actualizados en Use Cases

**DADO** que los use cases importaban desde `'../validator/EmailValidator'`
**CUANDO** actualizo las importaciones
**ENTONCES:**
- ✅ `RegisterEmailUseCase.ts` importa desde `'../validator/email'`
- ✅ `CheckEmailExistsUseCase.ts` importa desde `'../validator/email'` (si aplica)
- ✅ `CreatePasswordUseCase.ts` importa desde `'../validator/email'` (si aplica)
- ✅ `LoginUseCase.ts` importa desde `'../validator/email'` (si aplica)
- ✅ No hay errores de TypeScript en ningún archivo

**Verificación:**
```bash
# Verificar que no existan imports al archivo antiguo:
grep -r "from.*validator/EmailValidator" src/application/usecase/
# Output esperado: (ninguno)
```

---

### AC7: Compilación Exitosa

**DADO** que toda la estructura está refactorizada
**CUANDO** ejecuto `npm run build`
**ENTONCES:**
- ✅ El comando ejecuta sin errores (exit code 0)
- ✅ No hay errores de tipo de TypeScript
- ✅ No hay imports sin resolver
- ✅ El directorio `dist/` se genera correctamente

**Verificación:**
```bash
npm run build
echo $?  # Debe retornar 0
```

---

### AC8: Archivo Original Eliminado

**DADO** que la nueva estructura funciona correctamente
**CUANDO** elimino el archivo original
**ENTONCES:**
- ✅ No existe `src/application/validator/EmailValidator.ts`
- ✅ La compilación sigue siendo exitosa
- ✅ No hay referencias al archivo antiguo en el código

**Verificación:**
```bash
# No debe existir:
test -f src/application/validator/EmailValidator.ts && echo "ERROR: Archivo aún existe" || echo "OK: Archivo eliminado"

# No debe haber referencias:
grep -r "EmailValidator.ts" src/
# Output esperado: (solo referencias en comments/docs)
```

---

### AC9: Funcionalidad End-to-End Preservada

**DADO** que el sistema está refactorizado
**CUANDO** ejecuto flujos de validación de email
**ENTONCES:**
- ✅ RegisterEmailUseCase valida emails correctamente
- ✅ Emails inválidos lanzan `ValidationError` con mensaje apropiado
- ✅ Emails válidos pasan la validación sin errores
- ✅ El comportamiento es idéntico al estado pre-refactorización

**Verificación:**
```bash
# Si hay tests unitarios:
npm test -- --testPathPattern=email

# Verificación manual con script:
node -e "
const { EmailValidator } = require('./dist/application/validator/email');
const validator = new EmailValidator();
validator.validate('test@example.com');
console.log('✅ PASS');
"
```

---

### AC10: Documentación Actualizada

**DADO** que la estructura cambió
**CUANDO** reviso la documentación del proyecto
**ENTONCES:**
- ✅ `PLAN_REFACTOR.md` marca FASE 5 como completada
- ✅ README.md refleja la nueva estructura (si aplica)
- ✅ Comentarios en código no referencian rutas obsoletas

---

### Checklist de Aceptación Final

Marcar cada ítem al completarse:

```
[ ] AC1: Estructura de archivos creada
[ ] AC2: EmailValidator.ts correctamente separado
[ ] AC3: isValidEmail.ts correctamente separado
[ ] AC4: validateEmailOrThrow.ts correctamente separado
[ ] AC5: Barrel export funcional
[ ] AC6: Imports actualizados en use cases
[ ] AC7: Compilación exitosa (npm run build)
[ ] AC8: Archivo original eliminado
[ ] AC9: Funcionalidad end-to-end preservada
[ ] AC10: Documentación actualizada
```

**FASE 5 COMPLETA cuando todos los criterios están ✅**

## Trazabilidad

### Relación con Plan General de Refactorización

```
PLAN_REFACTOR.md
├─ FASE 1: Crear puertos de entrada ✅ (Completada)
├─ FASE 2: Actualizar use cases ✅ (Completada)
├─ FASE 3: Separar JWT utils 🔄 (En progreso)
├─ FASE 4: Separar Password utils 🔄 (En progreso)
├─ **FASE 5: Separar EmailValidator** ← 📍 ESTE DOCUMENTO
├─ FASE 6: Separar PasswordValidator ⏳ (Pendiente)
├─ FASE 7: Separar UserApplicationMapper ⏳ (Pendiente)
└─ FASE 8-12: Fases posteriores ⏳ (Pendiente)
```

### Dependencias entre Fases

**Prerequisitos (deben completarse antes de FASE 5):**
- ✅ FASE 1: No hay dependencias críticas, pero es recomendable tener puertos creados

**Bloquea a (no se pueden iniciar hasta completar FASE 5):**
- FASE 6: `PasswordValidator` sigue el mismo patrón
- FASE 9: Actualización global de imports requiere FASE 5 completa

**Independiente de:**
- FASE 3-4: Separación de JWT/Password utils no afecta validators
- FASE 7-8: Mappers y config son módulos independientes

### Referencias de Archivos

#### Archivos Origen (Pre-refactorización)
- 📄 `src/application/validator/EmailValidator.ts` (líneas 1-31)
  - Clase EmailValidator (líneas 3-20)
  - Función isValidEmail (líneas 22-26)
  - Función validateEmailOrThrow (líneas 28-32)

#### Archivos Destino (Post-refactorización)
- 📄 `src/application/validator/email/EmailValidator.ts` (nuevo)
- 📄 `src/application/validator/email/isValidEmail.ts` (nuevo)
- 📄 `src/application/validator/email/validateEmailOrThrow.ts` (nuevo)
- 📄 `src/application/validator/email/index.ts` (nuevo)

#### Archivos Consumidores (Requieren actualización)
- 📄 `src/application/usecase/RegisterEmailUseCase.ts` (línea 7)
- 📄 `src/application/usecase/CheckEmailExistsUseCase.ts` (verificar si existe)
- 📄 `src/application/usecase/CreatePasswordUseCase.ts` (verificar si existe)
- 📄 `src/application/usecase/LoginUseCase.ts` (verificar si existe)

### Historial de Cambios

| Fecha | Versión | Cambio | Autor |
|-------|---------|--------|-------|
| 2026-03-09 | 1.0 | Creación inicial del ONE_SPEC para FASE 5 | GitHub Copilot |

### Métricas de Calidad

**Objetivo de la refactorización:**
- **Complejidad ciclomática:** No cambia (solo movimiento de código)
- **Acoplamiento:** Reducido (cada archivo es independiente)
- **Cohesión:** Aumentada (cada archivo tiene una única responsabilidad)
- **Mantenibilidad:** Mejorada significativamente

**Indicadores de éxito:**
- ✅ 0 errores de compilación
- ✅ 0 warnings de TypeScript
- ✅ 100% de tests pasando (si existen)
- ✅ Reducción de líneas por archivo: 31 → ~10 líneas promedio

---

## Pasos de Implementación Detallados

### PASO 1: Crear Estructura de Directorios

```bash
# Crear directorio email dentro de validator
mkdir -p src/application/validator/email

# Verificar creación
ls -la src/application/validator/
```

**Resultado esperado:**
```
drwxr-xr-x  email/
-rw-r--r--  EmailValidator.ts
-rw-r--r--  PasswordValidator.ts
```

---

### PASO 2: Crear Archivo EmailValidator.ts

**Archivo:** `src/application/validator/email/EmailValidator.ts`

```typescript
import { ValidationError } from '../../exception/ValidationError';

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

**Checklist:**
- [ ] Import de ValidationError correcto
- [ ] Clase exportada con `export class`
- [ ] Regex idéntico al original
- [ ] Lógica de validación sin cambios

---

### PASO 3: Crear Archivo isValidEmail.ts

**Archivo:** `src/application/validator/email/isValidEmail.ts`

```typescript
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}
```

**Checklist:**
- [ ] Función exportada con `export function`
- [ ] Signature idéntica: `(email: string): boolean`
- [ ] Regex idéntico al original
- [ ] Retorna boolean sin lanzar excepciones

---

### PASO 4: Crear Archivo validateEmailOrThrow.ts

**Archivo:** `src/application/validator/email/validateEmailOrThrow.ts`

```typescript
import { isValidEmail } from './isValidEmail';

export function validateEmailOrThrow(email: string): void {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }
}
```

**Checklist:**
- [ ] Import de `isValidEmail` desde archivo relativo
- [ ] Función exportada con `export function`
- [ ] Lanza `Error` (no `ValidationError`)
- [ ] Lógica idéntica al original

---

### PASO 5: Crear Barrel Export (index.ts)

**Archivo:** `src/application/validator/email/index.ts`

```typescript
export { EmailValidator } from './EmailValidator';
export { isValidEmail } from './isValidEmail';
export { validateEmailOrThrow } from './validateEmailOrThrow';
```

**Checklist:**
- [ ] Re-exporta los 3 componentes
- [ ] Usa export con destructuring `export { ... } from '...'`
- [ ] Paths relativos correctos

---

### PASO 6: Actualizar RegisterEmailUseCase.ts

**Archivo:** `src/application/usecase/RegisterEmailUseCase.ts`

**ANTES (línea 7):**
```typescript
import { EmailValidator } from '../validator/EmailValidator';
```

**DESPUÉS (línea 7):**
```typescript
import { EmailValidator } from '../validator/email';
```

**Checklist:**
- [ ] Solo cambió el path de import
- [ ] El nombre `EmailValidator` permanece igual
- [ ] El resto del archivo sin cambios

---

### PASO 7: Verificar y Actualizar Otros Use Cases

**Ejecutar búsqueda:**
```bash
grep -r "from.*validator/EmailValidator" src/application/usecase/
```

**Para cada archivo encontrado, actualizar:**
```typescript
// ANTES:
import { ... } from '../validator/EmailValidator';

// DESPUÉS:
import { ... } from '../validator/email';
```

**Use cases probables:**
- CheckEmailExistsUseCase.ts
- CreatePasswordUseCase.ts
- LoginUseCase.ts

---

### PASO 8: Compilar y Verificar

```bash
# Limpiar build anterior
rm -rf dist/

# Compilar proyecto
npm run build

# Verificar exit code
echo $?  # Debe ser 0
```

**Si hay errores:**
1. Leer mensaje de error de TypeScript
2. Verificar paths de imports
3. Verificar que todos los archivos existan
4. Revisar typos en nombres de archivos

---

### PASO 9: Eliminar Archivo Original

**Solo ejecutar si PASO 8 fue exitoso:**

```bash
# Respaldar archivo (precaución)
cp src/application/validator/EmailValidator.ts /tmp/EmailValidator.backup.ts

# Eliminar archivo original
rm src/application/validator/EmailValidator.ts

# Compilar nuevamente para confirmar
npm run build
```

**Checklist:**
- [ ] Respaldo creado por seguridad
- [ ] Archivo original eliminado
- [ ] Compilación aún exitosa

---

### PASO 10: Verificación Final

```bash
# 1. Verificar estructura de archivos
tree src/application/validator/email/

# 2. Verificar que no existan imports al archivo antiguo
grep -r "EmailValidator.ts" src/

# 3. Verificar build final
npm run build && echo "✅ FASE 5 COMPLETA"
```

---

## Troubleshooting

### Problema 1: Error "Cannot find module '../validator/email'"

**Causa:** El barrel export index.ts no existe o tiene errores

**Solución:**
1. Verificar que existe `src/application/validator/email/index.ts`
2. Verificar que exports en index.ts sean correctos
3. Verificar sintaxis de re-exports

---

### Problema 2: Error "X is not exported from '../validator/email'"

**Causa:** El componente no está exportado en index.ts

**Solución:**
1. Abrir `index.ts`
2. Agregar export faltante: `export { X } from './X';`

---

### Problema 3: Compilación lenta o errores de caché

**Solución:**
```bash
rm -rf dist/
rm -rf node_modules/.cache/
npm run build
```

---

### Problema 4: Tests fallan después de refactorización

**Causa:** Tests tienen imports hardcoded al archivo antiguo

**Solución:**
1. Buscar imports en archivos de test: `grep -r "EmailValidator" tests/`
2. Actualizar imports de tests siguiendo mismo patrón

---

## Anexos

### Anexo A: Diff Completo de Cambios

```diff
# CREACIÓN DE ARCHIVOS NUEVOS

+++ src/application/validator/email/EmailValidator.ts
@@ -0,0 +1,18 @@
+import { ValidationError } from '../../exception/ValidationError';
+
+export class EmailValidator {
+  private readonly emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
+
+  validate(email: string): void {
+    if (!email || email.trim().length === 0) {
+      throw new ValidationError('Email is required');
+    }
+
+    const trimmedEmail = email.trim();
+
+    if (!this.emailRegex.test(trimmedEmail)) {
+      throw new ValidationError(
+        `Invalid email format: ${trimmedEmail}. Email must match pattern: user@domain.com`
+      );
+    }
+  }
+}

+++ src/application/validator/email/isValidEmail.ts
@@ -0,0 +1,5 @@
+export function isValidEmail(email: string): boolean {
+  if (!email || typeof email !== 'string') return false;
+  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
+  return re.test(email.trim());
+}

+++ src/application/validator/email/validateEmailOrThrow.ts
@@ -0,0 +1,7 @@
+import { isValidEmail } from './isValidEmail';
+
+export function validateEmailOrThrow(email: string): void {
+  if (!isValidEmail(email)) {
+    throw new Error('Invalid email format');
+  }
+}

+++ src/application/validator/email/index.ts
@@ -0,0 +1,3 @@
+export { EmailValidator } from './EmailValidator';
+export { isValidEmail } from './isValidEmail';
+export { validateEmailOrThrow } from './validateEmailOrThrow';

# ACTUALIZACIÓN DE IMPORTS

--- src/application/usecase/RegisterEmailUseCase.ts
@@ -4,7 +4,7 @@
 import { UserRepositoryPort } from '../../domain/port/portout/UserRepositoryPort';
 import { PasswordTokenRepositoryPort } from '../../domain/port/portout/PasswordTokenRepositoryPort';
 import { EmailServicePort } from '../../domain/port/portout/EmailServicePort';
-import { EmailValidator } from '../validator/EmailValidator';
+import { EmailValidator } from '../validator/email';
 import { EmailAlreadyExistsError } from '../exception/EmailAlreadyExistsError';
 import { generatePasswordCreationToken } from '../../utils/jwt';

# ELIMINACIÓN DE ARCHIVO ANTIGUO

--- src/application/validator/EmailValidator.ts
@@ -1,31 +0,0 @@
-import { ValidationError } from '../exception/ValidationError';
-
-export class EmailValidator {
-  private readonly emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
-
-  validate(email: string): void {
-    if (!email || email.trim().length === 0) {
-      throw new ValidationError('Email is required');
-    }
-
-    const trimmedEmail = email.trim();
-
-    if (!this.emailRegex.test(trimmedEmail)) {
-      throw new ValidationError(
-        `Invalid email format: ${trimmedEmail}. Email must match pattern: user@domain.com`
-      );
-    }
-  }
-}
-
-export function isValidEmail(email: string): boolean {
-  if (!email || typeof email !== 'string') return false;
-  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
-  return re.test(email.trim());
-}
-
-export function validateEmailOrThrow(email: string): void {
-  if (!isValidEmail(email)) {
-    throw new Error('Invalid email format');
-  }
-}
```

### Anexo B: Árbol de Archivos Final

```
src/application/validator/
├── email/                          ← NUEVO DIRECTORIO
│   ├── EmailValidator.ts           ← Clase principal (18 líneas)
│   ├── isValidEmail.ts             ← Función legacy boolean (5 líneas)
│   ├── validateEmailOrThrow.ts     ← Función legacy throw (7 líneas)
│   └── index.ts                    ← Barrel export (3 líneas)
└── PasswordValidator.ts            ← Sin cambios (FASE 6)
```

**Total líneas de código:** 33 líneas (vs 31 originales)
**Archivos:** 4 archivos modulares (vs 1 monolítico)
**Líneas promedio por archivo:** 8.25 líneas

---

## Referencias

- **PLAN_REFACTOR.md FASE 5:** Líneas 308-362
- **Clean Architecture Principles:** Robert C. Martin
- **SOLID Principles:** Single Responsibility Principle (SRP)
- **TypeScript Handbook:** Module Resolution

---

**Documento versión 1.0 - Fase 5 de Plan de Refactorización**  
**Fecha de creación:** 2026-03-09  
**Autor:** GitHub Copilot  
**Estado:** Listo para implementación
