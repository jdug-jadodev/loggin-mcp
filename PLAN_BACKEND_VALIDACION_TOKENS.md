# 🔧 Plan de Trabajo Backend — Validación de Tokens

**Fecha:** 17 de Marzo, 2026  
**Responsable:** Equipo Backend  
**Referencia técnica:** [SOLUCION_BUG_TOKENS.md](SOLUCION_BUG_TOKENS.md)

---

## 📌 Contexto

Actualmente, cuando un usuario hace clic en el enlace del correo (crear o restablecer contraseña), no existe una forma de verificar si el token es válido **antes** de que el usuario llene el formulario. El frontend necesita un endpoint para hacer esa validación previa.

**Tu trabajo:** Crear el endpoint `GET /auth/validate-token` que valida un token sin consumirlo (sin marcarlo como usado).

---

## 📐 Contrato de API

> Este contrato está acordado con el equipo frontend. No lo modifiques sin coordinar.

### Endpoint

```
GET /auth/validate-token?token={TOKEN}&type={TYPE}
```

| Parámetro | Tipo | Obligatorio | Valores posibles |
|-----------|------|-------------|-----------------|
| `token` | `string` (query) | Sí | El JWT que el usuario recibió por email |
| `type` | `string` (query) | Sí | `password_creation` \| `password_reset` |

### Respuestas

#### ✅ Token válido — `200 OK`

```json
{
  "status": "success",
  "data": {
    "valid": true,
    "status": "valid",
    "message": "Token is valid and ready to be used",
    "email": "usuario@ejemplo.com"
  }
}
```

#### ❌ Token expirado — `200 OK`

```json
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "expired",
    "message": "This token has expired. Please request a new one."
  }
}
```

#### ❌ Token ya usado — `200 OK`

```json
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "used",
    "message": "This token has already been used. Please request a new one."
  }
}
```

#### ❌ Token no encontrado — `200 OK`

```json
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "not_found",
    "message": "Token not found. It may have been deleted or never existed."
  }
}
```

#### ❌ Tipo incorrecto — `200 OK`

```json
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "invalid_type",
    "message": "This token cannot be used for this operation."
  }
}
```

#### ❌ Parámetros faltantes — `400 Bad Request`

```json
{
  "status": "error",
  "message": "Missing or invalid required parameter: token",
  "code": "MISSING_PARAMETER"
}
```

```json
{
  "status": "error",
  "message": "Invalid or missing parameter: type. Must be \"password_creation\" or \"password_reset\"",
  "code": "INVALID_PARAMETER"
}
```

#### ❌ Error interno — `500 Internal Server Error`

```json
{
  "status": "error",
  "message": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

> **Importante:** Los estados `expired`, `used`, `not_found`, `invalid_type` retornan `200 OK` (no son errores HTTP), para que el frontend pueda distinguir fácilmente entre un error de red y un token inválido.

---

## ✅ Tareas

### Tarea B1 — Crear `ValidatePasswordTokenUseCase`

**Archivo a crear:** `src/application/usecase/ValidatePasswordTokenUseCase.ts`

**Qué hace:**
- Recibe `{ token, type }`.
- Llama a `passwordTokenRepository.validateToken(token, type)` (ya existe este método).
- Traduce el resultado del repositorio a un DTO con los campos: `valid`, `status`, `message`, `email`.
- **NO marca el token como usado.** Solo valida.
- **NO lanza excepciones.** Siempre retorna un objeto con el estado.

**Mapeo de mensajes del repositorio → status:**

| Mensaje del repositorio contiene... | `status` a retornar |
|--------------------------------------|---------------------|
| — (valid=true) | `valid` |
| `"already used"` | `used` |
| `"expired"` | `expired` |
| `"not found"` | `not_found` |
| `"Invalid token type"` | `invalid_type` |
| Cualquier otro | `error` |

**Campos del DTO de respuesta:**

```typescript
interface ValidatePasswordTokenResultDTO {
  valid: boolean;
  status: 'valid' | 'expired' | 'used' | 'not_found' | 'invalid_type' | 'error';
  message: string;
  email?: string;  // Solo presente cuando valid=true
}
```

---

### Tarea B2 — Agregar método al controlador

**Archivo a modificar:** `src/infrastructure/controller/AuthController.ts`

**Cambios:**

1. **Importar** `ValidatePasswordTokenUseCase`.
2. **Agregar parámetro** al constructor (posición 8, después de `revokedTokenRepository`):
   ```typescript
   private readonly validatePasswordTokenUseCase?: ValidatePasswordTokenUseCase
   ```
3. **Crear método** `async validatePasswordToken(req: Request, res: Response)`:
   - Extraer `token` y `type` de `req.query`.
   - Validar que `token` sea un string no vacío → si falta, retornar `400`.
   - Validar que `type` sea `"password_creation"` o `"password_reset"` → si no, retornar `400`.
   - Ejecutar `this.validatePasswordTokenUseCase.execute({ token, type })`.
   - Retornar `200` con `{ status: 'success', data: result }`.
   - Capturar errores inesperados → retornar `500`.

---

### Tarea B3 — Registrar ruta y cablear dependencias

**Archivo a modificar:** `src/infrastructure/routes/auth.routes.ts`

**Cambios:**

1. **Importar:**
   ```typescript
   import { ValidatePasswordTokenUseCase } from '../../application/usecase/ValidatePasswordTokenUseCase';
   ```

2. **Instanciar** (después de las instancias existentes):
   ```typescript
   const validatePasswordTokenUseCase = new ValidatePasswordTokenUseCase(passwordTokenRepository);
   ```

3. **Actualizar constructor** de `AuthController` (agregar como 8.° argumento):
   ```typescript
   const authController = new AuthController(
     checkEmailUseCase,
     createPasswordUseCase,
     loginUseCase,
     registerEmailUseCase,
     forgotPasswordUseCase,
     resetPasswordUseCase,
     revokedTokenRepository,
     validatePasswordTokenUseCase  // ← NUEVO
   );
   ```

4. **Agregar ruta** (pública, sin authMiddleware):
   ```typescript
   router.get('/validate-token', (req, res) => authController.validatePasswordToken(req, res));
   ```

> **¿Por qué es pública?** Porque el usuario llega desde el email sin estar autenticado.

---

### Tarea B4 — Mejorar mensajes en el repositorio

**Archivo a modificar:** `src/infrastructure/repository/adapter/SupabasePasswordTokenRepositoryAdapter.ts`

**Cambios en el método `validateToken()`:**

1. Cuando Supabase retorna error con código `PGRST116` (sin filas), retornar `{ valid: false, message: 'Token not found' }` en lugar del genérico `DB error: ...`.
2. Cuando `data.used === true`, incluir fecha de uso si está disponible:
   ```typescript
   if (data.used) {
     return { valid: false, message: 'Token already used' };
   }
   ```
3. Cuando `expiresAt < now`, retornar mensaje claro:
   ```typescript
   if (expiresAt < now) {
     return { valid: false, message: 'Token expired' };
   }
   ```

---

### Tarea B5 — Build y pruebas manuales

1. Ejecutar `npm run build` → debe compilar sin errores.
2. Probar con `curl` o Postman los siguientes escenarios:

```bash
# 1. Token válido
curl "http://localhost:4000/auth/validate-token?token=TOKEN_REAL&type=password_creation"
# Esperado: { "status": "success", "data": { "valid": true, "status": "valid", "email": "..." } }

