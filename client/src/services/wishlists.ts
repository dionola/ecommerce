import { api } from './api';

export interface WishlistItem {
  product: {
    id: number;
    name: string;
    description: string | null;
    base_price: number;
    country_of_origin: string | null;
    stock_quantity: number;
    manufacturer_id: number | null;
    images: Array<{ id: number; url: string; is_main: boolean }>;
    statuses: string[];
  };
}

export interface Wishlist {
  id: number;
  user_id: number;
  items: WishlistItem[];
}

export async function getWishlist(): Promise<Wishlist> {
  const response = await api.get<Wishlist>('/wishlists');
  return response.data;
}

export async function addToWishlist(productId: number): Promise<Wishlist> {
  const response = await api.post<Wishlist>('/wishlists/items', { product_id: productId });
  return response.data;
}

export async function removeFromWishlist(productId: number): Promise<void> {
  await api.delete(`/wishlists/items/${productId}`);
}

