import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as cartService from '../services/cart';
import * as guestCartService from '../services/guestCart';
import { useAuth } from './AuthContext'
import { getProduct } from '../services/products';
import type { CartDtoType, CartItemDtoType, GuestCartType } from '../types/cart';
import { dismissToastsByTitle } from '../components/ui/toaster';

// Union type for cart - can be either authenticated cart or guest cart
type CartUnion = CartDtoType | (GuestCartType & { isGuest: true });

interface CartContextType {
  cart: CartUnion | null;
  loading: boolean;
  error: string | null;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartUnion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      // Load guest cart from localStorage
      const guestCart = guestCartService.getGuestCart();
      if (guestCart) {
        setCart({ ...guestCart, isGuest: true } as CartUnion);
      } else {
        setCart(null);
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (err: any) {
      setError(err.message || 'Failed to load cart');
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const mergeGuestCartToServer = async () => {
    const guestCart = guestCartService.getGuestCart();
    if (!guestCart || guestCart.items.length === 0) {
      return;
    }

    try {
      // Merge each guest cart item to server cart
      for (const item of guestCart.items) {
        try {
          await cartService.addCartItem(item.product_id, item.quantity);
        } catch (err) {
          console.error(`Failed to merge item ${item.product_id} to server cart:`, err);
          // Continue with other items even if one fails
        }
      }
      
      // Clear guest cart after successful merge
      guestCartService.clearGuestCart();
    } catch (err) {
      console.error('Error merging guest cart to server:', err);
      // Keep guest cart if merge fails
    }
  };

  // Initial load and when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      // When user logs in, merge guest cart first, then refresh server cart
      mergeGuestCartToServer().then(() => {
        refreshCart();
      });
    } else {
      // When user logs out, load guest cart
      refreshCart();
    }
  }, [isAuthenticated, refreshCart]);

  const addItem = async (productId: number, quantity: number = 1) => {
    if (!isAuthenticated) {
      // Guest cart: fetch product data first, then add to guest cart
      setLoading(true);
      setError(null);
      try {
        const product = await getProduct(productId);
        const updatedGuestCart = guestCartService.addGuestCartItem(product, quantity);
        setCart({ ...updatedGuestCart, isGuest: true } as CartUnion);
      } catch (err: any) {
        setError(err.message || 'Failed to add item to cart');
        throw err;
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updatedCart = await cartService.addCartItem(productId, quantity);
      setCart(updatedCart);
    } catch (err: any) {
      setError(err.message || 'Failed to add item to cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId: number, quantity: number) => {
    if (!isAuthenticated) {
      // Guest cart: use product_id (itemId) to update
      setLoading(true);
      setError(null);
      try {
        const updatedGuestCart = guestCartService.updateGuestCartItem(itemId, quantity);
        setCart({ ...updatedGuestCart, isGuest: true } as CartUnion);
      } catch (err: any) {
        setError(err.message || 'Failed to update cart item');
        throw err;
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updatedCart = await cartService.updateCartItem(itemId, quantity);
      setCart(updatedCart);
    } catch (err: any) {
      setError(err.message || 'Failed to update cart item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    if (!isAuthenticated) {
      // Guest cart: use product_id (itemId) to remove
      setLoading(true);
      setError(null);
      try {
        const updatedGuestCart = guestCartService.removeGuestCartItem(itemId);
        setCart({ ...updatedGuestCart, isGuest: true } as CartUnion);
      } catch (err: any) {
        setError(err.message || 'Failed to remove cart item');
        throw err;
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updatedCart = await cartService.removeCartItem(itemId);
      setCart(updatedCart);
    } catch (err: any) {
      setError(err.message || 'Failed to remove cart item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) {
      // Guest cart: clear localStorage
      setLoading(true);
      setError(null);
      try {
        guestCartService.clearGuestCart();
        setCart(null);
      } catch (err: any) {
        setError(err.message || 'Failed to clear cart');
        throw err;
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await cartService.clearCart();
      await refreshCart();
    } catch (err: any) {
      setError(err.message || 'Failed to clear cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cartCount = React.useMemo(() => {
    if (!cart) return 0;
    if ('isGuest' in cart && cart.isGuest) {
      // Guest cart
      return cart.items.reduce((sum, item) => sum + item.quantity, 0);
    } else {
      // Authenticated cart
      return (cart as CartDtoType).items.reduce((sum, item) => sum + item.quantity, 0);
    }
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        refreshCart,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

