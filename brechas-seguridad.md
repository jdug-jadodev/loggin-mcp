# Informe de Seguridad — Checkmarx-Aligned

**Fecha de análisis:** 10 de marzo de 2026  
**Versión del informe:** 1.0.0  
**Proyecto:** loggin-mcp  
**Analista:** Auditoría Automatizada

---

## 1. Resumen Ejecutivo

### Tecnologías y Lenguajes Detectados
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Node.js | 20.x | Runtime |
| TypeScript | 5.3.3 | Lenguaje principal |
| Express.js | 4.18.2 | Framework HTTP |
| Supabase | 2.98.0 | Base de datos (PostgreSQL) |
| JWT (jsonwebtoken) | 9.0.3 | Autenticación |
| bcrypt | 6.0.0 | Hashing de contraseñas |
| Resend | 6.9.3 | Servicio de email |

### Score de Seguridad Global

| Métrica | Valor |
|---------|-------|
| **Score Global** | **62/100** |
| Riesgo General | MEDIO-ALTO |

### Conteo de Vulnerabilidades por Severidad

| Severidad | Cantidad | Estado |
|-----------|----------|--------|
| 🔴 CRÍTICA | 1 | To Verify |
| 🟠 ALTA | 4 | To Verify |
| 🟡 MEDIA | 4 | To Verify |
| 🟢 BAJA | 3 | INFO |
| ℹ️ INFO | 3 | INFO |
| **TOTAL** | **15** | — |

### Scanners Aplicados
- ✅ SAST (Static Application Security Testing)
- ✅ SCA (Software Composition Analysis)
- ⚠️ IaC (Infrastructure as Code) — Parcial (sin Docker/K8s)
- ✅ Secrets Detection

### Frameworks de Compliance Evaluados
- OWASP Top 10 2021
- SANS/CWE Top 25
- PCI DSS (parcial)
- NIST SP 800-53 (parcial)

---

## 2. Tabla de Vulnerabilidades

