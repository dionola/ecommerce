# Building a Full-Stack E-Commerce Platform: Architecture, Decisions, and Lessons Learned

A deep dive into a production-grade TypeScript e-commerce application — the decisions that worked, the patterns worth stealing, and the rough edges still waiting to be sanded down.

---

## What Is It?

This is a full-stack e-commerce web application built under the brand "The Art of Living Well" — a premium lifestyle store with a minimalist aesthetic. It is a portfolio-grade project built to demonstrate a genuine production architecture rather than a tutorial scaffold.

**What users can do:**

- Browse a product catalog with infinite scroll, grid/list toggle, and multi-faceted filtering (search, price range, category, manufacturer, stock status)
- Add items to a cart as a guest (stored in `localStorage`) — the cart survives a page refresh and merges automatically into the server cart on login
- Sign in with email/password or Google OAuth
- Checkout via Stripe, apply promo codes (percentage or fixed), and view order history
- Manage a wishlist

**What administrators can do:**

- Manage products, orders, promos, manufacturers, and users from a dedicated `/admin` dashboard
- Handle product images: add, update, delete, and reorder
- Bulk-create and bulk-update products
- Tag products with status badges (new, sale, featured, etc.)
- Configure the homepage hero banner

---

## The Stack

| Layer | Choice |
|---|---|
| **Server runtime** | Node.js + TypeScript (`tsx` dev, `tsc` build) |
| **Server framework** | Express 5 |
| **Database** | PostgreSQL (raw SQL via `pg`, no ORM) |
| **Auth** | AWS Cognito + `aws-jwt-verify` |
| **Payments** | Stripe Checkout Sessions |
| **Validation** | Zod v4 (input and output) |
| **API docs** | Swagger/OpenAPI at `/api-docs` |
| **Frontend** | React 19 + Vite 7 + React Router v7 |
| **Styling** | Tailwind CSS v4 |
| **UI primitives** | Radix UI (Dialog, Popover, Select, Toast, etc.) |
| **Client auth** | AWS Amplify v6 |
| **Package manager** | pnpm (monorepo: `client/` + `server/`) |

---

## Architecture

### Backend: Strict Layering

The server enforces a deliberate four-layer architecture:

```
Route → Middleware (validate / authenticate / authorize) → Controller → Service → Database
```

Every request passes through validation before it reaches a controller. Every controller reads from `res.locals` rather than `req` directly — this is not accidental. It's a clean separation between HTTP concerns and business logic.

**Services are split by operation, not by domain.** Rather than one `productService.ts`, there are six:

```
productReadService.ts
productCreateService.ts
productUpdateService.ts
productDeleteService.ts
productBulkService.ts
productImageService.ts
productStatusService.ts
```

This keeps each file small and focused. The tradeoff is more files to navigate — but individual files that are easy to reason about beat a 600-line monolith.

**Validation is double-sided.** The `validateDto` utility is used both to validate incoming request bodies (via the `validate` middleware) and to validate outgoing data at the service boundary before it leaves the server. If you change your Zod schema, you find out immediately — not at runtime in production.

### Frontend: Context + Custom Hooks

State is managed with React Context — no Redux, no Zustand. Two contexts carry the load:

- `AuthContext`: wraps Amplify's `fetchAuthSession()`, exposes `isAuthenticated`, `token`, and `user`
- `CartContext`: manages the cart state, handles the guest→server merge on login, and optimistically updates the UI

The HTTP layer is a thin `apiRequest` wrapper over native `fetch` (no Axios dependency). It reads the current token from `AuthContext` on every call and handles 401 token refresh transparently. It's ~80 lines and covers everything the app needs.

The routing structure is a single `<Layout>` shell with an `<Outlet>` — all pages share the same Navbar and Footer without prop-drilling.

---

## Code Highlights

### N+1 Prevention Without an ORM

Fetching products with their images and status badges in a single query is exactly the kind of problem ORMs solve clumsily. The raw SQL approach here uses PostgreSQL's `json_agg` with `COALESCE` and `FILTER (WHERE ...)`:

