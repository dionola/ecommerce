"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const pg_1 = __importDefault(require("pg"));
const csv_parse_1 = require("csv-parse");
require("dotenv/config");
const { Pool } = pg_1.default;
const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});
const assignCategoriesFromCsv = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const csvFilePath = 'db/scripts/000-seeding/dataset-seed.csv';
        const parser = fs_1.default.createReadStream(csvFilePath).pipe((0, csv_parse_1.parse)({ columns: true, skip_empty_lines: true }));
        console.log('🚀 Starting category assignment from CSV...');
        let count = 0;
        let updated = 0;
        let skipped = 0;
        for await (const record of parser) {
            const productName = record.product_name;
            if (!productName) {
                skipped++;
                continue;
            }
            // Check if CSV has a category column (could be 'category', 'Category', 'CATEGORY', etc.)
            const category = record.category || record.Category || record.CATEGORY || null;
            if (category && category.trim() !== '') {
                const result = await client.query('UPDATE products SET category = $1 WHERE name = $2', [category.trim(), productName]);
                if (result.rowCount && result.rowCount > 0) {
                    updated++;
                    if (updated % 100 === 0) {
                        console.log(`📦 Updated ${updated} products with categories...`);
                    }
                }
            }
            else {
                skipped++;
            }
            count++;
            if (count % 1000 === 0) {
                console.log(`📊 Processed ${count} records...`);
            }
        }
        await client.query('COMMIT');
        console.log(`✅ Category assignment finished.`);
        console.log(`   - Updated: ${updated} products`);
        console.log(`   - Skipped: ${skipped} products (no category in CSV)`);
        console.log(`   - Total processed: ${count} records`);
    }
    catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Failed to assign categories:", e);
        throw e;
    }
    finally {
        client.release();
        await pool.end();
    }
};
assignCategoriesFromCsv().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
