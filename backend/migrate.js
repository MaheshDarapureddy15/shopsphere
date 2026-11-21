const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/db');

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Running database migration...');
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter((file) => /^\d+.*\.sql$/i.test(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    await client.query('BEGIN');
    for (const migrationFile of migrationFiles) {
      const sqlPath = path.join(migrationsDir, migrationFile);
      console.log(`Applying ${migrationFile}...`);
      await client.query(fs.readFileSync(sqlPath, 'utf8'));
    }
    await client.query('COMMIT');

    console.log('Migration completed successfully! All migrations applied.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();