# E-Commerce Store

Full-stack e-commerce application with a customer storefront, admin panel, and real payment integration. The project includes two independent backend implementations — one in TypeScript/Express and one in ASP.NET Core — both serving the same React frontend.

[![e-commerce](https://ejyic7eskr7jje45.public.blob.vercel-storage.com/ecommerce-thumbnail.png)](https://ecommerce.dionola.com)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![C#](https://img.shields.io/badge/C%23-239120?style=flat&logo=csharp&logoColor=white)
![.NET](https://img.shields.io/badge/.NET-512BD4?style=flat&logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL_Server-CC2927?style=flat&logo=microsoftsqlserver&logoColor=white)
![AWS Cognito](https://img.shields.io/badge/AWS_Cognito-FF9900?style=flat&logo=amazonaws&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat&logo=stripe&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat&logo=zod&logoColor=white)

---

## Structure

- `client/` — React + Vite frontend
- `server/` — Express + TypeScript backend (PostgreSQL, AWS Cognito)
- `server-dotnet/` — ASP.NET Core backend (SQL Server, ASP.NET Identity)

## Main Features

- Customer storefront with product catalog, cart, and wishlist
- Role-based access control (customer / admin / superadmin)
- Stripe Checkout session integration
- Admin panel — products, orders, promos, manufacturers, users, banner
- **TypeScript server:** AWS Cognito auth (email/password + Google OAuth), Swagger API docs, Vitest + Supertest integration tests
- **ASP.NET Core server:** ASP.NET Identity bearer-token auth, EF Core migrations, xUnit integration tests

## Run

### TypeScript server

```bash
cd client && pnpm install
cd ../server && pnpm install
```

```bash
cd client && pnpm dev
cd server && pnpm dev
```

### ASP.NET Core server (dotnet branch)

```bash
cd server-dotnet
dotnet restore
dotnet run --project src/Ecommerce.Api
```

See `server-dotnet/README.md` for configuration and database setup.

## Notes

- Each workspace (`client`, `server`, `server-dotnet`) has its own README with setup details.
- This repo also contains a large local image/data set used for seeded catalog content.
