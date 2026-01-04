import { query } from "../../models/databaseModel";
import { WishlistDtoType, RemoveWishlistItemDtoType } from "../../dtos/wishlistDto";
import { getOrCreateWishlist, fetchWishlistByUserId, getUserIdByCognitoSub, checkWishlistItemExists } from "./wishlistHelpers";
import { NotFoundError } from "../../errors/NotFoundError";

export async function removeWishlistItem(cognitoSub: string, data: RemoveWishlistItemDtoType): Promise<WishlistDtoType> {
  const userId = await getUserIdByCognitoSub(cognitoSub);
  const wishlistId = await getOrCreateWishlist(userId);
  
  // Check if item exists
  const itemExists = await checkWishlistItemExists(wishlistId, data.product_id);
  if (!itemExists) {
    throw new NotFoundError(`Product with id ${data.product_id} not found in wishlist`);
  }
  
  // Remove item from wishlist
  const deleteItemQuery = `
    DELETE FROM wishlist_items
    WHERE wishlist_id = $1 AND product_id = $2
  `;
  
  await query(deleteItemQuery, [wishlistId, data.product_id]);
  
  return fetchWishlistByUserId(userId);
}

export async function clearWishlist(cognitoSub: string): Promise<WishlistDtoType> {
  const userId = await getUserIdByCognitoSub(cognitoSub);
  const wishlistId = await getOrCreateWishlist(userId);
  
  // Remove all items from wishlist
  const clearItemsQuery = `
    DELETE FROM wishlist_items
    WHERE wishlist_id = $1
  `;
  
  await query(clearItemsQuery, [wishlistId]);
  
  return fetchWishlistByUserId(userId);
}

