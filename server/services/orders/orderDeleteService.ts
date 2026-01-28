import { query } from "../../models/databaseModel";
import { checkOrderExists } from "./orderHelpers";
import { ValidationError } from "../../errors/ValidationError";

async function deleteOrderRecord(orderId: number): Promise<void> {
  // Check if order can be deleted (only pending orders should be deletable)
  const checkStatusQuery = `
    SELECT status FROM orders WHERE id = $1
  `;
  const statusResult = await query(checkStatusQuery, [orderId]);
  
  if (statusResult.rows.length === 0) {
    return;
  }
  
  const status = statusResult.rows[0].status;
  
  if (status !== "pending") {
    throw new ValidationError(`Cannot delete order with status: ${status}. Only pending orders can be deleted.`);
  }
  
  // Delete order (cascade will delete order_items)
  const deleteQuery = `DELETE FROM orders WHERE id = $1`;
  await query(deleteQuery, [orderId]);
}

export async function deleteOrder(id: number): Promise<void> {
  await checkOrderExists(id);
  await deleteOrderRecord(id);
}






