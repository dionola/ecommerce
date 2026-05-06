# E-Commerce Store

Full-stack e-commerce application with a customer storefront, admin panel, and real payment integration.

[![e-commerce](https://ejyic7eskr7jje45.public.blob.vercel-storage.com/ecommerce-thumbnail.png)](https://ecommerce.dionola.com)
  
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![AWS Cognito](https://img.shields.io/badge/AWS_Cognito-FF9900?style=flat&logo=amazonaws&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat&logo=stripe&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat&logo=zod&logoColor=white)

  ---
  
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
