# E-Commerce Store

Full-stack e-commerce application with a customer storefront, admin panel, and real payment integration.

## Structure

- [client](/Users/stephen/repoClone/e_commerce_store/client:1): React + Vite frontend
- [server](/Users/stephen/repoClone/e_commerce_store/server:1): Express + TypeScript backend

## Main Features

- Customer storefront with product catalog, cart, and wishlist
- AWS Cognito authentication (email/password + Google OAuth)
- Role-based access control (customer / admin / superadmin)
- Stripe Checkout session integration
- Admin panel — products, orders, promos, manufacturers, users, banner
- Swagger API docs at `/api-docs`
- Integration test suite (Vitest + Supertest)

## Run

Install dependencies in each workspace first:

```bash
cd client && pnpm install
cd ../server && pnpm install
```

Then run each side separately:

```bash
cd client && pnpm dev
cd server && pnpm dev
```

## Notes

- The frontend and backend each have their own README.
- This repo also contains a large local image/data set used for seeded catalog content.
