import { query } from "../../models/databaseModel";
import { ProductDtoType, CreateProductDtoType, UpdateProductDtoType } from "../../dtos/productDto";
import { BulkCreateProductsDtoType, BulkUpdateProductsDtoType, BulkDeleteProductsDtoType } from "../../dtos/productBulkDto";
import { createProduct } from "./productCreateService";
import { updateProduct } from "./productUpdateService";
import { deleteProduct } from "./productDeleteService";
import { fetchProductWithImages } from "./productHelpers";
import { ValidationError } from "../../errors/ValidationError";

/**
 * Bulk create products
 */
export async function bulkCreateProducts(data: BulkCreateProductsDtoType): Promise<{
  created: ProductDtoType[];
  errors: Array<{ index: number; error: string }>;
}> {
  const created: ProductDtoType[] = [];
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < data.products.length; i++) {
    try {
      const product = await createProduct(data.products[i]);
      created.push(product);
    } catch (error: any) {
      errors.push({
        index: i,
        error: error.message || "Failed to create product",
      });
    }
  }

  return { created, errors };
}

/**
 * Bulk update products
 */
export async function bulkUpdateProducts(data: BulkUpdateProductsDtoType): Promise<{
  updated: ProductDtoType[];
  errors: Array<{ id: number; error: string }>;
}> {
  const updated: ProductDtoType[] = [];
  const errors: Array<{ id: number; error: string }> = [];

  for (const update of data.updates) {
    try {
      const product = await updateProduct(update.id, update.data);
      updated.push(product);
    } catch (error: any) {
      errors.push({
        id: update.id,
        error: error.message || "Failed to update product",
      });
    }
  }

  return { updated, errors };
}

/**
 * Bulk delete products
 */
export async function bulkDeleteProducts(data: BulkDeleteProductsDtoType): Promise<{
  deleted: number[];
  errors: Array<{ id: number; error: string }>;
}> {
  const deleted: number[] = [];
  const errors: Array<{ id: number; error: string }> = [];

  for (const id of data.ids) {
    try {
      await deleteProduct(id);
      deleted.push(id);
    } catch (error: any) {
      errors.push({
        id,
        error: error.message || "Failed to delete product",
      });
    }
  }

  return { deleted, errors };
}

