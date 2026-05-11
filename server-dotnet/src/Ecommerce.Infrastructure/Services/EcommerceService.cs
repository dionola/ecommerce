using System.Text.Json;
using Ecommerce.Application.Dtos;
using Ecommerce.Application.Errors;
using Ecommerce.Application.Services;
using Ecommerce.Domain.Models;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services;

public sealed class EcommerceService(
    EcommerceDbContext db,
    IIdentityAdminClient identityAdminClient,
    IPaymentGateway paymentGateway)
{
    public async Task<GetProductsResponseDto> GetProductsAsync(ProductFilters filters, CancellationToken ct)
    {
        ValidatePage(filters.Page, filters.Limit);
        var query = ProductQuery();

        if (!string.IsNullOrWhiteSpace(filters.Search))
        {
            var search = filters.Search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(search) || (p.Description != null && p.Description.ToLower().Contains(search)));
        }

        if (filters.MinPrice is not null) query = query.Where(p => p.BasePrice >= filters.MinPrice);
        if (filters.MaxPrice is not null) query = query.Where(p => p.BasePrice <= filters.MaxPrice);
        if (filters.ManufacturerId is not null) query = query.Where(p => p.ManufacturerId == filters.ManufacturerId);
        if (!string.IsNullOrWhiteSpace(filters.CountryOfOrigin)) query = query.Where(p => p.CountryOfOrigin != null && p.CountryOfOrigin.ToLower() == filters.CountryOfOrigin.ToLower());
        if (filters.InStock is true) query = query.Where(p => p.StockQuantity > 0);
        if (filters.InStock is false) query = query.Where(p => p.StockQuantity == 0);
        if (!string.IsNullOrWhiteSpace(filters.Status)) query = query.Where(p => p.Statuses.Any(s => s.StatusType == filters.Status));

        var categories = filters.Categories is { Length: > 0 } ? filters.Categories : string.IsNullOrWhiteSpace(filters.Category) ? null : [filters.Category];
        if (categories is not null)
        {
            query = query.Where(p => p.Category != null && categories.Contains(p.Category));
        }

        var total = await query.CountAsync(ct);
        query = (filters.SortBy, filters.Order.ToLowerInvariant()) switch
        {
            ("name", "asc") => query.OrderBy(p => p.Name),
            ("name", _) => query.OrderByDescending(p => p.Name),
            ("price", "asc") => query.OrderBy(p => p.BasePrice),
            ("price", _) => query.OrderByDescending(p => p.BasePrice),
            ("created_at", "asc") => query.OrderBy(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.CreatedAt)
        };

        var products = await query.Skip((filters.Page - 1) * filters.Limit).Take(filters.Limit).Select(p => ToProductDto(p)).ToListAsync(ct);
        return new GetProductsResponseDto(products, total, filters.Page, filters.Limit, filters.Page * filters.Limit < total);
    }

    public async Task<ProductDto> GetProductAsync(int id, CancellationToken ct) => ToProductDto(await FindProductAsync(id, ct));

    public async Task<ProductDto> CreateProductAsync(CreateProductDto dto, CancellationToken ct)
    {
        ValidateProduct(dto.Name, dto.BasePrice, dto.StockQuantity);
        var product = new Product
        {
            Name = dto.Name,
            Description = dto.Description,
            BasePrice = dto.BasePrice,
            CountryOfOrigin = dto.CountryOfOrigin,
            StockQuantity = dto.StockQuantity,
            ManufacturerId = dto.ManufacturerId
        };
        db.Products.Add(product);
        await db.SaveChangesAsync(ct);

        foreach (var image in dto.Images ?? [])
        {
            product.Images.Add(new ProductImage { ProductId = product.Id, Url = image.Url, IsMain = image.IsMain, SortOrder = product.Images.Count });
        }
        NormalizeMainImage(product);
        await db.SaveChangesAsync(ct);
        return ToProductDto(await FindProductAsync(product.Id, ct));
    }

    public async Task<ProductDto> UpdateProductAsync(int id, UpdateProductDto dto, CancellationToken ct)
    {
        if (dto.Name is null && dto.Description is null && dto.BasePrice is null && dto.CountryOfOrigin is null && dto.StockQuantity is null && dto.ManufacturerId is null)
            throw new ApiException("At least one field must be provided for update", 400);
        var product = await FindProductAsync(id, ct);
        if (dto.Name is not null) product.Name = dto.Name;
        if (dto.Description is not null) product.Description = dto.Description;
        if (dto.BasePrice is not null) product.BasePrice = dto.BasePrice.Value;
        if (dto.CountryOfOrigin is not null) product.CountryOfOrigin = dto.CountryOfOrigin;
        if (dto.StockQuantity is not null) product.StockQuantity = dto.StockQuantity.Value;
        if (dto.ManufacturerId is not null) product.ManufacturerId = dto.ManufacturerId;
        await db.SaveChangesAsync(ct);
        return ToProductDto(product);
    }

    public async Task DeleteProductAsync(int id, CancellationToken ct)
    {
        var product = await FindProductAsync(id, ct);
        db.Products.Remove(product);
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<string>> GetCategoriesAsync(CancellationToken ct) =>
        await db.Products.Where(p => p.Category != null).Select(p => p.Category!).Distinct().OrderBy(x => x).ToListAsync(ct);

    public async Task<IReadOnlyList<ProductImageDto>> AddProductImagesAsync(int productId, IReadOnlyList<CreateProductImageDto> images, CancellationToken ct)
    {
        if (images.Count == 0) throw new ApiException("At least one image is required", 400);
        var product = await FindProductAsync(productId, ct);
        foreach (var image in images)
        {
            product.Images.Add(new ProductImage { ProductId = productId, Url = image.Url, IsMain = image.IsMain, SortOrder = product.Images.Count });
        }
        NormalizeMainImage(product);
        await db.SaveChangesAsync(ct);
        return ToProductDto(product).Images;
    }

    public async Task<ProductDto> UpdateProductImageAsync(int productId, int imageId, UpdateProductImageDto dto, CancellationToken ct)
    {
        var product = await FindProductAsync(productId, ct);
        var image = product.Images.FirstOrDefault(i => i.Id == imageId) ?? throw new ApiException($"Product image with id {imageId} not found for product {productId}", 404);
        if (dto.Url is null && dto.IsMain is null) throw new ApiException("At least one field must be provided for update", 400);
        if (dto.Url is not null) image.Url = dto.Url;
        if (dto.IsMain is not null) image.IsMain = dto.IsMain.Value;
        NormalizeMainImage(product);
        await db.SaveChangesAsync(ct);
        return ToProductDto(product);
    }

    public async Task<ProductDto> DeleteProductImageAsync(int productId, int imageId, CancellationToken ct)
    {
        var product = await FindProductAsync(productId, ct);
        var image = product.Images.FirstOrDefault(i => i.Id == imageId) ?? throw new ApiException($"Product image with id {imageId} not found for product {productId}", 404);
        product.Images.Remove(image);
        db.ProductImages.Remove(image);
        NormalizeMainImage(product);
        await db.SaveChangesAsync(ct);
        return ToProductDto(product);
    }

    public async Task<ProductDto> ReorderProductImagesAsync(int productId, int[] imageIds, CancellationToken ct)
    {
        var product = await FindProductAsync(productId, ct);
        if (imageIds.Except(product.Images.Select(i => i.Id)).Any()) throw new ApiException("Some image IDs do not belong to this product", 422);
        for (var i = 0; i < imageIds.Length; i++) product.Images.First(x => x.Id == imageIds[i]).SortOrder = i;
        await db.SaveChangesAsync(ct);
        return ToProductDto(product);
    }

    public async Task<ProductDto> AddProductStatusAsync(int productId, string status, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(status)) throw new ApiException("Status cannot be empty", 400);
        var product = await FindProductAsync(productId, ct);
        if (product.Statuses.Any(s => s.StatusType == status)) throw new ApiException($"Product already has status: {status}", 422);
        product.Statuses.Add(new ProductStatus { ProductId = productId, StatusType = status });
        await db.SaveChangesAsync(ct);
        return ToProductDto(product);
    }

    public async Task<ProductDto> RemoveProductStatusAsync(int productId, string status, CancellationToken ct)
    {
        var product = await FindProductAsync(productId, ct);
        var existing = product.Statuses.FirstOrDefault(s => s.StatusType == status) ?? throw new ApiException($"Product does not have status: {status}", 404);
        product.Statuses.Remove(existing);
        db.ProductStatuses.Remove(existing);
        await db.SaveChangesAsync(ct);
        return ToProductDto(product);
    }

    public async Task<object> BulkCreateProductsAsync(BulkCreateProductsDto dto, CancellationToken ct)
    {
        if (dto.Products.Count is < 1 or > 100) throw new ApiException("At least one product is required and maximum is 100", 400);
        var products = new List<ProductDto>();
        foreach (var product in dto.Products) products.Add(await CreateProductAsync(product, ct));
        return new { created = products.Count, products };
    }

    public async Task<object> BulkUpdateProductsAsync(BulkUpdateProductsDto dto, CancellationToken ct)
    {
        if (dto.Updates.Count is < 1 or > 100) throw new ApiException("At least one update is required and maximum is 100", 400);
        var products = new List<ProductDto>();
        foreach (var update in dto.Updates) products.Add(await UpdateProductAsync(update.Id, update.Data, ct));
        return new { updated = products.Count, products };
    }

    public async Task<object> BulkDeleteProductsAsync(BulkDeleteProductsDto dto, CancellationToken ct)
    {
        if (dto.Ids.Length is < 1 or > 100) throw new ApiException("At least one product ID is required and maximum is 100", 400);
        foreach (var id in dto.Ids) await DeleteProductAsync(id, ct);
        return new { deleted = dto.Ids.Length };
    }

    public async Task<IReadOnlyList<ManufacturerDto>> GetManufacturersAsync(CancellationToken ct) =>
        await db.Manufacturers.OrderBy(m => m.Name).Select(m => new ManufacturerDto(m.Id, m.Name)).ToListAsync(ct);

    public async Task<ManufacturerDto> GetManufacturerAsync(int id, CancellationToken ct)
    {
        var item = await db.Manufacturers.FindAsync([id], ct) ?? throw new ApiException($"Manufacturer with id {id} not found", 404);
        return new ManufacturerDto(item.Id, item.Name);
    }

    public async Task<ManufacturerDto> CreateManufacturerAsync(CreateManufacturerDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new ApiException("Name cannot be empty", 400);
        if (await db.Manufacturers.AnyAsync(m => m.Name == dto.Name, ct)) throw new ApiException($"Manufacturer with name \"{dto.Name}\" already exists", 422);
        var item = new Manufacturer { Name = dto.Name };
        db.Manufacturers.Add(item);
        await db.SaveChangesAsync(ct);
        return new ManufacturerDto(item.Id, item.Name);
    }

    public async Task<ManufacturerDto> UpdateManufacturerAsync(int id, UpdateManufacturerDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new ApiException("At least one field must be provided for update", 400);
        var item = await db.Manufacturers.FindAsync([id], ct) ?? throw new ApiException($"Manufacturer with id {id} not found", 404);
        item.Name = dto.Name;
        await db.SaveChangesAsync(ct);
        return new ManufacturerDto(item.Id, item.Name);
    }

    public async Task DeleteManufacturerAsync(int id, CancellationToken ct)
    {
        if (await db.Products.AnyAsync(p => p.ManufacturerId == id, ct)) throw new ApiException("Cannot delete manufacturer because products reference it", 422);
        var item = await db.Manufacturers.FindAsync([id], ct) ?? throw new ApiException($"Manufacturer with id {id} not found", 404);
        db.Manufacturers.Remove(item);
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<PromoDto>> GetPromosAsync(PromoFilters filters, CancellationToken ct)
    {
        ValidatePage(filters.Page, filters.Limit);
        var query = db.Promos.AsQueryable();
        if (!string.IsNullOrWhiteSpace(filters.Code))
        {
            var code = filters.Code.ToLower();
            query = query.Where(p => p.Code.ToLower().Contains(code));
        }
        if (filters.Active is true) query = query.Where(p => p.ActiveUntil == null || p.ActiveUntil > DateTimeOffset.UtcNow);
        if (filters.Active is false) query = query.Where(p => p.ActiveUntil != null && p.ActiveUntil <= DateTimeOffset.UtcNow);
        if (!string.IsNullOrWhiteSpace(filters.DiscountType)) query = query.Where(p => p.DiscountType == filters.DiscountType);
        query = (filters.SortBy, filters.Order.ToLowerInvariant()) switch
        {
            ("discount_value", "desc") => query.OrderByDescending(p => p.DiscountValue),
            ("discount_value", _) => query.OrderBy(p => p.DiscountValue),
            ("active_until", "desc") => query.OrderByDescending(p => p.ActiveUntil),
            ("active_until", _) => query.OrderBy(p => p.ActiveUntil),
            ("code", "desc") => query.OrderByDescending(p => p.Code),
            _ => query.OrderBy(p => p.Code)
        };
        return await query.Skip((filters.Page - 1) * filters.Limit).Take(filters.Limit).Select(p => ToPromoDto(p)).ToListAsync(ct);
    }

    public async Task<PromoDto> GetPromoAsync(int id, CancellationToken ct) => ToPromoDto(await FindPromoAsync(id, ct));

    public async Task<PromoDto> CreatePromoAsync(CreatePromoDto dto, CancellationToken ct)
    {
        ValidatePromo(dto.Code, dto.DiscountType, dto.DiscountValue);
        var promo = new Promo { Code = dto.Code, DiscountType = dto.DiscountType, DiscountValue = dto.DiscountValue, ActiveUntil = dto.ActiveUntil };
        db.Promos.Add(promo);
        await db.SaveChangesAsync(ct);
        return ToPromoDto(promo);
    }

    public async Task<PromoDto> UpdatePromoAsync(int id, UpdatePromoDto dto, CancellationToken ct)
    {
        var promo = await FindPromoAsync(id, ct);
        if (dto.Code is null && dto.DiscountType is null && dto.DiscountValue is null && dto.ActiveUntil is null) throw new ApiException("At least one field must be provided for update", 400);
        if (dto.Code is not null) promo.Code = dto.Code;
        if (dto.DiscountType is not null) promo.DiscountType = dto.DiscountType;
        if (dto.DiscountValue is not null) promo.DiscountValue = dto.DiscountValue.Value;
        if (dto.ActiveUntil is not null) promo.ActiveUntil = dto.ActiveUntil;
        await db.SaveChangesAsync(ct);
        return ToPromoDto(promo);
    }

    public async Task DeletePromoAsync(int id, CancellationToken ct)
    {
        var promo = await FindPromoAsync(id, ct);
        db.Promos.Remove(promo);
        await db.SaveChangesAsync(ct);
    }

    public async Task<CartDto> GetCartAsync(AuthUser user, CancellationToken ct) => ToCartDto(await GetOrCreateCartAsync(user, ct));

    public async Task<CartDto> AddCartItemAsync(AuthUser user, AddCartItemDto dto, CancellationToken ct)
    {
        if (dto.ProductId <= 0 || dto.Quantity <= 0) throw new ApiException("Invalid body schema", 400);
        var cart = await GetOrCreateCartAsync(user, ct);
        var product = await db.Products.FindAsync([dto.ProductId], ct) ?? throw new ApiException($"Product with id {dto.ProductId} not found", 404);
        var item = cart.Items.FirstOrDefault(i => i.ProductId == dto.ProductId);
        var requested = dto.Quantity + (item?.Quantity ?? 0);
        if (product.StockQuantity < requested) throw new ApiException($"Insufficient stock. Available: {product.StockQuantity}, Requested: {requested}", 404);
        if (item is null) cart.Items.Add(new CartItem { CartId = cart.Id, ProductId = product.Id, Quantity = dto.Quantity, Product = product });
        else item.Quantity = requested;
        cart.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return ToCartDto(await LoadCartAsync(cart.Id, ct));
    }

    public async Task<CartDto> UpdateCartItemAsync(AuthUser user, int itemId, UpdateCartItemDto dto, CancellationToken ct)
    {
        if (dto.Quantity <= 0) throw new ApiException("Invalid body schema", 400);
        var dbUser = await GetOrCreateUserAsync(user, ct);
        var item = await db.CartItems.Include(i => i.Product).Include(i => i.Cart).ThenInclude(c => c.Items).ThenInclude(i => i.Product).FirstOrDefaultAsync(i => i.Id == itemId && i.Cart.UserId == dbUser.Id, ct)
            ?? throw new ApiException($"Cart item with id {itemId} not found", 404);
        if (item.Product.StockQuantity < dto.Quantity) throw new ApiException($"Insufficient stock. Available: {item.Product.StockQuantity}, Requested: {dto.Quantity}", 404);
        item.Quantity = dto.Quantity;
        item.Cart.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return ToCartDto(await LoadCartAsync(item.CartId, ct));
    }

    public async Task<CartDto> RemoveCartItemAsync(AuthUser user, int itemId, CancellationToken ct)
    {
        var dbUser = await GetOrCreateUserAsync(user, ct);
        var item = await db.CartItems.Include(i => i.Cart).FirstOrDefaultAsync(i => i.Id == itemId && i.Cart.UserId == dbUser.Id, ct)
            ?? throw new ApiException($"Cart item with id {itemId} not found", 404);
        var cartId = item.CartId;
        db.CartItems.Remove(item);
        item.Cart.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return ToCartDto(await LoadCartAsync(cartId, ct));
    }

    public async Task<CartDto> ClearCartAsync(AuthUser user, CancellationToken ct)
    {
        var cart = await GetOrCreateCartAsync(user, ct);
        db.CartItems.RemoveRange(cart.Items);
        cart.Items.Clear();
        cart.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return ToCartDto(cart);
    }

    public async Task<WishlistDto> GetWishlistAsync(AuthUser user, CancellationToken ct) => ToWishlistDto(await GetOrCreateWishlistAsync(user, ct));

    public async Task<WishlistDto> AddWishlistItemAsync(AuthUser user, AddWishlistItemDto dto, CancellationToken ct)
    {
        var wishlist = await GetOrCreateWishlistAsync(user, ct);
        _ = await db.Products.FindAsync([dto.ProductId], ct) ?? throw new ApiException($"Product with id {dto.ProductId} not found", 404);
        if (wishlist.Items.Any(i => i.ProductId == dto.ProductId)) throw new ApiException("Product already exists in wishlist", 422);
        wishlist.Items.Add(new WishlistItem { WishlistId = wishlist.Id, ProductId = dto.ProductId });
        await db.SaveChangesAsync(ct);
        return ToWishlistDto(await LoadWishlistAsync(wishlist.Id, ct));
    }

    public async Task<WishlistDto> RemoveWishlistItemAsync(AuthUser user, int productId, CancellationToken ct)
    {
        var wishlist = await GetOrCreateWishlistAsync(user, ct);
        var item = wishlist.Items.FirstOrDefault(i => i.ProductId == productId) ?? throw new ApiException($"Product with id {productId} not found in wishlist", 404);
        db.WishlistItems.Remove(item);
        await db.SaveChangesAsync(ct);
        return ToWishlistDto(await LoadWishlistAsync(wishlist.Id, ct));
    }

    public async Task<WishlistDto> ClearWishlistAsync(AuthUser user, CancellationToken ct)
    {
        var wishlist = await GetOrCreateWishlistAsync(user, ct);
        db.WishlistItems.RemoveRange(wishlist.Items);
        await db.SaveChangesAsync(ct);
        return ToWishlistDto(await LoadWishlistAsync(wishlist.Id, ct));
    }

    public async Task<IReadOnlyList<OrderDto>> GetOrdersAsync(AuthUser user, OrderFilters filters, CancellationToken ct)
    {
        ValidatePage(filters.Page, filters.Limit);
        var dbUser = await GetOrCreateUserAsync(user, ct);
        var query = OrderQuery();
        if (!user.IsAdmin || filters.UserId is null) query = query.Where(o => o.UserId == dbUser.Id);
        if (user.IsAdmin && filters.UserId is not null) query = query.Where(o => o.UserId == filters.UserId);
        if (!string.IsNullOrWhiteSpace(filters.Status)) query = query.Where(o => o.Status == filters.Status);
        query = (filters.SortBy, filters.Order.ToLowerInvariant()) switch
        {
            ("total_amount", "asc") => query.OrderBy(o => o.TotalAmount),
            ("total_amount", _) => query.OrderByDescending(o => o.TotalAmount),
            ("status", "asc") => query.OrderBy(o => o.Status),
            ("status", _) => query.OrderByDescending(o => o.Status),
            ("created_at", "asc") => query.OrderBy(o => o.CreatedAt),
            _ => query.OrderByDescending(o => o.CreatedAt)
        };
        return await query.Skip((filters.Page - 1) * filters.Limit).Take(filters.Limit).Select(o => ToOrderDto(o)).ToListAsync(ct);
    }

    public async Task<OrderDto> GetOrderAsync(AuthUser user, int id, CancellationToken ct)
    {
        var dbUser = await GetOrCreateUserAsync(user, ct);
        var order = await OrderQuery().FirstOrDefaultAsync(o => o.Id == id && (user.IsAdmin || o.UserId == dbUser.Id), ct)
            ?? throw new ApiException($"Order with id {id} not found", 404);
        return ToOrderDto(order);
    }

    public async Task<OrderDto> CreateOrderAsync(AuthUser user, CreateOrderDto dto, CancellationToken ct)
    {
        var dbUser = await GetOrCreateUserAsync(user, ct);
        if (db.Database.ProviderName?.Contains("InMemory", StringComparison.OrdinalIgnoreCase) == true)
        {
            return await CreateOrderWithoutExplicitTransactionAsync(dbUser.Id, dto, ct);
        }

        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var result = await CreateOrderWithoutExplicitTransactionAsync(dbUser.Id, dto, ct);
        await transaction.CommitAsync(ct);
        return result;
    }

    private async Task<OrderDto> CreateOrderWithoutExplicitTransactionAsync(int userId, CreateOrderDto dto, CancellationToken ct)
    {
        var cart = await LoadCartByUserIdAsync(userId, ct);
        if (cart.Items.Count == 0) throw new ApiException("Cannot create order from empty cart. Please add items to your cart before checkout.", 422);

        foreach (var item in cart.Items)
        {
            if (item.Product.StockQuantity < item.Quantity) throw new ApiException($"Insufficient stock for product {item.Product.Name}. Available: {item.Product.StockQuantity}, Requested: {item.Quantity}", 422);
        }

        var subtotal = cart.Items.Sum(i => i.Product.BasePrice * i.Quantity);
        var (total, promoId) = await ApplyPromoAsync(subtotal, dto.PromoId, dto.PromoCode, ct);
        var order = new Order { UserId = userId, TotalAmount = total, PromoId = promoId, Status = "pending", ShippingAddressJson = dto.ShippingAddress.GetRawText() };
        db.Orders.Add(order);
        foreach (var item in cart.Items)
        {
            order.Items.Add(new OrderItem { ProductId = item.ProductId, Quantity = item.Quantity, PriceAtPurchase = item.Product.BasePrice });
            item.Product.StockQuantity -= item.Quantity;
        }
        if (total == 0) db.CartItems.RemoveRange(cart.Items);
        await db.SaveChangesAsync(ct);
        return ToOrderDto(await OrderQuery().FirstAsync(o => o.Id == order.Id, ct));
    }

    public async Task<OrderDto> UpdateOrderAsync(AuthUser user, int id, UpdateOrderDto dto, CancellationToken ct)
    {
        if (dto.Status is null && dto.PaymentIntentId is null) throw new ApiException("At least one field must be provided for update", 400);
        var dbUser = await GetOrCreateUserAsync(user, ct);
        var order = await OrderQuery().FirstOrDefaultAsync(o => o.Id == id && (user.IsAdmin || o.UserId == dbUser.Id), ct)
            ?? throw new ApiException($"Order with id {id} not found", 404);
        if (dto.Status is not null) order.Status = dto.Status;
        if (dto.PaymentIntentId is not null) order.PaymentIntentId = dto.PaymentIntentId;
        await db.SaveChangesAsync(ct);
        return ToOrderDto(order);
    }

    public async Task DeleteOrderAsync(int id, CancellationToken ct)
    {
        var order = await db.Orders.FindAsync([id], ct) ?? throw new ApiException($"Order with id {id} not found", 404);
        if (order.Status != "pending") throw new ApiException($"Cannot delete order with status: {order.Status}. Only pending orders can be deleted.", 422);
        db.Orders.Remove(order);
        await db.SaveChangesAsync(ct);
    }

    public async Task<BannerDto> GetBannerAsync(CancellationToken ct)
    {
        var banner = await db.BannerConfigs.OrderBy(b => b.Id).FirstOrDefaultAsync(ct);
        if (banner is not null) return ToBannerDto(banner);
        banner = new BannerConfig
        {
            Title = "Discover thoughtfully sourced essentials",
            Description = "Shop our latest collection with fast checkout and secure payments.",
            ImageUrl = "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
            ButtonText = "Shop now"
        };
        db.BannerConfigs.Add(banner);
        await db.SaveChangesAsync(ct);
        return ToBannerDto(banner);
    }

    public async Task<BannerDto> UpdateBannerAsync(UpdateBannerDto dto, CancellationToken ct)
    {
        var banner = await db.BannerConfigs.OrderBy(b => b.Id).FirstOrDefaultAsync(ct) ?? throw new ApiException("Banner not found", 404);
        if (dto.Title is not null) banner.Title = dto.Title;
        if (dto.Description is not null) banner.Description = dto.Description;
        if (dto.ImageUrl is not null) banner.ImageUrl = dto.ImageUrl;
        if (dto.Category is not null) banner.Category = dto.Category;
        if (dto.ButtonText is not null) banner.ButtonText = dto.ButtonText;
        banner.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return ToBannerDto(banner);
    }

    public async Task<IReadOnlyList<UserListItemDto>> GetUsersAsync(CancellationToken ct) =>
        await db.StoreUsers.Include(u => u.Orders).ThenInclude(o => o.Items)
            .OrderByDescending(u => u.CreatedAt).ThenByDescending(u => u.Id)
            .Select(u => new UserListItemDto(u.Id, u.Email, u.FullName, u.IdentityUserId, u.Role, u.Orders.Count, u.Orders.SelectMany(o => o.Items).Sum(i => i.Quantity), u.CreatedAt.ToString("O")))
            .ToListAsync(ct);

    public async Task<CreateUserResponseDto> CreateUserAsync(AuthUser creator, CreateUserDto dto, CancellationToken ct)
    {
        ValidateRolePermission(creator.HighestRole, dto.Role);
        var created = await identityAdminClient.CreateAdminUserAsync(dto.Email, dto.Password, dto.FullName, dto.Role, ct);
        var user = await GetOrCreateUserAsync(new AuthUser(created.ObjectId, dto.Email, [dto.Role]), ct, dto.FullName);
        user.Role = dto.Role;
        await db.SaveChangesAsync(ct);
        return new CreateUserResponseDto(user.Id, user.Email, user.FullName, user.Role, user.IdentityUserId);
    }

    public async Task<UserListItemDto> UpdateUserRoleAsync(AuthUser creator, int id, string role, CancellationToken ct)
    {
        ValidateRolePermission(creator.HighestRole, role);
        var user = await db.StoreUsers.Include(u => u.Orders).ThenInclude(o => o.Items).FirstOrDefaultAsync(u => u.Id == id, ct) ?? throw new ApiException($"User with id {id} not found", 422);
        user.Role = role;
        await identityAdminClient.SetUserRoleAsync(user.Email, role, ct);
        await db.SaveChangesAsync(ct);
        return new UserListItemDto(user.Id, user.Email, user.FullName, user.IdentityUserId, user.Role, user.Orders.Count, user.Orders.SelectMany(o => o.Items).Sum(i => i.Quantity), user.CreatedAt.ToString("O"));
    }

    public async Task<CheckoutSessionResponseDto> CreateCheckoutSessionAsync(AuthUser user, CreateCheckoutSessionDto dto, string frontendUrl, string currency, CancellationToken ct)
    {
        if (!paymentGateway.IsAvailable) throw new ApiException("Payments are currently unavailable", 503);
        var dbUser = await GetOrCreateUserAsync(user, ct);
        var order = await OrderQuery().FirstOrDefaultAsync(o => o.Id == dto.OrderId, ct) ?? throw new ApiException($"Order with id {dto.OrderId} not found", 404);
        if (!user.IsAdmin && order.UserId != dbUser.Id) throw new ApiException("Forbidden - Order does not belong to user", 403);
        var lineItems = order.Items.Select(i => new CheckoutLineItem(i.Product.Name, (long)Math.Round(i.PriceAtPurchase * 100), i.Quantity, i.Product.Images.OrderByDescending(x => x.IsMain).ThenBy(x => x.SortOrder).FirstOrDefault()?.Url)).ToList();
        if (lineItems.Count == 0) throw new ApiException($"Order {order.Id} has no items for checkout", 500);
        var successUrl = dto.SuccessUrl ?? $"{frontendUrl}/checkout/return?order_id={dto.OrderId}&status=success";
        var cancelUrl = dto.CancelUrl ?? $"{frontendUrl}/checkout?order_id={dto.OrderId}&status=canceled";
        return await paymentGateway.CreateCheckoutSessionAsync(new CreateCheckoutSessionRequest(order.Id, currency, successUrl, cancelUrl, lineItems, new Dictionary<string, string> { ["user_id"] = dbUser.Id.ToString() }), ct);
    }

    public async Task<object> VerifyCheckoutSessionAsync(AuthUser user, string sessionId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(sessionId)) throw new ApiException("Session ID is required", 400);
        if (!paymentGateway.IsAvailable) throw new ApiException("Payments are currently unavailable", 503);
        var result = await paymentGateway.VerifyCheckoutSessionAsync(sessionId, ct);
        if (result.Status is not ("paid" or "complete")) return new { status = "failed", message = $"Payment status is {result.Status}" };
        if (result.OrderId is not null)
        {
            var order = await OrderQuery().FirstOrDefaultAsync(o => o.Id == result.OrderId, ct) ?? throw new ApiException($"Order with id {result.OrderId} not found", 404);
            var dbUser = await GetOrCreateUserAsync(user, ct);
            if (order.UserId != dbUser.Id) throw new ApiException("Forbidden - Order does not belong to user", 403);
            order.Status = "paid";
            if (result.PaymentIntentId is not null) order.PaymentIntentId = result.PaymentIntentId;
            var cart = await LoadCartByUserIdAsync(dbUser.Id, ct);
            db.CartItems.RemoveRange(cart.Items);
            await db.SaveChangesAsync(ct);
        }
        return new { status = "success", orderId = result.OrderId, message = "Payment verified successfully" };
    }

    // --- private helpers ---

    private IQueryable<Product> ProductQuery() => db.Products.Include(p => p.Images).Include(p => p.Statuses).AsSplitQuery();

    private async Task<Product> FindProductAsync(int id, CancellationToken ct) =>
        await ProductQuery().FirstOrDefaultAsync(p => p.Id == id, ct) ?? throw new ApiException($"Product with id {id} not found", 404);

    private async Task<Promo> FindPromoAsync(int id, CancellationToken ct) =>
        await db.Promos.FindAsync([id], ct) ?? throw new ApiException($"Promo with id {id} not found", 404);

    private async Task<User> GetOrCreateUserAsync(AuthUser user, CancellationToken ct, string? fullName = null)
    {
        if (string.IsNullOrWhiteSpace(user.Email)) throw new ApiException("Unauthorized", 401);
        var existing = await db.StoreUsers.FirstOrDefaultAsync(u => u.IdentityUserId == user.Sub || u.Email == user.Email, ct);
        if (existing is not null)
        {
            if (string.IsNullOrWhiteSpace(existing.IdentityUserId)) existing.IdentityUserId = user.Sub;
            if (fullName is not null) existing.FullName = fullName;
            if (existing.Role == "customer" && user.HighestRole is "admin" or "superadmin") existing.Role = user.HighestRole;
            await db.SaveChangesAsync(ct);
            return existing;
        }
        var created = new User { IdentityUserId = user.Sub, Email = user.Email, FullName = fullName, Role = user.HighestRole ?? "customer" };
        db.StoreUsers.Add(created);
        await db.SaveChangesAsync(ct);
        return created;
    }

    private async Task<Cart> GetOrCreateCartAsync(AuthUser user, CancellationToken ct)
    {
        var dbUser = await GetOrCreateUserAsync(user, ct);
        var cart = await db.Carts.Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images).Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Statuses).FirstOrDefaultAsync(c => c.UserId == dbUser.Id, ct);
        if (cart is not null) return cart;
        cart = new Cart { UserId = dbUser.Id };
        db.Carts.Add(cart);
        await db.SaveChangesAsync(ct);
        return await LoadCartAsync(cart.Id, ct);
    }

    private async Task<Cart> LoadCartAsync(int cartId, CancellationToken ct) =>
        await db.Carts.Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images).Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Statuses).FirstAsync(c => c.Id == cartId, ct);

    private async Task<Wishlist> GetOrCreateWishlistAsync(AuthUser user, CancellationToken ct)
    {
        var dbUser = await GetOrCreateUserAsync(user, ct);
        var wishlist = await db.Wishlists.Include(w => w.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images).Include(w => w.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Statuses).FirstOrDefaultAsync(w => w.UserId == dbUser.Id, ct);
        if (wishlist is not null) return wishlist;
        wishlist = new Wishlist { UserId = dbUser.Id };
        db.Wishlists.Add(wishlist);
        await db.SaveChangesAsync(ct);
        return await LoadWishlistAsync(wishlist.Id, ct);
    }

    private async Task<Wishlist> LoadWishlistAsync(int id, CancellationToken ct) =>
        await db.Wishlists.Include(w => w.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images).Include(w => w.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Statuses).FirstAsync(w => w.Id == id, ct);

    private IQueryable<Order> OrderQuery() => db.Orders.Include(o => o.Promo).Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images).Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Statuses).AsSplitQuery();

    private async Task<Cart> LoadCartByUserIdAsync(int userId, CancellationToken ct) =>
        await GetOrCreateCartAsync(new AuthUser((await db.StoreUsers.FindAsync([userId], ct))!.IdentityUserId, (await db.StoreUsers.FindAsync([userId], ct))!.Email, []), ct);

    private async Task<(decimal Total, int? PromoId)> ApplyPromoAsync(decimal subtotal, int? promoId, string? promoCode, CancellationToken ct)
    {
        Promo? promo = null;
        if (!string.IsNullOrWhiteSpace(promoCode)) promo = await db.Promos.FirstOrDefaultAsync(p => p.Code == promoCode, ct) ?? throw new ApiException($"Promo code \"{promoCode}\" not found", 404);
        else if (promoId is not null) promo = await FindPromoAsync(promoId.Value, ct);
        if (promo is null) return (subtotal, null);
        if (promo.ActiveUntil is not null && promo.ActiveUntil <= DateTimeOffset.UtcNow) throw new ApiException("Promo code has expired", 422);
        var discount = promo.DiscountType == "percentage" ? subtotal * (promo.DiscountValue / 100m) : promo.DiscountValue;
        return (Math.Max(0, subtotal - discount), promo.Id);
    }

    private static OrderDto ToOrderDto(Order o) => new(o.Id, o.UserId, o.TotalAmount, o.Status, o.PromoId, o.Promo is null ? null : new OrderPromoDto(o.Promo.Id, o.Promo.Code, o.Promo.DiscountType, o.Promo.DiscountValue), o.PaymentIntentId, string.IsNullOrWhiteSpace(o.ShippingAddressJson) ? null : JsonSerializer.Deserialize<JsonElement>(o.ShippingAddressJson), o.CreatedAt, o.Items.Select(i => new OrderItemDto(i.Id, ToProductDto(i.Product), i.Quantity, i.PriceAtPurchase)).ToList());

    private static BannerDto ToBannerDto(BannerConfig b) => new(b.Id, b.Title, b.Description, b.ImageUrl, b.Category, b.ButtonText, b.CreatedAt, b.UpdatedAt);

    private static void ValidateRolePermission(string? creatorRole, string requestedRole)
    {
        if (requestedRole is not ("admin" or "superadmin")) throw new ApiException("Role must be 'admin' or 'superadmin'", 400);
        if (creatorRole is null) throw new ApiException("Creator role not found in token", 422);
        if (creatorRole == "admin" && requestedRole == "superadmin") throw new ApiException("Admins can only create admin users. Superadmin role required to create superadmin users.", 422);
        if (creatorRole is not ("admin" or "superadmin")) throw new ApiException($"Insufficient permissions to create {requestedRole} user", 422);
    }

    private static ProductDto ToProductDto(Product p) => new(p.Id, p.Name, p.Description, p.BasePrice, p.CountryOfOrigin, p.StockQuantity, p.ManufacturerId, p.Images.OrderByDescending(i => i.IsMain).ThenBy(i => i.SortOrder).ThenBy(i => i.Id).Select(i => new ProductImageDto(i.Id, i.Url, i.IsMain)).ToList(), p.Statuses.Select(s => s.StatusType).Distinct().OrderBy(s => s).ToList());

    private static void NormalizeMainImage(Product product)
    {
        if (product.Images.Count == 0) return;
        var main = product.Images.OrderByDescending(i => i.IsMain).ThenBy(i => i.SortOrder).ThenBy(i => i.Id).First();
        foreach (var image in product.Images) image.IsMain = ReferenceEquals(image, main);
    }

    private static void ValidatePage(int page, int limit)
    {
        if (page <= 0 || limit <= 0 || limit > 100) throw new ApiException("Invalid query schema", 400);
    }

    private static void ValidateProduct(string name, decimal price, int stock)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length > 255 || price < 0 || stock < 0) throw new ApiException("Invalid body schema", 400);
    }

    private static void ValidatePromo(string code, string type, decimal value)
    {
        if (string.IsNullOrWhiteSpace(code) || code.Length > 50 || type is not ("percentage" or "fixed") || value <= 0) throw new ApiException("Invalid body schema", 400);
    }

    private static PromoDto ToPromoDto(Promo p) => new(p.Id, p.Code, p.DiscountType, p.DiscountValue, p.ActiveUntil);

    private static CartDto ToCartDto(Cart c)
    {
        var items = c.Items.Select(i => new CartItemDto(i.Id, ToProductDto(i.Product), i.Quantity)).ToList();
        var subtotal = items.Sum(i => i.Product.BasePrice * i.Quantity);
        return new CartDto(c.Id, c.UserId, c.UpdatedAt, items, subtotal, subtotal);
    }

    private static WishlistDto ToWishlistDto(Wishlist w) =>
        new(w.Id, w.UserId, w.Items.Select(i => new WishlistItemDto(ToProductDto(i.Product))).ToList());
}
