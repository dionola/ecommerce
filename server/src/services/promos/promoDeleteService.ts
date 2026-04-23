import { query } from "../../models/databaseModel.js";
import { checkPromoExists } from "./promoHelpers.js";

async function deletePromoRecord(promoId: number): Promise<void> {
  const deleteQuery = `DELETE FROM promos WHERE id = $1`;
  await query(deleteQuery, [promoId]);
}

export async function deletePromo(id: number): Promise<void> {
  await checkPromoExists(id);
  await deletePromoRecord(id);
}










