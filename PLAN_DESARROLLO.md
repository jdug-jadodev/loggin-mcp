# Plan de Desarrollo - Microservicio de Autenticación

## Resumen del Proyecto
Microservicio de autenticación con Node.js + Express + TypeScript que usa JWT y Supabase.

**Flujo principal:**
1. Correos agregados manualmente en Supabase
2. Primera vez: Usuario crea contraseña si su correo existe
3. Login: Genera JWT válido por 15 horas
4. Token expirado: Requiere nuevo login

---

## Fase 1: Configuración Inicial del Proyecto

### Tarea 1.1: Inicializar proyecto Node.js con TypeScript
- [ ] Crear `package.json` con `npm init`
- [ ] Instalar dependencias base: `express`, `typescript`, `ts-node`, `@types/node`, `@types/express`
- [ ] Configurar `tsconfig.json` para TypeScript
- [ ] Crear estructura de carpetas (`src/`, `dist/`)

### Tarea 1.2: Configurar Express básico
- [ ] Crear archivo `src/index.ts` con servidor Express básico
- [ ] Configurar middlewares esenciales (`express.json()`, `cors`)
- [ ] Crear script de desarrollo con `nodemon` o `ts-node-dev`
- [ ] Verificar que el servidor corre correctamente

### Tarea 1.3: Configurar variables de entorno
- [ ] Instalar `dotenv`
- [ ] Crear archivo `.env.example` con variables necesarias
- [ ] Crear `.env` local (agregar a `.gitignore`)
- [ ] Definir variables: `PORT`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_KEY`

---

## Fase 2: Configuración de Supabase

### Tarea 2.1: Configurar cliente Supabase
- [ ] Instalar `@supabase/supabase-js`
- [ ] Crear archivo `src/config/supabase.ts` con configuración del cliente
- [ ] Exportar instancia de Supabase para reutilizar

### Tarea 2.2: Diseñar esquema de base de datos
- [ ] Crear tabla `users` en Supabase con campos:
  - `id` (UUID, primary key)
  - `email` (text, unique, not null)
  - `password_hash` (text, nullable) - null = sin contraseña aún
  - `has_password` (boolean, default false)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
- [ ] Configurar políticas RLS (Row Level Security) si es necesario

---

## Fase 3: Módulo de Contraseñas

### Tarea 3.1: Configurar bcrypt para hash de contraseñas
- [ ] Instalar `bcrypt` y `@types/bcrypt`
- [ ] Crear utilidad `src/utils/password.ts`
- [ ] Implementar función `hashPassword(password: string)`
- [ ] Implementar función `comparePassword(password: string, hash: string)`

---

## Fase 4: Módulo de JWT

### Tarea 4.1: Configurar JWT
- [ ] Instalar `jsonwebtoken` y `@types/jsonwebtoken`
- [ ] Crear archivo `src/utils/jwt.ts`

### Tarea 4.2: Implementar generación de tokens
- [ ] Crear función `generateToken(userId: string, email: string)` 
- [ ] Configurar expiración de 15 horas (`expiresIn: '15h'`)
- [ ] Incluir payload: `{ userId, email }`

### Tarea 4.3: Implementar verificación de tokens
- [ ] Crear función `verifyToken(token: string)`
- [ ] Manejar errores de token expirado o inválido

---

## Fase 5: Servicios de Autenticación

### Tarea 5.1: Servicio de verificación de correo
- [ ] Crear `src/services/auth.service.ts`
- [ ] Implementar `checkEmailExists(email: string)` - verifica si correo existe en Supabase
- [ ] Retornar si el usuario ya tiene contraseña o no

### Tarea 5.2: Servicio de creación de contraseña
- [ ] Implementar `createPassword(email: string, password: string)`
- [ ] Validar que el correo existe en BD
- [ ] Validar que el usuario NO tiene contraseña aún
- [ ] Hashear contraseña con bcrypt
- [ ] Actualizar usuario en Supabase con `password_hash` y `has_password = true`

### Tarea 5.3: Servicio de login
- [ ] Implementar `login(email: string, password: string)`
- [ ] Validar que el correo existe
- [ ] Validar que el usuario tiene contraseña (`has_password = true`)
- [ ] Comparar contraseña con bcrypt
- [ ] Generar y retornar JWT si las credenciales son válidas

---

## Fase 6: Controladores y Rutas

### Tarea 6.1: Crear controlador de autenticación
- [ ] Crear `src/controllers/auth.controller.ts`
- [ ] Implementar `checkEmail` - endpoint para verificar si correo existe
- [ ] Implementar `createPassword` - endpoint para crear contraseña primera vez
- [ ] Implementar `login` - endpoint para iniciar sesión

### Tarea 6.2: Crear rutas de autenticación
- [ ] Crear `src/routes/auth.routes.ts`
- [ ] Definir rutas:
  - `POST /auth/check-email` - verificar correo
  - `POST /auth/create-password` - crear contraseña
  - `POST /auth/login` - iniciar sesión
- [ ] Registrar rutas en `src/index.ts`

---

## Fase 7: Middlewares de Protección

### Tarea 7.1: Crear middleware de autenticación
- [ ] Crear `src/middlewares/auth.middleware.ts`
- [ ] Implementar `authenticateToken` - verifica JWT en headers
- [ ] Extraer token del header `Authorization: Bearer <token>`
- [ ] Verificar token con `verifyToken()`
- [ ] Agregar `userId` y `email` a `req` si es válido
- [ ] Retornar 401 si token inválido o expirado

### Tarea 7.2: Crear ruta protegida de ejemplo
- [ ] Crear `GET /auth/profile` - endpoint protegido de prueba
- [ ] Aplicar middleware `authenticateToken`
- [ ] Retornar información del usuario autenticado

---

## Fase 8: Validaciones y Manejo de Errores

### Tarea 8.1: Implementar validaciones de entrada
- [ ] Instalar `express-validator` o `joi`
- [ ] Crear validaciones para:
  - Email formato válido
  - Contraseña (mínimo 8 caracteres, mayúsculas, números, etc.)
- [ ] Aplicar validaciones en rutas

### Tarea 8.2: Crear middleware de manejo de errores
- [ ] Crear `src/middlewares/error.middleware.ts`
- [ ] Implementar manejo centralizado de errores
- [ ] Definir respuestas estándar de error
- [ ] Aplicar middleware en `src/index.ts`

### Tarea 8.3: Crear tipos de error personalizados
- [ ] Crear `src/utils/errors.ts`
- [ ] Definir clases: `UnauthorizedError`, `NotFoundError`, `ValidationError`

---

## Fase 9: Testing y Documentación

### Tarea 9.1: Pruebas con Postman/ThunderClient
- [ ] Probar flujo completo:
  1. Verificar correo no registrado (debe fallar)
  2. Agregar correo manualmente en Supabase
  3. Verificar correo registrado (debe pasar)
  4. Crear contraseña primera vez
  5. Intentar crear contraseña de nuevo (debe fallar)
  6. Login con credenciales correctas
  7. Login con credenciales incorrectas (debe fallar)
  8. Acceder a ruta protegida con token válido
  9. Esperar 15+ horas o modificar expiración para probar token expirado

### Tarea 9.2: Documentar API
- [ ] Crear `API_DOCS.md` con:
  - Descripción de cada endpoint
  - Ejemplos de request/response
  - Códigos de error posibles

### Tarea 9.3: Actualizar README.md
- [ ] Instrucciones de instalación
- [ ] Variables de entorno necesarias
- [ ] Cómo ejecutar el proyecto
- [ ] Flujo de autenticación explicado

---

## Fase 10: Mejoras Opcionales (Futuras)

### Tarea 10.1: Implementar refresh tokens
- [ ] Token de acceso (15 horas) + Refresh token (30 días)
- [ ] Endpoint para renovar token sin re-login

### Tarea 10.2: Historial de sesiones
- [ ] Tabla para guardar sesiones activas
- [ ] Endpoint para cerrar sesión (invalidar token)

### Tarea 10.3: Recuperación de contraseña
- [ ] Endpoint para solicitar reset de contraseña
- [ ] Envío de email con link temporal

### Tarea 10.4: Rate limiting
- [ ] Limitar intentos de login fallidos
- [ ] Protección contra fuerza bruta

---

## Orden de Ejecución Recomendado

**Semana 1 - Fundamentos:**
- Fase 1: Configuración inicial (Tareas 1.1, 1.2, 1.3)
- Fase 2: Supabase (Tareas 2.1, 2.2)
- Fase 3: Contraseñas (Tarea 3.1)
- Fase 4: JWT (Tareas 4.1, 4.2, 4.3)

**Semana 2 - Lógica de Negocio:**
- Fase 5: Servicios (Tareas 5.1, 5.2, 5.3)
- Fase 6: Controladores y Rutas (Tareas 6.1, 6.2)

**Semana 3 - Seguridad y Testing:**
- Fase 7: Middlewares (Tareas 7.1, 7.2)
- Fase 8: Validaciones (Tareas 8.1, 8.2, 8.3)
- Fase 9: Testing (Tareas 9.1, 9.2, 9.3)

**Futuro - Mejoras:**
- Fase 10: Según necesidades del proyecto

---

## Notas Importantes

1. **Seguridad:**
   - Nunca guardar contraseñas en texto plano
   - Siempre usar HTTPS en producción
   - Mantener `JWT_SECRET` seguro y complejo

2. **Supabase:**
   - Los correos se agregan manualmente en la tabla `users`
   - Campo `password_hash` debe ser nullable
   - Usar RLS para seguridad adicional

3. **Token JWT:**
   - Duración: 15 horas exactas
   - Incluir solo información necesaria en payload
   - No guardar datos sensibles en el token

4. **Flujo de autenticación:**
   ```
   Usuario nuevo → Correo en BD? → No → Acceso denegado
                                 → Sí → Tiene password? → No → Crear password
                                                        → Sí → Login → Token (15h)
   ```
