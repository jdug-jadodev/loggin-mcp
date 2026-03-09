export interface RegisterEmailResultDTO {
  readonly userId: string;
  readonly email: string;
  readonly message: string;
  readonly emailSent: boolean;
}
