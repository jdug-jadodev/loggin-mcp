export interface ResetPasswordInputDTO {
  readonly token: string;
  readonly newPassword: string;
}
