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
  })
  // Allow extra variables so you can add new ones without breaking validation
  .unknown(true);

