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

const assignSampleCategories = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Sample categories to assign
    const categories = [
      'Furniture',
      'Lighting',
      'Decor',
      'Storage',
      'Textiles',
      'Kitchen',
      'Bathroom',
      'Outdoor',
      'Electronics',
      'Accessories'
    ];

    // Get all products without categories
    const productsResult = await client.query(`
      SELECT id, name FROM products WHERE category IS NULL OR category = ''
      ORDER BY id
    `);

    console.log(`Found ${productsResult.rows.length} products without categories`);

    let assigned = 0;
    for (const product of productsResult.rows) {
      // Assign a random category
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      await client.query(
        'UPDATE products SET category = $1 WHERE id = $2',
        [randomCategory, product.id]
      );
      
      assigned++;
      if (assigned % 100 === 0) {
        console.log(`📦 Assigned categories to ${assigned} products...`);
      }
    }

    await client.query('COMMIT');
    console.log(`✅ Assigned categories to ${assigned} products.`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("❌ Failed to assign categories:", e);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
};

assignSampleCategories().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


