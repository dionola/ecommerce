import { z } from "zod";

/**
 * DTO for creating product images
 */
export const CreateProductImageDto = z.object({
  url: z.string().url("Invalid URL format"),
  is_main: z.boolean().default(false),
});

export type CreateProductImageDtoType = z.infer<typeof CreateProductImageDto>;

/**
 * DTO for creating multiple product images
 */
export const CreateProductImagesDto = z.object({
  images: z.array(CreateProductImageDto).min(1, "At least one image is required"),
});

export type CreateProductImagesDtoType = z.infer<typeof CreateProductImagesDto>;

/**
 * DTO for updating a product image
 */
export const UpdateProductImageDto = z.object({
  url: z.string().url("Invalid URL format").optional(),
  is_main: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

export type UpdateProductImageDtoType = z.infer<typeof UpdateProductImageDto>;

/**
 * DTO for reordering product images
 */
export const ReorderProductImagesDto = z.object({
  imageIds: z.array(z.number().int().positive()).min(1, "At least one image ID is required"),
});

export type ReorderProductImagesDtoType = z.infer<typeof ReorderProductImagesDto>;

/**
 * DTO for product image path parameters
 */
export const ProductImageIdParamDto = z.object({
  productId: z.coerce.number().int().positive(),
  imageId: z.coerce.number().int().positive(),
});

export type ProductImageIdParamDtoType = z.infer<typeof ProductImageIdParamDto>;

