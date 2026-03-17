export interface ValidatePasswordTokenResultDTO {
  readonly valid: boolean;
  readonly status: 'valid' | 'expired' | 'used' | 'not_found' | 'invalid_type' | 'error';
  readonly message: string;
  readonly email?: string;
}
