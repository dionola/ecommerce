using System.Text.Json.Serialization;

namespace Ecommerce.Application.Dtos;

public sealed record CartItemDto(int Id, ProductDto Product, int Quantity);
public sealed record CartDto(int Id, [property: JsonPropertyName("user_id")] int UserId, [property: JsonPropertyName("updated_at")] DateTimeOffset UpdatedAt, IReadOnlyList<CartItemDto> Items, decimal Subtotal, decimal Total);
public sealed record AddCartItemDto([property: JsonPropertyName("product_id")] int ProductId, int Quantity = 1);
public sealed record UpdateCartItemDto(int Quantity);
