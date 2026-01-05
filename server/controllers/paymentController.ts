import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { paymentService } from "../services/payments/paymentService";
import {
  CreatePaymentIntentDtoType,
  ConfirmPaymentDtoType,
  RefundPaymentDtoType,
  PaymentIntentIdParamDtoType,
} from "../dtos/paymentDto";
import { query } from "../models/databaseModel";
import { NotFoundError } from "../errors/NotFoundError";

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
  const { getUserIdByCognitoSub } = await import("../wishlists/wishlistHelpers");
  const userId = await getUserIdByCognitoSub(req.user.sub);

  // Verify order belongs to user (unless admin)
  const isAdmin = req.user["cognito:groups"]?.includes("admin") || req.user["cognito:groups"]?.includes("superadmin");
  if (!isAdmin && order.user_id !== userId) {
    res.status(403).json({ message: "Forbidden - Order does not belong to user" });
    return;
  }

  // Convert amount to cents (smallest currency unit)
  const amountInCents = Math.round(order.total_amount * 100);

  const paymentIntent = await paymentService.createPaymentIntent(
    {
      amount: amountInCents,
      currency: "usd", // TODO: Make this configurable
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
    SET stripe_payment_intent_id = $1
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
    SELECT id, user_id, stripe_payment_intent_id
    FROM orders
    WHERE stripe_payment_intent_id = $1
  `;
  const orderResult = await query(orderQuery, [body.payment_intent_id]);

  if (orderResult.rows.length === 0) {
    throw new NotFoundError(`Payment intent ${body.payment_intent_id} not found`);
  }

  const order = orderResult.rows[0];

  // Get user ID from database
  const { getUserIdByCognitoSub } = await import("../wishlists/wishlistHelpers");
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
    WHERE stripe_payment_intent_id = $1
  `;
  const orderResult = await query(orderQuery, [params.paymentIntentId]);

  if (orderResult.rows.length === 0) {
    throw new NotFoundError(`Payment intent ${params.paymentIntentId} not found`);
  }

  const order = orderResult.rows[0];

  // Get user ID from database
  const { getUserIdByCognitoSub } = await import("../wishlists/wishlistHelpers");
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
    WHERE stripe_payment_intent_id = $1
  `;
  const orderResult = await query(orderQuery, [params.paymentIntentId]);

  if (orderResult.rows.length === 0) {
    throw new NotFoundError(`Payment intent ${params.paymentIntentId} not found`);
  }

  const order = orderResult.rows[0];

  // Get user ID from database
  const { getUserIdByCognitoSub } = await import("../wishlists/wishlistHelpers");
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
    WHERE stripe_payment_intent_id = $1
  `;
  const orderResult = await query(orderQuery, [body.payment_intent_id]);

  if (orderResult.rows.length === 0) {
    throw new NotFoundError(`Payment intent ${body.payment_intent_id} not found`);
  }

  const order = orderResult.rows[0];

  // Get user ID from database
  const { getUserIdByCognitoSub } = await import("../wishlists/wishlistHelpers");
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

export default {
  createPaymentIntent,
  confirmPayment,
  getPaymentIntentStatus,
  cancelPaymentIntent,
  refundPayment,
};

