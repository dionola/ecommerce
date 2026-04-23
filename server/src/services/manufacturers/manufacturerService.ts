import { query } from "../../models/databaseModel.js";
import { ManufacturerDtoType, CreateManufacturerDtoType, UpdateManufacturerDtoType } from "../../dtos/manufacturerDto.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ValidationError } from "../../errors/ValidationError.js";

/**
 * Get all manufacturers
 */
export async function getManufacturers(): Promise<ManufacturerDtoType[]> {
  const result = await query(
    `SELECT id, name FROM manufacturers ORDER BY name ASC`
  );
  return result.rows;
}

/**
 * Get manufacturer by ID
 */
export async function getManufacturerById(id: number): Promise<ManufacturerDtoType> {
  const result = await query(
    `SELECT id, name FROM manufacturers WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError(`Manufacturer with id ${id} not found`);
  }

  return result.rows[0];
}

/**
 * Create a new manufacturer
 */
export async function createManufacturer(data: CreateManufacturerDtoType): Promise<ManufacturerDtoType> {
  try {
    const result = await query(
      `INSERT INTO manufacturers (name) VALUES ($1) RETURNING id, name`,
      [data.name]
    );
    return result.rows[0];
  } catch (error: any) {
    // Check for unique constraint violation
    if (error.code === "23505" || error.message?.includes("unique")) {
      throw new ValidationError(`Manufacturer with name "${data.name}" already exists`);
    }
    throw error;
  }
}

/**
 * Update a manufacturer
 */
export async function updateManufacturer(
  id: number,
  data: UpdateManufacturerDtoType
): Promise<ManufacturerDtoType> {
  await getManufacturerById(id); // Check if exists

  if (data.name === undefined) {
    return getManufacturerById(id);
  }

  try {
    const result = await query(
      `UPDATE manufacturers SET name = $1 WHERE id = $2 RETURNING id, name`,
      [data.name, id]
    );
    return result.rows[0];
  } catch (error: any) {
    // Check for unique constraint violation
    if (error.code === "23505" || error.message?.includes("unique")) {
      throw new ValidationError(`Manufacturer with name "${data.name}" already exists`);
    }
    throw error;
  }
}

/**
 * Delete a manufacturer
 * Checks if any products are using this manufacturer
 */
export async function deleteManufacturer(id: number): Promise<void> {
  await getManufacturerById(id); // Check if exists

  // Check if any products are using this manufacturer
  const productsCheck = await query(
    `SELECT COUNT(*) as count FROM products WHERE manufacturer_id = $1`,
    [id]
  );

  const productCount = parseInt(productsCheck.rows[0].count);
  if (productCount > 0) {
    throw new ValidationError(
      `Cannot delete manufacturer: ${productCount} product(s) are using this manufacturer. Please update or delete those products first.`
    );
  }

  await query(`DELETE FROM manufacturers WHERE id = $1`, [id]);
}

