import { query } from "../../models/databaseModel.js";
import { WishlistDto, WishlistDtoType } from "../../dtos/wishlistDto.js";
import { validateDto } from "../../utils/validateDto.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ProductDto } from "../../dtos/productDto.js";
import { getUserIdByCognitoSub } from "../users/userService.js";

/**
 * Gets or creates a wishlist for a user
 */
export async function getOrCreateWishlist(userId: number): Promise<number> {
  // Try to get existing wishlist
  const getWishlistQuery = `
    SELECT id FROM wishlists WHERE user_id = $1
  `;
  
  const result = await query(getWishlistQuery, [userId]);
  
  if (result.rows.length > 0) {
    return result.rows[0].id;
  }
  
  // Create new wishlist if it doesn't exist
  const createWishlistQuery = `
    INSERT INTO wishlists (user_id)
    VALUES ($1)
    RETURNING id
  `;
  
  const createResult = await query(createWishlistQuery, [userId]);
  return createResult.rows[0].id;
}

/**
 * Fetches a wishlist by user ID with items
 */
export async function fetchWishlistByUserId(userId: number): Promise<WishlistDtoType> {
  // First, get or create wishlist
  const wishlistId = await getOrCreateWishlist(userId);
  
  // Get wishlist basic info
  const wishlistInfoQuery = `
    SELECT id, user_id FROM wishlists WHERE id = $1
  `;
  const wishlistResult = await query(wishlistInfoQuery, [wishlistId]);
  
  if (wishlistResult.rows.length === 0) {
    throw new NotFoundError(`Wishlist not found`);
  }
  
  // Get wishlist items with products and images
  const itemsQuery = `
    SELECT 
      p.id,
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
    FROM wishlist_items wi
    JOIN products p ON wi.product_id = p.id
    LEFT JOIN product_images pi ON p.id = pi.product_id
    WHERE wi.wishlist_id = $1
    GROUP BY p.id, p.name, p.description, p.base_price, p.country_of_origin, p.stock_quantity, p.manufacturer_id
  `;
  
  const itemsResult = await query(itemsQuery, [wishlistId]);
  
  const wishlistData = {
    id: wishlistResult.rows[0].id,
    user_id: wishlistResult.rows[0].user_id,
    items: itemsResult.rows.map(row => ({
      product: {
        id: row.id,
        name: row.name,
        description: row.description,
        base_price: row.base_price,
        country_of_origin: row.country_of_origin,
        stock_quantity: row.stock_quantity,
        manufacturer_id: row.manufacturer_id,
        images: row.images || [],
      }
    }))
  };

  return validateDto(WishlistDto, wishlistData, "Failed to validate wishlist data");
}

/**
 * Checks if a product exists in a wishlist
 */
export async function checkWishlistItemExists(wishlistId: number, productId: number): Promise<boolean> {
  const checkQuery = `
    SELECT 1 FROM wishlist_items 
    WHERE wishlist_id = $1 AND product_id = $2
  `;
  const result = await query(checkQuery, [wishlistId, productId]);
  return result.rows.length > 0;
}

