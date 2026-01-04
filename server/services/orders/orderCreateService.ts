import { query } from "../../models/databaseModel";
import { OrderDtoType, CreateOrderDtoType } from "../../dtos/orderDto";
import { getUserIdByCognitoSub } from "../wishlists/wishlistHelpers";
import { fetchCartByUserId } from "../carts/cartHelpers";
import { clearCart } from "../carts/cartService";
import { validateCartStock, applyPromoDiscount } from "./orderHelpers";
import { ValidationError } from "../../errors/ValidationError";
import { fetchOrderById } from "./orderHelpers";
import { CartItemDtoType } from "../../dtos/cartDto";

export async function createOrder(cognitoSub: string, data: CreateOrderDtoType): Promise<OrderDtoType> {
  const userId = await getUserIdByCognitoSub(cognitoSub);
  
  // Get user's cart
  const cart = await fetchCartByUserId(userId);
  
  if (cart.items.length === 0) {
    throw new ValidationError("Cannot create order from empty cart");
  }
  
  // Validate stock for all items
  await validateCartStock(cart);
  
  // Calculate totals with promo
  const { total, promoId } = await applyPromoDiscount(cart.subtotal, data.promo_id ?? null);
  
  // Start transaction by creating order
  const insertOrderQuery = `
    INSERT INTO orders (user_id, total_amount, status, promo_id, shipping_address)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;
  
  const orderResult = await query(insertOrderQuery, [
    userId,
    total,
    "pending",
    promoId,
    JSON.stringify(data.shipping_address),
  ]);
  
  const orderId = orderResult.rows[0].id;
  
  // Insert order items with price snapshots
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
    itemParams.push(orderId, item.product.id, item.quantity, item.product.base_price);
  });
  
  await query(insertItemsQuery, itemParams);
  
  // Update product stock quantities
  for (const item of cart.items) {
    const updateStockQuery = `
      UPDATE products
      SET stock_quantity = stock_quantity - $1
      WHERE id = $2
    `;
    await query(updateStockQuery, [item.quantity, item.product.id]);
  }
  
  // Clear cart after order creation
  await clearCart(cognitoSub);
  
  return fetchOrderById(orderId, userId);
}

