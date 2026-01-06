import { WishlistDtoType } from "../../dtos/wishlistDto";
import { fetchWishlistByUserId } from "./wishlistHelpers";
import { getOrCreateUser } from "../users/userService";

export async function getWishlist(cognitoSub: string, email: string): Promise<WishlistDtoType> {
  const userId = await getOrCreateUser(cognitoSub, email);
  return fetchWishlistByUserId(userId);
}




