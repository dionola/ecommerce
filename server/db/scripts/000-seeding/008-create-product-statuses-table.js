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
const createProductStatusesTable = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`
      CREATE TABLE IF NOT EXISTS product_statuses (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        status_type VARCHAR(50) NOT NULL CHECK (status_type IN ('featured', 'on_sale', 'new', 'bestseller', 'limited')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, status_type)
      );
    `);
        await client.query('COMMIT');
        console.log("✅ product_statuses table created successfully.");
    }
    catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Failed to create product_statuses table:", e);
        throw e;
    }
    finally {
        client.release();
        await pool.end();
    }
};
createProductStatusesTable().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
