import type { ProductDtoType } from './product';

export interface CartItemDtoType {
  id: number;
  product: ProductDtoType;
  quantity: number;
}

export interface CartDtoType {
  id: number;
  user_id: number;
  updated_at: string;
  items: CartItemDtoType[];
  subtotal: number;
  total: number;
}

export interface GuestCartItemType {
  product_id: number;
  product: ProductDtoType; // Full product data for display
  quantity: number;
}

export interface GuestCartType {
  items: GuestCartItemType[];
  updated_at: string;
}

export interface AddCartItemDtoType {
  product_id: number;
  quantity: number;
}

export interface UpdateCartItemDtoType {
  quantity: number;
}

