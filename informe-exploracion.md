# Informe de Exploración Automática

## Contexto detectado
- Lenguaje principal: TypeScript (Node.js).
- Framework HTTP: Express.
- Base de datos / BaaS: Supabase (uso de `@supabase/supabase-js`).
- Autenticación: JWT (`jsonwebtoken`) y gestión de contraseñas con `bcrypt`.
- Arquitectura: Capas estilo Clean/Hexagonal (carpetas `application`, `domain`, `infrastructure`, `dto`, `usecase`, `portout` y `adapter`).
- Proyecto orientado a microservicio de autenticación (entrada en `src/index.ts`, rutas en `src/infrastructure/routes`).
- Herramientas de desarrollo: TypeScript, `ts-node-dev` para desarrollo, `tsc` para compilación.

## Archivos analizados
- package.json
- tsconfig.json
- src/index.ts
- src/infrastructure/routes/auth.routes.ts
- src/infrastructure/routes/health.routes.ts
- src/infrastructure/routes/notFound.routes.ts
- src/infrastructure/controller/AuthController.ts
- src/infrastructure/controller/HealthController.ts
- src/infrastructure/repository/adapter/SupabaseUserRepositoryAdapter.ts
- src/domain/entity/User.ts
- src/domain/port/portout/UserRepositoryPort.ts
- src/application/usecase/* (CheckEmailExistsUseCase, CreatePasswordUseCase, LoginUseCase)
- src/application/validator/* (EmailValidator, PasswordValidator)
- src/utils/jwt.ts
- src/utils/password.ts
- tests / scripts sueltos: test-jwt.ts, test-password.ts, test-supabase.ts, test-jwt-simple.ts

## Explicación detallada
- Estructura y patrón: El código sigue una separación de responsabilidades clara. Las rutas y controladores están en `infrastructure`, las reglas de negocio y casos de uso en `application/usecase`, y los contratos de persistencia en `domain/port/portout`. Esto es característico de una arquitectura hexagonal o limpia y facilita pruebas e intercambio de adaptadores (por ejemplo, cambiar Supabase por otra DB).

- Entrypoint y configuración: `src/index.ts` inicia un servidor Express, aplica JSON body parsing y CORS, registra rutas y valida variables de entorno mínimas (`JWT_SECRET`). También maneja errores de proceso (uncaughtException, unhandledRejection) y señales.

- Persistencia y adaptadores: Existe un adaptador para Supabase (`SupabaseUserRepositoryAdapter`) que implementa el `UserRepositoryPort`, lo que permite desacoplar la lógica de negocio de la capa de datos.

- Seguridad y autenticación: Se usa `bcrypt` para hashing de contraseñas y `jsonwebtoken` para generación de tokens. Hay utilidades en `src/utils` que encapsulan esas responsabilidades.

- Manejo de errores: Hay excepciones de dominio (ej. `EmailNotFoundError`, `InvalidCredentialsError`, `WeakPasswordError`) y el controlador las mapea a respuestas HTTP con códigos y mensajes estructurados.

- Validación y DTOs: Se usan validadores básicos (`EmailValidator`, `PasswordValidator`) y DTOs en `application/dto` para normalizar entradas/salidas.

- Scripts y desarrollo: `npm run dev` usa `ts-node-dev` para desarrollo; `build` usa `tsc`. No se encontró configuración de linters ni de tests automatizados (aunque hay scripts de prueba manuales `.ts`).

## Puntos fuertes
- Arquitectura clara y modular (clean/hexagonal), lo que favorece mantenibilidad y testabilidad.
- Buen manejo de errores y mapeo a respuestas HTTP desde el controlador.
- Uso de adaptadores de persistencia: facilita swapping de la capa de datos.
- Encapsulado de utilidades sensibles (JWT, hashing) en `utils`.
- Validación básica de entradas y separación de responsabilidades.

## Áreas de mejora
- Variables de entorno: `src/index.ts` valida `JWT_SECRET`, pero no se observa verificación de variables relacionadas con Supabase (`SUPABASE_URL`, `SUPABASE_KEY`) — añadir validación y un `.env.example` mejoraría on-boarding.
- Tests automatizados y CI: Hay scripts de prueba manuales, falta integración con Jest/Mocha y pipelines (GitHub Actions) para tests y linting.
- Cobertura de validaciones: aumentar validaciones (longitud, reglas de contraseña, límites) y usar un esquema de validación centralizado (Zod/Joi) para evitar duplicación.
- Seguridad de tokens: claramente se generan JWTs, pero convendría revisar políticas de expiración, refresh tokens, revocación y almacenamiento seguro de `JWT_SECRET` (secret manager cuando sea posible).
- Rate limiting y protección contra abuso en endpoints de auth (ej. `express-rate-limit`).
- Observabilidad: añadir logging estructurado (p. ej. `pino` o `winston`), métricas y trazabilidad (opcionalado). También integrar Sentry/u otra herramienta de monitoreo de errores.
- Lint/Formatting: no se encontró ESLint/Prettier configurado — recomendable para consistencia.
- Manejo de errores internos: algunos catch generales devuelven 500; considerar instrumentar y diferenciar fallos recuperables de no recuperables.

## Próximos pasos recomendados (priorizados)
- Añadir un `.env.example` con variables requeridas (`JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_KEY`, `NODE_ENV`, `PORT`).
- Integrar pruebas unitarias y de integración (Jest + supertest) para controladores y casos de uso.
- Configurar CI (GitHub Actions) para ejecutar lint + build + tests en PRs.
- Añadir ESLint y Prettier, y una configuración base de TypeScript stricter (`strict: true` en `tsconfig.json`).
- Revisar seguridad del flujo de tokens: definir expiraciones, refresh tokens y estrategias de revocación.
- Añadir límites y protección (rate limiting, validación de tamaño de payload ya presente) y políticas de CORS más restrictivas en producción.
- Añadir logging estructurado y monitorización de errores.

## Recursos útiles
- Express + TypeScript: https://expressjs.com/ + guías de TS para Express.
- Validación: Zod (https://github.com/colinhacks/zod) o Joi.
- Testing: Jest + supertest para pruebas HTTP.
- Linting: ESLint + Prettier + plugins de TypeScript.
- Seguridad: OWASP ASVS y recomendaciones para JWT (gestión de expiración, revocación), y `express-rate-limit`.
- Supabase: documentación oficial https://supabase.com/docs

---

_Informe generado automáticamente por análisis estático del repositorio._
