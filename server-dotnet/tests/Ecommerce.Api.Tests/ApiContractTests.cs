using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Ecommerce.Domain.Models;
using Ecommerce.Infrastructure.Data;
using Ecommerce.Infrastructure.Services;
using Ecommerce.Infrastructure.ExternalClients;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Ecommerce.Application.Dtos;
using Ecommerce.Application.Errors;
using Ecommerce.Application.Services;
using Testcontainers.MsSql;

namespace Ecommerce.Api.Tests;

public sealed class EcommerceApiFactory : WebApplicationFactory<Program>
{
    private readonly InMemoryDatabaseRoot _databaseRoot = new();
    private readonly IPaymentGateway? _paymentGateway;

    public EcommerceApiFactory()
    {
    }

    private EcommerceApiFactory(IPaymentGateway paymentGateway)
    {
        _paymentGateway = paymentGateway;
    }

    public EcommerceApiFactory WithPaymentGateway(IPaymentGateway paymentGateway) => new(paymentGateway);

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            foreach (var descriptor in services
                .Where(d => d.ServiceType == typeof(DbContextOptions<EcommerceDbContext>)
                    || d.ServiceType == typeof(DbContextOptions)
                    || d.ServiceType.FullName?.Contains("IDbContextOptionsConfiguration") == true)
                .ToList())
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<EcommerceDbContext>(options => options.UseInMemoryDatabase("ecommerce-tests", _databaseRoot));
            if (_paymentGateway is not null)
            {
                services.RemoveAll<IPaymentGateway>();
                services.AddSingleton(_paymentGateway);
            }

            var provider = services.BuildServiceProvider();
            using var scope = provider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<EcommerceDbContext>();
            db.Database.EnsureCreated();
            Seed(db);
        });
    }

    public void ResetDatabase()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<EcommerceDbContext>();
        db.Database.EnsureDeleted();
        db.Database.EnsureCreated();
        Seed(db);
    }

    private static void Seed(EcommerceDbContext db)
    {
        if (db.Products.Any()) return;

        var manufacturer = new Manufacturer { Name = "Acme PH" };
        var product = new Product
        {
            Name = "Laptop",
            Description = "Gaming laptop",
            BasePrice = 1000,
            CountryOfOrigin = "Philippines",
            StockQuantity = 10,
            Manufacturer = manufacturer,
            Category = "electronics",
            Images = [new ProductImage { Url = "https://example.com/laptop.jpg", IsMain = true, SortOrder = 0 }],
            Statuses = [new ProductStatus { StatusType = "featured" }]
        };
        db.Products.Add(product);
        db.Promos.Add(new Promo { Code = "SAVE10", DiscountType = "percentage", DiscountValue = 10, ActiveUntil = DateTimeOffset.UtcNow.AddDays(7) });
        db.BannerConfigs.Add(new BannerConfig { Title = "Hero", Description = "Welcome", ImageUrl = "https://example.com/banner.jpg" });
        db.SaveChanges();
    }
}

public sealed class ApiContractTests(EcommerceApiFactory factory) : IClassFixture<EcommerceApiFactory>
{
    private HttpClient NewClient(string? token = null)
    {
        factory.ResetDatabase();
        var client = factory.CreateClient();
        if (token is not null)
        {
            client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        }
        return client;
    }

