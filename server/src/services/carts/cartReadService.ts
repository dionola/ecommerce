import { CartDtoType } from "../../dtos/cartDto.js";
import { fetchCartByUserId } from "./cartHelpers.js";
import { getOrCreateUser } from "../users/userService.js";

export async function getCart(cognitoSub: string, email: string): Promise<CartDtoType> {
  const userId = await getOrCreateUser(cognitoSub, email);
  return fetchCartByUserId(userId);
}

