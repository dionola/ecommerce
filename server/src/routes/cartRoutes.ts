import { Router } from "express";
import cartController from "../controllers/cartController";
import {
  AddCartItemDto,
  CartItemIdParamDto,
  UpdateCartItemDto,
} from "../dtos/cartDto";
import { authenticate } from "../middleware/auth";
import { validateRequestBody, validateRequestParams } from "../middleware/validate";

const router = Router();

router.get("/", authenticate, cartController.getCart);

router.post(
  "/items",
  authenticate,
  validateRequestBody(AddCartItemDto),
  cartController.addCartItem,
);

router.patch(
  "/items/:itemId",
  authenticate,
  validateRequestParams(CartItemIdParamDto),
  validateRequestBody(UpdateCartItemDto),
  cartController.updateCartItem,
);

router.delete(
  "/items/:itemId",
  authenticate,
  validateRequestParams(CartItemIdParamDto),
  cartController.removeCartItem,
);

router.delete("/clear", authenticate, cartController.clearCart);

export default router;
