"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = __importDefault(require("pg"));
require("dotenv/config");
const { Pool } = pg_1.default;
const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});
const removeProductsWithoutImages = async () => {
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
        console.log(`Found ${productsToDelete.rows.length} products to delete (no images)`);
        if (productsToDelete.rows.length === 0) {
            console.log('✅ No products to delete.');
            await client.query('COMMIT');
            return;
        }
        // Show first 10 products that will be deleted
        console.log('\nFirst 10 products to be deleted:');
        productsToDelete.rows.slice(0, 10).forEach((product) => {
            console.log(`  - ${product.name} (ID: ${product.id}, Category: ${product.category || 'NULL'})`);
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
    }
    catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Failed to remove products:", e);
        throw e;
    }
    finally {
        client.release();
        await pool.end();
    }
};
removeProductsWithoutImages().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
