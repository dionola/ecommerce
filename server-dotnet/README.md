# Ecommerce ASP.NET Core API

Portfolio backend project built to practice production-style ASP.NET Core beyond my day-to-day Python/Node work. It implements a SQL Server-backed ecommerce API with products, carts, orders, wishlists, promos, admin workflows, role-based authorization, Stripe Checkout integration, migrations, and API contract tests.

The API also preserves compatibility with an existing React ecommerce client, so several response contracts intentionally use `snake_case`.

## What This Demonstrates

- ASP.NET Core minimal APIs organized into endpoint groups
- Layered solution structure with `Api`, `Application`, `Domain`, and `Infrastructure` projects
- EF Core with SQL Server/Azure SQL migrations
- ASP.NET Core Identity bearer-token authentication
- Role authorization for `customer`, `admin`, and `superadmin`
- Product, cart, order, wishlist, promo, manufacturer, banner, and user-management workflows
- Stripe Checkout behind an application interface for testability
- OpenAPI, CORS, health checks, centralized exception handling, and integration tests
- Test auth and local demo token support isolated to development/testing environments

## Architecture

```text
src/
  Ecommerce.Api/
    Endpoints/        Route groups and HTTP request parsing
    Program.cs        Service registration, middleware, and composition root
    TestAuth.cs       Testing-only authentication handler
  Ecommerce.Application/
    Dtos/             Request and response contracts
    Errors/           Application-level exception contract
    Services/         Service interfaces consumed by API and infrastructure
  Ecommerce.Domain/
    Models/           Domain/persistence entities
  Ecommerce.Infrastructure/
    Data/             EF Core DbContext and ASP.NET Identity user
    ExternalClients/  Identity and Stripe adapters
    Migrations/       SQL Server EF Core migrations
    Services/         Ecommerce workflow implementation
tests/
  Ecommerce.Api.Tests/
```

The project uses a layered structure because the domain is broad enough to justify it:

- `Api` owns HTTP concerns: routing, auth setup, middleware, CORS, JSON settings, and health checks.
- `Application` owns contracts, service interfaces, and app-level errors.
- `Domain` holds the core ecommerce entities.
- `Infrastructure` owns EF Core, Identity adapters, Stripe, and workflow implementation.

## Local Setup

```bash
dotnet restore
dotnet build
dotnet run --project src/Ecommerce.Api
```

Default local API URL:

- `https://localhost:5001` or the URL shown by `dotnet run`
- health: `/health`
- DB health: `/health/db`

Configure local secrets with user-secrets or environment variables:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=Ecommerce;User Id=sa;Password=...;TrustServerCertificate=True" --project src/Ecommerce.Api
dotnet user-secrets set "Stripe:SecretKey" "sk_test_..." --project src/Ecommerce.Api
```

## Configuration

| Setting | Environment Variable | Description |
|---|---|---|
| `ConnectionStrings:DefaultConnection` | `SQLSERVER_CONNECTION_STRING` | SQL Server/Azure SQL connection |
| `FrontendUrl` | `FRONTEND_URL` | Allowed CORS origin and checkout return base |
| `Stripe:SecretKey` | `STRIPE_SECRET_KEY` | Stripe secret key |
| `Stripe:Currency` | `STRIPE_CURRENCY` | Checkout currency, defaults to `php` |

## Database

Create or update the SQL Server schema with EF Core migrations:

```bash
dotnet ef database update \
  --project src/Ecommerce.Infrastructure \
  --startup-project src/Ecommerce.Api
```

The initial migration creates ecommerce tables for products, images, statuses, carts, orders, promos, manufacturers, wishlists, users, banner configuration, and ASP.NET Core Identity.

## Authentication And Roles

Production authentication uses ASP.NET Core Identity bearer tokens. The API supports:

- `customer`: cart, wishlist, own order, and checkout workflows
- `admin`: product, promo, manufacturer, banner, order administration, and user listing
- `superadmin`: admin capabilities plus privileged admin-user creation/role changes

For local demos and tests, `/test-token` is available only in `Development` and `Testing`. It is intentionally not mapped in production.

## API Surface

| Area | Routes |
|---|---|
| Health | `/health`, `/health/db` |
| Products | `/products`, `/products/categories`, image/status/bulk product routes |
| Cart | `/carts`, `/carts/items`, `/carts/clear` |
| Orders | `/orders`, `/orders/{id}` |
| Wishlist | `/wishlists`, `/wishlists/items`, `/wishlists/clear` |
| Promos | `/promos` |
| Manufacturers | `/manufacturers` |
| Banner | `/banner` |
| Users | `/users`, `/users/{id}/role` |
| Payments | `/payments/checkout-session`, `/payments/checkout-session/{sessionId}/verify` |

JSON responses keep compatibility with the existing React client, including `snake_case` fields such as `base_price`, `stock_quantity`, `shipping_address`, and `payment_intent_id`.

## Tests

```bash
dotnet test
```

The main integration tests use `WebApplicationFactory`, a testing auth scheme, and EF Core InMemory storage for fast contract coverage. The suite covers product filters and admin CRUD, carts, orders, promos, manufacturers, banner updates, users, authorization boundaries, checkout gateway behavior, and health checks.

There is also a SQL Server Testcontainers migration verification test. It runs when Docker is available and returns early otherwise, keeping local test runs fast while still allowing real-provider migration validation in Docker-enabled environments.

## Production Notes

- Deploy the API to a .NET-capable host such as Azure App Service.
- Use Azure SQL Database or another SQL Server-compatible provider.
- Set `FrontendUrl` to the deployed React frontend origin.
- Keep Stripe secrets out of committed config and set them through deployment environment variables.
- Do not expose `/test-token` outside development/testing environments.
