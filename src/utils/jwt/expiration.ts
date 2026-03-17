export function parseExpirationToMs(exp: string): number {
  const trimmed = (exp || '').trim();
  const match = /^([0-9]+)\s*(s|m|h)$/.exec(trimmed);

  if (!match) {
    const asNum = Number(trimmed);
    return Number.isFinite(asNum) ? asNum : 0;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    default:
      return 0;
  }
}

export function getTokenExpiration(): { expiresIn: string; expiresMs: number } {
  const expiresIn = process.env.JWT_EXPIRES_IN || '15h';
  const expiresMs = parseExpirationToMs(expiresIn);
  return { expiresIn, expiresMs };
}
