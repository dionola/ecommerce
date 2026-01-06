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

  // Country of origin filter (case-insensitive)
  if (filters.country_of_origin) {
    conditions.push(`LOWER(p.country_of_origin) = LOWER($${paramIndex})`);
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

  // Status filter
  if (filters.status) {
    conditions.push(`EXISTS (
      SELECT 1 FROM product_statuses ps 
      WHERE ps.product_id = p.id AND ps.status_type = $${paramIndex}
    )`);
    params.push(filters.status);
    paramIndex++;
  }

  // Multiple categories filter (takes priority over single category)
  if (filters.categories && Array.isArray(filters.categories) && filters.categories.length > 0) {
    const placeholders = filters.categories.map((_, i) => `$${paramIndex + i}`).join(', ');
    conditions.push(`p.category IN (${placeholders})`);
    params.push(...filters.categories);
    paramIndex += filters.categories.length;
  } else if (filters.category) {
    // Single category filter (for backward compatibility)
    conditions.push(`p.category = $${paramIndex}`);
    params.push(filters.category);
    paramIndex++;
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
  
  // First, get total count (use a copy of filter params, before adding pagination)
  const countQuery = `
    SELECT COUNT(DISTINCT p.id) as total
    FROM products p
    ${whereClause}
  `;
  const countResult = await query(countQuery, [...params]);
  const total = parseInt(countResult.rows[0].total, 10);
  
  // Now build pagination params for the products query
  const { params: finalParams, limitParamIndex, offsetParamIndex } = buildPaginationParams(filters, params, paramIndex);

  // Then get paginated products
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
    ${whereClause}
    GROUP BY p.id, p.name, p.description, p.base_price, p.country_of_origin, p.stock_quantity, p.manufacturer_id, p.created_at
    ${orderByClause}
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;

  const result = await query(productsQuery, finalParams);
  
  // Parse JSON fields from PostgreSQL
  const products = result.rows.map((row: any) => {
    // Parse images if it's a string
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

    // Parse statuses if it's a string
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

    return {
      ...row,
      images,
      statuses,
    };
  });
  
  const limit = filters.limit || 20;
  const page = filters.page || 1;
  const hasMore = (page * limit) < total;

  const response = {
    products,
    total,
    page,
    limit,
    hasMore,
  };
  
  return validateDto(GetProductsResponseDto, response, "Failed to validate products data");
}

