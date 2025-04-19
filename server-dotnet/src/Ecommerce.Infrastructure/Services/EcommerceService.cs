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

    // --- private helpers (partial, more added in later commits) ---

    private IQueryable<Product> ProductQuery() => db.Products.Include(p => p.Images).Include(p => p.Statuses).AsSplitQuery();

    private async Task<Product> FindProductAsync(int id, CancellationToken ct) =>
        await ProductQuery().FirstOrDefaultAsync(p => p.Id == id, ct) ?? throw new ApiException($"Product with id {id} not found", 404);

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
}
