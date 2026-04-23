import { query } from "../../models/databaseModel.js";
import { WishlistDtoType } from "../../dtos/wishlistDto.js";
import { getOrCreateWishlist, fetchWishlistByUserId, checkWishlistItemExists } from "./wishlistHelpers.js";
import { getOrCreateUser } from "../users/userService.js";
import { NotFoundError } from "../../errors/NotFoundError.js";

export async function removeWishlistItem(cognitoSub: string, email: string, productId: number): Promise<WishlistDtoType> {
  const userId = await getOrCreateUser(cognitoSub, email);
  const wishlistId = await getOrCreateWishlist(userId);
  
  // Check if item exists
  const itemExists = await checkWishlistItemExists(wishlistId, productId);
  if (!itemExists) {
    throw new NotFoundError(`Product with id ${productId} not found in wishlist`);
  }
  
  // Remove item from wishlist
  const deleteItemQuery = `
    DELETE FROM wishlist_items
    WHERE wishlist_id = $1 AND product_id = $2
  `;
  
  await query(deleteItemQuery, [wishlistId, productId]);
  
  return fetchWishlistByUserId(userId);
}

export async function clearWishlist(cognitoSub: string, email: string): Promise<WishlistDtoType> {
  const userId = await getOrCreateUser(cognitoSub, email);
  const wishlistId = await getOrCreateWishlist(userId);
  
  // Remove all items from wishlist
  const clearItemsQuery = `
    DELETE FROM wishlist_items
    WHERE wishlist_id = $1
  `;
  
  await query(clearItemsQuery, [wishlistId]);
  
  return fetchWishlistByUserId(userId);
}