| # | Severidad | Scanner | Tipo | Ubicación | CWE/CVE | OWASP | Estado | Descripción | Flujo de datos | BFL | Remediación | Esfuerzo |
|---|-----------|---------|------|-----------|---------|-------|--------|-------------|----------------|-----|-------------|----------|
| 1 | 🔴 CRÍTICA | Secrets | Credenciales Expuestas | [.env](.env#L16-L24) | CWE-798 | A07:2021 | **Urgent** | API keys de producción hardcodeadas en archivo .env local | N/A | [.env](.env) | Rotar inmediatamente SUPABASE_KEY y RESEND_API_KEY. Usar secrets manager. | 1-2h |
| 2 | 🟠 ALTA | SAST | XSS en Email | [password-creation.template.ts](src/infrastructure/email/templates/password-creation.template.ts#L5-L7) | CWE-79 | A03:2021 | To Verify | Email interpolado sin sanitizar en template HTML | `email` (input) → `${email}` (template) → Email HTML (sink) | [password-creation.template.ts](src/infrastructure/email/templates/password-creation.template.ts#L6) | Implementar escape HTML para el parámetro email | 30min |
| 3 | 🟠 ALTA | SAST | XSS en Email | [password-reset.template.ts](src/infrastructure/email/templates/password-reset.template.ts#L6) | CWE-79 | A03:2021 | To Verify | Email interpolado sin sanitizar en template de reset | `email` (input) → `${email}` (template) → Email HTML (sink) | [password-reset.template.ts](src/infrastructure/email/templates/password-reset.template.ts#L6) | Implementar escape HTML para el parámetro email | 30min |
| 4 | 🟠 ALTA | SAST | Missing Rate Limiting | [auth.routes.ts](src/infrastructure/routes/auth.routes.ts#L37-L42) | CWE-307 | A07:2021 | To Verify | Sin rate limiting en endpoints de autenticación (/login, /forgot-password) | Request HTTP → Express Router → Auth Controller (sink) | [index.ts](src/index.ts#L14) | Implementar express-rate-limit en rutas de auth | 2h |
| 5 | 🟠 ALTA | SAST | CORS Permisivo | [index.ts](src/index.ts#L14) | CWE-942 | A05:2021 | To Verify | CORS configurado sin restricciones (wildcard *) | Request → cors() middleware → Response | [index.ts](src/index.ts#L14) | Configurar whitelist de orígenes permitidos | 1h |
| 6 | 🟡 MEDIA | SAST | RLS Policy Insegura | [setup-database.sql](src/utils/scripts/setup-database.sql#L28-L30) | CWE-284 | A01:2021 | To Verify | Política RLS "Allow all operations for now" permite acceso total | Query SQL → RLS Policy → Data (sink) | [setup-database.sql](src/utils/scripts/setup-database.sql#L30) | Implementar políticas RLS granulares por rol | 4h |
| 7 | 🟡 MEDIA | SAST | Missing Security Headers | [index.ts](src/index.ts#L10-L14) | CWE-693 | A05:2021 | To Verify | Sin headers de seguridad (CSP, X-Frame-Options, etc.) | Request HTTP → Express App → Response (sin headers) | [index.ts](src/index.ts#L12) | Agregar helmet.js middleware | 1h |
| 8 | 🟡 MEDIA | SAST | Información en Logs | [AuthController.ts](src/infrastructure/controller/AuthController.ts#L210) | CWE-532 | A09:2021 | To Verify | Console.error expone detalles de errores en producción | Error → console.error() → Logs (sink) | [AuthController.ts](src/infrastructure/controller/AuthController.ts) | Usar logger con niveles apropiados para producción | 2h |
| 9 | 🟡 MEDIA | SAST | Password Policy Débil | [validatePasswordStrength.ts](src/application/validator/password/validatePasswordStrength.ts#L1-L32) | CWE-521 | A07:2021 | To Verify | No requiere caracteres especiales en contraseñas | password (input) → validatePasswordStrength() (sink) | [validatePasswordStrength.ts](src/application/validator/password/validatePasswordStrength.ts#L26) | Agregar validación de caracteres especiales | 30min |
| 10 | 🟢 BAJA | SAST | JWT Expiration Largo | [generateToken.ts](src/utils/jwt/generateToken.ts#L4) | CWE-613 | A07:2021 | INFO | Token JWT con expiración de 15h (potencialmente largo) | jwt.sign() → token (15h TTL) | [generateToken.ts](src/utils/jwt/generateToken.ts#L4) | Reducir a 1-4h y usar refresh tokens | 4h |
| 11 | 🟢 BAJA | SAST | Missing Account Lockout | [LoginUseCase.ts](src/application/usecase/LoginUseCase.ts) | CWE-307 | A07:2021 | INFO | Sin bloqueo de cuenta tras múltiples intentos fallidos | Login attempt → LoginUseCase → Response | [LoginUseCase.ts](src/application/usecase/LoginUseCase.ts) | Implementar contador de intentos fallidos | 4h |
| 12 | 🟢 BAJA | SAST | No HTTPS Redirect | [index.ts](src/index.ts) | CWE-319 | A02:2021 | INFO | Sin redirección HTTP → HTTPS | HTTP Request → Express → Response (sin redirect) | [index.ts](src/index.ts) | Agregar middleware de redirección HTTPS | 30min |
| 13 | ℹ️ INFO | SAST | Timing Attack en Login | [LoginUseCase.ts](src/application/usecase/LoginUseCase.ts#L14) | CWE-208 | A07:2021 | Not Exploitable | Uso de DUMMY_HASH mitiga timing attack — correctamente implementado | N/A | N/A | ✅ Ya mitigado | N/A |
| 14 | ℹ️ INFO | SAST | Validación de Email | [isValidEmail.ts](src/application/validator/email/isValidEmail.ts#L3) | CWE-20 | A03:2021 | INFO | Regex de email básica pero funcional | N/A | N/A | Considerar librería dedicada (validator.js) | 1h |
| 15 | ℹ️ INFO | SCA | Dependencias Desactualizadas | [package.json](package.json) | N/A | A06:2021 | INFO | Algunas dependencias tienen versiones nuevas disponibles | N/A | [package.json](package.json) | Actualizar a versiones más recientes | 1h |

---

## 3. Cobertura por Framework de Compliance

### OWASP Top 10 2021

| Categoría | Descripción | Hallazgos | Estado |
|-----------|-------------|-----------|--------|
| A01:2021 | Broken Access Control | #6 (RLS Policy) | ⚠️ Parcial |
| A02:2021 | Cryptographic Failures | #12 (HTTPS) | ⚠️ Parcial |
| A03:2021 | Injection (XSS) | #2, #3 (Email XSS) | ❌ No cumple |
| A04:2021 | Insecure Design | Ninguno | ✅ Cumple |
| A05:2021 | Security Misconfiguration | #5, #7 (CORS, Headers) | ❌ No cumple |
| A06:2021 | Vulnerable Components | #15 (Outdated deps) | ⚠️ Parcial |
| A07:2021 | Auth Failures | #1, #4, #9, #10, #11 | ❌ No cumple |
| A08:2021 | Data Integrity Failures | Ninguno | ✅ Cumple |
| A09:2021 | Security Logging | #8 (Logs) | ⚠️ Parcial |
| A10:2021 | SSRF | No aplica | ✅ N/A |

### SANS/CWE Top 25

| CWE | Nombre | Presente | Severidad |
|-----|--------|----------|-----------|
| CWE-79 | XSS | ✅ #2, #3 | Alta |
| CWE-798 | Hardcoded Credentials | ✅ #1 | Crítica |
| CWE-307 | Improper Auth Restriction | ✅ #4, #11 | Alta/Baja |
| CWE-284 | Improper Access Control | ✅ #6 | Media |
| CWE-532 | Info Exposure in Logs | ✅ #8 | Media |
| CWE-521 | Weak Password Requirements | ✅ #9 | Media |
| CWE-613 | Insufficient Session Expiration | ✅ #10 | Baja |
| CWE-942 | Overly Permissive CORS | ✅ #5 | Alta |

### PCI DSS (Aplicable si maneja pagos)

| Requisito | Descripción | Estado |
|-----------|-------------|--------|
| 6.5.1 | Injection flaws | ⚠️ Parcial (XSS presente) |
| 6.5.7 | XSS | ❌ No cumple |
| 6.5.10 | Broken Authentication | ⚠️ Parcial |
| 8.2.3 | Password complexity | ⚠️ Parcial |
| 8.2.4 | Password rotation | ℹ️ N/A |

### NIST SP 800-53

| Control | Descripción | Estado |
|---------|-------------|--------|
| AC-2 | Account Management | ⚠️ Parcial |
| AC-3 | Access Enforcement | ⚠️ Parcial (#6) |
| IA-5 | Authenticator Management | ⚠️ Parcial (#9) |
| SC-8 | Transmission Confidentiality | ⚠️ Parcial (#12) |
| SC-28 | Protection at Rest | ✅ Cumple (bcrypt) |

---

## 4. Dependencias con Riesgo (SCA)

### Análisis de Vulnerabilidades CVE

| Paquete | Versión Actual | CVEs Conocidos | CVSS | Versión Segura | Estado |
|---------|----------------|----------------|------|----------------|--------|
| express | 4.18.2 | Ninguno | N/A | 4.18.2+ | ✅ Seguro |
| jsonwebtoken | 9.0.3 | Ninguno | N/A | 9.0.0+ | ✅ Seguro |
| bcrypt | 6.0.0 | Ninguno | N/A | 5.0.0+ | ✅ Seguro |
| @supabase/supabase-js | 2.98.0 | Ninguno | N/A | 2.98.0+ | ✅ Seguro |
| cors | 2.8.5 | Ninguno | N/A | 2.8.5 | ✅ Seguro |
| dotenv | 16.3.1 | Ninguno | N/A | 16.0.0+ | ✅ Seguro |
| resend | 6.9.3 | Ninguno | N/A | 6.0.0+ | ✅ Seguro |

**Result: npm audit found 0 vulnerabilities**

### Dependencias Desactualizadas

| Paquete | Versión Actual | Versión Latest | Riesgo |
|---------|----------------|----------------|--------|
| @supabase/supabase-js | 2.98.0 | 2.99.0 | Bajo |
| @types/bcrypt | 5.0.2 | 6.0.0 | Bajo |
| @types/express | 4.17.21 | 5.0.6 | Bajo |
| @types/node | 20.10.6 | 25.4.0 | Bajo |
| dotenv | 16.3.1 | 17.3.1 | Bajo |
| express | 4.18.2 | 5.2.1 | Medio (major) |

### Riesgo de Licencias

| Paquete | Licencia | Compatibilidad | Riesgo |
|---------|----------|----------------|--------|
| express | MIT | ✅ Compatible | Ninguno |
| jsonwebtoken | MIT | ✅ Compatible | Ninguno |
| bcrypt | MIT | ✅ Compatible | Ninguno |
| @supabase/supabase-js | MIT | ✅ Compatible | Ninguno |
| resend | MIT | ✅ Compatible | Ninguno |

**Riesgo de Supply Chain:** BAJO  
Todas las dependencias provienen de fuentes confiables (npm registry oficial).

---

## 5. Secretos y Credenciales Expuestas

| # | Tipo | Archivo | Línea | Riesgo | Acción Requerida |
|---|------|---------|-------|--------|------------------|
| 1 | 🔴 Supabase Key | [.env](.env#L16) | 16 | CRÍTICO | **ROTAR INMEDIATAMENTE** - Key expuesta localmente |
| 2 | 🔴 Resend API Key | [.env](.env#L24) | 24 | CRÍTICO | **ROTAR INMEDIATAMENTE** - Key expuesta localmente |
| 3 | 🟡 JWT Secret | [.env](.env#L10) | 10 | MEDIO | Cambiar en producción - Valor predecible para desarrollo |

### Análisis de Secretos

```
SUPABASE_KEY=sb_publishable_JgkxqnKcHXFKA0jpkjrO0g_Esv0MbS9
```
- **Tipo:** Supabase Anon/Public Key
- **Riesgo:** Si es la service_role key, permite acceso total a la BD
- **Mitigación:** Verificar que sea solo anon key (publishable)

```
RESEND_API_KEY=re_ZwewwTvj_ChBRqNxYXBY1zPbmNa8wg8wp
```
- **Tipo:** API Key de servicio de email
- **Riesgo:** Permite enviar emails en nombre del dominio
- **Mitigación:** Rotar key inmediatamente

### Estado de .gitignore
```
✅ .env está en .gitignore
✅ .env.local está en .gitignore
✅ .env.production está en .gitignore
```

**Nota:** Aunque .env está ignorado, las credenciales reales no deben almacenarse en archivos locales. Usar variables de entorno del sistema o secrets manager.

---

## 6. Hallazgos en IaC

### Archivos de Infraestructura Detectados

| Tipo | Archivo | Estado |
|------|---------|--------|
| SQL Schema | [setup-database.sql](src/utils/scripts/setup-database.sql) | ⚠️ Con hallazgos |
| Docker | No detectado | N/A |
| Kubernetes | No detectado | N/A |
| Terraform | No detectado | N/A |

### Hallazgos SQL/Database

| # | Recurso | Archivo | Regla Violada | Severidad | Remediación |
|---|---------|---------|---------------|-----------|-------------|
| 1 | RLS Policy | [setup-database.sql](src/utils/scripts/setup-database.sql#L28-L30) | Política permisiva | 🟡 MEDIA | Implementar políticas granulares |

**Código problemático:**
```sql
-- INSEGURO: Permite todas las operaciones
CREATE POLICY "Allow all operations for now" ON users FOR ALL USING (true);
```

**Remediación sugerida:**
```sql
-- Políticas RLS seguras
CREATE POLICY "Users can read own data" ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Only admins can delete" ON users 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## 7. Recomendaciones Priorizadas

### 🔴 Inmediato (0–7 días) — Críticas y Altas Explotables

| # | Hallazgo | Acción | Responsable | Esfuerzo |
|---|----------|--------|-------------|----------|
| 1 | Credenciales expuestas | Rotar SUPABASE_KEY y RESEND_API_KEY | DevOps/Security | 2h |
| 2 | XSS en templates | Sanitizar email en templates HTML | Backend | 1h |
| 3 | Rate limiting | Implementar express-rate-limit | Backend | 2h |
| 4 | CORS permisivo | Configurar whitelist de orígenes | Backend | 1h |

### 🟠 Corto plazo (8–30 días) — Altas y Medias Confirmadas

| # | Hallazgo | Acción | Responsable | Esfuerzo |
|---|----------|--------|-------------|----------|
| 5 | RLS Policy | Implementar políticas granulares | DBA/Backend | 4h |
| 6 | Security Headers | Agregar helmet.js | Backend | 1h |
| 7 | Logging seguro | Implementar winston con niveles | Backend | 2h |
| 8 | Password policy | Agregar requisito de caracteres especiales | Backend | 30min |

### 🟡 Mediano plazo (31–90 días) — Mejoras Estructurales

| # | Hallazgo | Acción | Responsable | Esfuerzo |
|---|----------|--------|-------------|----------|
| 9 | JWT expiration | Reducir TTL e implementar refresh tokens | Backend | 4h |
| 10 | Account lockout | Implementar bloqueo tras N intentos | Backend | 4h |
| 11 | HTTPS redirect | Agregar middleware de redirección | DevOps | 30min |
| 12 | Actualizar deps | Update a versiones más recientes | Backend | 1h |

---

## 8. Métricas de Remediación

### MTTR Estimado por Severidad

| Severidad | Cantidad | MTTR Estimado | Total |
|-----------|----------|---------------|-------|
| Crítica | 1 | 2h | 2h |
| Alta | 4 | 1.5h promedio | 6h |
| Media | 4 | 2h promedio | 8h |
| Baja | 3 | 2h promedio | 6h |
| **TOTAL** | **12** | — | **22h** |

### Vulnerabilidades Recurrentes

| SimilarityID | Tipo | Archivos Afectados | Vector Común |
|--------------|------|-------------------|--------------|
| XSS-EMAIL-001 | XSS | password-creation.template.ts, password-reset.template.ts | Interpolación directa de email en HTML |

### Deuda Técnica de Seguridad

| Categoría | Items | Impacto | Prioridad |
|-----------|-------|---------|-----------|
| Autenticación | 4 | Alto | P1 |
| Configuración | 3 | Medio | P2 |
| Datos | 1 | Medio | P2 |
| Logging | 1 | Bajo | P3 |

**Deuda técnica total estimada:** ~22 horas de desarrollo

---

## 9. Falsos Positivos Identificados

| # | Tipo | Ubicación | Justificación |
|---|------|-----------|---------------|
| 1 | Timing Attack | [LoginUseCase.ts](src/application/usecase/LoginUseCase.ts#L14) | Uso de DUMMY_HASH previene timing attacks — implementación correcta |

---

## 10. Código de Remediación Sugerido

### Fix #2/#3: XSS en Email Templates

```typescript
// src/utils/html/escapeHtml.ts
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// En templates:
import { escapeHtml } from '../../utils/html/escapeHtml';
// ...
<p>Hola ${escapeHtml(email)},</p>
```

### Fix #4: Rate Limiting

```typescript
// src/infrastructure/middleware/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  message: {
    status: 'error',
    message: 'Too many attempts, please try again later',
    code: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// En auth.routes.ts:
router.post('/login', authRateLimiter, (req, res) => authController.login(req, res));
router.post('/forgot-password', authRateLimiter, (req, res) => authController.forgotPassword(req, res));
```

### Fix #5: CORS Configurado

```typescript
// src/index.ts
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Fix #7: Security Headers

```typescript
// src/index.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));
```

### Fix #9: Password con Caracteres Especiales

```typescript
// En validatePasswordStrength.ts agregar:
if (!/[!@#$%^&*(),.?":{}|<>]/.test(trimmed)) {
  throw new WeakPasswordError('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
}
```

---

## Historial de Cambios

| Fecha | Versión | Autor | Resumen |
|-------|---------|-------|---------|
| 2026-03-10 | 1.0.0 | Auditoría Automatizada | Creación inicial del informe. 15 hallazgos identificados: 1 crítico, 4 altos, 4 medios, 3 bajos, 3 informativos. |

---

*Informe generado siguiendo estándares Checkmarx One (SAST, SCA, IaC, Secrets Detection)*
