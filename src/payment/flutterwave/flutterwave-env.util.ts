import { ConfigService } from '@nestjs/config';

function useLiveKeys(config: ConfigService): boolean {
  return (config.get<string>('NODE_ENV') || 'development') === 'production';
}

const V3_DEFAULT_HOST = 'api.flutterwave.com';

/**
 * Base URL for Flutterwave **v3** (`/payments`, `/transactions/verify_by_reference`, …).
 *
 * - **Test vs live money** is determined by the **secret key** (`FLWSECK_test_…` vs `FLWSECK_live_…`),
 *   not by using `developersandbox-api.flutterwave.com` (that host targets newer v4-style APIs).
 * - **Non-production:** always `https://api.flutterwave.com/v3` unless you set a full override.
 * - **Production:** `https://{FLUTTERWAVE_LIVE_BASE_URL}/v3` (hostname only, default `api.flutterwave.com`).
 *
 * Override everything with `FLUTTERWAVE_V3_API_BASE_URL` (e.g. `https://api.flutterwave.com/v3`).
 */
export function resolveFlutterwaveV3ApiBaseUrl(config: ConfigService): string {
  const explicit = config.get<string>('FLUTTERWAVE_V3_API_BASE_URL')?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  if (useLiveKeys(config)) {
    const raw = config.get<string>('FLUTTERWAVE_LIVE_BASE_URL') || V3_DEFAULT_HOST;
    const host = raw.replace(/^https?:\/\//, '').split('/')[0].trim() || V3_DEFAULT_HOST;
    return `https://${host}/v3`;
  }

  return `https://${V3_DEFAULT_HOST}/v3`;
}

/**
 * Bearer secret for `https://api.flutterwave.com/v3` (Authorization header).
 * Dashboard label is usually "Secret Key" (`FLWSECK_test_...` / `FLWSECK_live_...`).
 * `*_CLIENT_SECRET` names are accepted as aliases (common in .env templates).
 */
export function resolveFlutterwaveSecretKey(config: ConfigService): string {
  const generic = config.get<string>('FLUTTERWAVE_SECRET_KEY') || '';
  if (useLiveKeys(config)) {
    return (
      config.get<string>('FLUTTERWAVE_LIVE_SECRET_KEY') ||
      config.get<string>('FLUTTERWAVE_LIVE_CLIENT_SECRET') ||
      generic
    );
  }
  return (
    config.get<string>('FLUTTERWAVE_TEST_SECRET_KEY') ||
    config.get<string>('FLUTTERWAVE_TEST_CLIENT_SECRET') ||
    generic
  );
}

/** Webhook `verif-hash` must match the dashboard secret hash. */
export function resolveFlutterwaveWebhookSecretHash(config: ConfigService): string {
  const generic = config.get<string>('FLUTTERWAVE_WEBHOOK_SECRET_HASH') || '';
  if (useLiveKeys(config)) {
    return config.get<string>('FLUTTERWAVE_LIVE_WEBHOOK_SECRET_HASH') || generic;
  }
  return config.get<string>('FLUTTERWAVE_TEST_WEBHOOK_SECRET_HASH') || generic;
}

/**
 * Used for Flutterwave client-side encryption flows; server init/verify here do not require it,
 * but we resolve it so one place documents all credentials.
 */
export function resolveFlutterwaveEncryptionKey(config: ConfigService): string {
  const generic = config.get<string>('FLUTTERWAVE_ENCRYPTION_KEY') || '';
  if (useLiveKeys(config)) {
    return config.get<string>('FLUTTERWAVE_LIVE_ENCRYPTION_KEY') || generic;
  }
  return config.get<string>('FLUTTERWAVE_TEST_ENCRYPTION_KEY') || generic;
}

/**
 * Optional dashboard / OAuth-style id — not sent on standard v3 Bearer requests, but kept for
 * parity with env files and any future dashboard or mobile SDK wiring.
 */
export function resolveFlutterwaveClientId(config: ConfigService): string {
  if (useLiveKeys(config)) {
    return config.get<string>('FLUTTERWAVE_LIVE_CLIENT_ID') || '';
  }
  return config.get<string>('FLUTTERWAVE_TEST_CLIENT_ID') || '';
}
