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

// Helper to strip brackets, quotes, and whitespace
const sanitize = (str: string) => str.replace(/[\[\]"']/g, '').trim();

async function importCsv(filePath: string) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const parser = fs.createReadStream(filePath).pipe(
      parse({ columns: true, skip_empty_lines: true })
    );

    console.log('🚀 Starting import with sanitized main_image matching...');
    let count = 0;

    for await (const record of parser) {
      // 1. Manufacturer Upsert
      const manufacturerRes = await client.query(
        'INSERT INTO manufacturers (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [record.manufacturer]
      );
      const manufacturerId = manufacturerRes.rows[0].id;

      // 2. Product Insert (include category if available in CSV)
      const category = record.category || record.Category || record.CATEGORY || null;
      // The CSV has a typo: "county_of_origin" instead of "country_of_origin"
      const countryOfOrigin = record.county_of_origin || record.country_of_origin || null;
      const formattedOrigin = countryOfOrigin 
        ? countryOfOrigin.trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
        : null;
      
      const productRes = await client.query(
        `INSERT INTO products (name, description, base_price, country_of_origin, stock_quantity, manufacturer_id, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          record.product_name,
          record.description,
          parseFloat(record.initial_price) || 0,
          formattedOrigin,
          record.in_stock === 'TRUE' ? 10 : 0,
          manufacturerId,
          category && category.trim() !== '' ? category.trim() : null,
        ]
      );
      const productId = productRes.rows[0].id;

      // 3. Image Processing
      if (record.image_urls) {
        const cleanMain = sanitize(record.main_image);
        const urls = sanitize(record.image_urls).split(',').map(u => u.trim()).filter(Boolean);

        for (const url of urls) {
          // Compare sanitized URL with sanitized main_image
          const isMain = url === cleanMain;

          await client.query(
            'INSERT INTO product_images (product_id, url, is_main) VALUES ($1, $2, $3)',
            [productId, url, isMain]
          );
        }
      }

      count++;
      if (count % 1000 === 0) console.log(`📦 Processed ${count} products...`);
    }

    await client.query('COMMIT');
    console.log('✅ Import finished. All products matched with their CSV main_image.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Import failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

importCsv('db/scripts/000-seeding/dataset-seed.csv');