```sql
SELECT
  p.*,
  COALESCE(
    json_agg(pi ORDER BY pi.display_order)
    FILTER (WHERE pi.id IS NOT NULL), '[]'
  ) AS images,
  COALESCE(
    json_agg(DISTINCT ps.status)
    FILTER (WHERE ps.status IS NOT NULL), '[]'
  ) AS statuses
FROM products p
LEFT JOIN product_images pi ON pi.product_id = p.id
LEFT JOIN product_statuses ps ON ps.product_id = p.id
WHERE ...
GROUP BY p.id
```

One query. No N+1. No ORM magic. This is genuinely sophisticated SQL — and it's more readable than the ActiveRecord/Sequelize equivalent would be once you know what `json_agg` does.

### The `validate` Middleware Factory

A single generic factory handles all input validation:

```typescript
// Usage in a route file:
router.post(
  '/products',
  authenticate,
  authorize('admin'),
  validate(CreateProductDto, 'body'),
  productController.create
)

// In the controller:
const dto = res.locals.body as CreateProductDto
```

`validate(schema, source)` validates `req.body`, `req.params`, or `req.query` and stores the parsed, typed result in `res.locals[source]`. Controllers never touch raw `req` data. This pattern makes it trivially easy to add validation to any route and impossible to accidentally use unvalidated input.

### The `authorize` Middleware as a Variadic Closure

```typescript
authorize(...allowedRoles: AllowedRole[])
```

Roles are never stored in the database. They live exclusively as `cognito:groups` claims in the verified JWT. The middleware reads the claim, checks membership, and either calls `next()` or returns 403. Changing a user's role is a Cognito operation — no schema migrations, no sync issues.

### Guest Cart with Automatic Merge

The guest cart in `guestCart.ts` is a pure `localStorage` implementation under the key `guest_cart`. The magic is in `CartContext`:

```typescript
// On login:
await mergeGuestCartToServer()  // POST /cart/merge with guest items
await fetchServerCart()          // Replace local state with server cart
clearGuestCart()                 // Clean up localStorage
```

From the user's perspective, they add items, log in, and their cart is still there. From the code's perspective, it's three sequential operations, each responsible for a single thing.

### Payment Strategy Pattern

The payment service is structured for extensibility:

```typescript
class PaymentService {
  private processors = new Map<PaymentProcessorType, IPaymentProcessor>()

  constructor() {
    this.processors.set('stripe', new StripeProcessor())
  }

  async createSession(type: PaymentProcessorType, options: SessionOptions) {
    return this.processors.get(type)!.createSession(options)
  }
}
```

Only Stripe is implemented today. Adding PayPal is a matter of implementing `IPaymentProcessor` and registering it. The calling code never changes.

### Infinite Scroll via `IntersectionObserver`

```typescript
const observer = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting && hasMore && !loading) {
      setPage(prev => prev + 1)
    }
  },
  { rootMargin: '100px' }
)

observer.observe(sentinelRef.current)
```

A sentinel `<div>` at the bottom of the product grid. When it enters the viewport, the page counter increments and the next page of products is appended (not replaced). No library. No magic. 12 lines.

### Graceful Shutdown

```typescript
const shutdown = async (signal: string) => {
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
```

Express closes first, draining in-flight requests. The connection pool closes after. No dropped queries on container restart.

---

## Points for Improvement

### 1. The `auth.ts` Middleware Is Missing (Critical)

Every route file imports `authenticate` and `optionalAuthenticate` from `../middleware/auth`. The file does not exist in the source tree or the compiled output. The server cannot build or start from a clean clone. This is almost certainly a `.gitignore` accident or a deleted-but-not-replaced file. It is the highest-priority issue in the codebase.

### 2. Order Creation Is Not Transactional

`orderCreateService.ts` issues several sequential queries — `INSERT order`, `INSERT order_items`, `UPDATE product stock` — without a `BEGIN`/`COMMIT`/`ROLLBACK` wrapper. If the stock update fails after the order is inserted, the database is in a partially-committed state: an order record exists, money has moved, but inventory counts are wrong. This is a data integrity bug waiting to happen.

```typescript
// How it should look:
const client = await pool.connect()
try {
  await client.query('BEGIN')
  const order = await client.query(insertOrderSQL, [...])
  await client.query(insertItemsSQL, [...])
  await client.query(updateStockSQL, [...])
  await client.query('COMMIT')
} catch (e) {
  await client.query('ROLLBACK')
  throw e
} finally {
  client.release()
}
```

