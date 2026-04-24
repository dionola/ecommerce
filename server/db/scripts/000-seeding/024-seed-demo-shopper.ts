import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const DEMO_EMAIL = 'shopper@example.com';

type ProductRow = {
  id: number;
  base_price: string | number;
  stock_quantity: number;
};

function toPrice(value: string | number): number {
  return typeof value === 'number' ? value : parseFloat(value);
}

async function ensureDemoShopperData() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log(`🚀 Seeding demo shopper activity for ${DEMO_EMAIL}...`);

    const userResult = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      [DEMO_EMAIL]
    );

    if (userResult.rows.length === 0) {
      throw new Error(`User ${DEMO_EMAIL} not found. Run 004-seed-users first.`);
    }

    const userId = userResult.rows[0].id as number;

    const productsResult = await client.query<ProductRow>(
      `
        SELECT id, base_price, stock_quantity
        FROM products
        WHERE stock_quantity > 0
        ORDER BY id
        LIMIT 24
      `
    );

    const products = productsResult.rows;

    if (products.length < 18) {
      throw new Error('Need at least 18 in-stock products to seed the demo shopper.');
    }

    await client.query(`DELETE FROM wishlist_items WHERE wishlist_id IN (SELECT id FROM wishlists WHERE user_id = $1)`, [userId]);
    await client.query(`DELETE FROM wishlists WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = $1)`, [userId]);
    await client.query(`DELETE FROM carts WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM orders WHERE user_id = $1`, [userId]);

    const wishlistResult = await client.query(
      `INSERT INTO wishlists (user_id) VALUES ($1) RETURNING id`,
      [userId]
    );
    const wishlistId = wishlistResult.rows[0].id as number;

    const wishlistProducts = products.slice(0, 8);
    for (const product of wishlistProducts) {
      await client.query(
        `INSERT INTO wishlist_items (wishlist_id, product_id) VALUES ($1, $2)`,
        [wishlistId, product.id]
      );
    }

    const cartResult = await client.query(
      `INSERT INTO carts (user_id) VALUES ($1) RETURNING id`,
      [userId]
    );
    const cartId = cartResult.rows[0].id as number;

    const cartProducts = products.slice(8, 12);
    for (const [index, product] of cartProducts.entries()) {
      await client.query(
        `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)`,
        [cartId, product.id, (index % 2) + 1]
      );
    }

    const orderGroups = [
      { status: 'completed', items: products.slice(12, 15), createdDaysAgo: 45 },
      { status: 'completed', items: products.slice(15, 18), createdDaysAgo: 31 },
      { status: 'paid', items: products.slice(3, 6), createdDaysAgo: 18 },
      { status: 'pending', items: products.slice(6, 9), createdDaysAgo: 9 },
      { status: 'paid', items: products.slice(9, 12), createdDaysAgo: 4 },
      { status: 'completed', items: products.slice(18, 21), createdDaysAgo: 2 },
    ];

    for (const [orderIndex, group] of orderGroups.entries()) {
      const quantityBase = (orderIndex % 2) + 1;
      const total = group.items.reduce((sum, item, itemIndex) => {
        return sum + toPrice(item.base_price) * (quantityBase + (itemIndex % 2));
      }, 0);

      const orderResult = await client.query(
        `
          INSERT INTO orders (user_id, total_amount, status, shipping_address, created_at)
          VALUES ($1, $2, $3, $4::jsonb, NOW() - ($5 || ' days')::interval)
          RETURNING id
        `,
        [
          userId,
          total.toFixed(2),
          group.status,
          JSON.stringify({
            full_name: 'Demo Shopper',
            address_line_1: '123 Test Street',
            city: 'Makati',
            province: 'Metro Manila',
            postal_code: '1200',
            country: 'Philippines',
          }),
          group.createdDaysAgo,
        ]
      );

      const orderId = orderResult.rows[0].id as number;

      for (const [itemIndex, item] of group.items.entries()) {
        const quantity = quantityBase + (itemIndex % 2);
        await client.query(
          `
            INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
            VALUES ($1, $2, $3, $4)
          `,
          [orderId, item.id, quantity, toPrice(item.base_price)]
        );
      }
    }

    await client.query('COMMIT');
    console.log('✅ Demo shopper seeded with wishlist, cart, and historical orders.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Demo shopper seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

ensureDemoShopperData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
