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

const removeProductsWithInvalidImages = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Find products with invalid image URLs (empty, null, placeholder, or broken URLs)
    const productsToDelete = await client.query(`
      SELECT DISTINCT p.id, p.name, p.category
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE 
        -- No images at all
        pi.id IS NULL
        OR
        -- Invalid image URLs
        pi.url IS NULL 
        OR pi.url = '' 
        OR pi.url = 'null' 
        OR pi.url = 'undefined'
        OR LOWER(pi.url) LIKE '%placeholder%'
        OR LOWER(pi.url) LIKE '%example%'
        OR LOWER(pi.url) LIKE '%test%'
        OR LOWER(pi.url) LIKE '%sample%'
        OR pi.url NOT LIKE 'http%'
      ORDER BY p.id
    `);

    console.log(`Found ${productsToDelete.rows.length} products with invalid or missing images`);

    if (productsToDelete.rows.length === 0) {
      console.log('✅ No products to delete.');
      await client.query('COMMIT');
      return;
    }

    // Show first 20 products that will be deleted
    console.log('\nFirst 20 products to be deleted:');
    productsToDelete.rows.slice(0, 20).forEach((product: any) => {
      console.log(`  - ${product.name} (ID: ${product.id}, Category: ${product.category || 'NULL'})`);
    });
    if (productsToDelete.rows.length > 20) {
      console.log(`  ... and ${productsToDelete.rows.length - 20} more`);
    }

    // Show category breakdown
    const categoryBreakdown: Record<string, number> = {};
    productsToDelete.rows.forEach((product: any) => {
      const cat = product.category || 'NULL';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });
    console.log('\nCategory breakdown:');
    Object.entries(categoryBreakdown).forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count} products`);
    });

    // Get product IDs to delete
    const productIds = productsToDelete.rows.map((p: any) => p.id);

    // Delete the products (cascade will handle related records)
    const deleteResult = await client.query(`
      DELETE FROM products
      WHERE id = ANY($1::int[])
    `, [productIds]);

    await client.query('COMMIT');
    console.log(`\n✅ Deleted ${deleteResult.rowCount} products with invalid or missing images.`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("❌ Failed to remove products:", e);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
};

removeProductsWithInvalidImages().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

