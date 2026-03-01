import { z } from "zod";

export const CreateCheckoutSessionDto = z.object({
  order_id: z.coerce.number().int().positive(),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
});

export type CreateCheckoutSessionDtoType = z.infer<typeof CreateCheckoutSessionDto>;

export const CheckoutSessionResponseDto = z.object({
  checkoutUrl: z.string().url(),
  sessionId: z.string(),
});

export type CheckoutSessionResponseDtoType = z.infer<typeof CheckoutSessionResponseDto>;










