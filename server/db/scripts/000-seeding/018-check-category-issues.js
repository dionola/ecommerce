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
const checkCategoryIssues = async () => {
    const client = await pool.connect();
    try {
        // Check for products with NULL or empty categories
        const nullCategoryProducts = await client.query(`
      SELECT p.id, p.name, p.category, COUNT(pi.id) as image_count
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.category IS NULL OR p.category = ''
      GROUP BY p.id, p.name, p.category
      ORDER BY p.id
      LIMIT 50
    `);
        console.log(`Found ${nullCategoryProducts.rows.length} products with NULL or empty categories`);
        if (nullCategoryProducts.rows.length > 0) {
            console.log('\nFirst 20 products with NULL/empty categories:');
            nullCategoryProducts.rows.slice(0, 20).forEach((product) => {
                console.log(`  - ID: ${product.id}, Name: ${product.name}, Images: ${product.image_count}`);
            });
        }
        // Check for products with images but empty image arrays (shouldn't happen but let's check)
        const productsWithEmptyImageArrays = await client.query(`
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
        console.log(`\nFound ${productsWithEmptyImageArrays.rows.length} products with zero images`);
        if (productsWithEmptyImageArrays.rows.length > 0) {
            console.log('\nFirst 20 products with zero images:');
            productsWithEmptyImageArrays.rows.slice(0, 20).forEach((product) => {
                console.log(`  - ID: ${product.id}, Name: ${product.name}, Category: ${product.category || 'NULL'}`);
            });
        }
        // Check category case sensitivity - see if there are duplicate categories with different cases
        const categoryCaseIssues = await client.query(`
      SELECT 
        LOWER(category) as lower_category,
        COUNT(DISTINCT category) as case_variants,
        array_agg(DISTINCT category) as variants
      FROM products
      WHERE category IS NOT NULL AND category != ''
      GROUP BY LOWER(category)
      HAVING COUNT(DISTINCT category) > 1
    `);
        console.log(`\nFound ${categoryCaseIssues.rows.length} categories with case sensitivity issues`);
        if (categoryCaseIssues.rows.length > 0) {
            console.log('\nCategories with case variants:');
            categoryCaseIssues.rows.forEach((row) => {
                console.log(`  - ${row.lower_category}: ${row.variants.join(', ')}`);
            });
        }
    }
    catch (e) {
        console.error("❌ Failed to check category issues:", e);
        throw e;
    }
    finally {
        client.release();
        await pool.end();
    }
};
checkCategoryIssues().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
