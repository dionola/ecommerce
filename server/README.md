# Backend README

This is the Express + TypeScript backend for the e-commerce store. It exposes APIs for products, carts, orders, payments, promos, manufacturers, users, wishlists, and banner content, and it connects to PostgreSQL.

## Stack

- Node.js
- Express 5
- TypeScript
- PostgreSQL via `pg`
- Zod
- Stripe
- AWS Cognito token verification
- Swagger UI
- Vitest

## Features

- REST API for storefront and admin operations
- PostgreSQL-backed product, cart, order, wishlist, and promo data
- Stripe payment endpoints
- AWS Cognito-aware auth support
- Rate limiting, validation, structured error handling, and request logging
- Swagger docs and health checks
- Database schema and seeding scripts under `db/scripts/000-seeding`

## Project Structure

```text
server/
├── db/scripts/000-seeding/
├── images/
├── src/
│   ├── __tests__/
│   ├── config/
│   ├── dtos/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── index.ts
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

## Environment Variables

Start from [server/.env.example](/Users/stephen/repoClone/e_commerce_store/server/.env.example:1) and create `server/.env`.

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=ecommerce

STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_CURRENCY=usd

AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=your_user_pool_id
AWS_COGNITO_CLIENT_ID=your_client_id

FRONTEND_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```

Validation details:

- Database vars are required outside test mode in [src/config/env.ts](/Users/stephen/repoClone/e_commerce_store/server/src/config/env.ts:1).
- Stripe, Cognito, and `FRONTEND_URL` become required in production.

## Install

```bash
cd server
pnpm install
```

## Run

Development:

```bash
pnpm dev
```

Production build:

```bash
pnpm build
pnpm start
```

Default local server:

- API base URL: `http://localhost:3001`
- Health check: `http://localhost:3001/health`
- Swagger docs: `http://localhost:3001/api-docs`

## Available Scripts

- `pnpm dev` runs the API with `tsx --watch`
- `pnpm build` compiles TypeScript to `dist`
- `pnpm start` runs the compiled server
- `pnpm type-check` runs TypeScript without emitting files
- `pnpm lint` runs ESLint
- `pnpm lint:fix` fixes lint issues
- `pnpm format` formats files with Prettier
- `pnpm format:check` checks formatting
- `pnpm test` starts Vitest in watch mode
- `pnpm test:run` runs the test suite once
- `pnpm test:ui` opens the Vitest UI
- `pnpm coverage` runs tests with coverage

## API Routes

Routes are registered in [src/index.ts](/Users/stephen/repoClone/e_commerce_store/server/src/index.ts:1).

- `GET /health`
- `/products`
- `/payments`
- `/carts`
- `/orders`
- `/promos`
- `/manufacturers`
- `/wishlists`
- `/users`
- `/banner`
- `/api-docs`

In non-production environments, test auth routes are also enabled.

## Database and Seeding

Schema and data scripts live in [server/db/scripts/000-seeding](/Users/stephen/repoClone/e_commerce_store/server/db/scripts/000-seeding:1).

Common files include:

- `000-schema.ts` for schema setup
- `001-seed.ts` for initial seed data
- follow-up scripts for image cleanup, category fixes, user seeding, banner setup, and payment field updates

Because this folder contains many one-off maintenance scripts, review the specific script before running it in a shared database.

## Testing

Tests live in [src/__tests__](/Users/stephen/repoClone/e_commerce_store/server/src/__tests__:1) and cover areas such as:

- auth
- carts
- orders
- products
- promos
- wishlists

## Notes

- The backend uses CORS with `FRONTEND_URL` to allow the frontend origin.
- PostgreSQL connection setup lives in [src/config/database.ts](/Users/stephen/repoClone/e_commerce_store/server/src/config/database.ts:1).
- Built files are emitted to `server/dist`.
