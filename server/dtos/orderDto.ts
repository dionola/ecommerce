import { z } from "zod";
import { ProductDto } from "./productDto";

export const OrderItemDto = z.object({
  id: z.number().int().positive(),
  product: ProductDto,
  quantity: z.number().int().positive(),
  price_at_purchase: z.coerce.number().nonnegative(),
});

export type OrderItemDtoType = z.infer<typeof OrderItemDto>;

export const OrderDto = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  total_amount: z.coerce.number().nonnegative(),
  status: z.string(),
  promo_id: z.number().int().positive().nullable(),
  payment_intent_id: z.string().nullable(),
  shipping_address: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.coerce.date(),
  items: z.array(OrderItemDto).default([]),
});

export type OrderDtoType = z.infer<typeof OrderDto>;

export const GetOrdersResponseDto = z.array(OrderDto);

export type GetOrdersResponseDtoType = z.infer<typeof GetOrdersResponseDto>;

export const GetOrdersQueryParamsDto = z.object({
  status: z.string().optional(),
  user_id: z.coerce.number().int().positive().optional(),
  sort_by: z.enum(["created_at", "total_amount", "status"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type GetOrdersQueryParamsDtoType = z.infer<typeof GetOrdersQueryParamsDto>;

// Create Order DTO
export const CreateOrderDto = z.object({
  shipping_address: z.record(z.string(), z.unknown()),
  promo_id: z.coerce.number().int().positive().nullable().optional(),
  promo_code: z.string().optional(), // Accept promo code as string
  create_payment_intent: z.boolean().optional().default(false),
  payment_processor: z.enum(["payrex"]).optional(),
  payment_method: z.enum(["elements", "checkout"]).optional(),
});

export type CreateOrderDtoType = z.infer<typeof CreateOrderDto>;

// Update Order DTO
export const UpdateOrderDto = z.object({
  status: z.string().optional(),
  payment_intent_id: z.string().nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

export type UpdateOrderDtoType = z.infer<typeof UpdateOrderDto>;

// Order ID param DTO
export const OrderIdParamDto = z.object({
  id: z.coerce.number().int().positive(),
});

export type OrderIdParamDtoType = z.infer<typeof OrderIdParamDto>;

