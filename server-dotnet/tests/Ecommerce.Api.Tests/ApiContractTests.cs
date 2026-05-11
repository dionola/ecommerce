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

    [Fact]
    public async Task Carts_CoverMergeUpdateRemoveClearAndStockFailures()
    {
        using var client = NewClient("customer-token");

        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/carts/items", new { product_id = 1, quantity = 2 })).StatusCode);
        var merge = await client.PostAsJsonAsync("/carts/items", new { product_id = 1, quantity = 3 });
        Assert.Equal(HttpStatusCode.Created, merge.StatusCode);
        using var mergeBody = JsonDocument.Parse(await merge.Content.ReadAsStringAsync());
        var itemId = mergeBody.RootElement.GetProperty("items")[0].GetProperty("id").GetInt32();
        Assert.Equal(5, mergeBody.RootElement.GetProperty("items")[0].GetProperty("quantity").GetInt32());

        Assert.Equal(HttpStatusCode.OK, (await client.PatchAsJsonAsync($"/carts/items/{itemId}", new { quantity = 1 })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.DeleteAsync($"/carts/items/{itemId}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.DeleteAsync("/carts/clear")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsJsonAsync("/carts/items", new { product_id = 999, quantity = 1 })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsJsonAsync("/carts/items", new { product_id = 1, quantity = 999 })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PatchAsJsonAsync("/carts/items/999", new { quantity = 1 })).StatusCode);
    }

    [Fact]
    public async Task Wishlists_CoverDuplicateMissingRemoveAndClear()
    {
        using var client = NewClient("customer-token");

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/wishlists")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/wishlists/items", new { product_id = 1 })).StatusCode);
        Assert.Equal((HttpStatusCode)422, (await client.PostAsJsonAsync("/wishlists/items", new { product_id = 1 })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsJsonAsync("/wishlists/items", new { product_id = 999 })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.DeleteAsync("/wishlists/items/1")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync("/wishlists/items/1")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.DeleteAsync("/wishlists/clear")).StatusCode);
    }

    [Fact]
    public async Task Promos_Manufacturers_BannerAndUsers_CoverAdminParity()
    {
        using var admin = factory.CreateClient();
        admin.DefaultRequestHeaders.Authorization = new("Bearer", "admin-token");
        using var superadmin = NewClient("superadmin-token");

        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/promos?active=true&discount_type=percentage&page=1&limit=20")).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await admin.PostAsJsonAsync("/promos", new { code = "FIXED50", discount_type = "fixed", discount_value = 50, active_until = DateTimeOffset.UtcNow.AddDays(1) })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/promos", new { code = new string('x', 51), discount_type = "fixed", discount_value = 50 })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PatchAsJsonAsync("/promos/1", new { })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync("/promos/999")).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/manufacturers")).StatusCode);
        var createdManufacturer = await admin.PostAsJsonAsync("/manufacturers", new { name = "Globex" });
        Assert.Equal(HttpStatusCode.Created, createdManufacturer.StatusCode);
        using var manufacturerDoc = JsonDocument.Parse(await createdManufacturer.Content.ReadAsStringAsync());
        var manufacturerId = manufacturerDoc.RootElement.GetProperty("id").GetInt32();
        Assert.Equal(HttpStatusCode.OK, (await admin.PatchAsJsonAsync($"/manufacturers/{manufacturerId}", new { name = "Globex PH" })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await admin.DeleteAsync($"/manufacturers/{manufacturerId}")).StatusCode);
        Assert.Equal((HttpStatusCode)422, (await admin.DeleteAsync("/manufacturers/1")).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/banner")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.PatchAsJsonAsync("/banner", new { title = "Updated hero", button_text = "Shop" })).StatusCode);

        Assert.Equal((HttpStatusCode)422, (await admin.PostAsJsonAsync("/users", new { email = "boss@example.com", password = "Password1!", role = "superadmin" })).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await superadmin.PostAsJsonAsync("/users", new { email = "admin2@example.com", password = "Password1!", role = "admin", fullName = "Admin Two" })).StatusCode);
        using (var scope = factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationIdentityUser>>();
            var identityUser = await userManager.FindByEmailAsync("admin2@example.com");
            Assert.NotNull(identityUser);
            Assert.Contains("admin", await userManager.GetRolesAsync(identityUser));
        }
        Assert.Equal(HttpStatusCode.OK, (await superadmin.GetAsync("/users")).StatusCode);
    }

    [Fact]
    public async Task Orders_CreatePromoOwnershipUpdateAndPendingDelete()
    {
        using var customer = NewClient("customer-token");
        Assert.Equal(HttpStatusCode.Created, (await customer.PostAsJsonAsync("/carts/items", new { product_id = 1, quantity = 2 })).StatusCode);

        var create = await customer.PostAsJsonAsync("/orders", new
        {
            shipping_address = new { street = "123 Main", city = "Manila" },
            promo_code = "SAVE10"
        });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        using var orderDoc = JsonDocument.Parse(await create.Content.ReadAsStringAsync());
        var orderId = orderDoc.RootElement.GetProperty("id").GetInt32();
        Assert.Equal(1800, orderDoc.RootElement.GetProperty("total_amount").GetDecimal());

        Assert.Equal(HttpStatusCode.OK, (await customer.GetAsync("/orders")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await customer.GetAsync($"/orders/{orderId}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await customer.PatchAsJsonAsync($"/orders/{orderId}", new { status = "processing" })).StatusCode);

        using var admin = factory.CreateClient();
        admin.DefaultRequestHeaders.Authorization = new("Bearer", "admin-token");
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/orders")).StatusCode);
        Assert.Equal((HttpStatusCode)422, (await admin.DeleteAsync($"/orders/{orderId}")).StatusCode);

        Assert.Equal(HttpStatusCode.Created, (await customer.PostAsJsonAsync("/carts/items", new { product_id = 1, quantity = 1 })).StatusCode);
        var second = await customer.PostAsJsonAsync("/orders", new { shipping_address = new { street = "123 Main" } });
        using var secondDoc = JsonDocument.Parse(await second.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.NoContent, (await admin.DeleteAsync($"/orders/{secondDoc.RootElement.GetProperty("id").GetInt32()}")).StatusCode);
    }

    [Fact]
    public async Task Payments_CreateVerifyFailureSuccessAndWrongUser()
    {
        var fakeGateway = new FakePaymentGateway();
        await using var paymentFactory = factory.WithPaymentGateway(fakeGateway);
        using var client = paymentFactory.CreateClient();
        paymentFactory.ResetDatabase();
        client.DefaultRequestHeaders.Authorization = new("Bearer", "customer-token");

        await client.PostAsJsonAsync("/carts/items", new { product_id = 1, quantity = 1 });
        var orderResponse = await client.PostAsJsonAsync("/orders", new { shipping_address = new { street = "123 Main" } });
        using var orderDoc = JsonDocument.Parse(await orderResponse.Content.ReadAsStringAsync());
        var orderId = orderDoc.RootElement.GetProperty("id").GetInt32();

        var checkout = await client.PostAsJsonAsync("/payments/checkout-session", new { order_id = orderId });
        Assert.Equal(HttpStatusCode.Created, checkout.StatusCode);
        using var checkoutDoc = JsonDocument.Parse(await checkout.Content.ReadAsStringAsync());
        Assert.Equal("https://checkout.example/session", checkoutDoc.RootElement.GetProperty("checkout_url").GetString());

        fakeGateway.VerifiedStatus = "open";
        var failed = await client.GetAsync("/payments/checkout-session/cs_test/verify");
        Assert.Equal(HttpStatusCode.OK, failed.StatusCode);
        using (var failedDoc = JsonDocument.Parse(await failed.Content.ReadAsStringAsync()))
        {
            Assert.Equal("failed", failedDoc.RootElement.GetProperty("status").GetString());
        }

        fakeGateway.VerifiedStatus = "paid";
        fakeGateway.VerifiedOrderId = orderId;
        fakeGateway.PaymentIntentId = "pi_test";
        var success = await client.GetAsync("/payments/checkout-session/cs_test/verify");
        Assert.Equal(HttpStatusCode.OK, success.StatusCode);
        using (var successDoc = JsonDocument.Parse(await success.Content.ReadAsStringAsync()))
        {
            Assert.Equal("success", successDoc.RootElement.GetProperty("status").GetString());
        }

        using var otherClient = paymentFactory.CreateClient();
        otherClient.DefaultRequestHeaders.Authorization = new("Bearer", "other-customer-token");
        fakeGateway.VerifiedOrderId = orderId;
        Assert.Equal(HttpStatusCode.Forbidden, (await otherClient.GetAsync("/payments/checkout-session/cs_test/verify")).StatusCode);
    }

    [Fact]
    public async Task TestTokenHelper_IsAvailableOutsideProduction()
    {
        using var client = NewClient();
        var response = await client.PostAsJsonAsync("/test-token", new { email = "admin@example.com", role = "admin" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("admin-token", body.RootElement.GetProperty("token").GetString());
    }

    [Fact]
    public async Task SqlServerMigrations_ApplyCleanly_WhenDockerIsAvailable()
    {
        if (!DockerIsAvailable())
        {
            return;
        }

        await using var container = new MsSqlBuilder("mcr.microsoft.com/mssql/server:2022-latest")
            .WithPassword("yourStrong(!)Password")
            .Build();

        await container.StartAsync();
        var options = new DbContextOptionsBuilder<EcommerceDbContext>()
            .UseSqlServer(container.GetConnectionString())
            .Options;

        await using var db = new EcommerceDbContext(options);
        await db.Database.MigrateAsync();

        Assert.True(await db.Database.CanConnectAsync());
        Assert.Contains("products", db.Model.GetEntityTypes().Select(t => t.GetTableName()));
    }

    private static bool DockerIsAvailable()
    {
        try
        {
            using var process = new System.Diagnostics.Process();
            process.StartInfo.FileName = "docker";
            process.StartInfo.ArgumentList.Add("info");
            process.StartInfo.RedirectStandardOutput = true;
            process.StartInfo.RedirectStandardError = true;
            process.StartInfo.UseShellExecute = false;
            process.Start();
            return process.WaitForExit(3000) && process.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }
}

public sealed class FakePaymentGateway : IPaymentGateway
{
    public bool IsAvailable { get; set; } = true;
    public string VerifiedStatus { get; set; } = "paid";
    public int? VerifiedOrderId { get; set; }
    public string? PaymentIntentId { get; set; }

    public Task<CheckoutSessionResponseDto> CreateCheckoutSessionAsync(CreateCheckoutSessionRequest request, CancellationToken cancellationToken)
    {
        VerifiedOrderId = request.OrderId;
        return Task.FromResult(new CheckoutSessionResponseDto("https://checkout.example/session", "cs_test"));
    }

    public Task<VerifiedCheckoutSession> VerifyCheckoutSessionAsync(string sessionId, CancellationToken cancellationToken) =>
        Task.FromResult(new VerifiedCheckoutSession(VerifiedStatus, VerifiedOrderId, PaymentIntentId));
}
