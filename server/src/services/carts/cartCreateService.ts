import { query } from "../../models/databaseModel.js";
import { CartDtoType, AddCartItemDtoType } from "../../dtos/cartDto.js";
import { getOrCreateCart, updateCartTimestamp, fetchCartByUserId, getCartItemByProductId, validateStock } from "./cartHelpers.js";
import { getOrCreateUser } from "../users/userService.js";
import { checkProductExists } from "../products/productHelpers.js";

export async function addCartItem(cognitoSub: string, email: string, data: AddCartItemDtoType): Promise<CartDtoType> {
  const userId = await getOrCreateUser(cognitoSub, email);
  const cartId = await getOrCreateCart(userId);
  
  // Check if product exists
  await checkProductExists(data.product_id);
  
  // Validate stock availability
  await validateStock(data.product_id, data.quantity);
  
  // Check if item already exists in cart
  const existingItem = await getCartItemByProductId(cartId, data.product_id);
  
  if (existingItem) {
    // Update quantity if item exists
    const newQuantity = existingItem.quantity + data.quantity;
    await validateStock(data.product_id, newQuantity);
    
    const updateItemQuery = `
      UPDATE cart_items
      SET quantity = $1
      WHERE id = $2
    `;
    await query(updateItemQuery, [newQuantity, existingItem.id]);
  } else {
    // Add new item to cart
    const insertItemQuery = `
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES ($1, $2, $3)
    `;
    await query(insertItemQuery, [cartId, data.product_id, data.quantity]);
  }
  
  // Update cart timestamp
  await updateCartTimestamp(cartId);
  
  return fetchCartByUserId(userId);
}

