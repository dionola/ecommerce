import { query } from "../../models/databaseModel";
import { checkPromoExists } from "./promoHelpers";

async function deletePromoRecord(promoId: number): Promise<void> {
  const deleteQuery = `DELETE FROM promos WHERE id = $1`;
  await query(deleteQuery, [promoId]);
}

export async function deletePromo(id: number): Promise<void> {
  await checkPromoExists(id);
  await deletePromoRecord(id);
}





