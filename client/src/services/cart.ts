import apiRequest from './api';
import type { CartDtoType, AddCartItemDtoType, UpdateCartItemDtoType } from '../../types/cart';

export async function getCart(): Promise<CartDtoType> {
  return apiRequest<CartDtoType>('/carts');
}

export async function addCartItem(productId: number, quantity: number = 1): Promise<CartDtoType> {
  const body: AddCartItemDtoType = {
    product_id: productId,
    quantity,
  };
  
  return apiRequest<CartDtoType>('/carts/items', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateCartItem(itemId: number, quantity: number): Promise<CartDtoType> {
  const body: UpdateCartItemDtoType = {
    quantity,
  };
  
  return apiRequest<CartDtoType>(`/carts/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function removeCartItem(itemId: number): Promise<CartDtoType> {
  return apiRequest<CartDtoType>(`/carts/items/${itemId}`, {
    method: 'DELETE',
  });
}

export async function clearCart(): Promise<void> {
  return apiRequest<void>('/carts/clear', {
    method: 'DELETE',
  });
}

