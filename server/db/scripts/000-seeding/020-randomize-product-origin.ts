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

// Available countries matching the frontend filter options
const countries = [
  'Sweden',
  'Switzerland',
  'Germany',
  'Denmark',
  'Italy',
  'France',
  'Spain',
  'Portugal'
];

const randomizeProductOrigin = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🚀 Starting random product origin assignment...');

    // Get all products
    const productsResult = await client.query('SELECT id, name FROM products');
    const products = productsResult.rows;

    console.log(`📦 Found ${products.length} products to update...`);

    let updated = 0;
    const countryCounts: Record<string, number> = {};

    // Initialize counts
    countries.forEach(country => {
      countryCounts[country] = 0;
    });

    // Randomly assign a country to each product
    for (const product of products) {
      // Randomly select a country
      const randomIndex = Math.floor(Math.random() * countries.length);
      const selectedCountry = countries[randomIndex];

      await client.query(
        'UPDATE products SET country_of_origin = $1 WHERE id = $2',
        [selectedCountry, product.id]
      );

      countryCounts[selectedCountry]++;
      updated++;

      if (updated % 100 === 0) {
        console.log(`📦 Updated ${updated} products...`);
      }
    }

    await client.query('COMMIT');
    
    console.log(`✅ Product origin randomization finished.`);
    console.log(`   - Total updated: ${updated} products`);
    console.log(`\n📊 Distribution by country:`);
    countries.forEach(country => {
      const count = countryCounts[country];
      const percentage = ((count / updated) * 100).toFixed(1);
      console.log(`   - ${country}: ${count} products (${percentage}%)`);
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Product origin randomization failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

randomizeProductOrigin().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


