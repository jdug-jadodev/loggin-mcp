# Plan de Trabajo: Endpoint de Registro de Correos con Autenticación y Notificación

**Fecha de Creación:** 7 de Marzo de 2026  
**Objetivo:** Crear un endpoint protegido para registrar correos en Supabase que solo funcione para usuarios autorizados, y envíe un email con la URL para crear contraseña.

---

## 📋 Contexto del Problema

- **Necesidad:** Endpoint para registrar correos en Supabase
- **Seguridad:** Solo accesible por el propietario y usuarios autorizados
- **Notificación:** Enviar email automático con URL de creación de contraseña
- **Restricción:** Sin presupuesto para servicios de email pagos
- **Arquitectura Actual:** Clean/Hexagonal con Express + TypeScript + Supabase + JWT

---

## 🏗️ Arquitectura de la Solución

### 1. Sistema de Autenticación
- Middleware JWT para validar tokens
- Sistema de autorización basado en roles (admin/user)

### 2. Servicio de Email
- **Opción Recomendada:** Resend (100 emails/día gratis)
- **Alternativa 1:** SendGrid (100 emails/día gratis)
- **Alternativa 2:** Nodemailer con Gmail SMTP (gratis, menos confiable)

### 3. Flujo del Endpoint
```
1. Usuario autenticado hace POST /auth/register-email
2. Middleware valida JWT y rol admin
3. Validar email no existe en base de datos
4. Insertar email en Supabase (tabla users)
5. Generar URL única para crear contraseña
6. Enviar email con la URL
7. Retornar confirmación exitosa
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

### Tarea 2.1: Agregar campo role a la base de datos
**Archivo:** `setup-database.sql` (actualizar)  
**Acción:** Agregar columna `role` a la tabla `users`
**Detalles:**
```sql
ALTER TABLE users 
ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Actualizar usuario principal como admin (reemplazar con tu email)
UPDATE users SET role = 'admin' WHERE email = 'tu-email@ejemplo.com';
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
**Acción:** Agregar función para generar token especial
**Detalles:**
- Crear función `generatePasswordCreationToken(email: string): string`
- Token con payload: `{ email, type: 'password_creation' }`
- Expiración: 24 horas
- Retornar token firmado

### Tarea 4.5: Actualizar UserRepositoryPort con método create
**Archivo:** `src/domain/port/portout/UserRepositoryPort.ts`  
**Acción:** Verificar que existe método `create(email: string)`
**Detalles:**
- Si no existe, agregarlo
- Retorna `Promise<User>`

### Tarea 4.6: Crear RegisterEmailUseCase
**Archivo:** `src/application/usecase/RegisterEmailUseCase.ts`  
**Acción:** Lógica de negocio para registrar email
**Detalles:**
```typescript
Pasos del caso de uso:
1. Validar email con EmailValidator
2. Verificar que email NO exista en base de datos
3. Si existe, lanzar EmailAlreadyExistsError
4. Crear usuario en base de datos (UserRepository.create)
5. Generar token de creación de contraseña
6. Enviar email con EmailService
7. Retornar RegisterEmailResultDTO
```

### Tarea 4.7: Actualizar validación de email si es necesario
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
  authMiddleware,     // Valida JWT
  adminMiddleware,    // Valida rol admin
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

## 🔷 FASE 6: Testing y Documentación

### Tarea 6.1: Ejecutar base de datos actualizada
**Acción:** Aplicar cambios SQL en Supabase
**Detalles:**
- Ejecutar ALTER TABLE para agregar columna `role`
- Actualizar tu usuario como admin
- Verificar que otros usuarios tengan role='user'

### Tarea 6.2: Configurar cuenta de Resend
**Acción:** Crear cuenta y configurar dominio
**Pasos:**
1. Ir a https://resend.com y crear cuenta gratis
2. Verificar dominio o usar dominio de prueba de Resend
3. Obtener API Key
4. Agregar al archivo `.env`

### Tarea 6.3: Crear script de test manual
**Archivo:** `test-register-email.ts`  
**Acción:** Script para probar el endpoint
**Detalles:**
```typescript
// 1. Login como admin para obtener token
// 2. Llamar POST /auth/register-email con token
// 3. Verificar respuesta 201
// 4. Verificar que llega email
// 5. Intentar registrar mismo email (debería fallar con 409)
```

