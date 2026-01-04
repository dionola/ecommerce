import { WishlistDtoType } from "../../dtos/wishlistDto";
import { fetchWishlistByUserId, getUserIdByCognitoSub } from "./wishlistHelpers";

export async function getWishlist(cognitoSub: string): Promise<WishlistDtoType> {
  const userId = await getUserIdByCognitoSub(cognitoSub);
  return fetchWishlistByUserId(userId);
}

