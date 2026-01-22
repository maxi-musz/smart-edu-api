const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Always use DATABASE_URL (no env-specific DATABASE_URL_PRODUCTION, etc.)
const dbUrlEnv = 'DATABASE_URL';
console.log('Using DATABASE_URL for database connection');

// Read the schema file
const schemaPath = path.join(__dirname, 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

console.log('DATABASE_URL set:', !!process.env[dbUrlEnv]);

// Check if DATABASE_URL is available
const dbUrl = process.env[dbUrlEnv];
if (!dbUrl) {
  console.log('Warning: DATABASE_URL is not set. This is expected during build time.');
  console.log('Using placeholder DATABASE_URL for schema validation...');

  // Use a placeholder URL for schema validation during build
  const placeholderUrl = 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
  schema = schema.replace(
    /url\s*=\s*env\(".*"\)/,
    `url = "${placeholderUrl}"`
  );

  // Write the updated schema with placeholder
  fs.writeFileSync(schemaPath, schema);
  console.log('Schema updated with placeholder DATABASE_URL for build validation');
} else {
  console.log('DATABASE_URL is available, using it for schema configuration');

  // Update the database URL in the schema to use DATABASE_URL
  schema = schema.replace(
    /url\s*=\s*["'].*["']/,
    `url = env("${dbUrlEnv}")`
  );
  schema = schema.replace(
    /url\s*=\s*env\(".*"\)/,
    `url = env("${dbUrlEnv}")`
  );

  // Write the updated schema back
  fs.writeFileSync(schemaPath, schema);
  console.log('Schema updated to use DATABASE_URL');
}