Bulk operations in `productBulkService.ts` have the same problem.

### 3. No Stripe Webhook

The current payment confirmation flow polls via `verifyCheckoutSession` after Stripe redirects back to the app. If the user closes the browser mid-redirect — or if their connection drops — Stripe has charged the card but the order is never marked `paid` and the cart is never cleared.

Production Stripe integrations require a webhook listener for `checkout.session.completed`. This is not optional. Stripe's documentation is explicit about this, and it takes about an afternoon to implement.

### 4. No Database Migration Framework

The 23 numbered scripts in `/server/db/scripts/000-seeding/` are run manually. There is no tracking table to record which scripts have been applied to a given database instance. You cannot `git pull` on a new environment and know what state the schema is in. 

Tools like [Flyway](https://flywaydb.org/), [golang-migrate](https://github.com/golang-migrate/migrate), or even [node-pg-migrate](https://github.com/salsita/node-pg-migrate) would solve this with minimal overhead. Pick one.

### 5. Admin Routes Have No Client-Side Guard

`App.tsx` registers all `/admin/*` routes with no authentication or role check. The API calls will correctly 401/403, so there is no security hole — but any unauthenticated user who navigates to `/admin/products` will see the admin UI render (briefly) before the API calls fail. A simple `<AdminRoute>` wrapper that checks `isAuthenticated && user.isAdmin` would fix this.

### 6. Dual Authentication Paths

The Google OAuth flow is implemented as a custom popup + `postMessage` dance, separate from Amplify's managed flow. This creates two authentication paths with different token storage (`sessionStorage` for Google vs. Amplify's secure storage for Cognito), different refresh mechanics, and separate disambiguation logic in `getUserInfo()`. 

Cognito's built-in Google federation handles this at the identity provider level and removes the complexity entirely. The custom popup flow is clever, but it is solving a problem Cognito already solves.

### 7. Dynamic `import()` Inside Request Handlers

Several controllers use dynamic `await import(...)` inside request handlers to break circular dependencies:

```typescript
const { getUserIdByCognitoSub } = await import("../services/users/userService.js")
```

This is a code smell. The circular dependency is a structural problem in the service layer, and it should be resolved by refactoring the dependency graph rather than deferred at runtime. Dynamic imports inside hot paths also add module-resolution latency on the first call.

### 8. Hard `limit: 100` in Admin Products

`AdminProducts.tsx` loads products with `limit: 100` on every render and re-fetches after every mutation. There is no pagination in the admin product list. As inventory grows beyond 100 items, this will silently truncate results — an operator will think a product does not exist when it's just past the hard limit.

### 9. Guest Cart Re-fetches Product Data It Already Has

When a guest clicks "Add to Cart," `CartContext` calls `getProduct(productId)` to fetch the full product object before storing it in `localStorage`. The product data is already in scope — it was just rendered. The object should be passed directly rather than re-fetched over the network.

---

## What This Project Gets Right

Setting aside the rough edges, this codebase demonstrates several things that are genuinely hard to get right in a portfolio project:

- **The layered architecture is real and enforced** — there are no shortcuts where a route handler reaches directly into a model
- **Zod is used consistently** on both the incoming and outgoing sides, not just as a request parser
- **The raw SQL is intentional and good** — the `json_agg` pattern in the product query is better than what most ORM-generated queries produce
- **The payment strategy pattern** is forward-looking without being over-engineered
- **Graceful shutdown** is implemented correctly, which most tutorials skip entirely
- **The guest cart merge** is a genuinely good UX pattern, correctly implemented

The most common failure mode in portfolio projects is choosing the impressive tool over the appropriate one. This project made the opposite bet: raw SQL, native fetch, React Context. For the scale of a portfolio project, those are defensible calls — and the code is cleaner for it.

---

## Conclusion

This is a thoughtful full-stack project that gets the architecture right at a structural level. The service layer pattern, the middleware factory approach, and the validation discipline are all worth borrowing. The most pressing issues — the missing auth middleware, non-transactional order creation, and absent Stripe webhooks — are fixable in a few focused sessions.

The codebase is a strong foundation. The next version just needs transactions, webhooks, and a migration system.
