import { z } from "zod";

export const ProductDto = z.object({
  id: z.number().int().positive(),
  name: z.string().max(255),
  description: z.string().nullable(),
  base_price: z.coerce.number().nonnegative(), // PostgreSQL DECIMAL returns as string
  country_of_origin: z.string().max(100).nullable(),
  stock_quantity: z.number().int().nonnegative(),
  manufacturer_id: z.number().int().positive().nullable(),
});

export type ProductDtoType = z.infer<typeof ProductDto>;

export const GetProductsResponseDto = z.array(ProductDto);

export type GetProductsResponseDtoType = z.infer<typeof GetProductsResponseDto>;

export const GetProductsQueryParamsDto = z.object({
  search: z.string().optional(),
  min_price: z.coerce.number().nonnegative().optional(),
  max_price: z.coerce.number().nonnegative().optional(),
  manufacturer_id: z.coerce.number().int().positive().optional(),
  country_of_origin: z.string().optional(),
  in_stock: z.coerce.boolean().optional(),
  sort_by: z.enum(["name", "price", "created_at"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type GetProductsQueryParamsDtoType = z.infer<typeof GetProductsQueryParamsDto>;