### Tarea 6.4: Documentar el nuevo endpoint
**Archivo:** `README.md`  
**Acción:** Agregar documentación del endpoint
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
```

### Tarea 6.5: Crear guía de configuración de Resend
**Archivo:** `docs/CONFIGURACION_RESEND.md`  
**Acción:** Documentar paso a paso la configuración
**Detalles:**
- Crear cuenta en Resend
- Verificar dominio (o usar sandbox)
- Obtener API Key
- Configurar variables de entorno
- Probar envío de email de prueba

### Tarea 6.6: Actualizar .env.example con valores de ejemplo
**Archivo:** `.env.example`  
**Acción:** Asegurar que incluye todas las variables nuevas
**Detalles:**
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `APP_BASE_URL`

### Tarea 6.7: Pruebas de integración completas
**Acción:** Probar todo el flujo end-to-end
**Escenarios:**
1. Usuario sin token intenta registrar email → 401
2. Usuario normal (no admin) intenta registrar email → 403
3. Admin registra email válido → 201 + email recibido
4. Admin intenta registrar email duplicado → 409
5. Admin registra email inválido → 400
6. Verificar que el link del email funciona (frontend)

### Tarea 6.8: Verificar logs y manejo de errores
**Acción:** Revisar logs del servidor
**Detalles:**
- Verificar que errores se loggean apropiadamente
- No exponer información sensible en logs
- Logs estructurados para debugging

---

## 📊 Resumen de Archivos a Crear/Modificar

### ✨ Archivos Nuevos (22)
1. `src/types/express.d.ts`
2. `src/infrastructure/middleware/auth.middleware.ts`
3. `src/infrastructure/middleware/admin.middleware.ts`
4. `src/application/exception/UnauthorizedError.ts`
5. `src/application/exception/TokenExpiredError.ts`
6. `src/application/exception/InvalidTokenError.ts`
7. `src/application/exception/ForbiddenError.ts`
8. `src/application/exception/EmailAlreadyExistsError.ts`
9. `src/application/exception/EmailSendError.ts`
10. `src/infrastructure/config/resend.ts`
11. `src/domain/port/portout/EmailServicePort.ts`
12. `src/application/dto/SendEmailInputDTO.ts`
13. `src/application/dto/RegisterEmailInputDTO.ts`
14. `src/application/dto/RegisterEmailResultDTO.ts`
15. `src/infrastructure/email/adapter/ResendEmailAdapter.ts`
16. `src/infrastructure/email/templates/password-creation.template.ts`
17. `src/application/usecase/RegisterEmailUseCase.ts`
18. `test-register-email.ts`
19. `docs/CONFIGURACION_RESEND.md`

### 🔄 Archivos a Modificar (8)
1. `setup-database.sql` - Agregar columna role
2. `src/infrastructure/repository/entity/UserEntity.ts` - Agregar role
3. `src/domain/entity/User.ts` - Agregar role
4. `src/infrastructure/repository/mapper/UserMapper.ts` - Mapear role
5. `src/utils/jwt.ts` - Agregar generatePasswordCreationToken
6. `src/infrastructure/controller/AuthController.ts` - Agregar registerEmail
7. `src/infrastructure/routes/auth.routes.ts` - Agregar ruta protegida
8. `src/index.ts` - Validar nuevas variables de entorno
9. `.env.example` - Agregar variables de Resend
10. `README.md` - Documentar nuevo endpoint

---

## 🎯 Orden de Ejecución Recomendado

### Sprint 1: Autenticación y Autorización (Fases 1-2)
1. Implementar middleware de autenticación JWT
2. Agregar sistema de roles en base de datos
3. Implementar middleware de autorización admin
4. Probar protección de rutas

### Sprint 2: Servicio de Email (Fase 3)
1. Configurar cuenta de Resend
2. Integrar cliente de Resend
3. Crear adaptador y templates
4. Probar envío de emails

### Sprint 3: Caso de Uso y Endpoint (Fases 4-5)
1. Implementar RegisterEmailUseCase
2. Crear endpoint protegido
3. Integrar todo el flujo
4. Manejo de errores completo

### Sprint 4: Testing y Documentación (Fase 6)
1. Pruebas end-to-end
2. Documentación completa
3. Refinamiento y ajustes

---

## ⚠️ Consideraciones Importantes

### Seguridad
- ✅ JWT debe validarse en CADA request protegido
- ✅ Usar HTTPS en producción para headers Authorization
- ✅ JWT_SECRET debe ser fuerte (64+ caracteres)
- ✅ Tokens de creación de contraseña expiran en 24h
- ✅ No exponer APIs de Resend en frontend

### Performance
- ⚡ Envío de email es asíncrono, no bloquear respuesta si no es crítico
- ⚡ Cachear usuarios admin si se consultan frecuentemente

### Escalabilidad
- 📈 Resend Free: 100 emails/día (suficiente para MVP)
- 📈 Si creces, upgrade a plan pagado o cambiar a SendGrid
- 📈 Considerar cola de emails (Redis + Bull) si volumen aumenta

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

- [ ] Todas las pruebas pasan
- [ ] Email se recibe correctamente
- [ ] Link del email funciona
- [ ] Middleware de auth funciona
- [ ] Middleware de admin funciona
- [ ] Usuarios no-admin no pueden acceder
- [ ] Emails duplicados retornan 409
- [ ] Variables de entorno documentadas
- [ ] README actualizado
- [ ] Logs apropiados sin info sensible
- [ ] Manejo de errores completo y descriptivo
- [ ] Código sigue la arquitectura existente
- [ ] Sin hardcoding de valores (usar .env)

---

**¡Éxito en la implementación! 🚀**
