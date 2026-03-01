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
async function deleteProductsWithoutImages() {
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
        // First, get all products with their images
        console.log('🔍 Finding products and checking for valid image files...');
        const productsWithImages = await client.query(`
      SELECT 
        p.id,
        p.name,
        CASE 
          WHEN COUNT(pi.id) = 0 THEN '[]'::json
          ELSE json_agg(
            json_build_object('id', pi.id, 'url', pi.url)
            ORDER BY pi.id
          )
        END as images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      GROUP BY p.id, p.name
    `);
        console.log(`📊 Found ${productsWithImages.rows.length} total products to check`);
        // Debug: Show first product structure
        if (productsWithImages.rows.length > 0) {
            const firstProduct = productsWithImages.rows[0];
            console.log(`\n🔍 Debug - First product structure:`);
            console.log(`   ID: ${firstProduct.id}, Name: ${firstProduct.name}`);
            console.log(`   Images type: ${typeof firstProduct.images}`);
            console.log(`   Images value: ${JSON.stringify(firstProduct.images).substring(0, 200)}`);
        }
        const productsToDelete = [];
        let productsWithoutDbImages = 0;
        let productsWithoutFileImages = 0;
        let productsWithValidImages = 0;
        // Check each product for valid image files
        for (const product of productsWithImages.rows) {
            // Parse the JSON images array - PostgreSQL returns it as a string or object
            let images = [];
            if (typeof product.images === 'string') {
                try {
                    images = JSON.parse(product.images);
                }
                catch (e) {
                    // If parsing fails, treat as empty
                    images = [];
                }
            }
            else if (Array.isArray(product.images)) {
                images = product.images;
            }
            else if (product.images && typeof product.images === 'object') {
                // If it's already an object/array, use it directly
                images = product.images;
            }
            // Check if product has no images in database
            if (!images || !Array.isArray(images) || images.length === 0) {
                productsWithoutDbImages++;
                productsToDelete.push(product.id);
                continue;
            }
            // Check if at least one image file exists in the images folder
            let hasValidImage = false;
            let checkedImages = 0;
            for (const image of images) {
                // Make sure image has an id
                if (!image || !image.id) {
                    continue;
                }
                checkedImages++;
                const imageFilePath = path_1.default.join(imagesDir, `${image.id}.jpg`);
                if (fs_1.default.existsSync(imageFilePath)) {
                    hasValidImage = true;
                    break;
                }
            }
            if (!hasValidImage) {
                if (checkedImages > 0) {
                    productsWithoutFileImages++;
                }
                else {
                    // This shouldn't happen since we already checked for empty arrays above
                    productsWithoutDbImages++;
                }
                productsToDelete.push(product.id);
            }
            else {
                productsWithValidImages++;
            }
        }
        const totalToDelete = productsToDelete.length;
        console.log(`\n📊 Analysis complete:`);
        console.log(`   - Products with valid images: ${productsWithValidImages}`);
        console.log(`   - Products without images in database: ${productsWithoutDbImages}`);
        console.log(`   - Products without valid image files: ${productsWithoutFileImages}`);
        console.log(`   - Total products to delete: ${totalToDelete}`);
        console.log(`   - Total products to keep: ${productsWithImages.rows.length - totalToDelete}`);
        if (totalToDelete === 0) {
            console.log('✅ No products to delete. All products have valid images.');
            await client.query('COMMIT');
            return;
        }
        // Show some examples of products that will be deleted
        if (totalToDelete > 0) {
            console.log('\n📋 Products to be deleted (first 20):');
            const sampleProducts = productsWithImages.rows
                .filter((p) => productsToDelete.includes(p.id))
                .slice(0, 20);
            sampleProducts.forEach((product) => {
                let imagesInfo = 'no images in DB';
                if (product.images) {
                    const imgArray = typeof product.images === 'string'
                        ? JSON.parse(product.images)
                        : product.images;
                    imagesInfo = `${Array.isArray(imgArray) ? imgArray.length : 0} images in DB`;
                }
                console.log(`   - ID: ${product.id}, Name: ${product.name} (${imagesInfo})`);
            });
            if (totalToDelete > 20) {
                console.log(`   ... and ${totalToDelete - 20} more`);
            }
            // Show some examples of products that will be KEPT
            const productsToKeep = productsWithImages.rows
                .filter((p) => !productsToDelete.includes(p.id))
                .slice(0, 5);
            if (productsToKeep.length > 0) {
                console.log('\n✅ Sample products that will be KEPT (first 5):');
                productsToKeep.forEach((product) => {
                    let imagesInfo = 'no images';
                    if (product.images) {
                        const imgArray = typeof product.images === 'string'
                            ? JSON.parse(product.images)
                            : product.images;
                        if (Array.isArray(imgArray) && imgArray.length > 0) {
                            const firstImageId = imgArray[0]?.id;
                            const imagePath = path_1.default.join(imagesDir, `${firstImageId}.jpg`);
                            imagesInfo = `${imgArray.length} images, file exists: ${fs_1.default.existsSync(imagePath)}`;
                        }
                    }
                    console.log(`   - ID: ${product.id}, Name: ${product.name} (${imagesInfo})`);
                });
            }
        }
        // Safety check: Don't delete if it seems like we're deleting everything
        const totalProducts = productsWithImages.rows.length;
        const deletionPercentage = (totalToDelete / totalProducts) * 100;
        if (deletionPercentage > 50) {
            console.error(`\n⚠️  WARNING: About to delete ${totalToDelete} out of ${totalProducts} products (${deletionPercentage.toFixed(1)}%)!`);
            console.error('   This seems like too many. Aborting to prevent accidental deletion.');
            console.error('   Please review the script logic if this is unexpected.');
            await client.query('ROLLBACK');
            return;
        }
        // Delete products without valid images
        // CASCADE will automatically delete related records in:
        // - product_images
        // - cart_items
        // - wishlist_items
        // - order_items
        console.log(`\n🗑️  Deleting ${totalToDelete} products without valid images...`);
        const deleteResult = await client.query(`DELETE FROM products WHERE id = ANY($1::int[])`, [productsToDelete]);
        const deletedCount = deleteResult.rowCount || 0;
        console.log(`✅ Deleted ${deletedCount} products without valid images`);
        await client.query('COMMIT');
        console.log('✅ Cleanup completed successfully');
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Deletion failed:', err);
        throw err;
    }
    finally {
        client.release();
        await pool.end();
    }
}
// Run the script
deleteProductsWithoutImages().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
