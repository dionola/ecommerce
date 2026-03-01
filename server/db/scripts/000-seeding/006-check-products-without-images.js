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
async function checkProductsWithoutImages() {
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
        // First, get all products with their images
        console.log('🔍 Finding products and checking for valid image files...');
        console.log('⚠️  DRY RUN MODE - No products will be deleted\n');
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
        const productsToDeleteDetails = [];
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
                productsToDeleteDetails.push({
                    id: product.id,
                    name: product.name,
                    reason: 'No images in database',
                    imageIds: []
                });
                continue;
            }
            // Check if at least one image file exists in the images folder
            let hasValidImage = false;
            let checkedImages = 0;
            const missingImageIds = [];
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
                else {
                    missingImageIds.push(image.id);
                }
            }
            if (!hasValidImage) {
                if (checkedImages > 0) {
                    productsWithoutFileImages++;
                    productsToDeleteDetails.push({
                        id: product.id,
                        name: product.name,
                        reason: `No valid image files found (${checkedImages} images in DB, none exist as files)`,
                        imageIds: images.map(img => img.id)
                    });
                }
                else {
                    // This shouldn't happen since we already checked for empty arrays above
                    productsWithoutDbImages++;
                    productsToDeleteDetails.push({
                        id: product.id,
                        name: product.name,
                        reason: 'No images in database',
                        imageIds: []
                    });
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
        console.log(`   - Total products that WOULD BE deleted: ${totalToDelete}`);
        console.log(`   - Total products that WOULD BE kept: ${productsWithImages.rows.length - totalToDelete}`);
        if (totalToDelete === 0) {
            console.log('\n✅ No products would be deleted. All products have valid images.');
            return;
        }
        // Show detailed breakdown
        const totalProducts = productsWithImages.rows.length;
        const deletionPercentage = (totalToDelete / totalProducts) * 100;
        console.log(`\n📈 Deletion Summary:`);
        console.log(`   - Deletion percentage: ${deletionPercentage.toFixed(2)}%`);
        console.log(`   - Products to keep: ${totalProducts - totalToDelete} (${((totalProducts - totalToDelete) / totalProducts * 100).toFixed(2)}%)`);
        // Show products that would be deleted
        if (totalToDelete > 0) {
            console.log('\n📋 Products that WOULD BE deleted (first 30):');
            productsToDeleteDetails.slice(0, 30).forEach((detail) => {
                const imageInfo = detail.imageIds.length > 0
                    ? `Image IDs: ${detail.imageIds.slice(0, 3).join(', ')}${detail.imageIds.length > 3 ? ` (+${detail.imageIds.length - 3} more)` : ''}`
                    : 'No image IDs';
                console.log(`   - ID: ${detail.id}, Name: ${detail.name}`);
                console.log(`     Reason: ${detail.reason}`);
                if (detail.imageIds.length > 0) {
                    console.log(`     ${imageInfo}`);
                }
            });
            if (totalToDelete > 30) {
                console.log(`   ... and ${totalToDelete - 30} more products`);
            }
            // Show some examples of products that would be KEPT
            const productsToKeep = productsWithImages.rows
                .filter((p) => !productsToDelete.includes(p.id))
                .slice(0, 10);
            if (productsToKeep.length > 0) {
                console.log('\n✅ Sample products that WOULD BE KEPT (first 10):');
                productsToKeep.forEach((product) => {
                    let imagesInfo = 'no images';
                    if (product.images) {
                        const imgArray = typeof product.images === 'string'
                            ? JSON.parse(product.images)
                            : product.images;
                        if (Array.isArray(imgArray) && imgArray.length > 0) {
                            const firstImageId = imgArray[0]?.id;
                            const imagePath = path_1.default.join(imagesDir, `${firstImageId}.jpg`);
                            const fileExists = fs_1.default.existsSync(imagePath);
                            imagesInfo = `${imgArray.length} images in DB, first file (${firstImageId}.jpg) exists: ${fileExists}`;
                        }
                    }
                    console.log(`   - ID: ${product.id}, Name: ${product.name}`);
                    console.log(`     ${imagesInfo}`);
                });
            }
        }
        // Safety check warning
        if (deletionPercentage > 50) {
            console.error(`\n⚠️  WARNING: Would delete ${totalToDelete} out of ${totalProducts} products (${deletionPercentage.toFixed(1)}%)!`);
            console.error('   This seems like too many. Please review the logic before running the actual deletion script.');
        }
        else {
            console.log(`\n✅ Deletion percentage looks reasonable (${deletionPercentage.toFixed(2)}%)`);
        }
        console.log('\n💡 This was a DRY RUN. No products were actually deleted.');
        console.log('   To actually delete these products, run: 006-delete-products-without-images.ts');
    }
    catch (err) {
        console.error('❌ Check failed:', err);
        throw err;
    }
    finally {
        client.release();
        await pool.end();
    }
}
// Run the script
checkProductsWithoutImages().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
