"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const pg_1 = __importDefault(require("pg"));
const p_limit_1 = __importDefault(require("p-limit")); // Controls concurrency
require("dotenv/config");
const limit = (0, p_limit_1.default)(100); // Download 15 images at a time
const { Pool } = pg_1.default;
const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});
async function downloadImages() {
    const client = await pool.connect();
    const downloadDir = path_1.default.join(process.cwd(), 'images');
    if (!fs_1.default.existsSync(downloadDir))
        fs_1.default.mkdirSync(downloadDir);
    try {
        // Fetch IDs in batches if 100k is too much for memory
        const res = await client.query('SELECT id, url FROM product_images');
        console.log(`Processing ${res.rows.length} images...`);
        const tasks = res.rows.map((row) => {
            let imageUrl = row.url;
            // Remove leading [" and trailing "] if they exist
            if (imageUrl.startsWith('["') && imageUrl.endsWith('"]')) {
                imageUrl = imageUrl.substring(2, imageUrl.length - 2);
            }
            // Ensure the URL has a protocol
            if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                imageUrl = `https://${imageUrl}`;
            }
            console.log(`Attempting to download from URL: ${imageUrl}`);
            return limit(async () => {
                const filePath = path_1.default.join(downloadDir, `${row.id}.jpg`);
                if (fs_1.default.existsSync(filePath))
                    return;
                try {
                    const response = await (0, axios_1.default)({
                        url: imageUrl,
                        method: 'GET',
                        responseType: 'stream',
                        timeout: 10000,
                    });
                    const writer = fs_1.default.createWriteStream(filePath);
                    response.data.pipe(writer);
                    return new Promise((resolve) => {
                        writer.on('finish', resolve);
                        writer.on('error', (err) => {
                            console.error(`Stream error on ${row.id}:`, err.message);
                            resolve(null); // Resolve anyway to keep the queue moving
                        });
                    });
                }
                catch (err) {
                    console.error(`Failed ${row.id}: ${err.message}`);
                }
            });
        });
        await Promise.all(tasks);
        console.log("🏁 All download tasks finished.");
    }
    finally {
        client.release();
        await pool.end();
    }
}
downloadImages();
