import * as joi from 'joi';

/**
 * Centralised environment variable validation.
 *
 * - Runs on startup via ConfigModule.forRoot({ validationSchema })
 * - Fails fast with a clear error when required env vars are missing or invalid
 * - Keeps most values optional so you can grow into features without blocking dev
 */
export const envValidationSchema = joi
  .object({
    // Core app
    NODE_ENV: joi
      .string()
      .valid('development', 'staging', 'production', 'test')
      .default('development'),

    PORT: joi.number().port().default(3000),
    APP_NAME: joi.string().default('Smart Edu Hub'),

    // Database
    DATABASE_URL: joi.string().required(),
    SHADOW_DATABASE_URL: joi.string().optional(),

    // Auth
    JWT_SECRET: joi.string().min(10).required(),
    JWT_EXPIRES_IN: joi.string().default('30d'),

    // AWS / S3 (shared across envs – services already pick the right bucket variant)
    AWS_ACCESS_KEY_ID: joi.string().required(),
    AWS_SECRET_ACCESS_KEY: joi.string().required(),
    AWS_REGION: joi.string().required(),

    AWS_S3_BUCKET: joi.string().required(),
    AWS_S3_BUCKET_DEV: joi.string().optional(),
    AWS_S3_BUCKET_STAGING: joi.string().optional(),
    AWS_S3_BUCKET_PROD: joi.string().optional(),

    // HLS / MediaConvert
    HLS_TRANSCODE_PROVIDER: joi
      .string()
      .valid('ffmpeg', 'mediaconvert')
      .default('ffmpeg'),

    AWS_MEDIACONVERT_ROLE_ARN: joi.when('HLS_TRANSCODE_PROVIDER', {
      is: 'mediaconvert',
      then: joi.string().required(),
      otherwise: joi.string().optional(),
    }),

    // CloudFront
    CLOUDFRONT_DOMAIN: joi.string().required(),
    CLOUDFRONT_DISTRIBUTION_ID: joi.string().optional(),

    // Email / providers
    EMAIL_PROVIDER: joi
      .string()
      .valid('gmail', 'resend', 'sendgrid')
      .default('gmail'),

    EMAIL_USER: joi.string().optional(),
    EMAIL_PASSWORD: joi.string().optional(),

    RESEND_API_KEY: joi.when('EMAIL_PROVIDER', {
      is: 'resend',
      then: joi.string().required(),
      otherwise: joi.string().optional(),
    }),
    RESEND_FROM_EMAIL: joi.when('EMAIL_PROVIDER', {
      is: 'resend',
      then: joi.string().required(),
      otherwise: joi.string().optional(),
    }),

    // Optional integrations
    OPENAI_API_KEY: joi.string().optional(),
    PINECONE_API_KEY: joi.string().optional(),
    PINECONE_ENVIRONMENT: joi.string().optional(),

    REDIS_URL: joi.string().optional(),

    // Payment gateways (Finance) — set keys for the active PAYMENT_PROVIDER
    PAYMENT_PROVIDER: joi
      .string()
      .valid('paystack', 'flutterwave')
      .default('paystack'),
    FRONTEND_URL: joi.string().uri().optional(),
    PAYSTACK_SECRET_KEY: joi.string().optional(),
    /** Preferred in non-production when set (see resolvePaystackSecretKey) */
    PAYSTACK_TEST_SECRET_KEY: joi.string().optional(),
    /** Preferred when NODE_ENV=production when set */
    PAYSTACK_LIVE_SECRET_KEY: joi.string().optional(),
    PAYSTACK_PUBLIC_KEY: joi.string().optional(),
    FLUTTERWAVE_SECRET_KEY: joi.string().optional(),
    FLUTTERWAVE_ENCRYPTION_KEY: joi.string().optional(),
    FLUTTERWAVE_WEBHOOK_SECRET_HASH: joi.string().optional(),
    FLUTTERWAVE_TEST_PUBLIC_KEY: joi.string().optional(),
    FLUTTERWAVE_TEST_SECRET_KEY: joi.string().optional(),
    FLUTTERWAVE_TEST_CLIENT_SECRET: joi.string().optional(),
    FLUTTERWAVE_TEST_CLIENT_ID: joi.string().optional(),
    FLUTTERWAVE_TEST_ENCRYPTION_KEY: joi.string().optional(),
    FLUTTERWAVE_TEST_WEBHOOK_SECRET_HASH: joi.string().optional(),
    FLUTTERWAVE_LIVE_SECRET_KEY: joi.string().optional(),
    FLUTTERWAVE_LIVE_CLIENT_SECRET: joi.string().optional(),
    FLUTTERWAVE_LIVE_CLIENT_ID: joi.string().optional(),
    FLUTTERWAVE_LIVE_ENCRYPTION_KEY: joi.string().optional(),
    FLUTTERWAVE_LIVE_WEBHOOK_SECRET_HASH: joi.string().optional(),
    /** Hostname only (e.g. api.flutterwave.com) — used for v3 base URL in production */
    FLUTTERWAVE_LIVE_BASE_URL: joi.string().optional(),
    /** Not used for v3 /payments (use test keys on api.flutterwave.com). Documented for v4 / other tools. */
    FLUTTERWAVE_SANDBOX_BASE_URL: joi.string().optional(),
    /** Full override, e.g. https://api.flutterwave.com/v3 */
    FLUTTERWAVE_V3_API_BASE_URL: joi.string().uri().optional(),
  })
  // Allow extra variables so you can add new ones without breaking validation
  .unknown(true);
