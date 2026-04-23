import { query } from "../../models/databaseModel.js";
import { ProductDto, ProductDtoType } from "../../dtos/productDto.js";
import { validateDto } from "../../utils/validateDto.js";
import { NotFoundError } from "../../errors/NotFoundError.js";

/**
 * Returns the base SELECT query for products with images
 */
export function buildProductSelectQuery(): string {
  return `
    SELECT 
      p.id, 
      p.name, 
      p.description, 
      p.base_price, 
      p.country_of_origin, 
      p.stock_quantity, 
      p.manufacturer_id,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pi.id,
            'url', pi.url,
            'is_main', pi.is_main
          ) ORDER BY pi.is_main DESC, pi.id
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'::json
      ) as images,
      COALESCE(
        json_agg(
          ps.status_type ORDER BY ps.status_type
        ) FILTER (WHERE ps.status_type IS NOT NULL),
        '[]'::json
      ) as statuses
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
    LEFT JOIN product_statuses ps ON p.id = ps.product_id
  `;
}

/**
 * Returns the GROUP BY clause for product queries
 */
export function buildProductGroupBy(): string {
  return `GROUP BY p.id, p.name, p.description, p.base_price, p.country_of_origin, p.stock_quantity, p.manufacturer_id, p.created_at`;
}

/**
 * Fetches a product by ID with its images
 */
export async function fetchProductWithImages(productId: number): Promise<ProductDtoType> {
  const selectQuery = buildProductSelectQuery();
  const groupBy = buildProductGroupBy();
  
  const fetchProductQuery = `${selectQuery}
    WHERE p.id = $1
    ${groupBy}
  `;

  const result = await query(fetchProductQuery, [productId]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError(`Product with id ${productId} not found`);
  }

  const row = result.rows[0];
  
  // Parse JSON fields from PostgreSQL
  let images = row.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch {
      images = [];
    }
  }
  if (!Array.isArray(images)) {
    images = [];
  }

  let statuses = row.statuses;
  if (typeof statuses === 'string') {
    try {
      statuses = JSON.parse(statuses);
    } catch {
      statuses = [];
    }
  }
  if (!Array.isArray(statuses)) {
    statuses = [];
  }
  // Deduplicate statuses
  statuses = [...new Set(statuses)];

  const product = {
    ...row,
    images,
    statuses,
  };

  return validateDto(ProductDto, product, "Failed to validate product data");
}

/**
 * Checks if a product exists by ID
 */
export async function checkProductExists(productId: number): Promise<void> {
  const checkQuery = `SELECT id FROM products WHERE id = $1`;
  const result = await query(checkQuery, [productId]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError(`Product with id ${productId} not found`);
  }
}

