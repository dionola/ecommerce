import { query } from "../../models/databaseModel";
import { checkProductExists } from "./productHelpers";

async function deleteProductRecord(productId: number): Promise<void> {
  const deleteQuery = `DELETE FROM products WHERE id = $1`;
  await query(deleteQuery, [productId]);
}

export async function deleteProduct(id: number): Promise<void> {
  await checkProductExists(id);
  await deleteProductRecord(id);
}

