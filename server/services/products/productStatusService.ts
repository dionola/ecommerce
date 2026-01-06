import { query } from "../../models/databaseModel";
import { ProductDtoType } from "../../dtos/productDto";
import { fetchProductWithImages, checkProductExists } from "./productHelpers";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";

/**
 * Valid status types for products
 */
const VALID_STATUS_TYPES = ["featured", "on_sale", "new", "bestseller", "limited"] as const;

/**
 * Add a status to a product
 */
export async function addProductStatus(
  productId: number,
  status: string
): Promise<ProductDtoType> {
  await checkProductExists(productId);

  // Validate status type
  if (!VALID_STATUS_TYPES.includes(status as any)) {
    throw new ValidationError(
      `Invalid status type. Must be one of: ${VALID_STATUS_TYPES.join(", ")}`
    );
  }

  // Check if status already exists
  const existingStatus = await query(
    `SELECT id FROM product_statuses WHERE product_id = $1 AND status_type = $2`,
    [productId, status]
  );

  if (existingStatus.rows.length > 0) {
    throw new ValidationError(`Product already has status: ${status}`);
  }

  // Add status
  await query(
    `INSERT INTO product_statuses (product_id, status_type) VALUES ($1, $2)`,
    [productId, status]
  );

  return fetchProductWithImages(productId);
}

/**
 * Remove a status from a product
 */
export async function removeProductStatus(
  productId: number,
  status: string
): Promise<ProductDtoType> {
  await checkProductExists(productId);

  // Check if status exists
  const existingStatus = await query(
    `SELECT id FROM product_statuses WHERE product_id = $1 AND status_type = $2`,
    [productId, status]
  );

  if (existingStatus.rows.length === 0) {
    throw new NotFoundError(`Product does not have status: ${status}`);
  }

  // Remove status
  await query(
    `DELETE FROM product_statuses WHERE product_id = $1 AND status_type = $2`,
    [productId, status]
  );

  return fetchProductWithImages(productId);
}

