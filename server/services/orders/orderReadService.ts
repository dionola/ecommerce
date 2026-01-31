import { query } from "../../models/databaseModel";
import { GetOrdersResponseDto, GetOrdersResponseDtoType, GetOrdersQueryParamsDtoType } from "../../dtos/orderDto";
import { validateDto } from "../../utils/validateDto";
import { fetchOrderById } from "./orderHelpers";

interface FilterConditions {
  conditions: string[];
  params: any[];
  paramIndex: number;
}

function buildFilterConditions(filters: GetOrdersQueryParamsDtoType, userId?: number): FilterConditions {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // If userId is provided and no user_id filter, scope to that user
  if (userId !== undefined && filters.user_id === undefined) {
    conditions.push(`o.user_id = $${paramIndex}`);
    params.push(userId);
    paramIndex++;
  }

  // Status filter
  if (filters.status) {
    conditions.push(`o.status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }

  // User ID filter (for admin)
  if (filters.user_id !== undefined) {
    conditions.push(`o.user_id = $${paramIndex}`);
    params.push(filters.user_id);
    paramIndex++;
  }

  return { conditions, params, paramIndex };
}

function buildWhereClause(conditions: string[]): string {
  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

function buildOrderByClause(filters: GetOrdersQueryParamsDtoType): string {
  const sortBy = filters.sort_by || "created_at";
  const order = filters.order || "desc";
  return `ORDER BY o.${sortBy} ${order.toUpperCase()}`;
}

function buildPaginationParams(
  filters: GetOrdersQueryParamsDtoType,
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

export async function getOrders(filters: GetOrdersQueryParamsDtoType, userId?: number): Promise<GetOrdersResponseDtoType> {
  const { conditions, params, paramIndex } = buildFilterConditions(filters, userId);
  const whereClause = buildWhereClause(conditions);
  const orderByClause = buildOrderByClause(filters);
  const { params: finalParams, limitParamIndex, offsetParamIndex } = buildPaginationParams(filters, params, paramIndex);

  const ordersQuery = `
    SELECT 
      o.id,
      o.user_id,
      o.total_amount,
      o.status,
      o.promo_id,
      o.payment_intent_id,
      o.shipping_address,
      o.created_at
    FROM orders o
    ${whereClause}
    ${orderByClause}
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;

  const result = await query(ordersQuery, finalParams);
  
  // Fetch full order details with items for each order
  const ordersWithItems = await Promise.all(
    result.rows.map(row => fetchOrderById(row.id, userId))
  );
  
  return validateDto(GetOrdersResponseDto, ordersWithItems, "Failed to validate orders data");
}

export async function getOrderById(orderId: number, userId?: number) {
  return fetchOrderById(orderId, userId);
}










