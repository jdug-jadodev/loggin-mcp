import { resend, RESEND_FROM_EMAIL, APP_BASE_URL } from '../../config/resend';
import { EmailServicePort } from '../../../domain/port/portout/EmailServicePort';
import { creationTemplate } from '../templates/password-creation.template';
import { EmailSendError } from '../../../application/exception/EmailSendError';
import { resetTemplate } from '../templates/password-reset.template';

export class ResendEmailAdapter implements EmailServicePort {
  private maxRetries = 3;

  private async sendWithRetries(payload: any) {
    let attempt = 0;
    while (attempt < this.maxRetries) {
      try {
        // @ts-ignore - resend types may vary by version
        await resend.emails.send(payload);
        return;
      } catch (err) {
        attempt += 1;
        if (attempt >= this.maxRetries) {
          throw new EmailSendError('Failed to send email after retries');
        }
        // simple backoff
        await new Promise((r) => setTimeout(r, 200 * attempt));
      }
    }
  }

  async sendPasswordCreationEmail(to: string, token: string) {
    const url = `${APP_BASE_URL}/auth/create-password?token=${encodeURIComponent(token)}`;
    const html = creationTemplate(to, url);
    const payload = {
      from: RESEND_FROM_EMAIL,
      to,
      subject: 'Crear contraseña en TuApp',
      html,
    };
    await this.sendWithRetries(payload);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const url = `${APP_BASE_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;
    const html = resetTemplate(to, url);
    const payload = {
      from: RESEND_FROM_EMAIL,
      to,
      subject: 'Recuperar contraseña en TuApp',
      html,
    };
    await this.sendWithRetries(payload);
  }
}
