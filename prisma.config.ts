import 'dotenv/config';
import { defineConfig, env as prismaEnv } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: prismaEnv('DATABASE_URL'),
    shadowDatabaseUrl: prismaEnv('SHADOW_DATABASE_URL'),
  },
});
