using System.Text.Json.Serialization;

namespace Ecommerce.Application.Dtos;

public sealed record WishlistItemDto(ProductDto Product);
public sealed record WishlistDto(int Id, [property: JsonPropertyName("user_id")] int UserId, IReadOnlyList<WishlistItemDto> Items);
public sealed record AddWishlistItemDto([property: JsonPropertyName("product_id")] int ProductId);