# 2. Token expirado (usar uno viejo)
curl "http://localhost:4000/auth/validate-token?token=TOKEN_VIEJO&type=password_creation"
# Esperado: { "data": { "valid": false, "status": "expired" } }

# 3. Token ya usado
curl "http://localhost:4000/auth/validate-token?token=TOKEN_USADO&type=password_creation"
# Esperado: { "data": { "valid": false, "status": "used" } }

# 4. Token inventado
curl "http://localhost:4000/auth/validate-token?token=abc123&type=password_creation"
# Esperado: { "data": { "valid": false, "status": "not_found" } }

# 5. Sin parámetros
curl "http://localhost:4000/auth/validate-token"
# Esperado: 400 { "code": "MISSING_PARAMETER" }

# 6. Tipo inválido
curl "http://localhost:4000/auth/validate-token?token=abc&type=wrong"
# Esperado: 400 { "code": "INVALID_PARAMETER" }
```

3. Verificar que los endpoints existentes siguen funcionando:
   - `POST /auth/create-password` con token y password
   - `POST /auth/reset-password` con token y newPassword

---

## 📊 Resumen de Archivos

| Archivo | Acción |
|---------|--------|
| `src/application/usecase/ValidatePasswordTokenUseCase.ts` | **Crear** |
| `src/infrastructure/controller/AuthController.ts` | **Modificar** (constructor + método) |
| `src/infrastructure/routes/auth.routes.ts` | **Modificar** (import + instancia + ruta) |
| `src/infrastructure/repository/adapter/SupabasePasswordTokenRepositoryAdapter.ts` | **Modificar** (mejorar mensajes) |

---

## ✅ Criterios de Aceptación

- [ ] `GET /auth/validate-token?token=TOKEN_VALIDO&type=password_creation` → `valid: true` + email
- [ ] `GET /auth/validate-token?token=TOKEN_EXPIRADO&type=password_creation` → `status: "expired"`
- [ ] `GET /auth/validate-token?token=TOKEN_USADO&type=password_creation` → `status: "used"`
- [ ] `GET /auth/validate-token?token=BASURA&type=password_creation` → `status: "not_found"`
- [ ] `GET /auth/validate-token` sin parámetros → `400`
- [ ] `POST /auth/create-password` sigue funcionando igual
- [ ] `POST /auth/reset-password` sigue funcionando igual
- [ ] `npm run build` compila sin errores

---

## ⚠️ Notas Importantes

- **No expongas `userId` en la respuesta** cuando el token es válido. Solo retorna `email`.
- La ruta es **pública** (sin `authMiddleware`), porque el usuario no está autenticado.
- **No modifiques** los endpoints existentes de `create-password` ni `reset-password`.
- Coordina con el equipo frontend antes de hacer deploy. Ellos necesitan el endpoint disponible para probar.
