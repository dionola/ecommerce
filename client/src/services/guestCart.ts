import type { GuestCartType, GuestCartItemType } from '../types/cart';
import type { ProductDtoType } from '../types/product';

const GUEST_CART_KEY = 'guest_cart';

export function getGuestCart(): GuestCartType | null {
  try {
    const cartJson = localStorage.getItem(GUEST_CART_KEY);
    if (!cartJson) return null;
    
    const cart = JSON.parse(cartJson) as GuestCartType;
    return cart;
  } catch (error) {
    console.error('Error reading guest cart from localStorage:', error);
    return null;
  }
}

export function saveGuestCart(cart: GuestCartType): void {
  try {
    cart.updated_at = new Date().toISOString();
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving guest cart to localStorage:', error);
  }
}

export function addGuestCartItem(product: ProductDtoType, quantity: number): GuestCartType {
  const cart = getGuestCart() || { items: [], updated_at: new Date().toISOString() };
  
  const existingItemIndex = cart.items.findIndex(item => item.product_id === product.id);
  
  if (existingItemIndex >= 0) {
    // Update existing item quantity
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    const newItem: GuestCartItemType = {
      product_id: product.id,
      product,
      quantity,
    };
    cart.items.push(newItem);
  }
  
  saveGuestCart(cart);
  return cart;
}

export function updateGuestCartItem(productId: number, quantity: number): GuestCartType {
  const cart = getGuestCart();
  if (!cart) {
    throw new Error('Guest cart not found');
  }
  
  const itemIndex = cart.items.findIndex(item => item.product_id === productId);
  if (itemIndex < 0) {
    throw new Error('Item not found in guest cart');
  }
  
  if (quantity <= 0) {
    // Remove item if quantity is 0 or less
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }
  
  saveGuestCart(cart);
  return cart;
}

export function removeGuestCartItem(productId: number): GuestCartType {
  const cart = getGuestCart();
  if (!cart) {
    throw new Error('Guest cart not found');
  }
  
  const itemIndex = cart.items.findIndex(item => item.product_id === productId);
  if (itemIndex < 0) {
    throw new Error('Item not found in guest cart');
  }
  
  cart.items.splice(itemIndex, 1);
  saveGuestCart(cart);
  return cart;
}

export function clearGuestCart(): void {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch (error) {
    console.error('Error clearing guest cart from localStorage:', error);
  }
}

export function getGuestCartCount(): number {
  const cart = getGuestCart();
  if (!cart) return 0;
  
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

