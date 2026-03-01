"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
async function fixMissingMainImages() {
    const client = await pool.connect();
    // Get images directory - handle both running from server/ and root directory
    const imagesDir = fs_1.default.existsSync(path_1.default.join(process.cwd(), 'server', 'images'))
        ? path_1.default.join(process.cwd(), 'server', 'images')
        : path_1.default.join(process.cwd(), 'images');
    console.log(`📁 Checking images directory: ${imagesDir}`);
    if (!fs_1.default.existsSync(imagesDir)) {
        console.error(`❌ Images directory does not exist: ${imagesDir}`);
        throw new Error(`Images directory not found: ${imagesDir}`);
    }
    try {
        await client.query('BEGIN');
        // Get all products with their main images
        console.log('🔍 Finding products with main images...');
        const productsWithMainImages = await client.query(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        pi.id as main_image_id,
        pi.url as main_image_url
      FROM products p
      INNER JOIN product_images pi ON p.id = pi.product_id
      WHERE pi.is_main = true
      ORDER BY p.id
    `);
        console.log(`📊 Found ${productsWithMainImages.rows.length} products with main images to check`);
        let fixedCount = 0;
        let deletedMainImages = 0;
        let setNewMainImages = 0;
        let noReplacementImages = 0;
        for (const product of productsWithMainImages.rows) {
            const mainImagePath = path_1.default.join(imagesDir, `${product.main_image_id}.jpg`);
            const mainImageExists = fs_1.default.existsSync(mainImagePath);
            if (!mainImageExists) {
                console.log(`\n⚠️  Product ID ${product.product_id} (${product.product_name})`);
                console.log(`   Main image ID ${product.main_image_id} file does not exist: ${product.main_image_id}.jpg`);
                // Delete the missing main image
                await client.query('DELETE FROM product_images WHERE id = $1', [product.main_image_id]);
                deletedMainImages++;
                console.log(`   ✓ Deleted missing main image record (ID: ${product.main_image_id})`);
                // Find the next available image for this product
                const otherImages = await client.query(`SELECT id, url 
           FROM product_images 
           WHERE product_id = $1 
           ORDER BY id ASC 
           LIMIT 1`, [product.product_id]);
                if (otherImages.rows.length > 0) {
                    const nextImage = otherImages.rows[0];
                    const nextImagePath = path_1.default.join(imagesDir, `${nextImage.id}.jpg`);
                    // Only set as main if the file actually exists
                    if (fs_1.default.existsSync(nextImagePath)) {
                        await client.query('UPDATE product_images SET is_main = true WHERE id = $1', [nextImage.id]);
                        setNewMainImages++;
                        console.log(`   ✓ Set image ID ${nextImage.id} as new main image`);
                    }
                    else {
                        noReplacementImages++;
                        console.log(`   ⚠️  Next image (ID: ${nextImage.id}) also doesn't exist, skipping main image assignment`);
                    }
                }
                else {
                    noReplacementImages++;
                    console.log(`   ⚠️  No other images available for this product`);
                }
                fixedCount++;
            }
        }
        await client.query('COMMIT');
        console.log(`\n📊 Summary:`);
        console.log(`   - Products checked: ${productsWithMainImages.rows.length}`);
        console.log(`   - Products with missing main images: ${fixedCount}`);
        console.log(`   - Main image records deleted: ${deletedMainImages}`);
        console.log(`   - New main images set: ${setNewMainImages}`);
        console.log(`   - Products with no replacement images: ${noReplacementImages}`);
        if (fixedCount === 0) {
            console.log('\n✅ All main images exist. No fixes needed.');
        }
        else {
            console.log(`\n✅ Fixed ${fixedCount} products with missing main images.`);
        }
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Fix failed:', err);
        throw err;
    }
    finally {
        client.release();
        await pool.end();
    }
}
// Run the script
fixMissingMainImages().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
