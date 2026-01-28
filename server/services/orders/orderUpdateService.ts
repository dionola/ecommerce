import { query } from "../../models/databaseModel";
import { OrderDtoType, UpdateOrderDtoType } from "../../dtos/orderDto";
import { checkOrderExists, fetchOrderById } from "./orderHelpers";

interface UpdateFields {
  fields: string[];
  params: any[];
  paramIndex: number;
}

function buildUpdateFields(data: UpdateOrderDtoType): UpdateFields {
  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.status !== undefined) {
    fields.push(`status = $${paramIndex}`);
    params.push(data.status);
    paramIndex++;
  }

  if (data.stripe_payment_intent_id !== undefined) {
    fields.push(`stripe_payment_intent_id = $${paramIndex}`);
    params.push(data.stripe_payment_intent_id ?? null);
    paramIndex++;
  }

  return { fields, params, paramIndex };
}

async function updateOrderFields(orderId: number, data: UpdateOrderDtoType): Promise<void> {
  const { fields, params, paramIndex } = buildUpdateFields(data);

  if (fields.length === 0) {
    return;
  }

  params.push(orderId);
  const updateQuery = `
    UPDATE orders
    SET ${fields.join(", ")}
    WHERE id = $${paramIndex}
  `;
  
  await query(updateQuery, params);
}

export async function updateOrder(id: number, data: UpdateOrderDtoType, userId?: number): Promise<OrderDtoType> {
  await checkOrderExists(id);
  await updateOrderFields(id, data);
  return fetchOrderById(id, userId);
}






