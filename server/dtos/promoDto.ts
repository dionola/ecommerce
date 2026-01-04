import { z } from "zod";

export const PromoDto = z.object({
  id: z.number().int().positive(),
  code: z.string().max(50),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number().nonnegative(),
  active_until: z.coerce.date().nullable(),
});

export type PromoDtoType = z.infer<typeof PromoDto>;

export const GetPromosResponseDto = z.array(PromoDto);

export type GetPromosResponseDtoType = z.infer<typeof GetPromosResponseDto>;

export const GetPromosQueryParamsDto = z.object({
  code: z.string().optional(),
  active: z.coerce.boolean().optional(),
  discount_type: z.enum(["percentage", "fixed"]).optional(),
  sort_by: z.enum(["code", "discount_value", "active_until"]).optional().default("code"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type GetPromosQueryParamsDtoType = z.infer<typeof GetPromosQueryParamsDto>;

// Create Promo DTO
export const CreatePromoDto = z.object({
  code: z.string().max(50),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number().positive(),
  active_until: z.coerce.date().nullable().optional(),
});

export type CreatePromoDtoType = z.infer<typeof CreatePromoDto>;

// Update Promo DTO (all fields optional for PATCH)
export const UpdatePromoDto = z.object({
  code: z.string().max(50).optional(),
  discount_type: z.enum(["percentage", "fixed"]).optional(),
  discount_value: z.coerce.number().positive().optional(),
  active_until: z.coerce.date().nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

export type UpdatePromoDtoType = z.infer<typeof UpdatePromoDto>;

// Promo ID param DTO (for update and delete)
export const PromoIdParamDto = z.object({
  id: z.coerce.number().int().positive(),
});

export type PromoIdParamDtoType = z.infer<typeof PromoIdParamDto>;

