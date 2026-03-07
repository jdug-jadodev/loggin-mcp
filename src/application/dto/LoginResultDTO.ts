export interface LoginResultDTO {
  readonly token: string;
  readonly userId: string;
  readonly email: string;
  readonly expiresIn: string; // e.g. "15h"
  readonly expiresAt: number; // epoch ms
}
