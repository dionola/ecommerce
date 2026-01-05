import { query } from "../../models/databaseModel";
import { PromoDtoType, UpdatePromoDtoType } from "../../dtos/promoDto";
import { checkPromoExists, fetchPromoById } from "./promoHelpers";

interface UpdateFields {
  fields: string[];
  params: any[];
  paramIndex: number;
}

function buildUpdateFields(data: UpdatePromoDtoType): UpdateFields {
  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.code !== undefined) {
    fields.push(`code = $${paramIndex}`);
    params.push(data.code);
    paramIndex++;
  }

  if (data.discount_type !== undefined) {
    fields.push(`discount_type = $${paramIndex}`);
    params.push(data.discount_type);
    paramIndex++;
  }

  if (data.discount_value !== undefined) {
    fields.push(`discount_value = $${paramIndex}`);
    params.push(data.discount_value);
    paramIndex++;
  }

  if (data.active_until !== undefined) {
    fields.push(`active_until = $${paramIndex}`);
    params.push(data.active_until ?? null);
    paramIndex++;
  }

  return { fields, params, paramIndex };
}

async function updatePromoFields(promoId: number, data: UpdatePromoDtoType): Promise<void> {
  const { fields, params, paramIndex } = buildUpdateFields(data);

  if (fields.length === 0) {
    return;
  }

  params.push(promoId);
  const updateQuery = `
    UPDATE promos
    SET ${fields.join(", ")}
    WHERE id = $${paramIndex}
  `;
  
  await query(updateQuery, params);
}

export async function updatePromo(id: number, data: UpdatePromoDtoType): Promise<PromoDtoType> {
  await checkPromoExists(id);
  await updatePromoFields(id, data);
  return fetchPromoById(id);
}



