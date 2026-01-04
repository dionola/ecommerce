import { query } from "../../models/databaseModel";
import { GetPromosResponseDto, GetPromosResponseDtoType, GetPromosQueryParamsDtoType } from "../../dtos/promoDto";
import { validateDto } from "../../utils/validateDto";

interface FilterConditions {
  conditions: string[];
  params: any[];
  paramIndex: number;
}

function buildFilterConditions(filters: GetPromosQueryParamsDtoType): FilterConditions {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // Code filter
  if (filters.code) {
    conditions.push(`code ILIKE $${paramIndex}`);
    params.push(`%${filters.code}%`);
    paramIndex++;
  }

  // Active filter (check if active_until is null or in the future)
  if (filters.active !== undefined) {
    if (filters.active) {
      conditions.push(`(active_until IS NULL OR active_until > CURRENT_TIMESTAMP)`);
    } else {
      conditions.push(`(active_until IS NOT NULL AND active_until <= CURRENT_TIMESTAMP)`);
    }
  }

  // Discount type filter
  if (filters.discount_type) {
    conditions.push(`discount_type = $${paramIndex}`);
    params.push(filters.discount_type);
    paramIndex++;
  }

  return { conditions, params, paramIndex };
}

function buildWhereClause(conditions: string[]): string {
  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

function buildOrderByClause(filters: GetPromosQueryParamsDtoType): string {
  const sortBy = filters.sort_by || "code";
  const order = filters.order || "asc";
  return `ORDER BY ${sortBy} ${order.toUpperCase()}`;
}

function buildPaginationParams(
  filters: GetPromosQueryParamsDtoType,
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

export async function getPromos(filters: GetPromosQueryParamsDtoType): Promise<GetPromosResponseDtoType> {
  const { conditions, params, paramIndex } = buildFilterConditions(filters);
  const whereClause = buildWhereClause(conditions);
  const orderByClause = buildOrderByClause(filters);
  const { params: finalParams, limitParamIndex, offsetParamIndex } = buildPaginationParams(filters, params, paramIndex);

  const promosQuery = `
    SELECT 
      id,
      code,
      discount_type,
      discount_value,
      active_until
    FROM promos
    ${whereClause}
    ${orderByClause}
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;

  const result = await query(promosQuery, finalParams);
  
  return validateDto(GetPromosResponseDto, result.rows, "Failed to validate promos data");
}

export async function getPromoById(promoId: number) {
  const { fetchPromoById } = await import("./promoHelpers");
  return fetchPromoById(promoId);
}

