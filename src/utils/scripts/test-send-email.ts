import 'dotenv/config';
import { ResendEmailAdapter } from '../../infrastructure/email/adapter/ResendEmailAdapter';

(async () => {
  const adapter = new ResendEmailAdapter();
  try {
    await adapter.sendPasswordCreationEmail('jdavid598@hotmail.com', 'test-jwt-token-123');
    console.log('Email de creación enviado OK');
  } catch (err: any) {
    console.error('Error al enviar email:', err?.message || err);
    process.exit(1);
  }
})();