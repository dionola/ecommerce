import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/**
 * Migration: Change cognito_sub from UUID to VARCHAR to support Google user IDs
 * 
 * Google user IDs are strings like "google_108960788132027201328" which are not valid UUIDs.
 * This migration changes the column type to VARCHAR(255) to support both Cognito UUIDs and Google IDs.
 */
async function changeCognitoSubToText() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if column is already VARCHAR (already migrated)
    const checkColumnQuery = `
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'cognito_sub'
    `;
    const columnCheck = await client.query(checkColumnQuery);
    
    if (columnCheck.rows.length > 0 && columnCheck.rows[0].data_type === 'character varying') {
      console.log('✓ cognito_sub column is already VARCHAR - migration not needed');
      await client.query('COMMIT');
      return;
    }

    // Change column type from UUID to VARCHAR(255)
    // This will work because PostgreSQL can cast UUIDs to text
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN cognito_sub TYPE VARCHAR(255) USING cognito_sub::text
    `);

    await client.query('COMMIT');
    console.log('✓ Changed cognito_sub column from UUID to VARCHAR(255)');
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error changing cognito_sub column type:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
changeCognitoSubToText()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

