using System.Text.Json;
using Ecommerce.Application.Dtos;
using Ecommerce.Application.Errors;
using Ecommerce.Application.Services;
using Ecommerce.Infrastructure.Data;
using Ecommerce.Infrastructure.Services;
using Ecommerce.Infrastructure.ExternalClients;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Endpoints;

public static class EcommerceEndpoints
{
    public static WebApplication MapEcommerceEndpoints(this WebApplication app)
    {
        app.MapHealthEndpoints();
        app.MapDemoAuthEndpoints();
        app.MapProductEndpoints();
        app.MapManufacturerEndpoints();
        app.MapPromoEndpoints();

        return app;
    }

    private static void MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", () => Results.Ok(new { status = "ok", timestamp = DateTimeOffset.UtcNow }));
        app.MapGet("/health/db", async (EcommerceDbContext db, CancellationToken ct) =>
        {
            var canConnect = await db.Database.CanConnectAsync(ct);
            return canConnect
                ? Results.Ok(new { status = "ok", timestamp = DateTimeOffset.UtcNow, database = db.Database.GetDbConnection().Database, user = db.Database.GetDbConnection().DataSource })
                : Results.StatusCode(503);
        });
    }

    private static void MapDemoAuthEndpoints(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing")) return;

        app.MapPost("/test-token", ([FromBody] TestTokenRequest request) =>
        {
            var role = request.Role is "admin" or "superadmin" ? request.Role : "customer";
            return Results.Ok(new
            {
                token = $"{role}-token",
                user = new
                {
                    sub = $"{role}-sub-123",
                    email = request.Email ?? $"{role}@example.com",
                    roles = role == "customer" ? Array.Empty<string>() : new[] { role }
                }
            });
        });
    }

    private static void MapProductEndpoints(this IEndpointRouteBuilder app)
    {
        var products = app.MapGroup("/products");
        products.MapGet("/", async (HttpRequest request, EcommerceService service, CancellationToken ct) => Results.Ok(await service.GetProductsAsync(ParseProductFilters(request), ct)));
        products.MapGet("/categories", async (EcommerceService service, CancellationToken ct) => Results.Ok(await service.GetCategoriesAsync(ct)));
        products.MapGet("/{id:int}", async (int id, EcommerceService service, CancellationToken ct) => Results.Ok(await service.GetProductAsync(id, ct)));
        products.MapPost("/", async ([FromBody] CreateProductDto dto, EcommerceService service, CancellationToken ct) => Results.Created("/products", await service.CreateProductAsync(dto, ct))).RequireAuthorization("Admin");
        products.MapPatch("/{id:int}", async (int id, [FromBody] UpdateProductDto dto, EcommerceService service, CancellationToken ct) => Results.Ok(await service.UpdateProductAsync(id, dto, ct))).RequireAuthorization("Admin");
        products.MapDelete("/{id:int}", async (int id, EcommerceService service, CancellationToken ct) => { await service.DeleteProductAsync(id, ct); return Results.NoContent(); }).RequireAuthorization("Admin");
        products.MapPost("/{id:int}/images", async (int id, [FromBody] CreateProductImagesRequest dto, EcommerceService service, CancellationToken ct) => Results.Created($"/products/{id}/images", await service.AddProductImagesAsync(id, dto.Images, ct))).RequireAuthorization("Admin");
        products.MapPatch("/{productId:int}/images/{imageId:int}", async (int productId, int imageId, [FromBody] UpdateProductImageDto dto, EcommerceService service, CancellationToken ct) => Results.Ok(await service.UpdateProductImageAsync(productId, imageId, dto, ct))).RequireAuthorization("Admin");
        products.MapDelete("/{productId:int}/images/{imageId:int}", async (int productId, int imageId, EcommerceService service, CancellationToken ct) => Results.Ok(await service.DeleteProductImageAsync(productId, imageId, ct))).RequireAuthorization("Admin");
        products.MapPut("/{id:int}/images/reorder", async (int id, [FromBody] ReorderProductImagesDto dto, EcommerceService service, CancellationToken ct) => Results.Ok(await service.ReorderProductImagesAsync(id, dto.ImageIds, ct))).RequireAuthorization("Admin");
        products.MapPost("/bulk", async ([FromBody] BulkCreateProductsDto dto, EcommerceService service, CancellationToken ct) => Results.Created("/products/bulk", await service.BulkCreateProductsAsync(dto, ct))).RequireAuthorization("Admin");
        products.MapPatch("/bulk", async ([FromBody] BulkUpdateProductsDto dto, EcommerceService service, CancellationToken ct) => Results.Ok(await service.BulkUpdateProductsAsync(dto, ct))).RequireAuthorization("Admin");
        products.MapDelete("/bulk", async ([FromBody] BulkDeleteProductsDto dto, EcommerceService service, CancellationToken ct) => Results.Ok(await service.BulkDeleteProductsAsync(dto, ct))).RequireAuthorization("Admin");
        products.MapPost("/{id:int}/statuses", async (int id, [FromBody] AddProductStatusDto dto, EcommerceService service, CancellationToken ct) => Results.Created($"/products/{id}/statuses", await service.AddProductStatusAsync(id, dto.Status, ct))).RequireAuthorization("Admin");
        products.MapDelete("/{productId:int}/statuses/{status}", async (int productId, string status, EcommerceService service, CancellationToken ct) => Results.Ok(await service.RemoveProductStatusAsync(productId, status, ct))).RequireAuthorization("Admin");
    }

    private static void MapManufacturerEndpoints(this IEndpointRouteBuilder app)
    {
        var manufacturers = app.MapGroup("/manufacturers");
        manufacturers.MapGet("/", async (EcommerceService service, CancellationToken ct) => Results.Ok(await service.GetManufacturersAsync(ct)));
        manufacturers.MapGet("/{id:int}", async (int id, EcommerceService service, CancellationToken ct) => Results.Ok(await service.GetManufacturerAsync(id, ct)));
        manufacturers.MapPost("/", async ([FromBody] CreateManufacturerDto dto, EcommerceService service, CancellationToken ct) => Results.Created("/manufacturers", await service.CreateManufacturerAsync(dto, ct))).RequireAuthorization("Admin");
        manufacturers.MapPatch("/{id:int}", async (int id, [FromBody] UpdateManufacturerDto dto, EcommerceService service, CancellationToken ct) => Results.Ok(await service.UpdateManufacturerAsync(id, dto, ct))).RequireAuthorization("Admin");
        manufacturers.MapDelete("/{id:int}", async (int id, EcommerceService service, CancellationToken ct) => { await service.DeleteManufacturerAsync(id, ct); return Results.NoContent(); }).RequireAuthorization("Admin");
    }

    private static void MapPromoEndpoints(this IEndpointRouteBuilder app)
    {
        var promos = app.MapGroup("/promos");
        promos.MapGet("/", async (HttpRequest request, EcommerceService service, CancellationToken ct) => Results.Ok(await service.GetPromosAsync(ParsePromoFilters(request), ct)));
        promos.MapGet("/{id:int}", async (int id, EcommerceService service, CancellationToken ct) => Results.Ok(await service.GetPromoAsync(id, ct)));
        promos.MapPost("/", async ([FromBody] CreatePromoDto dto, EcommerceService service, CancellationToken ct) => Results.Created("/promos", await service.CreatePromoAsync(dto, ct))).RequireAuthorization("Admin");
        promos.MapPatch("/{id:int}", async (int id, [FromBody] UpdatePromoDto dto, EcommerceService service, CancellationToken ct) => Results.Ok(await service.UpdatePromoAsync(id, dto, ct))).RequireAuthorization("Admin");
        promos.MapDelete("/{id:int}", async (int id, EcommerceService service, CancellationToken ct) => { await service.DeletePromoAsync(id, ct); return Results.NoContent(); }).RequireAuthorization("Admin");
    }

    private static ProductFilters ParseProductFilters(HttpRequest request)
    {
        var q = request.Query;
        string[]? categories = null;
        if (q.TryGetValue("categories", out var rawCategories))
        {
            var raw = rawCategories.ToString();
            categories = raw.StartsWith("[") ? JsonSerializer.Deserialize<string[]>(raw) : [raw];
        }

        return new ProductFilters(
            q["search"],
            Decimal(q["min_price"]),
            Decimal(q["max_price"]),
            Int(q["manufacturer_id"]),
            q["country_of_origin"],
            Bool(q["in_stock"]),
            q["status"],
            q["category"],
            categories,
            q["sort_by"].FirstOrDefault() ?? "created_at",
            q["order"].FirstOrDefault() ?? "desc",
            Int(q["page"]) ?? 1,
            Int(q["limit"]) ?? 20);
    }

    private static PromoFilters ParsePromoFilters(HttpRequest request)
    {
        var q = request.Query;
        return new PromoFilters(q["code"], Bool(q["active"]), q["discount_type"], q["sort_by"].FirstOrDefault() ?? "code", q["order"].FirstOrDefault() ?? "asc", Int(q["page"]) ?? 1, Int(q["limit"]) ?? 20);
    }

    private static int? Int(string? value) => int.TryParse(value, out var parsed) ? parsed : null;
    private static decimal? Decimal(string? value) => decimal.TryParse(value, out var parsed) ? parsed : null;
    private static bool? Bool(string? value) => bool.TryParse(value, out var parsed) ? parsed : null;
}

public sealed record CreateProductImagesRequest(IReadOnlyList<CreateProductImageDto> Images);
public sealed record UpdateRoleRequest(string Role);
public sealed record TestTokenRequest(string? Email, string? Role);
