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
async function cleanupDuplicateImages() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Step 1: Delete duplicate images, keeping only the first one (lowest id) for each product_id + url combination
        console.log('🗑️  Removing duplicate images...');
        const deleteResult = await client.query(`
      DELETE FROM product_images
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM product_images
        GROUP BY product_id, url
      )
    `);
        console.log(`✅ Deleted ${deleteResult.rowCount} duplicate image records`);
        // Step 2: Add unique constraint to prevent future duplicates
        console.log('🔒 Adding unique constraint...');
        try {
            await client.query(`
        ALTER TABLE product_images 
        ADD CONSTRAINT unique_product_url UNIQUE (product_id, url)
      `);
            console.log('✅ Unique constraint added successfully');
        }
        catch (constraintError) {
            // Constraint might already exist, check if it's a duplicate constraint error
            if (constraintError.code === '23505' || constraintError.message.includes('already exists')) {
                console.log('ℹ️  Unique constraint already exists, skipping...');
            }
            else {
                throw constraintError;
            }
        }
        await client.query('COMMIT');
        console.log('✅ Cleanup completed successfully');
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Cleanup failed:', err);
        throw err;
    }
    finally {
        client.release();
        await pool.end();
    }
}
cleanupDuplicateImages();
