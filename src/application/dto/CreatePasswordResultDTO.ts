export interface CreatePasswordResultDTO {
  readonly success: boolean;
  readonly userId: string;
  readonly email: string;
  readonly message?: string;
}
