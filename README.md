# E-Commerce Store

Full-stack e-commerce application with a customer storefront, admin panel, and real payment integration. Two independent backend implementations — TypeScript/Express and ASP.NET Core — both serving the same React frontend.

[![e-commerce](https://ejyic7eskr7jje45.public.blob.vercel-storage.com/ecommerce-thumbnail.png)](https://ecommerce.dionola.com)

---

## Structure

```
.
├── client/                   # React + Vite frontend
├── server/                   # TypeScript + Express backend (PostgreSQL, Cognito)
├── server-dotnet/            # ASP.NET Core backend (SQL Server, ASP.NET Identity)
├── server-c-rest/            # C REST variant
├── server-c-graphql/         # C GraphQL variant
├── server-c-ecs/             # ECS deployment variant
├── server-c-eks/             # EKS deployment variant
└── server-less/              # Serverless deployment variants
    ├── rest-lambda/          # REST API on Lambda
    ├── graphql-lambda/       # GraphQL API on Lambda
    ├── ecs/                  # ECS microservices
    └── eks/                  # EKS microservices
```

---

## Environment

### TypeScript server (`server/.env`)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=ecommerce

STRIPE_SECRET_KEY=sk_test_...
STRIPE_CURRENCY=usd

AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=your_user_pool_id
AWS_COGNITO_CLIENT_ID=your_client_id

FRONTEND_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```

### ASP.NET Core server (`server-dotnet/src/Ecommerce.Api/appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=Ecommerce;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Stripe": {
    "SecretKey": "sk_test_...",
    "Currency": "php"
  },
  "FrontendUrl": "http://localhost:5173"
}
```

---

## Start

### TypeScript stack

```bash
# Install
pnpm install

# Run frontend (http://localhost:5173)
cd client && pnpm dev

# Run backend (http://localhost:3001)
cd server && pnpm dev
```

### ASP.NET Core stack

```bash
cd server-dotnet
dotnet restore
dotnet ef database update --project src/Ecommerce.Infrastructure --startup-project src/Ecommerce.Api
dotnet run --project src/Ecommerce.Api
```
