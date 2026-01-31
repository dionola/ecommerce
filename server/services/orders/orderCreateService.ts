import { query } from "../../models/databaseModel";
import { OrderDtoType, CreateOrderDtoType } from "../../dtos/orderDto";
import { getOrCreateUser } from "../users/userService";
import { fetchCartByUserId } from "../carts/cartHelpers";
import { clearCart } from "../carts/cartService";
import { validateCartStock, applyPromoDiscount } from "./orderHelpers";
import { ValidationError } from "../../errors/ValidationError";
import { fetchOrderById } from "./orderHelpers";
import { CartItemDtoType } from "../../dtos/cartDto";
import { paymentService } from "../payments/paymentService";

export async function createOrder(cognitoSub: string, email: string, data: CreateOrderDtoType): Promise<OrderDtoType> {
  const userId = await getOrCreateUser(cognitoSub, email);
  
  // Get user's cart
  const cart = await fetchCartByUserId(userId);
  
  // Log cart details for debugging
  const { logger } = await import("../../utils/logger");
  logger.info("Order creation - cart check", {
    userId,
    cognitoSub,
    email,
    cartItemsCount: cart.items.length,
    cartId: cart.id,
    cartItems: cart.items.map(item => ({
      productId: item.product?.id,
      quantity: item.quantity,
      productName: item.product?.name,
    })),
  });
  
  if (cart.items.length === 0) {
    logger.warn("Order creation failed - empty cart", {
      userId,
      cognitoSub,
      email,
      cartId: cart.id,
    });
    throw new ValidationError("Cannot create order from empty cart. Please add items to your cart before checkout.");
  }
  
  // Validate stock for all items
  await validateCartStock(cart);
  
  // Calculate totals with promo (supports both promo_id and promo_code)
  const promoResult = await applyPromoDiscount(
    cart.subtotal, 
    data.promo_id ?? null,
    data.promo_code ?? null
  );
  
  const { total, promoId } = promoResult;
  
  // Determine initial order status
  const initialStatus = "pending";
  
  // Start transaction by creating order
  const insertOrderQuery = `
    INSERT INTO orders (user_id, total_amount, status, promo_id, shipping_address)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;
  
  const orderResult = await query(insertOrderQuery, [
    userId,
    total,
    initialStatus,
    promoId,
    JSON.stringify(data.shipping_address || {}),
  ]);
  
  const orderId = orderResult.rows[0].id;
  
  // Create payment intent if requested and total > 0
  let paymentIntentId: string | null = null;
  if (data.create_payment_intent && total > 0) {
    try {
      const amountInCents = Math.round(total * 100);
      const paymentIntent = await paymentService.createPaymentIntent(
        {
          amount: amountInCents,
          currency: "usd", // TODO: Make this configurable
          orderId,
          metadata: {
            user_id: userId.toString(),
          },
        },
        data.payment_processor
      );
      
      paymentIntentId = paymentIntent.paymentIntentId;
      
      // Update order with payment intent ID
      const updateOrderQuery = `
        UPDATE orders
        SET payment_intent_id = $1
        WHERE id = $2
      `;
      await query(updateOrderQuery, [paymentIntentId, orderId]);
    } catch (error: any) {
      // Log error but don't fail order creation
      // Payment intent can be created later
      const { logger } = await import("../../utils/logger");
      logger.error("Failed to create payment intent during order creation", error);
    }
  }
  
  // Insert order items with price snapshots
  if (cart.items.length === 0) {
    throw new ValidationError("Cannot create order from empty cart");
  }
  
  const itemValues = cart.items.map((item: CartItemDtoType, index: number) => {
    const baseIndex = index * 4;
    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`;
  }).join(", ");
  
  const insertItemsQuery = `
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES ${itemValues}
  `;
  
  const itemParams: any[] = [];
  cart.items.forEach((item: CartItemDtoType) => {
    if (!item.product || !item.product.id || item.quantity <= 0) {
      throw new ValidationError(`Invalid cart item: missing product or invalid quantity`);
    }
    itemParams.push(orderId, item.product.id, item.quantity, item.product.base_price);
  });
  
  try {
    await query(insertItemsQuery, itemParams);
  } catch (error: any) {
    const { logger } = await import("../../utils/logger");
    logger.error("Failed to insert order items:", {
      error: error.message,
      stack: error.stack,
      query: insertItemsQuery,
      params: itemParams,
      items: cart.items,
    });
    throw new ValidationError(`Failed to create order items: ${error.message}`);
  }
  
  // Update product stock quantities
  for (const item of cart.items) {
    const updateStockQuery = `
      UPDATE products
      SET stock_quantity = stock_quantity - $1
      WHERE id = $2
    `;
    await query(updateStockQuery, [item.quantity, item.product.id]);
  }
  
  // Only clear cart if order is free (total = 0) and doesn't require payment
  // For orders requiring payment, cart will be cleared after successful payment confirmation
  if (total === 0) {
    await clearCart(cognitoSub, email);
  }
  
  return fetchOrderById(orderId, userId);
}

