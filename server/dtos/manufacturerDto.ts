import { z } from "zod";

/**
 * DTO for creating a manufacturer
 */
export const CreateManufacturerDto = z.object({
  name: z.string().min(1, "Name cannot be empty").max(255, "Name must be 255 characters or less"),
});

export type CreateManufacturerDtoType = z.infer<typeof CreateManufacturerDto>;

/**
 * DTO for updating a manufacturer
 */
export const UpdateManufacturerDto = z.object({
  name: z.string().min(1, "Name cannot be empty").max(255, "Name must be 255 characters or less").optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

export type UpdateManufacturerDtoType = z.infer<typeof UpdateManufacturerDto>;

/**
 * DTO for manufacturer response
 */
export const ManufacturerDto = z.object({
  id: z.number().int().positive(),
  name: z.string(),
});

export type ManufacturerDtoType = z.infer<typeof ManufacturerDto>;

/**
 * DTO for manufacturer ID path parameter
 */
export const ManufacturerIdParamDto = z.object({
  id: z.coerce.number().int().positive(),
});

export type ManufacturerIdParamDtoType = z.infer<typeof ManufacturerIdParamDto>;

