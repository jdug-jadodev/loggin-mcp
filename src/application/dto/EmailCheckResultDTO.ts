export interface EmailCheckResultDTO {
  readonly exists: boolean;
  readonly hasPassword: boolean;
  readonly email: string;
}
