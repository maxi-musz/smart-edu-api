import { ConfigService } from '@nestjs/config';

/**
 * Chooses the Paystack secret key from env.
 *
 * - **production** (`NODE_ENV === 'production'`): `PAYSTACK_LIVE_SECRET_KEY`, then `PAYSTACK_SECRET_KEY`.
 * - **Other envs** (development, staging, test): `PAYSTACK_TEST_SECRET_KEY`, then `PAYSTACK_SECRET_KEY`.
 *
 * So you can keep a single `PAYSTACK_SECRET_KEY` (current behaviour), or set explicit test/live
 * keys and switch automatically by environment.
 */
export function resolvePaystackSecretKey(config: ConfigService): string {
  const nodeEnv = config.get<string>('NODE_ENV') || 'development';
  const useLiveKeys = nodeEnv === 'production';

  const generic = config.get<string>('PAYSTACK_SECRET_KEY') || '';
  const testKey = config.get<string>('PAYSTACK_TEST_SECRET_KEY') || '';
  const liveKey = config.get<string>('PAYSTACK_LIVE_SECRET_KEY') || '';

  if (useLiveKeys) {
    return liveKey || generic;
  }
  return testKey || generic;
}
