import { query } from "../../models/databaseModel";
import { WishlistDtoType, AddWishlistItemDtoType } from "../../dtos/wishlistDto";
import { getOrCreateWishlist, checkWishlistItemExists, fetchWishlistByUserId } from "./wishlistHelpers";
import { getOrCreateUser } from "../users/userService";
import { checkProductExists } from "../products/productHelpers";
import { ValidationError } from "../../errors/ValidationError";

export async function addWishlistItem(cognitoSub: string, email: string, data: AddWishlistItemDtoType): Promise<WishlistDtoType> {
  const userId = await getOrCreateUser(cognitoSub, email);
  const wishlistId = await getOrCreateWishlist(userId);
  
  // Check if product exists
  await checkProductExists(data.product_id);
  
  // Check if item already exists in wishlist
  const itemExists = await checkWishlistItemExists(wishlistId, data.product_id);
  if (itemExists) {
    throw new ValidationError("Product already exists in wishlist");
  }
  
  // Add item to wishlist
  const insertItemQuery = `
    INSERT INTO wishlist_items (wishlist_id, product_id)
    VALUES ($1, $2)
  `;
  
  await query(insertItemQuery, [wishlistId, data.product_id]);
  
  return fetchWishlistByUserId(userId);
}




