import { z } from "zod";

export const ProductImageDto = z.object({
  id: z.number().int().positive(),
  url: z.string(),
  is_main: z.boolean(),
});

export type ProductImageDtoType = z.infer<typeof ProductImageDto>;

export const ProductDto = z.object({
  id: z.number().int().positive(),
  name: z.string().max(255),
  description: z.string().nullable(),
  base_price: z.coerce.number().nonnegative(), // PostgreSQL DECIMAL returns as string
  country_of_origin: z.string().max(100).nullable(),
  stock_quantity: z.number().int().nonnegative(),
  manufacturer_id: z.number().int().positive().nullable(),
  images: z.array(ProductImageDto).default([]),
  statuses: z.array(z.string()).default([]),
});

export type ProductDtoType = z.infer<typeof ProductDto>;

export const GetProductsResponseDto = z.object({
  products: z.array(ProductDto),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});

export type GetProductsResponseDtoType = z.infer<typeof GetProductsResponseDto>;

export const GetProductsQueryParamsDto = z.object({
  search: z.string().optional(),
  min_price: z.coerce.number().nonnegative().optional(),
  max_price: z.coerce.number().nonnegative().optional(),
  manufacturer_id: z.coerce.number().int().positive().optional(),
  country_of_origin: z.string().optional(),
  in_stock: z.coerce.boolean().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  categories: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return [val];
      }
    }
    return val;
  }),
  sort_by: z.enum(["name", "price", "created_at"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type GetProductsQueryParamsDtoType = z.infer<typeof GetProductsQueryParamsDto>;

// Create Product DTO
export const CreateProductDto = z.object({
  name: z.string().max(255),
  description: z.string().nullable().optional(),
  base_price: z.coerce.number().nonnegative(),
  country_of_origin: z.string().max(100).nullable().optional(),
  stock_quantity: z.coerce.number().int().nonnegative().default(0),
  manufacturer_id: z.coerce.number().int().positive().nullable().optional(),
  images: z.array(z.object({
    url: z.string(),
    is_main: z.boolean().default(false),
  })).optional().default([]),
});

export type CreateProductDtoType = z.infer<typeof CreateProductDto>;

// Update Product DTO (all fields optional for PATCH)
export const UpdateProductDto = z.object({
  name: z.string().max(255).optional(),
  description: z.string().nullable().optional(),
  base_price: z.coerce.number().nonnegative().optional(),
  country_of_origin: z.string().max(100).nullable().optional(),
  stock_quantity: z.coerce.number().int().nonnegative().optional(),
  manufacturer_id: z.coerce.number().int().positive().nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

export type UpdateProductDtoType = z.infer<typeof UpdateProductDto>;

// Product ID param DTO (for update and delete)
export const ProductIdParamDto = z.object({
  id: z.coerce.number().int().positive(),
});

export type ProductIdParamDtoType = z.infer<typeof ProductIdParamDto>;

