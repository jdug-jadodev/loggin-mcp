export function getSaltRounds(): number {
  const env = process.env.SALT_ROUNDS;
  const parsed = env ? parseInt(env, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}
