using System.Text.Json.Serialization;

namespace Ecommerce.Application.Dtos;

public sealed record ProductImageDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("url")] string Url,
    [property: JsonPropertyName("is_main")] bool IsMain);

public sealed record ProductDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("base_price")] decimal BasePrice,
    [property: JsonPropertyName("country_of_origin")] string? CountryOfOrigin,
    [property: JsonPropertyName("stock_quantity")] int StockQuantity,
    [property: JsonPropertyName("manufacturer_id")] int? ManufacturerId,
    [property: JsonPropertyName("images")] IReadOnlyList<ProductImageDto> Images,
    [property: JsonPropertyName("statuses")] IReadOnlyList<string> Statuses);

public sealed record GetProductsResponseDto(
    [property: JsonPropertyName("products")] IReadOnlyList<ProductDto> Products,
    [property: JsonPropertyName("total")] int Total,
    [property: JsonPropertyName("page")] int Page,
    [property: JsonPropertyName("limit")] int Limit,
    [property: JsonPropertyName("hasMore")] bool HasMore);

public sealed record ProductFilters(string? Search, decimal? MinPrice, decimal? MaxPrice, int? ManufacturerId, string? CountryOfOrigin, bool? InStock, string? Status, string? Category, string[]? Categories, string SortBy = "created_at", string Order = "desc", int Page = 1, int Limit = 20);
public sealed record CreateProductDto(string Name, string? Description, decimal BasePrice, string? CountryOfOrigin, int StockQuantity, int? ManufacturerId, IReadOnlyList<CreateProductImageDto>? Images);
public sealed record UpdateProductDto(string? Name, string? Description, decimal? BasePrice, string? CountryOfOrigin, int? StockQuantity, int? ManufacturerId);
public sealed record CreateProductImageDto(string Url, bool IsMain);
public sealed record UpdateProductImageDto(string? Url, bool? IsMain);
public sealed record ReorderProductImagesDto([property: JsonPropertyName("imageIds")] int[] ImageIds);
public sealed record AddProductStatusDto(string Status);
public sealed record BulkCreateProductsDto(IReadOnlyList<CreateProductDto> Products);
public sealed record BulkUpdateProductsDto(IReadOnlyList<BulkUpdateProductItemDto> Updates);
public sealed record BulkUpdateProductItemDto(int Id, UpdateProductDto Data);
public sealed record BulkDeleteProductsDto(int[] Ids);
