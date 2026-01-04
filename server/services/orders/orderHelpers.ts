import { query } from "../../models/databaseModel";
import { OrderDto, OrderDtoType } from "../../dtos/orderDto";
import { validateDto } from "../../utils/validateDto";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";
import { getUserIdByCognitoSub } from "../wishlists/wishlistHelpers";
import { fetchCartByUserId } from "../carts/cartHelpers";
import { CartDtoType } from "../../dtos/cartDto";

/**
 * Validates and applies promo code to calculate discount
 */
export async function applyPromoDiscount(subtotal: number, promoId: number | null): Promise<{ discount: number; total: number; promoId: number | null }> {
  if (!promoId) {
    return { discount: 0, total: subtotal, promoId: null };
  }
  
  const promoQuery = `
    SELECT discount_type, discount_value, active_until
    FROM promos
    WHERE id = $1
  `;
  const promoResult = await query(promoQuery, [promoId]);
  
  if (promoResult.rows.length === 0) {
    throw new NotFoundError(`Promo with id ${promoId} not found`);
  }
  
  const promo = promoResult.rows[0];
  
  // Check if promo is still active
  if (promo.active_until && new Date(promo.active_until) < new Date()) {
    throw new ValidationError("Promo code has expired");
  }
  
  let discount = 0;
  
  if (promo.discount_type === "percentage") {
    discount = subtotal * (promo.discount_value / 100);
  } else if (promo.discount_type === "fixed") {
    discount = promo.discount_value;
  }
  
  // Ensure discount doesn't exceed subtotal
  if (discount > subtotal) {
    discount = subtotal;
  }
  
  const total = subtotal - discount;
  
  return { discount, total, promoId };
}

/**
 * Validates all cart items have sufficient stock
 */
export async function validateCartStock(cart: CartDtoType): Promise<void> {
  for (const item of cart.items) {
    const stockQuery = `
      SELECT stock_quantity FROM products WHERE id = $1
    `;
    const stockResult = await query(stockQuery, [item.product.id]);
    
    if (stockResult.rows.length === 0) {
      throw new NotFoundError(`Product with id ${item.product.id} not found`);
    }
    
    const availableStock = stockResult.rows[0].stock_quantity;
    
    if (availableStock < item.quantity) {
      throw new ValidationError(`Insufficient stock for product ${item.product.name}. Available: ${availableStock}, Requested: ${item.quantity}`);
    }
  }
}

/**
 * Fetches an order by ID with items
 */
export async function fetchOrderById(orderId: number, userId?: number): Promise<OrderDtoType> {
  let whereClause = "WHERE o.id = $1";
  const params: any[] = [orderId];
  
  // If userId is provided, ensure order belongs to user (for non-admin access)
  if (userId !== undefined) {
    whereClause += " AND o.user_id = $2";
    params.push(userId);
  }
  
  const orderQuery = `
    SELECT 
      o.id,
      o.user_id,
      o.total_amount,
      o.status,
      o.promo_id,
      o.stripe_payment_intent_id,
      o.shipping_address,
      o.created_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', oi.id,
            'product', json_build_object(
              'id', p.id,
              'name', p.name,
              'description', p.description,
              'base_price', p.base_price,
              'country_of_origin', p.country_of_origin,
              'stock_quantity', p.stock_quantity,
              'manufacturer_id', p.manufacturer_id,
              'images', COALESCE(
                json_agg(
                  json_build_object(
                    'id', pi.id,
                    'url', pi.url,
                    'is_main', pi.is_main
                  ) ORDER BY pi.is_main DESC, pi.id
                ) FILTER (WHERE pi.id IS NOT NULL),
                '[]'::json
              )
            ),
            'quantity', oi.quantity,
            'price_at_purchase', oi.price_at_purchase
          )
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'::json
      ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN product_images pi ON p.id = pi.product_id
    ${whereClause}
    GROUP BY o.id, o.user_id, o.total_amount, o.status, o.promo_id, o.stripe_payment_intent_id, o.shipping_address, o.created_at
  `;
  
  const result = await query(orderQuery, params);
  
  if (result.rows.length === 0) {
    throw new NotFoundError(`Order with id ${orderId} not found`);
  }
  
  // Transform the nested structure
  const orderData = result.rows[0];
  const items = orderData.items || [];
  
  const transformedOrder = {
    id: orderData.id,
    user_id: orderData.user_id,
    total_amount: orderData.total_amount,
    status: orderData.status,
    promo_id: orderData.promo_id,
    stripe_payment_intent_id: orderData.stripe_payment_intent_id,
    shipping_address: orderData.shipping_address,
    created_at: orderData.created_at,
    items: items.map((item: any) => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
    })),
  };
  
  return validateDto(OrderDto, transformedOrder, "Failed to validate order data");
}

/**
 * Checks if an order exists
 */
export async function checkOrderExists(orderId: number): Promise<void> {
  const checkQuery = `SELECT id FROM orders WHERE id = $1`;
  const result = await query(checkQuery, [orderId]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError(`Order with id ${orderId} not found`);
  }
}

