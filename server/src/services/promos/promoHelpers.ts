import { query } from "../../models/databaseModel.js";
import { PromoDto, PromoDtoType } from "../../dtos/promoDto.js";
import { validateDto } from "../../utils/validateDto.js";
import { NotFoundError } from "../../errors/NotFoundError.js";

/**
 * Fetches a promo by ID
 */
export async function fetchPromoById(promoId: number): Promise<PromoDtoType> {
  const fetchPromoQuery = `
    SELECT 
      id,
      code,
      discount_type,
      discount_value,
      active_until
    FROM promos
    WHERE id = $1
  `;

  const result = await query(fetchPromoQuery, [promoId]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError(`Promo with id ${promoId} not found`);
  }

  return validateDto(PromoDto, result.rows[0], "Failed to validate promo data");
}

/**
 * Checks if a promo exists by ID
 */
export async function checkPromoExists(promoId: number): Promise<void> {
  const checkQuery = `SELECT id FROM promos WHERE id = $1`;
  const result = await query(checkQuery, [promoId]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError(`Promo with id ${promoId} not found`);
  }
}










