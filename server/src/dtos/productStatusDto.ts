import { z } from "zod";

/**
 * DTO for adding a status to a product
 */
export const AddProductStatusDto = z.object({
  status: z.string().min(1, "Status cannot be empty"),
});

export type AddProductStatusDtoType = z.infer<typeof AddProductStatusDto>;

/**
 * DTO for product status path parameters
 */
export const ProductStatusParamDto = z.object({
  productId: z.coerce.number().int().positive(),
  status: z.string().min(1),
});

export type ProductStatusParamDtoType = z.infer<typeof ProductStatusParamDto>;

