const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read the current environment
const env = process.env.NODE_ENV || 'development';
console.log('Current NODE_ENV:', env);

// Map environment to database URL env variable
const envToDbUrl = {
  development: 'DATABASE_URL',
  production: 'DATABASE_URL_PRODUCTION'
};

// Get the correct database URL env variable name
const dbUrlEnv = envToDbUrl[env] || 'DATABASE_URL';
console.log('Selected database URL environment variable:', dbUrlEnv);

// Read the schema file
const schemaPath = path.join(__dirname, 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Update the database URL in the schema
schema = schema.replace(
  /url\s*=\s*env\(".*"\)/,
  `url = env("${dbUrlEnv}")`
);

// Write the updated schema back
fs.writeFileSync(schemaPath, schema);

console.log(`Using database URL from ${dbUrlEnv} for ${env} environment`);
console.log('Database URL:', process.env[dbUrlEnv]);

// Check if DATABASE_URL is available
const dbUrl = process.env[dbUrlEnv];
if (!dbUrl) {
  console.log(`Warning: ${dbUrlEnv} is not set. This is expected during build time.`);
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
} 