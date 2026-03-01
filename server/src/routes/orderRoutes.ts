import { Router } from "express";
import orderController from "../controllers/orderController";
import { validateRequestQuery, validateRequestBody, validateRequestParams } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import {
  GetOrdersQueryParamsDto,
  CreateOrderDto,
  UpdateOrderDto,
  OrderIdParamDto,
} from "../dtos/orderDto";

const router = Router();

/**
 * List orders
 * Authenticated users see their own orders
 * Admins can see all orders (can filter by user_id)
 */
router.get(
  "/",
  authenticate,
  validateRequestQuery(GetOrdersQueryParamsDto),
  orderController.getOrders
);

/**
 * Get order by ID
 * Authenticated users can see their own orders
 * Admins can see any order
 */
router.get(
  "/:id",
  authenticate,
  validateRequestParams(OrderIdParamDto),
  orderController.getOrderById
);

/**
 * Create order
 * Authenticated users can create orders from their cart
 */
router.post(
  "/",
  authenticate,
  validateRequestBody(CreateOrderDto),
  orderController.createOrder
);

/**
 * Update order
 * Authenticated users can update their own orders
 * Admins can update any order
 */
router.patch(
  "/:id",
  authenticate,
  validateRequestParams(OrderIdParamDto),
  validateRequestBody(UpdateOrderDto),
  orderController.updateOrder
);

/**
 * Delete order
 * Admin-only, only pending orders can be deleted
 */
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestParams(OrderIdParamDto),
  orderController.deleteOrder
);

export default router;

