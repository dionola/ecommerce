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

const removeAllProductsWithoutImages = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Find ALL products that have no images (regardless of category)
    const productsToDelete = await client.query(`
      SELECT p.id, p.name, p.category
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE pi.id IS NULL
      ORDER BY p.id
    `);

    console.log(`Found ${productsToDelete.rows.length} products without images`);

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

    // Delete the products (cascade will handle related records)
    const deleteResult = await client.query(`
      DELETE FROM products
      WHERE id IN (
        SELECT p.id
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        WHERE pi.id IS NULL
      )
    `);

    await client.query('COMMIT');
    console.log(`\n✅ Deleted ${deleteResult.rowCount} products without images.`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("❌ Failed to remove products:", e);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
};

removeAllProductsWithoutImages().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

