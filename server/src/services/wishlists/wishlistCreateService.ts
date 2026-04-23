import { query } from "../../models/databaseModel.js";
import { WishlistDtoType, AddWishlistItemDtoType } from "../../dtos/wishlistDto.js";
import { getOrCreateWishlist, checkWishlistItemExists, fetchWishlistByUserId } from "./wishlistHelpers.js";
import { getOrCreateUser } from "../users/userService.js";
import { checkProductExists } from "../products/productHelpers.js";
import { ValidationError } from "../../errors/ValidationError.js";

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




