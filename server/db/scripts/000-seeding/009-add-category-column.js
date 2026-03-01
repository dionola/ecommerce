"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = __importDefault(require("pg"));
require("dotenv/config"); // Automatically loads .env
const { Pool } = pg_1.default;
const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});
const addCategoryColumn = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Check if column already exists
        const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'category';
    `;
        const checkResult = await client.query(checkColumnQuery);
        if (checkResult.rows.length === 0) {
            // Add category column if it doesn't exist
            await client.query(`
        ALTER TABLE products 
        ADD COLUMN category VARCHAR(255);
      `);
            console.log("✅ Added category column to products table.");
        }
        else {
            console.log("ℹ️  Category column already exists in products table.");
        }
        await client.query('COMMIT');
        console.log("✅ Migration completed successfully.");
    }
    catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Failed to add category column:", e);
        throw e;
    }
    finally {
        client.release();
        await pool.end();
    }
};
addCategoryColumn().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
