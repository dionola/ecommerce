import { z } from "zod";

export const BannerDto = z.object({
  id: z.number().int().nonnegative(),
  title: z.string(),
  description: z.string(),
  image_url: z.string().url(),
  category: z.string().nullable(),
  button_text: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type BannerDtoType = z.infer<typeof BannerDto>;

export const UpdateBannerDto = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  image_url: z.string().url().optional(),
  category: z.string().nullable().optional(),
  button_text: z.string().nullable().optional(),
});

export type UpdateBannerDtoType = z.infer<typeof UpdateBannerDto>;

export function validateDto<T>(schema: z.ZodType<T>, data: unknown, message: string): T {
  return schema.parse(data, { error: () => message });
}
