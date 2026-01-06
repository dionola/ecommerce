import { Router } from "express";
import wishlistController from "../controllers/wishlistController";
import { validateRequestBody, validateRequestParams } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import {
  AddWishlistItemDto,
} from "../dtos/wishlistDto";
import { z } from "zod";

const router = Router();

/**
 * Get user's wishlist
 * Requires authentication
 */
router.get(
  "/",
  authenticate,
  wishlistController.getWishlist
);

/**
 * Add item to wishlist
 * Requires authentication
 */
router.post(
  "/items",
  authenticate,
  validateRequestBody(AddWishlistItemDto),
  wishlistController.addWishlistItem
);

/**
 * Remove item from wishlist
 * Requires authentication
 * productId is passed as path parameter
 */
const ProductIdParamDto = z.object({
  productId: z.coerce.number().int().positive(),
});

router.delete(
  "/items/:productId",
  authenticate,
  validateRequestParams(ProductIdParamDto),
  wishlistController.removeWishlistItem
);

/**
 * Clear wishlist
 * Requires authentication
 */
router.delete(
  "/clear",
  authenticate,
  wishlistController.clearWishlist
);

export default router;

