import { query } from "../../models/databaseModel";
import { CartDtoType } from "../../dtos/cartDto";
import { updateCartTimestamp, fetchCartByUserId } from "./cartHelpers";
import { getOrCreateUser } from "../users/userService";
import { NotFoundError } from "../../errors/NotFoundError";

export async function removeCartItem(cognitoSub: string, itemId: number, email?: string): Promise<CartDtoType> {
  const userId = await getOrCreateUser(cognitoSub, email || "unknown@example.com");
  
  // Get cart item and verify it belongs to user's cart
  const getItemQuery = `
    SELECT ci.id, ci.cart_id
    FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.id
    WHERE ci.id = $1 AND c.user_id = $2
  `;
  const itemResult = await query(getItemQuery, [itemId, userId]);
  
  if (itemResult.rows.length === 0) {
    throw new NotFoundError(`Cart item with id ${itemId} not found`);
  }
  
  // Remove item from cart
  const deleteItemQuery = `
    DELETE FROM cart_items WHERE id = $1
  `;
  await query(deleteItemQuery, [itemId]);
  
  // Update cart timestamp
  const cartId = itemResult.rows[0].cart_id;
  await updateCartTimestamp(cartId);
  
  return fetchCartByUserId(userId);
}

export async function clearCart(cognitoSub: string, email?: string): Promise<CartDtoType> {
  const userId = await getOrCreateUser(cognitoSub, email || "unknown@example.com");
  
  // Get user's cart
  const getCartQuery = `
    SELECT id FROM carts WHERE user_id = $1
  `;
  const cartResult = await query(getCartQuery, [userId]);
  
  if (cartResult.rows.length === 0) {
    // Return empty cart structure
    return fetchCartByUserId(userId);
  }
  
  const cartId = cartResult.rows[0].id;
  
  // Remove all items from cart
  const clearItemsQuery = `
    DELETE FROM cart_items WHERE cart_id = $1
  `;
  await query(clearItemsQuery, [cartId]);
  
  // Update cart timestamp
  await updateCartTimestamp(cartId);
  
  return fetchCartByUserId(userId);
}

