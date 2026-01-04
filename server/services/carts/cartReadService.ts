import { CartDtoType } from "../../dtos/cartDto";
import { fetchCartByUserId } from "./cartHelpers";
import { getUserIdByCognitoSub } from "../wishlists/wishlistHelpers";

export async function getCart(cognitoSub: string): Promise<CartDtoType> {
  const userId = await getUserIdByCognitoSub(cognitoSub);
  return fetchCartByUserId(userId);
}

