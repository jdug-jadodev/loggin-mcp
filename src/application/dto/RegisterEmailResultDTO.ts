export interface RegisterEmailResultDTO {
  userId: string;
  email: string;
  message?: string;
  emailSent: boolean;
}