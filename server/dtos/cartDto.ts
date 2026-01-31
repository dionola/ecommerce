import { z } from "zod";
import { ProductDto } from "./productDto";

export const CartItemDto = z.object({
  id: z.number().int().positive(),
  product: ProductDto,
  quantity: z.number().int().positive(),
});

export type CartItemDtoType = z.infer<typeof CartItemDto>;

export const CartDto = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  updated_at: z.coerce.date(),
  items: z.array(CartItemDto).default([]),
  subtotal: z.coerce.number().nonnegative(),
  total: z.coerce.number().nonnegative(),
});

export type CartDtoType = z.infer<typeof CartDto>;

// Add cart item DTO
export const AddCartItemDto = z.object({
  product_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().default(1),
});

export type AddCartItemDtoType = z.infer<typeof AddCartItemDto>;

// Update cart item DTO
export const UpdateCartItemDto = z.object({
  quantity: z.coerce.number().int().positive(),
});

export type UpdateCartItemDtoType = z.infer<typeof UpdateCartItemDto>;

// Cart item ID param DTO
export const CartItemIdParamDto = z.object({
  itemId: z.coerce.number().int().positive(),
});

export type CartItemIdParamDtoType = z.infer<typeof CartItemIdParamDto>;










