# server-dotnet Parity Matrix

The TypeScript server remains the source of truth until every row below is verified by .NET tests.

## Endpoint Parity

| Area | Endpoint | Status |
| --- | --- | --- |
| Health | `GET /health` | Covered |
| Health | `GET /health/db` | Covered |
| Products | `GET /products` | Covered |
| Products | `GET /products/categories` | Covered |
| Products | `GET /products/:id` | Covered |
| Products | `POST /products` | Covered |
| Products | `PATCH /products/:id` | Covered |
| Products | `DELETE /products/:id` | Covered |
| Product images | `POST /products/:id/images` | Covered |
| Product images | `PATCH /products/:productId/images/:imageId` | Covered |
| Product images | `DELETE /products/:productId/images/:imageId` | Covered |
| Product images | `PUT /products/:id/images/reorder` | Covered |
| Product bulk | `POST /products/bulk` | Covered |
| Product bulk | `PATCH /products/bulk` | Covered |
| Product bulk | `DELETE /products/bulk` | Covered |
| Product statuses | `POST /products/:id/statuses` | Covered |
| Product statuses | `DELETE /products/:productId/statuses/:status` | Covered |
| Carts | `GET /carts` | Covered |
| Carts | `POST /carts/items` | Covered |
| Carts | `PATCH /carts/items/:itemId` | Covered |
| Carts | `DELETE /carts/items/:itemId` | Covered |
| Carts | `DELETE /carts/clear` | Covered |
| Orders | `GET /orders` | Covered |
| Orders | `GET /orders/:id` | Covered |
| Orders | `POST /orders` | Covered |
| Orders | `PATCH /orders/:id` | Covered |
| Orders | `DELETE /orders/:id` | Covered |
| Promos | `GET /promos` | Covered |
| Promos | `GET /promos/:id` | Covered |
| Promos | `POST /promos` | Covered |
| Promos | `PATCH /promos/:id` | Covered |
| Promos | `DELETE /promos/:id` | Covered |
| Manufacturers | `GET /manufacturers` | Covered |
| Manufacturers | `GET /manufacturers/:id` | Covered |
| Manufacturers | `POST /manufacturers` | Covered |
| Manufacturers | `PATCH /manufacturers/:id` | Covered |
| Manufacturers | `DELETE /manufacturers/:id` | Covered |
| Wishlists | `GET /wishlists` | Covered |
| Wishlists | `POST /wishlists/items` | Covered |
| Wishlists | `DELETE /wishlists/items/:productId` | Covered |
| Wishlists | `DELETE /wishlists/clear` | Covered |
| Users | `GET /users` | Covered |
| Users | `POST /users` | Covered |
| Users | `PATCH /users/:id/role` | Covered |
| Banner | `GET /banner` | Covered |
| Banner | `PATCH /banner` | Covered |
| Payments | `POST /payments/checkout-session` | Covered |
| Payments | `GET /payments/checkout-session/:sessionId/verify` | Covered |
| Test auth | `POST /test-token` | Covered as non-production helper |

## Behavior Parity

| Behavior | Status |
| --- | --- |
| Public/optional auth endpoints allow guests | Covered |
| Admin-only endpoints reject guests/customers | Covered |
| Product filters, sort, category/categories, pagination, images, statuses | Covered |
| Cart get/create, add, merge, update, remove, clear, stock validation | Covered |
| Wishlist get/create, add, duplicate, remove, clear | Covered |
| Order list ownership/admin behavior, create from cart, promo, stock decrement, update, pending-only delete | Covered |
| Promo filters, create/update/delete validation | Covered |
| Manufacturer duplicate and delete-while-referenced validation | Covered |
| Banner default and admin update | Covered |
| Stripe unavailable, create session, verify success/failure, wrong-user verification | Covered with fake payment gateway |
| SQL Server schema migration | Covered by migration script generation; real SQL Server verification is skipped when Docker is unavailable |
| ASP.NET Identity user management | Implemented with SQL Server-backed Identity users and roles; test auth remains isolated to `Testing` |
