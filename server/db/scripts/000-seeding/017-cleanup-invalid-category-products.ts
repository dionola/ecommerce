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

const cleanupInvalidCategoryProducts = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Find products that:
    // 1. Have no images
    // 2. OR have a category but it doesn't match their actual category (misclassified)
    // 3. OR have NULL/empty category but appear in category filters
    
    // First, get all products with their image counts and categories
    const allProducts = await client.query(`
      SELECT 
        p.id, 
        p.name, 
        p.category,
        COUNT(pi.id) as image_count
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      GROUP BY p.id, p.name, p.category
      ORDER BY p.id
    `);

    console.log(`Found ${allProducts.rows.length} total products`);

    // Find products without images
    const productsWithoutImages = allProducts.rows.filter((p: any) => parseInt(p.image_count) === 0);
    console.log(`\nFound ${productsWithoutImages.length} products without images`);

    if (productsWithoutImages.length > 0) {
      console.log('\nFirst 20 products without images:');
      productsWithoutImages.slice(0, 20).forEach((product: any) => {
        console.log(`  - ID: ${product.id}, Name: ${product.name}, Category: ${product.category || 'NULL'}`);
      });
    }

    // Get product IDs to delete (products without images)
    const productIdsToDelete = productsWithoutImages.map((p: any) => p.id);

    if (productIdsToDelete.length === 0) {
      console.log('\n✅ No products to delete.');
      await client.query('COMMIT');
      return;
    }

    // Show category breakdown of products to delete
    const categoryBreakdown: Record<string, number> = {};
    productsWithoutImages.forEach((product: any) => {
      const cat = product.category || 'NULL';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });
    console.log('\nCategory breakdown of products to delete:');
    Object.entries(categoryBreakdown).forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count} products`);
    });

    // Delete the products (cascade will handle related records)
    const deleteResult = await client.query(`
      DELETE FROM products
      WHERE id = ANY($1::int[])
    `, [productIdsToDelete]);

    await client.query('COMMIT');
    console.log(`\n✅ Deleted ${deleteResult.rowCount} products without images.`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("❌ Failed to cleanup products:", e);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
};

cleanupInvalidCategoryProducts().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

