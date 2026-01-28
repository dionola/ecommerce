import { z } from "zod";
import { PaymentProcessorType } from "../services/payments/paymentTypes";

export const CreatePaymentIntentDto = z.object({
  order_id: z.coerce.number().int().positive(),
  processor: z.enum(["stripe", "local1", "local2"]).optional(),
});

export type CreatePaymentIntentDtoType = z.infer<typeof CreatePaymentIntentDto>;

export const PaymentIntentResponseDto = z.object({
  paymentIntentId: z.string(),
  clientSecret: z.string().optional(),
  status: z.enum([
    "requires_payment_method",
    "requires_confirmation",
    "requires_action",
    "processing",
    "succeeded",
    "canceled",
  ]),
  metadata: z.record(z.string()).optional(),
});

export type PaymentIntentResponseDtoType = z.infer<typeof PaymentIntentResponseDto>;

export const ConfirmPaymentDto = z.object({
  payment_intent_id: z.string(),
  payment_method_id: z.string().optional(),
  processor: z.enum(["stripe", "local1", "local2"]).optional(),
});

export type ConfirmPaymentDtoType = z.infer<typeof ConfirmPaymentDto>;

export const ConfirmPaymentResponseDto = z.object({
  paymentIntentId: z.string(),
  status: z.enum(["succeeded", "failed", "canceled", "processing"]),
  transactionId: z.string().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
});

export type ConfirmPaymentResponseDtoType = z.infer<typeof ConfirmPaymentResponseDto>;

export const PaymentIntentIdParamDto = z.object({
  paymentIntentId: z.string(),
});

export type PaymentIntentIdParamDtoType = z.infer<typeof PaymentIntentIdParamDto>;

export const RefundPaymentDto = z.object({
  payment_intent_id: z.string(),
  amount: z.coerce.number().positive().optional(),
  reason: z.string().optional(),
  processor: z.enum(["stripe", "local1", "local2"]).optional(),
});

export type RefundPaymentDtoType = z.infer<typeof RefundPaymentDto>;

export const RefundResponseDto = z.object({
  refundId: z.string(),
  amount: z.coerce.number().nonnegative(),
  status: z.enum(["succeeded", "pending", "failed"]),
  paymentIntentId: z.string(),
});

export type RefundResponseDtoType = z.infer<typeof RefundResponseDto>;






