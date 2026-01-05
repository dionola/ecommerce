import { Router } from "express";
import cartController from "../controllers/cartController";
import { validateRequestQuery, validateRequestBody, validateRequestParams } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { 
  AddCartItemDto,
  UpdateCartItemDto,
  CartItemIdParamDto
} from "../dtos/cartDto";

const router = Router();

router.get(
  "/",
  authenticate,
  cartController.getCart
);

router.post(
  "/items",
  authenticate,
  validateRequestBody(AddCartItemDto),
  cartController.addCartItem
);

router.patch(
  "/items/:itemId",
  authenticate,
  validateRequestParams(CartItemIdParamDto),
  validateRequestBody(UpdateCartItemDto),
  cartController.updateCartItem
);

router.delete(
  "/items/:itemId",
  authenticate,
  validateRequestParams(CartItemIdParamDto),
  cartController.removeCartItem
);

router.delete(
  "/clear",
  authenticate,
  cartController.clearCart
);

export default router;

