import { query } from "../../models/databaseModel";
import { CartDtoType, UpdateCartItemDtoType } from "../../dtos/cartDto";
import { updateCartTimestamp, fetchCartByUserId, validateStock } from "./cartHelpers";
import { getUserIdByCognitoSub } from "../users/userService";
import { NotFoundError } from "../../errors/NotFoundError";

export async function updateCartItem(cognitoSub: string, itemId: number, data: UpdateCartItemDtoType): Promise<CartDtoType> {
  const userId = await getUserIdByCognitoSub(cognitoSub);
  
  // Get cart item and verify it belongs to user's cart
  const getItemQuery = `
    SELECT ci.id, ci.product_id, ci.cart_id
    FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.id
    WHERE ci.id = $1 AND c.user_id = $2
  `;
  const itemResult = await query(getItemQuery, [itemId, userId]);
  
  if (itemResult.rows.length === 0) {
    throw new NotFoundError(`Cart item with id ${itemId} not found`);
  }
  
  const productId = itemResult.rows[0].product_id;
  
  // Validate stock availability
  await validateStock(productId, data.quantity);
  
  // Update item quantity
  const updateItemQuery = `
    UPDATE cart_items
    SET quantity = $1
    WHERE id = $2
  `;
  await query(updateItemQuery, [data.quantity, itemId]);
  
  // Update cart timestamp
  const cartId = itemResult.rows[0].cart_id;
  await updateCartTimestamp(cartId);
  
  return fetchCartByUserId(userId);
}

