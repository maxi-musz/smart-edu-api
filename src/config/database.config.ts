import { registerAs } from "@nestjs/config";
import { Logger } from "@nestjs/common";

const logger = new Logger('DatabaseConfig');

export default registerAs('database', () => {
  const env = process.env.NODE_ENV as 'development' | 'production' | undefined;
  logger.log(`Current NODE_ENV: ${env || 'undefined'}`);

  const urls: Record<'development' | 'production', string | undefined> = {
    development: process.env.DATABASE_URL,
    production: process.env.DATABASE_URL_PRODUCTION,
  };

  const selectedUrl = (env && urls[env]) ? urls[env] : process.env.DATABASE_URL;
  
  // Mask sensitive parts of the URL for logging (show only connection details)
  const maskedUrl = selectedUrl 
    ? selectedUrl.replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1****$2')
    : 'undefined';
  logger.log(`Selected database URL: ${maskedUrl}`);

  return {
    url: selectedUrl,
  };
}); 