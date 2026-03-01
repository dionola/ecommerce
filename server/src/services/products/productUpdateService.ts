import { query } from "../../models/databaseModel";
import { ProductDtoType, UpdateProductDtoType } from "../../dtos/productDto";
import { checkProductExists, fetchProductWithImages } from "./productHelpers";

interface UpdateFields {
  fields: string[];
  params: any[];
  paramIndex: number;
}

function buildUpdateFields(data: UpdateProductDtoType): UpdateFields {
  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex}`);
    params.push(data.name);
    paramIndex++;
  }

  if (data.description !== undefined) {
    fields.push(`description = $${paramIndex}`);
    params.push(data.description);
    paramIndex++;
  }

  if (data.base_price !== undefined) {
    fields.push(`base_price = $${paramIndex}`);
    params.push(data.base_price);
    paramIndex++;
  }

  if (data.country_of_origin !== undefined) {
    fields.push(`country_of_origin = $${paramIndex}`);
    params.push(data.country_of_origin);
    paramIndex++;
  }

  if (data.stock_quantity !== undefined) {
    fields.push(`stock_quantity = $${paramIndex}`);
    params.push(data.stock_quantity);
    paramIndex++;
  }

  if (data.manufacturer_id !== undefined) {
    fields.push(`manufacturer_id = $${paramIndex}`);
    params.push(data.manufacturer_id);
    paramIndex++;
  }

  return { fields, params, paramIndex };
}

async function updateProductFields(productId: number, data: UpdateProductDtoType): Promise<void> {
  const { fields, params, paramIndex } = buildUpdateFields(data);

  if (fields.length === 0) {
    return;
  }

  params.push(productId);
  const updateQuery = `
    UPDATE products
    SET ${fields.join(", ")}
    WHERE id = $${paramIndex}
  `;
  
  await query(updateQuery, params);
}

export async function updateProduct(id: number, data: UpdateProductDtoType): Promise<ProductDtoType> {
  await checkProductExists(id);
  await updateProductFields(id, data);
  return fetchProductWithImages(id);
}

