# E-Commerce Store

Large full-stack pet project with a storefront, admin area, authentication, and checkout flow.

## Structure

- [client](/Users/stephen/repoClone/e_commerce_store/client:1): React + Vite frontend
- [server](/Users/stephen/repoClone/e_commerce_store/server:1): Express + TypeScript backend

## Main Features

- public storefront
- cart and wishlist
- Cognito-based auth
- admin pages for products, orders, promos, users, and banner content
- Stripe checkout session flow

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
- There are some one-off database scripts under [server/db/scripts/000-seeding](/Users/stephen/repoClone/e_commerce_store/server/db/scripts/000-seeding:1), so review before running them.
