import { CartDtoType } from "../../dtos/cartDto";
import { fetchCartByUserId } from "./cartHelpers";
import { getOrCreateUser } from "../users/userService";

export async function getCart(cognitoSub: string, email: string): Promise<CartDtoType> {
  const userId = await getOrCreateUser(cognitoSub, email);
  return fetchCartByUserId(userId);
}

