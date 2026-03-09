export class EmailSendError extends Error {
  public code = 'EMAIL_SEND_FAILED';
  constructor(message?: string) {
    super(message || 'Failed to send email');
    this.name = 'EmailSendError';
  }
}
