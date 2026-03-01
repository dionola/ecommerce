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
const checkProductsWithInvalidImages = async () => {
    const client = await pool.connect();
    try {
        // Find products with empty or null image URLs
        const productsWithEmptyImages = await client.query(`
      SELECT p.id, p.name, p.category, pi.id as image_id, pi.url
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE pi.url IS NULL OR pi.url = '' OR pi.url = 'null' OR pi.url = 'undefined'
      ORDER BY p.id
      LIMIT 50
    `);
        console.log(`Found ${productsWithEmptyImages.rows.length} products with empty/null image URLs`);
        if (productsWithEmptyImages.rows.length > 0) {
            console.log('\nProducts with empty/null image URLs:');
            productsWithEmptyImages.rows.forEach((product) => {
                console.log(`  - ID: ${product.id}, Name: ${product.name}, Category: ${product.category || 'NULL'}, Image URL: ${product.url || 'NULL'}`);
            });
        }
        // Find products that might be test data (checking for common test patterns)
        const testProducts = await client.query(`
      SELECT p.id, p.name, p.category, COUNT(pi.id) as image_count
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE 
        LOWER(p.name) LIKE '%test%' 
        OR LOWER(p.name) LIKE '%sample%'
        OR LOWER(p.name) LIKE '%example%'
        OR LOWER(p.description) LIKE '%test%'
        OR LOWER(p.description) LIKE '%sample%'
        OR LOWER(p.description) LIKE '%example%'
      GROUP BY p.id, p.name, p.category
      ORDER BY p.id
    `);
        console.log(`\nFound ${testProducts.rows.length} potential test products`);
        if (testProducts.rows.length > 0) {
            console.log('\nPotential test products:');
            testProducts.rows.forEach((product) => {
                console.log(`  - ID: ${product.id}, Name: ${product.name}, Category: ${product.category || 'NULL'}, Images: ${product.image_count}`);
            });
        }
        // Find all products with their image counts
        const allProducts = await client.query(`
      SELECT 
        p.id, 
        p.name, 
        p.category,
        COUNT(pi.id) as image_count
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      GROUP BY p.id, p.name, p.category
      HAVING COUNT(pi.id) = 0
      ORDER BY p.id
      LIMIT 50
    `);
        console.log(`\nFound ${allProducts.rows.length} products with zero images (first 50):`);
        if (allProducts.rows.length > 0) {
            allProducts.rows.forEach((product) => {
                console.log(`  - ID: ${product.id}, Name: ${product.name}, Category: ${product.category || 'NULL'}`);
            });
        }
    }
    catch (e) {
        console.error("❌ Failed to check products:", e);
        throw e;
    }
    finally {
        client.release();
        await pool.end();
    }
};
checkProductsWithInvalidImages().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
