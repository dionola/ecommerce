import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";

import * as wishlistService from "../services/wishlists/wishlistService";
import { 
  WishlistDtoType,
  AddWishlistItemDtoType,
  RemoveWishlistItemDtoType
} from "../dtos/wishlistDto";

async function getWishlist(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.sub || !req.user?.email) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const result = await wishlistService.getWishlist(req.user.sub, req.user.email);
    res.json(result);
}

async function addWishlistItem(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.sub || !req.user?.email) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const body = res.locals.body as AddWishlistItemDtoType;
    const result = await wishlistService.addWishlistItem(req.user.sub, req.user.email, body);
    res.status(201).json(result);
}

async function removeWishlistItem(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.sub || !req.user?.email) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const params = res.locals.params as { productId: number };
    const result = await wishlistService.removeWishlistItem(req.user.sub, req.user.email, params.productId);
    res.json(result);
}

async function clearWishlist(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.sub || !req.user?.email) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const result = await wishlistService.clearWishlist(req.user.sub, req.user.email);
    res.json(result);
}

export default { getWishlist, addWishlistItem, removeWishlistItem, clearWishlist };




