import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { paymentService } from "../services/payments/paymentService.js";
import { StripeProcessor } from "../services/payments/stripe/StripeProcessor.js";
import { updateOrder } from "../services/orders/orderService.js";
import { clearCart } from "../services/carts/cartService.js";
import {
  CreateCheckoutSessionDtoType,
} from "../dtos/paymentDto.js";
import { query } from "../models/databaseModel.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { logger } from "../utils/logger.js";
import { fetchOrderById } from "../services/orders/orderHelpers.js";

/**
 * Create a Stripe Checkout session
 */
async function createCheckoutSession(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.sub) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!paymentService.hasProcessor("stripe")) {
    res.status(503).json({ message: "Payments are currently unavailable" });
    return;
  }

  const body = res.locals.body as CreateCheckoutSessionDtoType;

  // Verify order exists and belongs to user
  const orderQuery = `
    SELECT id, user_id, status
    FROM orders
    WHERE id = $1
  `;
  const orderResult = await query(orderQuery, [body.order_id]);

  if (orderResult.rows.length === 0) {
    throw new NotFoundError(`Order with id ${body.order_id} not found`);
  }

  const order = orderResult.rows[0];

  // Get user ID from database
  const { getUserIdByCognitoSub } = await import("../services/users/userService.js");
  const userId = await getUserIdByCognitoSub(req.user.sub);

  // Verify order belongs to user (unless admin)
  const isAdmin = req.user["cognito:groups"]?.includes("admin") || req.user["cognito:groups"]?.includes("superadmin");
  if (!isAdmin && order.user_id !== userId) {
    res.status(403).json({ message: "Forbidden - Order does not belong to user" });
    return;
  }

  // Get Stripe processor instance
  const stripeProcessor = paymentService.getProcessorInstance("stripe") as StripeProcessor;
  if (!stripeProcessor) {
    throw new Error("Stripe processor not available");
  }

  const fullOrder = await fetchOrderById(order.id, isAdmin ? undefined : userId);
  const lineItems = fullOrder.items.map((item) => ({
    name: item.product.name,
    unitAmount: Math.round(item.price_at_purchase * 100),
    quantity: item.quantity,
    imageUrl: item.product.images?.find((image) => image.is_main)?.url || item.product.images?.[0]?.url,
  }));

  if (lineItems.length === 0) {
    throw new Error(`Order ${order.id} has no items for checkout`);
  }

  // Determine success and cancel URLs
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const successUrl = body.success_url || `${baseUrl}/checkout/return?order_id=${body.order_id}&status=success`;
  const cancelUrl = body.cancel_url || `${baseUrl}/checkout?order_id=${body.order_id}&status=canceled`;

  const currency = process.env.STRIPE_CURRENCY || "php";
  // Create checkout session
  const checkoutSession = await stripeProcessor.createCheckoutSession({
    currency,
    success_url: successUrl,
    cancel_url: cancelUrl,
    orderId: order.id,
    lineItems,
    metadata: {
      user_id: userId.toString(),
    },
  });

  res.status(201).json(checkoutSession);
}

/**
 * Verify a Stripe Checkout session
 */
async function verifyCheckoutSession(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!paymentService.hasProcessor("stripe")) {
    return res.status(503).json({ error: "Payments are currently unavailable" });
  }

  const sessionId = req.params.sessionId;

  if (typeof sessionId !== "string" || !sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  try {
    // Get Stripe processor instance
    const stripeProcessor = paymentService.getProcessorInstance("stripe") as StripeProcessor;
    if (!stripeProcessor) {
      throw new Error("Stripe processor not available");
    }

    const result = await stripeProcessor.verifyCheckoutSession(sessionId);

    // If payment was successful
    if (result.status === 'paid' || result.status === 'complete') {
      if (result.orderId) {
        // Verify order belongs to user
        const orderQuery = `
          SELECT user_id
          FROM orders
          WHERE id = $1
        `;
        const orderResult = await query(orderQuery, [result.orderId]);

        if (orderResult.rows.length === 0) {
          throw new NotFoundError(`Order with id ${result.orderId} not found`);
        }

        const { getUserIdByCognitoSub } = await import("../services/users/userService.js");
        const userId = await getUserIdByCognitoSub(req.user.sub);

        if (orderResult.rows[0].user_id !== userId) {
          return res.status(403).json({ error: "Forbidden - Order does not belong to user" });
        }

        // Update order status to 'paid'
        const { updateOrder } = await import("../services/orders/orderService.js");
        await updateOrder(result.orderId, {
          status: 'paid',
          ...(result.paymentIntentId ? { payment_intent_id: result.paymentIntentId } : {})
        });

        // Clear cart
        const { clearCart } = await import("../services/carts/cartService.js");
        await clearCart(req.user.sub, req.user.email);
      } else {
        logger.warn("verifyCheckoutSession: session verified but no orderId found", { sessionId });
      }

      return res.status(200).json({
        status: 'success',
        orderId: result.orderId,
        message: 'Payment verified successfully'
      });
    } else {
      return res.status(400).json({
        status: 'failed',
        message: `Payment status is ${result.status}`
      });
    }
  } catch (error: any) {
    logger.error("Verify Checkout Session Error", { error: error?.message, sessionId });
    return res.status(500).json({ error: error.message || "Failed to verify checkout session" });
  }
}

export default {
  createCheckoutSession,
  verifyCheckoutSession,
};
