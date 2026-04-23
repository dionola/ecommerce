import { WishlistDtoType } from "../../dtos/wishlistDto.js";
import { fetchWishlistByUserId } from "./wishlistHelpers.js";
import { getOrCreateUser } from "../users/userService.js";

export async function getWishlist(cognitoSub: string, email: string): Promise<WishlistDtoType> {
  const userId = await getOrCreateUser(cognitoSub, email);
  return fetchWishlistByUserId(userId);
}




