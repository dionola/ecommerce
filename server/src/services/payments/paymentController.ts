import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.js";
import { paymentService } from "./paymentService.js";
import { StripeProcessor } from "./stripe/StripeProcessor.js";
import {
  CreatePaymentIntentDtoType,
  ConfirmPaymentDtoType,
  RefundPaymentDtoType,
  PaymentIntentIdParamDtoType,
  CreateCheckoutSessionDtoType,
} from "../../dtos/paymentDto.js";
import { query } from "../../models/databaseModel.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { getUserIdByCognitoSub } from "../users/userService.js";
import { fetchOrderById } from "../orders/orderHelpers.js";

/**
 * Create a payment intent for an order
 */
async function createPaymentIntent(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.sub) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const body = res.locals.body as CreatePaymentIntentDtoType;

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
  const userId = await getUserIdByCognitoSub(req.user.sub);

  // Verify order belongs to user (unless admin)
  const isAdmin = req.user["cognito:groups"]?.includes("admin") || req.user["cognito:groups"]?.includes("superadmin");
  if (!isAdmin && order.user_id !== userId) {
    res.status(403).json({ message: "Forbidden - Order does not belong to user" });
    return;
  }

  // Convert amount to cents (smallest currency unit)
  const amountInCents = Math.round(order.total_amount * 100);

  const currency = process.env.STRIPE_CURRENCY || "php";
  const paymentIntent = await paymentService.createPaymentIntent(
    {
      amount: amountInCents,
      currency,
      orderId: body.order_id,
      metadata: {
        user_id: userId.toString(),
      },
    },
    body.processor
  );

  // Update order with payment intent ID
  const updateOrderQuery = `
    UPDATE orders
    SET payment_intent_id = $1
    WHERE id = $2
  `;
  await query(updateOrderQuery, [paymentIntent.paymentIntentId, body.order_id]);

  res.status(201).json(paymentIntent);
}

/**
 * Confirm a payment
 */
async function confirmPayment(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.sub) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const body = res.locals.body as ConfirmPaymentDtoType;

  // Verify payment intent exists and get order info
  const orderQuery = `
    SELECT id, user_id, payment_intent_id
    FROM orders
    WHERE payment_intent_id = $1
  `;
  const orderResult = await query(orderQuery, [body.payment_intent_id]);

  if (orderResult.rows.length === 0) {
    throw new NotFoundError(`Payment intent ${body.payment_intent_id} not found`);
  }

  const order = orderResult.rows[0];

  // Get user ID from database
  const userId = await getUserIdByCognitoSub(req.user.sub);

  // Verify order belongs to user (unless admin)
  const isAdmin = req.user["cognito:groups"]?.includes("admin") || req.user["cognito:groups"]?.includes("superadmin");
  if (!isAdmin && order.user_id !== userId) {
    res.status(403).json({ message: "Forbidden - Order does not belong to user" });
    return;
  }

  const result = await paymentService.confirmPayment(
    {
      paymentIntentId: body.payment_intent_id,
      paymentMethodId: body.payment_method_id,
    },
    body.processor
  );

  // Update order status if payment succeeded
  if (result.status === "succeeded") {
    const updateOrderQuery = `
      UPDATE orders
      SET status = 'paid'
      WHERE id = $1
    `;
    await query(updateOrderQuery, [order.id]);
  }

  res.json(result);
}

/**
 * Get payment intent status
 */
async function getPaymentIntentStatus(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.sub) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const params = res.locals.params as PaymentIntentIdParamDtoType;
  const processor = req.query.processor as string | undefined;

  // Verify payment intent exists and get order info
  const orderQuery = `
    SELECT id, user_id
    FROM orders
    WHERE payment_intent_id = $1
  `;
  const orderResult = await query(orderQuery, [params.paymentIntentId]);

  if (orderResult.rows.length === 0) {
    throw new NotFoundError(`Payment intent ${params.paymentIntentId} not found`);
  }

  const order = orderResult.rows[0];

  // Get user ID from database
  const userId = await getUserIdByCognitoSub(req.user.sub);

  // Verify order belongs to user (unless admin)
  const isAdmin = req.user["cognito:groups"]?.includes("admin") || req.user["cognito:groups"]?.includes("superadmin");
  if (!isAdmin && order.user_id !== userId) {
    res.status(403).json({ message: "Forbidden - Order does not belong to user" });
    return;
  }

  const result = await paymentService.getPaymentIntentStatus(
    params.paymentIntentId,
    processor as any
  );

  res.json(result);
}

