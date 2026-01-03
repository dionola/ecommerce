import { query } from "../../models/databaseModel";
import { GetProductsResponseDto, GetProductsResponseDtoType, GetProductsQueryParamsDtoType } from "../../dtos/productDto";
import { validateDto } from "../../utils/validateDto";

interface FilterConditions {
  conditions: string[];
  params: any[];
  paramIndex: number;
}

function buildFilterConditions(filters: GetProductsQueryParamsDtoType): FilterConditions {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // Search filter (name or description)
  if (filters.search) {
    conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  // Price range filters
  if (filters.min_price !== undefined) {
    conditions.push(`p.base_price >= $${paramIndex}`);
    params.push(filters.min_price);
    paramIndex++;
  }

  if (filters.max_price !== undefined) {
    conditions.push(`p.base_price <= $${paramIndex}`);
    params.push(filters.max_price);
    paramIndex++;
  }

  // Manufacturer filter
  if (filters.manufacturer_id !== undefined) {
    conditions.push(`p.manufacturer_id = $${paramIndex}`);
    params.push(filters.manufacturer_id);
    paramIndex++;
  }

  // Country of origin filter
  if (filters.country_of_origin) {
    conditions.push(`p.country_of_origin = $${paramIndex}`);
    params.push(filters.country_of_origin);
    paramIndex++;
  }

  // Stock availability filter
  if (filters.in_stock !== undefined) {
    if (filters.in_stock) {
      conditions.push(`p.stock_quantity > 0`);
    } else {
      conditions.push(`p.stock_quantity = 0`);
    }
  }

  return { conditions, params, paramIndex };
}

function buildWhereClause(conditions: string[]): string {
  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

function buildOrderByClause(filters: GetProductsQueryParamsDtoType): string {
  const sortBy = filters.sort_by || "created_at";
  const sortColumn = sortBy === "price" ? "p.base_price" : `p.${sortBy}`;
  const order = filters.order || "desc";
  return `ORDER BY ${sortColumn} ${order.toUpperCase()}`;
}

function buildPaginationParams(
  filters: GetProductsQueryParamsDtoType,
  params: any[],
  paramIndex: number
): { params: any[]; limitParamIndex: number; offsetParamIndex: number } {
  const limit = filters.limit || 20;
  const page = filters.page || 1;
  const offset = (page - 1) * limit;
  
  const limitParamIndex = paramIndex;
  params.push(limit);
  paramIndex++;
  
  const offsetParamIndex = paramIndex;
  params.push(offset);

  return { params, limitParamIndex, offsetParamIndex };
}

export async function getProducts(filters: GetProductsQueryParamsDtoType): Promise<GetProductsResponseDtoType> {
  const { conditions, params, paramIndex } = buildFilterConditions(filters);
  const whereClause = buildWhereClause(conditions);
  const orderByClause = buildOrderByClause(filters);
  const { params: finalParams, limitParamIndex, offsetParamIndex } = buildPaginationParams(filters, params, paramIndex);

  const productsQuery = `
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
      ) as images
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
    ${whereClause}
    GROUP BY p.id, p.name, p.description, p.base_price, p.country_of_origin, p.stock_quantity, p.manufacturer_id
    ${orderByClause}
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;

  const result = await query(productsQuery, finalParams);
  
  return validateDto(GetProductsResponseDto, result.rows, "Failed to validate products data");
}

