using System.Text.Json.Serialization;

namespace Ecommerce.Application.Dtos;

public sealed record BannerDto(int Id, string Title, string Description, [property: JsonPropertyName("image_url")] string ImageUrl, string? Category, [property: JsonPropertyName("button_text")] string? ButtonText, [property: JsonPropertyName("created_at")] DateTimeOffset CreatedAt, [property: JsonPropertyName("updated_at")] DateTimeOffset UpdatedAt);
public sealed record UpdateBannerDto(string? Title, string? Description, [property: JsonPropertyName("image_url")] string? ImageUrl, string? Category, [property: JsonPropertyName("button_text")] string? ButtonText);
