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

const createBannerConfigTable = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS banner_config (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        category VARCHAR(255),
        button_text VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default banner config if none exists
    const checkExisting = await client.query('SELECT COUNT(*) FROM banner_config');
    if (parseInt(checkExisting.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO banner_config (title, description, image_url, category, button_text)
        VALUES (
          'The Art of Living Well',
          'A curated selection of home essentials designed for longevity, utility, and aesthetic permanence.',
          'https://image.hm.com/assets/hm/1a/3c/1a3c77208f05c2cf02bbdd5d0d71016abcd23548.jpg?imwidth=2160',
          NULL,
          'View Collection — 2026'
        );
      `);
      console.log("✅ Inserted default banner config.");
    }

    await client.query('COMMIT');
    console.log("✅ banner_config table created successfully.");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("❌ Failed to create banner_config table:", e);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
};

createBannerConfigTable().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

