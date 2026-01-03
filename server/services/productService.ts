import { query } from "../models/databaseModel";
import { GetProductsResponseDto, GetProductsResponseDtoType, GetProductsQueryParamsDtoType } from "../dtos/productDto";
import { validateDto } from "../utils/validateDto";

export async function getProducts(filters: GetProductsQueryParamsDtoType): Promise<GetProductsResponseDtoType> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // Search filter (name or description)
  if (filters.search) {
    conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  // Price range filters
  if (filters.min_price !== undefined) {
    conditions.push(`base_price >= $${paramIndex}`);
    params.push(filters.min_price);
    paramIndex++;
  }

  if (filters.max_price !== undefined) {
    conditions.push(`base_price <= $${paramIndex}`);
    params.push(filters.max_price);
    paramIndex++;
  }

  // Manufacturer filter
  if (filters.manufacturer_id !== undefined) {
    conditions.push(`manufacturer_id = $${paramIndex}`);
    params.push(filters.manufacturer_id);
    paramIndex++;
  }

  // Country of origin filter
  if (filters.country_of_origin) {
    conditions.push(`country_of_origin = $${paramIndex}`);
    params.push(filters.country_of_origin);
    paramIndex++;
  }

  // Stock availability filter
  if (filters.in_stock !== undefined) {
    if (filters.in_stock) {
      conditions.push(`stock_quantity > 0`);
    } else {
      conditions.push(`stock_quantity = 0`);
    }
  }

  // Build WHERE clause
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Sorting - map "price" to "base_price" for database column
  const sortBy = filters.sort_by || "created_at";
  const sortColumn = sortBy === "price" ? "base_price" : sortBy;
  const order = filters.order || "desc";
  const orderByClause = `ORDER BY ${sortColumn} ${order.toUpperCase()}`;

  // Pagination
  const limit = filters.limit || 20;
  const page = filters.page || 1;
  const offset = (page - 1) * limit;
  
  const limitParamIndex = paramIndex;
  params.push(limit);
  paramIndex++;
  
  const offsetParamIndex = paramIndex;
  params.push(offset);

  const productsQuery = `
    SELECT id, name, description, base_price, country_of_origin, stock_quantity, manufacturer_id
    FROM products
    ${whereClause}
    ${orderByClause}
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;

  const result = await query(productsQuery, params);
  
  return validateDto(GetProductsResponseDto, result.rows, "Failed to validate products data");
}