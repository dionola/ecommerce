import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";

import * as cartService from "../services/carts/cartService";
import { 
  CartDtoType,
  AddCartItemDtoType,
  UpdateCartItemDtoType,
  CartItemIdParamDtoType
} from "../dtos/cartDto";

async function getCart(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.sub) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const result = await cartService.getCart(req.user.sub);
    res.json(result);
}

async function addCartItem(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.sub) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const body = res.locals.body as AddCartItemDtoType;
    const result = await cartService.addCartItem(req.user.sub, body);
    res.status(201).json(result);
}

async function updateCartItem(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.sub) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const params = res.locals.params as CartItemIdParamDtoType;
    const body = res.locals.body as UpdateCartItemDtoType;
    const result = await cartService.updateCartItem(req.user.sub, params.itemId, body);
    res.json(result);
}

async function removeCartItem(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.sub) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const params = res.locals.params as CartItemIdParamDtoType;
    const result = await cartService.removeCartItem(req.user.sub, params.itemId);
    res.json(result);
}

async function clearCart(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.sub) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const result = await cartService.clearCart(req.user.sub);
    res.json(result);
}

export default { getCart, addCartItem, updateCartItem, removeCartItem, clearCart };