    [Fact]
    public async Task Health_ReturnsOk()
    {
        using var client = NewClient();
        var response = await client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("ok", body.RootElement.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Products_PreservesPagedSnakeCaseContract()
    {
        using var client = NewClient();
        var response = await client.GetAsync("/products?search=laptop&limit=10");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(body.RootElement.TryGetProperty("products", out var products));
        Assert.True(body.RootElement.TryGetProperty("hasMore", out _));
        var product = products[0];
        Assert.Equal("Laptop", product.GetProperty("name").GetString());
        Assert.True(product.TryGetProperty("base_price", out _));
        Assert.True(product.TryGetProperty("stock_quantity", out _));
        Assert.True(product.TryGetProperty("manufacturer_id", out _));
    }

    [Fact]
    public async Task ProtectedCart_RequiresAuthentication()
    {
        using var client = NewClient();
        var response = await client.GetAsync("/carts");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CustomerCart_CanAddItemAndReturnsTotals()
    {
        using var client = NewClient("customer-token");
        var response = await client.PostAsJsonAsync("/carts/items", new { product_id = 1, quantity = 2 });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(body.RootElement.TryGetProperty("items", out var items));
        Assert.Equal(2, items[0].GetProperty("quantity").GetInt32());
        Assert.Equal(2000, body.RootElement.GetProperty("subtotal").GetDecimal());
    }

    [Fact]
    public async Task AdminOnlyProductCreate_ForbidsCustomer()
    {
        using var client = NewClient("customer-token");
        var response = await client.PostAsJsonAsync("/products", new
        {
            name = "Phone",
            base_price = 500,
            stock_quantity = 3
        });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Superadmin_CanCreateProduct()
    {
        using var client = NewClient("superadmin-token");
        var response = await client.PostAsJsonAsync("/products", new
        {
            name = "Phone",
            base_price = 500,
            stock_quantity = 3,
            images = new[] { new { url = "https://example.com/phone.jpg", is_main = true } }
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("Phone", body.RootElement.GetProperty("name").GetString());
        Assert.True(body.RootElement.GetProperty("images")[0].GetProperty("is_main").GetBoolean());
    }

    [Fact]
    public async Task PaymentUnavailable_Returns503()
    {
        using var client = NewClient("customer-token");
        var response = await client.PostAsJsonAsync("/payments/checkout-session", new { order_id = 1 });

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task Auth_InvalidTokensAndMalformedHeaders_AreRejected()
    {
        using var client = NewClient();

        client.DefaultRequestHeaders.Add("Authorization", "Bad user-token");
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/carts")).StatusCode);

        client.DefaultRequestHeaders.Remove("Authorization");
        client.DefaultRequestHeaders.Authorization = new("Bearer", "invalid-token");
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/carts")).StatusCode);
    }

    [Fact]
    public async Task Products_FilterSortCrudImagesStatusesBulk_ReachParity()
    {
        using var client = NewClient("admin-token");

        var list = await client.GetAsync("/products?min_price=500&max_price=1500&manufacturer_id=1&country_of_origin=Philippines&in_stock=true&status=featured&category=electronics&sort_by=name&order=asc&page=1&limit=5");
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);
        using (var body = JsonDocument.Parse(await list.Content.ReadAsStringAsync()))
        {
            Assert.Equal(1, body.RootElement.GetProperty("total").GetInt32());
            Assert.Equal("Laptop", body.RootElement.GetProperty("products")[0].GetProperty("name").GetString());
        }

        var categories = await client.GetFromJsonAsync<string[]>("/products/categories") ?? [];
        Assert.Contains("electronics", categories);

        var create = await client.PostAsJsonAsync("/products", new
        {
            name = "Camera",
            description = "Mirrorless",
            base_price = 450,
            country_of_origin = "Japan",
            stock_quantity = 4,
            manufacturer_id = 1,
            images = new[] { new { url = "https://example.com/camera-1.jpg", is_main = false }, new { url = "https://example.com/camera-2.jpg", is_main = true } }
        });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        using var createdDoc = JsonDocument.Parse(await create.Content.ReadAsStringAsync());
        var productId = createdDoc.RootElement.GetProperty("id").GetInt32();
        Assert.True(createdDoc.RootElement.GetProperty("images")[0].GetProperty("is_main").GetBoolean());

        var patch = await client.PatchAsJsonAsync($"/products/{productId}", new { stock_quantity = 8, base_price = 425 });
        Assert.Equal(HttpStatusCode.OK, patch.StatusCode);

        var addImages = await client.PostAsJsonAsync($"/products/{productId}/images", new { images = new[] { new { url = "https://example.com/camera-3.jpg", is_main = true } } });
        Assert.Equal(HttpStatusCode.Created, addImages.StatusCode);

        var addStatus = await client.PostAsJsonAsync($"/products/{productId}/statuses", new { status = "new" });
        Assert.Equal(HttpStatusCode.Created, addStatus.StatusCode);

        var removeStatus = await client.DeleteAsync($"/products/{productId}/statuses/new");
        Assert.Equal(HttpStatusCode.OK, removeStatus.StatusCode);

        var bulkCreate = await client.PostAsJsonAsync("/products/bulk", new { products = new[] { new { name = "Bulk A", base_price = 10, stock_quantity = 1 }, new { name = "Bulk B", base_price = 20, stock_quantity = 2 } } });
        Assert.Equal(HttpStatusCode.Created, bulkCreate.StatusCode);

        var bulkDelete = await client.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/products/bulk") { Content = JsonContent.Create(new { ids = new[] { productId } }) });
        Assert.Equal(HttpStatusCode.OK, bulkDelete.StatusCode);
    }

    [Fact]
    public async Task Products_ValidationAndNotFound_MatchContract()
    {
        using var client = NewClient("admin-token");

        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/products?page=-1")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/products?limit=101")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/products/999")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/products", new { name = new string('x', 256), base_price = 1, stock_quantity = 1 })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PatchAsJsonAsync("/products/1", new { })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync("/products/999")).StatusCode);
    }
}
