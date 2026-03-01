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
const renamePaymentIntentField = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Check if old column exists
        const checkOldColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'stripe_payment_intent_id';
    `;
        const checkOldResult = await client.query(checkOldColumnQuery);
        // Check if new column already exists
        const checkNewColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'payment_intent_id';
    `;
        const checkNewResult = await client.query(checkNewColumnQuery);
        if (checkOldResult.rows.length > 0 && checkNewResult.rows.length === 0) {
            // Rename the column
            await client.query(`
        ALTER TABLE orders 
        RENAME COLUMN stripe_payment_intent_id TO payment_intent_id;
      `);
            console.log("✅ Renamed stripe_payment_intent_id to payment_intent_id in orders table.");
        }
        else if (checkNewResult.rows.length > 0) {
            console.log("ℹ️  payment_intent_id column already exists in orders table.");
        }
        else if (checkOldResult.rows.length === 0) {
            console.log("ℹ️  stripe_payment_intent_id column does not exist. Migration may have already been run or schema is different.");
        }
        await client.query('COMMIT');
        console.log("✅ Migration completed successfully.");
    }
    catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Failed to rename payment intent field:", e);
        throw e;
    }
    finally {
        client.release();
        await pool.end();
    }
};
renamePaymentIntentField().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
