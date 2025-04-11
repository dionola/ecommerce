using System.Text.Json.Serialization;

namespace Ecommerce.Application.Dtos;

public sealed record PromoDto(int Id, string Code, [property: JsonPropertyName("discount_type")] string DiscountType, [property: JsonPropertyName("discount_value")] decimal DiscountValue, [property: JsonPropertyName("active_until")] DateTimeOffset? ActiveUntil);
public sealed record PromoFilters(string? Code, bool? Active, string? DiscountType, string SortBy = "code", string Order = "asc", int Page = 1, int Limit = 20);
public sealed record CreatePromoDto(string Code, [property: JsonPropertyName("discount_type")] string DiscountType, [property: JsonPropertyName("discount_value")] decimal DiscountValue, [property: JsonPropertyName("active_until")] DateTimeOffset? ActiveUntil);
public sealed record UpdatePromoDto(string? Code, [property: JsonPropertyName("discount_type")] string? DiscountType, [property: JsonPropertyName("discount_value")] decimal? DiscountValue, [property: JsonPropertyName("active_until")] DateTimeOffset? ActiveUntil);
