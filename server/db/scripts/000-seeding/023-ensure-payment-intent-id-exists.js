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
/**
 * Migration: Ensure payment_intent_id column exists in orders table
 *
 * This migration ensures the payment_intent_id column exists, creating it if it doesn't.
 */
async function ensurePaymentIntentIdExists() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Check if column exists
        const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'payment_intent_id';
    `;
        const checkResult = await client.query(checkColumnQuery);
        if (checkResult.rows.length === 0) {
            // Column doesn't exist, create it
            await client.query(`
        ALTER TABLE orders 
        ADD COLUMN payment_intent_id VARCHAR(255);
      `);
            console.log('✓ Added payment_intent_id column to orders table');
        }
        else {
            console.log('✓ payment_intent_id column already exists in orders table');
        }
        await client.query('COMMIT');
        console.log('Migration completed successfully');
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error ensuring payment_intent_id column exists:', error.message);
        throw error;
    }
    finally {
        client.release();
        await pool.end();
    }
}
// Run migration
ensurePaymentIntentIdExists()
    .then(() => {
    process.exit(0);
})
    .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});
