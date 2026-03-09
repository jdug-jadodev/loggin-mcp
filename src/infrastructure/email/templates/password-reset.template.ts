export const resetTemplate = (email: string, url: string) => `
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;line-height:1.4;color:#222;">
    <div style="max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#111;">Restablecer contraseña</h2>
      <p>Hola ${email},</p>
      <p>Haz clic en el botón para restablecer tu contraseña. El enlace expira en 15 minutos.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${url}" style="padding:12px 20px;background:#d93025;color:#fff;border-radius:6px;text-decoration:none;display:inline-block;">Restablecer contraseña</a>
      </p>
      <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
      <p style="word-break:break-all;color:#555;">${url}</p>
      <hr />
      <small style="color:#888;">Si no solicitaste esto, ignora este correo.</small>
    </div>
  </body>
</html>
`;