/**
 * Cancel a payment intent
 */
async function cancelPaymentIntent(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.sub) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const params = res.locals.params as PaymentIntentIdParamDtoType;
  const processor = req.query.processor as string | undefined;

  // Verify payment intent exists and get order info
  const orderQuery = `
    SELECT id, user_id, status
    FROM orders
    WHERE payment_intent_id = $1
  `;
  const orderResult = await query(orderQuery, [params.paymentIntentId]);

  if (orderResult.rows.length === 0) {
    throw new NotFoundError(`Payment intent ${params.paymentIntentId} not found`);
  }

  const order = orderResult.rows[0];

  // Get user ID from database
  const userId = await getUserIdByCognitoSub(req.user.sub);

  // Verify order belongs to user (unless admin)
  const isAdmin = req.user["cognito:groups"]?.includes("admin") || req.user["cognito:groups"]?.includes("superadmin");
  if (!isAdmin && order.user_id !== userId) {
    res.status(403).json({ message: "Forbidden - Order does not belong to user" });
    return;
  }

  const result = await paymentService.cancelPaymentIntent(
    params.paymentIntentId,
    processor as any
  );

  // Update order status if payment was canceled
  if (result.status === "canceled") {
    const updateOrderQuery = `
      UPDATE orders
      SET status = 'canceled'
      WHERE id = $1
    `;
    await query(updateOrderQuery, [order.id]);
  }

  res.json(result);
}

/**
 * Process a refund
 */
async function refundPayment(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.sub) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const body = res.locals.body as RefundPaymentDtoType;

  // Verify payment intent exists and get order info
  const orderQuery = `
    SELECT id, user_id, total_amount
    FROM orders
    WHERE payment_intent_id = $1
  `;
  const orderResult = await query(orderQuery, [body.payment_intent_id]);

  if (orderResult.rows.length === 0) {
    throw new NotFoundError(`Payment intent ${body.payment_intent_id} not found`);
  }

  const order = orderResult.rows[0];

  // Get user ID from database
  const userId = await getUserIdByCognitoSub(req.user.sub);

  // Verify order belongs to user (unless admin)
  const isAdmin = req.user["cognito:groups"]?.includes("admin") || req.user["cognito:groups"]?.includes("superadmin");
  if (!isAdmin && order.user_id !== userId) {
    res.status(403).json({ message: "Forbidden - Order does not belong to user" });
    return;
  }

  // Convert amount to cents if provided
  const amountInCents = body.amount ? Math.round(body.amount * 100) : undefined;

  const result = await paymentService.refund(
    {
      paymentIntentId: body.payment_intent_id,
      amount: amountInCents,
      reason: body.reason,
    },
    body.processor
  );

  // Update order status if refund succeeded
  if (result.status === "succeeded") {
    const updateOrderQuery = `
      UPDATE orders
      SET status = 'refunded'
      WHERE id = $1
    `;
    await query(updateOrderQuery, [order.id]);
  }

  res.json(result);
}

/**
 * Create a Stripe Checkout session
 */
async function createCheckoutSession(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.sub) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const body = res.locals.body as CreateCheckoutSessionDtoType;

  // Verify order exists and belongs to user
  const orderQuery = `
    SELECT id, user_id, total_amount, status
    FROM orders
    WHERE id = $1
  `;
  const orderResult = await query(orderQuery, [body.order_id]);

  if (orderResult.rows.length === 0) {
    throw new NotFoundError(`Order with id ${body.order_id} not found`);
  }

  const order = orderResult.rows[0];

  // Get user ID from database
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

  // Create checkout session
  const checkoutSession = await stripeProcessor.createCheckoutSession({
    currency: process.env.STRIPE_CURRENCY || "php",
    success_url: successUrl,
    cancel_url: cancelUrl,
    orderId: body.order_id,
    lineItems,
    metadata: {
      user_id: userId.toString(),
    },
  });

  res.status(201).json(checkoutSession);
}

export default {
  createPaymentIntent,
  confirmPayment,
  getPaymentIntentStatus,
  cancelPaymentIntent,
  refundPayment,
  createCheckoutSession,
};

