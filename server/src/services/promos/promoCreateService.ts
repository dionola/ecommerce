import { query } from "../../models/databaseModel";
import { PromoDtoType, CreatePromoDtoType } from "../../dtos/promoDto";
import { fetchPromoById } from "./promoHelpers";

async function insertPromo(data: CreatePromoDtoType): Promise<number> {
  const insertPromoQuery = `
    INSERT INTO promos (code, discount_type, discount_value, active_until)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;

  const params = [
    data.code,
    data.discount_type,
    data.discount_value,
    data.active_until ?? null,
  ];

  const result = await query(insertPromoQuery, params);
  
  return result.rows[0].id;
}

export async function createPromo(data: CreatePromoDtoType): Promise<PromoDtoType> {
  const promoId = await insertPromo(data);
  return fetchPromoById(promoId);
}










