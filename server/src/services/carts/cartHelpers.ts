import { query } from "../../models/databaseModel.js";
import { CartDto, CartDtoType } from "../../dtos/cartDto.js";
import { validateDto } from "../../utils/validateDto.js";
import { NotFoundError } from "../../errors/NotFoundError.js";

/**
 * Gets or creates a cart for a user
 */
export async function getOrCreateCart(userId: number): Promise<number> {
  // Try to get existing cart
  const getCartQuery = `
    SELECT id FROM carts WHERE user_id = $1
  `;
  
  const result = await query(getCartQuery, [userId]);
  
  if (result.rows.length > 0) {
    return result.rows[0].id;
  }
  
  // Create new cart if it doesn't exist
  const createCartQuery = `
    INSERT INTO carts (user_id)
    VALUES ($1)
    RETURNING id
  `;
  
  const createResult = await query(createCartQuery, [userId]);
  return createResult.rows[0].id;
}

/**
 * Updates cart's updated_at timestamp
 */
export async function updateCartTimestamp(cartId: number): Promise<void> {
  const updateQuery = `
    UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1
  `;
  await query(updateQuery, [cartId]);
}

/**
 * Fetches a cart by user ID with items and totals
 */
export async function fetchCartByUserId(userId: number): Promise<CartDtoType> {
  // Get or create cart
  const cartId = await getOrCreateCart(userId);
  
  // Get cart basic info
  const cartInfoQuery = `
    SELECT id, user_id, updated_at FROM carts WHERE id = $1
  `;
  const cartResult = await query(cartInfoQuery, [cartId]);
  
  if (cartResult.rows.length === 0) {
    throw new NotFoundError(`Cart not found`);
  }
  
  // Get cart items with products and images
  const itemsQuery = `
    SELECT 
      ci.id,
      ci.quantity,
      p.id as product_id,
      p.name,
      p.description,
      p.base_price,
      p.country_of_origin,
      p.stock_quantity,
      p.manufacturer_id,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pi.id,
            'url', pi.url,
            'is_main', pi.is_main
          ) ORDER BY pi.is_main DESC, pi.id
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'::json
      ) as images
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN product_images pi ON p.id = pi.product_id
    WHERE ci.cart_id = $1
    GROUP BY ci.id, ci.quantity, p.id, p.name, p.description, p.base_price, p.country_of_origin, p.stock_quantity, p.manufacturer_id
  `;
  
  const itemsResult = await query(itemsQuery, [cartId]);
  
  // Calculate totals
  let subtotal = 0;
  const items = itemsResult.rows.map(row => {
    const itemTotal = Number(row.base_price) * row.quantity;
    subtotal += itemTotal;
    return {
      id: row.id,
      product: {
        id: row.product_id,
        name: row.name,
        description: row.description,
        base_price: row.base_price,
        country_of_origin: row.country_of_origin,
        stock_quantity: row.stock_quantity,
        manufacturer_id: row.manufacturer_id,
        images: row.images || [],
      },
      quantity: row.quantity,
    };
  });
  
  const cartData = {
    id: cartResult.rows[0].id,
    user_id: cartResult.rows[0].user_id,
    updated_at: cartResult.rows[0].updated_at,
    items,
    subtotal,
    total: subtotal, // Total will be calculated with promo in order creation
  };

  return validateDto(CartDto, cartData, "Failed to validate cart data");
}

/**
 * Checks if a product exists in a cart
 */
export async function getCartItemByProductId(cartId: number, productId: number): Promise<{ id: number; quantity: number } | null> {
  const checkQuery = `
    SELECT id, quantity FROM cart_items 
    WHERE cart_id = $1 AND product_id = $2
  `;
  const result = await query(checkQuery, [cartId, productId]);
  if (result.rows.length === 0) {
    return null;
  }
  return { id: result.rows[0].id, quantity: result.rows[0].quantity };
}

/**
 * Validates stock availability for a product
 */
export async function validateStock(productId: number, requestedQuantity: number): Promise<void> {
  const stockQuery = `
    SELECT stock_quantity FROM products WHERE id = $1
  `;
  const result = await query(stockQuery, [productId]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError(`Product with id ${productId} not found`);
  }
  
  const availableStock = result.rows[0].stock_quantity;
  
  if (availableStock < requestedQuantity) {
    throw new NotFoundError(`Insufficient stock. Available: ${availableStock}, Requested: ${requestedQuantity}`);
  }
}

