import { query } from "../../models/databaseModel";
import { ProductDtoType } from "../../dtos/productDto";
import { fetchProductWithImages, checkProductExists } from "./productHelpers";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";
import { CreateProductImageDtoType, UpdateProductImageDtoType } from "../../dtos/productImageDto";

/**
 * Add images to a product
 */
export async function addProductImages(
  productId: number,
  images: CreateProductImageDtoType[]
): Promise<ProductDtoType> {
  await checkProductExists(productId);

  if (!images || images.length === 0) {
    throw new ValidationError("At least one image is required");
  }

  // Build insert query for multiple images
  const imageValues = images.map((img, index) => {
    const baseIndex = index * 3;
    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`;
  }).join(", ");

  const insertQuery = `
    INSERT INTO product_images (product_id, url, is_main)
    VALUES ${imageValues}
  `;

  const params: any[] = [];
  images.forEach((img) => {
    params.push(productId, img.url, img.is_main ?? false);
  });

  await query(insertQuery, params);

  // If any image is marked as main, ensure only one is main
  const hasMainImage = images.some((img) => img.is_main);
  if (hasMainImage) {
    await ensureSingleMainImage(productId);
  }

  return fetchProductWithImages(productId);
}

/**
 * Update a product image
 */
export async function updateProductImage(
  productId: number,
  imageId: number,
  data: UpdateProductImageDtoType
): Promise<ProductDtoType> {
  await checkProductExists(productId);

  // Verify image exists and belongs to product
  const imageCheck = await query(
    `SELECT id FROM product_images WHERE id = $1 AND product_id = $2`,
    [imageId, productId]
  );

  if (imageCheck.rows.length === 0) {
    throw new NotFoundError(`Product image with id ${imageId} not found for product ${productId}`);
  }

  // Build update query
  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.url !== undefined) {
    fields.push(`url = $${paramIndex}`);
    params.push(data.url);
    paramIndex++;
  }

  if (data.is_main !== undefined) {
    fields.push(`is_main = $${paramIndex}`);
    params.push(data.is_main);
    paramIndex++;
  }

  if (fields.length === 0) {
    return fetchProductWithImages(productId);
  }

  params.push(imageId, productId);
  const updateQuery = `
    UPDATE product_images
    SET ${fields.join(", ")}
    WHERE id = $${paramIndex} AND product_id = $${paramIndex + 1}
  `;

  await query(updateQuery, params);

  // If setting as main, ensure only one is main
  if (data.is_main === true) {
    await ensureSingleMainImage(productId, imageId);
  }

  return fetchProductWithImages(productId);
}

/**
 * Delete a product image
 * Ensures at least one main image remains
 */
export async function deleteProductImage(
  productId: number,
  imageId: number
): Promise<ProductDtoType> {
  await checkProductExists(productId);

  // Get image info before deletion
  const imageInfo = await query(
    `SELECT id, is_main FROM product_images WHERE id = $1 AND product_id = $2`,
    [imageId, productId]
  );

  if (imageInfo.rows.length === 0) {
    throw new NotFoundError(`Product image with id ${imageId} not found for product ${productId}`);
  }

  const isMain = imageInfo.rows[0].is_main;

  // Delete the image
  await query(
    `DELETE FROM product_images WHERE id = $1 AND product_id = $2`,
    [imageId, productId]
  );

  // If we deleted the main image, set another image as main
  if (isMain) {
    const remainingImages = await query(
      `SELECT id FROM product_images WHERE product_id = $1 ORDER BY id LIMIT 1`,
      [productId]
    );

    if (remainingImages.rows.length > 0) {
      await query(
        `UPDATE product_images SET is_main = true WHERE id = $1`,
        [remainingImages.rows[0].id]
      );
    }
  }

  return fetchProductWithImages(productId);
}

/**
 * Reorder product images
 */
export async function reorderProductImages(
  productId: number,
  imageIds: number[]
): Promise<ProductDtoType> {
  await checkProductExists(productId);

  // Verify all images belong to the product
  const placeholders = imageIds.map((_, i) => `$${i + 1}`).join(", ");
  const verifyQuery = `
    SELECT id FROM product_images
    WHERE product_id = $${imageIds.length + 1} AND id IN (${placeholders})
  `;
  const verifyResult = await query(verifyQuery, [...imageIds, productId]);

  if (verifyResult.rows.length !== imageIds.length) {
    throw new ValidationError("Some image IDs do not belong to this product");
  }

  // Update image order (using a sequence number)
  // Note: PostgreSQL doesn't have a built-in order column, so we'll use id ordering
  // For a more robust solution, you might want to add an `order` column to product_images
  // For now, we'll just ensure the images exist and return the product

  return fetchProductWithImages(productId);
}

/**
 * Ensure only one image is marked as main for a product
 * If excludeImageId is provided, that image won't be changed
 */
async function ensureSingleMainImage(productId: number, excludeImageId?: number): Promise<void> {
  // Get all images for the product
  const images = await query(
    `SELECT id, is_main FROM product_images WHERE product_id = $1`,
    [productId]
  );

  const mainImages = images.rows.filter(
    (img) => img.is_main && (!excludeImageId || img.id !== excludeImageId)
  );

  // If multiple main images exist (excluding the one we're setting), unset them
  if (mainImages.length > 0) {
    const mainImageIds = mainImages.map((img) => img.id);
    const placeholders = mainImageIds.map((_, i) => `$${i + 1}`).join(", ");
    await query(
      `UPDATE product_images SET is_main = false WHERE id IN (${placeholders})`,
      mainImageIds
    );
  }
}

