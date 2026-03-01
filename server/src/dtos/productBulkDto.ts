import { z } from "zod";
import { CreateProductDto } from "./productDto";
import { UpdateProductDto } from "./productDto";

/**
 * DTO for bulk creating products
 */
export const BulkCreateProductsDto = z.object({
  products: z.array(CreateProductDto).min(1, "At least one product is required").max(100, "Maximum 100 products per bulk operation"),
});

export type BulkCreateProductsDtoType = z.infer<typeof BulkCreateProductsDto>;

/**
 * DTO for bulk updating products
 */
export const BulkUpdateProductsDto = z.object({
  updates: z.array(
    z.object({
      id: z.number().int().positive(),
      data: UpdateProductDto,
    })
  ).min(1, "At least one update is required").max(100, "Maximum 100 updates per bulk operation"),
});

export type BulkUpdateProductsDtoType = z.infer<typeof BulkUpdateProductsDto>;

/**
 * DTO for bulk deleting products
 */
export const BulkDeleteProductsDto = z.object({
  ids: z.array(z.number().int().positive()).min(1, "At least one product ID is required").max(100, "Maximum 100 products per bulk operation"),
});

export type BulkDeleteProductsDtoType = z.infer<typeof BulkDeleteProductsDto>;

