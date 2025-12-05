const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Database Backup Script
 * 
 * Creates a timestamped PostgreSQL database backup using pg_dump
 * Saves the backup file in the project root directory
 */
function backupDatabase() {
  try {
    console.log('💾 Starting database backup...\n');

    // Get DATABASE_URL from environment or use provided one
    const databaseUrl = process.env.DATABASE_URL || process.argv[2];

    if (!databaseUrl) {
      console.error('❌ Error: DATABASE_URL not provided');
      console.error('   Usage: node scripts/backup-db.js [DATABASE_URL]');
      console.error('   Or set DATABASE_URL environment variable');
      process.exit(1);
    }

    // Generate timestamp for filename
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_');
    const dateStr = timestamp.split('_')[0]; // YYYYMMDD
    const timeStr = timestamp.split('_')[1]; // HHMMSS

    // Create backup filename
    const backupFilename = `neon-backup-${dateStr}_${timeStr}.dump`;
    const backupPath = path.join(process.cwd(), backupFilename);

    console.log(`📦 Database: ${extractDatabaseName(databaseUrl)}`);
    console.log(`📁 Backup file: ${backupFilename}\n`);

    // Run pg_dump
    console.log('⏳ Creating backup...');
    const startTime = Date.now();

    try {
      execSync(`pg_dump "${databaseUrl}" -F c -f "${backupPath}"`, {
        stdio: 'inherit',
        encoding: 'utf8',
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const fileSize = getFileSize(backupPath);

      console.log('\n✅ Backup completed successfully!');
      console.log(`   📁 File: ${backupFilename}`);
      console.log(`   📊 Size: ${fileSize}`);
      console.log(`   ⏱️  Duration: ${duration}s`);
      console.log(`   📍 Location: ${backupPath}\n`);
    } catch (error) {
      // Clean up partial file if backup failed
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }
      throw error;
    }
  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);
    if (error.stderr) {
      console.error('   Error details:', error.stderr.toString());
    }
    process.exit(1);
  }
}

/**
 * Extract database name from connection URL for display
 */
function extractDatabaseName(url) {
  try {
    const match = url.match(/\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)/);
    if (match) {
      return match[4]; // database name
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Get human-readable file size
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  const bytes = stats.size;
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Run backup
backupDatabase();

