import fs from 'fs';
import pg from 'pg';
import { parse } from 'csv-parse';
import 'dotenv/config';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const seedProductOrigin = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const csvFilePath = 'db/scripts/000-seeding/dataset-seed.csv';
    const parser = fs.createReadStream(csvFilePath).pipe(
      parse({ columns: true, skip_empty_lines: true })
    );

    console.log('🚀 Starting product origin seeding from CSV...');
    let count = 0;
    let updated = 0;
    let skipped = 0;

    for await (const record of parser) {
      const productName = record.product_name;
      if (!productName) {
        skipped++;
        continue;
      }

      // The CSV has a typo: "county_of_origin" instead of "country_of_origin"
      const countryOfOrigin = record.county_of_origin || record.country_of_origin || null;
      
      if (countryOfOrigin && countryOfOrigin.trim() !== '') {
        // Capitalize first letter of each word for better display
        const formattedOrigin = countryOfOrigin.trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

        const result = await client.query(
          'UPDATE products SET country_of_origin = $1 WHERE name = $2',
          [formattedOrigin, productName]
        );

        if (result.rowCount && result.rowCount > 0) {
          updated++;
          if (updated % 100 === 0) {
            console.log(`📦 Updated ${updated} products with country of origin...`);
          }
        }
      } else {
        skipped++;
      }

      count++;
      if (count % 1000 === 0) {
        console.log(`📊 Processed ${count} records...`);
      }
    }

    await client.query('COMMIT');
    console.log(`✅ Product origin seeding finished.`);
    console.log(`   - Updated: ${updated} products`);
    console.log(`   - Skipped: ${skipped} products (no origin in CSV)`);
    console.log(`   - Total processed: ${count} records`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Product origin seeding failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seedProductOrigin().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});







