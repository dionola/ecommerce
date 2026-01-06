import { z } from "zod";
import { ProductDto } from "./productDto";

export const WishlistItemDto = z.object({
  product: ProductDto,
});

export type WishlistItemDtoType = z.infer<typeof WishlistItemDto>;

export const WishlistDto = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  items: z.array(WishlistItemDto).default([]),
});

export type WishlistDtoType = z.infer<typeof WishlistDto>;

// Add wishlist item DTO
export const AddWishlistItemDto = z.object({
  product_id: z.coerce.number().int().positive(),
});

export type AddWishlistItemDtoType = z.infer<typeof AddWishlistItemDto>;

// Remove wishlist item DTO
export const RemoveWishlistItemDto = z.object({
  product_id: z.coerce.number().int().positive(),
});

export type RemoveWishlistItemDtoType = z.infer<typeof RemoveWishlistItemDto>;




