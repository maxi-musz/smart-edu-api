/**
 * Prisma CLI config (migrate, studio, etc.).
 *
 * - DATABASE_URL: required. Prefer values from `.env`; we use `override: true` so a stale
 *   `DATABASE_URL` in your shell (e.g. postgresql://...@localhost:5432) does not override `.env`
 *   and cause P1001 against localhost when you meant Neon/production.
 *
 * - SHADOW_DATABASE_URL: optional. If unset, `migrate dev` uses Prisma defaults (same host as
 *   DATABASE_URL when possible). On Neon, create a separate empty database and set this if
 *   `migrate dev` complains about shadow DB / permissions.
 */
require('dotenv').config({ path: '.env', override: true });

const { defineConfig, env } = require('@prisma/config');

const datasource = {
  url: env('DATABASE_URL'),
};

if (process.env.SHADOW_DATABASE_URL) {
  datasource.shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL;
}

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  datasource,
});
