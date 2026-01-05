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

// USD to PHP exchange rate (adjust as needed)
const USD_TO_PHP = 57;

// Helper to parse price from CSV (removes $, quotes, and whitespace)
const parsePrice = (priceStr: string): number => {
  if (!priceStr) return 0;
  // Remove quotes, dollar signs, and whitespace, then parse
  const cleaned = priceStr.replace(/[$\s"']/g, '');
  return parseFloat(cleaned) || 0;
};

// Convert USD to PHP, round down to nearest whole value, then subtract 1
const convertToPHP = (usdPrice: number): number => {
  const phpPrice = usdPrice * USD_TO_PHP;
  return Math.floor(phpPrice) - 1;
};

// Generate random quantity (between 1 and 100)
const getRandomQuantity = (): number => {
  return Math.floor(Math.random() * 100) + 1;
};

async function updatePricesAndQuantities(csvFilePath: string) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const parser = fs.createReadStream(csvFilePath).pipe(
      parse({ columns: true, skip_empty_lines: true })
    );

    console.log('🚀 Starting price and quantity update...');
    let count = 0;
    let updated = 0;

    for await (const record of parser) {
      const productName = record.product_name;
      if (!productName) continue;

      // Parse the original price from CSV
      const originalPrice = parsePrice(record.initial_price);
      if (originalPrice <= 0) {
        console.log(`⚠️  Skipping ${productName} - invalid price`);
        count++;
        continue;
      }

      // Convert to PHP and apply formula
      const phpPrice = convertToPHP(originalPrice);
      const randomQuantity = getRandomQuantity();

      // Update the product in the database
      const result = await client.query(
        `UPDATE products 
         SET base_price = $1, stock_quantity = $2 
         WHERE name = $3`,
        [phpPrice, randomQuantity, productName]
      );

      if (result.rowCount && result.rowCount > 0) {
        updated++;
        if (updated % 100 === 0) {
          console.log(`📦 Updated ${updated} products...`);
        }
      } else {
        console.log(`⚠️  Product not found: ${productName}`);
      }

      count++;
    }

    await client.query('COMMIT');
    console.log(`✅ Update finished. Updated ${updated} out of ${count} products.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Update failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
const csvPath = 'db/scripts/000-seeding/dataset-seed.csv';
updatePricesAndQuantities(csvPath).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

