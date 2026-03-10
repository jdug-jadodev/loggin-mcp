import { EmailServicePort } from '../../../domain/port/portout/EmailServicePort';
import { resendClient } from '../../config/resend';
import { passwordCreationTemplate } from '../templates/password-creation.template';
import { EmailSendError } from '../../../application/exception/EmailSendError';

export class ResendEmailAdapter implements EmailServicePort {
  private from = process.env.RESEND_FROM_EMAIL || '';
  private appBase = process.env.APP_BASE_URL || '';

  async sendPasswordCreationEmail(to: string, token: string): Promise<void> {
    if (!this.from) throw new EmailSendError('RESEND_FROM_EMAIL not configured');
    if (!this.appBase) throw new EmailSendError('APP_BASE_URL not configured');

    const url = `${this.appBase.replace(/\/$/, '')}/create-password?token=${encodeURIComponent(token)}`;
    const html = passwordCreationTemplate(to, url);

    try {
      await resendClient.emails.send({
        from: this.from,
        to,
        subject: 'Crear contraseña',
        html
      });
    } catch (err) {
      throw new EmailSendError((err as Error).message);
    }
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    if (!this.from) throw new EmailSendError('RESEND_FROM_EMAIL not configured');
    if (!this.appBase) throw new EmailSendError('APP_BASE_URL not configured');

    const url = `${this.appBase.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
    const html = `
      <html><body>
        <p>Haz clic en el enlace para resetear tu contraseña. El enlace expira en 15 minutos.</p>
        <p><a href="${url}">Resetear contraseña</a></p>
      </body></html>
    `;

    try {
      await resendClient.emails.send({
        from: this.from,
        to,
        subject: 'Resetear contraseña',
        html
      });
    } catch (err) {
      throw new EmailSendError((err as Error).message);
    }
  }
}

export default ResendEmailAdapter;