# Guía Frontend: Logout y Manejo de Expiración / Revocación de JWT

Esta guía explica cómo integrar el logout y el manejo de tokens expirados/revocados en el frontend para trabajar con el backend de `loggin-mcp`.

Resumen
- El backend genera JWT con `jti` y `exp`.
- Existe un endpoint `POST /auth/logout` que revoca el token actual guardando su `jti` en la tabla `revoked_tokens`.
- El middleware del backend rechaza tokens cuyo `jti` esté revocado.

Objetivos del frontend
- Al hacer logout: llamar a `POST /auth/logout` (con `Authorization: Bearer <token>`), limpiar el token local y redirigir al login.
- Detectar expiración local del token y/o manejar respuestas 401 del servidor para forzar logout.
- Soportar revocación remota (token invalidado en otro dispositivo) mediante manejo centralizado de errores 401.

Recomendaciones de almacenamiento
- Público/simple: `localStorage` o `sessionStorage` para `token` y `token_expires_at`.
- Recomendado producción: `HttpOnly` secure cookies para mayor seguridad (requiere cambios en backend).

Formato esperado del login response
El endpoint de login devuelve JSON con al menos:
```json
{ "token": "<jwt>", "expiresIn": "15h" }
```
`expiresIn` usa la misma convención que el backend (`1m`, `15h`, etc.).

Utilidades (frontend)
- `parseExpirationToMs(exp: string): number` — convierte `1m`/`15h`/`30s` a milisegundos.

Ejemplo de implementación de util:
```js
function parseExpirationToMs(exp) {
  if (!exp) return 0;
  const m = exp.match(/^(\d+)\s*(s|m|h)$/);
  if (!m) return Number(exp) || 0;
  const v = Number(m[1]);
  if (m[2] === 's') return v * 1000;
  if (m[2] === 'm') return v * 60 * 1000;
  return v * 60 * 60 * 1000;
}
```

Flujo: login -> guardar token
```js
async function onLoginSuccess(responseJson) {
  const token = responseJson.token;
  const expiresIn = responseJson.expiresIn; // '1m' por ejemplo
  localStorage.setItem('token', token);
  const expiresAt = Date.now() + parseExpirationToMs(expiresIn);
  localStorage.setItem('token_expires_at', String(expiresAt));
  scheduleLocalExpiryCheck(expiresAt);
}
```

Función `scheduleLocalExpiryCheck` (opcional)
```js
let expiryTimeoutId = null;
function scheduleLocalExpiryCheck(expiresAt) {
  if (expiryTimeoutId) clearTimeout(expiryTimeoutId);
  const ms = Math.max(0, expiresAt - Date.now());
  expiryTimeoutId = setTimeout(() => {
    // Opcional: llamar /auth/logout para revocar antes de limpiar
    performLocalLogout();
  }, ms);
}
```

Logout (acción del usuario)
```js
async function logout() {
  const token = localStorage.getItem('token');
  try {
    if (token) {
      await fetch('/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  } catch (err) {
    // Ignorar errores de red; igualmente limpiar cliente
    console.error('Logout request failed', err);
  }
  performLocalLogout();
}

function performLocalLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('token_expires_at');
  if (expiryTimeoutId) {
    clearTimeout(expiryTimeoutId);
    expiryTimeoutId = null;
  }
  // Redirigir a login o limpiar estado de app
  window.location.href = '/login';
}
```

Manejo centralizado de 401 (fetch wrapper)
- Implementa un wrapper global para `fetch` o usa interceptores en `axios`.
- Si la respuesta es 401 y el `code` del body es `TOKEN_EXPIRED` o `INVALID_TOKEN`, entonces ejecutar `performLocalLogout()` y redirigir.

Ejemplo básico (fetch wrapper):
```js
async function apiFetch(url, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = opts.headers ? {...opts.headers} : {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {...opts, headers});
  if (res.status === 401) {
    // Opcional: parsear body para codigo
    performLocalLogout();
    throw new Error('Unauthorized');
  }
  return res;
}
```

Revocación remota (logout desde otro cliente)
- Si el token se revoca en backend (por ejemplo usando el logout de otro dispositivo), las siguientes llamadas de API devolverán 401 y tu wrapper las manejará haciendo logout local automáticamente.
- No es necesario polling; confiar en respuestas 401 es suficiente.

Prueba de integración (end-to-end manual)
1. Login desde cliente A → obtener token A
2. Realiza llamadas protegidas con token A (deben funcionar)
3. Desde cliente B, login con la misma cuenta y llama `POST /auth/logout` con token B (o desde server revocar jti de token A)
4. En cliente A, la próxima llamada protegida debe retornar 401 → el frontend hará logout y redirigirá.

Checklist rápida para integrar
- [ ] Guardar `token` y `token_expires_at` tras login
- [ ] Implementar `apiFetch` o interceptor que incluya `Authorization` y maneje 401
- [ ] Implementar `logout()` que llama `/auth/logout` y limpia estado
- [ ] Programar `scheduleLocalExpiryCheck` opcional para mejor UX
- [ ] Probar revocación remota (logout desde otro dispositivo)
- [ ] Considerar migración a HttpOnly cookies para producción

Notas finales
- Para pruebas en producción con tokens muy cortos, configura `JWT_EXPIRES_IN=1m` en el dashboard de Render; el backend generará tokens con `exp` en 1 minuto.
- Si necesitas ejemplos para un framework concreto (React + Context, Angular + HttpInterceptor, Vue + Pinia), puedo generar el código listo para pegar.

---

**Archivo generado automáticamente:** `FRONTEND_LOGOUT.md`
